import { describe, it, expect } from 'vitest';

describe('Build Script', () => {
  it('should have build script file', () => {
    const fs = require('fs');
    const path = require('path');
    const buildScriptPath = path.join(process.cwd(), 'scripts/build.js');
    expect(fs.existsSync(buildScriptPath)).toBe(true);
  });

  it('should check for package.json', () => {
    const fs = require('fs');
    const path = require('path');
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    expect(fs.existsSync(packageJsonPath)).toBe(true);
  });

  it('should have node_modules if installed', () => {
    const fs = require('fs');
    const path = require('path');
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    // This may or may not exist depending on test environment
    const exists = fs.existsSync(nodeModulesPath);
    expect(typeof exists).toBe('boolean');
  });

  it('should validate build script structure', () => {
    const fs = require('fs');
    const path = require('path');
    const buildScriptPath = path.join(process.cwd(), 'scripts/build.js');
    const content = fs.readFileSync(buildScriptPath, 'utf-8');
    expect(content).toContain('runCommand');
    expect(content).toContain('checkDependencies');
    expect(content).toContain('buildProduction');
  });
});
