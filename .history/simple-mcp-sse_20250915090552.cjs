#!/usr/bin/env node
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// SSE endpoint for ChatGPT MCP integration
app.get('/sse', (req, res) => {
  console.log('SSE connection requested');

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send MCP initialization
  const initMessage = {
    jsonrpc: '2.0',
    method: 'notifications/initialized',
    params: {}
  };

  res.write(`data: ${JSON.stringify(initMessage)}\n\n`);

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write('data: {"jsonrpc":"2.0","method":"ping"}\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
    console.log('SSE connection closed');
  });
});

// Handle favicon requests to stop 404s
app.get('/favicon.ico', (req, res) => res.status(204).send());
app.get('/favicon.png', (req, res) => res.status(204).send());
app.get('/favicon.svg', (req, res) => res.status(204).send());

// Handle POST to root for MCP messages
app.post('/', (req, res) => {
  console.log('MCP root POST received:', req.body);
  handleMCPMessage(req, res);
});

// Handle MCP messages via POST
app.post('/message', (req, res) => {
  console.log('MCP message received:', req.body);
  handleMCPMessage(req, res);
});

function handleMCPMessage(req, res) {
  const message = req.body;

  if (message.method === 'initialize') {
    res.json({
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          prompts: {},
          resources: {}
        },
        serverInfo: {
          name: 'AutoHotkey v2 MCP Server',
          version: '2.1.0'
        }
      }
    });
  } else if (message.method === 'tools/list') {
    res.json({
      jsonrpc: '2.0',
      id: message.id,
      result: {
        tools: [
          {
            name: 'ahk_analyze',
            description: 'Analyze AutoHotkey v2 code for syntax, patterns, and best practices',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'AutoHotkey v2 code to analyze'
                }
              },
              required: ['code']
            }
          }
        ]
      }
    });
  } else if (message.method === 'tools/call' && message.params.name === 'ahk_analyze') {
    const code = message.params.arguments.code;
    const analysis = {
      lineCount: code.split('\n').length,
      hasHotkeys: /::/.test(code),
      hasGUI: /Gui\(/.test(code),
      hasLoops: /(Loop|For|While)/i.test(code),
      usesV2Syntax: /#Requires\s+AutoHotkey\s+v2/i.test(code)
    };

    res.json({
      jsonrpc: '2.0',
      id: message.id,
      result: {
        content: [
          {
            type: 'text',
            text: `AutoHotkey Code Analysis:\n\nLines: ${analysis.lineCount}\nHotkeys: ${analysis.hasHotkeys ? 'Yes' : 'No'}\nGUI: ${analysis.hasGUI ? 'Yes' : 'No'}\nLoops: ${analysis.hasLoops ? 'Yes' : 'No'}\nv2 Syntax: ${analysis.usesV2Syntax ? 'Yes' : 'No'}\n\nSuggestions:\n${analysis.usesV2Syntax ? '✓ Uses AutoHotkey v2 syntax' : '⚠ Consider adding #Requires AutoHotkey v2.0'}\n${analysis.hasLoops && !analysis.hasGUI ? '💡 Consider organizing complex logic into functions' : ''}`
          }
        ]
      }
    });
  } else {
    res.json({
      jsonrpc: '2.0',
      id: message.id,
      error: {
        code: -32601,
        message: `Method not found: ${message.method}`
      }
    });
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'AutoHotkey MCP Server',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AutoHotkey v2 MCP Server',
    version: '2.1.0',
    description: 'AutoHotkey v2 development tools and analysis',
    endpoints: {
      sse: '/sse',
      message: '/message',
      health: '/health'
    }
  });
});

app.listen(port, () => {
  console.log(`AutoHotkey MCP Server with SSE running on port ${port}`);
  console.log(`Local URL: http://localhost:${port}`);
  console.log(`SSE Endpoint: http://localhost:${port}/sse`);
  console.log(`Ready for ChatGPT MCP integration!`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});