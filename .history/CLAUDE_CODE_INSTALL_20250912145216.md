# AutoHotkey v2 MCP Server - Claude Code Installation

## Quick Setup

### 1. Locate Your Claude Code Config Directory

**Windows:**
```
%APPDATA%\Code\User\claude\
```
Usually: `C:\Users\[YourUsername]\AppData\Roaming\Code\User\claude\`

**macOS:**
```
~/Library/Application Support/Code/User/claude/
```

**Linux:**
```
~/.config/Code/User/claude/
```

### 2. Copy MCP Configuration

**For Windows users:**
Copy the contents of `.mcp.windows.json` to your Claude Code config:

```powershell
# PowerShell command
Copy-Item "C:\Users\uphol\Documents\Design\Coding\ahk-mcp\.mcp.windows.json" `
          "$env:APPDATA\Code\User\claude\mcp.json"
```

**For WSL/Linux users:**
Copy the contents of `.mcp.json` to your Claude Code config:

```bash
# Bash command
cp /mnt/c/Users/uphol/Documents/Design/Coding/ahk-mcp/.mcp.json \
   ~/.config/Code/User/claude/mcp.json
```

### 3. Verify Installation

1. Open Claude Code
2. Open the Command Palette (Ctrl+Shift+P)
3. Type "MCP" and look for MCP-related commands
4. The AutoHotkey v2 server should appear in available MCP servers

### 4. Test the MCP Server

In Claude Code, try these commands to verify the server is working:

```
"Show me AutoHotkey documentation for MsgBox"
"Analyze this AutoHotkey script: [paste code]"
"What AutoHotkey functions are available for file operations?"
```

## Manual Configuration

If you need to manually configure, add this to your `mcp.json`:

```json
{
  "mcpServers": {
    "autohotkey-v2": {
      "command": "node",
      "args": ["C:\\Users\\uphol\\Documents\\Design\\Coding\\ahk-mcp\\dist\\index.js"],
      "env": {
        "NODE_ENV": "production",
        "AHK_MCP_DATA_MODE": "full",
        "AHK_MCP_LIGHT": "0"
      }
    }
  }
}
```

**Important:** Adjust the path to match where you cloned the ahk-mcp repository.

## Available MCP Tools

Once installed, Claude will have access to these AutoHotkey tools:

### Core Development Tools
- `ahk_run` - Execute AutoHotkey scripts with window detection
- `ahk_analyze` - Advanced code analysis
- `ahk_diagnostics` - Error detection and validation

### Documentation & Context
- `ahk_doc_search` - Search AutoHotkey documentation
- `ahk_context_injector` - Auto-inject relevant context
- `ahk_sampling_enhancer` - Enhance code samples
- `ahk_summary` - Quick reference summaries

### Development Workflow
- `ahk_prompts` - Access prompt templates
- `ahk_debug_agent` - Debug assistance
- `ahk_config` - Configuration management
- `ahk_active_file` - Active file tracking
- `ahk_recent_scripts` - Recent files tracking
- `ahk_vscode_problems` - VS Code integration

## Troubleshooting

### Server Not Starting
1. Ensure Node.js is installed: `node --version` (requires v18+)
2. Build the project first: `npm run build` in the ahk-mcp directory
3. Check the path in mcp.json points to the correct location

### Permission Issues
- On Windows, ensure the ahk-mcp folder has read permissions
- On Linux/macOS, you may need to make the script executable:
  ```bash
  chmod +x /path/to/ahk-mcp/dist/index.js
  ```

### Logs and Debugging
Check Claude Code logs:
- Windows: `%APPDATA%\Code\logs\`
- macOS: `~/Library/Logs/Code/`
- Linux: `~/.config/Code/logs/`

## Environment Variables

You can customize the server behavior with these environment variables:

- `AHK_MCP_DATA_MODE`: "full" | "index" (default: "full")
- `AHK_MCP_LIGHT`: "0" | "1" (default: "0")
- `NODE_ENV`: "production" | "development" (default: "production")

## Support

For issues or questions:
- GitHub Issues: [Create an issue in the ahk-mcp repository]
- Documentation: See README.md for detailed tool documentation

---

*AutoHotkey v2 MCP Server v2.0.0 - Production Ready*