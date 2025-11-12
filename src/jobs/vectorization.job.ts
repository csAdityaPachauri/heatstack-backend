import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../events/schemas/user.schema';
import { EmbeddingService } from '../vectordb/embedding.service';
import { VectordbService } from '../vectordb/vectordb.service';
import { EventTransformerService } from '../vectordb/transformers/event-transformer.service';

@Injectable()
export class VectorizationJob {
  private readonly logger = new Logger(VectorizationJob.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private embeddingService: EmbeddingService,
    private vectordbService: VectordbService,
    private transformerService: EventTransformerService,
  ) {}

  /**
   * Migrate existing MongoDB data to Pinecone
   */
  async migrateExistingData() {
    this.logger.log('Starting vectorization of existing data...');

    const users = await this.userModel.find({}).lean();
    this.logger.log(`Found ${users.length} users to process`);

    // Process in batches of 10 users at a time
    const batchSize = 10;
    let processed = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      try {
        await this.processBatch(batch);
        processed += batch.length;
        this.logger.log(`Processed ${processed}/${users.length} users`);
      } catch (error) {
        this.logger.error(`Error processing batch: ${error.message}`);
      }

      // Small delay to respect API rate limits
      await this.sleep(1000);
    }

    this.logger.log('✅ Vectorization complete!');
  }

  private async processBatch(users: any[]) {
    const allVectors: any[] = [];

    for (const user of users) {
      const texts = this.transformerService.transformToText(
        user.userId,
        user.stackId,
        user.origin,
        user.points,
      );

      const embeddings = await this.embeddingService.generateEmbeddings(texts);

      const vectors = embeddings.map((embedding, index) => ({
        id: `${user.userId}_${user.stackId}_${Date.now()}_${index}`,
        values: embedding,
        metadata: {
          userId: user.userId,
          stackId: user.stackId,
          origin: user.origin,
          cslp: Object.keys(user.points)[index],
          eventType: 'aggregated' as const,
          timestamp: Date.now(),
          textContent: texts[index],
        },
      }));

      allVectors.push(...vectors);
    }

    await this.vectordbService.upsertBatch(allVectors);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
