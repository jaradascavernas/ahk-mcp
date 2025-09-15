import { AhkAnalyzeTool } from './dist/tools/ahk-analyze.js';

console.log('🎯 TESTING ENHANCED AUTOHOTKEY V2 SYNTAX DETECTION\n');

const analyzer = new AhkAnalyzeTool();

// Test 1: Object Literal Detection
console.log('=== TEST 1: Object Literal Detection ===');
const test1 = `config = {name: "MyApp", version: "1.0"}`;

analyzer.execute({ code: test1 }).then(result => {
    const output = result.content[0].text;
    const enhancedSection = output.split('## ⚠️ AutoHotkey v2 Syntax Issues (Enhanced Detection)')[1];
    if (enhancedSection) {
        console.log('✅ OBJECT LITERAL DETECTED:');
        console.log(enhancedSection.split('##')[0].trim());
    } else {
        console.log('❌ Enhanced detection not found in output');
    }
    console.log('\n');

    // Test 2: Multiple Issues
    console.log('=== TEST 2: Multiple v2 Issues ===');
    const test2 = `// Bad comment
myArray = new Array()
MsgBox Hello World`;

    return analyzer.execute({ code: test2 });
}).then(result => {
    const output = result.content[0].text;
    const enhancedSection = output.split('## ⚠️ AutoHotkey v2 Syntax Issues (Enhanced Detection)')[1];
    if (enhancedSection) {
        console.log('✅ MULTIPLE ISSUES DETECTED:');
        const issues = enhancedSection.split('##')[0].trim();
        const issueCount = (issues.match(/- \*\*Line/g) || []).length;
        console.log(`Found ${issueCount} enhanced syntax issues:`);
        console.log(issues.substring(0, 500) + '...');
    } else {
        console.log('❌ Enhanced detection not found in output');
    }
}).catch(error => {
    console.error('Error:', error);
});