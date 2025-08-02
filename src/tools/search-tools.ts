import { z } from "zod";
import { cache, CacheManager } from "../cache.js";
import { httpClient } from "../http-client.js";

const SearchPackagesSchema = z.object({
  query: z.string().describe("Search query string"),
  limit: z.number().min(1).max(100).default(25).describe("Maximum number of results"),
  from: z.number().min(0).default(0).describe("Offset for pagination")
});

// Export tools and handlers
export const tools = [
  {
    name: "search_packages",
    description: "Search for packages in the npm registry",
    inputSchema: SearchPackagesSchema
  }
];

export const handlers = new Map([
  ["search_packages", handleSearchPackages]
]);

async function handleSearchPackages(args: unknown) {
  const input = SearchPackagesSchema.parse(args);
  
  // Check cache first
  const cacheKey = CacheManager.keys.searchResults(input.query, input.limit);
  const cached = await cache.get<any>(cacheKey);
  if (cached) {
    return {
      content: [
        {
          type: "text",
          text: formatSearchResults(cached, input.query)
        }
      ]
    };
  }
  
  try {
    const searchResults = await httpClient.npmSearch(input.query, {
      size: input.limit,
      from: input.from
    });
    
    // Cache for 5 minutes
    await cache.set(cacheKey, searchResults, 300);
    
    return {
      content: [
        {
          type: "text",
          text: formatSearchResults(searchResults, input.query)
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to search packages: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

function formatSearchResults(results: any, query: string): string {
  const output: string[] = [
    `🔍 Search results for "${query}":\n`
  ];
  
  if (!results.objects || results.objects.length === 0) {
    output.push("No packages found matching your query.");
    return output.join("\n");
  }
  
  results.objects.slice(0, 10).forEach((item: any, index: number) => {
    const pkg = item.package;
    output.push(`${index + 1}. 📦 **${pkg.name}**`);
    output.push(`   Version: ${pkg.version}`);
    output.push(`   Description: ${pkg.description || 'No description'}`);
    output.push(`   Downloads: ${pkg.links?.npm ? '📊 Available' : 'N/A'}`);
    output.push("");
  });
  
  if (results.total > results.objects.length) {
    output.push(`Showing ${results.objects.length} of ${results.total} results`);
  }
  
  return output.join("\n");
}