import { DiagnosticSeverity } from '../types/index.js';
import { AhkParser } from '../core/parser.js';
import { ClaudeStandardsEngine } from '../core/claude-standards.js';
import logger from '../logger.js';
export class AhkDiagnosticProvider {
    constructor() {
        this.parser = new AhkParser('');
        this.claudeStandards = new ClaudeStandardsEngine();
    }
    /**
     * Get diagnostics for the given code
     */
    async getDiagnostics(code, enableClaudeStandards = true, severityFilter) {
        try {
            this.parser = new AhkParser(code);
            const diagnostics = [];
            // Syntax analysis
            diagnostics.push(...this.checkSyntax(code));
            // Claude coding standards validation
            if (enableClaudeStandards) {
                diagnostics.push(...this.validateClaudeStandards(code));
            }
            // Semantic analysis
            diagnostics.push(...this.checkSemantics(code));
            // Filter by severity if specified
            const filteredDiagnostics = this.filterBySeverity(diagnostics, severityFilter);
            logger.debug(`Generated ${filteredDiagnostics.length} diagnostics for code (${diagnostics.length} total before filtering)`);
            return filteredDiagnostics;
        }
        catch (error) {
            logger.error('Error generating diagnostics:', error);
            return [];
        }
    }
    /**
     * Check syntax errors - improved to understand AutoHotkey v2 properly
     */
    checkSyntax(code) {
        const diagnostics = [];
        // Check overall bracket matching across the entire code
        const bracketErrors = this.checkGlobalBracketMatching(code);
        diagnostics.push(...bracketErrors);
        // Check for basic syntax issues
        const basicErrors = this.checkBasicSyntax(code);
        diagnostics.push(...basicErrors);
        return diagnostics;
    }
    /**
     * Check global bracket matching across entire code
     */
    checkGlobalBracketMatching(code) {
        const diagnostics = [];
        const lines = code.split('\n');
        let braceStack = [];
        let parenStack = [];
        let inString = false;
        let inComment = false;
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            inComment = false; // Reset comment state for each line
            for (let charIndex = 0; charIndex < line.length; charIndex++) {
                const char = line[charIndex];
                const prevChar = charIndex > 0 ? line[charIndex - 1] : '';
                // Handle comments
                if (char === ';' && !inString) {
                    inComment = true;
                    continue;
                }
                if (inComment)
                    continue;
                // Handle strings
                if (char === '"' && prevChar !== '\\') {
                    inString = !inString;
                    continue;
                }
                if (inString)
                    continue;
                // Handle brackets and parentheses
                switch (char) {
                    case '{':
                        braceStack.push({ line: lineIndex, char: charIndex });
                        break;
                    case '}':
                        if (braceStack.length === 0) {
                            diagnostics.push(this.createDiagnostic('Unmatched closing brace', lineIndex, charIndex, charIndex + 1, DiagnosticSeverity.Error));
                        }
                        else {
                            braceStack.pop();
                        }
                        break;
                    case '(':
                        parenStack.push({ line: lineIndex, char: charIndex });
                        break;
                    case ')':
                        if (parenStack.length === 0) {
                            diagnostics.push(this.createDiagnostic('Unmatched closing parenthesis', lineIndex, charIndex, charIndex + 1, DiagnosticSeverity.Error));
                        }
                        else {
                            parenStack.pop();
                        }
                        break;
                }
            }
        }
        // Check for unclosed brackets
        braceStack.forEach(brace => {
            diagnostics.push(this.createDiagnostic('Unclosed opening brace', brace.line, brace.char, brace.char + 1, DiagnosticSeverity.Error));
        });
        parenStack.forEach(paren => {
            diagnostics.push(this.createDiagnostic('Unclosed opening parenthesis', paren.line, paren.char, paren.char + 1, DiagnosticSeverity.Error));
        });
        return diagnostics;
    }
    /**
     * Check basic syntax issues
     */
    checkBasicSyntax(code) {
        const diagnostics = [];
        const lines = code.split('\n');
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith(';')) {
                continue; // Skip empty lines and comments
            }
            // Check for common AutoHotkey v2 issues
            // Check for old v1 assignment syntax
            if (trimmedLine.match(/^\w+\s*=\s*[^=]/) && !trimmedLine.includes('==') && !trimmedLine.includes('!=')) {
                const equalIndex = line.indexOf('=');
                diagnostics.push(this.createDiagnostic('Use ":=" for assignment in AutoHotkey v2, "=" is for comparison', lineIndex, equalIndex, equalIndex + 1, DiagnosticSeverity.Warning));
            }
            // Check for missing #Requires directive (only warn once at top)
            if (lineIndex < 5 && !code.includes('#Requires AutoHotkey v2')) {
                if (lineIndex === 0) {
                    diagnostics.push(this.createDiagnostic('Consider adding "#Requires AutoHotkey v2" directive at the top of your script', 0, 0, 1, DiagnosticSeverity.Information));
                }
            }
        }
        return diagnostics;
    }
    /**
     * Validate against Claude coding standards
     */
    validateClaudeStandards(code) {
        const violations = this.claudeStandards.validateCode(code);
        return violations.map(violation => {
            let severity;
            switch (violation.severity) {
                case 'error':
                    severity = DiagnosticSeverity.Error;
                    break;
                case 'warning':
                    severity = DiagnosticSeverity.Warning;
                    break;
                case 'info':
                    severity = DiagnosticSeverity.Information;
                    break;
                default:
                    severity = DiagnosticSeverity.Warning;
            }
            return this.createDiagnostic(violation.message, violation.line - 1, // Convert to 0-based
            violation.column, violation.column + 1, severity, `claude-standards.${violation.rule}`);
        });
    }
    /**
     * Check semantic errors - simplified to avoid false positives
     */
    checkSemantics(code) {
        const diagnostics = [];
        // For now, skip complex semantic analysis to avoid false positives
        // The old parser was incorrectly identifying 'if' statements as functions
        // TODO: Implement proper AutoHotkey v2 parser for semantic analysis
        return diagnostics;
    }
    /**
     * Filter diagnostics by severity
     */
    filterBySeverity(diagnostics, severityFilter) {
        if (!severityFilter || severityFilter === 'all') {
            return diagnostics;
        }
        const targetSeverity = this.getSeverityFromString(severityFilter);
        if (targetSeverity === undefined) {
            return diagnostics;
        }
        return diagnostics.filter(diagnostic => diagnostic.severity === targetSeverity);
    }
    /**
     * Convert severity string to enum
     */
    getSeverityFromString(severity) {
        switch (severity.toLowerCase()) {
            case 'error':
                return DiagnosticSeverity.Error;
            case 'warning':
                return DiagnosticSeverity.Warning;
            case 'info':
            case 'information':
                return DiagnosticSeverity.Information;
            case 'hint':
                return DiagnosticSeverity.Hint;
            default:
                return undefined;
        }
    }
    /**
     * Create a diagnostic object
     */
    createDiagnostic(message, line, startChar, endChar, severity, code) {
        const range = {
            start: { line, character: startChar },
            end: { line, character: endChar }
        };
        return {
            range,
            severity,
            message,
            code,
            source: 'ahk-server'
        };
    }
}
