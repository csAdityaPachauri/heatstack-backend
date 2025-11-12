import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('element-popularity')
  async getElementPopularity(@Query('stackId') stackId: string, @Query('origin') origin: string) {
    return this.analyticsService.getElementPopularity(stackId, origin);
  }

  @Get('user-engagement')
  async getUserEngagement(@Query('userId') userId: string) {
    return this.analyticsService.getUserEngagementPatterns(userId);
  }
}
