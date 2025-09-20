import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SummariesConfig } from '../config/summaries.config';
import { RateLimiterService } from './rate-limiter.service';
import { EmbeddingsService } from '../../embeddings/embeddings.service';
import {
  GeneratedSummary,
  ProcessedMessage,
  RagContext,
  ActionAssignee,
} from '../interfaces/summaries.interfaces';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    private readonly rateLimiter: RateLimiterService,
    private readonly embeddingsService: EmbeddingsService,
  ) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.genAI = new GoogleGenerativeAI(key);
  }

  /**
   * Generates summary and actions using Google Gemini AI
   */
  async generateSummaryAndActions(
    previousSummary: string | null,
    retrievedContext: RagContext[],
    newMessages: ProcessedMessage[],
    currentUserId?: string,
  ): Promise<GeneratedSummary> {
    const prompt = this.buildPrompt(
      previousSummary,
      retrievedContext,
      newMessages,
      currentUserId,
    );

    await this.rateLimiter.enforceRateLimit();

    const model = this.genAI.getGenerativeModel({
      model: SummariesConfig.DEFAULT_MODEL,
      generationConfig: { temperature: SummariesConfig.AI_TEMPERATURE },
    });

    let retryCount = 0;
    const maxRetries = SummariesConfig.MAX_RETRIES;

    while (retryCount <= maxRetries) {
      try {
        const result = await model.generateContent(prompt);
        const text = (await result.response.text())?.trim();

        const parsedResult = this.parseAiResponse(text);
        return parsedResult;
      } catch (error: any) {
        if (this.isRateLimitError(error)) {
          retryCount++;
          if (retryCount > maxRetries) {
            this.logger.error(
              `Max retries exceeded. Last error: ${error.message}`,
            );
            throw new Error(
              `Rate limit exceeded after ${maxRetries} retries. Please wait before trying again.`,
            );
          }

          const retryDelay =
            this.rateLimiter.extractRetryDelay(error.message) ||
            this.rateLimiter.calculateBackoffDelay(retryCount);

          this.logger.log(
            `Rate limit hit. Retrying in ${retryDelay}ms (attempt ${retryCount}/${maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        } else {
          throw error;
        }
      }
    }

    throw new Error('Failed to generate summary after all attempts');
  }

  /**
   * Builds the prompt for the AI model
   */
  private buildPrompt(
    previousSummary: string | null,
    retrieved: RagContext[],
    newMessages: ProcessedMessage[],
    currentUserId?: string,
  ): string {
    const prev = previousSummary
      ? `Previous summary:\n${previousSummary}\n\n`
      : '';

    const retrievedText = retrieved?.length
      ? `Relevant context (from past messages):\n${retrieved
          .map((r, i) => `${i + 1}. ${r.text}`)
          .join('\n')}\n\n`
      : '';

    const newText = `New messages:\n${newMessages
      .map((m, i) => `${i + 1}. ${m.senderName}: ${m.text}`)
      .join('\n')}\n\n`;

    const currentUserContext = currentUserId
      ? `\nCurrent user ID: ${currentUserId} (use this to determine if actions are assigned to the current user)`
      : '';

    const instructions = `You are ConvoVerse assistant (Timezone: ${SummariesConfig.TIMEZONE}). Analyze the conversation and produce two outputs:
1) "summary": a concise cumulative summary (3-6 sentences) that merges previous summary + new messages.
2) "actions": an array of action items extracted from the conversation.

For actions, extract:
- Tasks, meetings, deadlines, reminders, follow-ups, decisions
- Determine importance: "urgent" (critical/immediate), "high" (important soon), "medium" (moderate priority), "low" (nice to have)
- Identify type: "task", "meeting", "deadline", "reminder", "follow_up", "decision", "other"
- Extract assignees with their roles and names from the conversation
- Set due dates from context (use ISO8601 format)
- Mark if assigned to current user${currentUserContext}

Return JSON: {
  "summary": string,
  "actions": [{
    "title": string,
    "description": string,
    "type": "task|meeting|deadline|reminder|follow_up|decision|other",
    "importance": "urgent|high|medium|low",
    "assignees": [{"userId": string, "userName": string, "role": "owner|collaborator|reviewer|informed", "isCurrentUser": boolean}],
    "due_date": string|null,
    "status": "pending",
    "context": string,
    "isAssignedToMe": boolean,
    "tags": [string]
  }]
}
Respond only with valid JSON.`;

    return `${instructions}\n\n${prev}${retrievedText}${newText}`;
  }

  /**
   * Parses AI response and extracts JSON
   */
  private parseAiResponse(text: string): GeneratedSummary {
    try {
      const json = this.extractJson(text);
      return {
        summary: json.summary,
        actions: json.actions ?? [],
      };
    } catch (err) {
      this.logger.error('Failed to parse JSON from model output', text);
      throw new Error('Failed to parse JSON from model response');
    }
  }

  /**
   * Extracts JSON from AI response text
   */
  private extractJson(text: string): any {
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first === -1 || last === -1) {
      throw new Error('No JSON found in AI response');
    }
    const raw = text.substring(first, last + 1);
    return JSON.parse(raw);
  }

  /**
   * Checks if error is a rate limit error
   */
  private isRateLimitError(error: any): boolean {
    return (
      error?.message?.includes('429') ||
      error?.message?.includes('Too Many Requests')
    );
  }

  /**
   * Generate text using the AI model for assistant queries
   */
  async generateText(
    messages: { role: 'system' | 'user'; content: string }[],
    options?: { temperature?: number; max_tokens?: number },
  ): Promise<string> {
    await this.rateLimiter.enforceRateLimit();

    const model = this.genAI.getGenerativeModel({
      model: SummariesConfig.DEFAULT_MODEL,
      generationConfig: {
        temperature: options?.temperature || SummariesConfig.AI_TEMPERATURE,
        maxOutputTokens: options?.max_tokens || 1500,
      },
    });

    // Convert messages format to a single prompt
    const prompt = messages
      .map((m) => `${m.role === 'system' ? 'SYSTEM: ' : 'USER: '}${m.content}`)
      .join('\n\n');

    try {
      const result = await model.generateContent(prompt);
      return (await result.response.text())?.trim() || '';
    } catch (error) {
      this.logger.error('Error generating text:', error);
      throw new Error('Failed to generate text response');
    }
  }

  /**
   * Generate embeddings for text using the EmbeddingsService
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const embedding = await this.embeddingsService.generateEmbedding(text);
      return embedding;
    } catch (error) {
      this.logger.error('Error generating embedding:', error);
      return null;
    }
  }
}
