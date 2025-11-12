import { Injectable } from '@nestjs/common';
import { RAGService } from './rag.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { selectPrompt } from './prompts/system-prompts';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatbotService {
  private chatHistory = new Map<string, any[]>();

  constructor(
    private ragService: RAGService,
    private configService: ConfigService,
  ) {}

  async chat(request: ChatRequestDto): Promise<ChatResponseDto> {
    const { question, stackId, origin, sessionId } = request;

    // 1. Retrieve relevant context from vector DB
    const results = await this.ragService.retrieveContext(question, stackId, origin, 5);

    // 2. Format context
    const context = this.ragService.formatContext(results);

    // 3. Select appropriate prompt
    const promptTemplate = selectPrompt(question);
    const prompt = promptTemplate.replace('{context}', context).replace('{question}', question);

    // 4. Generate answer
    const answer = await this.generateAnswer(question, prompt, results);

    // 5. Extract sources
    const sources = this.ragService.extractSources(results);

    // 6. Store in history if sessionId provided
    if (sessionId) {
      this.addToHistory(sessionId, { question, answer, sources });
    }

    // 7. Calculate confidence based on relevance scores
    const avgRelevance =
      results.length > 0 ? results.reduce((sum, r) => sum + r.score, 0) / results.length : 0;

    return {
      answer,
      sources,
      confidence: avgRelevance,
      timestamp: Date.now(),
    };
  }

  private async generateAnswer(question: string, prompt: string, results: any[]): Promise<string> {
    if (results.length === 0) {
      return "I don't have enough data to answer this question. Please make sure you have tracking data for the specified stackId and origin.";
    }

    // Try to use Cohere Command API if available
    const cohereApiKey = this.configService.get<string>('COHERE_API_KEY');
    if (cohereApiKey) {
      try {
        const cohereAnswer = await this.generateCohereAnswer(prompt, cohereApiKey);
        if (cohereAnswer) {
          return cohereAnswer;
        }
      } catch (error) {
        console.error('Cohere API failed, falling back to rule-based answer:', error.message);
      }
    }

    // Fallback: Generate intelligent rule-based answer
    return this.generateRuleBasedAnswer(question, results);
  }

  private async generateCohereAnswer(prompt: string, apiKey: string): Promise<string | null> {
    try {
      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command',
          prompt: prompt,
          max_tokens: 300,
          temperature: 0.7,
          stop_sequences: ['\n\n'],
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.generations?.[0]?.text?.trim() || null;
    } catch (error) {
      return null;
    }
  }

  private generateRuleBasedAnswer(question: string, results: any[]): string {
    const questionLower = question.toLowerCase();

    // Analyze all results
    const elements = results.map((r) => ({
      cslp: r.metadata.cslp,
      clicks: r.metadata.totalClicks || 0,
      views: r.metadata.totalViews || 0,
      hover: r.metadata.totalHover || 0,
      score: r.score,
    }));

    const wantsLeast =
      questionLower.includes('least') ||
      questionLower.includes('ignore') ||
      questionLower.includes('avoid') ||
      questionLower.includes('not') ||
      questionLower.includes('barely');

    if (questionLower.includes('hover') || questionLower.includes('mouse over')) {
      return wantsLeast
        ? this.answerLeastHoverQuestion(elements)
        : this.answerHoverQuestion(elements);
    } else if (questionLower.includes('click') || questionLower.includes('pressed')) {
      return wantsLeast
        ? this.answerLeastClickQuestion(elements)
        : this.answerClickQuestion(elements);
    } else if (
      questionLower.includes('view') ||
      questionLower.includes('look') ||
      questionLower.includes('see')
    ) {
      return wantsLeast
        ? this.answerLeastViewQuestion(elements)
        : this.answerViewQuestion(elements);
    } else if (
      questionLower.includes('popular') ||
      questionLower.includes('most') ||
      questionLower.includes('top')
    ) {
      return this.answerPopularQuestion(elements);
    } else if (wantsLeast) {
      return this.answerIgnoredQuestion(elements);
    } else {
      return this.answerGeneralQuestion(elements);
    }
  }

  private answerHoverQuestion(elements: any[]): string {
    const sorted = elements.sort((a, b) => b.hover - a.hover);
    const top3 = sorted.slice(0, 3);

    if (top3[0].hover === 0) {
      return `No elements have been hovered over yet. Users haven't shown hover behavior on the tracked elements.`;
    }

    const topElement = top3[0];
    const hoverSeconds = (topElement.hover / 1000).toFixed(1);

    let answer = `The most hovered element is **${topElement.cslp}** with ${hoverSeconds} seconds of hover time`;

    if (topElement.clicks > 0) {
      answer += ` and ${topElement.clicks} click${topElement.clicks > 1 ? 's' : ''}`;
    }
    answer += `.`;

    if (top3.length > 1 && top3[1].hover > 0) {
      answer += `\n\nOther frequently hovered elements:\n`;
      for (let i = 1; i < Math.min(3, top3.length); i++) {
        if (top3[i].hover > 0) {
          answer += `${i + 1}. **${top3[i].cslp}**: ${(top3[i].hover / 1000).toFixed(1)}s hover\n`;
        }
      }
    }

    return answer;
  }

  private answerClickQuestion(elements: any[]): string {
    const sorted = elements.sort((a, b) => b.clicks - a.clicks);
    const top3 = sorted.slice(0, 3);

    if (top3[0].clicks === 0) {
      return `No elements have been clicked yet. Users haven't interacted with the tracked elements through clicks.`;
    }

    const topElement = top3[0];
    let answer = `The most clicked element is **${topElement.cslp}** with ${topElement.clicks} click${topElement.clicks > 1 ? 's' : ''}`;

    if (topElement.views > 0) {
      answer += ` (viewed for ${(topElement.views / 1000).toFixed(1)} seconds)`;
    }
    answer += `.`;

    if (top3.length > 1 && top3[1].clicks > 0) {
      answer += `\n\nOther frequently clicked elements:\n`;
      for (let i = 1; i < Math.min(3, top3.length); i++) {
        if (top3[i].clicks > 0) {
          answer += `${i + 1}. **${top3[i].cslp}**: ${top3[i].clicks} click${top3[i].clicks > 1 ? 's' : ''}\n`;
        }
      }
    }

    return answer;
  }

  private answerViewQuestion(elements: any[]): string {
    const sorted = elements.sort((a, b) => b.views - a.views);
    const top3 = sorted.slice(0, 3);

    const topElement = top3[0];
    const viewSeconds = (topElement.views / 1000).toFixed(1);

    let answer = `The most viewed element is **${topElement.cslp}** with ${viewSeconds} seconds of view time`;

    if (topElement.clicks > 0) {
      answer += ` and ${topElement.clicks} click${topElement.clicks > 1 ? 's' : ''}`;
    }
    answer += `.`;

    if (top3.length > 1) {
      answer += `\n\nTop viewed elements:\n`;
      for (let i = 1; i < Math.min(3, top3.length); i++) {
        answer += `${i + 1}. **${top3[i].cslp}**: ${(top3[i].views / 1000).toFixed(1)}s view time\n`;
      }
    }

    return answer;
  }

  private answerPopularQuestion(elements: any[]): string {
    // Calculate engagement score: clicks * 100 + views/1000 + hover/100
    const scored = elements.map((e) => ({
      ...e,
      engagement: e.clicks * 100 + e.views / 1000 + e.hover / 100,
    }));
    const sorted = scored.sort((a, b) => b.engagement - a.engagement);
    const top3 = sorted.slice(0, 3);

    let answer = `Based on combined engagement metrics, the most popular elements are:\n\n`;

    for (let i = 0; i < Math.min(3, top3.length); i++) {
      const e = top3[i];
      answer += `${i + 1}. **${e.cslp}**\n`;
      answer += `   - ${e.clicks} click${e.clicks > 1 ? 's' : ''}\n`;
      answer += `   - ${(e.views / 1000).toFixed(1)}s view time\n`;
      answer += `   - ${(e.hover / 1000).toFixed(1)}s hover time\n`;
      if (i < top3.length - 1) answer += `\n`;
    }

    return answer;
  }

  private answerIgnoredQuestion(elements: any[]): string {
    const scored = elements.map((e) => ({
      ...e,
      engagement: e.clicks * 100 + e.views / 1000 + e.hover / 100,
    }));
    const sorted = scored.sort((a, b) => a.engagement - b.engagement);
    const bottom3 = sorted.slice(0, 3);

    let answer = `Elements with the least engagement:\n\n`;

    for (let i = 0; i < Math.min(3, bottom3.length); i++) {
      const e = bottom3[i];
      answer += `${i + 1}. **${e.cslp}**\n`;
      answer += `   - ${e.clicks} click${e.clicks > 1 ? 's' : ''}\n`;
      answer += `   - ${(e.views / 1000).toFixed(1)}s view time\n`;
      if (i < bottom3.length - 1) answer += `\n`;
    }

    return answer;
  }

  private answerLeastHoverQuestion(elements: any[]): string {
    const sorted = elements.sort((a, b) => a.hover - b.hover);
    const bottom3 = sorted.slice(0, 3);

    // Check if ALL elements have zero hover (not just bottom 3)
    if (elements.every((e) => e.hover === 0)) {
      return `None of the tracked elements have been hovered over yet.`;
    }

    let answer = `Elements with the least hover time:\n\n`;

    for (let i = 0; i < Math.min(3, bottom3.length); i++) {
      const e = bottom3[i];
      answer += `${i + 1}. **${e.cslp}**\n`;
      answer += `   - ${(e.hover / 1000).toFixed(1)}s hover time\n`;
      if (e.clicks > 0) {
        answer += `   - ${e.clicks} click${e.clicks > 1 ? 's' : ''}\n`;
      }
      if (e.views > 0) {
        answer += `   - ${(e.views / 1000).toFixed(1)}s view time\n`;
      }
      if (i < bottom3.length - 1) answer += `\n`;
    }

    return answer;
  }

  private answerLeastClickQuestion(elements: any[]): string {
    const sorted = elements.sort((a, b) => a.clicks - b.clicks);
    const bottom3 = sorted.slice(0, 3);

    // Check if ALL elements have zero clicks (not just bottom 3)
    if (elements.every((e) => e.clicks === 0)) {
      return `None of the tracked elements have been clicked yet.`;
    }

    let answer = `Elements with the fewest clicks:\n\n`;

    for (let i = 0; i < Math.min(3, bottom3.length); i++) {
      const e = bottom3[i];
      answer += `${i + 1}. **${e.cslp}**\n`;
      answer += `   - ${e.clicks} click${e.clicks > 1 ? 's' : ''}\n`;
      if (e.views > 0) {
        answer += `   - ${(e.views / 1000).toFixed(1)}s view time\n`;
      }
      if (e.hover > 0) {
        answer += `   - ${(e.hover / 1000).toFixed(1)}s hover time\n`;
      }
      if (i < bottom3.length - 1) answer += `\n`;
    }

    return answer;
  }

  private answerLeastViewQuestion(elements: any[]): string {
    const sorted = elements.sort((a, b) => a.views - b.views);
    const bottom3 = sorted.slice(0, 3);

    let answer = `Elements with the shortest view time:\n\n`;

    for (let i = 0; i < Math.min(3, bottom3.length); i++) {
      const e = bottom3[i];
      answer += `${i + 1}. **${e.cslp}**\n`;
      answer += `   - ${(e.views / 1000).toFixed(1)}s view time\n`;
      if (e.clicks > 0) {
        answer += `   - ${e.clicks} click${e.clicks > 1 ? 's' : ''}\n`;
      }
      if (e.hover > 0) {
        answer += `   - ${(e.hover / 1000).toFixed(1)}s hover time\n`;
      }
      if (i < bottom3.length - 1) answer += `\n`;
    }

    return answer;
  }

  private answerGeneralQuestion(elements: any[]): string {
    const totalClicks = elements.reduce((sum, e) => sum + e.clicks, 0);
    const totalViews = elements.reduce((sum, e) => sum + e.views, 0);
    const totalHover = elements.reduce((sum, e) => sum + e.hover, 0);

    let answer = `I found ${elements.length} relevant elements in your tracking data:\n\n`;
    answer += `📊 **Overall Statistics:**\n`;
    answer += `- Total clicks: ${totalClicks}\n`;
    answer += `- Total view time: ${(totalViews / 1000).toFixed(1)} seconds\n`;
    answer += `- Total hover time: ${(totalHover / 1000).toFixed(1)} seconds\n\n`;

    const mostClicked = elements.sort((a, b) => b.clicks - a.clicks)[0];
    const mostViewed = elements.sort((a, b) => b.views - a.views)[0];

    answer += `🎯 **Key Insights:**\n`;
    answer += `- Most clicked: **${mostClicked.cslp}** (${mostClicked.clicks} clicks)\n`;
    answer += `- Most viewed: **${mostViewed.cslp}** (${(mostViewed.views / 1000).toFixed(1)}s)\n`;

    return answer;
  }

  async getHistory(sessionId: string) {
    return this.chatHistory.get(sessionId) || [];
  }

  private addToHistory(sessionId: string, entry: any) {
    const history = this.chatHistory.get(sessionId) || [];
    history.push({ ...entry, timestamp: Date.now() });

    // Keep only last 20 messages
    if (history.length > 20) {
      history.shift();
    }

    this.chatHistory.set(sessionId, history);
  }
}
