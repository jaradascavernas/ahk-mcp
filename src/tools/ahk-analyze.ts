import { z } from 'zod';
import { AhkParser } from '../core/parser.js';
import { getAhkIndex } from '../core/loader.js';
import logger from '../logger.js';

export const AhkAnalyzeArgsSchema = z.object({
  code: z.string().min(1, 'AutoHotkey code is required'),
  includeDocumentation: z.boolean().optional().default(true),
  includeUsageExamples: z.boolean().optional().default(false),
  analyzeComplexity: z.boolean().optional().default(false)
});

export const ahkAnalyzeToolDefinition = {
  name: 'ahk_analyze',
  description: 'Analyzes AutoHotkey v2 scripts and provides contextual information about functions, variables, classes, and other elements used in the code.',
  inputSchema: AhkAnalyzeArgsSchema
};

export interface AnalysisResult {
  summary: {
    totalLines: number;
    functionsUsed: number;
    variablesDeclared: number;
    classesUsed: number;
    hotkeysDefined: number;
    builtInFunctions: number;
    userDefinedFunctions: number;
  };
  elements: {
    builtInFunctions: Array<{
      name: string;
      line: number;
      documentation?: any;
      usage: string;
    }>;
    builtInVariables: Array<{
      name: string;
      line: number;
      documentation?: any;
      usage: string;
    }>;
    userDefinedFunctions: Array<{
      name: string;
      line: number;
      parameters: any[];
    }>;
    userDefinedVariables: Array<{
      name: string;
      line: number;
      value?: string;
      scope: string;
    }>;
    classes: Array<{
      name: string;
      line: number;
      documentation?: any;
      methods?: any[];
    }>;
    hotkeys: Array<{
      key: string;
      modifiers: string[];
      line: number;
    }>;
    directives: Array<{
      name: string;
      value: string;
      line: number;
      documentation?: any;
    }>;
  };
  suggestions: string[];
  warnings: string[];
}

