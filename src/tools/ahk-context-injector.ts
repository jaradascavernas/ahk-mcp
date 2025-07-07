import { z } from 'zod';
import { getAhkIndex, getAhkDocumentationFull } from '../core/loader.js';
import logger from '../logger.js';

export const AhkContextInjectorArgsSchema = z.object({
  userPrompt: z.string().min(1, 'User prompt is required'),
  llmThinking: z.string().optional(),
  contextType: z.enum(['auto', 'functions', 'variables', 'classes', 'methods']).optional().default('auto'),
  maxItems: z.number().min(1).max(10).optional().default(5)
});

export const ahkContextInjectorToolDefinition = {
  name: 'ahk_context_injector',
  description: 'Analyzes user prompts and LLM thinking to automatically inject relevant AutoHotkey v2 documentation context.',
  inputSchema: AhkContextInjectorArgsSchema
};

interface ContextMatch {
  type: string;
  name: string;
  description: string;
  relevance: number;
  data: any;
}

export class AhkContextInjectorTool {
  private keywordMap: Map<string, string[]> = new Map();

  constructor() {
    this.initializeKeywordMap();
  }

  private initializeKeywordMap(): void {
    // Map common concepts to AutoHotkey elements
    this.keywordMap.set('clipboard', ['A_Clipboard', 'OnClipboardChange', 'ClipboardAll']);
    this.keywordMap.set('gui', ['Gui', 'GuiCreate', 'Show', 'Add']);
    this.keywordMap.set('window', ['WinActivate', 'WinExist', 'WinGetTitle', 'A_WinDir']);
    this.keywordMap.set('file', ['FileRead', 'FileWrite', 'FileAppend', 'A_WorkingDir']);
    this.keywordMap.set('hotkey', ['Hotkey', 'Send', 'SendText', 'SendInput']);
    this.keywordMap.set('string', ['StrSplit', 'StrReplace', 'SubStr', 'StrLen']);
    this.keywordMap.set('array', ['Array', 'Push', 'Pop', 'Length']);
    this.keywordMap.set('map', ['Map', 'Set', 'Get', 'Has']);
    this.keywordMap.set('loop', ['loop', 'Loop', 'For', 'While']);
    this.keywordMap.set('message', ['MsgBox', 'ToolTip', 'TrayTip']);
    this.keywordMap.set('monitor', ['A_ScreenWidth', 'A_ScreenHeight', 'MonitorGet']);
    this.keywordMap.set('mouse', ['Click', 'MouseMove', 'A_Cursor']);
    this.keywordMap.set('keyboard', ['Send', 'SendText', 'GetKeyState']);
    this.keywordMap.set('time', ['A_Now', 'A_TickCount', 'Sleep']);
    this.keywordMap.set('toggle', ['if', 'else', 'Boolean']);
  }

