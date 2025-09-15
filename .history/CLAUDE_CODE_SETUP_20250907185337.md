# Setting Up AutoHotkey MCP Server for Claude Code

This guide will help you configure your AutoHotkey v2 MCP Server to work with Claude Code.

## Prerequisites

1. **Node.js installed** (version 18 or higher)
2. **AutoHotkey v2 installed** (for Windows functionality)
3. **Claude Code CLI** installed and authenticated
4. **Your MCP server built** (`npm run build` completed)

## Setup Options

### Option 1: Command Line Setup (Recommended)

```bash
# Navigate to your project directory
cd "C:\Users\uphol\Documents\Design\Coding\ahk-mcp"

# Add the MCP server to Claude Code
claude mcp add autohotkey-v2 \
  --env NODE_ENV=production \
  --env AHK_MCP_DATA_MODE=full \
  --env AHK_MCP_LIGHT=0 \
  -- node dist/index.js
```

### Option 2: Configuration File Setup

1. Copy the appropriate configuration file:
   - **Windows:** Use `.mcp.windows.json`
   - **WSL/Linux:** Use `.mcp.json`

2. For Windows PowerShell:
```powershell
# Copy Windows configuration
Copy-Item .mcp.windows.json .mcp.json
```

3. For WSL/Linux:
```bash
# The .mcp.json is already configured for WSL paths
```

## Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Optimizes for production use |
| `AHK_MCP_DATA_MODE` | `full` | Loads complete documentation |
| `AHK_MCP_LIGHT` | `0` | Disables light mode |

## Verify Installation

```bash
# List configured MCP servers
claude mcp list

# Get details about your AutoHotkey server
claude mcp get autohotkey-v2

# Test the server connection
node dist/index.js
```

## Available Tools

Once configured, Claude Code will have access to these AutoHotkey tools:

### 🔧 Core Tools
- `ahk_run` - Run AutoHotkey scripts (with window detection!)
- `ahk_analyze` - Analyze AutoHotkey code syntax
- `ahk_complete` - Get code completion suggestions
- `ahk_diagnostics` - Check for code issues

### 📝 Documentation Tools  
- `ahk_doc_search` - Search AutoHotkey documentation
- `ahk_summary` - Get quick reference summaries
- `ahk_context_injector` - Auto-inject relevant docs

### 🛠️ Development Tools
- `ahk_debug_agent` - Debug assistance
- `ahk_vscode_problems` - VS Code integration
- `ahk_config` - Configuration management
- `ahk_active_file` - Active file tracking

### 📋 Utility Tools
- `ahk_recent_scripts` - Track recent scripts
- `ahk_prompts` - Access prompt templates
- `ahk_sampling_enhancer` - Enhance code samples

## Testing the Setup

### Basic Test
```bash
# Start Claude Code and try:
/ahk_summary
```

### Window Detection Test
```bash
# In Claude Code, try running your test script:
{
  "tool": "ahk_run",
  "args": {
    "mode": "run",
    "filePath": "C:\\Users\\uphol\\Documents\\Design\\Coding\\AHK\\!Running\\__Test-MCP.ahk",
    "wait": false,
    "detectWindow": true,
    "windowDetectTimeout": 5000
  }
}
```

## Troubleshooting

### Common Issues

**"Command not found" errors:**
- Ensure Node.js is in your PATH
- Verify `npm run build` completed successfully
- Check file paths in configuration

**"AutoHotkey not found" errors:**
- Install AutoHotkey v2 from https://autohotkey.com
- Or specify `ahkPath` parameter in tool calls

**Connection issues:**
- Check that the MCP server starts without errors
- Verify environment variables are set correctly
- Ensure no other processes are using the same resources

### Debug Mode
```bash
# Run server manually to see debug output
cd "C:\Users\uphol\Documents\Design\Coding\ahk-mcp"
NODE_ENV=development node dist/index.js
```

## Configuration Scopes

- **Project scope:** Configuration applies only to this project
- **User scope:** Available across all Claude Code projects
- **Local scope:** Private to your development environment

## Next Steps

1. **Test window detection** with your existing AutoHotkey scripts
2. **Use code analysis tools** to improve your AHK code quality  
3. **Leverage documentation search** for faster development
4. **Set up watch mode** for automatic script reloading

## Support

For issues:
- Check server logs with `NODE_ENV=development node dist/index.js`
- Verify AutoHotkey installation with `autohotkey --version`
- Test MCP connection with `claude mcp list`

Your AutoHotkey MCP server is now ready to enhance your AutoHotkey development workflow in Claude Code!