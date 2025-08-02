import { createServer } from "../server.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

describe("MCP Package Manager Server", () => {
  let server: Server;
  
  beforeEach(async () => {
    server = await createServer();
  });
  
  afterEach(async () => {
    await server.close();
  });
  
  describe("Tool Registration", () => {
    it("should register all expected tools", async () => {
      const response = await server.request({
        method: "tools/list",
        params: {}
      });
      
      const toolNames = response.tools.map((t: any) => t.name);
      
      expect(toolNames).toContain("search_packages");
      expect(toolNames).toContain("install_packages");
      expect(toolNames).toContain("update_packages");
      expect(toolNames).toContain("remove_packages");
      expect(toolNames).toContain("check_outdated");
      expect(toolNames).toContain("audit_dependencies");
      expect(toolNames).toContain("check_vulnerability");
      expect(toolNames).toContain("dependency_tree");
      expect(toolNames).toContain("check_bundle_size");
      expect(toolNames).toContain("analyze_dependencies");
      expect(toolNames).toContain("download_stats");
      expect(toolNames).toContain("list_licenses");
      expect(toolNames).toContain("check_license");
      expect(toolNames).toContain("clean_cache");
      expect(toolNames).toContain("package_info");
    });
  });
  
  describe("Search Tool", () => {
    it("should search for packages", async () => {
      const response = await server.request({
        method: "tools/call",
        params: {
          name: "search_packages",
          arguments: {
            query: "react",
            limit: 5
          }
        }
      });
      
      expect(response.content).toBeDefined();
      expect(response.content[0].type).toBe("text");
      expect(response.content[0].text).toContain("Found");
    });
    
    it("should validate search input", async () => {
      await expect(
        server.request({
          method: "tools/call",
          params: {
            name: "search_packages",
            arguments: {
              query: "react",
              limit: 150 // exceeds max
            }
          }
        })
      ).rejects.toThrow();
    });
  });
  
  describe("Package Info Tool", () => {
    it("should get package information", async () => {
      const response = await server.request({
        method: "tools/call",
        params: {
          name: "package_info",
          arguments: {
            packageName: "express"
          }
        }
      });
      
      expect(response.content).toBeDefined();
      expect(response.content[0].text).toContain("Package Information");
      expect(response.content[0].text).toContain("express");
    });
  });
  
  describe("Download Stats Tool", () => {
    it("should get download statistics", async () => {
      const response = await server.request({
        method: "tools/call",
        params: {
          name: "download_stats",
          arguments: {
            packageName: "react",
            period: "last-week"
          }
        }
      });
      
      expect(response.content).toBeDefined();
      expect(response.content[0].text).toContain("Download Statistics");
      expect(response.content[0].text).toContain("Downloads:");
    });
  });
});

// Integration test example
describe("Integration Tests", () => {
  it("should handle a complete workflow", async () => {
    const server = await createServer();
    
    // 1. Search for a package
    const searchResponse = await server.request({
      method: "tools/call",
      params: {
        name: "search_packages",
        arguments: {
          query: "typescript",
          limit: 1
        }
      }
    });
    
    expect(searchResponse.content[0].text).toContain("typescript");
    
    // 2. Check its bundle size
    const bundleResponse = await server.request({
      method: "tools/call",
      params: {
        name: "check_bundle_size",
        arguments: {
          packageName: "typescript"
        }
      }
    });
    
    expect(bundleResponse.content[0].text).toContain("Bundle Size Analysis");
    
    // 3. Check for vulnerabilities
    const vulnResponse = await server.request({
      method: "tools/call",
      params: {
        name: "check_vulnerability",
        arguments: {
          packageName: "typescript"
        }
      }
    });
    
    expect(vulnResponse.content[0].text).toBeDefined();
    
    await server.close();
  });
});