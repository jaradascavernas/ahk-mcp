import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import {
  getAutoHotkeyExecutableCandidates,
  initializeProductionRuntimeConfig,
  resolveAutoHotkeyPath,
} from '../../../src/core/config.js';
import { resetEnvConfig } from '../../../src/core/env-config.js';
import { resolveThqbyServerPath } from '../../../src/utils/thqby-lsp-client.js';

const names = [
  'AHK_MCP_CONFIG_DIR',
  'AHK_MCP_AHK_PATH',
  'AHK_MCP_FORK_AHK_PATH',
  'AHK_MCP_ALLOW_LOCAL_AHK',
  'AHK_MCP_THQBY_PATH',
  'AHK_THQBY_LSP_SERVER',
  'AHK_PATH_WIN',
  'AHK_PATH',
  'AHK_BINARY',
] as const;
const saved = Object.fromEntries(names.map(name => [name, process.env[name]]));
const runNode = promisify(execFile);
let scratch: string;

beforeEach(async () => {
  scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'ahk-production-runtime-'));
  for (const name of names) delete process.env[name];
  process.env.AHK_MCP_CONFIG_DIR = path.join(scratch, 'config');
  resetEnvConfig();
});

afterEach(async () => {
  for (const name of names) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
  resetEnvConfig();
  await fs.rm(scratch, { recursive: true, force: true });
});

async function executable(relative: string): Promise<string> {
  const file = path.join(scratch, relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, 'fixture');
  return file;
}

