// Test script to verify MCP prompts are working
import { spawn } from 'child_process';

async function testMCPPrompts() {
  console.log('🚀 Testing AutoHotkey MCP Prompts...\n');

  // Test listing prompts
  console.log('📝 Testing: List Prompts');
  const listPromptsRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "prompts/list",
    params: {}
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
      console.log('Server debug:', data.toString());
    });

    // Send the request
    server.stdin.write(JSON.stringify(listPromptsRequest) + '\n');
    server.stdin.end();

    // Wait for response
    await new Promise((resolve) => {
      server.on('close', () => {
        console.log('List Prompts Response:');
        console.log(response);
        console.log('\n' + '='.repeat(50) + '\n');
        resolve();
      });
    });

  } catch (error) {
    console.error('Test failed:', error);
  }

  // Test getting a specific prompt
  console.log('📝 Testing: Get Specific Prompt (ahk-1)');
  const getPromptRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "prompts/get",
    params: {
      name: "ahk-1",
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
      console.log('Server debug:', data.toString());
    });

    // Send the request
    server.stdin.write(JSON.stringify(getPromptRequest) + '\n');
    server.stdin.end();

    // Wait for response
    await new Promise((resolve) => {
      server.on('close', () => {
        console.log('Get Prompt Response:');
        console.log(response);
        console.log('\n' + '='.repeat(50) + '\n');
        resolve();
      });
    });

  } catch (error) {
    console.error('Test failed:', error);
  }

  console.log('✅ Prompt testing complete!');
}

testMCPPrompts(); 