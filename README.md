# AutoHotkey v2 MCP Server

A comprehensive **Model Context Protocol (MCP) server** that provides **Language Server Protocol-like capabilities** for AutoHotkey v2, including intelligent code completion, diagnostics, and coding standards validation.

## 🚀 Features

### LSP-like Capabilities
- **Code Completion**: Intelligent suggestions for functions, variables, classes, methods, and keywords
- **Diagnostics**: Syntax error detection and AutoHotkey v2 coding standards validation
- **Go-to-Definition**: Navigate to symbol definitions (planned)
- **Find References**: Locate symbol usage throughout code (planned)

### AutoHotkey v2 Specific Features
- **Built-in Documentation**: Comprehensive AutoHotkey v2 function and class reference
- **Coding Standards**: Enforces Claude-defined AutoHotkey v2 best practices
- **Hotkey Support**: Smart completion for hotkey definitions
- **Class Analysis**: Object-oriented programming support with method and property completion

### Claude Coding Standards
Automatically validates code against AutoHotkey v2 best practices:
- ✅ Use `Map()` for data structures instead of `{key: value}`
- ✅ Initialize classes without `new` keyword: `MyClass()` not `new MyClass()`
- ✅ Use `:=` for assignment, `=` for comparison
- ✅ Escape quotes with backticks: `"Say \`"Hello\`" to user"`
- ✅ Use semicolon comments: `; comment` not `// comment`
- ✅ Bind methods for callbacks: `.OnEvent("Click", this.Method.Bind(this))`
- ✅ Arrow functions for simple expressions only

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup
1. **Clone and install dependencies:**
   ```bash
   git clone [repository-url]
   cd ahk-server-v2
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

   For development with auto-reload:
   ```bash
   npm run dev
   ```

## 🛠️ MCP Tools

### Core Analysis Tools

#### `ahk_complete`
Provides intelligent code completion suggestions.

```typescript
{
  code: string,           // AutoHotkey v2 code
  position: {             // Cursor position
    line: number,         // Zero-based line number
    character: number     // Zero-based character position
  },
  context?: string        // Optional: 'function' | 'variable' | 'class' | 'auto'
}
```

#### `ahk_diagnostics`
Validates code syntax and coding standards.

```typescript
{
  code: string,                    // AutoHotkey v2 code to analyze
  enableClaudeStandards?: boolean, // Apply coding standards (default: true)
  severity?: string               // Filter: 'error' | 'warning' | 'info' | 'all'
}
```

### Documentation Tools

#### `analyze_code`
Comprehensive code analysis with suggestions.

```typescript
{
  code: string,    // AutoHotkey v2 code
  fix?: boolean    // Attempt auto-fixes (default: false)
}
```

#### `find_variables`
Discover relevant AutoHotkey built-in variables.

```typescript
{
  prompt: string   // Natural language description
}
```

#### `get_function_info`
Retrieve function documentation.

```typescript
{
  name?: string,    // Exact function name
  search?: string   // Keyword search
}
```

#### `get_class_info`
Get class and method information.

```typescript
{
  name?: string,     // Class name
  method?: string,   // Specific method
  search?: string    // Keyword search
}
```

## 📋 Usage Examples

### Code Completion Example
```typescript
// Request completions for "Msg" at cursor position
{
  "code": "Msg",
  "position": { "line": 0, "character": 3 }
}

// Returns: MsgBox function with parameters and documentation
```

### Diagnostics Example
```typescript
// Analyze code with standards validation
{
  "code": "config = {width: 800}\nnew MyClass()",
  "enableClaudeStandards": true
}

// Returns warnings about:
// - Using "=" instead of ":="
// - Using object literal instead of Map()
// - Using "new" keyword
```



## 🏗️ Project Structure

```
ahk-server-v2/
├── src/
│   ├── core/                    # Core parsing and analysis
│   │   ├── loader.ts           # Data loading and indexing
│   │   ├── parser.ts           # AutoHotkey v2 parser
│   │   └── claude-standards.ts # Coding standards engine
│   ├── lsp/                    # LSP-like features
│   │   ├── completion.ts       # Code completion
│   │   └── diagnostics.ts     # Error detection
│   ├── tools/                  # MCP tool implementations
│   │   ├── ahk-complete.ts    # Completion tool
│   │   └── ahk-diagnostics.ts # Diagnostics tool
│   ├── types/                  # TypeScript definitions
│   │   ├── lsp-types.ts       # LSP-like types
│   │   ├── ahk-ast.ts         # AutoHotkey AST types
│   │   └── tool-types.ts      # Tool argument types
│   ├── server.ts              # Main MCP server
│   ├── index.ts              # Entry point
│   └── logger.ts             # Logging system
├── NewServer/data/            # AutoHotkey documentation
│   ├── ahk_index.json        # Function/class index
│   ├── ahk_documentation_full.json
│   └── ahk_documentation_index.json
├── scripts/
│   └── copy-data.js          # Build script
└── docs/                     # Documentation
```

## 📊 Documentation Data

The server includes comprehensive AutoHotkey v2 documentation:

- **Functions**: 200+ built-in functions with parameters and examples
- **Classes**: GUI, File, Array, Map, and other core classes
- **Variables**: Built-in variables like A_WorkingDir, A_ScriptName
- **Methods**: Class methods with detailed parameter information
- **Directives**: #Include, #Requires, and other preprocessor directives

## 🔧 Development

### Building
```bash
npm run build        # Production build
npm run watch        # Development watch mode
npm run clean        # Clean dist directory
```

### Linting
```bash
npm run lint         # ESLint validation
```

### Testing
```bash
npm test            # Run tests (when implemented)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Coding Standards
- Follow the AutoHotkey v2 standards enforced by the server
- Use TypeScript strict mode
- Add comprehensive JSDoc comments
- Write tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- AutoHotkey community for comprehensive documentation
- Model Context Protocol specification
- TypeScript LSP implementations for architectural inspiration

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review the implementation guides in `/NewServer/docs`

---

**Built with ❤️ for the AutoHotkey community** 