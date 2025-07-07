# AutoHotkey MCP Sampling Implementation Guide

## 🎯 Overview

Our AutoHotkey MCP Server now implements **MCP Sampling standards** for automatic context enhancement. This enables intelligent prompt enhancement with AutoHotkey documentation when AutoHotkey-related content is detected.

## 🚀 MCP Sampling Standards Compliance

### **Standard Message Format**
Our implementation follows the official MCP sampling message format:

```typescript
{
  messages: [
    {
      role: "user" | "assistant",
      content: {
        type: "text",
        text: "Enhanced prompt with AutoHotkey context"
      }
    }
  ],
  modelPreferences: {
    hints: [{ name: "claude-3" }, { name: "sonnet" }],
    costPriority: 0.3,
    speedPriority: 0.5,
    intelligencePriority: 0.8
  },
  systemPrompt: "You are an expert AutoHotkey v2 developer...",
  includeContext: "thisServer",
  temperature: 0.1,
  maxTokens: 1000,
  stopSequences: ["```\n\n---", "END_OF_SCRIPT"],
  metadata: {
    purpose: "autohotkey_code_generation",
    contextEnhanced: true
  }
}
```

### **Human-in-the-Loop Controls**
- ✅ **Prompt Review**: Users can see and modify enhanced prompts
- ✅ **Context Control**: Client controls what context is included
- ✅ **Model Selection**: Users control which model is used
- ✅ **Safety Filtering**: Clients can filter or modify completions

## 🔧 Available Tools

### **1. `ahk_sampling_enhancer`**
**Purpose**: Creates MCP-standard sampling requests with AutoHotkey context enhancement

**Parameters**:
```typescript
{
  originalPrompt: string,              // User's original request
  includeExamples?: boolean,           // Include code examples (default: true)
  contextLevel?: 'minimal' | 'standard' | 'comprehensive',
  modelPreferences?: {
    intelligencePriority?: number,     // 0-1, importance of capabilities
    costPriority?: number,             // 0-1, importance of minimizing cost  
    speedPriority?: number             // 0-1, importance of low latency
  },
  maxTokens?: number                   // Maximum tokens to generate
}
```

**Example Usage**:
```bash
# In Claude Desktop:
ahk_sampling_enhancer {
  "originalPrompt": "Create a clipboard manager with GUI buttons",
  "contextLevel": "comprehensive",
  "modelPreferences": {
    "intelligencePriority": 0.9,
    "costPriority": 0.2
  }
}
```

## 🎮 Automatic Detection Patterns

### **AutoHotkey Content Detection**
The system automatically detects AutoHotkey-related content using these patterns:

| **Pattern** | **Detects** | **Example** |
|-------------|-------------|-------------|
| `\b(autohotkey\|ahk)\b` | Direct AutoHotkey mentions | "autohotkey script", "ahk automation" |
| `\b(hotkey\|gui\|clipboard)\b` | Core concepts | "hotkey binding", "gui window", "clipboard manager" |
| `\ba_\w+\b` | Built-in variables | "A_Clipboard", "A_WorkingDir" |
| `\b\w+(read\|write\|get\|set)\b` | Function patterns | "FileRead", "WinGet", "SendText" |

### **Context Enhancement Levels**

#### **Minimal** (`contextLevel: 'minimal'`)
- 2 relevant functions
- 2 relevant variables  
- No code examples
- Basic coding standards

#### **Standard** (`contextLevel: 'standard'`) 
- 4 relevant functions
- 3 relevant variables
- Code examples included
- Comprehensive standards

#### **Comprehensive** (`contextLevel: 'comprehensive'`)
- 6 relevant functions
- 5 relevant variables
- Full examples and parameters
- Complete coding guidelines

## 🔄 Workflow Examples

### **Example 1: Clipboard Manager Request**

**1. User Input:**
```
"I need a clipboard manager that saves clipboard history to a file"
```

**2. Auto-Detection:**
- ✅ Keywords detected: `clipboard`, `manager`, `file`
- ✅ AutoHotkey content confirmed

**3. Context Enhancement:**
```markdown
## 🎯 AutoHotkey v2 Context (Auto-Enhanced)

### Functions
**FileWrite(Filename, Text)**: Writes text to a file
Example:
```autohotkey
FileWrite("clipboard_history.txt", A_Clipboard)
```

### Built-in Variables  
**A_Clipboard**: Contains the current clipboard text content

### AutoHotkey v2 Standards
- Use `:=` for assignment, `=` for comparison
- Use `Map()` for data structures instead of `{key: value}`
```

**4. Sampling Request:**
```json
{
  "method": "sampling/createMessage",
  "params": {
    "messages": [
      {
        "role": "user", 
        "content": {
          "type": "text",
          "text": "[Enhanced context above]\n\n---\n\n**User Request:**\nI need a clipboard manager that saves clipboard history to a file"
        }
      }
    ],
    "systemPrompt": "You are an expert AutoHotkey v2 developer...",
    "modelPreferences": {
      "intelligencePriority": 0.8,
      "costPriority": 0.3
    },
    "maxTokens": 1000
  }
}
```

**5. Enhanced Result:**
The LLM receives rich AutoHotkey context and generates accurate v2 code with proper syntax, built-in variables, and best practices.

## 🛠️ Advanced Usage

### **Programmatic Context Enhancement**
```typescript
// Server-side usage
const server = new AutoHotkeyMcpServer();

