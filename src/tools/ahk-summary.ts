import { z } from 'zod';
import { getAhkIndex } from '../core/loader.js';
import { ClaudeStandardsEngine } from '../core/claude-standards.js';
import logger from '../logger.js';

export const AhkSummaryArgsSchema = z.object({});

export const ahkSummaryToolDefinition = {
  name: 'ahk_summary',
  description: 'Returns a summary of built-in variables, classes, and coding standards for AutoHotkey v2.',
  inputSchema: AhkSummaryArgsSchema
};

export class AhkSummaryTool {
  async execute() {
    logger.info('Generating AutoHotkey summary (variables, classes, standards)');
    const index = getAhkIndex();
    const standards = new ClaudeStandardsEngine().getStandards();

    // Format for human readability (optional)
    const variables = (index?.variables || []).map(v => ({
      name: v.Name,
      type: v.Type,
      description: v.Description
    }));
    const classes = (index?.classes || []).map(c => ({
      name: c.Name,
      description: c.Description
    }));
    const rules = (standards || []).map(s => ({
      name: s.name,
      message: s.message,
      category: s.category
    }));

    return {
      content: [
        {
          type: 'text',
          text:
            '## AutoHotkey v2 Summary\n' +
            `**Variables:** ${variables.length}\n` +
            variables.slice(0, 10).map(v => `- ${v.name}: ${v.description}`).join('\n') + (variables.length > 10 ? `\n...and ${variables.length - 10} more` : '') +
            '\n\n' +
            `**Classes:** ${classes.length}\n` +
            classes.slice(0, 10).map(c => `- ${c.name}: ${c.description}`).join('\n') + (classes.length > 10 ? `\n...and ${classes.length - 10} more` : '') +
            '\n\n' +
            `**Coding Standards:** ${rules.length}\n` +
            rules.map(r => `- ${r.name}: ${r.message} (${r.category})`).join('\n')
        },
        {
          type: 'json',
          data: {
            variables,
            classes,
            standards: rules
          }
        }
      ]
    };
  }
} 