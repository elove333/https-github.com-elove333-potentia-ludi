#!/usr/bin/env node

/**
 * Validate JSON files in the repository
 * This script checks that all JSON files have valid syntax
 */

const fs = require('fs');
const path = require('path');

const jsonFiles = [
  'package.json',
  'vercel.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'tsconfig.api.json'
];

let hasErrors = false;

console.log('Validating JSON files...\n');

jsonFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${file}: File not found (skipping)`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    console.log(`✓ ${file}: Valid JSON`);
  } catch (error) {
    hasErrors = true;
    console.error(`✗ ${file}: ${error.message}`);
    
    // Only try to show context for SyntaxError from JSON.parse
    if (error instanceof SyntaxError) {
      const errorPosition = error.message.match(/position (\d+)/);
      if (errorPosition) {
        try {
          // Re-read file to show error context
          const content = fs.readFileSync(filePath, 'utf8');
          const pos = parseInt(errorPosition[1], 10);
          const context = content.substring(Math.max(0, pos - 50), Math.min(content.length, pos + 50));
          console.error(`   Context: ...${context}...`);
        } catch (readError) {
          // Ignore errors when trying to show context
        }
      }
    }
  }
});

console.log();

if (hasErrors) {
  console.error('❌ JSON validation failed!');
  process.exit(1);
} else {
  console.log('✅ All JSON files are valid!');
  process.exit(0);
}
