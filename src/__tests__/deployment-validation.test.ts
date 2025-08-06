import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Get the actual project root directory
const projectRoot = path.resolve(__dirname, '../..');

describe('Deployment Validation', () => {
  it('should validate CommonJS compatibility for Netlify', () => {
    // Build the project
    execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' });
    
    // Read the compiled output
    const distPath = path.join(projectRoot, 'dist', 'index.js');
    const compiledCode = fs.readFileSync(distPath, 'utf8');
    
    // Verify CommonJS exports are used (TypeScript compiled format)
    expect(compiledCode).toContain('Object.defineProperty(exports, "__esModule"');
    expect(compiledCode).toContain('require(');
    expect(compiledCode).not.toContain('export default');
    expect(compiledCode).not.toContain('export {');
  });

  it('should validate package.json has no ES module type', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
    );
    
    // Critical: Ensure no "type": "module" that would break .cjs files
    expect(packageJson.type).toBeUndefined();
  });

  it('should validate Netlify function syntax is CommonJS', () => {
    const functionPath = path.join(projectRoot, 'netlify', 'functions', 'npmplus-mcp.cjs');
    const functionCode = fs.readFileSync(functionPath, 'utf8');
    
    // Verify CommonJS exports
    expect(functionCode).toContain('exports.handler');
    expect(functionCode).not.toContain('export default');
    expect(functionCode).not.toContain('export {');
  });

  it('should validate tsconfig outputs CommonJS', () => {
    const tsConfig = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'tsconfig.json'), 'utf8')
    );
    
    expect(tsConfig.compilerOptions.module).toBe('CommonJS');
  });
});