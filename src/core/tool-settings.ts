import fs from 'fs';
import path from 'path';
import os from 'os';
import logger from '../logger.js';

/**
 * Tool settings configuration
 * Controls which tools are enabled/disabled
 */
export interface ToolSettings {
  // Core tool settings
  enabledTools: {
    ahk_edit: boolean;
    ahk_diff_edit: boolean;
    ahk_file: boolean;
    ahk_auto_file: boolean;
    ahk_active_file: boolean;
    ahk_process_request: boolean;
    ahk_alpha: boolean;
    ahk_small_edit: boolean;
    // Other tools can be added here
    [key: string]: boolean;
  };
  
  // Global settings
  allowFileEditing: boolean;
  allowFileDetection: boolean;
  requireExplicitPaths: boolean;
  
  // Safety settings
  alwaysBackup: boolean;
  restrictToAhkFiles: boolean;
  maxFileSize: number; // in bytes

  // Convenience settings
  autoRunAfterEdit: boolean;
}

class ToolSettingsManager {
  private static instance: ToolSettingsManager;
  private settings: ToolSettings;
  private settingsPath: string;
  
  private constructor() {
    this.settingsPath = this.getSettingsPath();
    this.settings = this.loadSettings();
  }
  
  static getInstance(): ToolSettingsManager {
    if (!ToolSettingsManager.instance) {
      ToolSettingsManager.instance = new ToolSettingsManager();
    }
    return ToolSettingsManager.instance;
  }
  
  private getSettingsPath(): string {
    // Check for environment override
    if (process.env.AHK_MCP_SETTINGS_PATH) {
      return process.env.AHK_MCP_SETTINGS_PATH;
    }
    
    // Default to config directory
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    const base = process.platform === 'win32' ? appData : path.join(os.homedir(), '.config');
    const configDir = path.join(base, 'ahk-mcp');
    
    // Ensure directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    return path.join(configDir, 'tool-settings.json');
  }
  
  private getDefaultSettings(): ToolSettings {
    return {
      enabledTools: {
        // File editing tools - can be disabled
        ahk_edit: true,
        ahk_diff_edit: true,
        ahk_file: true,
        ahk_auto_file: true,
        ahk_active_file: true,
        ahk_process_request: true,
        ahk_alpha: true,
        ahk_small_edit: true,
        
        // Core tools - always enabled
        ahk_diagnostics: true,
        ahk_analyze: true,
        ahk_run: true,
        ahk_summary: true,
        ahk_prompts: true,
        ahk_debug_agent: true,
        ahk_doc_search: true,
        ahk_context_injector: true,
        ahk_sampling_enhancer: true,
        ahk_vscode_problems: true,
        ahk_recent_scripts: true,
        ahk_config: true
      },
      
      // Global settings
      allowFileEditing: true,
      allowFileDetection: true,
      requireExplicitPaths: false,
      
      // Safety settings
      alwaysBackup: true,
      restrictToAhkFiles: true,
      maxFileSize: 10 * 1024 * 1024, // 10 MB

      // Convenience settings
      autoRunAfterEdit: false
    };
  }
  
  private loadSettings(): ToolSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const content = fs.readFileSync(this.settingsPath, 'utf-8');
        const loaded = JSON.parse(content);
        const defaults = this.getDefaultSettings();
        const mergedEnabled = {
          ...defaults.enabledTools,
          ...(loaded.enabledTools || {}),
        };

