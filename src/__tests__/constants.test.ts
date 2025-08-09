import { describe, it, expect } from '@jest/globals';
import { 
  VERSION, 
  MCP_PROTOCOL_VERSION, 
  SERVER_NAME, 
  PACKAGE_MANAGERS, 
  EDITOR_PATTERNS, 
  URLS, 
  detectEditorFromUserAgent 
} from '../constants.js';

describe('Constants', () => {
  describe('Version and Protocol', () => {
    it('should have valid version format', () => {
      expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
      expect(VERSION).toBe('12.0.17');
    });

    it('should have valid MCP protocol version', () => {
      expect(MCP_PROTOCOL_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(MCP_PROTOCOL_VERSION).toBe('2024-11-05');
    });

    it('should have server name', () => {
      expect(SERVER_NAME).toBe('npmplus-mcp');
    });
  });

  describe('Package Managers', () => {
    it('should contain all supported package managers', () => {
      expect(PACKAGE_MANAGERS.NPM).toBe('npm');
      expect(PACKAGE_MANAGERS.YARN).toBe('yarn');
      expect(PACKAGE_MANAGERS.PNPM).toBe('pnpm');
    });

    it('should be immutable', () => {
      expect(() => {
        // @ts-ignore - Testing runtime immutability
        PACKAGE_MANAGERS.NPM = 'modified';
      }).toThrow();
    });
  });

  describe('Editor Patterns', () => {
    it('should contain all supported editors', () => {
      const editorNames = EDITOR_PATTERNS.map(p => p.name);
      expect(editorNames).toContain('claude');
      expect(editorNames).toContain('windsurf');
      expect(editorNames).toContain('cursor');
      expect(editorNames).toContain('vscode');
      expect(editorNames).toContain('cline');
    });

    it('should have valid pattern structure', () => {
      EDITOR_PATTERNS.forEach(pattern => {
        expect(pattern).toHaveProperty('pattern');
        expect(pattern).toHaveProperty('name');
        expect(typeof pattern.pattern).toBe('string');
        expect(typeof pattern.name).toBe('string');
        expect(pattern.pattern.length).toBeGreaterThan(0);
        expect(pattern.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('URLs', () => {
    it('should contain all required service URLs', () => {
      expect(URLS.NPM_REGISTRY).toBe('https://registry.npmjs.org');
      expect(URLS.NPM_API).toBe('https://api.npmjs.org');
      expect(URLS.NPM_WEBSITE).toBe('https://www.npmjs.com');
      expect(URLS.BUNDLEPHOBIA_API).toBe('https://bundlephobia.com/api');
      expect(URLS.GITHUB_ADVISORY_API).toBe('https://api.github.com/advisories');
      expect(URLS.OSV_API).toBe('https://api.osv.dev/v1');
    });

    it('should have valid URL format', () => {
      Object.values(URLS).forEach(url => {
        expect(url).toMatch(/^https?:\/\/.+/);
      });
    });
  });

  describe('detectEditorFromUserAgent', () => {
    it('should detect Claude correctly', () => {
      expect(detectEditorFromUserAgent('Claude Desktop/1.0')).toBe('claude');
      expect(detectEditorFromUserAgent('claude-web/2.1')).toBe('claude');
      expect(detectEditorFromUserAgent('CLAUDE/1.0')).toBe('claude');
    });

    it('should detect Windsurf correctly', () => {
      expect(detectEditorFromUserAgent('Windsurf/1.0')).toBe('windsurf');
      expect(detectEditorFromUserAgent('windsurf-editor')).toBe('windsurf');
    });

    it('should detect Cursor correctly', () => {
      expect(detectEditorFromUserAgent('Cursor/1.0')).toBe('cursor');
      expect(detectEditorFromUserAgent('cursor-editor')).toBe('cursor');
    });

    it('should detect VS Code correctly', () => {
      expect(detectEditorFromUserAgent('Visual Studio Code/1.0')).toBe('vscode');
      expect(detectEditorFromUserAgent('vscode/1.85')).toBe('vscode');
      expect(detectEditorFromUserAgent('vs code')).toBe('vscode');
    });

    it('should detect Cline correctly', () => {
      expect(detectEditorFromUserAgent('Cline/1.0')).toBe('cline');
      expect(detectEditorFromUserAgent('cline-agent')).toBe('cline');
    });

    it('should return unknown for unrecognized user agents', () => {
      expect(detectEditorFromUserAgent('Unknown Browser/1.0')).toBe('unknown');
      expect(detectEditorFromUserAgent('Custom Editor')).toBe('unknown');
      expect(detectEditorFromUserAgent('')).toBe('unknown');
      expect(detectEditorFromUserAgent('')).toBe('unknown');
    });

    it('should be case insensitive', () => {
      expect(detectEditorFromUserAgent('CLAUDE')).toBe('claude');
      expect(detectEditorFromUserAgent('WINDSURF')).toBe('windsurf');
      expect(detectEditorFromUserAgent('CURSOR')).toBe('cursor');
    });

    it('should handle partial matches', () => {
      expect(detectEditorFromUserAgent('My Custom Claude Editor')).toBe('claude');
      expect(detectEditorFromUserAgent('windsurf-based-tool')).toBe('windsurf');
    });

    it('should prioritize first match', () => {
      // If multiple patterns match, should return the first one found
      const userAgent = 'claude-vscode-hybrid';
      expect(detectEditorFromUserAgent(userAgent)).toBe('claude');
    });
  });

  describe('Constants Immutability', () => {
    it('should prevent modification of constants', () => {
      expect(() => {
        // @ts-ignore - Testing runtime immutability
        URLS.NPM_REGISTRY = 'modified';
      }).toThrow();

      expect(() => {
        // @ts-ignore - Testing runtime immutability
        EDITOR_PATTERNS.push({ pattern: 'new', name: 'new' });
      }).toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should work together in realistic scenarios', () => {
      // Test with real user agent strings
      const realUserAgents = [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/1.0.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Windsurf/1.0',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Cursor/0.42.3',
        'Visual Studio Code/1.85.0 (darwin; x64)',
      ];

      const expectedEditors = ['claude', 'windsurf', 'cursor', 'vscode'];
      
      realUserAgents.forEach((ua, index) => {
        expect(detectEditorFromUserAgent(ua)).toBe(expectedEditors[index]);
      });
    });

    it('should handle edge cases gracefully', () => {
      const edgeCases = [
        null,
        undefined,
        '',
        '   ',
        'special characters !@#$%^&*()',
        'very long user agent string that goes on and on and contains no known editor names',
      ];

      edgeCases.forEach(ua => {
        expect(() => detectEditorFromUserAgent(ua as any)).not.toThrow();
        expect(detectEditorFromUserAgent(ua as any)).toBe('unknown');
      });
    });
  });
});