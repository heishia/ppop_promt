#!/usr/bin/env node

/**
 * Setup Release Script
 * 
 * This script sets up the git alias for the release command.
 * Run this once to enable 'git release' command.
 */

const { execSync } = require('child_process');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
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
  log(message, 'green');
}

function info(message) {
  log(message, 'cyan');
}

function warn(message) {
  log(message, 'yellow');
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
  } catch (err) {
    if (options.ignoreError) {
      return null;
    }
    error(`Failed to execute: ${command}\n${err.message}`);
  }
}

function checkGitRepository() {
  try {
    execCommand('git rev-parse --git-dir', { silent: true });
    return true;
  } catch {
    return false;
  }
}

function setupGitAlias() {
  info('Setting up git alias for release command...');
  
  // Check if alias already exists
  const existingAlias = execCommand('git config --local alias.release', { 
    silent: true, 
    ignoreError: true 
  });

  if (existingAlias && existingAlias.trim()) {
    warn('Git alias "release" already exists:');
    console.log(`  ${existingAlias.trim()}`);
    console.log('');
    warn('Overwriting with new configuration...');
  }

  // Set the git alias
  const scriptPath = path.join('scripts', 'release.js').replace(/\\/g, '/');
  execCommand(`git config --local alias.release "!node ${scriptPath}"`);
  
  success('Git alias configured successfully!');
}

function verifySetup() {
  info('Verifying setup...');
  
  const alias = execCommand('git config --local alias.release', { silent: true });
  
  if (alias && alias.trim()) {
    success('Verification passed!');
    return true;
  } else {
    error('Verification failed. Alias was not set correctly.');
    return false;
  }
}

function main() {
  console.log('');
  log('='.repeat(60), 'bright');
  log('  PPOP_PROMT RELEASE SETUP', 'bright');
  log('='.repeat(60), 'bright');
  console.log('');

  // Check if we're in a git repository
  if (!checkGitRepository()) {
    error('Not a git repository. Please run this script from the project root.');
  }

  // Setup git alias
  setupGitAlias();
  console.log('');

  // Verify setup
  verifySetup();
  console.log('');

  log('='.repeat(60), 'bright');
  success('Setup completed successfully!');
  log('='.repeat(60), 'bright');
  console.log('');
  
  info('You can now use the following command to create a release:');
  console.log('');
  log('  git release', 'bright');
  console.log('');
  info('This will:');
  console.log('  1. Prompt you to select version bump type (patch/minor/major)');
  console.log('  2. Update package.json version');
  console.log('  3. Create git commit and tag');
  console.log('  4. Push to GitHub');
  console.log('  5. Trigger GitHub Actions to build and publish');
  console.log('');
}

// Run the script
main();

