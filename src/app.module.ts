import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from './events/events.module';
import { VectordbModule } from './vectordb/vectordb.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    EventsModule,
    VectordbModule,
    ChatbotModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
