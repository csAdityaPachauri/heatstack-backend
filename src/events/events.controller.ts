import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  Patch,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateLyticsIdDto } from './dto/update-lytics-id.dto';
import { GetLyticsDataDto } from './dto/get-lytics-data.dto';

@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post(':stackId/events')
  create(
    @Query('user') userId: string,
    @Query('origin') origin: string,
    @Param('stackId') stackId: string,
    @Body() createEventDtos: any,
  ) {
    // Ensure we always pass an array to the service
    const events = Array.isArray(createEventDtos) ? createEventDtos : [];
    return this.eventsService.create(stackId, userId, origin, events);
  }

  @Get(':stackId/events')
  @UsePipes(new ValidationPipe())
  events(@Query('origin') origin: string, @Param('stackId') stackId: string) {
    return this.eventsService.events(stackId, origin);
  }

  @Post(':stackId/events/lytics')
  @UsePipes(new ValidationPipe())
  eventsByLytics(
    @Param('stackId') stackId: string,
    @Query('origin') origin: string,
    @Body() getLyticsDataDto: GetLyticsDataDto,
  ) {
    return this.eventsService.eventsByLytics(stackId, origin, getLyticsDataDto.lyticsIds);
  }

  @Post(':stackId/flows')
  @UsePipes(new ValidationPipe())
  flows(
    @Param('stackId') stackId: string,
    @Query('origin') origin: string,
    @Body() createFlowDto: CreateFlowDto,
  ) {
    return this.eventsService.flows(stackId, origin, createFlowDto);
  }

  @Get(':stackId/flows/:flowId')
  @UsePipes(new ValidationPipe())
  getFlow(
    @Param('stackId') stackId: string,
    @Param('flowId') flowId: string,
    @Query('origin') origin: string,
  ) {
    return this.eventsService.getFlow(stackId, origin, flowId);
  }

  @Patch(':stackId/users/:userId/lytics')
  @UsePipes(new ValidationPipe())
  updateLyticsId(
    @Param('stackId') stackId: string,
    @Param('userId') userId: string,
    @Query('origin') origin: string,
    @Body() updateLyticsIdDto: UpdateLyticsIdDto,
  ) {
    return this.eventsService.updateLyticsId(
      stackId,
      userId,
      origin,
      updateLyticsIdDto.lyticsId,
    );
  }
}
