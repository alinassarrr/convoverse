import { Body, Controller, Post } from '@nestjs/common';
import { SummariesService } from './summaries.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TriggerSummarizationDto } from './dto/trigger-summary.dto';
import { SaveSummaryDto } from './dto/save-summary.dto';

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
}
