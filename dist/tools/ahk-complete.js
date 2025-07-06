import { z } from 'zod';
import { AhkCompletionProvider } from '../lsp/completion.js';
import logger from '../logger.js';
// Zod schema for tool arguments
export const AhkCompleteArgsSchema = z.object({
    code: z.string().describe('The AutoHotkey v2 code context'),
    position: z.object({
        line: z.number().describe('Zero-based line number'),
        character: z.number().describe('Zero-based character position')
    }).describe('Cursor position for completion'),
    context: z.enum(['function', 'variable', 'class', 'auto']).optional()
        .describe('Optional context hint for completion type')
});
export const ahkCompleteToolDefinition = {
    name: 'ahk_complete',
    description: 'Provides AutoHotkey v2 code completion suggestions based on cursor position and context',
    inputSchema: AhkCompleteArgsSchema
};
export class AhkCompleteTool {
    constructor() {
        this.completionProvider = new AhkCompletionProvider();
    }
    /**
     * Execute the completion tool
     */
    async execute(args) {
        try {
            logger.info(`Getting AutoHotkey completions at line ${args.position.line}, character ${args.position.character}`);
            // Validate arguments
            const validatedArgs = AhkCompleteArgsSchema.parse(args);
            // Get completions from provider
            const completions = await this.completionProvider.getCompletions(validatedArgs.code, validatedArgs.position);
            logger.info(`Generated ${completions.length} completion suggestions`);
            // Format response for MCP
            return {
                content: [
                    {
                        type: 'text',
                        text: this.formatCompletionsResponse(completions, validatedArgs.position)
                    }
                ]
            };
        }
        catch (error) {
            logger.error('Error in ahk_complete tool:', error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error getting completions: ${error}`
                    }
                ],
                isError: true
            };
        }
    }
    /**
     * Format completions response for human-readable output
     */
    formatCompletionsResponse(completions, position) {
        if (completions.length === 0) {
            return `No completions available at line ${position.line + 1}, character ${position.character + 1}.`;
        }
        let response = `Found ${completions.length} completion suggestions at line ${position.line + 1}, character ${position.character + 1}:\n\n`;
        // Group completions by kind
        const groupedCompletions = this.groupCompletionsByKind(completions);
        for (const [kind, items] of Object.entries(groupedCompletions)) {
            if (items.length > 0) {
                response += `**${kind}:**\n`;
                items.slice(0, 10).forEach((item) => {
                    response += `- \`${item.label}\``;
                    if (item.detail) {
                        response += ` - ${item.detail}`;
                    }
                    if (item.documentation) {
                        const shortDoc = item.documentation.length > 100
                            ? item.documentation.substring(0, 97) + '...'
                            : item.documentation;
                        response += `\n  ${shortDoc}`;
                    }
                    response += '\n';
                });
                if (items.length > 10) {
                    response += `  ... and ${items.length - 10} more ${kind.toLowerCase()}\n`;
                }
                response += '\n';
            }
        }
        return response.trim();
    }
    /**
     * Group completions by their kind for better organization
     */
    groupCompletionsByKind(completions) {
        const kindNames = {
            1: 'Text',
            2: 'Methods',
            3: 'Functions',
            4: 'Constructors',
            5: 'Fields',
            6: 'Variables',
            7: 'Classes',
            8: 'Interfaces',
            9: 'Modules',
            10: 'Properties',
            11: 'Units',
            12: 'Values',
            13: 'Enums',
            14: 'Keywords',
            15: 'Snippets',
            16: 'Colors',
            17: 'Files',
            18: 'References',
            19: 'Folders',
            20: 'Enum Members',
            21: 'Constants',
            22: 'Structs',
            23: 'Events',
            24: 'Operators',
            25: 'Type Parameters'
        };
        const grouped = {};
        completions.forEach(completion => {
            const kindName = kindNames[completion.kind] || 'Other';
            if (!grouped[kindName]) {
                grouped[kindName] = [];
            }
            grouped[kindName].push(completion);
        });
        // Sort groups by priority
        const priorityOrder = ['Functions', 'Variables', 'Classes', 'Methods', 'Properties', 'Keywords'];
        const sortedGrouped = {};
        priorityOrder.forEach(kind => {
            if (grouped[kind]) {
                sortedGrouped[kind] = grouped[kind].sort((a, b) => a.label.localeCompare(b.label));
            }
        });
        // Add remaining groups
        Object.keys(grouped).forEach(kind => {
            if (!priorityOrder.includes(kind)) {
                sortedGrouped[kind] = grouped[kind].sort((a, b) => a.label.localeCompare(b.label));
            }
        });
        return sortedGrouped;
    }
}
