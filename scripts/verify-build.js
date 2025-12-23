#!/usr/bin/env node

/**
 * Build Verification Script
 * 
 * Verifies that the build output is valid and complete:
 * - Checks if installer file exists
 * - Validates file sizes
 * - Verifies latest.yml structure
 * - Confirms version consistency
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`ERROR: ${message}`, 'red');
  process.exit(1);
}

function success(message) {
  log(`SUCCESS: ${message}`, 'green');
}

function warn(message) {
  log(`WARNING: ${message}`, 'yellow');
}

function info(message) {
  log(message, 'cyan');
}

function getPackageVersion() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    error('package.json not found');
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

function checkFileExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    error(`${description} not found: ${filePath}`);
  }
  success(`${description} exists: ${path.basename(filePath)}`);
}

function checkFileSize(filePath, minSizeMB, description) {
  const stats = fs.statSync(filePath);
  const sizeMB = stats.size / (1024 * 1024);
  
  if (sizeMB < minSizeMB) {
    error(`${description} is too small: ${sizeMB.toFixed(2)}MB (expected at least ${minSizeMB}MB)`);
  }
  
  success(`${description} size OK: ${sizeMB.toFixed(2)}MB`);
}

function verifyLatestYml(filePath, expectedVersion) {
  info('Verifying latest.yml structure...');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(content);
    
    // Check required fields
    if (!data.version) {
      error('latest.yml missing version field');
    }
    
    if (!data.files || !Array.isArray(data.files)) {
      error('latest.yml missing or invalid files field');
    }
    
    if (!data.path) {
      error('latest.yml missing path field');
    }
    
    if (!data.sha512) {
      error('latest.yml missing sha512 field');
    }
    
    if (!data.releaseDate) {
      error('latest.yml missing releaseDate field');
    }
    
    // Verify version matches
    if (data.version !== expectedVersion) {
      error(`Version mismatch: latest.yml has ${data.version}, expected ${expectedVersion}`);
    }
    
    success(`latest.yml version matches: ${data.version}`);
    
    // Verify file references
    const installerFileName = `ppop_promt Setup ${expectedVersion}.exe`;
    if (!data.path.includes(installerFileName) && !data.path.includes(installerFileName.replace(/ /g, '-'))) {
      warn(`latest.yml path may not match expected installer name: ${data.path}`);
    }
    
    success('latest.yml structure is valid');
    
  } catch (err) {
    error(`Failed to parse latest.yml: ${err.message}`);
  }
}

function main() {
  console.log('');
  log('='.repeat(60), 'cyan');
  log('  BUILD VERIFICATION', 'cyan');
  log('='.repeat(60), 'cyan');
  console.log('');

  const version = getPackageVersion();
  info(`Expected version: ${version}`);
  console.log('');

  const distDir = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(distDir)) {
    error('dist directory not found');
  }

  // Check for installer file (with or without spaces/dashes)
  const possibleInstallerNames = [
    `ppop_promt Setup ${version}.exe`,
    `ppop_promt-Setup-${version}.exe`,
    `ppop_promt_Setup_${version}.exe`
  ];
  
  let installerPath = null;
  for (const name of possibleInstallerNames) {
    const testPath = path.join(distDir, name);
    if (fs.existsSync(testPath)) {
      installerPath = testPath;
      break;
    }
  }
  
  if (!installerPath) {
    // List all .exe files in dist
    const files = fs.readdirSync(distDir);
    const exeFiles = files.filter(f => f.endsWith('.exe'));
    
    if (exeFiles.length === 0) {
      error('No installer .exe file found in dist directory');
    } else {
      warn(`Expected installer names not found. Found: ${exeFiles.join(', ')}`);
      // Use the first .exe file found
      installerPath = path.join(distDir, exeFiles[0]);
    }
  }
  
  // Verify installer
  checkFileExists(installerPath, 'Installer');
  checkFileSize(installerPath, 50, 'Installer'); // At least 50MB
  
  // Check for blockmap file
  const blockmapPath = `${installerPath}.blockmap`;
  checkFileExists(blockmapPath, 'Blockmap file');
  
  // Check for latest.yml
  const latestYmlPath = path.join(distDir, 'latest.yml');
  checkFileExists(latestYmlPath, 'latest.yml');
  
  console.log('');
  verifyLatestYml(latestYmlPath, version);
  
  console.log('');
  log('='.repeat(60), 'cyan');
  success('All build verification checks passed!');
  log('='.repeat(60), 'cyan');
  console.log('');
}

// Run verification
try {
  main();
} catch (err) {
  error(`Unexpected error: ${err.message}`);
}

