#!/usr/bin/env node

// Build script for production
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

function runCommand(command, description) {
  console.log(`\n${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✓ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`✗ ${description} failed:`, error.message);
    return false;
  }
}

function checkDependencies() {
  console.log('Checking dependencies...');
  const packageJson = join(process.cwd(), 'package.json');
  const nodeModules = join(process.cwd(), 'node_modules');
  
  if (!existsSync(packageJson)) {
    console.error('package.json not found');
    return false;
  }
  
  if (!existsSync(nodeModules)) {
    console.log('Installing dependencies...');
    return runCommand('npm install', 'Installing dependencies');
  }
  
  console.log('✓ Dependencies OK');
  return true;
}

function cleanBuild() {
  console.log('Cleaning build directory...');
  const distDir = join(process.cwd(), 'dist');
  
  if (existsSync(distDir)) {
    return runCommand('rm -rf dist', 'Removing dist directory');
  }
  
  console.log('✓ Build directory clean');
  return true;
}

function buildProduction() {
  return runCommand('npm run build', 'Building for production');
}

function runTests() {
  return runCommand('npm test -- --run', 'Running tests');
}

function validateBuild() {
  console.log('\nValidating build...');
  const distDir = join(process.cwd(), 'dist');
  
  if (!existsSync(distDir)) {
    console.error('✗ Build directory not found');
    return false;
  }
  
  const indexHtml = join(distDir, 'index.html');
  if (!existsSync(indexHtml)) {
    console.error('✗ index.html not found in build');
    return false;
  }
  
  console.log('✓ Build validation passed');
  return true;
}

function main() {
  console.log('=== caveshuttle Build Script ===\n');
  
  const steps = [
    { fn: checkDependencies, name: 'Dependency check' },
    { fn: runTests, name: 'Test suite' },
    { fn: cleanBuild, name: 'Build cleanup' },
    { fn: buildProduction, name: 'Production build' },
    { fn: validateBuild, name: 'Build validation' }
  ];
  
  for (const step of steps) {
    if (!step.fn()) {
      console.error(`\n✗ Build failed at: ${step.name}`);
      process.exit(1);
    }
  }
  
  console.log('\n=== Build completed successfully ===');
  process.exit(0);
}

main();
