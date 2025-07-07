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
