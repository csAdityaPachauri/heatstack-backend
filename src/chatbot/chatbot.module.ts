import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { RAGService } from './rag.service';
import { VectordbModule } from '../vectordb/vectordb.module';

@Module({
  imports: [VectordbModule],
  controllers: [ChatbotController],
  providers: [ChatbotService, RAGService],
})
export class ChatbotModule {}
