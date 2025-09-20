import { Injectable, Logger } from '@nestjs/common';
import { VectorSearchService, SearchOptions } from './vector-search.service';
import {
  ContextBuilderService,
  BuildContextOptions,
} from './context-builder.service';
import { ConversationMemoryService } from './conversation-memory.service';
import { SecurityService } from './security.service';
import { AiService } from '../../summaries/services/ai.service';
import { AssistantResponseDto } from '../dto/assistant.dto';
import {
  ASSISTANT_CONFIG,
  ASSISTANT_PROMPTS,
} from '../config/assistant.config';

export interface QueryAnalysis {
  intent: string;
  entities: string[];
  timeFrame: {
    type: 'recent' | 'specific' | 'all';
    start?: Date;
    end?: Date;
  };
  scope: {
    conversationId?: string;
    userId?: string;
    global?: boolean;
  };
  queryType: 'question' | 'search' | 'action' | 'summary';
  confidence: number;
}

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);

  constructor(
    private readonly vectorSearchService: VectorSearchService,
    private readonly contextBuilderService: ContextBuilderService,
    private readonly conversationMemory: ConversationMemoryService,
    private readonly securityService: SecurityService,
    private readonly aiService: AiService,
  ) {}

  async askAssistant(request: {
    query: string;
    userId: string;
    sessionId?: string;
  }): Promise<AssistantResponseDto> {
    try {
      // SECURITY: Check for prompt injection attacks FIRST
      const securityCheck = this.securityService.checkQuery(request.query);
      if (securityCheck.isBlocked) {
        this.logger.warn(
          `Security: Blocked malicious query from user ${request.userId}`,
          {
            riskLevel: securityCheck.riskLevel,
            detectedAttacks: securityCheck.detectedAttacks,
          },
        );

        return {
          answer: this.securityService.generateSecurityResponse(),
          sources: [],
          confidence: 1.0, // High confidence in security response
          reasoning: 'Query blocked for security reasons',
        };
      }

      // Get or create conversation session
      const session = this.conversationMemory.getOrCreateSession(
        request.userId,
        request.sessionId,
      );

      this.logger.debug(
        `Processing query: "${request.query}" for user: ${request.userId} in session: ${session.sessionId}`,
      );

      // Validate query length
      if (request.query.length > ASSISTANT_CONFIG.MAX_QUERY_LENGTH) {
        throw new Error(
          `Query too long. Maximum length is ${ASSISTANT_CONFIG.MAX_QUERY_LENGTH} characters.`,
        );
      }

      // Add user query to conversation history
      this.conversationMemory.addUserTurn(session.sessionId, request.query);

      // Get conversation context
      const conversationHistory =
        this.conversationMemory.getConversationHistory(session.sessionId, 5);

      // Check if this is a greeting or casual conversation (but not if we have context)
      if (
        this.isGreetingOrCasual(request.query) &&
        conversationHistory.length === 1
      ) {
        const response = await this.generateConversationalResponse(
          request.query,
          request.userId,
        );
        this.conversationMemory.addAssistantTurn(
          session.sessionId,
          response.answer,
          [],
          { greeting: true },
        );
        return { ...response, sessionId: session.sessionId };
      }

      // Enhance query with conversation context
      const enhancedQuery = this.conversationMemory.buildEnhancedQuery(
        session.sessionId,
        request.query,
      );

      // Create enhanced request with context
      const enhancedRequest = { ...request, query: enhancedQuery };

      // Analyze the enhanced query to understand intent and context needs
      const analysis = await this.analyzeQuery(enhancedRequest);
      this.logger.debug('Query analysis:', analysis);

      // Build search options based on analysis
      const searchOptions = this.buildSearchOptions(enhancedRequest, analysis);

      // Search for relevant content using enhanced query
      let searchResults = await this.vectorSearchService.searchRelevantContent(
        enhancedQuery,
        searchOptions,
      );

      // If no results with enhanced query, try original query
      if (searchResults.length === 0 && enhancedQuery !== request.query) {
        this.logger.debug(
          'No results with enhanced query, trying original query',
        );
        searchResults = await this.vectorSearchService.searchRelevantContent(
          request.query,
          searchOptions,
        );
      }

      // If still no results, try with lower relevance threshold
      if (searchResults.length === 0) {
        this.logger.debug('No results, trying with lower relevance threshold');
        const lowerThresholdOptions = { ...searchOptions, minRelevance: 0.05 };
        searchResults = await this.vectorSearchService.searchRelevantContent(
          request.query,
          lowerThresholdOptions,
        );
      }

      // If still no results, try broader search without filters
      if (searchResults.length === 0) {
        this.logger.debug('No results, trying broader search without filters');
        const broadOptions = {
          limit: searchOptions.limit,
          minRelevance: 0.05,
        };
        searchResults = await this.vectorSearchService.searchRelevantContent(
          request.query,
          broadOptions,
        );
      }

      if (searchResults.length === 0) {
        const emptyResponse = this.generateEmptyResponse(request.query);
        this.conversationMemory.addAssistantTurn(
          session.sessionId,
          emptyResponse.answer,
        );
        return { ...emptyResponse, sessionId: session.sessionId };
      }

      // Build comprehensive context
      const contextOptions = this.buildContextOptions(analysis);
      const context = await this.contextBuilderService.buildContext(
        searchResults,
        request.query, // Use original query for context building
        contextOptions,
      );

      // Generate AI response with conversation history
      const response = await this.generateResponse(
        enhancedRequest,
        context,
        analysis,
        conversationHistory,
      );

      // Add response to conversation memory
      this.conversationMemory.addAssistantTurn(
        session.sessionId,
        response.answer,
        response.sources,
        { confidence: response.confidence, reasoning: response.reasoning },
      );

      this.logger.debug(
        `Generated response with confidence: ${response.confidence} for session: ${session.sessionId}`,
      );

      return { ...response, sessionId: session.sessionId };
    } catch (error) {
      this.logger.error('Error processing assistant query:', error);
      return {
        answer:
          'I apologize, but I encountered an error while processing your query. Please try again with a different phrasing.',
        sources: [],
        confidence: 0,
        reasoning: `Error occurred: ${error.message}`,
      };
    }
  }

  private async analyzeQuery(request: {
    query: string;
    userId: string;
  }): Promise<QueryAnalysis> {
    // For now, use rule-based analysis directly as it's more reliable
    // Can re-enable AI analysis later if needed
    this.logger.debug('Using rule-based query analysis');
    return this.ruleBasedAnalysis(request);
  }

  private ruleBasedAnalysis(request: {
    query: string;
    userId: string;
  }): QueryAnalysis {
    const query = request.query.toLowerCase();

    // Determine query type
    let queryType: QueryAnalysis['queryType'] = 'question';
    if (
      query.includes('when') ||
      query.includes('deadline') ||
      query.includes('due')
    ) {
      queryType = 'action';
    } else if (query.includes('what happened') || query.includes('summary')) {
      queryType = 'summary';
    } else if (
      query.includes('find') ||
      query.includes('search') ||
      query.includes('show me')
    ) {
      queryType = 'search';
    }

    // Determine time frame
    let timeFrame: QueryAnalysis['timeFrame'] = { type: 'all' };
    if (
      query.includes('recent') ||
      query.includes('latest') ||
      query.includes('today') ||
      query.includes('yesterday')
    ) {
      timeFrame = {
        type: 'recent',
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
        end: new Date(),
      };
    }

    // Extract basic entities (simple word matching)
    const entities: string[] = [];
    const words = query.split(/\s+/);
    for (const word of words) {
      if (word.length > 3 && !this.isCommonWord(word)) {
        entities.push(word);
      }
    }

    return {
      intent: this.extractIntent(query),
      entities: entities.slice(0, 5), // Limit to 5 entities
      timeFrame,
      scope: {
        userId: request.userId,
        global: true, // Global search across all conversations and providers
      },
      queryType,
      confidence: 0.6, // Medium confidence for rule-based analysis
    };
  }

  private extractIntent(query: string): string {
    // Check for poll/options queries first
    if (query.includes('poll') || query.includes('option')) {
      return 'find_poll_options';
    }
    if (
      query.includes('sync') &&
      (query.includes('time') ||
        query.includes('when') ||
        query.includes('option'))
    ) {
      return 'find_meeting_options';
    }
    if (query.includes('deadline') || query.includes('due'))
      return 'find_deadlines';
    if (query.includes('action') || query.includes('task'))
      return 'find_actions';
    if (query.includes('summary') || query.includes('what happened'))
      return 'get_summary';
    if (query.includes('who') || query.includes('person')) return 'find_people';
    if (query.includes('when') || query.includes('time'))
      return 'find_timeline';
    return 'general_query';
  }

  private isCommonWord(word: string): boolean {
    const common = [
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
    ];
    return common.includes(word.toLowerCase());
  }

  private validateAnalysis(parsed: any): QueryAnalysis {
    // Validate and provide defaults for analysis structure
    return {
      intent: parsed.intent || 'general_query',
      entities: Array.isArray(parsed.entities)
        ? parsed.entities.slice(0, 10)
        : [],
      timeFrame: parsed.timeFrame || { type: 'all' },
      scope: parsed.scope || { global: true },
      queryType: parsed.queryType || 'question',
      confidence:
        typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    };
  }

  private buildSearchOptions(
    request: { query: string; userId: string },
    analysis: QueryAnalysis,
  ): SearchOptions {
    const options: SearchOptions = {
      // No conversationId or provider - global search
      userId: request.userId,
      limit: ASSISTANT_CONFIG.DEFAULT_SEARCH_LIMIT,
      minRelevance: ASSISTANT_CONFIG.MIN_RELEVANCE_SCORE,
    };

    // Apply time range from analysis
    if (analysis.timeFrame.start || analysis.timeFrame.end) {
      options.timeRange = {
        start: analysis.timeFrame.start,
        end: analysis.timeFrame.end,
      };
    }

    // Filter by source types based on intent
    if (analysis.intent.includes('action') || analysis.queryType === 'action') {
      options.sourceTypes = ['action', 'summary'];
    } else if (
      analysis.intent.includes('summary') ||
      analysis.queryType === 'summary'
    ) {
      options.sourceTypes = ['summary', 'message'];
    }

    return options;
  }

  private buildContextOptions(analysis: QueryAnalysis): BuildContextOptions {
    const options: BuildContextOptions = {
      maxTokens: ASSISTANT_CONFIG.CONTEXT_WINDOW_SIZE,
      prioritizeActions:
        analysis.queryType === 'action' || analysis.intent.includes('action'),
      includeRecent: analysis.timeFrame.type === 'recent',
    };

    return options;
  }

  private async generateResponse(
    request: { query: string; userId: string },
    context: any,
    analysis: QueryAnalysis,
    conversationHistory?: any[],
  ): Promise<AssistantResponseDto> {
    try {
      // Format context for the AI prompt
      const formattedContext =
        this.contextBuilderService.formatContextForPrompt(context);

      // Build conversation context if available
      let conversationContext = '';
      if (conversationHistory && conversationHistory.length > 1) {
        conversationContext = `\n\nConversation History:\n${conversationHistory
          .slice(-4) // Last 4 turns
          .map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`)
          .join('\n')}\n`;
      }

      // Build the response generation prompt
      const responsePrompt =
        ASSISTANT_PROMPTS.RESPONSE_GENERATION_PROMPT.replace(
          '{query}',
          request.query,
        ).replace('{sources}', formattedContext) + conversationContext;

      // Generate response using AI service with conversation history
      const messages: { role: 'system' | 'user'; content: string }[] = [
        { role: 'system', content: ASSISTANT_PROMPTS.SYSTEM_PROMPT },
      ];

      // Add recent conversation history if available (only user messages, since AI service only supports system/user)
      if (conversationHistory && conversationHistory.length > 1) {
        const userMessages = conversationHistory
          .filter((turn) => turn.role === 'user')
          .slice(-2);
        userMessages.forEach((turn) => {
          messages.push({
            role: 'user',
            content: turn.content,
          });
        });
      }

      messages.push({ role: 'user', content: responsePrompt });

      let aiResponse = await this.aiService.generateText(messages, {
        temperature: ASSISTANT_CONFIG.MODEL_TEMPERATURE,
        max_tokens: ASSISTANT_CONFIG.MAX_TOKENS,
      });

      // SECURITY: Sanitize AI response to remove any sensitive information
      aiResponse = this.securityService.sanitizeResponse(aiResponse);

      // Calculate confidence based on various factors
      const confidence = this.calculateConfidence(
        context,
        analysis,
        aiResponse,
      );

      // Build sources array from context
      const sources = context.items.map((item) => ({
        type: item.type,
        content:
          item.content.length > 200
            ? item.content.substring(0, 200) + '...'
            : item.content,
        relevance: item.relevance,
        metadata: {
          timestamp: item.timestamp,
          conversationName: item.metadata?.conversationName,
          ...item.metadata,
        },
      }));

      // Generate reasoning
      const reasoning = this.generateReasoning(context, analysis, confidence);

      return {
        answer: aiResponse,
        sources,
        confidence,
        reasoning,
      };
    } catch (error) {
      this.logger.error('Error generating AI response:', error);
      throw error;
    }
  }

  private calculateConfidence(
    context: any,
    analysis: QueryAnalysis,
    response: string,
  ): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on context quality
    if (context.items.length > 0) {
      const avgRelevance =
        context.items.reduce((sum, item) => sum + item.relevance, 0) /
        context.items.length;
      confidence += avgRelevance * 0.3;
    }

    // Boost confidence based on analysis confidence
    confidence += analysis.confidence * 0.2;

    // Reduce confidence for very short responses
    if (response.length < 50) {
      confidence -= 0.2;
    }

    // Boost confidence if we have action items and user asked about actions
    if (analysis.queryType === 'action' && context.actionItems.length > 0) {
      confidence += 0.1;
    }

    // Ensure confidence stays within bounds
    return Math.min(Math.max(confidence, 0), 1);
  }

  private generateReasoning(
    context: any,
    analysis: QueryAnalysis,
    confidence: number,
  ): string {
    const parts: string[] = [];

    if (context.items.length > 0) {
      parts.push(
        `Found ${context.items.length} relevant items across ${new Set(context.items.map((i) => i.type)).size} data sources`,
      );
    }

    if (context.actionItems.length > 0) {
      parts.push(
        `identified ${context.actionItems.length} relevant action items`,
      );
    }

    if (analysis.confidence > 0.8) {
      parts.push('high query clarity');
    } else if (analysis.confidence < 0.4) {
      parts.push('ambiguous query interpretation');
    }

    if (confidence < ASSISTANT_CONFIG.MIN_CONFIDENCE_THRESHOLD) {
      parts.push('limited context available - answer may be incomplete');
    }

    return parts.length > 0
      ? 'Based on ' + parts.join(', ') + '.'
      : 'Generated response using available context.';
  }

  private isGreetingOrCasual(query: string): boolean {
    const lowerQuery = query.toLowerCase().trim();

    // Only exact matches or very simple greetings - be much more restrictive
    const simpleGreetings = ['hi', 'hello', 'hey'];
    const casualQuestions = ['who are you', 'what can you do'];

    // Must be exact match or very simple pattern
    const isSimpleGreeting = simpleGreetings.some(
      (greeting) =>
        lowerQuery === greeting ||
        lowerQuery === greeting + '!' ||
        lowerQuery === greeting + '.',
    );

    const isCasualQuestion = casualQuestions.some(
      (question) =>
        lowerQuery === question ||
        lowerQuery === question + '?' ||
        lowerQuery === question + '.',
    );

    // If query contains specific keywords, it's NOT a greeting
    const contentKeywords = [
      'poll',
      'sync',
      'meeting',
      'task',
      'deadline',
      'action',
      'find',
      'show',
      'when',
      'what',
      'where',
      'how',
      'options',
      'time',
    ];
    const hasContentKeywords = contentKeywords.some((keyword) =>
      lowerQuery.includes(keyword),
    );

    return (isSimpleGreeting || isCasualQuestion) && !hasContentKeywords;
  }

  private async generateConversationalResponse(
    query: string,
    userId: string,
  ): Promise<AssistantResponseDto> {
    const lowerQuery = query.toLowerCase().trim();

    let conversationalPrompt = '';
    if (
      lowerQuery.match(
        /^(hi|hello|hey|good morning|good afternoon|good evening)/,
      )
    ) {
      conversationalPrompt = `The user greeted you with: "${query}". Respond warmly and introduce yourself as ConvoVerse Assistant. Ask how you can help them today and mention some of the things you can do (find information from their conversations, track tasks and deadlines, summarize discussions, etc.). Be friendly and welcoming.`;
    } else if (
      lowerQuery.includes('who are you') ||
      lowerQuery.includes('what can you do')
    ) {
      conversationalPrompt = `The user is asking about you with: "${query}". Introduce yourself as ConvoVerse Assistant and explain your capabilities. Mention that you help users manage their conversations, find information across communication platforms, track tasks and deadlines, and provide insights. Be helpful and encouraging.`;
    } else if (
      lowerQuery.includes('thank you') ||
      lowerQuery.includes('thanks')
    ) {
      conversationalPrompt = `The user is asking thanking you with: "${query}". Respond that you are happy to help anytime.`;
    } else {
      conversationalPrompt = `The user said: "${query}". This seems like casual conversation. Respond helpfully and guide them toward how you can assist with their conversations, tasks, and information management. Be friendly and offer specific ways you can help.`;
    }

    try {
      let response = await this.aiService.generateText(
        [
          { role: 'system', content: ASSISTANT_PROMPTS.SYSTEM_PROMPT },
          { role: 'user', content: conversationalPrompt },
        ],
        {
          temperature: 0.7, // Higher temperature for more natural conversation
          max_tokens: 300,
        },
      );

      // SECURITY: Sanitize conversational responses too
      response = this.securityService.sanitizeResponse(response);

      return {
        answer: response,
        sources: [],
        confidence: 0.9, // High confidence for conversational responses
        reasoning: 'Conversational response - no data search required.',
      };
    } catch (error) {
      // Fallback response if AI generation fails
      return {
        answer: `Hi there! 👋 I'm ConvoVerse Assistant, your friendly AI companion for managing conversations and tasks.

I can help you:
• Find information from your conversation history
• Track your tasks and deadlines
• Summarize important discussions
• Search across all your communication platforms

What would you like to know or explore today?`,
        sources: [],
        confidence: 0.8,
        reasoning: 'Fallback conversational response.',
      };
    }
  }

  private generateEmptyResponse(query: string): AssistantResponseDto {
    return {
      answer: `I searched through your conversations but couldn't find specific information about "${query}".

This might be because:
• The topic hasn't been discussed in your conversations yet
• The information might be phrased differently
• The content might be from before I started tracking

 **Here's how I can help instead:**
• Ask me about your tasks and deadlines
• Request summaries of recent conversations  
• Search for specific topics or keywords
• Find action items assigned to you

Try asking something like "What are my upcoming deadlines?" or "Show me recent project discussions."`,
      sources: [],
      confidence: 0.1,
      reasoning:
        'No relevant content found, provided helpful suggestions instead.',
    };
  }
}
