import { Injectable } from '@nestjs/common';

@Injectable()
export class EventTransformerService {
  /**
   * Transform MongoDB event data into meaningful text for embeddings
   */
  transformToText(userId: string, stackId: string, origin: string, points: any): string[] {
    const texts: string[] = [];

    for (const [cslp, interactions] of Object.entries(points)) {
      const { view, click, hover } = interactions as any;

      // Calculate metrics
      const viewSeconds = view ? Math.floor(view / 1000) : 0;
      const clickCount = Array.isArray(click) ? click.length : 0;
      const hoverSeconds = hover ? Math.floor(hover / 1000) : 0;

      // Create descriptive text
      let text = `User ${userId} on ${stackId} at ${origin} interacted with element ${cslp}.`;

      if (viewSeconds > 0) {
        text += ` Viewed for ${viewSeconds} seconds.`;
      }

      if (clickCount > 0) {
        text += ` Clicked ${clickCount} time${clickCount > 1 ? 's' : ''}.`;
      }

      if (hoverSeconds > 0) {
        text += ` Hovered for ${hoverSeconds} seconds.`;
      }

      // Add engagement level
      const engagementScore = this.calculateEngagement(viewSeconds, clickCount, hoverSeconds);
      text += ` Engagement level: ${this.getEngagementLabel(engagementScore)}.`;

      texts.push(text);
    }

    return texts;
  }

  /**
   * Calculate engagement score (0-100)
   */
  private calculateEngagement(viewSeconds: number, clicks: number, hoverSeconds: number): number {
    const viewScore = Math.min(viewSeconds * 2, 40);
    const clickScore = Math.min(clicks * 15, 40);
    const hoverScore = Math.min(hoverSeconds * 2, 20);
    return Math.round(viewScore + clickScore + hoverScore);
  }

  /**
   * Get engagement label
   */
  private getEngagementLabel(score: number): string {
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'Low';
    return 'Very Low';
  }

  /**
   * Create aggregated summary for multiple users
   */
  createAggregatedSummary(
    cslp: string,
    stats: {
      totalUsers: number;
      totalClicks: number;
      totalViews: number;
      avgViewTime: number;
    },
  ): string {
    return (
      `Element ${cslp} has ${stats.totalUsers} unique users. ` +
      `Total clicks: ${stats.totalClicks}. ` +
      `Total views: ${stats.totalViews}. ` +
      `Average view time: ${Math.round(stats.avgViewTime / 1000)} seconds. ` +
      `This is a ${stats.totalClicks > 100 ? 'highly popular' : 'moderately popular'} element.`
    );
  }
}
