'use strict';
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { Transform } = require('node:stream');
const { definitions, validateCommand, MAX_PAYLOAD } = require('./tool-definitions.cjs');
async function start(workspace) {
  const engine = require('../core/engine.cjs').createEngine(workspace);
  const server = new McpServer({ name: 'folio-office', version: '0.5.0' });
  for (const definition of definitions) {
    server.registerTool(definition.name, {
      description: definition.description, inputSchema: definition.schema, annotations: definition.annotations,
    }, async args => {
      try {
        const result = await engine.execute(validateCommand({ operation: definition.operation, ...args }));
        const structuredContent = result && typeof result === 'object' && !Array.isArray(result) ? result : { result };
        return { structuredContent, content: [{ type: 'text', text: JSON.stringify(structuredContent) }] };
      } catch (err) {
        const result = { error: { code: err.code || 'INTERNAL_ERROR', message: err.message, details:err.details,retryable:['REVISION_CONFLICT','WORKSPACE_BUSY'].includes(err.code) } };
        return { isError: true, structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
    });
  }
  // The stdio protocol is newline-delimited JSON. Bound messages before the SDK buffers them.
  let lineBytes = 0;
  const boundedInput = new Transform({ transform(chunk, encoding, callback) {
    for (const byte of chunk) {
      lineBytes = byte === 10 ? 0 : lineBytes + 1;
      if (lineBytes > MAX_PAYLOAD + 65536) {
        process.stderr.write(JSON.stringify({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'MCP message exceeds transport limit.' } }) + '\n');
        process.exitCode = 1;
        process.stdin.unpipe(boundedInput);
        process.stdin.pause();
        this.push(null);
        callback();
        void server.close();
        return;
      }
    }
    callback(null, chunk);
  } });
  process.stdin.pipe(boundedInput);
  await server.connect(new StdioServerTransport(boundedInput, process.stdout));
  return server;
}
module.exports = { start };
