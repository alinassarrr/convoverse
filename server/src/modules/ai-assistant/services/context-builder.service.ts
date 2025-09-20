import { Injectable, Logger } from '@nestjs/common';
import { SearchResult } from './vector-search.service';
import { ASSISTANT_CONFIG } from '../config/assistant.config';

export interface ContextItem {
  type: 'message' | 'summary' | 'action';
  content: string;
  metadata: any;
  relevance: number;
  timestamp: Date;
}

export interface BuildContextOptions {
  maxTokens?: number;
  prioritizeActions?: boolean;
  includeRecent?: boolean;
  contextWindow?: number;
}

export interface BuiltContext {
  items: ContextItem[];
  totalTokens: number;
  summary: string;
  keyTopics: string[];
  actionItems: ContextItem[];
  recentActivity: ContextItem[];
}

@Injectable()
export class ContextBuilderService {
  private readonly logger = new Logger(ContextBuilderService.name);

  async buildContext(
    searchResults: SearchResult[],
    query: string,
    options: BuildContextOptions = {},
  ): Promise<BuiltContext> {
    try {
      const maxTokens =
        options.maxTokens || ASSISTANT_CONFIG.CONTEXT_WINDOW_SIZE;

      // Convert search results to context items
      const contextItems: ContextItem[] = searchResults.map((result) => ({
        type: result.type,
        content: result.content,
        metadata: result.metadata,
        relevance: result.relevance,
        timestamp: result.timestamp,
      }));

      // Prioritize and filter content based on options
      const prioritizedItems = this.prioritizeContent(contextItems, options);

      // Fit content within token limits
      const fittedItems = await this.fitContentToTokenLimit(
        prioritizedItems,
        maxTokens,
      );

      // Build context summary and extract key information
      const summary = this.generateContextSummary(fittedItems, query);
      const keyTopics = this.extractKeyTopics(fittedItems);
      const actionItems = fittedItems.filter((item) => item.type === 'action');
      const recentActivity = this.getRecentActivity(fittedItems);

      return {
        items: fittedItems,
        totalTokens: this.estimateTokenCount(fittedItems),
        summary,
        keyTopics,
        actionItems,
        recentActivity,
      };
    } catch (error) {
      this.logger.error('Error building context:', error);
      return {
        items: [],
        totalTokens: 0,
        summary: 'Unable to build context due to an error.',
        keyTopics: [],
        actionItems: [],
        recentActivity: [],
      };
    }
  }

  private prioritizeContent(
    items: ContextItem[],
    options: BuildContextOptions,
  ): ContextItem[] {
    let prioritized = [...items];

    // Sort by relevance first
    prioritized.sort((a, b) => b.relevance - a.relevance);

    // Apply specific prioritization rules
    if (options.prioritizeActions) {
      prioritized = this.boostActionItems(prioritized);
    }

    if (options.includeRecent) {
      prioritized = this.boostRecentContent(prioritized);
    }

    return prioritized;
  }

  private boostActionItems(items: ContextItem[]): ContextItem[] {
    return items
      .map((item) => {
        if (item.type === 'action') {
          // Boost action items, especially high priority ones
          let boost = 0.1;
          if (item.metadata?.priority === 'urgent') boost = 0.3;
          else if (item.metadata?.priority === 'high') boost = 0.2;

          return {
            ...item,
            relevance: Math.min(item.relevance + boost, 1.0),
          };
        }
        return item;
      })
      .sort((a, b) => b.relevance - a.relevance);
  }

  private boostRecentContent(items: ContextItem[]): ContextItem[] {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return items
      .map((item) => {
        let boost = 0;
        if (item.timestamp > oneDayAgo) {
          boost = 0.15; // Strong boost for last 24h
        } else if (item.timestamp > oneWeekAgo) {
          boost = 0.08; // Moderate boost for last week
        }

        return {
          ...item,
          relevance: Math.min(item.relevance + boost, 1.0),
        };
      })
      .sort((a, b) => b.relevance - a.relevance);
  }

  private async fitContentToTokenLimit(
    items: ContextItem[],
    maxTokens: number,
  ): Promise<ContextItem[]> {
    const fittedItems: ContextItem[] = [];
    let currentTokens = 0;

    for (const item of items) {
      const itemTokens = this.estimateTokenCount([item]);

      if (currentTokens + itemTokens <= maxTokens) {
        fittedItems.push(item);
        currentTokens += itemTokens;
      } else {
        // Try to fit a truncated version if it's important enough
        if (item.relevance > 0.7 && fittedItems.length < 5) {
          const remainingTokens = maxTokens - currentTokens;
          if (remainingTokens > 50) {
            // Only if we have decent space left
            const truncatedItem = this.truncateContent(item, remainingTokens);
            fittedItems.push(truncatedItem);
            currentTokens += this.estimateTokenCount([truncatedItem]);
          }
        }
        break;
      }
    }

    return fittedItems;
  }

