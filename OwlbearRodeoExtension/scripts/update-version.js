#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get git information
function getGitInfo() {
  try {
    // Get commit count
    const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();

    // Get short commit hash
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();

    // Get branch name
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

    return {
      commitCount: parseInt(commitCount),
      commitHash,
      branch
    };
  } catch (error) {
    console.warn('Git information not available, using fallback version');
    return {
      commitCount: 0,
      commitHash: 'dev',
      branch: 'unknown'
    };
  }
}

// Generate version string
function generateVersion(gitInfo, packageVersion, isProduction = false) {
  const { commitCount, commitHash, branch } = gitInfo;

  // For production deployments (GitHub Pages), always use clean semantic versions
  if (isProduction) {
    if (packageVersion && packageVersion !== '0.0.0') {
      return packageVersion;
    }
    // Default production version
    return '1.0.0';
  }

  // If we have a package.json version, use it as base
  if (packageVersion && packageVersion !== '0.0.0') {
    // For main/master branch, use the package version with build info
    if (branch === 'main' || branch === 'master') {
      return `${packageVersion}+${commitHash}`;
    }

    // For other branches, use package version with branch suffix (but clean for Owlbear)
    return packageVersion; // Just use the base version for development
  }

  // Fallback for when no package version is set
  if (branch === 'main' || branch === 'master') {
    const major = 1;
    const minor = Math.floor(commitCount / 100);
    const patch = commitCount % 100;
    return `${major}.${minor}.${patch}`;
  }

  // For development branches, use a simple version
  return '0.1.0';
}

// Get package.json version
function getPackageVersion() {
  try {
    const packagePath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    return null;
  }
}

// Increment patch version in package.json
function incrementPatchVersion() {
  try {
    const packagePath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    const currentVersion = packageJson.version;

    // Parse version (assuming semver format x.y.z)
    const versionParts = currentVersion.split('.');
    if (versionParts.length === 3) {
      const patch = parseInt(versionParts[2]) + 1;
      const newVersion = `${versionParts[0]}.${versionParts[1]}.${patch}`;

      packageJson.version = newVersion;
      writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

      console.log(`📦 Incremented package version: ${currentVersion} → ${newVersion}`);
      return newVersion;
    }

    console.warn('⚠️  Could not parse version format, keeping current version');
    return currentVersion;
  } catch (error) {
    console.error('❌ Failed to increment package version:', error.message);
    return null;
  }
}

// Update manifest.json
function updateManifest(version) {
  const manifestPath = join(__dirname, '..', 'public', 'manifest.json');

  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const oldVersion = manifest.version;

    manifest.version = version;

    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

    console.log(`✅ Updated manifest version: ${oldVersion} → ${version}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to update manifest:', error.message);
    return false;
  }
}

// Main execution
function main() {
  console.log('🔄 Updating extension version...');

  // Always increment patch version on build
  const packageVersion = incrementPatchVersion() || getPackageVersion();

  const gitInfo = getGitInfo();
  const isProduction = process.env.NODE_ENV === 'production' ||
                      process.argv.includes('--production') ||
                      process.cwd().includes('docs'); // If we're in docs folder

  const newVersion = generateVersion(gitInfo, packageVersion, isProduction);

  console.log(`📦 Package version: ${packageVersion || 'none'}`);
  console.log(`📊 Git info: ${gitInfo.commitCount} commits, ${gitInfo.commitHash} on ${gitInfo.branch}`);
  console.log(`🏭 Build mode: ${isProduction ? 'production' : 'development'}`);
  console.log(`🏷️  Generated version: ${newVersion}`);

  const success = updateManifest(newVersion);

  if (success) {
    console.log('✨ Version update complete!');
  } else {
    process.exit(1);
  }
}

main();
