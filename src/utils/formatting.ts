/**
 * Common formatting utilities for package information display
 */

/**
 * Format file size in human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format download count in human readable format
 */
export function formatDownloads(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return (count / 1000).toFixed(1) + 'K';
  if (count < 1000000000) return (count / 1000000).toFixed(1) + 'M';
  return (count / 1000000000).toFixed(1) + 'B';
}

/**
 * Format a relative time string
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date(Date.now());
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  
  return 'just now';
}

/**
 * Format package version range
 */
export function formatVersionRange(version?: string): string {
  if (!version) return 'latest';
  if (version.startsWith('^')) return `${version} (compatible)`;
  if (version.startsWith('~')) return `${version} (approximately)`;
  if (version.includes('-')) return `${version} (range)`;
  return version;
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format a list of items with proper separators
 */
export function formatList(items: string[], conjunction: 'and' | 'or' = 'and'): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  
  const lastItem = items.pop();
  return `${items.join(', ')}, ${conjunction} ${lastItem}`;
}

/**
 * Format severity level with appropriate emoji
 */
export function formatSeverity(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical': return '🔴 Critical';
    case 'high': return '🟠 High';
    case 'moderate': return '🟡 Moderate';
    case 'low': return '🔵 Low';
    case 'info': return 'ℹ️ Info';
    default: return `⚪ ${severity}`;
  }
}

/**
 * Format license information
 */
export function formatLicense(license: string | { type: string; url?: string }): string {
  if (typeof license === 'string') return license;
  if (license.url) return `${license.type} (${license.url})`;
  return license.type;
}

/**
 * Format dependency tree indent
 */
export function formatTreeIndent(depth: number, isLast: boolean = false): string {
  if (depth === 0) return '';
  
  const indent = '  '.repeat(depth - 1);
  const connector = isLast ? '└─ ' : '├─ ';
  
  return indent + connector;
}