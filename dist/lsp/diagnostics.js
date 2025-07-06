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
     * Check syntax errors
     */
    checkSyntax(code) {
        const diagnostics = [];
        const lines = code.split('\n');
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const lineNumber = lineIndex;
            // Check for common syntax errors
            const syntaxErrors = this.checkLineSyntax(line, lineNumber);
            diagnostics.push(...syntaxErrors);
        }
        return diagnostics;
    }
    /**
     * Check syntax errors in a single line
     */
    checkLineSyntax(line, lineNumber) {
        const diagnostics = [];
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith(';')) {
            return diagnostics; // Skip empty lines and comments
        }
        // Check for unmatched brackets
        const bracketErrors = this.checkUnmatchedBrackets(line, lineNumber);
        diagnostics.push(...bracketErrors);
        // Check for invalid function syntax
        const functionErrors = this.checkFunctionSyntax(line, lineNumber);
        diagnostics.push(...functionErrors);
        // Check for invalid variable declarations
        const variableErrors = this.checkVariableSyntax(line, lineNumber);
        diagnostics.push(...variableErrors);
        // Check for invalid hotkey syntax
        const hotkeyErrors = this.checkHotkeySyntax(line, lineNumber);
        diagnostics.push(...hotkeyErrors);
        return diagnostics;
    }
    /**
     * Check for unmatched brackets
     */
    checkUnmatchedBrackets(line, lineNumber) {
        const diagnostics = [];
        let openBrackets = 0;
        let openParens = 0;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            switch (char) {
                case '{':
                    openBrackets++;
                    break;
                case '}':
                    openBrackets--;
                    if (openBrackets < 0) {
                        diagnostics.push(this.createDiagnostic('Unmatched closing brace', lineNumber, i, i + 1, DiagnosticSeverity.Error));
                    }
                    break;
                case '(':
                    openParens++;
                    break;
                case ')':
                    openParens--;
                    if (openParens < 0) {
                        diagnostics.push(this.createDiagnostic('Unmatched closing parenthesis', lineNumber, i, i + 1, DiagnosticSeverity.Error));
                    }
                    break;
            }
        }
        return diagnostics;
    }
    /**
     * Check function syntax
     */
    checkFunctionSyntax(line, lineNumber) {
        const diagnostics = [];
        const trimmedLine = line.trim();
        // Check for function declaration patterns
        const functionPattern = /^(\w+)\s*\([^)]*\)\s*\{?$/;
        const match = trimmedLine.match(functionPattern);
        if (match) {
            const functionName = match[1];
            // Check if function name starts with uppercase (AHK v2 convention)
            if (functionName[0] !== functionName[0].toUpperCase()) {
                diagnostics.push(this.createDiagnostic('Function names should start with uppercase letter in AutoHotkey v2', lineNumber, line.indexOf(functionName), line.indexOf(functionName) + functionName.length, DiagnosticSeverity.Warning));
            }
        }
        return diagnostics;
    }
    /**
     * Check variable syntax
     */
    checkVariableSyntax(line, lineNumber) {
        const diagnostics = [];
        const trimmedLine = line.trim();
        // Check for assignment patterns
        const assignmentPattern = /^(\w+)\s*([:=]|[+\-*\/]?=)\s*(.+)$/;
        const match = trimmedLine.match(assignmentPattern);
        if (match) {
            const varName = match[1];
            const operator = match[2];
            // Check for incorrect assignment operator
            if (operator === '=' && !trimmedLine.includes('==')) {
                diagnostics.push(this.createDiagnostic('Use ":=" for assignment, "=" for comparison in AutoHotkey v2', lineNumber, line.indexOf('='), line.indexOf('=') + 1, DiagnosticSeverity.Error));
            }
        }
        return diagnostics;
    }
    /**
     * Check hotkey syntax
     */
    checkHotkeySyntax(line, lineNumber) {
        const diagnostics = [];
        const trimmedLine = line.trim();
        if (trimmedLine.includes('::')) {
            const parts = trimmedLine.split('::');
            const hotkey = parts[0].trim();
            // Basic hotkey validation
            if (!hotkey) {
                diagnostics.push(this.createDiagnostic('Empty hotkey definition', lineNumber, 0, line.indexOf('::'), DiagnosticSeverity.Error));
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
     * Check semantic errors
     */
    checkSemantics(code) {
        const diagnostics = [];
        try {
            const parseResult = this.parser.parse();
            // Check for undefined function calls
            diagnostics.push(...this.checkUndefinedFunctions(parseResult, code));
            // Check for unused variables
            diagnostics.push(...this.checkUnusedVariables(parseResult, code));
            // Check for duplicate function definitions
            diagnostics.push(...this.checkDuplicateDefinitions(parseResult));
        }
        catch (parseError) {
            // If parsing fails, create a diagnostic for the parse error
            diagnostics.push(this.createDiagnostic(`Parse error: ${parseError}`, 0, 0, 1, DiagnosticSeverity.Error));
        }
        return diagnostics;
    }
    /**
     * Check for undefined function calls
     */
    checkUndefinedFunctions(parseResult, code) {
        const diagnostics = [];
        // TODO: Implement function call analysis
        return diagnostics;
    }
    /**
     * Check for unused variables
     */
    checkUnusedVariables(parseResult, code) {
        const diagnostics = [];
        // TODO: Implement variable usage analysis
        return diagnostics;
    }
    /**
     * Check for duplicate definitions
     */
    checkDuplicateDefinitions(parseResult) {
        const diagnostics = [];
        // Check for duplicate function names
        const functionNames = new Map();
        parseResult.functions.forEach((func) => {
            const lowerName = func.name.toLowerCase();
            if (functionNames.has(lowerName)) {
                const original = functionNames.get(lowerName);
                diagnostics.push(this.createDiagnostic(`Duplicate function definition: ${func.name} (first defined at line ${original.line + 1})`, func.line, 0, func.name.length, DiagnosticSeverity.Error));
            }
            else {
                functionNames.set(lowerName, func);
            }
        });
        // Check for duplicate class names
        const classNames = new Map();
        parseResult.classes.forEach((cls) => {
            const lowerName = cls.name.toLowerCase();
            if (classNames.has(lowerName)) {
                const original = classNames.get(lowerName);
                diagnostics.push(this.createDiagnostic(`Duplicate class definition: ${cls.name} (first defined at line ${original.line + 1})`, cls.line, 0, cls.name.length, DiagnosticSeverity.Error));
            }
            else {
                classNames.set(lowerName, cls);
            }
        });
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
