import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { initializeDataLoader } from './core/loader.js';
import logger from './logger.js';

// Import tool classes and definitions
import { AhkCompleteTool, ahkCompleteToolDefinition } from './tools/ahk-complete.js';
import { AhkDiagnosticsTool, ahkDiagnosticsToolDefinition } from './tools/ahk-diagnostics.js';
import { AhkSummaryTool, ahkSummaryToolDefinition } from './tools/ahk-summary.js';
import { AhkPromptsTool, ahkPromptsToolDefinition, PROMPTS } from './tools/ahk-prompts.js';
import { AhkAnalyzeTool, ahkAnalyzeToolDefinition } from './tools/ahk-analyze.js';

export class AutoHotkeyMcpServer {
  private server: Server;
  private ahkCompleteToolInstance: AhkCompleteTool;
  private ahkDiagnosticsToolInstance: AhkDiagnosticsTool;
  private ahkSummaryToolInstance: AhkSummaryTool;
  private ahkPromptsToolInstance: AhkPromptsTool;
  private ahkAnalyzeToolInstance: AhkAnalyzeTool;

  constructor() {
    this.server = new Server(
      {
        name: 'ahk-mcp',
        version: '2.0.0',
        fileExtensions: ['.ahk'],
        languages: ['autohotkey', 'ahk'],
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          fileExtensions: ['.ahk'],
          languages: ['autohotkey', 'ahk'],
        },
      }
    );

    // Initialize tool instances
    this.ahkCompleteToolInstance = new AhkCompleteTool();
    this.ahkDiagnosticsToolInstance = new AhkDiagnosticsTool();
    this.ahkSummaryToolInstance = new AhkSummaryTool();
    this.ahkPromptsToolInstance = new AhkPromptsTool();
    this.ahkAnalyzeToolInstance = new AhkAnalyzeTool();

    this.setupToolHandlers();
    this.setupPromptHandlers();
  }

  /**
   * Setup MCP tool handlers
   */
  private setupToolHandlers(): void {
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
            return await this.ahkCompleteToolInstance.execute(args as any);

          case 'ahk_diagnostics':
            return await this.ahkDiagnosticsToolInstance.execute(args as any);

          case 'ahk_summary':
            return await this.ahkSummaryToolInstance.execute();

          case 'ahk_prompts':
            return await this.ahkPromptsToolInstance.execute();

          case 'ahk_analyze':
            return await this.ahkAnalyzeToolInstance.execute(args as any);

          default:
            logger.error(`Unknown tool: ${name}`);
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error(`Error executing tool ${name}:`, error);
        throw error;
      }
    });
  }

  /**
   * Setup MCP prompt handlers
   */
  private setupPromptHandlers(): void {
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
  private createPromptName(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Initialize the server and load data
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing AutoHotkey MCP Server...');
      
      // Load AutoHotkey documentation data
      await initializeDataLoader();
      
      logger.info('AutoHotkey MCP Server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AutoHotkey MCP Server:', error);
      throw error;
    }
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
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

    } catch (error) {
      logger.error('Failed to start AutoHotkey MCP Server:', error);
      process.exit(1);
    }
  }

  /**
   * Get the server instance (for testing)
   */
  getServer(): Server {
    return this.server;
  }
} 