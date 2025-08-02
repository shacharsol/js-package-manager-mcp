declare module 'madge' {
  interface MadgeOptions {
    baseDir?: string;
    includeNpm?: boolean;
    fileExtensions?: string[];
    detectiveOptions?: any;
  }

  interface MadgeResult {
    circular(): string[][];
    orphans(): string[];
    obj(): Record<string, string[]>;
  }

  function madge(entry: string, options?: MadgeOptions): Promise<MadgeResult>;
  export default madge;
}