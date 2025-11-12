import { Injectable } from '@nestjs/common';

@Injectable()
export class EmbeddingService {
  private embedder: any;
  private isInitialized = false;

  async generateEmbedding(text: string): Promise<number[]> {
    const CohereClient = (await import('cohere-ai')).CohereClient;

    const cohere = new CohereClient({
      token: process.env.COHERE_API_KEY,
    });

    const response = await cohere.embed({
      texts: [text],
      model: 'embed-english-light-v3.0',
      inputType: 'search_document',
    });

    return Array.from(response.embeddings[0]) as number[];
  }

  /**
   * Batch generation
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const CohereClient = (await import('cohere-ai')).CohereClient;

    const cohere = new CohereClient({
      token: process.env.COHERE_API_KEY,
    });

    const response = await cohere.embed({
      texts: texts,
      model: 'embed-english-light-v3.0',
      inputType: 'search_document',
    });

    // Convert to number[][] to satisfy TypeScript
    return Array.isArray(response.embeddings)
      ? response.embeddings.map((emb) => Array.from(emb) as number[])
      : [];
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
    const mag1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (mag1 * mag2);
  }
}
