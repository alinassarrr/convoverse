import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpStatus,
  HttpException,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '../../../guards/auth.guard';
import { AiAssistantService } from '../services/ai-assistant.service';
import { VectorSearchService } from '../services/vector-search.service';
import { AskAssistantDto, AssistantResponseDto } from '../dto/assistant.dto';
import { ASSISTANT_CONFIG } from '../config/assistant.config';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

@ApiTags('AI Assistant')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('ai-assistant')
export class AiAssistantController {
  private readonly logger = new Logger(AiAssistantController.name);

  constructor(
    private readonly aiAssistantService: AiAssistantService,
    private readonly vectorSearchService: VectorSearchService,
  ) {}

  @Post('ask')
  @ApiOperation({
    summary: 'Ask the AI Assistant',
    description:
      'Send a query to the AI assistant to get intelligent answers based on your conversation history, summaries, and action items.',
  })
  @ApiBody({ type: AskAssistantDto })
  @ApiResponse({
    status: 200,
    description: 'AI Assistant response with answer and sources',
    type: AssistantResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query or request parameters',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async askAssistant(
    @Body() askAssistantDto: AskAssistantDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<AssistantResponseDto> {
    try {
      // Create request object with authenticated user ID and session for conversation continuity
      const requestWithUserId = {
        query: askAssistantDto.query,
        userId: req.user.userId, // Get from authenticated JWT token
        sessionId: askAssistantDto.sessionId, // Optional session for conversation memory
      };

      this.logger.log(
        `AI Assistant query: "${requestWithUserId.query}" from user: ${requestWithUserId.userId}`,
      );

      const response =
        await this.aiAssistantService.askAssistant(requestWithUserId);

      this.logger.log(
        `AI Assistant response generated with confidence: ${response.confidence}`,
      );
      return response;
    } catch (error) {
      this.logger.error('Error processing AI assistant request:', error);

      if (error.message?.includes('Query too long')) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }

      if (error.message?.includes('Rate limit')) {
        throw new HttpException(
          'Rate limit exceeded. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new HttpException(
        'Failed to process your query. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('search/:query')
  @ApiOperation({
    summary: 'Search for relevant content',
    description:
      'Perform a semantic search across messages, summaries, and action items to find relevant content.',
  })
  @ApiQuery({
    name: 'conversationId',
    required: false,
    description: 'Limit search to specific conversation',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'provider',
    required: false,
    description: 'Filter by provider (e.g., slack)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of results to return',
    type: 'number',
  })
  @ApiQuery({
    name: 'sourceTypes',
    required: false,
    description:
      'Comma-separated list of source types (message,summary,action)',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results with relevance scores',
    schema: {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['message', 'summary', 'action'] },
              content: { type: 'string' },
              relevance: { type: 'number' },
              metadata: { type: 'object' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
        query: { type: 'string' },
      },
    },
  })
  async searchContent(
    @Param('query') query: string,
    @Query('conversationId') conversationId?: string,
    @Query('userId') userId?: string,
    @Query('provider') provider?: string,
    @Query('limit') limit?: number,
    @Query('sourceTypes') sourceTypes?: string,
  ) {
    try {
      this.logger.log(`Content search query: "${query}"`);

      const searchOptions = {
        conversationId,
        userId,
        provider,
        limit: limit || ASSISTANT_CONFIG.DEFAULT_SEARCH_LIMIT,
        sourceTypes: sourceTypes ? (sourceTypes.split(',') as any) : undefined,
      };

      const results = await this.vectorSearchService.searchRelevantContent(
        query,
        searchOptions,
      );

      return {
        results,
        total: results.length,
        query,
        options: searchOptions,
      };
    } catch (error) {
      this.logger.error('Error performing content search:', error);
      throw new HttpException(
        'Failed to perform search. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
