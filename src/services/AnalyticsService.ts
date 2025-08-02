import { createHash } from 'crypto';
import { detectEditorFromUserAgent } from '../constants.js';

/**
 * Basic analytics tracking for NPM Plus (for admin use only)
 * This is a minimal implementation that can be extended with external analytics services
 */
export class AnalyticsService {
  private salt: string;
  private isEnabled: boolean = false;

  constructor() {
    this.salt = process.env.ANALYTICS_SALT || 'npmplus-2025';
    // Only enable if explicitly configured (for admin instances)
    this.isEnabled = !!process.env.ENABLE_ANALYTICS;
  }

  /**
   * Hash an IP address for privacy
   */
  private hashIP(ip: string): string {
    return createHash('sha256')
      .update(ip + this.salt)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Track a tool usage event (basic logging + optional remote tracking)
   */
  async trackToolUsage(
    toolName: string,
    success: boolean,
    responseTime: number,
    clientIP?: string,
    userAgent?: string,
    error?: Error,
    packageName?: string
  ): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      // Basic console logging for debugging
      const logData = {
        timestamp: new Date().toISOString(),
        tool: toolName,
        success,
        responseTime,
        editor: detectEditorFromUserAgent(userAgent || ''),
        package: packageName,
        error: error?.constructor.name
      };

      console.log('[ANALYTICS]', JSON.stringify(logData));

      // Analytics data is logged locally only
      // Admin deployments can capture and process these logs separately
    } catch (error) {
      // Silent fail - don't break main functionality
    }
  }

  /**
   * Get basic analytics summary (minimal data for open source version)
   */
  async getAnalyticsSummary(days: number = 7) {
    return {
      period: `${days} days`,
      total_calls: 0,
      avg_daily_calls: 0,
      success_rate: 100,
      avg_response_time: 0,
      top_tools: {},
      editors: {},
      daily_stats: {},
      message: 'Analytics data available in admin dashboard only'
    };
  }

  /**
   * Get popular packages (not available in open source version)
   */
  async getPopularPackages(limit: number = 10) {
    return {};
  }

  /**
   * Check if analytics is enabled
   */
  isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();