  private truncateContent(item: ContextItem, maxTokens: number): ContextItem {
    const maxChars = maxTokens * 3; // Rough approximation: 1 token ≈ 3-4 chars

    if (item.content.length <= maxChars) {
      return item;
    }

    const truncated =
      item.content.substring(0, maxChars - 10) + '...[truncated]';

    return {
      ...item,
      content: truncated,
    };
  }

  private estimateTokenCount(items: ContextItem[]): number {
    // Rough estimation: ~3-4 characters per token for English text
    const totalChars = items.reduce((sum, item) => {
      return sum + item.content.length + JSON.stringify(item.metadata).length;
    }, 0);

    return Math.ceil(totalChars / 3.5);
  }

  private generateContextSummary(items: ContextItem[], query: string): string {
    if (items.length === 0) {
      return 'No relevant context found for the query.';
    }

    const messageCount = items.filter((item) => item.type === 'message').length;
    const summaryCount = items.filter((item) => item.type === 'summary').length;
    const actionCount = items.filter((item) => item.type === 'action').length;

    const conversations = new Set(
      items.map((item) => item.metadata?.conversationName).filter(Boolean),
    );

    const timeRange = this.getTimeRange(items);

    let summary = `Found ${items.length} relevant items`;

    if (messageCount > 0) summary += ` including ${messageCount} messages`;
    if (summaryCount > 0) summary += `, ${summaryCount} summaries`;
    if (actionCount > 0) summary += `, and ${actionCount} action items`;

    if (conversations.size > 0) {
      summary += ` from ${conversations.size} conversation(s): ${Array.from(conversations).slice(0, 3).join(', ')}`;
      if (conversations.size > 3)
        summary += ` and ${conversations.size - 3} others`;
    }

    if (timeRange) {
      summary += `. Content spans from ${timeRange.start.toLocaleDateString()} to ${timeRange.end.toLocaleDateString()}`;
    }

    return summary + '.';
  }

  private extractKeyTopics(items: ContextItem[]): string[] {
    const allText = items
      .map((item) => item.content)
      .join(' ')
      .toLowerCase();

    // Simple keyword extraction based on frequency
    const words = allText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .filter((word) => !this.isStopWord(word));

    const wordFreq = new Map<string, number>();
    words.forEach((word) => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // Get top keywords by frequency
    const topWords = Array.from(wordFreq.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    return topWords;
  }

  private getRecentActivity(items: ContextItem[]): ContextItem[] {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    return items
      .filter((item) => item.timestamp > twoDaysAgo)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  }

  private getTimeRange(
    items: ContextItem[],
  ): { start: Date; end: Date } | null {
    if (items.length === 0) return null;

    const timestamps = items.map((item) => item.timestamp);
    const start = new Date(Math.min(...timestamps.map((t) => t.getTime())));
    const end = new Date(Math.max(...timestamps.map((t) => t.getTime())));

    return { start, end };
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
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
      'from',
      'up',
      'about',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'under',
      'over',
      'between',
      'among',
      'throughout',
      'despite',
      'towards',
      'upon',
      'concerning',
      'regarding',
      'including',
      'excluding',
      'this',
      'that',
      'these',
      'those',
      'they',
      'them',
      'their',
      'there',
      'then',
      'than',
      'when',
      'where',
      'why',
      'how',
      'what',
      'which',
      'who',
      'whom',
      'whose',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'can',
      'cannot',
      'have',
      'has',
      'had',
      'having',
      'been',
      'being',
      'were',
      'was',
      'are',
      'is',
      'not',
      'dont',
      'doesnt',
      'didnt',
      'wont',
      'wouldnt',
      'couldnt',
      'shouldnt',
      'very',
      'quite',
      'just',
      'really',
      'actually',
      'basically',
      'generally',
      'also',
      'too',
      'either',
      'neither',
      'both',
      'all',
      'any',
      'some',
      'many',
      'much',
      'more',
      'most',
      'less',
      'least',
      'few',
      'several',
      'each',
      'every',
    ]);

    return stopWords.has(word);
  }

  formatContextForPrompt(context: BuiltContext): string {
    let formatted = `Context Summary: ${context.summary}\n\n`;

    if (context.keyTopics.length > 0) {
      formatted += `Key Topics: ${context.keyTopics.join(', ')}\n\n`;
    }

    if (context.actionItems.length > 0) {
      formatted += `Action Items:\n`;
      context.actionItems.forEach((item, index) => {
        const priority = item.metadata?.priority
          ? ` (${item.metadata.priority} priority)`
          : '';
        const dueDate = item.metadata?.dueDate
          ? ` - Due: ${new Date(item.metadata.dueDate).toLocaleDateString()}`
          : '';
        formatted += `${index + 1}. ${item.content}${priority}${dueDate}\n`;
      });
      formatted += '\n';
    }

    formatted += `Relevant Content:\n`;
    context.items.forEach((item, index) => {
      const timestamp = item.timestamp.toLocaleDateString();
      const source = item.metadata?.conversationName || 'Unknown';
      formatted += `\n[${index + 1}] ${item.type.toUpperCase()} from ${source} (${timestamp}):\n${item.content}\n`;
    });

    return formatted;
  }
}
