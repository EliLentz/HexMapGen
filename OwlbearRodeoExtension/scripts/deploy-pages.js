#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const rootDir = join(process.cwd(), '..');
const docsDir = join(rootDir, 'docs');

console.log('🚀 Deploying to GitHub Pages...');

// Check if we're in the extension directory
if (!existsSync('package.json')) {
  console.error('❌ Please run this script from the OwlbearRodeoExtension directory');
  process.exit(1);
}

// Build the extension
console.log('📦 Building extension...');
try {
  execSync('npm run build:pages', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Check if docs folder was created
if (!existsSync(docsDir)) {
  console.error('❌ docs folder not found. Build may have failed.');
  process.exit(1);
}

// Add and commit the docs folder
console.log('📝 Committing docs folder...');
try {
  execSync(`git add "${docsDir}"`, { cwd: rootDir, stdio: 'inherit' });

  // Check if there are changes to commit
  const status = execSync('git status --porcelain', { cwd: rootDir, encoding: 'utf8' });
  if (status.includes('docs/')) {
    execSync('git commit -m "🚀 Deploy extension to GitHub Pages"', { cwd: rootDir, stdio: 'inherit' });
    console.log('✅ Changes committed!');
    console.log('💡 Run: git push');
  } else {
    console.log('ℹ️  No changes to commit (docs folder is up to date)');
  }
} catch (error) {
  console.error('❌ Git commit failed:', error.message);
  process.exit(1);
}

console.log('🎉 Deployment preparation complete!');
console.log(`📄 Your extension manifest: ${docsDir}/manifest.json`);
console.log('🌐 Make sure GitHub Pages is enabled in your repository settings');
