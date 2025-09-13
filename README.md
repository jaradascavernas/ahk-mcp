<div align="center">
  <h1>AutoHotkey v2 MCP Server</h1>
  <p>
    <strong>Model Context Protocol</strong>
  </p>
  <p>
    <a href="#features"><img src="https://img.shields.io/badge/Features-blue?style=for-the-badge" alt="Features"></a>
    <a href="#installation"><img src="https://img.shields.io/badge/Install-green?style=for-the-badge" alt="Installation"></a>
    <a href="#usage"><img src="https://img.shields.io/badge/Usage-purple?style=for-the-badge" alt="Usage"></a>
    <a href="#development"><img src="https://img.shields.io/badge/Develop-orange?style=for-the-badge" alt="Development"></a>
  </p>
</div>

---

## Overview

**AutoHotkey v2 MCP Server** is a comprehensive development environment for AutoHotkey v2 that enhances LLM capabilities with intelligent file management, advanced editing tools, and automated versioning systems. 

🆕 **NEW in v2.1**: Complete file editing suite with diff-based patches, automatic alpha versioning for iterative development, and intelligent active file management.

**Key Features:**
- **Smart File Management**: Automatically detects and manages active AutoHotkey files
- **Advanced Editing**: Git-style diff patches and precise text editing operations  
- **Alpha Versioning**: Automatic versioned backups when development hits obstacles
- **Diagnostic Analysis**: Comprehensive syntax and standards validation
- **Context-Aware**: Intelligent documentation injection based on code patterns 

## Table of Contents

