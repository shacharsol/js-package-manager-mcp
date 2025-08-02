import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { USER_AGENT_IDENTIFIERS } from './constants';

/**
 * Represents a single usage metric for a tool invocation.
 */
interface UsageMetric {
  timestamp: string;
  toolName: string;
  success: boolean;
  responseTime: number;
  ipHash: string;
  userAgent?: string;
  editorType: string;
  errorType?: string;
}

/**
 * Aggregated daily statistics for tool usage and editor breakdown.
 */
interface DailyStats {
  date: string;
  totalCalls: number;
  uniqueUsers: number;
  topTools: { [key: string]: number };
  editors: { [key: string]: number };
  successRate: number;
  avgResponseTime: number;
}

/**
 * Tracks analytics for tool usage, editor breakdown, and error rates.
 */
class AnalyticsTracker {
  private logFile: string;
  private statsFile: string;
  private salt: string;

  constructor() {
    this.logFile = path.join(process.cwd(), 'logs', 'usage.jsonl');
    this.statsFile = path.join(process.cwd(), 'logs', 'daily-stats.json');
    this.salt = process.env.ANALYTICS_SALT || 'npmplus-2025';
    this.ensureLogDir();
  }

  /**
   * Ensure the log directory exists for storing analytics files.
   */
  private async ensureLogDir() {
    try {
      await fs.mkdir(path.dirname(this.logFile), { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  /**
   * Hash an IP address with a salt for anonymized tracking.
   * @param ip - The client IP address.
   * @returns A hashed string representing the IP.
   */
  private hashIP(ip: string): string {
    return createHash('sha256')
      .update(ip + this.salt)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Detect the editor type from the user agent string.
   * @param userAgent - The user agent string to inspect.
   * @returns The detected editor type or 'unknown'.
   */
  private detectEditor(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    const ua = userAgent.toLowerCase();
    const found = USER_AGENT_IDENTIFIERS.find(id => ua.includes(id));
    return found || 'unknown';
  }

  /**
   * Track a tool usage event and update logs and daily stats.
   * @param toolName - The name of the tool invoked.
   * @param success - Whether the tool invocation was successful.
   * @param responseTime - The response time in milliseconds.
   * @param clientIP - The client IP address (optional).
   * @param userAgent - The user agent string (optional).
   * @param error - The error object if the invocation failed (optional).
   */
  async trackToolUsage(
    toolName: string,
    success: boolean,
    responseTime: number,
    clientIP?: string,
    userAgent?: string,
    error?: Error
  ) {
    try {
      const metric: UsageMetric = {
        timestamp: new Date().toISOString(),
        toolName,
        success,
        responseTime,
        ipHash: clientIP ? this.hashIP(clientIP) : 'unknown',
        userAgent: userAgent?.substring(0, 200), // Limit length
        editorType: this.detectEditor(userAgent),
        errorType: error ? error.constructor.name : undefined
      };

      // Append to log file (JSONL format)
      const logLine = JSON.stringify(metric) + '\n';
      await fs.appendFile(this.logFile, logLine);

      // Update daily stats in background
      this.updateDailyStats(metric).catch(console.error);
    } catch (error) {
      // Silent fail - don't break the main functionality
      console.error('Analytics tracking failed:', error);
    }
  }

  /**
   * Update the daily statistics file with a new usage metric.
   * @param metric - The usage metric to aggregate.
   */
  private async updateDailyStats(metric: UsageMetric) {
    try {
      const today = new Date().toISOString().split('T')[0];
      let stats: { [date: string]: DailyStats } = {};

      // Load existing stats
      try {
        const data = await fs.readFile(this.statsFile, 'utf8');
        stats = JSON.parse(data);
      } catch {
        // File doesn't exist yet
      }

      // Initialize today's stats if needed
      if (!stats[today]) {
        stats[today] = {
          date: today,
          totalCalls: 0,
          uniqueUsers: 0,
          topTools: {},
          editors: {},
          successRate: 0,
          avgResponseTime: 0
        };
      }

      const dayStats = stats[today];
      
      // Update metrics
      dayStats.totalCalls++;
      dayStats.topTools[metric.toolName] = (dayStats.topTools[metric.toolName] || 0) + 1;
      dayStats.editors[metric.editorType] = (dayStats.editors[metric.editorType] || 0) + 1;

      // Calculate success rate and avg response time
      const successCalls = dayStats.totalCalls * dayStats.successRate + (metric.success ? 1 : 0);
      dayStats.successRate = successCalls / dayStats.totalCalls;
      
      const totalResponseTime = dayStats.totalCalls * dayStats.avgResponseTime;
      dayStats.avgResponseTime = (totalResponseTime + metric.responseTime) / dayStats.totalCalls;

      // Save updated stats
      await fs.writeFile(this.statsFile, JSON.stringify(stats, null, 2));
    } catch (error) {
      console.error('Failed to update daily stats:', error);
    }
  }

  /**
   * Get daily statistics for the last N days.
   * @param days - Number of days to retrieve (default: 7).
   * @returns An object mapping date strings to DailyStats.
   */
  async getStats(days: number = 7): Promise<{ [date: string]: DailyStats }> {
    try {
      const data = await fs.readFile(this.statsFile, 'utf8');
      const allStats = JSON.parse(data);
      
      // Get last N days
      const dates = Object.keys(allStats).sort().slice(-days);
      const recentStats: { [date: string]: DailyStats } = {};
      
      dates.forEach(date => {
        recentStats[date] = allStats[date];
      });
      
      return recentStats;
    } catch {
      return {};
    }
  }

  /**
   * Get the most used tools over the last N days.
   * @param days - Number of days to aggregate (default: 7).
   * @returns An object mapping tool names to usage counts.
   */
  async getTopTools(days: number = 7): Promise<{ [tool: string]: number }> {
    const stats = await this.getStats(days);
    const toolCounts: { [tool: string]: number } = {};
    
    Object.values(stats).forEach(dayStats => {
      Object.entries(dayStats.topTools).forEach(([tool, count]) => {
        toolCounts[tool] = (toolCounts[tool] || 0) + count;
      });
    });
    
    // Sort by usage
    return Object.fromEntries(
      Object.entries(toolCounts).sort(([,a], [,b]) => b - a)
    );
  }

  /**
   * Get the breakdown of editor usage over the last N days.
   * @param days - Number of days to aggregate (default: 7).
   * @returns An object mapping editor names to usage counts.
   */
  async getEditorBreakdown(days: number = 7): Promise<{ [editor: string]: number }> {
    const stats = await this.getStats(days);
    const editorCounts: { [editor: string]: number } = {};
    
    Object.values(stats).forEach(dayStats => {
      Object.entries(dayStats.editors).forEach(([editor, count]) => {
        editorCounts[editor] = (editorCounts[editor] || 0) + count;
      });
    });
    
    return editorCounts;
  }

  /**
   * Get a summary of analytics for the last N days, including top tools and editors.
   * @param days - Number of days to summarize (default: 7).
   * @returns An object with summary statistics and breakdowns.
   */
  async getSummary(days: number = 7) {
    const stats = await this.getStats(days);
    const topTools = await this.getTopTools(days);
    const editors = await this.getEditorBreakdown(days);
    
    const totalCalls = Object.values(stats).reduce((sum, day) => sum + day.totalCalls, 0);
    const avgSuccessRate = Object.values(stats).reduce((sum, day) => sum + day.successRate, 0) / Object.keys(stats).length;
    const avgResponseTime = Object.values(stats).reduce((sum, day) => sum + day.avgResponseTime, 0) / Object.keys(stats).length;
    
    return {
      period: `${days} days`,
      totalCalls,
      avgDailyCalls: Math.round(totalCalls / days),
      successRate: Math.round(avgSuccessRate * 100),
      avgResponseTime: Math.round(avgResponseTime),
      topTools,
      editors,
      dailyStats: stats
    };
  }
}

// Export singleton instance
export const analytics = new AnalyticsTracker();

// Middleware for Express/Netlify functions
/**
 * Middleware to wrap a handler with analytics tracking for Express/Netlify functions.
 * @param toolName - The name of the tool being tracked.
 * @returns A function that wraps the handler and tracks analytics.
 */
export function withAnalytics(toolName: string) {
  return async (handler: Function, req: any, res?: any) => {
    const startTime = Date.now();
    let success = false;
    let error: Error | undefined;
    
    try {
      const result = await handler();
      success = true;
      return result;
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      const responseTime = Date.now() - startTime;
      const clientIP = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'];
      const userAgent = req.headers['user-agent'];
      
      analytics.trackToolUsage(
        toolName,
        success,
        responseTime,
        clientIP,
        userAgent,
        error
      );
    }
  };
}