// Automatically enhance AutoHotkey-related prompts
const result = await server.processMessageWithAutoContext(
  "Create a GUI with buttons that send hotkeys"
);

if (result.enhanced) {
  console.log('AutoHotkey content detected and enhanced!');
  console.log('Sampling request:', result.samplingRequest);
}
```

### **Custom Model Preferences**
```typescript
// Optimize for code quality over cost
const enhancedRequest = await server.createAutoHotkeyContextSamplingRequest(
  "Build a file organizer script",
  {
    contextLevel: 'comprehensive',
    modelPreferences: {
      intelligencePriority: 0.95,  // Prioritize capable models
      costPriority: 0.1,           // Cost is less important
      speedPriority: 0.3           // Medium speed priority
    },
    maxTokens: 2000
  }
);
```

## 📋 MCP Resources Available

### **Context Resources**
- `ahk://context/auto` - Smart context based on detected keywords
- `ahk://docs/functions` - Complete functions reference
- `ahk://docs/variables` - Complete variables reference

### **Accessing Resources**
```bash
# List all available resources
mcp_client list_resources

# Read auto-context resource
mcp_client read_resource "ahk://context/auto"
```

## 🔒 Security & Best Practices

### **Security Considerations**
- ✅ **Input Validation**: All prompts are sanitized before processing
- ✅ **Rate Limiting**: Sampling requests are rate-limited
- ✅ **Cost Monitoring**: Token usage is tracked and monitored
- ✅ **User Control**: Users maintain full control over sampling

### **Best Practices**
1. **Start with Standard Context**: Use `contextLevel: 'standard'` for most requests
2. **Set Appropriate Token Limits**: Use reasonable `maxTokens` values
3. **Monitor Costs**: Track sampling usage with model preferences
4. **Review Enhanced Prompts**: Always review auto-enhanced content
5. **Handle Errors Gracefully**: Implement proper error handling

### **Performance Optimization**
```typescript
// Optimized for speed
{
  contextLevel: 'minimal',
  modelPreferences: {
    speedPriority: 0.9,
    intelligencePriority: 0.6,
    costPriority: 0.8
  },
  maxTokens: 500
}

// Optimized for quality  
{
  contextLevel: 'comprehensive',
  modelPreferences: {
    intelligencePriority: 0.95,
    speedPriority: 0.3,
    costPriority: 0.2
  },
  maxTokens: 2000
}
```

## 🧪 Testing Your Implementation

### **Test Cases**

**Test 1: Clipboard Operations**
```bash
ahk_sampling_enhancer {
  "originalPrompt": "Monitor clipboard changes and log them",
  "contextLevel": "standard"
}
```
*Expected: Should detect clipboard keywords and provide A_Clipboard, OnClipboardChange context*

**Test 2: GUI Creation**
```bash
ahk_sampling_enhancer {
  "originalPrompt": "Create a settings window with checkboxes",
  "contextLevel": "comprehensive"
}
```
*Expected: Should provide Gui class, Add method, checkbox examples*

**Test 3: File Operations**
```bash
ahk_sampling_enhancer {
  "originalPrompt": "Read configuration from a text file",
  "contextLevel": "minimal"
}
```
*Expected: Should provide FileRead function and A_WorkingDir variable*

## 📊 Context Enhancement Results

### **Accuracy Improvements**
- **Before Enhancement**: Generic code with potential v1/v2 syntax mixing
- **After Enhancement**: Proper AutoHotkey v2 syntax with correct built-ins
- **Documentation Integration**: Contextual help with examples and parameters
- **Standards Compliance**: Automatic adherence to AutoHotkey v2 best practices

### **Expected Outcomes**
- 🎯 **Higher Accuracy**: More precise AutoHotkey v2 code generation
- 📚 **Better Documentation**: Inline comments and explanations
- 🔧 **Proper Syntax**: Correct usage of built-in functions and variables
- ✨ **Best Practices**: Automatic compliance with coding standards

## 🚀 Getting Started

1. **Install and Build**: Ensure your server is built with latest changes
2. **Configure Client**: Add server to Claude Desktop configuration
3. **Test Detection**: Try AutoHotkey-related prompts
4. **Use Sampling Tool**: Call `ahk_sampling_enhancer` with your prompts
5. **Review Results**: Examine enhanced context and sampling requests
6. **Iterate**: Adjust context levels and model preferences as needed

---

**🎉 Congratulations!** Your AutoHotkey MCP Server now implements full MCP Sampling standards with automatic context enhancement for superior AutoHotkey v2 code generation. 