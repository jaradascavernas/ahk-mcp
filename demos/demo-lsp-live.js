#!/usr/bin/env node

/**
 * Live demo of LSP tool on real AutoHotkey code
 */

import fs from 'fs';
import { AhkLspTool } from './dist/tools/ahk-lsp.js';

// Read the actual test file we created earlier
const testFile = './test-demo.ahk';
const ahkCode = fs.readFileSync(testFile, 'utf8');

console.log('🔍 LIVE LSP DEMO on Real AutoHotkey Code');
console.log('='.repeat(55));
console.log(`📄 File: ${testFile}`);
console.log(`📏 Size: ${ahkCode.length} characters, ${ahkCode.split('\n').length} lines`);

const lspTool = new AhkLspTool();

// Run LSP analysis in fix mode
console.log('\n🔧 Running LSP Auto-Fix Analysis...\n');

try {
    const result = await lspTool.execute({
        code: ahkCode,
        mode: 'fix',
        autoFix: true,
        fixLevel: 'safe',
        enableClaudeStandards: true,
        showPerformance: true,
        returnFixedCode: true
    });

    // Show the complete LSP output
    console.log(result.content[0].text);

} catch (error) {
    console.error('❌ LSP analysis failed:', error.message);
}

console.log('\n' + '='.repeat(55));
console.log('🎉 This is how the LSP tool works:');
console.log('  1. Analyzes code like VS Code language server');
console.log('  2. Finds syntax, style, and semantic issues');
console.log('  3. Automatically applies safe fixes');
console.log('  4. Shows performance metrics and diagnostics');
console.log('  5. Returns clean code ready for use!');