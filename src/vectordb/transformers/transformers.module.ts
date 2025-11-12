import { Module } from '@nestjs/common';
import { EventTransformerService } from './event-transformer.service';

@Module({
  providers: [EventTransformerService],
  exports: [EventTransformerService],
})
export class TransformersModule {}
