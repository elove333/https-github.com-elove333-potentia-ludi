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
    
    if (error instanceof SyntaxError) {
      // Try to provide more context about the error
      const lines = content.split('\n');
      const errorPosition = error.message.match(/position (\d+)/);
      if (errorPosition) {
        const pos = parseInt(errorPosition[1], 10);
        const context = content.substring(Math.max(0, pos - 50), Math.min(content.length, pos + 50));
        console.error(`   Context: ...${context}...`);
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