  async execute(args: z.infer<typeof AhkContextInjectorArgsSchema>): Promise<any> {
    try {
      logger.info('Analyzing prompt for AutoHotkey context injection');
      
      const validatedArgs = AhkContextInjectorArgsSchema.parse(args);
      const { userPrompt, llmThinking, contextType, maxItems } = validatedArgs;

      // Get documentation data
      const ahkIndex = getAhkIndex();
      if (!ahkIndex) {
        return {
          content: [
            {
              type: 'text',
              text: 'AutoHotkey documentation not available for context injection.'
            }
          ]
        };
      }

      // Analyze text to extract keywords and concepts
      const combinedText = `${userPrompt} ${llmThinking || ''}`;
      const keywords = this.extractKeywords(combinedText);
      const contextMatches = this.findRelevantContext(keywords, ahkIndex, contextType, maxItems);

      if (contextMatches.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No specific AutoHotkey context found for this request.'
            }
          ]
        };
      }

      // Generate context injection
      const contextText = this.generateContextText(contextMatches);
      
      return {
        content: [
          {
            type: 'text',
            text: contextText
          },
          {
            type: 'json',
            data: {
              detectedKeywords: keywords,
              contextMatches: contextMatches,
              injectionReason: 'Automatic context injection based on prompt analysis'
            }
          }
        ]
      };

    } catch (error) {
      logger.error('Error in context injector:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error analyzing context: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ]
      };
    }
  }

  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const normalizedText = text.toLowerCase();

    // Check for direct keyword matches
    for (const [concept, elements] of this.keywordMap) {
      if (normalizedText.includes(concept)) {
        keywords.push(concept);
      }
    }

    // Extract AutoHotkey-specific terms
    const ahkPatterns = [
      /\b(msgbox|tooltip|send|click|hotkey|gui|window|file|array|map|loop)\b/gi,
      /\b(a_\w+)\b/gi,  // Built-in variables
      /\b(\w+(?:read|write|get|set|show|add|create))\b/gi  // Common function patterns
    ];

    for (const pattern of ahkPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        keywords.push(...matches.map(m => m.toLowerCase()));
      }
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  private findRelevantContext(keywords: string[], ahkIndex: any, contextType: string, maxItems: number): ContextMatch[] {
    const matches: ContextMatch[] = [];

    // Search through different categories
    if (contextType === 'auto' || contextType === 'variables') {
      this.searchInCategory(keywords, ahkIndex.variables, 'variable', matches);
    }
    
    if (contextType === 'auto' || contextType === 'functions') {
      this.searchInCategory(keywords, ahkIndex.functions, 'function', matches);
    }
    
    if (contextType === 'auto' || contextType === 'classes') {
      this.searchInCategory(keywords, ahkIndex.classes, 'class', matches);
    }
    
    if (contextType === 'auto' || contextType === 'methods') {
      this.searchInCategory(keywords, ahkIndex.methods, 'method', matches);
    }

    // Sort by relevance and limit results
    return matches
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maxItems);
  }

  private searchInCategory(keywords: string[], items: any[], category: string, matches: ContextMatch[]): void {
    if (!items) return;

    for (const item of items) {
      const relevance = this.calculateRelevance(keywords, item);
      if (relevance > 0) {
        matches.push({
          type: category,
          name: item.Name,
          description: item.Description || '',
          relevance,
          data: item
        });
      }
    }
  }

  private calculateRelevance(keywords: string[], item: any): number {
    let relevance = 0;
    const itemText = `${item.Name} ${item.Description || ''}`.toLowerCase();

    for (const keyword of keywords) {
      // Direct name match gets highest score
      if (item.Name.toLowerCase().includes(keyword)) {
        relevance += 10;
      }
      // Description match gets medium score
      else if (itemText.includes(keyword)) {
        relevance += 5;
      }
      // Keyword mapping match gets lower score
      else if (this.keywordMap.has(keyword)) {
        const mappedElements = this.keywordMap.get(keyword)!;
        for (const element of mappedElements) {
          if (item.Name.toLowerCase().includes(element.toLowerCase())) {
            relevance += 3;
          }
        }
      }
    }

    return relevance;
  }

  private generateContextText(matches: ContextMatch[]): string {
    let contextText = '## 🎯 Relevant AutoHotkey v2 Context\n\n';
    contextText += '*Automatically injected based on your request:*\n\n';

    const groupedMatches = this.groupMatchesByType(matches);

    for (const [type, items] of Object.entries(groupedMatches)) {
      if (items.length === 0) continue;

      contextText += `### ${this.capitalizeFirst(type)}s\n\n`;

      for (const match of items) {
        contextText += `**${match.name}**: ${match.description}\n`;
        
        // Add examples if available
        if (match.data.Examples && match.data.Examples.length > 0) {
          contextText += `\n*Example:*\n\`\`\`autohotkey\n${match.data.Examples[0].Code}\n\`\`\`\n`;
        }
        
        // Add parameters if available
        if (match.data.Parameters && match.data.Parameters.length > 0) {
          contextText += `\n*Parameters:* ${match.data.Parameters.map((p: any) => p.Name).join(', ')}\n`;
        }
        
        contextText += '\n';
      }
    }

    contextText += '\n*💡 Use this context to write more accurate AutoHotkey v2 code.*\n';
    
    return contextText;
  }

  private groupMatchesByType(matches: ContextMatch[]): Record<string, ContextMatch[]> {
    const grouped: Record<string, ContextMatch[]> = {};
    
    for (const match of matches) {
      if (!grouped[match.type]) {
        grouped[match.type] = [];
      }
      grouped[match.type].push(match);
    }
    
    return grouped;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
} 