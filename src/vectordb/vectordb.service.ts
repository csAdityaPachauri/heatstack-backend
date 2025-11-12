import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';
import { ConfigService } from '@nestjs/config';

export interface VectorMetadata {
  userId: string;
  stackId: string;
  origin: string;
  cslp: string;
  eventType: 'click' | 'hover' | 'view' | 'aggregated';
  timestamp: number;
  textContent: string;
  // Flattened metrics - Pinecone doesn't support nested objects
  totalClicks?: number;
  totalViews?: number;
  totalHover?: number;
  engagementScore?: number;
}

export interface SearchResult {
  id: string;
  score: number;
  metadata: VectorMetadata;
}

@Injectable()
export class VectordbService implements OnModuleInit {
  private pinecone: Pinecone;
  private index: any;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    console.log('🔧 VectordbService initializing...');

    const apiKey = this.configService.get('PINECONE_API_KEY');
    if (!apiKey) {
      console.error('❌ PINECONE_API_KEY not found in environment!');
      throw new Error('PINECONE_API_KEY is required');
    }

    this.pinecone = new Pinecone({ apiKey });

    const indexName = this.configService.get('PINECONE_INDEX_NAME') || 'heatstack-events-cohere';
    console.log(`📌 Connecting to Pinecone index: ${indexName}`);

    this.index = this.pinecone.Index(indexName);

    console.log('✅ VectordbService initialized successfully!');
  }

  /**
   * Upsert a single vector
   */
  async upsertVector(id: string, vector: number[], metadata: VectorMetadata): Promise<void> {
    await this.index.upsert([
      {
        id,
        values: vector,
        metadata,
      },
    ]);
  }

  /**
   * Upsert vectors in batch (more efficient!)
   */
  async upsertBatch(
    vectors: Array<{ id: string; values: number[]; metadata: VectorMetadata }>,
  ): Promise<void> {
    console.log(`🔄 upsertBatch called with ${vectors.length} vectors`);

    if (!this.index) {
      console.error('❌ Pinecone index not initialized!');
      throw new Error('Pinecone index not initialized. Call onModuleInit first.');
    }

    // Pinecone recommends batches of 100
    const batchSize = 100;

    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      console.log(
        `   Upserting batch ${Math.floor(i / batchSize) + 1} with ${batch.length} vectors...`,
      );

      try {
        await this.index.upsert(batch);
        console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1} upserted successfully`);
      } catch (error) {
        console.error(
          `   ❌ Error upserting batch ${Math.floor(i / batchSize) + 1}:`,
          error.message,
        );
        throw error;
      }
    }

    console.log(`✅ All ${vectors.length} vectors upserted to Pinecone`);
  }

  /**
   * Search for similar vectors
   */
  async searchSimilar(
    queryVector: number[],
    topK: number = 5,
    filter?: Record<string, any>,
  ): Promise<SearchResult[]> {
    const response = await this.index.query({
      vector: queryVector,
      topK,
      includeMetadata: true,
      filter,
    });

    return response.matches.map((match: any) => ({
      id: match.id,
      score: match.score,
      metadata: match.metadata as VectorMetadata,
    }));
  }

  /**
   * Delete a vector
   */
  async deleteVector(id: string): Promise<void> {
    await this.index.deleteOne(id);
  }

  /**
   * Delete multiple vectors
   */
  async deleteMany(ids: string[]): Promise<void> {
    await this.index.deleteMany(ids);
  }

  /**
   * Delete vectors by metadata filter
   */
  async deleteByFilter(filter: Record<string, any>): Promise<void> {
    await this.index.deleteMany({ filter });
  }
}