export class AhkAnalyzeTool {
  async execute(args: z.infer<typeof AhkAnalyzeArgsSchema>): Promise<any> {
    try {
      logger.info('Analyzing AutoHotkey script for contextual information');
      
      const validatedArgs = AhkAnalyzeArgsSchema.parse(args);
      const { code, includeDocumentation, includeUsageExamples, analyzeComplexity } = validatedArgs;
      
      // Parse the script
      const parser = new AhkParser(code);
      const parseResult = parser.parse();
      
      // Get documentation data
      const ahkIndex = getAhkIndex();
      
      // Analyze the script
      const analysis = await this.analyzeScript(parseResult, code, ahkIndex, {
        includeDocumentation,
        includeUsageExamples,
        analyzeComplexity
      });
      
      return {
        content: [
          {
            type: 'text',
            text: this.formatAnalysisReport(analysis)
          },
          {
            type: 'json',
            data: analysis
          }
        ]
      };
      
    } catch (error) {
      logger.error('Error analyzing AutoHotkey script:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error analyzing script: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }
  
  private async analyzeScript(parseResult: any, code: string, ahkIndex: any, options: any): Promise<AnalysisResult> {
    const lines = code.split('\n');
    const analysis: AnalysisResult = {
      summary: {
        totalLines: lines.length,
        functionsUsed: 0,
        variablesDeclared: parseResult.variables.length,
        classesUsed: 0,
        hotkeysDefined: parseResult.hotkeys.length,
        builtInFunctions: 0,
        userDefinedFunctions: parseResult.functions.length
      },
      elements: {
        builtInFunctions: [],
        builtInVariables: [],
        userDefinedFunctions: [],
        userDefinedVariables: [],
        classes: [],
        hotkeys: [],
        directives: []
      },
      suggestions: [],
      warnings: []
    };
    
    // Analyze built-in functions used in the script
    await this.findBuiltInFunctions(code, lines, ahkIndex, analysis, options);
    
    // Analyze built-in variables used in the script
    await this.findBuiltInVariables(code, lines, ahkIndex, analysis, options);
    
    // Analyze user-defined elements
    this.analyzeUserDefinedElements(parseResult, analysis);
    
    // Analyze classes used
    await this.findClassUsage(code, lines, ahkIndex, analysis, options);
    
    // Generate suggestions and warnings
    this.generateSuggestions(analysis);
    
    return analysis;
  }
  
  private async findBuiltInFunctions(code: string, lines: string[], ahkIndex: any, analysis: AnalysisResult, options: any) {
    const builtInFunctions = ahkIndex.functions || [];
    
    for (const func of builtInFunctions) {
      const funcName = func.Name.split('(')[0]; // Extract function name without parameters
      const regex = new RegExp(`\\b${funcName}\\s*\\(`, 'gi');
      
      lines.forEach((line, index) => {
        const matches = line.match(regex);
        if (matches) {
          analysis.elements.builtInFunctions.push({
            name: funcName,
            line: index + 1,
            documentation: options.includeDocumentation ? func : undefined,
            usage: line.trim()
          });
          analysis.summary.builtInFunctions++;
        }
      });
    }
  }
  
  private async findBuiltInVariables(code: string, lines: string[], ahkIndex: any, analysis: AnalysisResult, options: any) {
    const builtInVariables = ahkIndex.variables || [];
    
    for (const variable of builtInVariables) {
      const varName = variable.Name;
      const regex = new RegExp(`\\b${varName}\\b`, 'gi');
      
      lines.forEach((line, index) => {
        if (regex.test(line)) {
          analysis.elements.builtInVariables.push({
            name: varName,
            line: index + 1,
            documentation: options.includeDocumentation ? variable : undefined,
            usage: line.trim()
          });
        }
      });
    }
  }
  
  private async findClassUsage(code: string, lines: string[], ahkIndex: any, analysis: AnalysisResult, options: any) {
    const builtInClasses = ahkIndex.classes || [];
    
    for (const cls of builtInClasses) {
      const className = cls.Name;
      const regex = new RegExp(`\\b${className}\\s*\\(`, 'gi');
      
      lines.forEach((line, index) => {
        if (regex.test(line)) {
          analysis.elements.classes.push({
            name: className,
            line: index + 1,
            documentation: options.includeDocumentation ? cls : undefined,
            methods: cls.Methods
          });
          analysis.summary.classesUsed++;
        }
      });
    }
  }
  
  private analyzeUserDefinedElements(parseResult: any, analysis: AnalysisResult) {
    // User-defined functions
    parseResult.functions.forEach((func: any) => {
      analysis.elements.userDefinedFunctions.push({
        name: func.name,
        line: func.line + 1,
        parameters: func.parameters
      });
    });
    
    // User-defined variables
    parseResult.variables.forEach((variable: any) => {
      analysis.elements.userDefinedVariables.push({
        name: variable.name,
        line: variable.line + 1,
        value: variable.value,
        scope: variable.scope
      });
    });
    
    // Hotkeys
    parseResult.hotkeys.forEach((hotkey: any) => {
      analysis.elements.hotkeys.push({
        key: hotkey.key,
        modifiers: hotkey.modifiers,
        line: hotkey.line + 1
      });
    });
    
    // Directives
    parseResult.directives.forEach((directive: any) => {
      analysis.elements.directives.push({
        name: directive.name,
        value: directive.value,
        line: directive.line + 1
      });
    });
  }
  
  private generateSuggestions(analysis: AnalysisResult) {
    // Suggest improvements based on analysis
    if (analysis.summary.builtInFunctions === 0 && analysis.summary.userDefinedFunctions === 0) {
      analysis.suggestions.push("Consider organizing your code into functions for better maintainability.");
    }
    
    if (analysis.elements.userDefinedVariables.length > 10) {
      analysis.suggestions.push("Consider grouping related variables into classes or objects for better organization.");
    }
    
    if (analysis.elements.hotkeys.length > 5) {
      analysis.suggestions.push("Consider using a configuration file or GUI for managing many hotkeys.");
    }
    
    // Check for potential issues
    const longFunctions = analysis.elements.userDefinedFunctions.filter(f => f.parameters.length > 5);
    if (longFunctions.length > 0) {
      analysis.warnings.push(`Functions with many parameters found: ${longFunctions.map(f => f.name).join(', ')}. Consider using objects or configuration parameters.`);
    }
  }
  
  private formatAnalysisReport(analysis: AnalysisResult): string {
    let report = `# AutoHotkey Script Analysis Report\n\n`;
    
    // Summary
    report += `## Summary\n`;
    report += `- **Total Lines:** ${analysis.summary.totalLines}\n`;
    report += `- **Built-in Functions Used:** ${analysis.summary.builtInFunctions}\n`;
    report += `- **User-defined Functions:** ${analysis.summary.userDefinedFunctions}\n`;
    report += `- **Variables Declared:** ${analysis.summary.variablesDeclared}\n`;
    report += `- **Classes Used:** ${analysis.summary.classesUsed}\n`;
    report += `- **Hotkeys Defined:** ${analysis.summary.hotkeysDefined}\n\n`;
    
    // Built-in Functions
    if (analysis.elements.builtInFunctions.length > 0) {
      report += `## Built-in Functions Used\n`;
      analysis.elements.builtInFunctions.forEach(func => {
        report += `- **${func.name}** (Line ${func.line})\n`;
        if (func.documentation) {
          report += `  - ${func.documentation.Description}\n`;
        }
        report += `  - Usage: \`${func.usage}\`\n`;
      });
      report += `\n`;
    }
    
    // Built-in Variables
    if (analysis.elements.builtInVariables.length > 0) {
      report += `## Built-in Variables Used\n`;
      analysis.elements.builtInVariables.forEach(variable => {
        report += `- **${variable.name}** (Line ${variable.line})\n`;
        if (variable.documentation) {
          report += `  - ${variable.documentation.Description}\n`;
        }
        report += `  - Usage: \`${variable.usage}\`\n`;
      });
      report += `\n`;
    }
    
    // Classes
    if (analysis.elements.classes.length > 0) {
      report += `## Classes Used\n`;
      analysis.elements.classes.forEach(cls => {
        report += `- **${cls.name}** (Line ${cls.line})\n`;
        if (cls.documentation) {
          report += `  - ${cls.documentation.Description}\n`;
        }
      });
      report += `\n`;
    }
    
    // User-defined Functions
    if (analysis.elements.userDefinedFunctions.length > 0) {
      report += `## User-defined Functions\n`;
      analysis.elements.userDefinedFunctions.forEach(func => {
        const params = func.parameters.map(p => p.name).join(', ');
        report += `- **${func.name}(${params})** (Line ${func.line})\n`;
      });
      report += `\n`;
    }
    
    // Hotkeys
    if (analysis.elements.hotkeys.length > 0) {
      report += `## Hotkeys Defined\n`;
      analysis.elements.hotkeys.forEach(hotkey => {
        const modifiers = hotkey.modifiers.length > 0 ? hotkey.modifiers.join('+') + '+' : '';
        report += `- **${modifiers}${hotkey.key}** (Line ${hotkey.line})\n`;
      });
      report += `\n`;
    }
    
    // Suggestions
    if (analysis.suggestions.length > 0) {
      report += `## Suggestions\n`;
      analysis.suggestions.forEach(suggestion => {
        report += `- ${suggestion}\n`;
      });
      report += `\n`;
    }
    
    // Warnings
    if (analysis.warnings.length > 0) {
      report += `## Warnings\n`;
      analysis.warnings.forEach(warning => {
        report += `- ⚠️ ${warning}\n`;
      });
      report += `\n`;
    }
    
    return report;
  }
} 