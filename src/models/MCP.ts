/**
 * MCP (Model Context Protocol) related types and interfaces.
 * These interfaces define the structure for MCP server communication and tool execution.
 */

/**
 * MCP Server configuration and metadata.
 * 
 * @interface MCPServer
 * @example
 * ```typescript
 * const server: MCPServer = {
 *   name: "javascript-package-manager",
 *   version: "1.0.0",
 *   protocolVersion: "2024-11-05",
 *   capabilities: { tools: {} }
 * };
 * ```
 */
export interface MCPServer {
  name: string;
  version: string;
  protocolVersion: string;
  capabilities: MCPCapabilities;
}

/**
 * MCP Server capabilities declaration.
 * 
 * @interface MCPCapabilities
 * @example
 * ```typescript
 * const capabilities: MCPCapabilities = {
 *   tools: {},
 *   resources: {},
 *   prompts: {}
 * };
 * ```
 */
export interface MCPCapabilities {
  tools?: Record<string, unknown>;
  resources?: Record<string, unknown>;
  prompts?: Record<string, unknown>;
}

/**
 * MCP Tool definition with schema validation.
 * 
 * @interface MCPTool
 * @example
 * ```typescript
 * const tool: MCPTool = {
 *   name: "search_packages",
 *   description: "Search for packages in the npm registry",
 *   inputSchema: {
 *     type: "object",
 *     properties: {
 *       query: { type: "string", description: "Search query" }
 *     },
 *     required: ["query"]
 *   }
 * };
 * ```
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: MCPToolSchema;
}

/**
 * JSON Schema definition for MCP tool input validation.
 * 
 * @interface MCPToolSchema
 * @example
 * ```typescript
 * const schema: MCPToolSchema = {
 *   type: "object",
 *   properties: {
 *     query: { type: "string", description: "Search query" },
 *     limit: { type: "number", minimum: 1, maximum: 100 }
 *   },
 *   required: ["query"]
 * };
 * ```
 */
export interface MCPToolSchema {
  type: 'object';
  properties: Record<string, MCPProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * JSON Schema property definition for tool input parameters.
 * 
 * @interface MCPProperty
 * @example
 * ```typescript
 * const property: MCPProperty = {
 *   type: "string",
 *   description: "Package name to search for",
 *   minLength: 1,
 *   maxLength: 100
 * };
 * ```
 */
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

/**
 * MCP protocol request message.
 * 
 * @interface MCPRequest
 * @example
 * ```typescript
 * const request: MCPRequest = {
 *   method: "tools/call",
 *   params: {
 *     name: "search_packages",
 *     arguments: { query: "lodash" }
 *   },
 *   id: "req-123"
 * };
 * ```
 */
export interface MCPRequest {
  method: string;
  params?: Record<string, unknown>;
  id?: string | number;
}

/**
 * MCP protocol response message.
 * 
 * @interface MCPResponse
 * @example
 * ```typescript
 * const response: MCPResponse = {
 *   result: { content: [{ type: "text", text: "Search results..." }] },
 *   id: "req-123"
 * };
 * ```
 */
export interface MCPResponse {
  result?: unknown;
  error?: MCPError;
  id?: string | number;
}

/**
 * MCP protocol error information.
 * 
 * @interface MCPError
 * @example
 * ```typescript
 * const error: MCPError = {
 *   code: -32602,
 *   message: "Invalid params",
 *   data: { field: "query", reason: "required" }
 * };
 * ```
 */
export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * MCP tool invocation request.
 * 
 * @interface MCPToolCall
 * @example
 * ```typescript
 * const toolCall: MCPToolCall = {
 *   name: "install_packages",
 *   arguments: {
 *     packages: ["lodash"],
 *     dev: false
 *   }
 * };
 * ```
 */
export interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * MCP tool execution result.
 * 
 * @interface MCPToolResult
 * @example
 * ```typescript
 * const result: MCPToolResult = {
 *   content: [
 *     { type: "text", text: "Successfully installed lodash" }
 *   ],
 *   isError: false
 * };
 * ```
 */
export interface MCPToolResult {
  content: MCPContent[];
  isError?: boolean;
}

/**
 * MCP content block for tool responses.
 * 
 * @interface MCPContent
 * @example
 * ```typescript
 * const content: MCPContent = {
 *   type: "text",
 *   text: "Package installed successfully"
 * };
 * ```
 */
export interface MCPContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
}

/**
 * Context information for tool execution including environment and timing.
 * 
 * @interface ToolExecutionContext
 * @example
 * ```typescript
 * const context: ToolExecutionContext = {
 *   tool: { name: "install_packages", description: "...", inputSchema: {...} },
 *   arguments: { packages: ["lodash"], dev: false },
 *   cwd: "/path/to/project",
 *   packageManager: "npm",
 *   startTime: Date.now(),
 *   timeout: 30000
 * };
 * ```
 */
export interface ToolExecutionContext {
  tool: MCPTool;
  arguments: Record<string, unknown>;
  cwd: string;
  packageManager: string;
  startTime: number;
  timeout?: number;
}

/**
 * Result of tool execution with performance metrics and status.
 * 
 * @interface ToolExecutionResult
 * @example
 * ```typescript
 * const result: ToolExecutionResult = {
 *   success: true,
 *   content: [{ type: "text", text: "Operation completed" }],
 *   duration: 1250,
 *   cached: false,
 *   warnings: ["Package already exists"]
 * };
 * ```
 */
export interface ToolExecutionResult {
  success: boolean;
  content: MCPContent[];
  duration: number;
  cached?: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Analytics and monitoring interfaces for tool usage tracking.
 */

/**
 * Detailed metric for individual tool usage tracking.
 * 
 * @interface ToolUsageMetric
 * @example
 * ```typescript
 * const metric: ToolUsageMetric = {
 *   timestamp: "2024-01-01T12:00:00.000Z",
 *   toolName: "search_packages",
 *   success: true,
 *   responseTime: 150,
 *   cacheHit: true,
 *   editorType: "claude",
 *   ipHash: "abc123",
 *   userAgent: "Claude/1.0"
 * };
 * ```
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

/**
 * Aggregated server performance and usage metrics.
 * 
 * @interface ServerMetrics
 * @example
 * ```typescript
 * const metrics: ServerMetrics = {
 *   totalRequests: 10000,
 *   successfulRequests: 9500,
 *   failedRequests: 500,
 *   averageResponseTime: 180,
 *   cacheHitRate: 0.75,
 *   topTools: { "search_packages": 4000 },
 *   editorBreakdown: { "claude": 6000 },
 *   errorBreakdown: { "ValidationError": 200 },
 *   uptime: 86400
 * };
 * ```
 */
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

/**
 * Server health status with detailed check results.
 * 
 * @interface HealthStatus
 * @example
 * ```typescript
 * const health: HealthStatus = {
 *   status: "healthy",
 *   service: "javascript-package-manager",
 *   version: "1.0.0",
 *   timestamp: "2024-01-01T12:00:00.000Z",
 *   checks: [{ name: "database", status: "pass", duration: 5 }],
 *   metrics: serverMetricsObj
 * };
 * ```
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  timestamp: string;
  checks: HealthCheck[];
  metrics?: ServerMetrics;
}

/**
 * Individual health check result for system components.
 * 
 * @interface HealthCheck
 * @example
 * ```typescript
 * const check: HealthCheck = {
 *   name: "npm-registry",
 *   status: "pass",
 *   duration: 120,
 *   message: "Registry accessible",
 *   details: { endpoint: "https://registry.npmjs.org" }
 * };
 * ```
 */
export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  message?: string;
  details?: Record<string, unknown>;
}