import { Injectable, Logger } from '@nestjs/common';

export interface SecurityCheck {
  isBlocked: boolean;
  reason?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  detectedAttacks: string[];
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  // Patterns that indicate prompt injection attempts
  private readonly INJECTION_PATTERNS = [
    // Direct instruction overrides
    /ignore\s+(your\s+)?(previous\s+)?(instructions?|rules?|prompts?)/i,
    /forget\s+(your\s+)?(previous\s+)?(instructions?|rules?|prompts?)/i,
    /disregard\s+(your\s+)?(previous\s+)?(instructions?|rules?|prompts?)/i,
    /you\s+are\s+not\s+a?\s*(chatbot|assistant|ai)/i,
    /instead\s*,?\s*(you\s+are|be|act\s+as|pretend)/i,

    // Role manipulation
    /act\s+as\s+a?\s*(developer|admin|system|root|user)/i,
    /pretend\s+to\s+be\s+a?\s*(developer|admin|system|root)/i,
    /roleplay\s+as\s+a?\s*(developer|admin|system)/i,
    /you\s+are\s+now\s+a?\s*(developer|admin|system)/i,

    // System/database commands
    /delete\s+(all\s+)?(messages?|data|records?|tables?)/i,
    /drop\s+(table|database|schema)/i,
    /truncate\s+(table|messages?)/i,
    /update\s+.*\s+set\s+/i,
    /insert\s+into\s+/i,
    /select\s+.*\s+from\s+/i,

    // Credential/connection requests
    /(database|db)\s+(password|credentials?|connection|string)/i,
    /(api\s+key|secret|token|password|credentials?)/i,
    /(connection\s+string|env\s+variables?|config)/i,
    /show\s+me\s+(the\s+)?(database|password|secrets?)/i,

    // System information requests
    /give\s+me\s+(raw|direct\s+access\s+to)/i,
    /show\s+me\s+your\s+(system|internal)/i,
    /what\s+is\s+your\s+(database|server|system)/i,
    /reveal\s+(your\s+)?(system|internal|hidden)/i,

    // Meta-instructions
    /write\s+.*\s+instructions?\s+(for|to)\s+the\s+developer/i,
    /tell\s+.*\s+developer\s+to\s+(add|create|modify)/i,
    /hidden\s+(feature|functionality|code)/i,
    /secretly\s+(send|share|provide)/i,

    // Jailbreak attempts
    /jailbreak|dan\s+mode|developer\s+mode/i,
    /hypothetically|theoretically.*if\s+you\s+were/i,
    /in\s+a\s+fictional\s+(world|scenario)/i,
    /for\s+(educational|research)\s+purposes/i,
  ];

  // Sensitive keywords that should never appear in responses
  private readonly SENSITIVE_KEYWORDS = [
    'password',
    'secret',
    'token',
    'api_key',
    'connection_string',
    'mongodb://',
    'mysql://',
    'postgres://',
    'database_url',
    'env',
    'environment',
    'config',
    'credentials',
    'auth_token',
  ];

  // System commands that should be blocked
  private readonly DANGEROUS_COMMANDS = [
    'delete',
    'drop',
    'truncate',
    'update',
    'insert',
    'alter',
    'create',
    'grant',
    'revoke',
    'exec',
    'execute',
    'eval',
  ];

