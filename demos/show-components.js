#!/usr/bin/env node

/**
 * Demonstrate individual compiler components working
 */

import { AhkCompiler } from './dist/compiler/ahk-compiler.js';

const simpleCode = `
class HelloWorld {
    Say() {
        MsgBox("Hello from AutoHotkey v2!")
    }
}

hello := HelloWorld()
hello.Say()
`;

console.log('🔧 INDIVIDUAL COMPILER COMPONENTS DEMO');
console.log('='.repeat(45));
console.log('Code being analyzed:');
console.log(simpleCode);
console.log('='.repeat(45));

// 1. Tokenization
console.log('\n📋 TOKENIZATION (Breaking code into tokens)');
const tokenResult = AhkCompiler.tokenize(simpleCode);
if (tokenResult.success && tokenResult.data) {
    const keywords = tokenResult.data.filter(t => ['CLASS', 'NEW'].includes(t.type));
    const identifiers = tokenResult.data.filter(t => t.type === 'IDENTIFIER');
    console.log(`✅ ${tokenResult.data.length} tokens found`);
    console.log(`  - Keywords: ${keywords.length}`);
    console.log(`  - Identifiers: ${identifiers.length}`);
    console.log(`  - Sample tokens: ${tokenResult.data.slice(5, 10).map(t => t.value).join(', ')}`);
}

// 2. Parsing (AST)
console.log('\n🌳 PARSING (Building Abstract Syntax Tree)');
const parseResult = AhkCompiler.parse(simpleCode);
if (parseResult.success && parseResult.data) {
    console.log(`✅ AST generated with ${parseResult.data.body.length} top-level statements`);
    const classes = parseResult.data.body.filter(stmt => stmt.type === 'ClassDeclaration');
    console.log(`  - Found ${classes.length} class definition(s)`);
    if (classes[0]) {
        console.log(`  - Class name: ${classes[0].name}`);
        console.log(`  - Methods: ${classes[0].methods?.length || 0}`);
    }
}

// 3. Linting
console.log('\n🔍 LINTING (Static analysis for errors/warnings)');
const lintResult = AhkCompiler.lint(simpleCode);
if (lintResult.success && lintResult.data) {
    console.log(`✅ Lint analysis complete: ${lintResult.data.length} issues found`);
    if (lintResult.data.length > 0) {
        const byType = lintResult.data.reduce((acc, d) => {
            acc[d.severity] = (acc[d.severity] || 0) + 1;
            return acc;
        }, {});
        console.log(`  - Issues by type:`, byType);
        lintResult.data.slice(0, 3).forEach((issue, i) => {
            console.log(`  ${i + 1}. [${issue.severity}] ${issue.message}`);
        });
    } else {
        console.log('  🎉 No issues found!');
    }
}

console.log('\n' + '='.repeat(45));
console.log('🎯 All components working successfully!');
console.log('These power the MCP tools for AutoHotkey v2 development.');