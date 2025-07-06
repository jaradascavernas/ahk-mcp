import { CompletionItemKind } from '../types/index.js';
import { getAhkIndex, searchFunctions, searchClasses, searchVariables } from '../core/loader.js';
import { AhkParser } from '../core/parser.js';
import logger from '../logger.js';
export class AhkCompletionProvider {
    constructor() {
        this.parser = new AhkParser('');
    }
    /**
     * Get completions for the given code and position
     */
    async getCompletions(code, position) {
        try {
            this.parser = new AhkParser(code);
            const context = this.analyzeContext(code, position);
            logger.debug(`Completion context: ${context.type}, prefix: "${context.prefix}"`);
            switch (context.type) {
                case 'function-call':
                    return this.getFunctionCompletions(context.prefix);
                case 'variable-access':
                    return this.getVariableCompletions(context.prefix);
                case 'class-member':
                    return this.getClassMemberCompletions(context.className || '', context.prefix);
                case 'directive':
                    return this.getDirectiveCompletions(context.prefix);
                case 'hotkey':
                    return this.getHotkeyCompletions(context.prefix);
                default:
                    return this.getGlobalCompletions(context.prefix);
            }
        }
        catch (error) {
            logger.error('Error getting completions:', error);
            return [];
        }
    }
    /**
     * Analyze the context at the cursor position
     */
    analyzeContext(code, position) {
        const lines = code.split('\n');
        const line = lines[position.line] || '';
        const beforeCursor = line.substring(0, position.character);
        // Extract current word/prefix
        const wordMatch = beforeCursor.match(/(\w+)$/);
        const prefix = wordMatch ? wordMatch[1] : '';
        // Determine context type
        if (this.isDirectiveContext(beforeCursor)) {
            return {
                type: 'directive',
                prefix,
                line,
                position
            };
        }
        if (this.isHotkeyContext(line)) {
            return {
                type: 'hotkey',
                prefix,
                line,
                position
            };
        }
        const classMemberMatch = beforeCursor.match(/(\w+)\.(\w*)$/);
        if (classMemberMatch) {
            return {
                type: 'class-member',
                prefix: classMemberMatch[2],
                className: classMemberMatch[1],
                line,
                position
            };
        }
        if (this.isFunctionCallContext(beforeCursor)) {
            return {
                type: 'function-call',
                prefix,
                line,
                position
            };
        }
        if (this.isVariableContext(beforeCursor)) {
            return {
                type: 'variable-access',
                prefix,
                line,
                position
            };
        }
        return {
            type: 'global',
            prefix,
            line,
            position
        };
    }
    isDirectiveContext(beforeCursor) {
        return beforeCursor.trim().startsWith('#');
    }
    isHotkeyContext(line) {
        return line.includes('::') && !line.trim().startsWith(';');
    }
    isFunctionCallContext(beforeCursor) {
        // Check if we're in a function call context
        return /\w+\s*\(\s*\w*$/.test(beforeCursor);
    }
    isVariableContext(beforeCursor) {
        // Check if we're accessing a variable
        return /\b\w+$/.test(beforeCursor) && !beforeCursor.includes('(');
    }
    /**
     * Get function completions
     */
    getFunctionCompletions(prefix) {
        const functions = searchFunctions(prefix);
        return functions.map(func => ({
            label: func.Name,
            kind: CompletionItemKind.Function,
            detail: func.Category,
            documentation: func.Description,
            insertText: this.formatFunctionInsertText(func),
            sortText: `0_${func.Name}`
        }));
    }
    /**
     * Get variable completions
     */
    getVariableCompletions(prefix) {
        const variables = searchVariables(prefix);
        return variables.map(variable => ({
            label: variable.Name,
            kind: CompletionItemKind.Variable,
            detail: `${variable.Type} - ${variable.Category}`,
            documentation: variable.Description,
            insertText: variable.Name,
            sortText: `1_${variable.Name}`
        }));
    }
    /**
     * Get class member completions
     */
    getClassMemberCompletions(className, prefix) {
        const index = getAhkIndex();
        if (!index)
            return [];
        const completions = [];
        // Find the class
        const ahkClass = index.classes.find(cls => cls.Name.toLowerCase() === className.toLowerCase());
        if (ahkClass) {
            // Add methods
            if (ahkClass.Methods) {
                ahkClass.Methods.forEach(method => {
                    if (method.Name.toLowerCase().includes(prefix.toLowerCase())) {
                        completions.push({
                            label: method.Name,
                            kind: CompletionItemKind.Method,
                            detail: `Method - ${method.Description}`,
                            documentation: this.formatMethodDocumentation(method),
                            insertText: this.formatMethodInsertText(method),
                            sortText: `0_${method.Name}`
                        });
                    }
                });
            }
            // Add properties
            if (ahkClass.Properties) {
                ahkClass.Properties.forEach(prop => {
                    if (prop.Name.toLowerCase().includes(prefix.toLowerCase())) {
                        completions.push({
                            label: prop.Name,
                            kind: CompletionItemKind.Property,
                            detail: `Property - ${prop.Type || 'Unknown'}`,
                            documentation: prop.Description,
                            insertText: prop.Name,
                            sortText: `1_${prop.Name}`
                        });
                    }
                });
            }
        }
        return completions;
    }
    /**
     * Get directive completions
     */
    getDirectiveCompletions(prefix) {
        const index = getAhkIndex();
        if (!index)
            return [];
        return index.directives
            .filter(directive => directive.Name.toLowerCase().includes(prefix.toLowerCase()))
            .map(directive => ({
            label: directive.Name,
            kind: CompletionItemKind.Keyword,
            detail: directive.Category,
            documentation: directive.Description,
            insertText: directive.Name,
            sortText: `0_${directive.Name}`
        }));
    }
    /**
     * Get hotkey completions
     */
    getHotkeyCompletions(prefix) {
        const commonHotkeys = [
            { key: 'F1', description: 'Function key F1' },
            { key: 'F2', description: 'Function key F2' },
            { key: 'F3', description: 'Function key F3' },
            { key: 'F4', description: 'Function key F4' },
            { key: 'F5', description: 'Function key F5' },
            { key: 'F6', description: 'Function key F6' },
            { key: 'F7', description: 'Function key F7' },
            { key: 'F8', description: 'Function key F8' },
            { key: 'F9', description: 'Function key F9' },
            { key: 'F10', description: 'Function key F10' },
            { key: 'F11', description: 'Function key F11' },
            { key: 'F12', description: 'Function key F12' },
            { key: 'Ctrl', description: 'Control modifier (^)' },
            { key: 'Alt', description: 'Alt modifier (!)' },
            { key: 'Shift', description: 'Shift modifier (+)' },
            { key: 'Win', description: 'Windows modifier (#)' }
        ];
        return commonHotkeys
            .filter(hotkey => hotkey.key.toLowerCase().includes(prefix.toLowerCase()))
            .map(hotkey => ({
            label: hotkey.key,
            kind: CompletionItemKind.Keyword,
            detail: 'Hotkey',
            documentation: hotkey.description,
            insertText: hotkey.key,
            sortText: `0_${hotkey.key}`
        }));
    }
    /**
     * Get global completions (functions, variables, classes, etc.)
     */
    getGlobalCompletions(prefix) {
        const completions = [];
        // Add function completions
        completions.push(...this.getFunctionCompletions(prefix));
        // Add variable completions
        completions.push(...this.getVariableCompletions(prefix));
        // Add class completions
        const classes = searchClasses(prefix);
        classes.forEach(cls => {
            completions.push({
                label: cls.Name,
                kind: CompletionItemKind.Class,
                detail: cls.Category,
                documentation: cls.Description,
                insertText: `${cls.Name}()`,
                sortText: `2_${cls.Name}`
            });
        });
        // Add keywords
        const keywords = [
            'if', 'else', 'while', 'for', 'loop', 'break', 'continue',
            'return', 'try', 'catch', 'throw', 'class', 'extends',
            'static', 'global', 'local'
        ];
        keywords
            .filter(keyword => keyword.includes(prefix.toLowerCase()))
            .forEach(keyword => {
            completions.push({
                label: keyword,
                kind: CompletionItemKind.Keyword,
                detail: 'Keyword',
                documentation: `AutoHotkey v2 keyword: ${keyword}`,
                insertText: keyword,
                sortText: `3_${keyword}`
            });
        });
        return completions;
    }
    /**
     * Format function insert text with parameters
     */
    formatFunctionInsertText(func) {
        if (!func.Parameters || func.Parameters.length === 0) {
            return `${func.Name}()`;
        }
        const params = func.Parameters.map((param, index) => {
            const placeholder = param.Optional ? `\${${index + 1}:${param.Name}}` : `\${${index + 1}:${param.Name}}`;
            return placeholder;
        }).join(', ');
        return `${func.Name}(${params})`;
    }
    /**
     * Format method insert text with parameters
     */
    formatMethodInsertText(method) {
        if (!method.Parameters || method.Parameters.length === 0) {
            return `${method.Name}()`;
        }
        const params = method.Parameters.map((param, index) => {
            return `\${${index + 1}:${param.Name}}`;
        }).join(', ');
        return `${method.Name}(${params})`;
    }
    /**
     * Format method documentation
     */
    formatMethodDocumentation(method) {
        let doc = method.Description || '';
        if (method.Parameters && method.Parameters.length > 0) {
            doc += '\n\nParameters:\n';
            method.Parameters.forEach((param) => {
                doc += `- ${param.Name}: ${param.Description || 'No description'}\n`;
            });
        }
        if (method.ReturnType) {
            doc += `\nReturns: ${method.ReturnType}`;
        }
        return doc;
    }
}
