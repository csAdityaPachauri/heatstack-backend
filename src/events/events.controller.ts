import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';

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
}
