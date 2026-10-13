# MCP Transport Compatibility

This server serves both protocol eras through Streamable HTTP at `/mcp`:

- `2026-07-28`: stateless requests carry protocol version, client capabilities,
  and client identity in `params._meta`; there is no `initialize` handshake.
- Legacy clients, including `2025-11-25`: the same endpoint answers `initialize`
  through the SDK's stateless compatibility adapter.

Neither HTTP flow uses `Mcp-Session-Id`. `GET /mcp` returns `405`; the separate
`/sse`, `/message`, and `/messages` endpoints are no longer served.
`AHK_MCP_LEGACY_SSE=1` emits a warning and does not restore them.

HTTP binds to `127.0.0.1` by default. Set `AHK_MCP_HTTP_HOST` to change the
binding. A non-loopback binding requires `AHK_MCP_AUTH_TOKEN` unless
`AHK_MCP_ALLOW_INSECURE_REMOTE=1` is explicitly set.

HTTP requests are rate-limited to 120 per minute by default. Override the window
and limit with `AHK_MCP_RATE_LIMIT_WINDOW_MS` and `AHK_MCP_RATE_LIMIT_MAX`.

HTTP `Host` validation defaults to loopback names. For a named reverse proxy or
remote host, set `AHK_MCP_ALLOWED_HOSTS` to a comma-separated allowlist.

Accepted 2026 routing headers are validated whenever supplied. Set
`AHK_MCP_REQUIRE_ROUTING_HEADERS=1` only when all connected HTTP clients emit
`Mcp-Method` and the applicable `Mcp-Name` header.

Discovery metadata is public at `/.well-known/mcp/server-card.json`. Discovery
and resource-list cache TTLs default to 30 seconds and can be changed with
`AHK_MCP_DISCOVERY_TTL_MS`.

Legacy task results are retained for one hour by default, capped at 24 hours.
Use `AHK_MCP_DEFAULT_TASK_TTL_MS` and `AHK_MCP_MAX_TASK_TTL_MS` to tune result
retention. TTL counts from task creation and can expire running work.
`AHK_MCP_TASK_TIMEOUT_MS` sets a separate execution limit. The modern Tasks
extension is not advertised because the SDK does not yet serve its methods.

## Modern Request Flow (`2026-07-28`)

1. Optionally call `server/discover` to read supported modern versions and
   server capabilities.
2. Send each operation via `POST /mcp`, with the request envelope in
   `params._meta`.
3. When a response has `resultType: "input_required"`, retry the operation with
   the requested answers in `params.inputResponses`.

Ordinary complete results have `resultType: "complete"`. Catalog responses also
carry `ttlMs` and `cacheScope` hints. The server card advertises both modern and
legacy protocol versions; `server/discover` advertises modern versions only.

## Required/Recommended Headers

- `Content-Type: application/json` for `POST`
- `Accept: application/json, text/event-stream` required for legacy HTTP
  requests; recommended for broad client compatibility
- `MCP-Protocol-Version: 2026-07-28` for modern requests; use the negotiated
  version for legacy requests after initialization
- `Mcp-Method` matching the JSON-RPC method, and `Mcp-Name` for named
  operations, when required by `AHK_MCP_REQUIRE_ROUTING_HEADERS=1`
- A supplied `Origin` must match `AHK_MCP_ALLOWED_ORIGINS`; when no allowlist is
  configured, only loopback origins for the configured port are accepted
- `Authorization: Bearer <token>` required when `AHK_MCP_AUTH_TOKEN` is set

## Quick cURL Examples

List tools directly with a modern request, without initialization:

```bash
curl -i http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "MCP-Protocol-Version: 2026-07-28" \
  -H "Mcp-Method: tools/list" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientCapabilities":{},"io.modelcontextprotocol/clientInfo":{"name":"client","version":"1.0.0"}}}}'
```

Initialize a legacy client on the same endpoint:

```bash
curl -i http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Mcp-Method: initialize" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"client","version":"1.0.0"}}}'
```

The HTTP adapter does not allocate a session for this handshake. Legacy stdio
clients continue to initialize once per connection.

## Transport Errors

Unsupported modern request envelopes return JSON-RPC error `-32022`, with
supported versions in `error.data.supported`. Legacy initialization negotiates
the revision, and unsupported subsequent version headers return HTTP `400`.
Host, Origin, authentication, and routing header checks still apply to both
eras.

Run `npm run smoke:http` to verify both HTTP eras and `npm run smoke:mcp:2026`
to verify modern discovery, request envelopes, and input round trips over stdio.
`npm run smoke:mcp` covers legacy stdio initialization.
