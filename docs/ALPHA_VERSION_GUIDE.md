# Alpha Version System Guide

## Overview

The Alpha Version System automatically creates versioned copies of scripts when:
- Multiple edit failures occur (3+ failures)
- You explicitly request an alpha version
- The agent needs to change approach after repeated issues

## 🔄 How It Works

### Automatic Alpha Creation

When editing fails 3 times on the same file:
1. System tracks each failure
2. After 3rd failure → **Automatically creates `script_a1.ahk`**
3. Switches active file to the alpha version
4. Resets failure counter
5. Agent continues work on alpha version

### Version Naming

Original: `MyScript.ahk`
- First alpha: `MyScript_a1.ahk`
- Second alpha: `MyScript_a2.ahk`  
- Third alpha: `MyScript_a3.ahk`
- And so on...

## 🛠️ The `ahk_alpha` Tool

### Create Alpha Version Manually
```json
{
  "tool": "ahk_alpha",
  "arguments": {
    "action": "create"
  }
}
```
Creates `script_a1.ahk` and switches to it.

### Create with Reason
```json
{
  "tool": "ahk_alpha",
  "arguments": {
    "action": "create",
    "reason": "Changing approach - original method not working"
  }
}
```

### List All Alpha Versions
```json
{
  "tool": "ahk_alpha",
  "arguments": {
    "action": "list"
  }
}
```

### Switch to Latest Alpha
```json
{
  "tool": "ahk_alpha",
  "arguments": {
    "action": "latest"
  }
}
```

### Track Edit Failure
```json
{
  "tool": "ahk_alpha",
  "arguments": {
    "action": "track_failure"
  }
}
```
Manually track a failure (auto-creates alpha after 3).

### Reset Version History
```json
{
  "tool": "ahk_alpha",
  "arguments": {
    "action": "reset"
  }
}
```

## 🎯 Actions

| Action | Description | Auto-Switch |
|--------|-------------|-------------|
| `create` | Create next alpha version | Yes |
| `list` | Show all alpha versions | No |
| `latest` | Get/switch to latest alpha | Optional |
| `track_failure` | Track edit failure | Yes (after 3) |
| `reset` | Clear version history | No |
| `auto` | Auto-create if needed | Yes |

## 📊 Automatic Triggers

### Edit Tool Integration
When `ahk_edit` or `ahk_diff_edit` fails:
1. Failure is tracked automatically
2. After 3 failures → Alpha created
3. Active file switches to alpha
4. Edit retried on alpha version

### Example Flow
```
1. Edit script.ahk → Fails (tracked: 1)
2. Edit script.ahk → Fails (tracked: 2)  
3. Edit script.ahk → Fails (tracked: 3)
4. AUTO: Creates script_a1.ahk
5. Switches to script_a1.ahk
6. Continues editing alpha version
```

## 💾 Version State

Stored in: `%APPDATA%\ahk-mcp\alpha-versions.json`

```json
{
  "versions": {
    "C:\\Scripts\\test.ahk": 2
  },
  "failures": {
    "C:\\Scripts\\test.ahk": 0
  },
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

## 🚀 Use Cases

### 1. Agent Needs Fresh Start
After multiple failed attempts to fix a script:
```
User: "Create an alpha version and try a different approach"

Agent: Uses ahk_alpha to create test_a1.ahk
       Implements new solution in alpha
       Original remains unchanged
```

### 2. Manual Alpha Request
```
User: "Create an alpha version of this script"

Result: Creates script_a1.ahk
        Sets as active file
        Ready for experimental changes
```

### 3. Automatic Failure Handling
```
Edit attempt 1: Syntax error → Fails
Edit attempt 2: Logic error → Fails  
Edit attempt 3: Runtime error → Fails
Automatic: Creates script_a1.ahk
           Switches to alpha
           Fresh start with new approach
```

## 📝 Alpha Version Headers

Each alpha file includes a header:
```autohotkey
; Alpha Version 1
; Created: 2024-01-15T10:30:00.000Z
; Original: MyScript.ahk
; Reason: Multiple failures - changing approach

[Original content follows]
```

## 🔧 Configuration

### Failure Threshold
Default: 3 failures trigger alpha creation
(Currently hardcoded, could be made configurable)

### Auto-Switch Behavior
Default: Always switch to new alpha
Can be disabled with `"switchToAlpha": false`

## 🎯 Benefits

1. **Preservation**: Original script stays intact
2. **Experimentation**: Try different approaches safely
3. **History**: Track evolution through versions
4. **Automatic**: Handles failures intelligently
5. **Recovery**: Easy to revert to original

## 📋 Quick Commands

### Create Alpha Now
```json
{"tool": "ahk_alpha", "arguments": {"action": "create"}}
```

### List Versions
```json
{"tool": "ahk_alpha", "arguments": {"action": "list"}}
```

### Reset Everything
```json
{"tool": "ahk_alpha", "arguments": {"action": "reset"}}
```

## 🔄 Integration with Edit Tools

The alpha system is fully integrated with:
- `ahk_edit` - Tracks failures, auto-creates alphas
- `ahk_diff_edit` - Same failure tracking
- `ahk_file` - Works with alpha versions
- Active file system - Auto-switches to alphas

## 💡 Tips

1. **Let it work automatically** - The 3-failure threshold usually catches the right moment
2. **Manual creation** - Use when you know you need a fresh approach
3. **Keep originals** - Alphas let you experiment while preserving working code
4. **Version comparison** - Use file diff tools to compare original vs alphas
5. **Cleanup** - Delete old alphas when no longer needed

## Example Scenario

```
1. Working on: calculator.ahk
2. Multiple edit attempts fail
3. System auto-creates: calculator_a1.ahk
4. Agent tries new approach on alpha
5. If that fails too: calculator_a2.ahk
6. Eventually finds working solution
7. User can then:
   - Keep the alpha as the new version
   - Apply changes back to original
   - Compare both versions
```

This system ensures productive iteration without losing work!