        return {
          ...defaults,
          ...loaded,
          enabledTools: mergedEnabled,
        };
      }
    } catch (error) {
      logger.warn('Failed to load tool settings, using defaults:', error);
    }

    return this.getDefaultSettings();
  }
  
  saveSettings(): void {
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf-8');
      logger.info('Tool settings saved');
    } catch (error) {
      logger.error('Failed to save tool settings:', error);
    }
  }
  
  /**
   * Check if a tool is enabled
   */
  isToolEnabled(toolName: string): boolean {
    // Check specific tool setting
    if (toolName in this.settings.enabledTools) {
      return this.settings.enabledTools[toolName];
    }
    
    // Default to enabled for unknown tools
    return true;
  }
  
  /**
   * Enable or disable a tool
   */
  setToolEnabled(toolName: string, enabled: boolean): void {
    this.settings.enabledTools[toolName] = enabled;
    this.saveSettings();
    logger.info(`Tool ${toolName} ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Check if file editing is allowed
   */
  isFileEditingAllowed(): boolean {
    return this.settings.allowFileEditing;
  }
  
  /**
   * Check if file detection is allowed
   */
  isFileDetectionAllowed(): boolean {
    return this.settings.allowFileDetection;
  }
  
  /**
   * Get all settings
   */
  getSettings(): ToolSettings {
    return { ...this.settings };
  }
  
  /**
   * Update settings
   */
  updateSettings(updates: Partial<ToolSettings>): void {
    this.settings = { ...this.settings, ...updates };
    if (updates.enabledTools) {
      this.settings.enabledTools = { ...this.settings.enabledTools, ...updates.enabledTools };
    }
    this.saveSettings();
  }
  
  /**
   * Reset to default settings
   */
  resetToDefaults(): void {
    this.settings = this.getDefaultSettings();
    this.saveSettings();
    logger.info('Tool settings reset to defaults');
  }
  
  /**
   * Enable/disable file editing tools as a group
   */
  setFileEditingTools(enabled: boolean): void {
    const fileTools = ['ahk_edit', 'ahk_diff_edit', 'ahk_file', 'ahk_auto_file', 'ahk_active_file', 'ahk_process_request', 'ahk_alpha', 'ahk_small_edit'];
    for (const tool of fileTools) {
      this.settings.enabledTools[tool] = enabled;
    }
    this.settings.allowFileEditing = enabled;
    this.settings.allowFileDetection = enabled;
    this.saveSettings();
    logger.info(`File editing tools ${enabled ? 'enabled' : 'disabled'}`);
  }

  setAutoRunAfterEdit(enabled: boolean): void {
    this.settings.autoRunAfterEdit = enabled;
    this.saveSettings();
    logger.info(`Auto-run after edit ${enabled ? 'enabled' : 'disabled'}`);
  }

  shouldAutoRunAfterEdit(): boolean {
    return this.settings.autoRunAfterEdit;
  }

  /**
   * Get tool availability message
   */
  getDisabledMessage(toolName: string): string {
    if (!this.isToolEnabled(toolName)) {
      return `⚠️ Tool '${toolName}' is currently disabled.\n\nTo enable it, use the 'ahk_settings' tool:\n\`\`\`json\n{\n  "tool": "ahk_settings",\n  "arguments": {\n    "action": "enable_tool",\n    "tool": "${toolName}"\n  }\n}\n\`\`\``;
    }
    
    if (!this.settings.allowFileEditing && ['ahk_edit', 'ahk_diff_edit', 'ahk_small_edit'].includes(toolName)) {
      return `⚠️ File editing is currently disabled.\n\nTo enable it, use the 'ahk_settings' tool:\n\`\`\`json\n{\n  "tool": "ahk_settings",\n  "arguments": {\n    "action": "enable_editing"\n  }\n}\n\`\`\``;
    }
    
    return '';
  }
}

// Export singleton instance
export const toolSettings = ToolSettingsManager.getInstance();

// Helper functions
export function isToolEnabled(toolName: string): boolean {
  return toolSettings.isToolEnabled(toolName);
}

export function checkToolAvailability(toolName: string): { enabled: boolean; message?: string } {
  const enabled = toolSettings.isToolEnabled(toolName);
  if (!enabled) {
    return {
      enabled: false,
      message: toolSettings.getDisabledMessage(toolName)
    };
  }
  return { enabled: true };
}
