import { z } from "zod";
import { cache, CacheManager } from "./cache.js";
import { httpClient } from "./http-client.js";

const SearchInputSchema = z.object({
  query: z.string().describe("Search query for packages"),
  limit: z.number().min(1).max(100).default(25).describe("Maximum number of results"),
  from: z.number().min(0).default(0).describe("Offset for pagination")
});

/**
 * Response structure from npm registry search API.
 * Contains search results with package metadata and scoring information.
 * 
 * @interface NpmSearchResult
 * @example
 * ```typescript
 * const searchResult: NpmSearchResult = {
 *   objects: [{
 *     package: {
 *       name: "lodash",
 *       version: "4.17.21",
 *       description: "A modern JavaScript utility library",
 *       keywords: ["util", "functional"],
 *       date: "2021-02-20T15:52:29.909Z",
 *       links: { npm: "https://www.npmjs.com/package/lodash" },
 *       author: { name: "John-David Dalton" },
 *       publisher: { username: "mathias", email: "mathias@qiwi.be" },
 *       maintainers: [{ username: "jdalton", email: "john@example.com" }]
 *     },
 *     score: {
 *       final: 0.95,
 *       detail: { quality: 0.98, popularity: 0.92, maintenance: 0.95 }
 *     },
 *     searchScore: 0.87
 *   }],
 *   total: 1,
 *   time: "Wed Jan 01 2024 12:00:00 GMT+0000 (UTC)"
 * };
 * ```
 */
interface NpmSearchResult {
  objects: Array<{
    package: {
      name: string;
      version: string;
      description: string;
      keywords: string[];
      date: string;
      links: {
        npm: string;
        homepage?: string;
        repository?: string;
      };
      author?: {
        name: string;
        email?: string;
      };
      publisher: {
        username: string;
        email: string;
      };
      maintainers: Array<{
        username: string;
        email: string;
      }>;
    };
    score: {
      final: number;
      detail: {
        quality: number;
        popularity: number;
        maintenance: number;
      };
    };
    searchScore: number;
  }>;
  total: number;
  time: string;
}

async function handleSearchPackages(args: unknown) {
  const input = SearchInputSchema.parse(args);
  
  // Check cache first
  const cacheKey = CacheManager.keys.searchResults(input.query, input.limit);
  const cached = await cache.get<NpmSearchResult>(cacheKey);
  if (cached) {
    return {
      content: [
        {
          type: "text",
          text: formatSearchResults(cached)
        }
      ]
    };
  }
  
  try {
    // Search NPM registry
    const searchUrl = `/-/v1/search?text=${encodeURIComponent(input.query)}&size=${input.limit}&from=${input.from}`;
    const results = await httpClient.npmRegistry<NpmSearchResult>(searchUrl);
    
    // Cache for 5 minutes
    await cache.set(cacheKey, results, 300);
    
    return {
      content: [
        {
          type: "text",
          text: formatSearchResults(results)
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error searching packages: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

function formatSearchResults(results: NpmSearchResult): string {
  if (results.objects.length === 0) {
    return "No packages found.";
  }
  
  const output: string[] = [
    `Found ${results.total} packages (showing ${results.objects.length}):\n`
  ];
  
  for (const item of results.objects) {
    const pkg = item.package;
    output.push(`📦 ${pkg.name}@${pkg.version}`);
    output.push(`   ${pkg.description || "No description"}`);
    output.push(`   Score: ${(item.score.final * 100).toFixed(1)}%`);
    output.push(`   Quality: ${(item.score.detail.quality * 100).toFixed(0)}% | Popularity: ${(item.score.detail.popularity * 100).toFixed(0)}% | Maintenance: ${(item.score.detail.maintenance * 100).toFixed(0)}%`);
    
    if (pkg.keywords && pkg.keywords.length > 0) {
      output.push(`   Keywords: ${pkg.keywords.slice(0, 5).join(", ")}`);
    }
    
    output.push(`   Links: npm: ${pkg.links.npm}`);
    if (pkg.links.homepage) {
      output.push(`          homepage: ${pkg.links.homepage}`);
    }
    
    output.push("");
  }
  
  return output.join("\n");
}

// Export tools and handlers
export const tools = [
  {
    name: "search_packages",
    description: "Search for packages in the npm registry",
    inputSchema: SearchInputSchema
  }
];

export const handlers = new Map([
  ["search_packages", handleSearchPackages]
]);