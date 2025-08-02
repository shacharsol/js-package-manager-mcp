import { fetch } from 'undici';
import { SecurityInfo, Vulnerability, SecuritySeverity } from '../models/Package.js';

/**
 * Service for security vulnerability checking
 */
export class SecurityService {
  private readonly ghAdvisoryUrl: string;
  private readonly osvUrl: string;

  constructor(
    ghAdvisoryUrl: string = 'https://api.github.com/advisories',
    osvUrl: string = 'https://api.osv.dev/v1'
  ) {
    this.ghAdvisoryUrl = ghAdvisoryUrl;
    this.osvUrl = osvUrl;
  }

  /**
   * Check vulnerabilities for a specific package
   */
  async checkVulnerabilities(packageName: string, version?: string): Promise<SecurityInfo> {
    try {
      // Check both GitHub Security Advisory and OSV databases
      const [ghVulns, osvVulns] = await Promise.allSettled([
        this.checkGitHubAdvisory(packageName, version),
        this.checkOSVDatabase(packageName, version),
      ]);

      const vulnerabilities: Vulnerability[] = [];

      // Process GitHub Advisory results
      if (ghVulns.status === 'fulfilled') {
        vulnerabilities.push(...ghVulns.value);
      }

      // Process OSV results
      if (osvVulns.status === 'fulfilled') {
        vulnerabilities.push(...osvVulns.value);
      }

      // Remove duplicates based on ID
      const uniqueVulns = this.deduplicateVulnerabilities(vulnerabilities);

      return {
        vulnerabilities: uniqueVulns,
        hasVulnerabilities: uniqueVulns.length > 0,
        severity: this.calculateOverallSeverity(uniqueVulns),
      };
    } catch (error) {
      throw new Error(`Failed to check vulnerabilities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check GitHub Security Advisory database
   */
  private async checkGitHubAdvisory(packageName: string, version?: string): Promise<Vulnerability[]> {
    try {
      // GitHub Advisory API query
      const params = new URLSearchParams({
        ecosystem: 'npm',
        affects: packageName,
      });

      if (version) {
        // Note: GitHub API doesn't directly support version filtering in the URL
        // We'll filter after fetching
      }

      const response = await fetch(`${this.ghAdvisoryUrl}?${params}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'npmplus-mcp-server/1.0.0',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return []; // No advisories found
        }
        throw new Error(`GitHub Advisory API failed: ${response.status}`);
      }

      const advisories = await response.json() as any[];
      
      return advisories
        .filter(advisory => this.isPackageAffected(advisory, packageName, version))
        .map(advisory => this.transformGitHubAdvisory(advisory));
    } catch (error) {
      console.warn(`GitHub Advisory check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Check OSV (Open Source Vulnerabilities) database
   */
  private async checkOSVDatabase(packageName: string, version?: string): Promise<Vulnerability[]> {
    try {
      const query = {
        package: {
          ecosystem: 'npm',
          name: packageName,
        },
        ...(version && { version }),
      };

      const response = await fetch(`${this.osvUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        throw new Error(`OSV API failed: ${response.status}`);
      }

      const data = await response.json() as any;
      const vulns = data.vulns || [];
      
      return vulns.map((vuln: any) => this.transformOSVVulnerability(vuln));
    } catch (error) {
      console.warn(`OSV check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Check if package is affected by advisory
   */
  private isPackageAffected(advisory: any, packageName: string, version?: string): boolean {
    const vulnerabilities = advisory.vulnerabilities || [];
    
    for (const vuln of vulnerabilities) {
      const affected = vuln.package?.ecosystem === 'npm' && vuln.package?.name === packageName;
      
      if (!affected) continue;
      
      if (!version) return true; // If no version specified, consider it affected
      
      // Check if version is in affected ranges
      const ranges = vuln.ranges || [];
      for (const range of ranges) {
        if (this.isVersionInRange(version, range)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if version is in vulnerability range
   */
  private isVersionInRange(version: string, range: any): boolean {
    // Simplified version range checking
    // In production, use semver library for proper range matching
    const events = range.events || [];
    
    for (const event of events) {
      if (event.introduced && this.compareVersions(version, event.introduced) >= 0) {
        return true;
      }
      if (event.fixed && this.compareVersions(version, event.fixed) < 0) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Simple version comparison (use semver in production)
   */
  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;
      
      if (aPart < bPart) return -1;
      if (aPart > bPart) return 1;
    }
    
    return 0;
  }

  /**
   * Transform GitHub advisory to common format
   */
  private transformGitHubAdvisory(advisory: any): Vulnerability {
    return {
      id: advisory.ghsa_id || advisory.id,
      title: advisory.summary || advisory.title,
      severity: this.mapSeverity(advisory.severity),
      url: advisory.html_url || `https://github.com/advisories/${advisory.ghsa_id}`,
      overview: advisory.description || advisory.summary,
      recommendation: this.extractRecommendation(advisory),
      versions: this.extractAffectedVersions(advisory),
      published: advisory.published_at,
      updated: advisory.updated_at,
    };
  }

  /**
   * Transform OSV vulnerability to common format
   */
  private transformOSVVulnerability(vuln: any): Vulnerability {
    return {
      id: vuln.id,
      title: vuln.summary || vuln.details?.substring(0, 100) + '...',
      severity: this.mapOSVSeverity(vuln),
      url: this.buildOSVUrl(vuln.id),
      overview: vuln.details || vuln.summary,
      recommendation: this.extractOSVRecommendation(vuln),
      versions: this.extractOSVAffectedVersions(vuln),
      published: vuln.published,
      updated: vuln.modified || vuln.published,
    };
  }

  /**
   * Map severity levels to common format
   */
  private mapSeverity(severity: string): SecuritySeverity {
    const severityLower = severity?.toLowerCase() || 'unknown';
    
    switch (severityLower) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'moderate':
      case 'medium': return 'moderate';
      case 'low': return 'low';
      default: return 'info';
    }
  }

