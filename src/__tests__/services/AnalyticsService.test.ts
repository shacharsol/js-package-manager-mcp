import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AnalyticsService } from '../../services/AnalyticsService.js';

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let consoleSpy: jest.MockedFunction<typeof console.log>;

  beforeEach(() => {
    // Reset environment
    delete process.env.ENABLE_ANALYTICS;
    delete process.env.ANALYTICS_SALT;
    
    // Create fresh console spy for each test
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {}) as jest.MockedFunction<typeof console.log>;
    
    analyticsService = new AnalyticsService();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with analytics disabled by default', () => {
      expect(analyticsService.isAnalyticsEnabled()).toBe(false);
    });

    it('should enable analytics when ENABLE_ANALYTICS is set', () => {
      process.env.ENABLE_ANALYTICS = 'true';
      const service = new AnalyticsService();
      expect(service.isAnalyticsEnabled()).toBe(true);
    });

    it('should use default salt when ANALYTICS_SALT is not set', () => {
      // This is tested indirectly through the trackToolUsage method
      expect(() => new AnalyticsService()).not.toThrow();
    });
  });

  describe('trackToolUsage', () => {
    let enabledService: AnalyticsService;
    
    beforeEach(() => {
      process.env.ENABLE_ANALYTICS = 'true';
      enabledService = new AnalyticsService();
    });

    it('should log analytics data when enabled', async () => {
      await enabledService.trackToolUsage(
        'search_packages',
        true,
        245,
        '192.168.1.1',
        'Mozilla/5.0 (claude-desktop)'
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ANALYTICS]',
        expect.stringContaining('"tool":"search_packages"')
      );
    });

    it('should include all relevant data fields', async () => {
      const error = new Error('Test error');
      
      await enabledService.trackToolUsage(
        'install_packages',
        false,
        1200,
        '10.0.0.1',
        'Mozilla/5.0 (windsurf)',
        error,
        'express'
      );

      const logCall = consoleSpy.mock.calls[0];
      const loggedData = JSON.parse(logCall[1] as string);

      expect(loggedData).toMatchObject({
        tool: 'install_packages',
        success: false,
        responseTime: 1200,
        editor: 'windsurf',
        package: 'express',
        error: 'Error'
      });
      expect(loggedData.timestamp).toBeDefined();
    });

    it('should detect editor correctly', async () => {
      const testCases = [
        { userAgent: 'Mozilla/5.0 (claude-desktop)', expected: 'claude' },
        { userAgent: 'Mozilla/5.0 (windsurf)', expected: 'windsurf' },
        { userAgent: 'Mozilla/5.0 (cursor)', expected: 'cursor' },
        { userAgent: 'Mozilla/5.0 (vscode)', expected: 'vscode' },
        { userAgent: 'Mozilla/5.0 (unknown-browser)', expected: 'unknown' },
      ];

      for (const testCase of testCases) {
        consoleSpy.mockClear();
        
        await enabledService.trackToolUsage(
          'test_tool',
          true,
          100,
          '127.0.0.1',
          testCase.userAgent
        );

        const logCall = consoleSpy.mock.calls[0];
        const loggedData = JSON.parse(logCall[1] as string);
        expect(loggedData.editor).toBe(testCase.expected);
      }
    });

    it('should not log when analytics disabled', async () => {
      process.env.ENABLE_ANALYTICS = '';
      const disabledService = new AnalyticsService();

      await disabledService.trackToolUsage(
        'search_packages',
        true,
        245
      );

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Mock console.log to throw an error
      consoleSpy.mockImplementationOnce(() => {
        throw new Error('Console error');
      });

      // Should not throw even if logging fails
      await expect(
        enabledService.trackToolUsage('test_tool', true, 100)
      ).resolves.not.toThrow();
    });
  });

  describe('getAnalyticsSummary', () => {
    it('should return empty summary with message', async () => {
      const summary = await analyticsService.getAnalyticsSummary(7);
      
      expect(summary).toMatchObject({
        period: '7 days',
        total_calls: 0,
        avg_daily_calls: 0,
        success_rate: 100,
        avg_response_time: 0,
        top_tools: {},
        editors: {},
        daily_stats: {},
        message: 'Analytics data available in admin dashboard only'
      });
    });

    it('should accept custom days parameter', async () => {
      const summary = await analyticsService.getAnalyticsSummary(30);
      expect(summary.period).toBe('30 days');
    });
  });

  describe('getPopularPackages', () => {
    it('should return empty object', async () => {
      const packages = await analyticsService.getPopularPackages(10);
      expect(packages).toEqual({});
    });
  });

  describe('isAnalyticsEnabled', () => {
    it('should return correct analytics status', () => {
      expect(analyticsService.isAnalyticsEnabled()).toBe(false);
      
      process.env.ENABLE_ANALYTICS = 'true';
      const enabledService = new AnalyticsService();
      expect(enabledService.isAnalyticsEnabled()).toBe(true);
    });
  });
});