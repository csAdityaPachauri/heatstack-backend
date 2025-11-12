import { Injectable } from '@nestjs/common';
import { EmbeddingService } from '../vectordb/embedding.service';
import { VectordbService, SearchResult } from '../vectordb/vectordb.service';

@Injectable()
export class RAGService {
  constructor(
    private embeddingService: EmbeddingService,
    private vectordbService: VectordbService,
  ) {}

  /**
   * Retrieve relevant context for a question
   */
  async retrieveContext(
    question: string,
    stackId?: string,
    origin?: string,
    topK: number = 5,
  ): Promise<SearchResult[]> {
    // 1. Generate embedding for the question using Cohere
    const questionEmbedding = await this.embeddingService.generateEmbedding(question);

    // 2. Search Pinecone for similar vectors
    const filter: any = {};
    if (stackId) filter.stackId = stackId;
    if (origin) filter.origin = origin;

    const results = await this.vectordbService.searchSimilar(
      questionEmbedding,
      topK,
      Object.keys(filter).length > 0 ? filter : undefined,
    );

    return results;
  }

  /**
   * Format retrieved context for LLM
   */
  formatContext(results: SearchResult[]): string {
    if (results.length === 0) {
      return 'No relevant data found for this query.';
    }

    return results
      .map((result, index) => {
        const { metadata } = result;
        return `[Context ${index + 1}] (Relevance: ${(result.score * 100).toFixed(
          1,
        )}%)\n${metadata.textContent}`;
      })
      .join('\n\n');
  }

  /**
   * Extract sources from results
   */
  extractSources(results: SearchResult[]) {
    return results.map((result) => ({
      cslp: result.metadata.cslp,
      relevanceScore: result.score,
      metrics: {
        totalClicks: result.metadata.totalClicks || 0,
        totalViews: result.metadata.totalViews || 0,
        totalHover: result.metadata.totalHover || 0,
        engagementScore: result.metadata.engagementScore,
      },
      eventType: result.metadata.eventType,
    }));
  }
}
