#!/usr/bin/env node

/**
 * Post-build script to fix TypeScript declaration exports
 * 
 * pkgroll generates `export { functionName as default }` which creates
 * dual package compatibility issues. This script converts it to the
 * proper `export = functionName` format.
 */

const fs = require('node:fs');
const path = require('node:path');

const dtsFile = path.join(__dirname, 'dist', 'index.d.ts');

try {
  let content = fs.readFileSync(dtsFile, 'utf8');
  
  // Replace the problematic export pattern with the proper one
  content = content.replace(
    /export \{ esbuildPluginPino as default \};/,
    'export = esbuildPluginPino;'
  );
  
  fs.writeFileSync(dtsFile, content);
  console.log('✅ Fixed TypeScript declaration exports for dual package compatibility');
} catch (error) {
  console.error('❌ Error fixing TypeScript declarations:', error.message);
  process.exit(1);
}