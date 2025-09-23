# Tool Settings System

## Overview

You now have a comprehensive settings system that allows you to **enable or disable individual tools** and control various features of the MCP server.

## 🎛️ The `ahk_settings` Tool

### Get Current Settings
```json
{
  "tool": "ahk_settings",
  "arguments": {
    "action": "get"
  }
}
```

### Disable File Editing Tools
```json
{
  "tool": "ahk_settings",
  "arguments": {
    "action": "disable_editing"
  }
}
```

### Enable File Editing Tools
```json
{
  "tool": "ahk_settings",
  "arguments": {
    "action": "enable_editing"
  }
}
```

### Enable Auto Run After Edits
```json
{
  "tool": "ahk_settings",
  "arguments": {
    "action": "enable_auto_run"
  }
}
```

### Disable Auto Run After Edits
```json
{
  "tool": "ahk_settings",
  "arguments": {
    "action": "disable_auto_run"
  }
}
```

### Disable a Specific Tool
```json
{
  "tool": "ahk_settings",
  "arguments": {
    "action": "disable_tool",
    "tool": "ahk_edit"
  }
}
```

### Enable a Specific Tool
```json
{
  "tool": "ahk_settings",
  "arguments": {
    "action": "enable_tool",
    "tool": "ahk_edit"
  }
}
```

## 🔧 Available Actions

| Action | Description | Example |
|--------|-------------|---------|
| `get` | Show current settings | View all tool states |
| `enable_tool` | Enable a specific tool | `"tool": "ahk_edit"` |
| `disable_tool` | Disable a specific tool | `"tool": "ahk_file"` |
| `enable_editing` | Enable ALL file editing tools | Enables 7 tools at once |
| `disable_editing` | Disable ALL file editing tools | Disables 7 tools at once |
| `enable_auto_run` | Enable automatic run after edits | Persists the `runAfter` preference |
| `disable_auto_run` | Disable automatic run after edits | Keeps scripts from launching automatically |
| `enable_all` | Enable all optional tools | Everything on |
| `disable_all` | Disable all non-core tools | Minimal mode |
| `reset` | Reset to default settings | Factory defaults |
| `set` | Update specific settings | Custom configuration |

## 📦 Tool Groups

### File Editing Tools (Can be disabled)
- `ahk_edit` - Text editing operations
- `ahk_diff_edit` - Diff patch application
- `ahk_file` - Active file management
- `ahk_auto_file` - Automatic file detection
- `ahk_active_file` - Legacy active file tool
- `ahk_process_request` - Multi-line request processing
- `ahk_small_edit` - Lightweight line/pattern edits

### Core Tools (Always enabled)
- `ahk_diagnostics` - Code validation
- `ahk_analyze` - Code analysis
- `ahk_run` - Script execution
- `ahk_summary` - Documentation summary
- `ahk_settings` - This settings tool

## 🛡️ Global Settings

### Configure Global Options
```json
{
  "tool": "ahk_settings",
  "arguments": {
    "action": "set",
    "settings": {
      "allowFileEditing": false,
      "allowFileDetection": false,
      "alwaysBackup": true,
      "maxFileSize": 5242880
    }
  }
}
```

### Available Global Settings
| Setting | Type | Description | Default |
|---------|------|-------------|---------|
| `allowFileEditing` | boolean | Allow file modification tools | true |
| `allowFileDetection` | boolean | Auto-detect file paths in text | true |
| `requireExplicitPaths` | boolean | Require full paths (no auto-detect) | false |
| `alwaysBackup` | boolean | Force backups on all edits | true |
| `restrictToAhkFiles` | boolean | Only allow .ahk file operations | true |
| `maxFileSize` | number | Max file size in bytes | 10485760 (10MB) |
| `autoRunAfterEdit` | boolean | Run scripts automatically after edits | false |

## 💾 Settings Storage

Settings are persisted in:
- **Windows**: `%APPDATA%\ahk-mcp\tool-settings.json`
- **Linux/Mac**: `~/.config/ahk-mcp/tool-settings.json`

### Settings File Format
```json
{
  "enabledTools": {
    "ahk_edit": true,
    "ahk_diff_edit": true,
    "ahk_file": true,
    "ahk_auto_file": true,
    "ahk_active_file": true,
    "ahk_process_request": true,
    "ahk_small_edit": true
  },
  "allowFileEditing": true,
  "allowFileDetection": true,
  "requireExplicitPaths": false,
  "alwaysBackup": true,
  "restrictToAhkFiles": true,
  "maxFileSize": 10485760,
  "autoRunAfterEdit": false
}
```

## 🚀 Use Cases

### 1. Read-Only Mode
Disable all file editing but keep analysis:
```json
{
  "tool": "ahk_settings",
  "arguments": {
    "action": "disable_editing"
  }
}
```

### 2. Minimal Mode
Only core tools, no file operations:
```json
{
  "tool": "ahk_settings",
  "arguments": {
    "action": "disable_all"
  }
}
```

### 3. No Auto-Detection
Require explicit file paths:
```json
{
  "tool": "ahk_settings",
  "arguments": {
    "action": "set",
    "settings": {
      "allowFileDetection": false,
      "requireExplicitPaths": true
    }
  }
}
```

### 4. Maximum Safety
Always backup, restrict to .ahk only:
```json
{
  "tool": "ahk_settings",
  "arguments": {
    "action": "set",
    "settings": {
      "alwaysBackup": true,
      "restrictToAhkFiles": true,
      "maxFileSize": 1048576
    }
  }
}
```

## ⚠️ What Happens When Tools Are Disabled

When you try to use a disabled tool, you'll get:
```
⚠️ Tool 'ahk_edit' is currently disabled.

To enable it, use the 'ahk_settings' tool:
{
  "tool": "ahk_settings",
  "arguments": {
    "action": "enable_tool",
    "tool": "ahk_edit"
  }
}
```

## 🔄 Environment Variables

You can override the settings file location:
```bash
export AHK_MCP_SETTINGS_PATH=/custom/path/settings.json
```

## 📋 Quick Commands

### Check What's Enabled
```json
{"tool": "ahk_settings", "arguments": {"action": "get"}}
```

### Turn Off File Editing
```json
{"tool": "ahk_settings", "arguments": {"action": "disable_editing"}}
```

### Turn On File Editing
```json
{"tool": "ahk_settings", "arguments": {"action": "enable_editing"}}
```

### Reset Everything
```json
{"tool": "ahk_settings", "arguments": {"action": "reset"}}
```

## 🎯 Benefits

1. **Security**: Disable file editing when only reading/analyzing
2. **Control**: Fine-grained control over each tool
3. **Safety**: Prevent accidental file modifications
4. **Flexibility**: Different modes for different use cases
5. **Persistence**: Settings survive server restarts

## Notes

- Core tools (`ahk_diagnostics`, `ahk_analyze`, `ahk_run`, `ahk_summary`) **cannot be disabled**
- The `ahk_settings` tool itself **cannot be disabled**
- Settings are loaded on server start and saved immediately on change
- Disabled tools return helpful messages explaining how to re-enable them
