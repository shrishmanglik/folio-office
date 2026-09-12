#!/usr/bin/env node
'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { definitions, validateCommand, MAX_PAYLOAD, error } = require('./tool-definitions.cjs');
async function main(argv) {
  const index = argv.indexOf('--workspace');
  if (index < 0 || !argv[index + 1] || argv[index + 1].startsWith('--')) throw error('WORKSPACE_REQUIRED', 'Pass --workspace with an explicit absolute directory path.');
  const workspace = argv[index + 1];
  if (!path.isAbsolute(workspace)) throw error('WORKSPACE_REQUIRED', '--workspace must be an absolute directory path.');
  argv = [...argv.slice(0, index), ...argv.slice(index + 2)];
  if (argv.length === 1 && argv[0] === 'capabilities') {
    const { z } = require('zod');
    return { name: 'folio-office', transport: ['cli', 'mcp-stdio'], maxPayloadBytes: MAX_PAYLOAD, operations: definitions.map(({ operation, description, schema, annotations }) => ({ operation, description, inputSchema: z.toJSONSchema(schema), annotations })) };
  }
  if (argv.length === 1 && argv[0] === 'mcp') {
    await require('./mcp.cjs').start(workspace);
    return undefined;
  }
  if (argv.length !== 3 || argv[0] !== 'exec' || !['--json', '--file'].includes(argv[1])) throw error('INVALID_USAGE', 'Use --workspace ABSOLUTE_PATH capabilities | exec --json JSON | exec --file JSON_PATH | mcp.');
  let source;
  if (argv[1] === '--file') {
    const handle = await fs.open(argv[2], 'r');
    try {
      const buffer = Buffer.alloc(MAX_PAYLOAD + 1);
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
      if (bytesRead > MAX_PAYLOAD) throw error('PAYLOAD_TOO_LARGE', 'Command exceeds the 1 MiB limit.');
      source = buffer.subarray(0, bytesRead).toString('utf8');
    } finally { await handle.close(); }
  } else source = argv[2];
  if (Buffer.byteLength(source) > MAX_PAYLOAD) throw error('PAYLOAD_TOO_LARGE', 'Command exceeds the 1 MiB limit.');
  let command;
  try { command = JSON.parse(source); } catch { throw error('INVALID_JSON', 'Command is not valid JSON. Use exec --file to avoid shell quoting issues.'); }
  command = validateCommand(command);
  return require('../core/engine.cjs').createEngine(workspace).execute(command);
}
if (require.main === module) main(process.argv.slice(2)).then(result => {
  if (result !== undefined) process.stdout.write(JSON.stringify(result) + '\n');
}).catch(err => {
  process.stderr.write(JSON.stringify({ error: { code: err.code || 'INTERNAL_ERROR', message: err.message, details:err.details, retryable:['REVISION_CONFLICT','WORKSPACE_BUSY'].includes(err.code) } }) + '\n');
  process.exitCode = 1;
});
module.exports = { main };
