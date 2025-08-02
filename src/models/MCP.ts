/**
 * MCP (Model Context Protocol) related types and interfaces
 */

export interface MCPServer {
  name: string;
  version: string;
  protocolVersion: string;
  capabilities: MCPCapabilities;
}

export interface MCPCapabilities {
  tools?: Record<string, unknown>;
  resources?: Record<string, unknown>;
  prompts?: Record<string, unknown>;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: MCPToolSchema;
}

export interface MCPToolSchema {
  type: 'object';
  properties: Record<string, MCPProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface MCPProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  default?: unknown;
  enum?: unknown[];
  items?: MCPProperty;
  properties?: Record<string, MCPProperty>;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
}

export interface MCPRequest {
  method: string;
  params?: Record<string, unknown>;
  id?: string | number;
}

export interface MCPResponse {
  result?: unknown;
  error?: MCPError;
  id?: string | number;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolResult {
  content: MCPContent[];
  isError?: boolean;
}

export interface MCPContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
}

/**
 * Tool execution context
 */
export interface ToolExecutionContext {
  tool: MCPTool;
  arguments: Record<string, unknown>;
  cwd: string;
  packageManager: string;
  startTime: number;
  timeout?: number;
}

export interface ToolExecutionResult {
  success: boolean;
  content: MCPContent[];
  duration: number;
  cached?: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Analytics and monitoring
 */
export interface ToolUsageMetric {
  timestamp: string;
  toolName: string;
  success: boolean;
  responseTime: number;
  cacheHit: boolean;
  errorType?: string;
  editorType?: string;
  ipHash?: string;
  userAgent?: string;
}

export interface ServerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  topTools: Record<string, number>;
  editorBreakdown: Record<string, number>;
  errorBreakdown: Record<string, number>;
  uptime: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  timestamp: string;
  checks: HealthCheck[];
  metrics?: ServerMetrics;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  message?: string;
  details?: Record<string, unknown>;
}