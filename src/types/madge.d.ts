declare module 'madge' {
  /**
   * Configuration options for madge dependency analysis.
   * 
   * @interface MadgeOptions
   * @example
   * ```typescript
   * const options: MadgeOptions = {
   *   baseDir: "/path/to/project",
   *   includeNpm: false,
   *   fileExtensions: ["js", "ts"],
   *   detectiveOptions: { es6: true }
   * };
   * ```
   */
  interface MadgeOptions {
    baseDir?: string;
    includeNpm?: boolean;
    fileExtensions?: string[];
    detectiveOptions?: any;
  }

  /**
   * Result object from madge dependency analysis.
   * 
   * @interface MadgeResult
   * @example
   * ```typescript
   * const result: MadgeResult = {
   *   circular: () => [["a.js", "b.js", "a.js"]],
   *   orphans: () => ["unused.js"],
   *   obj: () => ({ "a.js": ["b.js"], "b.js": ["c.js"] })
   * };
   * ```
   */
  interface MadgeResult {
    circular(): string[][];
    orphans(): string[];
    obj(): Record<string, string[]>;
  }

  /**
   * Main madge function for analyzing module dependencies.
   * 
   * @param entry - Entry point file or directory to analyze
   * @param options - Optional configuration for the analysis
   * @returns Promise resolving to analysis results
   * 
   * @example
   * ```typescript
   * const result = await madge("src/index.js", {
   *   baseDir: process.cwd(),
   *   fileExtensions: ["js", "ts"]
   * });
   * const circularDeps = result.circular();
   * ```
   */
  function madge(entry: string, options?: MadgeOptions): Promise<MadgeResult>;
  export default madge;
}