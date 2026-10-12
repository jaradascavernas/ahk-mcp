// Runs before every integration suite. Integration suites spawn the built
// server (dist/) themselves, so `npm run test:integration` builds first.
import { afterAll } from '@jest/globals';
import { isolateAhkMcpConfig } from './isolated-config';

// Keep tool state out of the developer's real ahk-mcp config (see isolated-config.ts).
// Servers spawned by the suites inherit these variables through process.env.
const removeIsolatedConfig = isolateAhkMcpConfig();
afterAll(() => removeIsolatedConfig());

process.env.NODE_ENV = 'test';
process.env.AHK_MCP_LOG_LEVEL = 'error';
