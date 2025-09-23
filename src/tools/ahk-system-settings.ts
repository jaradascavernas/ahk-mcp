import { z } from 'zod';
import logger from '../logger.js';
import { toolSettings } from '../core/tool-settings.js';

export const AhkSettingsArgsSchema = z.object({
  action: z.enum([
    'get', 
    'set', 
    'enable_tool', 
    'disable_tool', 
    'enable_editing', 
    'disable_editing',
    'enable_auto_run',
    'disable_auto_run',
    'enable_all',
    'disable_all',
    'reset'
  ]).default('get'),
  tool: z.string().optional().describe('Tool name for enable/disable actions'),
  settings: z.object({
    allowFileEditing: z.boolean().optional(),
    allowFileDetection: z.boolean().optional(),
    requireExplicitPaths: z.boolean().optional(),
    alwaysBackup: z.boolean().optional(),
    restrictToAhkFiles: z.boolean().optional(),
    maxFileSize: z.number().optional(),
    autoRunAfterEdit: z.boolean().optional()
  }).optional().describe('Settings to update')
});

export const ahkSettingsToolDefinition = {
  name: 'ahk_settings',
  description: `Ahk settings
Manage tool settings and enable/disable features`,
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: [
          'get', 
          'set', 
          'enable_tool', 
          'disable_tool', 
          'enable_editing', 
          'disable_editing',
          'enable_auto_run',
          'disable_auto_run',
          'enable_all',
          'disable_all',
          'reset'
        ],
        default: 'get',
        description: 'Action to perform'
      },
      tool: {
        type: 'string',
        description: 'Tool name for enable/disable actions'
      },
      settings: {
        type: 'object',
        description: 'Settings to update',
        properties: {
          allowFileEditing: { type: 'boolean' },
          allowFileDetection: { type: 'boolean' },
          requireExplicitPaths: { type: 'boolean' },
          alwaysBackup: { type: 'boolean' },
          restrictToAhkFiles: { type: 'boolean' },
          maxFileSize: { type: 'number' },
          autoRunAfterEdit: { type: 'boolean' }
        }
      }
    }
  }
};

