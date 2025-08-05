import { SecurityInfo } from '../models/Package.js';
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
export declare class SecurityService {
    private readonly ghAdvisoryUrl;
    private readonly osvUrl;
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
    constructor(ghAdvisoryUrl?: string, osvUrl?: string);
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
    checkVulnerabilities(packageName: string, version?: string): Promise<SecurityInfo>;
    /**
     * Queries the GitHub Security Advisory database for vulnerabilities affecting the specified package.
     *
     * @private
     * @param packageName - Name of the npm package to check
     * @param version - Specific version to check (optional)
     * @returns Promise resolving to array of Vulnerability objects from GitHub Advisory
     */
    private checkGitHubAdvisory;
    /**
     * Queries the OSV (Open Source Vulnerabilities) database for vulnerabilities affecting the specified package.
     *
     * @private
     * @param packageName - Name of the npm package to check
     * @param version - Specific version to check (optional)
     * @returns Promise resolving to array of Vulnerability objects from OSV database
     */
    private checkOSVDatabase;
    /**
     * Check if package is affected by advisory
     */
    private isPackageAffected;
    /**
     * Check if version is in vulnerability range
     */
    private isVersionInRange;
    /**
     * Simple version comparison (use semver in production)
     */
    private compareVersions;
    /**
     * Transform GitHub advisory to common format
     */
    private transformGitHubAdvisory;
    /**
     * Transform OSV vulnerability to common format
     */
    private transformOSVVulnerability;
    /**
     * Map severity levels to common format
     */
    private mapSeverity;
    /**
     * Map OSV severity to common format
     */
    private mapOSVSeverity;
    /**
     * Calculate overall severity from multiple vulnerabilities
     */
    private calculateOverallSeverity;
    /**
     * Remove duplicate vulnerabilities based on ID
     */
    private deduplicateVulnerabilities;
    /**
     * Extract recommendation from advisory
     */
    private extractRecommendation;
    /**
     * Extract OSV recommendation
     */
    private extractOSVRecommendation;
    /**
     * Extract affected versions from GitHub advisory
     */
    private extractAffectedVersions;
    /**
     * Extract affected versions from OSV
     */
    private extractOSVAffectedVersions;
    /**
     * Build OSV vulnerability URL
     */
    private buildOSVUrl;
}
//# sourceMappingURL=SecurityService.d.ts.map