import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import {
  Server,
  PROTOCOL_VERSION_META_KEY,
  type ServerContext,
} from '@modelcontextprotocol/server';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { clientRoots } from '../../src/core/client-roots.js';

const modernContext = {
  mcpReq: { envelope: { [PROTOCOL_VERSION_META_KEY]: '2026-07-28' } },
} as unknown as ServerContext;

describe('client roots across protocol eras', () => {
  let directory: string;

  beforeAll(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'client-roots-'));
  });

  afterAll(async () => {
    await fs.rm(directory, { recursive: true, force: true });
  });

  function rootServer() {
    const server = new Server({ name: 'root-boundary', version: '1' });
    const listRoots = jest.fn<Server['listRoots']>(async () => ({
      roots: [{ uri: pathToFileURL(directory).href }],
    }));
    Object.assign(server, {
      getClientCapabilities: () => ({ roots: {} }),
      listRoots,
    });
    return { server, listRoots };
  }

  it('skips the removed push API when the modern revision is in the lifted envelope', async () => {
    const { server, listRoots } = rootServer();
    expect(await clientRoots.resolveForRequest(server, modernContext)).toEqual([]);
    expect(listRoots).not.toHaveBeenCalled();
  });

  it('ignores cached legacy roots for a modern request', async () => {
    const { server, listRoots } = rootServer();
    expect(await clientRoots.resolveForRequest(server)).toEqual([directory]);
    expect(await clientRoots.resolveForRequest(server, modernContext)).toEqual([]);
    expect(listRoots).toHaveBeenCalledTimes(1);
  });

  it('preserves legacy root caching and refresh after invalidation', async () => {
    const { server, listRoots } = rootServer();
    expect(await clientRoots.resolveForRequest(server)).toEqual([directory]);
    expect(await clientRoots.resolveForRequest(server)).toEqual([directory]);
    expect(listRoots).toHaveBeenCalledTimes(1);
    clientRoots.invalidate(server);
    expect(await clientRoots.resolveForRequest(server)).toEqual([directory]);
    expect(listRoots).toHaveBeenCalledTimes(2);
  });
});
