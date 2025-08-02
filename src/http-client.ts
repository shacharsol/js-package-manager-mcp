import { fetch } from 'undici';
import { URLS } from './constants.js';
import pLimit from "p-limit";

// Rate limiter - 5 concurrent requests
const limit = pLimit(5);

/**
 * HTTP request configuration options for the HttpClient.
 * 
 * @interface RequestOptions
 * @example
 * ```typescript
 * const options: RequestOptions = {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: { query: "lodash" },
 *   timeout: 5000
 * };
 * ```
 */
interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export class HttpClient {
  private baseHeaders: Record<string, string>;
  
  constructor() {
    this.baseHeaders = {
      "User-Agent": "mcp-package-manager/1.0.0",
      "Accept": "application/json"
    };
  }
  
  async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    return limit(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeout || 30000);
      
      try {
        const response = await fetch(url, {
          method: options.method || "GET",
          headers: {
            ...this.baseHeaders,
            ...options.headers
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data as T;
      } catch (error: any) {
        if (error.name === "AbortError") {
          throw new Error(`Request timeout after ${options.timeout || 30000}ms`);
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    });
  }
  
  // NPM Registry specific methods
  async npmRegistry<T>(endpoint: string): Promise<T> {
    const url = `${URLS.NPM_REGISTRY}${endpoint}`;
    return this.request<T>(url);
  }
  
  async npmApi<T>(endpoint: string): Promise<T> {
    const url = `${URLS.NPM_API}${endpoint}`;
    return this.request<T>(url);
  }
  
  // Bundle size service requests
  async bundlephobia(packageSpec: string): Promise<any> {
    const url = `${URLS.BUNDLEPHOBIA_API}/size?package=${encodeURIComponent(packageSpec)}`;
    return this.request(url);
  }
  
  async packagephobia(packageName: string): Promise<any> {
    const url = `${URLS.PACKAGEPHOBIA_API}?p=${encodeURIComponent(packageName)}`;
    return this.request(url);
  }
  
  // NPM search method
  async npmSearch(query: string, options: { size?: number; from?: number } = {}): Promise<any> {
    const params = new URLSearchParams({
      text: query,
      size: (options.size || 25).toString(),
      from: (options.from || 0).toString()
    });
    
    const url = `${URLS.NPM_API}/search?${params}`;
    return this.request(url);
  }
}

export const httpClient = new HttpClient();