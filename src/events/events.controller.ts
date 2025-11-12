import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto';

@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post(':stackId/events')
  @UsePipes(new ValidationPipe())
  create(
    @Query('user') userId: string,
    @Query('origin') origin: string,
    @Param('stackId') stackId: string,
    @Body() createEventDtos: CreateEventDto[]
  ) {
    return this.eventsService.create(stackId, userId, origin, createEventDtos);
  }

  @Get(':stackId/events')
  @UsePipes(new ValidationPipe())
  events(
    @Query('origin') origin: string,
    @Param('stackId') stackId: string,
  ) {
    return this.eventsService.events(stackId, origin);
  }
}

