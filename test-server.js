// Simple test script to demonstrate the AutoHotkey MCP server
import { spawn } from 'child_process';

const testCodes = [
  {
    name: "Good AutoHotkey v2 Code",
    code: `; Example AutoHotkey v2 script\nMyFunction() {\n    config := Map(\"width\", 800, \"height\", 600)\n    MsgBox(\"Hello AutoHotkey v2!\")\n}`
  },
  {
    name: "Code with Claude Standards Violations",
    code: `// Wrong comment style\nmyFunction() {\n    config = {width: 800}  // Wrong assignment and data structure\n    button.OnEvent(\"Click\", this.HandleClick)  // Missing .Bind()\n    obj = new MyClass()  // Wrong: using 'new' keyword\n}`
  }
];

async function testMCPServer() {
  console.log('🚀 Testing AutoHotkey MCP Server...\n');

  for (const test of testCodes) {
    console.log(`📝 Testing: ${test.name}`);
    console.log('Code:');
    console.log(test.code);
    console.log('\n🔍 Running diagnostics...\n');

    // Create MCP request for diagnostics
    const mcpRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "ahk_diagnostics",
        arguments: {
          code: test.code,
          enableClaudeStandards: true,
          severity: "all"
        }
      }
    };

    try {
      // Spawn the server and send request
      const server = spawn('node', ['dist/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let response = '';
      server.stdout.on('data', (data) => {
        response += data.toString();
      });

      server.stderr.on('data', (data) => {
        console.error('Server error:', data.toString());
      });

      // Send the request
      server.stdin.write(JSON.stringify(mcpRequest) + '\n');
      server.stdin.end();

      // Wait for response
      await new Promise((resolve) => {
        server.on('close', () => {
          console.log('Response:', response);
          console.log('\n' + '='.repeat(50) + '\n');
          resolve();
        });
      });

    } catch (error) {
      console.error('Test failed:', error);
    }
  }

  // Test the ahk_summary tool
  console.log('📝 Testing: ahk_summary tool (built-in prompts/summary)');
  const summaryRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "ahk_summary",
      arguments: {}
    }
  };
  try {
    const server = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let response = '';
    server.stdout.on('data', (data) => {
      response += data.toString();
    });
    server.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });
    server.stdin.write(JSON.stringify(summaryRequest) + '\n');
    server.stdin.end();
    await new Promise((resolve) => {
      server.on('close', () => {
        console.log('Response:', response);
        console.log('\n' + '='.repeat(50) + '\n');
        resolve();
      });
    });
  } catch (error) {
    console.error('Test failed:', error);
  }

  console.log('✅ Testing complete!');
}

testMCPServer().catch(console.error); 