export class AhkSettingsTool {
  async execute(args: z.infer<typeof AhkSettingsArgsSchema>): Promise<any> {
    try {
      const { action, tool, settings } = AhkSettingsArgsSchema.parse(args || {});
      
      switch (action) {
        case 'get': {
          const currentSettings = toolSettings.getSettings();
          let response = '⚙️ **Current Tool Settings**\n\n';
          
          // File editing tools status
          response += '**📝 File Editing Tools:**\n';
          const fileTools = ['ahk_edit', 'ahk_diff_edit', 'ahk_file', 'ahk_auto_file', 'ahk_active_file', 'ahk_process_request', 'ahk_small_edit'];
          for (const t of fileTools) {
            const status = currentSettings.enabledTools[t] ? '✅' : '❌';
            response += `  ${status} ${t}\n`;
          }
          
          response += '\n**🔧 Core Tools:** (always enabled)\n';
          const coreTools = ['ahk_diagnostics', 'ahk_analyze', 'ahk_run', 'ahk_summary'];
          for (const t of coreTools) {
            response += `  ✅ ${t}\n`;
          }
          
          response += '\n**🛡️ Global Settings:**\n';
          response += `  • File Editing: ${currentSettings.allowFileEditing ? '✅ Enabled' : '❌ Disabled'}\n`;
          response += `  • File Detection: ${currentSettings.allowFileDetection ? '✅ Enabled' : '❌ Disabled'}\n`;
          response += `  • Require Explicit Paths: ${currentSettings.requireExplicitPaths ? 'Yes' : 'No'}\n`;
          response += `  • Always Backup: ${currentSettings.alwaysBackup ? 'Yes' : 'No'}\n`;
          response += `  • Restrict to .ahk: ${currentSettings.restrictToAhkFiles ? 'Yes' : 'No'}\n`;
          response += `  • Max File Size: ${(currentSettings.maxFileSize / 1024 / 1024).toFixed(1)} MB\n`;
          response += `  • Auto-run After Edit: ${currentSettings.autoRunAfterEdit ? 'Enabled' : 'Disabled'}\n`;
          
          return {
            content: [
              { type: 'text', text: response },
              { type: 'text', text: JSON.stringify(currentSettings, null, 2) }
            ]
          };
        }
        
        case 'enable_tool': {
          if (!tool) {
            throw new Error('Tool name required for enable_tool action');
          }
          toolSettings.setToolEnabled(tool, true);
          return {
            content: [{
              type: 'text',
              text: `✅ Tool '${tool}' has been enabled`
            }]
          };
        }
        
        case 'disable_tool': {
          if (!tool) {
            throw new Error('Tool name required for disable_tool action');
          }
          
          // Prevent disabling core tools
          const coreTools = ['ahk_diagnostics', 'ahk_analyze', 'ahk_run', 'ahk_summary', 'ahk_settings'];
          if (coreTools.includes(tool)) {
            return {
              content: [{
                type: 'text',
                text: `⚠️ Cannot disable core tool '${tool}'. Core tools must remain enabled.`
              }]
            };
          }
          
          toolSettings.setToolEnabled(tool, false);
          return {
            content: [{
              type: 'text',
              text: `❌ Tool '${tool}' has been disabled`
            }]
          };
        }
        
        case 'enable_editing': {
          toolSettings.setFileEditingTools(true);
          return {
            content: [{
              type: 'text',
              text: '✅ File editing tools have been enabled:\n• ahk_edit\n• ahk_diff_edit\n• ahk_file\n• ahk_auto_file\n• ahk_active_file\n• ahk_process_request\n• ahk_small_edit'
            }]
          };
        }

        case 'disable_editing': {
          toolSettings.setFileEditingTools(false);
          return {
            content: [{
              type: 'text',
              text: '❌ File editing tools have been disabled:\n• ahk_edit\n• ahk_diff_edit\n• ahk_file\n• ahk_auto_file\n• ahk_active_file\n• ahk_process_request\n• ahk_small_edit\n\nCore analysis and diagnostic tools remain enabled.'
            }]
          };
        }

        case 'enable_auto_run': {
          toolSettings.setAutoRunAfterEdit(true);
          return {
            content: [{
              type: 'text',
              text: '✅ Automatic run after edits has been enabled. Future edits will launch the script unless you override `runAfter` explicitly.'
            }]
          };
        }

        case 'disable_auto_run': {
          toolSettings.setAutoRunAfterEdit(false);
          return {
            content: [{
              type: 'text',
              text: '❌ Automatic run after edits has been disabled.'
            }]
          };
        }

        case 'enable_all': {
          const allSettings = toolSettings.getSettings();
          for (const toolName in allSettings.enabledTools) {
            allSettings.enabledTools[toolName] = true;
          }
          allSettings.allowFileEditing = true;
          allSettings.allowFileDetection = true;
          toolSettings.updateSettings(allSettings);
          
          return {
            content: [{
              type: 'text',
              text: '✅ All tools and features have been enabled'
            }]
          };
        }
        
        case 'disable_all': {
          // Disable only non-core tools
          const coreTools = ['ahk_diagnostics', 'ahk_analyze', 'ahk_run', 'ahk_summary', 'ahk_settings'];
          const allSettings = toolSettings.getSettings();
          
          for (const toolName in allSettings.enabledTools) {
            if (!coreTools.includes(toolName)) {
              allSettings.enabledTools[toolName] = false;
            }
          }
          allSettings.allowFileEditing = false;
          allSettings.allowFileDetection = false;
          toolSettings.updateSettings(allSettings);
          
          return {
            content: [{
              type: 'text',
              text: '❌ All non-core tools have been disabled.\n\nCore tools remain enabled:\n• ahk_diagnostics\n• ahk_analyze\n• ahk_run\n• ahk_summary\n• ahk_settings'
            }]
          };
        }
        
        case 'set': {
          if (!settings) {
            throw new Error('Settings object required for set action');
          }
          
          const currentSettings = toolSettings.getSettings();
          const updatedSettings = { ...currentSettings, ...settings };
          toolSettings.updateSettings(updatedSettings);
          
          return {
            content: [{
              type: 'text',
              text: '✅ Settings updated successfully'
            }]
          };
        }
        
        case 'reset': {
          toolSettings.resetToDefaults();
          return {
            content: [{
              type: 'text',
              text: '✅ All settings have been reset to defaults'
            }]
          };
        }
        
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
    } catch (error) {
      logger.error('Error in ahk_settings tool:', error);
      return {
        content: [{
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }],

      };
    }
  }
}
