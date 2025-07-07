import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { initializeDataLoader, getAhkIndex } from './core/loader.js';
import logger from './logger.js';
// Import tool classes and definitions
import { AhkCompleteTool, ahkCompleteToolDefinition } from './tools/ahk-complete.js';
import { AhkDiagnosticsTool, ahkDiagnosticsToolDefinition } from './tools/ahk-diagnostics.js';
import { AhkSummaryTool, ahkSummaryToolDefinition } from './tools/ahk-summary.js';
import { AhkPromptsTool, ahkPromptsToolDefinition, PROMPTS } from './tools/ahk-prompts.js';
import { AhkAnalyzeTool, ahkAnalyzeToolDefinition } from './tools/ahk-analyze.js';
import { AhkContextInjectorTool, ahkContextInjectorToolDefinition } from './tools/ahk-context-injector.js';
import { AhkSamplingEnhancer, ahkSamplingEnhancerToolDefinition } from './tools/ahk-sampling-enhancer.js';
export class AutoHotkeyMcpServer {
    constructor() {
        this.server = new Server({
            name: 'ahk-mcp',
            version: '2.0.0',
            fileExtensions: ['.ahk'],
            languages: ['autohotkey', 'ahk'],
        }, {
            capabilities: {
                tools: {},
                prompts: {},
                resources: {},
                sampling: {},
                fileExtensions: ['.ahk'],
                languages: ['autohotkey', 'ahk'],
            },
        });
        // Initialize tool instances
        this.ahkCompleteToolInstance = new AhkCompleteTool();
        this.ahkDiagnosticsToolInstance = new AhkDiagnosticsTool();
        this.ahkSummaryToolInstance = new AhkSummaryTool();
        this.ahkPromptsToolInstance = new AhkPromptsTool();
        this.ahkAnalyzeToolInstance = new AhkAnalyzeTool();
        this.ahkContextInjectorToolInstance = new AhkContextInjectorTool();
        this.ahkSamplingEnhancerToolInstance = new AhkSamplingEnhancer();
        this.setupToolHandlers();
        this.setupPromptHandlers();
        this.setupResourceHandlers();
    }
    /**
     * Setup MCP tool handlers
     */
    setupToolHandlers() {
        // List tools handler
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            logger.debug('Listing available AutoHotkey tools');
            return {
                tools: [
                    ahkCompleteToolDefinition,
                    ahkDiagnosticsToolDefinition,
                    ahkSummaryToolDefinition,
                    ahkPromptsToolDefinition,
                    ahkAnalyzeToolDefinition,
                    ahkContextInjectorToolDefinition,
                    ahkSamplingEnhancerToolDefinition,
                ],
            };
        });
        // Call tool handler
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            logger.info(`Executing tool: ${name}`);
            try {
                switch (name) {
                    case 'ahk_complete':
                        return await this.ahkCompleteToolInstance.execute(args);
                    case 'ahk_diagnostics':
                        return await this.ahkDiagnosticsToolInstance.execute(args);
                    case 'ahk_summary':
                        return await this.ahkSummaryToolInstance.execute();
                    case 'ahk_prompts':
                        return await this.ahkPromptsToolInstance.execute();
                    case 'ahk_analyze':
                        return await this.ahkAnalyzeToolInstance.execute(args);
                    case 'ahk_context_injector':
                        return await this.ahkContextInjectorToolInstance.execute(args);
                    case 'ahk_sampling_enhancer':
                        return await this.ahkSamplingEnhancerToolInstance.execute(args);
                    default:
                        logger.error(`Unknown tool: ${name}`);
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                logger.error(`Error executing tool ${name}:`, error);
                throw error;
            }
        });
    }
    /**
     * Setup MCP prompt handlers
     */
    setupPromptHandlers() {
        // List prompts handler
        this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
            logger.debug('Listing available AutoHotkey prompts');
            return {
                prompts: PROMPTS.map((prompt, index) => ({
                    name: this.createPromptName(prompt.title),
                    description: `AutoHotkey v2: ${prompt.title}`,
                    arguments: []
                }))
            };
        });
        // Get prompt handler  
        this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
            const { name } = request.params;
            logger.info(`Getting prompt: ${name}`);
            // Find prompt by matching the created name
            const prompt = PROMPTS.find(p => this.createPromptName(p.title) === name);
            if (!prompt) {
                throw new Error(`Prompt not found: ${name}`);
            }
            return {
                description: prompt.title,
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: prompt.body
                        }
                    }
                ]
            };
        });
    }
    /**
     * Create a URL-safe prompt name from title
     */
    createPromptName(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    }
    /**
     * Setup MCP resource handlers for automatic context injection
     */
    setupResourceHandlers() {
        // List resources handler
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            logger.debug('Listing available AutoHotkey resources');
            return {
                resources: [
                    {
                        uri: 'ahk://context/auto',
                        name: 'AutoHotkey Auto-Context',
                        description: 'Automatically provides relevant AutoHotkey documentation based on detected keywords',
                        mimeType: 'text/markdown'
                    },
                    {
                        uri: 'ahk://docs/functions',
                        name: 'AutoHotkey Functions Reference',
                        description: 'Complete reference of AutoHotkey v2 built-in functions',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'ahk://docs/variables',
                        name: 'AutoHotkey Variables Reference',
                        description: 'Complete reference of AutoHotkey v2 built-in variables',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'ahk://docs/classes',
                        name: 'AutoHotkey Classes Reference',
                        description: 'Complete reference of AutoHotkey v2 built-in classes',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'ahk://docs/methods',
                        name: 'AutoHotkey Methods Reference',
                        description: 'Complete reference of AutoHotkey v2 built-in methods',
                        mimeType: 'application/json'
                    },
                    {
                        uri: 'ahk://templates/file-system-watcher',
                        name: 'File System Watcher Template',
                        description: 'AutoHotkey v2 script template for monitoring file system changes',
                        mimeType: 'text/plain'
                    },
                    {
                        uri: 'ahk://templates/clipboard-manager',
                        name: 'Clipboard Manager Template',
                        description: 'AutoHotkey v2 script template for clipboard management',
                        mimeType: 'text/plain'
                    },
                    {
                        uri: 'ahk://templates/cpu-monitor',
                        name: 'CPU Monitor Template',
                        description: 'AutoHotkey v2 script template for system monitoring',
                        mimeType: 'text/plain'
                    },
                    {
                        uri: 'ahk://templates/hotkey-toggle',
                        name: 'Hotkey Toggle Template',
                        description: 'AutoHotkey v2 script template for hotkey management',
                        mimeType: 'text/plain'
                    },
                    {
                        uri: 'ahk://system/clipboard',
                        name: 'Live Clipboard Content',
                        description: 'Real-time clipboard content (read-only)',
                        mimeType: 'text/plain'
                    },
                    {
                        uri: 'ahk://system/info',
                        name: 'System Information',
                        description: 'Current system information and AutoHotkey environment',
                        mimeType: 'application/json'
                    }
                ]
            };
        });
        // Read resource handler
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            logger.info(`Reading resource: ${uri}`);
            if (uri === 'ahk://context/auto') {
                // This would normally be triggered by analyzing user input
                // For now, return a placeholder
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'text/markdown',
                            text: '## 🎯 AutoHotkey Context Available\n\nUse the `ahk_context_injector` tool to analyze your prompts and get relevant AutoHotkey documentation automatically injected.'
                        }
                    ]
                };
            }
            if (uri === 'ahk://docs/functions') {
                const ahkIndex = getAhkIndex();
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(ahkIndex?.functions || [], null, 2)
                        }
                    ]
                };
            }
            if (uri === 'ahk://docs/variables') {
                const ahkIndex = getAhkIndex();
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(ahkIndex?.variables || [], null, 2)
                        }
                    ]
                };
            }
            if (uri === 'ahk://docs/classes') {
                const ahkIndex = getAhkIndex();
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(ahkIndex?.classes || [], null, 2)
                        }
                    ]
                };
            }
            if (uri === 'ahk://docs/methods') {
                const ahkIndex = getAhkIndex();
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(ahkIndex?.methods || [], null, 2)
                        }
                    ]
                };
            }
            // Script templates
            if (uri === 'ahk://templates/file-system-watcher') {
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'text/plain',
                            text: `; AutoHotkey v2 File System Watcher Template
; Monitors a directory for file changes and triggers callbacks

class FileSystemWatcher {
    __New(directory, callback) {
        this.directory := directory
        this.callback := callback
        this.timer := ObjBindMethod(this, "CheckChanges")
        this.lastModified := Map()
        this.Initialize()
    }
    
    Initialize() {
        ; Store initial state
        Loop Files, this.directory "\\*.*", "R" {
            this.lastModified[A_LoopFileFullPath] := A_LoopFileTimeModified
        }
        ; Start monitoring
        SetTimer(this.timer, 1000)
    }
    
    CheckChanges() {
        currentFiles := Map()
        
        ; Check all files in directory
        Loop Files, this.directory "\\*.*", "R" {
            currentFiles[A_LoopFileFullPath] := A_LoopFileTimeModified
            
            ; Check if file is new or modified
            if (!this.lastModified.Has(A_LoopFileFullPath)) {
                this.callback.Call("created", A_LoopFileFullPath)
            } else if (this.lastModified[A_LoopFileFullPath] != A_LoopFileTimeModified) {
                this.callback.Call("modified", A_LoopFileFullPath)
            }
        }
        
        ; Check for deleted files
        for file, _ in this.lastModified {
            if (!currentFiles.Has(file)) {
                this.callback.Call("deleted", file)
            }
        }
        
        this.lastModified := currentFiles
    }
    
    Stop() {
        SetTimer(this.timer, 0)
    }
}

; Example usage:
; watcher := FileSystemWatcher("C:\\MyFolder", (action, file) => {
;     ToolTip(action ": " file)
;     SetTimer(() => ToolTip(), -2000)
; })
`
                        }
                    ]
                };
            }
            if (uri === 'ahk://templates/clipboard-manager') {
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'text/plain',
                            text: `; AutoHotkey v2 Clipboard Manager Template
; Opens GUI with clipboard content and text transformation options

class ClipboardManager {
    __New() {
        this.CreateGUI()
        this.LoadClipboard()
    }
    
    CreateGUI() {
        this.gui := Gui("+Resize", "Clipboard Manager")
        this.gui.SetFont("s10", "Consolas")
        
        ; Main edit control
        this.editControl := this.gui.Add("Edit", "x10 y10 w400 h300 VScroll")
        
        ; Buttons
        this.gui.Add("Button", "x10 y320 w80 h30 gUpperCase", "UPPER").OnEvent("Click", (*) => this.UpperCase())
        this.gui.Add("Button", "x100 y320 w80 h30 gLowerCase", "lower").OnEvent("Click", (*) => this.LowerCase())
        this.gui.Add("Button", "x190 y320 w80 h30 gTitleCase", "Title Case").OnEvent("Click", (*) => this.TitleCase())
        this.gui.Add("Button", "x280 y320 w80 h30 gSaveClip", "Save to Clipboard").OnEvent("Click", (*) => this.SaveToClipboard())
        this.gui.Add("Button", "x370 y320 w50 h30 gReload", "Reload").OnEvent("Click", (*) => this.LoadClipboard())
        
        ; Status bar
        this.statusBar := this.gui.Add("StatusBar")
        this.statusBar.SetText("Ready")
        
        this.gui.OnEvent("Close", (*) => ExitApp())
        this.gui.Show()
    }
    
    LoadClipboard() {
        this.editControl.Text := A_Clipboard
        this.statusBar.SetText("Clipboard loaded - " StrLen(A_Clipboard) " characters")
    }
    
    UpperCase() {
        this.editControl.Text := StrUpper(this.editControl.Text)
        this.statusBar.SetText("Converted to UPPERCASE")
    }
    
    LowerCase() {
        this.editControl.Text := StrLower(this.editControl.Text)
        this.statusBar.SetText("Converted to lowercase")
    }
    
    TitleCase() {
        this.editControl.Text := StrTitle(this.editControl.Text)
        this.statusBar.SetText("Converted to Title Case")
    }
    
    SaveToClipboard() {
        A_Clipboard := this.editControl.Text
        this.statusBar.SetText("Saved to clipboard - " StrLen(A_Clipboard) " characters")
    }
}

; Create and show clipboard manager
clipManager := ClipboardManager()
`
                        }
                    ]
                };
            }
            if (uri === 'ahk://templates/cpu-monitor') {
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'text/plain',
                            text: `; AutoHotkey v2 CPU Monitor Template
; Displays current CPU usage as an updating tooltip

class CPUMonitor {
    __New() {
        this.Initialize()
    }
    
    Initialize() {
        ; Start monitoring timer
        this.timer := ObjBindMethod(this, "UpdateCPU")
        SetTimer(this.timer, 1000)
        
        ; Initial update
        this.UpdateCPU()
    }
    
    UpdateCPU() {
        try {
            ; Get CPU usage using WMI
            cpuUsage := this.GetCPUUsage()
            
            ; Display as tooltip
            ToolTip("CPU Usage: " cpuUsage "%\\nPress Ctrl+Alt+Q to quit", 10, 10)
        } catch Error as e {
            ToolTip("Error reading CPU: " e.Message, 10, 10)
        }
    }
    
    GetCPUUsage() {
        ; Use WMI to get CPU usage
        for objItem in ComObjGet("winmgmts:").ExecQuery("SELECT * FROM Win32_Processor") {
            return Round(objItem.LoadPercentage, 1)
        }
        return 0
    }
    
    Stop() {
        SetTimer(this.timer, 0)
        ToolTip()
    }
}

; Hotkey to quit
^!q::ExitApp()

; Start CPU monitor
cpuMonitor := CPUMonitor()
`
                        }
                    ]
                };
            }
            if (uri === 'ahk://templates/hotkey-toggle') {
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'text/plain',
                            text: `; AutoHotkey v2 Hotkey Toggle Template
; Function to toggle any hotkey on/off with visual feedback

class HotkeyManager {
    __New() {
        this.hotkeyStates := Map()
    }
    
    ; Toggle a hotkey on/off
    ToggleHotkey(hotkey, callback, description := "") {
        if (this.hotkeyStates.Has(hotkey)) {
            ; Hotkey exists, toggle it
            if (this.hotkeyStates[hotkey].enabled) {
                this.DisableHotkey(hotkey)
            } else {
                this.EnableHotkey(hotkey)
            }
        } else {
            ; New hotkey, register it
            this.RegisterHotkey(hotkey, callback, description)
        }
    }
    
    RegisterHotkey(hotkey, callback, description := "") {
        try {
            Hotkey(hotkey, callback)
            this.hotkeyStates[hotkey] := {
                enabled: true,
                callback: callback,
                description: description
            }
            this.ShowStatus(hotkey, "ENABLED", description)
        } catch Error as e {
            this.ShowStatus(hotkey, "ERROR: " e.Message)
        }
    }
    
    EnableHotkey(hotkey) {
        if (this.hotkeyStates.Has(hotkey)) {
            try {
                Hotkey(hotkey, "On")
                this.hotkeyStates[hotkey].enabled := true
                this.ShowStatus(hotkey, "ENABLED", this.hotkeyStates[hotkey].description)
            } catch Error as e {
                this.ShowStatus(hotkey, "ERROR: " e.Message)
            }
        }
    }
    
    DisableHotkey(hotkey) {
        if (this.hotkeyStates.Has(hotkey)) {
            try {
                Hotkey(hotkey, "Off")
                this.hotkeyStates[hotkey].enabled := false
                this.ShowStatus(hotkey, "DISABLED", this.hotkeyStates[hotkey].description)
            } catch Error as e {
                this.ShowStatus(hotkey, "ERROR: " e.Message)
            }
        }
    }
    
    ShowStatus(hotkey, status, description := "") {
        message := "Hotkey: " hotkey "\\nStatus: " status
        if (description) {
            message .= "\\nDescription: " description
        }
        ToolTip(message)
        SetTimer(() => ToolTip(), -2000)
    }
    
    ListHotkeys() {
        message := "Registered Hotkeys:\\n"
        for hotkey, state in this.hotkeyStates {
            status := state.enabled ? "ON" : "OFF"
            desc := state.description ? " - " state.description : ""
            message .= hotkey " [" status "]" desc "\\n"
        }
        MsgBox(message, "Hotkey Manager")
    }
}

; Create hotkey manager
hkManager := HotkeyManager()

; Example usage:
; Toggle F1 key
F12::hkManager.ToggleHotkey("F1", (*) => MsgBox("F1 pressed!"), "Example hotkey")

; List all hotkeys
^F12::hkManager.ListHotkeys()
`
                        }
                    ]
                };
            }
            if (uri === 'ahk://system/clipboard') {
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'text/plain',
                            text: "(Live clipboard access not available in MCP server context)\nUse AutoHotkey scripts with A_Clipboard variable to access clipboard content."
                        }
                    ]
                };
            }
            if (uri === 'ahk://system/info') {
                const systemInfo = {
                    autohotkeyVersion: "v2.0+",
                    operatingSystem: "Windows",
                    computerName: "Unknown",
                    userName: "Unknown",
                    timestamp: new Date().toISOString(),
                    processId: process.pid,
                    workingDirectory: process.cwd(),
                    nodeVersion: process.version,
                    platform: process.platform,
                    arch: process.arch,
                    memoryUsage: process.memoryUsage(),
                    uptime: process.uptime()
                };
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(systemInfo, null, 2)
                        }
                    ]
                };
            }
            throw new Error(`Resource not found: ${uri}`);
        });
    }
    /**
     * Automatically create sampling requests for AutoHotkey-related prompts
     * This follows MCP sampling standards for automatic context enhancement
     */
    async createAutoHotkeyContextSamplingRequest(originalPrompt, options = {}) {
        const samplingEnhancer = this.ahkSamplingEnhancerToolInstance;
        // Use the sampling enhancer to create a properly formatted request
        const defaultModelPreferences = {
            intelligencePriority: 0.8,
            costPriority: 0.3,
            speedPriority: 0.5
        };
        const enhancementResult = await samplingEnhancer.execute({
            originalPrompt,
            includeExamples: true,
            contextLevel: options.contextLevel || 'standard',
            modelPreferences: {
                intelligencePriority: options.modelPreferences?.intelligencePriority ?? defaultModelPreferences.intelligencePriority,
                costPriority: options.modelPreferences?.costPriority ?? defaultModelPreferences.costPriority,
                speedPriority: options.modelPreferences?.speedPriority ?? defaultModelPreferences.speedPriority
            },
            maxTokens: options.maxTokens || 1000
        });
        return enhancementResult;
    }
    /**
     * Process incoming messages and automatically enhance AutoHotkey-related content
     * This method demonstrates how to implement automatic context injection
     */
    async processMessageWithAutoContext(message) {
        // Pattern matching for AutoHotkey content
        const ahkPatterns = [
            /\b(autohotkey|ahk)\b/gi,
            /\b(hotkey|gui|clipboard|send|msgbox)\b/gi,
            /\ba_\w+\b/gi,
            /\b(script|automation|macro)\b/gi
        ];
        const isAutoHotkeyRelated = ahkPatterns.some(pattern => pattern.test(message));
        if (!isAutoHotkeyRelated) {
            return {
                enhanced: false,
                originalMessage: message
            };
        }
        // Create enhanced sampling request
        const samplingRequest = await this.createAutoHotkeyContextSamplingRequest(message, {
            contextLevel: 'standard',
            modelPreferences: {
                intelligencePriority: 0.8,
                costPriority: 0.3,
                speedPriority: 0.5
            }
        });
        return {
            enhanced: true,
            samplingRequest,
            originalMessage: message,
            enhancedMessage: `Enhanced with AutoHotkey context: ${message}`
        };
    }
    /**
     * Initialize the server and load data
     */
    async initialize() {
        try {
            logger.info('Initializing AutoHotkey MCP Server...');
            // Load AutoHotkey documentation data
            await initializeDataLoader();
            logger.info('AutoHotkey MCP Server initialized successfully');
        }
        catch (error) {
            logger.error('Failed to initialize AutoHotkey MCP Server:', error);
            throw error;
        }
    }
    /**
     * Start the server
     */
    async start() {
        try {
            await this.initialize();
            // Connect to stdio
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            logger.info('AutoHotkey MCP Server started and connected to stdio');
            // Handle process termination gracefully
            process.on('SIGINT', () => {
                logger.info('Received SIGINT, shutting down gracefully...');
                process.exit(0);
            });
            process.on('SIGTERM', () => {
                logger.info('Received SIGTERM, shutting down gracefully...');
                process.exit(0);
            });
        }
        catch (error) {
            logger.error('Failed to start AutoHotkey MCP Server:', error);
            process.exit(1);
        }
    }
    /**
     * Get the server instance (for testing)
     */
    getServer() {
        return this.server;
    }
}
