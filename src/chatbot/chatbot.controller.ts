import { Controller, Post, Get, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@Controller('api/chat')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post()
  async chat(@Body() request: ChatRequestDto) {
    try {
      return await this.chatbotService.chat(request);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to process chat request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history/:sessionId')
  async getHistory(@Param('sessionId') sessionId: string) {
    return this.chatbotService.getHistory(sessionId);
  }
}