  /**
   * Map OSV severity to common format
   */
  private mapOSVSeverity(vuln: any): SecuritySeverity {
    // OSV uses CVSS scores, convert to severity levels
    const cvss = vuln.severity?.find((s: any) => s.type === 'CVSS_V3');
    if (cvss) {
      const score = parseFloat(cvss.score);
      if (score >= 9.0) return 'critical';
      if (score >= 7.0) return 'high';
      if (score >= 4.0) return 'moderate';
      if (score >= 0.1) return 'low';
    }
    
    return 'info';
  }

  /**
   * Calculate overall severity from multiple vulnerabilities
   */
  private calculateOverallSeverity(vulnerabilities: Vulnerability[]): SecuritySeverity {
    if (vulnerabilities.length === 0) return 'info';
    
    const severityOrder: SecuritySeverity[] = ['critical', 'high', 'moderate', 'low', 'info'];
    
    for (const severity of severityOrder) {
      if (vulnerabilities.some(v => v.severity === severity)) {
        return severity;
      }
    }
    
    return 'info';
  }

  /**
   * Remove duplicate vulnerabilities based on ID
   */
  private deduplicateVulnerabilities(vulnerabilities: Vulnerability[]): Vulnerability[] {
    const seen = new Set<string>();
    return vulnerabilities.filter(vuln => {
      if (seen.has(vuln.id)) {
        return false;
      }
      seen.add(vuln.id);
      return true;
    });
  }

  /**
   * Extract recommendation from advisory
   */
  private extractRecommendation(advisory: any): string {
    // Look for common recommendation patterns
    if (advisory.recommendation) {
      return advisory.recommendation;
    }
    
    if (advisory.description) {
      const desc = advisory.description.toLowerCase();
      if (desc.includes('upgrade') || desc.includes('update')) {
        return 'Upgrade to a patched version';
      }
    }
    
    return 'Review advisory for specific recommendations';
  }

  /**
   * Extract OSV recommendation
   */
  private extractOSVRecommendation(vuln: any): string {
    // OSV format recommendations
    if (vuln.database_specific?.recommendation) {
      return vuln.database_specific.recommendation;
    }
    
    return 'Check vulnerability details for remediation steps';
  }

  /**
   * Extract affected versions from GitHub advisory
   */
  private extractAffectedVersions(advisory: any): string[] {
    const versions: string[] = [];
    const vulnerabilities = advisory.vulnerabilities || [];
    
    for (const vuln of vulnerabilities) {
      const ranges = vuln.ranges || [];
      for (const range of ranges) {
        const events = range.events || [];
        for (const event of events) {
          if (event.introduced) versions.push(`>=${event.introduced}`);
          if (event.fixed) versions.push(`<${event.fixed}`);
        }
      }
    }
    
    return [...new Set(versions)]; // Remove duplicates
  }

  /**
   * Extract affected versions from OSV
   */
  private extractOSVAffectedVersions(vuln: any): string[] {
    const versions: string[] = [];
    const affected = vuln.affected || [];
    
    for (const pkg of affected) {
      const ranges = pkg.ranges || [];
      for (const range of ranges) {
        const events = range.events || [];
        for (const event of events) {
          if (event.introduced) versions.push(`>=${event.introduced}`);
          if (event.fixed) versions.push(`<${event.fixed}`);
        }
      }
    }
    
    return [...new Set(versions)];
  }

  /**
   * Build OSV vulnerability URL
   */
  private buildOSVUrl(id: string): string {
    return `https://osv.dev/vulnerability/${id}`;
  }
}