- [Overview](#overview)
- [Example](#example)
- [Features](#features)
  - [🆕 File Management & Editing](#file-management--editing)
  - [🆕 Alpha Versioning System](#alpha-versioning-system)
  - [LSP-like Capabilities](#lsp-like-capabilities)
  - [AutoHotkey v2 Specific Features](#autohotkey-v2-specific-features)
  - [Settings & Configuration](#settings--configuration)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Claude Desktop Configuration](#claude-desktop-configuration)
- [MCP Tools](#mcp-tools)
  - [Core Analysis Tools](#core-analysis-tools)
- [Built-in AutoHotkey Prompts](#built-in-autohotkey-prompts)
- [Documentation Data](#documentation-data)
- [License](#license)
- [🎯 MCP Resources](#mcp-resources)

## Example

An overly simplistic example: 

1. User asks for a clipboard manager tool:
2. LLM creates a plan which includes steps like this: 

```
The user wants me to create a clipboard manager script in AutoHotkey v2. Let me break down the requirements:
Core Functionality:
Monitor clipboard changes
Display collected entries in a GUI
Toggle collection with F6 hotkey
Save content back to clipboard when closing
```
3. The MCP grabs these words from keywords: Clipboard, GUI, Toggle, and Hotkey
4. The MCP sends back more detailed context. For clipboard this would be something like: 

```
The users clipboard can be accessed by the A_Clipboard built-in variable. If the users request involves determining whether or not a clipboard value has changed, use the OnClipboardChanged function object. Clipboard all is used if the user needs to save the clipboard temporarily. When the operation is completed, the script restores the original clipboard contents. 
```
5. The LLM then returns code with much better accuracy. 


## Features

### 🆕 File Management & Editing
- **Smart Active File Detection**: Automatically detects `.ahk` files mentioned in conversations
- **Advanced Text Editing**: Replace, insert, delete, append operations with regex support
- **Diff-Based Patches**: Apply unified diff patches like Git for precise changes
- **Automatic Backups**: Creates `.bak` files before any modifications
- **Cross-Platform Paths**: Intelligent path resolution and validation

### 🆕 Alpha Versioning System
- **Automatic Versioning**: Creates `script_a1.ahk`, `script_a2.ahk` when development stalls
- **Failure Tracking**: Monitors edit failures and triggers alpha creation after 3 attempts
- **Fresh Start Approach**: Preserves original while enabling experimental changes
- **Version History**: Tracks all iterations with timestamps and reasons
- **One-Click Recovery**: Easy switching between original and alpha versions

### LSP-like Capabilities
- **Diagnostics**: Syntax error detection and AutoHotkey v2 coding standards validation
- **Script Analysis**: Comprehensive code analysis with contextual documentation
- **Go-to-Definition**: Navigate to symbol definitions *(planned)*
- **Find References**: Locate symbol usage throughout code *(planned)*

### AutoHotkey v2 Specific Features
- **Built-in Documentation**: Comprehensive AutoHotkey v2 function and class reference
- **Coding Standards**: Enforces Claude-defined AutoHotkey v2 best practices
- **Hotkey Support**: Analysis and validation for hotkey definitions
- **Class Analysis**: Object-oriented programming support with method and property analysis
- **Contextual Help**: Real-time documentation and examples for built-in elements
- **Script Execution**: Run and watch AutoHotkey scripts with process management
- **Window Detection**: Verify GUI script window creation with timing analysis

### Settings & Configuration
- **Granular Control**: Enable/disable individual tools and features
- **Safety Settings**: Configure automatic backups and file restrictions
- **Tool Groups**: Quickly enable/disable file editing vs analysis-only modes
- **Persistent Settings**: Configuration survives server restarts



## Installation

### Prerequisites

Before installing the AutoHotkey v2 MCP Server, ensure you have:

- **Node.js** 18.0.0 or later
- **npm** or **yarn** package manager

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/TrueCrimeAudit/ahk-mcp.git
   cd ahk-mcp
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

   **For development with auto-reload:**
   ```bash
   npm run dev
   ```

### Claude Desktop Configuration

Add the server to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "ahk-mcp": {
      "command": "node",
      "args": ["path/to/ahk-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

## MCP Tools

The server provides **18 specialized tools** for AutoHotkey development:

### 🆕 File Management Tools

#### `ahk_file`
Manage the shared active file variable used by all tools.

```typescript
{
  action: 'get' | 'set' | 'detect' | 'clear',
  path?: string,     // File path for set action
  text?: string      // Text to detect paths from
}
```

#### `ahk_edit`
Perform various text editing operations on AutoHotkey files.

```typescript
{
  action: 'replace' | 'insert' | 'delete' | 'append' | 'prepend',
  search?: string,        // Text to search for
  content?: string,       // New content to add/replace  
  line?: number,          // Line number (1-based)
  regex?: boolean,        // Use regex for search
  all?: boolean          // Replace all occurrences
}
```

#### `ahk_diff_edit`
Apply unified diff patches (like Git diffs) to AutoHotkey files.

```typescript
{
  diff: string,           // Unified diff format patch
  dryRun?: boolean,       // Preview changes without applying
  createBackup?: boolean  // Create backup before editing
}
```

### 🆕 Alpha Versioning Tools

#### `ahk_alpha`
Create and manage alpha versions for iterative development.

```typescript
{
  action: 'create' | 'list' | 'latest' | 'track_failure' | 'reset',
  reason?: string,        // Reason for creating version
  switchToAlpha?: boolean // Switch to new alpha (default: true)
}
```

#### `ahk_settings`
Manage tool settings and enable/disable features.

```typescript
{
  action: 'get' | 'enable_editing' | 'disable_editing' | 'enable_tool' | 'disable_tool',
  tool?: string,          // Tool name for enable/disable
  settings?: object       // Settings to update
}
```

### Core Analysis Tools


```typescript
{
  code: string,           // AutoHotkey v2 code
  position: {             // Code position
    line: number,         // Zero-based line number
    character: number     // Zero-based character position
  },
  context?: string        // Optional: 'function' | 'variable' | 'class' | 'auto'
}
```

#### `ahk_diagnostics`
Validates code syntax and enforces coding standards with detailed error reporting.

```typescript
{
  code: string,                    // AutoHotkey v2 code to analyze
  enableClaudeStandards?: boolean, // Apply coding standards (default: true)
  severity?: string               // Filter: 'error' | 'warning' | 'info' | 'all'
}
```

#### `ahk_analyze`
Comprehensive script analysis with contextual documentation and usage insights.

```typescript
{
  code: string,                      // AutoHotkey v2 code to analyze
  includeDocumentation?: boolean,    // Include documentation for built-in elements (default: true)
  includeUsageExamples?: boolean,    // Include usage examples (default: false)
  analyzeComplexity?: boolean        // Analyze code complexity (default: false)
}
```

#### `ahk_run`
Execute AutoHotkey scripts with process management and window detection.

```typescript
{
  mode: 'run' | 'watch',             // Execution mode
  filePath?: string,                 // Script path (uses active file if not specified)
  wait?: boolean,                    // Wait for process completion
  detectWindow?: boolean,            // Detect if script creates a window
  runner?: 'native' | 'powershell'  // Process runner type
}
```

### Additional Tools

- **`ahk_doc_search`** - Search AutoHotkey documentation with ranking
- **`ahk_debug_agent`** - Advanced debugging assistance with trace analysis
- **`ahk_summary`** - Get overview of available documentation
- **`ahk_prompts`** - Access curated AutoHotkey expertise prompts
- **`ahk_context_injector`** - Inject relevant docs based on keywords
- **`ahk_vscode_problems`** - Read VS Code problems panel
- **`ahk_recent_scripts`** - Track recently accessed scripts
- **`ahk_process_request`** - Handle multi-line input with file paths and instructions

## 🚀 Usage Examples

### Quick File Editing
```
User: "C:\Scripts\test.ahk - change 'Hello' to 'Hi'"

Result:
✅ File automatically detected and set as active
✅ Text replaced using ahk_edit tool
✅ Backup created as test.ahk.bak
```

### Multi-line Input
```
User: 
C:\Scripts\calculator.ahk

Add error handling and fix syntax errors

Result:
✅ Script path detected and set as active
✅ ahk_process_request analyzes the request
✅ Runs diagnostics and applies fixes
```

### Alpha Versioning in Action
```
Edit attempt 1: Syntax error → Fails (1/3)
Edit attempt 2: Logic error → Fails (2/3)  
Edit attempt 3: Runtime error → Fails (3/3)

🔄 AUTO: Creates calculator_a1.ahk
✅ Switches to alpha version
✅ Fresh start with new approach
```

### Diff-Based Editing
```
User provides Git diff:
--- script.ahk
+++ script.ahk  
@@ -1,3 +1,4 @@
 ; My Script
+#Requires AutoHotkey v2.0
 
 MsgBox("Hello")

Result: Patch applied perfectly with validation
```

## Built-in AutoHotkey Prompts

The server includes **7 ready-to-use AutoHotkey v2 prompts** accessible through Claude:

1. **File System Watcher** - Monitor directory changes with callbacks
2. **CPU Usage Monitor** - Display real-time CPU usage in tooltips
3. **Clipboard Editor** - GUI-based clipboard text manipulation
4. **Hotkey Toggle Function** - Dynamic hotkey management with feedback
5. **Link Manager** - URL validation and browser integration
6. **Snippet Manager** - Text snippet storage and insertion system

Access these prompts through Claude's interface by typing `/` and selecting from the available AutoHotkey prompts.

## Documentation Data

The server includes comprehensive AutoHotkey v2 documentation:

- **Functions**: 200+ built-in functions with parameters and examples
- **Classes**: GUI, File, Array, Map, and other core classes
- **Variables**: Built-in variables like A_WorkingDir, A_ScriptName
- **Methods**: Class methods with detailed parameter information
- **Directives**: #Include, #Requires, and other preprocessor directives

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 MCP Resources

The server exposes comprehensive AutoHotkey documentation and templates through MCP Resources:

### **Documentation Resources**
- **`ahk://context/auto`** - Smart contextual AutoHotkey documentation
- **`ahk://docs/functions`** - Complete AutoHotkey v2 functions reference
- **`ahk://docs/variables`** - Complete AutoHotkey v2 variables reference  
- **`ahk://docs/classes`** - Complete AutoHotkey v2 classes reference
- **`ahk://docs/methods`** - Complete AutoHotkey v2 methods reference

### **Script Templates**
Ready-to-use AutoHotkey v2 script templates:
- **`ahk://templates/file-system-watcher`** - Monitor directories for file changes
- **`ahk://templates/clipboard-manager`** - GUI clipboard editor with text transformations
- **`ahk://templates/cpu-monitor`** - System CPU usage monitor with tooltips
- **`ahk://templates/hotkey-toggle`** - Dynamic hotkey management system

### **Live System Data**
- **`ahk://system/clipboard`** - Real-time clipboard information
- **`ahk://system/info`** - System and environment information

*Resources are automatically available in compatible MCP clients like Claude Desktop. Users can select resources to include as context for their AutoHotkey development.*

## 🎛️ Configuration

### Tool Settings
Control which features are enabled:

```json
// Enable only analysis tools (read-only mode)
{"tool": "ahk_settings", "arguments": {"action": "disable_editing"}}

// Enable all file editing tools  
{"tool": "ahk_settings", "arguments": {"action": "enable_editing"}}

// Disable specific tool
{"tool": "ahk_settings", "arguments": {"action": "disable_tool", "tool": "ahk_edit"}}
```

### Environment Variables
- `AHK_MCP_DATA_MODE=light` - Load minimal documentation for better performance
- `AHK_MCP_SETTINGS_PATH` - Custom settings file location
- `AHK_SCRIPT_DIR` - Default directory for script resolution

### File Locations
- **Settings**: `%APPDATA%\ahk-mcp\tool-settings.json` (Windows)
- **Alpha Versions**: `%APPDATA%\ahk-mcp\alpha-versions.json`
- **Config**: `%APPDATA%\ahk-mcp\config.json`

---

<div align="center">
  <p>
    <strong>Built with ❤️ for the community</strong>
  </p>
  <p>
    <a href="https://www.autohotkey.com/docs/v2/">Official AHK Documents</a>
  </p>
</div> 