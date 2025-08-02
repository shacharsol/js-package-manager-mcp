/**
 * Analytics and metrics models
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

export interface AnalyticsTrends {
  callsGrowth: number;
  responseTimeChange: number;
  successRateChange: number;
  popularToolChanges: Record<string, number>;
}

export interface PerformanceMetric {
  timestamp: string;
  metric: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
}

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