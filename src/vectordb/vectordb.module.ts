import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmbeddingService } from './embedding.service';
import { VectordbService } from './vectordb.service';
import { TransformersModule } from './transformers/transformers.module';

@Module({
  imports: [ConfigModule, TransformersModule],
  providers: [EmbeddingService, VectordbService],
  exports: [EmbeddingService, VectordbService, TransformersModule],
})
export class VectordbModule {}
