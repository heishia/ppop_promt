#!/usr/bin/env node

/**
 * Release Automation Script
 * 
 * This script automates the release process:
 * 1. Prompts user for version bump type (patch/minor/major)
 * 2. Updates version in package.json
 * 3. Creates git commit and tag
 * 4. Pushes to GitHub (triggers GitHub Actions)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// ANSI color codes for terminal output
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
    error(`Failed to execute: ${command}\n${err.message}`);
  }
}

function checkGitStatus() {
  info('Checking git status...');
  
  // Check if git is initialized
  try {
    execCommand('git rev-parse --git-dir', { silent: true });
  } catch {
    error('Not a git repository. Please initialize git first.');
  }

  // Check for uncommitted changes
  const status = execCommand('git status --porcelain', { silent: true });
  if (status.trim()) {
    warn('You have uncommitted changes:');
    console.log(status);
    error('Please commit or stash your changes before releasing.');
  }

  // Check current branch
  const branch = execCommand('git branch --show-current', { silent: true }).trim();
  if (branch !== 'main' && branch !== 'master') {
    warn(`Current branch: ${branch}`);
    warn('It is recommended to release from main/master branch.');
  }

  success('Git status check passed.');
}

function getCurrentVersion() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    error('package.json not found in current directory.');
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

function bumpVersion(currentVersion, bumpType) {
  const parts = currentVersion.split('.').map(Number);
  
  switch (bumpType) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
      parts[2]++;
      break;
    default:
      error(`Invalid bump type: ${bumpType}`);
  }

  return parts.join('.');
}

function updatePackageVersion(newVersion) {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  packageJson.version = newVersion;
  
  fs.writeFileSync(
    packageJsonPath, 
    JSON.stringify(packageJson, null, 2) + '\n',
    'utf8'
  );
  
  success(`Updated package.json to version ${newVersion}`);
}

function createGitCommitAndTag(version) {
  info('Creating git commit and tag...');
  
  // Stage package.json
  execCommand('git add package.json');
  
  // Create commit
  execCommand(`git commit -m "chore: release v${version}"`);
  
  // Create tag
  execCommand(`git tag -a v${version} -m "Release v${version}"`);
  
  success(`Created commit and tag for v${version}`);
}

function pushToGitHub() {
  info('Pushing to GitHub...');
  
  // Push commits
  execCommand('git push');
  
  // Push tags
  execCommand('git push --tags');
  
  success('Pushed to GitHub successfully!');
}

function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  console.log('');
  log('='.repeat(60), 'bright');
  log('  PPOP_PROMT RELEASE AUTOMATION', 'bright');
  log('='.repeat(60), 'bright');
  console.log('');

  // Step 1: Check git status
  checkGitStatus();
  console.log('');

  // Step 2: Get current version
  const currentVersion = getCurrentVersion();
  info(`Current version: ${currentVersion}`);
  console.log('');

  // Step 3: Prompt for version bump type
  log('Select version bump type:', 'bright');
  console.log('  1) patch - Bug fixes (1.0.0 -> 1.0.1)');
  console.log('  2) minor - New features (1.0.0 -> 1.1.0)');
  console.log('  3) major - Breaking changes (1.0.0 -> 2.0.0)');
  console.log('');

  const answer = await promptUser('Enter your choice (1/2/3 or patch/minor/major): ');
  
  let bumpType;
  if (answer === '1' || answer === 'patch') {
    bumpType = 'patch';
  } else if (answer === '2' || answer === 'minor') {
    bumpType = 'minor';
  } else if (answer === '3' || answer === 'major') {
    bumpType = 'major';
  } else {
    error('Invalid choice. Please run the script again.');
  }

  // Step 4: Calculate new version
  const newVersion = bumpVersion(currentVersion, bumpType);
  console.log('');
  info(`New version will be: ${newVersion}`);
  console.log('');

  // Step 5: Confirm
  const confirm = await promptUser(`Proceed with release v${newVersion}? (y/n): `);
  if (confirm !== 'y' && confirm !== 'yes') {
    warn('Release cancelled.');
    process.exit(0);
  }

  console.log('');
  log('Starting release process...', 'bright');
  console.log('');

  // Step 6: Update package.json
  updatePackageVersion(newVersion);

  // Step 7: Create git commit and tag
  createGitCommitAndTag(newVersion);

  // Step 8: Push to GitHub
  pushToGitHub();

  console.log('');
  log('='.repeat(60), 'bright');
  success(`Release v${newVersion} completed successfully!`);
  log('='.repeat(60), 'bright');
  console.log('');
  info('GitHub Actions will now build and publish the release.');
  info(`Check progress at: https://github.com/heishia/ppop_promt/actions`);
  console.log('');
}

// Run the script
main().catch((err) => {
  error(`Unexpected error: ${err.message}`);
});

