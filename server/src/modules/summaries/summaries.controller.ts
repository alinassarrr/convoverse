import { Body, Controller, Post, Get, Param, Query } from '@nestjs/common';
import { SummariesService } from './summaries.service';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TriggerSummarizationDto } from './dto/trigger-summary.dto';
import { SaveSummaryDto } from './dto/save-summary.dto';
import { ActionItemResponseDto } from './dto/action-items-response.dto';

@Controller('summaries')
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) {}

  @Post('generate-summary')
  @ApiOperation({ summary: 'Trigger summarization for a conversation' })
  @ApiResponse({
    status: 200,
    description: 'Summarization triggered successfully.',
  })
  async triggerSummarization(@Body() triggerDto: TriggerSummarizationDto) {
    return this.summariesService.triggerSummarization(triggerDto);
  }

  @Post('save-summary')
  @ApiOperation({ summary: 'Save a pre-generated summary to the database' })
  @ApiResponse({
    status: 201,
    description: 'The summary has been successfully saved.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async saveSummary(
    @Body()
    saveSummaryDto: SaveSummaryDto,
  ) {
    return this.summariesService.saveSummary(saveSummaryDto);
  }

  @Get(':conversationId/latest-summary')
  @ApiOperation({
    summary: 'Get the latest summary for a specific conversation',
    description:
      'Retrieves the most recent summary for the given conversation ID and provider',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'The conversation/channel ID (e.g., Slack channel ID)',
    example: 'C09DNQMMSPJ',
  })
  @ApiQuery({
    name: 'provider',
    description: 'The provider of the conversation',
    example: 'slack',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Latest summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        conversationId: { type: 'string' },
        provider: { type: 'string' },
        summaryText: { type: 'string' },
        messageIds: { type: 'array', items: { type: 'string' } },
        lastMessageTs: { type: 'string' },
        status: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No summary found for this conversation.',
  })
  async getLatestSummary(
    @Param('conversationId') conversationId: string,
    @Query('provider') provider: string = 'slack',
  ) {
    return this.summariesService.getLatestSummary(conversationId, provider);
  }

  @Get(':conversationId/actions')
  @ApiOperation({
    summary: 'Get all actions for a specific conversation',
    description:
      'Retrieves all action items extracted from the given conversation',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'The conversation/channel ID (e.g., Slack channel ID)',
    example: 'C09DNQMMSPJ',
  })
  @ApiQuery({
    name: 'provider',
    description: 'The provider of the conversation',
    example: 'slack',
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter actions by status',
    example: 'pending',
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    required: false,
  })
  @ApiQuery({
    name: 'importance',
    description: 'Filter actions by importance level',
    example: 'high',
    enum: ['low', 'medium', 'high', 'urgent'],
    required: false,
  })
  @ApiQuery({
    name: 'assignedToMe',
    description: 'Filter actions assigned to the current user',
    example: 'true',
    type: 'boolean',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Actions retrieved successfully',
    type: [ActionItemResponseDto],
  })
  async getConversationActions(
    @Param('conversationId') conversationId: string,
    @Query('provider') provider: string = 'slack',
    @Query('status') status?: string,
    @Query('importance') importance?: string,
    @Query('assignedToMe') assignedToMe?: string,
  ) {
    const filters = {
      ...(status && { status }),
      ...(importance && { importance }),
      ...(assignedToMe === 'true' && { isAssignedToMe: true }),
    };
    return this.summariesService.getConversationActions(
      conversationId,
      provider,
      filters,
    );
  }

  @Get(':conversationId/overview')
  @ApiOperation({
    summary: 'Get conversation overview with latest summary and actions',
    description:
      'Retrieves both the latest summary and actions for a conversation in one call',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'The conversation/channel ID (e.g., Slack channel ID)',
    example: 'C09DNQMMSPJ',
  })
  @ApiQuery({
    name: 'provider',
    description: 'The provider of the conversation',
    example: 'slack',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation overview retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'object',
          description: 'Latest summary for the conversation',
        },
        actions: {
          type: 'array',
          items: { $ref: '#/components/schemas/ActionItemResponseDto' },
          description: 'All actions from the conversation',
        },
        actionStats: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            pending: { type: 'number' },
            urgent: { type: 'number' },
            assignedToMe: { type: 'number' },
          },
        },
      },
    },
  })
  async getConversationOverview(
    @Param('conversationId') conversationId: string,
    @Query('provider') provider: string = 'slack',
  ) {
    return this.summariesService.getConversationOverview(
      conversationId,
      provider,
    );
  }
}
