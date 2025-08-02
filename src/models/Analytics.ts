/**
 * Analytics and metrics models for tracking server usage and performance.
 */

/**
 * Individual usage metric for a single tool execution.
 * Used for tracking tool usage patterns and performance.
 * 
 * @interface UsageMetric
 * @example
 * ```typescript
 * const metric: UsageMetric = {
 *   timestamp: "2024-01-01T12:00:00.000Z",
 *   toolName: "search_packages",
 *   success: true,
 *   responseTime: 250,
 *   ipHash: "abc123",
 *   userAgent: "Claude/1.0",
 *   editorType: "claude",
 *   cacheHit: false,
 *   packageManager: "npm",
 *   packageCount: 1
 * };
 * ```
 */
export interface UsageMetric {
  timestamp: string;
  toolName: string;
  success: boolean;
  responseTime: number;
  ipHash: string;
  userAgent?: string;
  editorType: string;
  cacheHit: boolean;
  errorType?: string;
  packageManager?: string;
  packageCount?: number;
}

/**
 * Aggregated statistics for a single day.
 * 
 * @interface DailyStats
 * @example
 * ```typescript
 * const stats: DailyStats = {
 *   date: "2024-01-01",
 *   totalCalls: 1250,
 *   successRate: 0.95,
 *   averageResponseTime: 180,
 *   uniqueUsers: 45,
 *   topTools: { "search_packages": 500, "install_packages": 300 },
 *   editors: { "claude": 800, "cursor": 450 },
 *   errors: { "ValidationError": 25, "NetworkError": 10 }
 * };
 * ```
 */
export interface DailyStats {
  date: string;
  totalCalls: number;
  successRate: number;
  averageResponseTime: number;
  uniqueUsers: number;
  topTools: Record<string, number>;
  editors: Record<string, number>;
  errors: Record<string, number>;
}

/**
 * Comprehensive analytics summary for a given time period.
 * 
 * @interface AnalyticsSummary
 * @example
 * ```typescript
 * const summary: AnalyticsSummary = {
 *   period: "last-30-days",
 *   totalCalls: 37500,
 *   avgDailyCalls: 1250,
 *   successRate: 0.94,
 *   avgResponseTime: 185,
 *   uniqueUsers: 450,
 *   topTools: { "search_packages": 15000 },
 *   editors: { "claude": 20000 },
 *   dailyStats: { "2024-01-01": dailyStatsObj },
 *   trends: trendsObj
 * };
 * ```
 */
export interface AnalyticsSummary {
  period: string;
  totalCalls: number;
  avgDailyCalls: number;
  successRate: number;
  avgResponseTime: number;
  uniqueUsers: number;
  topTools: Record<string, number>;
  editors: Record<string, number>;
  dailyStats: Record<string, DailyStats>;
  trends: AnalyticsTrends;
}

/**
 * Trend analysis showing changes over time.
 * 
 * @interface AnalyticsTrends
 * @example
 * ```typescript
 * const trends: AnalyticsTrends = {
 *   callsGrowth: 0.15,        // 15% increase
 *   responseTimeChange: -0.05, // 5% decrease (improvement)
 *   successRateChange: 0.02,   // 2% increase
 *   popularToolChanges: { "search_packages": 0.10 }
 * };
 * ```
 */
export interface AnalyticsTrends {
  callsGrowth: number;
  responseTimeChange: number;
  successRateChange: number;
  popularToolChanges: Record<string, number>;
}

/**
 * Individual performance measurement for system monitoring.
 * 
 * @interface PerformanceMetric
 * @example
 * ```typescript
 * const metric: PerformanceMetric = {
 *   timestamp: "2024-01-01T12:00:00.000Z",
 *   metric: "response_time",
 *   value: 150,
 *   unit: "ms",
 *   tags: { "tool": "search_packages", "cache": "miss" }
 * };
 * ```
 */
export interface PerformanceMetric {
  timestamp: string;
  metric: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
}

/**
 * Cache performance and utilization metrics.
 * 
 * @interface CacheMetrics
 * @example
 * ```typescript
 * const cacheMetrics: CacheMetrics = {
 *   hitRate: 0.75,
 *   totalRequests: 10000,
 *   hits: 7500,
 *   misses: 2500,
 *   evictions: 100,
 *   avgTtl: 1800,
 *   memoryUsage: 52428800, // 50MB
 *   keyCount: 1250
 * };
 * ```
 */
export interface CacheMetrics {
  hitRate: number;
  totalRequests: number;
  hits: number;
  misses: number;
  evictions: number;
  avgTtl: number;
  memoryUsage: number;
  keyCount: number;
}

/**
 * Error tracking and analysis metrics.
 * 
 * @interface ErrorMetrics
 * @example
 * ```typescript
 * const errorMetric: ErrorMetrics = {
 *   timestamp: "2024-01-01T12:00:00.000Z",
 *   errorType: "ValidationError",
 *   errorMessage: "Invalid package name format",
 *   toolName: "install_packages",
 *   stackTrace: "Error at line 42...",
 *   userAgent: "Cursor/1.0",
 *   ipHash: "def456",
 *   count: 1
 * };
 * ```
 */
export interface ErrorMetrics {
  timestamp: string;
  errorType: string;
  errorMessage: string;
  toolName?: string;
  stackTrace?: string;
  userAgent?: string;
  ipHash?: string;
  count: number;
}

/**
 * System-level performance and health metrics.
 * 
 * @interface SystemMetrics
 * @example
 * ```typescript
 * const sysMetrics: SystemMetrics = {
 *   timestamp: "2024-01-01T12:00:00.000Z",
 *   cpuUsage: 0.45,
 *   memoryUsage: 536870912,  // 512MB
 *   memoryTotal: 2147483648, // 2GB
 *   activeConnections: 25,
 *   queueSize: 5,
 *   responseTime95p: 300,
 *   errorRate: 0.05
 * };
 * ```
 */
export interface SystemMetrics {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  activeConnections: number;
  queueSize: number;
  responseTime95p: number;
  errorRate: number;
}