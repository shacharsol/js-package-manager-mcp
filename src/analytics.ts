import { analyticsService } from './services/AnalyticsService.js';

// Re-export for backward compatibility
export const analytics = {
  trackToolUsage: analyticsService.trackToolUsage.bind(analyticsService),
  getSummary: analyticsService.getAnalyticsSummary.bind(analyticsService),
  getPopularPackages: analyticsService.getPopularPackages.bind(analyticsService),
  isAnalyticsEnabled: analyticsService.isAnalyticsEnabled.bind(analyticsService)
};

// Middleware for Express/Netlify functions
/**
 * Middleware to wrap a handler with analytics tracking for Express/Netlify functions.
 * @param toolName - The name of the tool being tracked.
 * @returns A function that wraps the handler and tracks analytics.
 */
export function withAnalytics(toolName: string, packageName?: string) {
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
        error,
        packageName
      );
    }
  };
}