  /**
   * Check if a query contains prompt injection attempts
   */
  checkQuery(query: string): SecurityCheck {
    const detectedAttacks: string[] = [];
    let riskLevel: SecurityCheck['riskLevel'] = 'low';

    // Normalize query for analysis
    const normalizedQuery = query.toLowerCase().trim();

    // Check for injection patterns
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(query)) {
        const attackType = this.identifyAttackType(pattern);
        detectedAttacks.push(attackType);

        // Escalate risk level based on attack type
        if (
          attackType.includes('credential') ||
          attackType.includes('database')
        ) {
          riskLevel = 'critical';
        } else if (
          attackType.includes('system') ||
          attackType.includes('instruction')
        ) {
          riskLevel = riskLevel === 'critical' ? 'critical' : 'high';
        } else {
          riskLevel = riskLevel === 'critical' ? riskLevel : 'medium';
        }
      }
    }

    // Check for dangerous command sequences
    for (const command of this.DANGEROUS_COMMANDS) {
      if (normalizedQuery.includes(command)) {
        detectedAttacks.push(`dangerous_command: ${command}`);
        riskLevel = 'critical';
      }
    }

    // Check for excessive instruction-like language
    const instructionWords = [
      'ignore',
      'forget',
      'instead',
      'now',
      'pretend',
      'act',
      'you are',
    ];
    const instructionCount = instructionWords.filter((word) =>
      normalizedQuery.includes(word),
    ).length;

    if (instructionCount >= 3) {
      detectedAttacks.push('instruction_overload');
      riskLevel = riskLevel === 'critical' ? 'critical' : 'high';
    }

    // Check query length (extremely long queries might be injection attempts)
    if (query.length > 1000) {
      detectedAttacks.push('excessive_length');
      riskLevel = riskLevel === 'critical' ? 'critical' : 'medium';
    }

    const isBlocked = riskLevel === 'critical' || riskLevel === 'high';

    if (isBlocked) {
      this.logger.warn(`Blocked potentially malicious query`, {
        riskLevel,
        detectedAttacks,
        queryLength: query.length,
        // Don't log the full query for security
        queryPreview: query.substring(0, 100) + '...',
      });
    }

    return {
      isBlocked,
      reason: isBlocked ? 'Potential security threat detected' : undefined,
      riskLevel,
      detectedAttacks,
    };
  }

  /**
   * Sanitize AI response to remove any sensitive information
   */
  sanitizeResponse(response: string): string {
    let sanitized = response;

    // Remove any sensitive keywords that might have leaked
    for (const keyword of this.SENSITIVE_KEYWORDS) {
      const regex = new RegExp(keyword, 'gi');
      if (regex.test(sanitized)) {
        this.logger.error(`Sensitive keyword detected in response: ${keyword}`);
        sanitized = sanitized.replace(regex, '[REDACTED]');
      }
    }

    // Remove anything that looks like connection strings
    sanitized = sanitized.replace(
      /mongodb:\/\/[^\s]+/gi,
      '[DATABASE_CONNECTION_REDACTED]',
    );
    sanitized = sanitized.replace(
      /(postgres|mysql|redis):\/\/[^\s]+/gi,
      '[CONNECTION_STRING_REDACTED]',
    );

    // Remove potential API keys or tokens
    sanitized = sanitized.replace(/[a-zA-Z0-9]{32,}/g, (match) => {
      // If it looks like a token/key, redact it
      if (match.length > 20 && /^[a-zA-Z0-9]+$/.test(match)) {
        return '[TOKEN_REDACTED]';
      }
      return match;
    });

    return sanitized;
  }

  /**
   * Generate safe error response for blocked queries
   */
  generateSecurityResponse(): string {
    return `I can't process that request as it appears to contain instructions that could compromise system security. 

I'm designed to help you find information from your conversations, track tasks, and answer questions about your data in a safe way.

Please rephrase your question to focus on the specific information you're looking for from your messages or conversations.`;
  }

  private identifyAttackType(pattern: RegExp): string {
    const patternStr = pattern.source.toLowerCase();

    if (patternStr.includes('password') || patternStr.includes('credential')) {
      return 'credential_request';
    }
    if (patternStr.includes('database') || patternStr.includes('connection')) {
      return 'database_access_attempt';
    }
    if (patternStr.includes('delete') || patternStr.includes('drop')) {
      return 'destructive_command';
    }
    if (patternStr.includes('ignore') || patternStr.includes('forget')) {
      return 'instruction_override';
    }
    if (patternStr.includes('act') || patternStr.includes('pretend')) {
      return 'role_manipulation';
    }
    if (patternStr.includes('developer') || patternStr.includes('system')) {
      return 'system_access_attempt';
    }

    return 'generic_injection_attempt';
  }
}
