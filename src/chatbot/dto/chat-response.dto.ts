export class ChatResponseDto {
  answer: string;
  sources: Array<{
    cslp: string;
    relevanceScore: number;
    metrics?: any;
  }>;
  confidence: number;
  timestamp: number;
  aiSource?: string; // 'cohere-command' | 'ollama-llama' | 'rule-based'
}
