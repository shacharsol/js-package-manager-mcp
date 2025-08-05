import { fetch } from 'undici';
import { URLS, NPM_ECOSYSTEM } from '../constants.js';
/**
 * Service for security vulnerability checking across multiple databases.
 * Integrates with GitHub Security Advisory and OSV (Open Source Vulnerabilities) databases
 * to provide comprehensive security analysis for npm packages.
 *
 * @class SecurityService
 * @example
 * ```typescript
 * const securityService = new SecurityService();
 *
 * // Check vulnerabilities for a package
 * const securityInfo = await securityService.checkVulnerabilities('lodash');
 *
 * if (securityInfo.hasVulnerabilities) {
 *   console.log(`Found ${securityInfo.vulnerabilities.length} vulnerabilities`);
 *   console.log(`Overall severity: ${securityInfo.severity}`);
 *
 *   securityInfo.vulnerabilities.forEach(vuln => {
 *     console.log(`- ${vuln.title} (${vuln.severity})`);
 *     console.log(`  ${vuln.overview}`);
 *     console.log(`  Fix: ${vuln.recommendation}`);
 *   });
 * }
 *
 * // Check specific version
 * const versionSecurity = await securityService.checkVulnerabilities('lodash', '4.17.20');
 * ```
 */
export class SecurityService {
    ghAdvisoryUrl;
    osvUrl;
    /**
     * Creates a new SecurityService instance with configurable vulnerability database URLs.
     *
     * @param ghAdvisoryUrl - GitHub Security Advisory API URL (default: URLS.GITHUB_ADVISORY_API)
     * @param osvUrl - OSV (Open Source Vulnerabilities) API URL (default: URLS.OSV_API)
     *
     * @example
     * ```typescript
     * // Use default endpoints
     * const security = new SecurityService();
     *
     * // Use custom endpoints (e.g., for enterprise)
     * const enterpriseSecurity = new SecurityService(
     *   'https://enterprise-github.com/api/advisories',
     *   'https://custom-osv.company.com/v1'
     * );
     * ```
     */
    constructor(ghAdvisoryUrl = URLS.GITHUB_ADVISORY_API, osvUrl = URLS.OSV_API) {
        this.ghAdvisoryUrl = ghAdvisoryUrl;
        this.osvUrl = osvUrl;
    }
    /**
     * Checks for security vulnerabilities in a specific package across multiple databases.
     * Queries both GitHub Security Advisory and OSV databases, then deduplicates and analyzes results.
     *
     * @param packageName - Name of the npm package to check
     * @param version - Specific version to check (optional, defaults to all versions)
     * @returns Promise resolving to SecurityInfo with vulnerability details and overall assessment
     *
     * @example
     * ```typescript
     * // Check latest version
     * const security = await securityService.checkVulnerabilities('lodash');
     *
     * // Check specific version
     * const oldSecurity = await securityService.checkVulnerabilities('lodash', '4.17.20');
     *
     * // Handle results
     * if (security.hasVulnerabilities) {
     *   console.log(`⚠️ ${security.vulnerabilities.length} vulnerabilities found`);
     *   console.log(`Highest severity: ${security.severity}`);
     *
     *   // Show critical vulnerabilities
     *   const critical = security.vulnerabilities.filter(v => v.severity === 'critical');
     *   if (critical.length > 0) {
     *     console.log('🚨 Critical vulnerabilities:');
     *     critical.forEach(vuln => {
     *       console.log(`  - ${vuln.title}`);
     *       console.log(`    ${vuln.recommendation}`);
     *     });
     *   }
     * } else {
     *   console.log('✅ No known vulnerabilities');
     * }
     * ```
     */
    async checkVulnerabilities(packageName, version) {
        try {
            // Check both GitHub Security Advisory and OSV databases
            const [ghVulns, osvVulns] = await Promise.allSettled([
                this.checkGitHubAdvisory(packageName, version),
                this.checkOSVDatabase(packageName, version),
            ]);
            const vulnerabilities = [];
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
        }
        catch (error) {
            throw new Error(`Failed to check vulnerabilities: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Queries the GitHub Security Advisory database for vulnerabilities affecting the specified package.
     *
     * @private
     * @param packageName - Name of the npm package to check
     * @param version - Specific version to check (optional)
     * @returns Promise resolving to array of Vulnerability objects from GitHub Advisory
     */
    async checkGitHubAdvisory(packageName, version) {
        try {
            // GitHub Advisory API query
            const params = new URLSearchParams({
                ecosystem: NPM_ECOSYSTEM,
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
            const advisories = await response.json();
            return advisories
                .filter(advisory => this.isPackageAffected(advisory, packageName, version))
                .map(advisory => this.transformGitHubAdvisory(advisory));
        }
        catch (error) {
            console.warn(`GitHub Advisory check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return [];
        }
    }
    /**
     * Queries the OSV (Open Source Vulnerabilities) database for vulnerabilities affecting the specified package.
     *
     * @private
     * @param packageName - Name of the npm package to check
     * @param version - Specific version to check (optional)
     * @returns Promise resolving to array of Vulnerability objects from OSV database
     */
    async checkOSVDatabase(packageName, version) {
        try {
            const query = {
                package: {
                    ecosystem: NPM_ECOSYSTEM,
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
            const data = await response.json();
            const vulns = data.vulns || [];
            return vulns.map((vuln) => this.transformOSVVulnerability(vuln));
        }
        catch (error) {
            console.warn(`OSV check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return [];
        }
    }
    /**
     * Check if package is affected by advisory
     */
    isPackageAffected(advisory, packageName, version) {
        const vulnerabilities = advisory.vulnerabilities || [];
        for (const vuln of vulnerabilities) {
            const affected = vuln.package?.ecosystem === NPM_ECOSYSTEM && vuln.package?.name === packageName;
            if (!affected)
                continue;
            if (!version)
                return true; // If no version specified, consider it affected
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
    isVersionInRange(version, range) {
        // Simplified version range checking
        // In production, use semver library for proper range matching
        const events = range.events || [];
        let introduced = null;
        let fixed = null;
        // Find introduced and fixed versions
        for (const event of events) {
            if (event.introduced) {
                introduced = event.introduced;
            }
            if (event.fixed) {
                fixed = event.fixed;
            }
        }
        // Check if version is in the vulnerable range
        if (introduced && this.compareVersions(version, introduced) < 0) {
            return false; // Before introduced version
        }
        if (fixed && this.compareVersions(version, fixed) >= 0) {
            return false; // After fixed version
        }
        return true; // In vulnerable range
    }
    /**
     * Simple version comparison (use semver in production)
     */
    compareVersions(a, b) {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aPart = aParts[i] || 0;
            const bPart = bParts[i] || 0;
            if (aPart < bPart)
                return -1;
            if (aPart > bPart)
                return 1;
        }
        return 0;
    }
    /**
     * Transform GitHub advisory to common format
     */
    transformGitHubAdvisory(advisory) {
        return {
            id: advisory.ghsa_id || advisory.id,
            title: advisory.summary || advisory.title,
            severity: this.mapSeverity(advisory.severity),
            url: advisory.html_url || `${URLS.GITHUB_ADVISORIES_WEBSITE}/${advisory.ghsa_id}`,
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
    transformOSVVulnerability(vuln) {
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
    mapSeverity(severity) {
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
    mapOSVSeverity(vuln) {
        // OSV uses CVSS scores, convert to severity levels
        const cvss = vuln.severity?.find((s) => s.type === 'CVSS_V3');
        if (cvss) {
            const score = parseFloat(cvss.score);
            if (score >= 9.0)
                return 'critical';
            if (score >= 7.0)
                return 'high';
            if (score >= 4.0)
                return 'moderate';
            if (score >= 0.1)
                return 'low';
        }
        return 'info';
    }
    /**
     * Calculate overall severity from multiple vulnerabilities
     */
    calculateOverallSeverity(vulnerabilities) {
        if (vulnerabilities.length === 0)
            return 'info';
        const severityOrder = ['critical', 'high', 'moderate', 'low', 'info'];
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
    deduplicateVulnerabilities(vulnerabilities) {
        const seen = new Set();
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
    extractRecommendation(advisory) {
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
    extractOSVRecommendation(vuln) {
        // OSV format recommendations
        if (vuln.database_specific?.recommendation) {
            return vuln.database_specific.recommendation;
        }
        return 'Check vulnerability details for remediation steps';
    }
    /**
     * Extract affected versions from GitHub advisory
     */
    extractAffectedVersions(advisory) {
        const versions = [];
        const vulnerabilities = advisory.vulnerabilities || [];
        for (const vuln of vulnerabilities) {
            const ranges = vuln.ranges || [];
            for (const range of ranges) {
                const events = range.events || [];
                for (const event of events) {
                    if (event.introduced)
                        versions.push(`>=${event.introduced}`);
                    if (event.fixed)
                        versions.push(`<${event.fixed}`);
                }
            }
        }
        return [...new Set(versions)]; // Remove duplicates
    }
    /**
     * Extract affected versions from OSV
     */
    extractOSVAffectedVersions(vuln) {
        const versions = [];
        const affected = vuln.affected || [];
        for (const pkg of affected) {
            const ranges = pkg.ranges || [];
            for (const range of ranges) {
                const events = range.events || [];
                for (const event of events) {
                    if (event.introduced)
                        versions.push(`>=${event.introduced}`);
                    if (event.fixed)
                        versions.push(`<${event.fixed}`);
                }
            }
        }
        return [...new Set(versions)];
    }
    /**
     * Build OSV vulnerability URL
     */
    buildOSVUrl(id) {
        return `${URLS.OSV_WEBSITE}/${id}`;
    }
}
//# sourceMappingURL=SecurityService.js.map