const PROTOCOL_VERSION = '2026-07-28';

interface ToolResponse<T> {
  content?: { type: string; text?: string }[];
  isError?: boolean;
  structuredContent?: T;
}

export class McpToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'McpToolError';
  }
}

/** The backend's stateless 2026 MCP transport: one JSON-RPC call per request. */
export async function callTool<T>(
  apiBase: string,
  accessToken: () => Promise<string>,
  name: string,
  args: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const response = await fetchImpl(`${apiBase}/mcp`, {
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        _meta: {
          'io.modelcontextprotocol/clientCapabilities': {},
          'io.modelcontextprotocol/clientInfo': {
            name: 'teachfluence-cli',
            version: '0.3.0',
          },
          'io.modelcontextprotocol/protocolVersion': PROTOCOL_VERSION,
        },
        arguments: args,
        name,
      },
    }),
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${await accessToken()}`,
      'content-type': 'application/json',
      'mcp-method': 'tools/call',
      'mcp-name': name,
      'mcp-protocol-version': PROTOCOL_VERSION,
    },
    method: 'POST',
  });

  if (!response.ok) {
    // Never include the request (which has the bearer token) in diagnostics.
    throw new McpToolError(`${name} failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as {
    error?: { message?: string };
    result?: ToolResponse<T>;
  };

  if (body.error) throw new McpToolError(`${name}: ${body.error.message ?? 'MCP error'}`);

  const result = body.result;

  if (!result) throw new McpToolError(`${name}: empty MCP result.`);
  if (result.isError) {
    throw new McpToolError(
      `${name}: ${result.content?.filter((item) => item.type === 'text').map((item) => item.text).join(' ') || 'tool refused the request'}`,
    );
  }
  if (!result.structuredContent) {
    throw new McpToolError(`${name}: missing structured result.`);
  }

  return result.structuredContent;
}