describe('production AutoHotkey selection', () => {
  it('uses the documented interpreter override ahead of a legacy alias', async () => {
    const canonical = await executable('canonical.exe');
    process.env.AHK_MCP_AHK_PATH = canonical;
    process.env.AHK_PATH_WIN = await executable('legacy.exe');
    resetEnvConfig();

    expect(resolveAutoHotkeyPath()).toBe(canonical);
  });

  it('does not accept a checkout-local interpreter unless local discovery is enabled', async () => {
    const local = await executable('repo/AutoHotkey/bin/AutoHotkey64.exe');
    const cwd = path.join(scratch, 'repo');

    expect(getAutoHotkeyExecutableCandidates({ cwd })).not.toContain(local);
    process.env.AHK_MCP_ALLOW_LOCAL_AHK = 'true';
    resetEnvConfig();
    expect(getAutoHotkeyExecutableCandidates({ cwd })).toContain(local);
  });

  it('fails for a missing explicit override instead of selecting another interpreter', async () => {
    process.env.AHK_MCP_AHK_PATH = path.join(scratch, 'missing.exe');
    process.env.AHK_PATH = await executable('legacy.exe');
    resetEnvConfig();

    expect(() => resolveAutoHotkeyPath()).toThrow(/AHK_MCP_AHK_PATH.*not.*file/i);
  });

  it('preserves the AHK_BINARY alias', async () => {
    const binary = await executable('aliased.exe');
    process.env.AHK_BINARY = binary;
    resetEnvConfig();

    expect(resolveAutoHotkeyPath()).toBe(binary);
  });

  it('loads operator paths relative to their config directory and prefers environment overrides', async () => {
    const operator = await executable('config/bin/interpreter.exe');
    await fs.writeFile(
      path.join(scratch, 'config', 'operator-config.json'),
      JSON.stringify({ ahkPath: 'bin/interpreter.exe' })
    );
    await initializeProductionRuntimeConfig();
    expect(resolveAutoHotkeyPath()).toBe(operator);

    const override = await executable('override.exe');
    process.env.AHK_MCP_AHK_PATH = override;
    resetEnvConfig();
    expect(resolveAutoHotkeyPath()).toBe(override);
  });

  it('does not reuse operator paths after the configuration directory changes', async () => {
    const operator = await executable('config/interpreter.exe');
    await fs.writeFile(
      path.join(scratch, 'config', 'operator-config.json'),
      JSON.stringify({ ahkPath: operator })
    );
    await initializeProductionRuntimeConfig();
    process.env.AHK_MCP_CONFIG_DIR = path.join(scratch, 'other-config');
    resetEnvConfig();

    expect(getAutoHotkeyExecutableCandidates()).not.toContain(operator);
  });

  it('keeps the legacy config.json interpreter when operator paths are unset', async () => {
    const legacy = await executable('config/legacy.exe');
    await fs.writeFile(
      path.join(scratch, 'config', 'config.json'),
      JSON.stringify({ ahkPath: legacy })
    );
    await initializeProductionRuntimeConfig();

    expect(resolveAutoHotkeyPath()).toBe(legacy);
  });

  it('selects the operator fork independently from its normal script interpreter', async () => {
    const script = await executable('config/script.exe');
    const fork = await executable('config/fork.exe');
    await fs.writeFile(
      path.join(scratch, 'config', 'operator-config.json'),
      JSON.stringify({ ahkPath: script, forkAhkPath: fork })
    );
    await initializeProductionRuntimeConfig();

    expect(resolveAutoHotkeyPath()).toBe(script);
    expect(resolveAutoHotkeyPath({ kind: 'fork' })).toBe(fork);
  });

  it('resolves absolute PATH entries while ignoring entries relative to cwd', async () => {
    const fromPath = await executable('trusted-bin/AutoHotkey64.exe');
    const savedPath = process.env.PATH;
    try {
      process.env.PATH = ['', '.', 'untrusted-bin', path.dirname(fromPath)].join(path.delimiter);
      const candidates = getAutoHotkeyExecutableCandidates({ cwd: path.join(scratch, 'repo') });
      expect(candidates).toContain(fromPath);
      expect(candidates).not.toContain(path.resolve('untrusted-bin', 'AutoHotkey64.exe'));
      expect(candidates).not.toContain(path.resolve('AutoHotkey64.exe'));
    } finally {
      process.env.PATH = savedPath;
    }
  });

  it('uses the fork interpreter in the persistent Eval consumer', async () => {
    const script = await executable('script.exe');
    const fork = await executable('fork.exe');
    const replModule = pathToFileURL(path.resolve('src/repl.ts')).href;
    // Only replace the external spawn boundary. The real REPL frames the command,
    // routes the response and resolves its result using the selected executable.
    const harness = `
      import cp from 'node:child_process';
      import { syncBuiltinESMExports } from 'node:module';
      import { EventEmitter } from 'node:events';
      import { PassThrough } from 'node:stream';
      cp.spawn = (binary) => {
        const child = new EventEmitter();
        child.stdout = new PassThrough();
        child.stderr = new PassThrough();
        child.stdin = {
          write(wire) {
            const seq = wire.split('\\x1F')[0];
            child.stdout.write((binary === process.env.AHK_MCP_FORK_AHK_PATH ? 'fork-selected' : 'wrong-interpreter') + '\\n\\x1E' + seq + '\\x1E\\n');
          },
          end() {}
        };
        child.kill = () => true;
        return child;
      };
      syncBuiltinESMExports();
      const { ReplSession } = await import(${JSON.stringify(replModule)});
      const session = new ReplSession();
      const result = await session.send('1 + 1', 1000);
      session.stop();
      process.stdout.write(JSON.stringify(result));
    `;
    const result = await runNode(
      process.execPath,
      ['--import', 'tsx', '--input-type=module', '-e', harness],
      {
        cwd: process.cwd(),
        env: { ...process.env, AHK_MCP_AHK_PATH: script, AHK_MCP_FORK_AHK_PATH: fork },
      }
    );

    expect(JSON.parse(result.stdout)).toEqual({
      output: ['fork-selected'],
      error: [],
      timedOut: false,
    });
  });
});

describe('production THQBY selection', () => {
  it('accepts a documented extension directory ahead of the legacy server alias', async () => {
    const server = await executable('extension/server/dist/server.js');
    process.env.AHK_MCP_THQBY_PATH = path.join(scratch, 'extension');
    process.env.AHK_THQBY_LSP_SERVER = await executable('legacy/server.js');
    resetEnvConfig();

    expect(resolveThqbyServerPath()).toBe(server);
  });

  it('uses the operator language-server path when the environment does not override it', async () => {
    const server = await executable('config/lsp/server.js');
    await fs.writeFile(
      path.join(scratch, 'config', 'operator-config.json'),
      JSON.stringify({ thqbyLspPath: 'lsp/server.js' })
    );
    await initializeProductionRuntimeConfig();

    expect(resolveThqbyServerPath()).toBe(server);
  });
});
