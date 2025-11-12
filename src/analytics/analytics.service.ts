import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../events/schemas/user.schema";

@Injectable()
export class AnalyticsService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  /**
   * Get element popularity across all users
   */
  async getElementPopularity(stackId: string, origin: string) {
    const users = await this.userModel.find({ stackId, origin });

    const elementStats = new Map<
      string,
      {
        cslp: string;
        totalClicks: number;
        totalViews: number;
        totalHover: number;
        uniqueUsers: number;
      }
    >();

    for (const user of users) {
      for (const [cslp, interactions] of Object.entries(user.points)) {
        const stats = elementStats.get(cslp) || {
          cslp,
          totalClicks: 0,
          totalViews: 0,
          totalHover: 0,
          uniqueUsers: 0,
        };

        const { view, click, hover } = interactions as any;

        stats.totalClicks += Array.isArray(click) ? click.length : 0;
        stats.totalViews += view || 0;
        stats.totalHover += hover || 0;
        stats.uniqueUsers += 1;

        elementStats.set(cslp, stats);
      }
    }

    return Array.from(elementStats.values()).sort(
      (a, b) => b.totalClicks - a.totalClicks
    );
  }

  /**
   * Get user engagement patterns
   */
  async getUserEngagementPatterns(userId: string) {
    const user = await this.userModel.findOne({ userId });

    if (!user) {
      return null;
    }

    let totalClicks = 0;
    let totalViews = 0;
    let totalHover = 0;
    const elements: string[] = [];

    for (const [cslp, interactions] of Object.entries(user.points)) {
      const { view, click, hover } = interactions as any;
      totalClicks += Array.isArray(click) ? click.length : 0;
      totalViews += view || 0;
      totalHover += hover || 0;
      elements.push(cslp);
    }

    const engagementScore = this.calculateEngagementScore(
      totalClicks,
      totalViews,
      totalHover
    );

    return {
      userId,
      totalClicks,
      totalViews: Math.floor(totalViews / 1000), // Convert to seconds
      totalHover: Math.floor(totalHover / 1000), // Convert to seconds
      elementsInteracted: elements.length,
      engagementScore,
      engagementLevel: this.getEngagementLevel(engagementScore),
    };
  }

  /**
   * Get time-based insights
   */
  async getTimeBasedInsights(
    stackId: string,
    timeRange: string = "last_7_days"
  ) {
    // This would require storing timestamps with your events
    // For now, return current statistics
    return {
      message: "Time-based insights require timestamp data in events",
      suggestion: "Add timestamp field when storing events",
    };
  }

  private calculateEngagementScore(
    clicks: number,
    views: number,
    hover: number
  ): number {
    const clickScore = Math.min(clicks * 10, 40);
    const viewScore = Math.min((views / 1000) * 2, 40);
    const hoverScore = Math.min((hover / 1000) * 2, 20);
    return Math.round(clickScore + viewScore + hoverScore);
  }

  private getEngagementLevel(score: number): string {
    if (score >= 80) return "Very High";
    if (score >= 60) return "High";
    if (score >= 40) return "Medium";
    if (score >= 20) return "Low";
    return "Very Low";
  }
}