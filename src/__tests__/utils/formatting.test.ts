import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  formatBytes,
  formatDownloads,
  formatRelativeTime,
  formatVersionRange,
  truncateText,
  formatList,
  formatSeverity,
  formatLicense,
  formatTreeIndent
} from '../../utils/formatting.js';

describe('formatting utilities', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(500)).toBe('500 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });
  });

  describe('formatDownloads', () => {
    it('should format download counts correctly', () => {
      expect(formatDownloads(500)).toBe('500');
      expect(formatDownloads(1500)).toBe('1.5K');
      expect(formatDownloads(1500000)).toBe('1.5M');
      expect(formatDownloads(1500000000)).toBe('1.5B');
    });
  });

  describe('formatRelativeTime', () => {
    const now = new Date('2025-01-20T12:00:00Z');
    const originalDateNow = Date.now;

    beforeEach(() => {
      Date.now = jest.fn(() => now.getTime());
    });

    afterEach(() => {
      Date.now = originalDateNow;
    });

    it('should format relative times correctly', () => {
      expect(formatRelativeTime(new Date('2025-01-19T12:00:00Z'))).toBe('1 day ago');
      expect(formatRelativeTime(new Date('2025-01-18T12:00:00Z'))).toBe('2 days ago');
      expect(formatRelativeTime(new Date('2024-12-20T12:00:00Z'))).toBe('1 month ago');
      expect(formatRelativeTime(new Date('2024-01-20T12:00:00Z'))).toBe('1 year ago');
      expect(formatRelativeTime(new Date('2025-01-20T11:00:00Z'))).toBe('1 hour ago');
      expect(formatRelativeTime(new Date('2025-01-20T11:30:00Z'))).toBe('30 minutes ago');
    });

    it('should handle string dates', () => {
      expect(formatRelativeTime('2025-01-19T12:00:00Z')).toBe('1 day ago');
    });
  });

  describe('formatVersionRange', () => {
    it('should format version ranges correctly', () => {
      expect(formatVersionRange()).toBe('latest');
      expect(formatVersionRange('1.0.0')).toBe('1.0.0');
      expect(formatVersionRange('^1.0.0')).toBe('^1.0.0 (compatible)');
      expect(formatVersionRange('~1.0.0')).toBe('~1.0.0 (approximately)');
      expect(formatVersionRange('1.0.0-2.0.0')).toBe('1.0.0-2.0.0 (range)');
    });
  });

  describe('truncateText', () => {
    it('should truncate text correctly', () => {
      expect(truncateText('short', 10)).toBe('short');
      expect(truncateText('this is a long text', 10)).toBe('this is...');
      expect(truncateText('exact length', 12)).toBe('exact length');
    });
  });

  describe('formatList', () => {
    it('should format lists correctly', () => {
      expect(formatList([])).toBe('');
      expect(formatList(['one'])).toBe('one');
      expect(formatList(['one', 'two'])).toBe('one and two');
      expect(formatList(['one', 'two', 'three'])).toBe('one, two, and three');
      expect(formatList(['one', 'two'], 'or')).toBe('one or two');
      expect(formatList(['one', 'two', 'three'], 'or')).toBe('one, two, or three');
    });
  });

  describe('formatSeverity', () => {
    it('should format severity levels correctly', () => {
      expect(formatSeverity('critical')).toBe('🔴 Critical');
      expect(formatSeverity('high')).toBe('🟠 High');
      expect(formatSeverity('moderate')).toBe('🟡 Moderate');
      expect(formatSeverity('low')).toBe('🔵 Low');
      expect(formatSeverity('info')).toBe('ℹ️ Info');
      expect(formatSeverity('unknown')).toBe('⚪ unknown');
      expect(formatSeverity('CRITICAL')).toBe('🔴 Critical'); // case insensitive
    });
  });

  describe('formatLicense', () => {
    it('should format license strings', () => {
      expect(formatLicense('MIT')).toBe('MIT');
    });

    it('should format license objects', () => {
      expect(formatLicense({ type: 'MIT' })).toBe('MIT');
      expect(formatLicense({ 
        type: 'MIT', 
        url: 'https://opensource.org/licenses/MIT' 
      })).toBe('MIT (https://opensource.org/licenses/MIT)');
    });
  });

  describe('formatTreeIndent', () => {
    it('should format tree indentation correctly', () => {
      expect(formatTreeIndent(0)).toBe('');
      expect(formatTreeIndent(1)).toBe('├─ ');
      expect(formatTreeIndent(1, true)).toBe('└─ ');
      expect(formatTreeIndent(2)).toBe('  ├─ ');
      expect(formatTreeIndent(2, true)).toBe('  └─ ');
      expect(formatTreeIndent(3)).toBe('    ├─ ');
    });
  });
});