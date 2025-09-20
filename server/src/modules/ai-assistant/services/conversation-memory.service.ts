import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface ConversationSession {
  sessionId: string;
  userId: string;
  turns: ConversationTurn[];
  createdAt: Date;
  lastActiveAt: Date;
  context: {
    topics: string[];
    entities: string[];
    lastSearchResults?: any[];
  };
}

@Injectable()
export class ConversationMemoryService {
  private readonly logger = new Logger(ConversationMemoryService.name);
  private readonly sessions = new Map<string, ConversationSession>();

  // Config
  private readonly MAX_TURNS = 20; // Keep last 20 conversation turns
  private readonly SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

  constructor() {
    // Clean up expired sessions every hour
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  /**
   * Create or get existing conversation session
   */
  getOrCreateSession(userId: string, sessionId?: string): ConversationSession {
    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      if (session.userId === userId) {
        session.lastActiveAt = new Date();
        return session;
      } else {
        this.logger.warn(`Session ${sessionId} belongs to different user`);
      }
    }

    // Create new session
    const newSessionId = sessionId || `conv_${uuidv4()}`;
    const newSession: ConversationSession = {
      sessionId: newSessionId,
      userId,
      turns: [],
      createdAt: new Date(),
      lastActiveAt: new Date(),
      context: {
        topics: [],
        entities: [],
      },
    };

    this.sessions.set(newSessionId, newSession);
    this.logger.debug(`Created new conversation session: ${newSessionId}`);
    return newSession;
  }

  /**
   * Add user query to conversation
   */
  addUserTurn(sessionId: string, query: string, metadata?: any): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.turns.push({
      role: 'user',
      content: query,
      timestamp: new Date(),
      metadata,
    });

    // Extract entities and topics from query
    this.updateContext(session, query);
    this.trimTurnsIfNeeded(session);
  }

  /**
   * Add assistant response to conversation
   */
  addAssistantTurn(
    sessionId: string,
    response: string,
    sources?: any[],
    metadata?: any,
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.turns.push({
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      metadata: { sources, ...metadata },
    });

    if (sources?.length) {
      session.context.lastSearchResults = sources;
    }

    this.trimTurnsIfNeeded(session);
    session.lastActiveAt = new Date();
  }

  /**
   * Get conversation history for AI context
   */
  getConversationHistory(
    sessionId: string,
    maxTurns: number = 10,
  ): ConversationTurn[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    // Return last N turns
    return session.turns.slice(-maxTurns);
  }

  /**
   * Get conversation context for search enhancement
   */
  getConversationContext(sessionId: string): {
    topics: string[];
    entities: string[];
    recentQueries: string[];
  } {
    const session = this.sessions.get(sessionId);
    if (!session) return { topics: [], entities: [], recentQueries: [] };

    const recentQueries = session.turns
      .filter((turn) => turn.role === 'user')
      .slice(-5)
      .map((turn) => turn.content);

    return {
      topics: session.context.topics.slice(-10), // Last 10 topics
      entities: session.context.entities.slice(-20), // Last 20 entities
      recentQueries,
    };
  }

  /**
   * Check if query might be a follow-up based on context
   */
  isFollowUpQuery(sessionId: string, query: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.turns.length === 0) return false;

    const lowerQuery = query.toLowerCase();

    // Check for follow-up indicators
    const followUpPatterns = [
      /^(and|also|what about|how about|tell me more|more details|continue|go on)/,
      /^(yes|yeah|ok|okay|sure|please|thanks|thank you)/,
      /^(no|nope|not really|different|something else)/,
      /^(when|where|who|why|how|what|which)/,
      /(it|that|this|they|them|those|these)/,
    ];

    return (
      followUpPatterns.some((pattern) => pattern.test(lowerQuery)) ||
      query.length < 20
    ); // Short queries are often follow-ups
  }

  /**
   * Build enhanced query with context
   */
  buildEnhancedQuery(sessionId: string, originalQuery: string): string {
    const session = this.sessions.get(sessionId);
    if (!session || !this.isFollowUpQuery(sessionId, originalQuery)) {
      return originalQuery;
    }

    const context = this.getConversationContext(sessionId);
    const lastTurns = this.getConversationHistory(sessionId, 3);

    let enhancedQuery = originalQuery;

    // Add context from recent conversation
    if (lastTurns.length > 0) {
      const recentContext = lastTurns
        .filter((turn) => turn.role === 'user')
        .slice(-2)
        .map((turn) => turn.content)
        .join('. ');

      if (recentContext) {
        enhancedQuery = `Previous context: ${recentContext}. Current question: ${originalQuery}`;
      }
    }

    // Add relevant entities if query is very short
    if (originalQuery.length < 15 && context.entities.length > 0) {
      const relevantEntities = context.entities.slice(-3).join(', ');
      enhancedQuery += ` (Related to: ${relevantEntities})`;
    }

    this.logger.debug(`Enhanced query: ${originalQuery} -> ${enhancedQuery}`);
    return enhancedQuery;
  }

  private updateContext(session: ConversationSession, query: string): void {
    // Simple entity extraction (you could make this more sophisticated)
    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 3 &&
          ![
            'that',
            'this',
            'with',
            'from',
            'they',
            'them',
            'what',
            'when',
            'where',
            'which',
            'about',
          ].includes(word),
      );

    // Add new entities
    words.forEach((word) => {
      if (!session.context.entities.includes(word)) {
        session.context.entities.push(word);
      }
    });

    // Extract topics (simple keyword detection)
    const topicKeywords = [
      'project',
      'deadline',
      'meeting',
      'task',
      'issue',
      'bug',
      'feature',
      'client',
      'customer',
      'user',
      'team',
      'manager',
      'developer',
    ];

    topicKeywords.forEach((topic) => {
      if (
        query.toLowerCase().includes(topic) &&
        !session.context.topics.includes(topic)
      ) {
        session.context.topics.push(topic);
      }
    });
  }

  private trimTurnsIfNeeded(session: ConversationSession): void {
    if (session.turns.length > this.MAX_TURNS) {
      session.turns = session.turns.slice(-this.MAX_TURNS);
    }
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleanedUp = 0;

    for (const [sessionId, session] of Array.from(this.sessions.entries())) {
      if (now - session.lastActiveAt.getTime() > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
        cleanedUp++;
      }
    }

    if (cleanedUp > 0) {
      this.logger.debug(
        `Cleaned up ${cleanedUp} expired conversation sessions`,
      );
    }
  }
}
