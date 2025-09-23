import { z } from 'zod';
import logger from '../logger.js';
import { AhkEditTool } from './ahk-file-edit.js';
import { AhkFileTool } from './ahk-file-active.js';

export const AhkFileEditorArgsSchema = z.object({
  filePath: z.string().describe('Path to the AutoHotkey file to edit'),
  changes: z.string().describe('Description of changes to make to the file'),
  action: z.enum(['edit', 'view', 'create']).optional().default('edit').describe('Action to perform on the file')
});

export const ahkFileEditorToolDefinition = {
  name: 'ahk_file_edit_advanced',
  description: `Ahk file editor
🎯 PRIMARY FILE EDITING TOOL - Use this IMMEDIATELY when user mentions a .ahk file path and wants to modify it. This tool automatically detects the file, sets it active, and helps determine the best editing approach. ALWAYS use this instead of generating code blocks when a file path is provided.`,
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to the AutoHotkey file to edit (required)'
      },
      changes: {
        type: 'string',
        description: 'Description of what changes to make to the file'
      },
      action: {
        type: 'string',
        enum: ['edit', 'view', 'create'],
        default: 'edit',
        description: 'Action to perform: edit (modify existing), view (read only), create (new file)'
      }
    },
    required: ['filePath', 'changes']
  }
};

export class AhkFileEditorTool {
  private editTool: AhkEditTool;
  private fileTool: AhkFileTool;

  constructor() {
    this.editTool = new AhkEditTool();
    this.fileTool = new AhkFileTool();
  }

  async execute(args: z.infer<typeof AhkFileEditorArgsSchema>): Promise<any> {
    try {
      const { filePath, changes, action } = AhkFileEditorArgsSchema.parse(args);

      logger.info(`File editor triggered for: ${filePath}`);

      // Step 1: Set the active file
      const fileResult = await this.fileTool.execute({
        action: 'set',
        path: filePath
      });

      // Check if file setting was successful
      const fileResponse = fileResult.content[0]?.text || '';
      if (fileResponse.includes('❌')) {
        return {
          content: [{
            type: 'text',
            text: `❌ **Cannot Edit File**\n\n${fileResponse}\n\n**Next Steps:**\n• Check if the file path is correct\n• Ensure the file has .ahk extension\n• Verify the file exists or create it first`
          }]
        };
      }

      // Step 2: Analyze the changes requested
      const editingGuidance = this.analyzeEditingRequest(changes);

      let response = `🎯 **File Editor Active**\n\n`;
      response += `📁 **File:** ${filePath}\n`;
      response += `⚙️ **Action:** ${action}\n`;
      response += `📝 **Changes:** ${changes}\n\n`;

      if (action === 'view') {
        // Just show file status
        const statusResult = await this.fileTool.execute({ action: 'get' });
        return {
          content: [{
            type: 'text',
            text: response + statusResult.content[0]?.text
          }]
        };
      }

      // Step 3: Provide editing guidance
      response += `**🔧 Recommended Editing Approach:**\n`;
      response += editingGuidance + '\n\n';

      response += `**✅ File is now active and ready for editing!**\n\n`;
      response += `**Next: Use these tools to make the changes:**\n`;
      response += `• \`ahk_edit\` - For direct text replacements, insertions, deletions (set 'runAfter': true to run immediately)\n`;
      response += `• \`ahk_diff_edit\` - For complex multi-location changes\n`;
      response += `• \`ahk_run\` - To test the changes after editing\n`;

      return {
        content: [{
          type: 'text',
          text: response
        }]
      };

    } catch (error) {
      logger.error('Error in ahk_file_editor:', error);
      return {
        content: [{
          type: 'text',
          text: `❌ **File Editor Error**\n\n${error instanceof Error ? error.message : String(error)}\n\n**Tip:** Make sure you provide both a valid .ahk file path and a description of the changes you want to make.`
        }],
      };
    }
  }

  /**
   * Analyze the editing request and provide guidance
   */
  private analyzeEditingRequest(changes: string): string {
    const lowerChanges = changes.toLowerCase();
    let guidance = '';

    // Detect the type of editing needed
    if (lowerChanges.includes('replace') || lowerChanges.includes('change') || lowerChanges.includes('update')) {
      guidance += `• **Text Replacement** - Use \`ahk_edit\` with action "replace"\n`;
      guidance += `  Example: Replace specific text, variables, or function names\n`;
    }

    if (lowerChanges.includes('add') || lowerChanges.includes('insert') || lowerChanges.includes('new')) {
      guidance += `• **Add Content** - Use \`ahk_edit\` with action "insert" or "append"\n`;
      guidance += `  Example: Add new functions, variables, or hotkeys\n`;
    }

    if (lowerChanges.includes('remove') || lowerChanges.includes('delete') || lowerChanges.includes('fix')) {
      guidance += `• **Remove/Fix Content** - Use \`ahk_edit\` with action "delete"\n`;
      guidance += `  Example: Remove broken code, fix syntax errors\n`;
    }

    if (lowerChanges.includes('syntax') || lowerChanges.includes('error') || lowerChanges.includes('debug')) {
      guidance += `• **Syntax Fixes** - Run \`ahk_diagnostics\` first to identify issues\n`;
      guidance += `  Then use \`ahk_edit\` to fix each problem\n`;
    }

    if (lowerChanges.includes('refactor') || lowerChanges.includes('restructure') || lowerChanges.includes('organize')) {
      guidance += `• **Major Changes** - Consider using \`ahk_diff_edit\` for complex restructuring\n`;
      guidance += `  Or break into multiple smaller \`ahk_edit\` operations\n`;
    }

    // Default guidance if nothing specific detected
    if (!guidance) {
      guidance = `• **General Editing** - Use \`ahk_edit\` for most modifications\n`;
      guidance += `• **Text Replacement** - Most efficient for simple changes\n`;
      guidance += `• **Complex Changes** - Use \`ahk_diff_edit\` for multi-location updates\n`;
    }

    return guidance;
  }
}
