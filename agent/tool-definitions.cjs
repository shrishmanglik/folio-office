'use strict';
const { z } = require('zod');
const MAX_PAYLOAD = 1024 * 1024;
const str = z.string().min(1).max(4096);
const revision = { expectedRevision: str, requestId: str, dryRun: z.boolean().optional() };
const file = { fileId: str };
const kind = z.enum(['document', 'spreadsheet', 'presentation', 'notebook']);
const definitions = [
  ['workspace.list', 'List files and current revision tokens with paging and optional filters.', {limit:z.number().int().min(1).max(1000).optional(),offset:z.number().int().min(0).optional(),kind:kind.optional(),query:z.string().max(200).optional()}, true],
  ['workspace.audit', 'Read recent human and agent changes without document contents.', {limit:z.number().int().min(1).max(100).optional()}, true],
  ['workspace.search', 'Search local document, sheet, slide and notebook content. Returns bounded snippets with semantic locations.', {query:z.string().min(1).max(200),kind:kind.optional(),limit:z.number().int().min(1).max(100).optional()}, true],
  ['file.inspect', 'Inspect file structure, object IDs, current revision and supported export formats without reading full contents.', file, true],
  ['file.read', 'Read a complete file including its revision.', file, true],
  ['file.history', 'List retained revision metadata newest first. Up to 30 versions per file and 20 MiB globally; oldest recorded revisions are pruned.', file, true],
  ['file.restore', 'Restore a retained version of an existing file while preserving retained history. Requires the current expectedRevision.', { ...file, ...revision, targetRevision:str }, false, true],
  ['file.create', 'Create a file. Reuse requestId only to retry the identical request. dryRun previews without saving.', { kind, name: str, data: z.record(z.string(), z.unknown()).optional(), requestId: str, dryRun:z.boolean().optional() }, false, false],
  ['file.update', 'Replace data or rename a file using its current revision.', { ...file, ...revision, name: str.optional(), data: z.record(z.string(), z.unknown()).optional() }, false, true],
  ['document.append', 'Append plain text to a document using its current revision.', { ...file, ...revision, text: z.string().max(MAX_PAYLOAD) }, false, false],
  ['document.replaceText', 'Replace every literal match within individual text nodes, preserving their marks. Matches do not span text-node boundaries. nodePath is a child-index array from data.content; omit to search all nodes.', { ...file, ...revision, find:z.string().min(1).max(MAX_PAYLOAD),replacement:z.string().max(MAX_PAYLOAD),nodePath:z.array(z.number().int().min(0)).max(32).optional() }, false, true],
  ['document.format', 'Set text marks on the selected node and its text descendants, or set paragraph/heading alignment and level (0 means paragraph). nodePath is a child-index array from data.content as returned by file.read.', { ...file, ...revision, nodePath:z.array(z.number().int().min(0)).max(32),marks:z.array(z.object({type:z.enum(['bold','italic','underline','strike','code'])}).strict()).max(5).optional(),alignment:z.enum(['left','center','right','justify']).optional(),heading:z.number().int().min(0).max(6).optional() }, false, true],
  ['spreadsheet.edit', 'Clear contents or formatting, fill down or right with relative formulas, sort a rectangle preserving records, or rename, duplicate, move or delete a sheet. Unsafe reference edits are rejected. Sort keyColumn and sheet toIndex are zero-based.', { ...file, ...revision, sheetId:str.optional(),action:z.enum(['clear','fill','sort','sheetRename','sheetDuplicate','sheetMove','sheetDelete']),range:z.string().max(32).optional(),mode:z.enum(['contents','formats','all']).optional(),direction:z.enum(['down','right','asc','desc']).optional(),keyColumn:z.number().int().min(0).max(999).optional(),hasHeader:z.boolean().optional(),name:z.string().min(1).max(31).optional(),toIndex:z.number().int().min(0).max(99).optional() }, false, true],
  ['spreadsheet.format', 'Merge validated cell formatting into an A1 range of at most 10000 cells.', { ...file, ...revision, sheetId:str.optional(),range:z.string().regex(/^[A-Z]+[1-9][0-9]*(:[A-Z]+[1-9][0-9]*)?$/),style:z.object({bold:z.boolean().optional(),italic:z.boolean().optional(),numberFormat:z.enum(['General','0','0.00','0%','$#,##0.00']).optional(),fill:z.string().regex(/^#[0-9a-f]{6}$/i).optional(),color:z.string().regex(/^#[0-9a-f]{6}$/i).optional(),align:z.enum(['left','center','right']).optional()}).strict() }, false, true],
  ['spreadsheet.write', 'Write a rectangular cell matrix. Formula strings start with =.', { ...file, ...revision, sheetId: str.optional(), start: z.string().regex(/^[A-Z]+[1-9][0-9]*$/), values: z.array(z.array(z.union([z.string(), z.number().finite(), z.boolean(), z.null()])).min(1)).min(1) }, false, true],
  ['spreadsheet.read', 'Read spreadsheet cells, optionally restricted to an A1 range.', { ...file, sheetId: str.optional(), range: z.string().regex(/^[A-Z]+[1-9][0-9]*(:[A-Z]+[1-9][0-9]*)?$/).optional() }, true],
  ['slides.add', 'Append a slide to a presentation.', { ...file, ...revision, slide: z.object({ title: z.string(), body: z.string().optional(), notes: z.string().optional(), layout: str.optional() }).strict() }, false, false],
  ['notebook.addPage', 'Append a text page to a notebook.', { ...file, ...revision, title: str, text: z.string() }, false, false],
  ['notebook.updatePage', 'Update the title or text of a notebook page selected by its stable pageId.', { ...file, ...revision,pageId:str,title:z.string().max(20000).optional(),text:z.string().max(MAX_PAYLOAD).optional() }, false, true],
  ['notebook.deletePage', 'Delete a notebook page by stable pageId; at least one page must remain.', { ...file, ...revision,pageId:str }, false, true],
  ['file.export', 'Export a file to the explicit output path. See engine capabilities for formats.', { ...file, format: str, outputPath: str }, false, true],
  ['file.import', 'Import a local file into this workspace. dryRun validates and reports losses without saving.', { inputPath: str, kind: kind.optional(), name: str.optional(), requestId: str, dryRun:z.boolean().optional() }, false, false],
].map(([operation, description, shape, readOnlyHint, destructiveHint]) => ({
  operation, name: operation.replaceAll('.', '_'), description, shape,
  schema: z.object(shape).strict(),
  annotations: { readOnlyHint, destructiveHint: destructiveHint ?? false, idempotentHint: readOnlyHint || operation !== 'file.export', openWorldHint: false },
}));
function error(code, message) { return Object.assign(new Error(message), { code }); }
function validateCommand(command) {
  if (!command || typeof command !== 'object' || Array.isArray(command)) throw error('INVALID_COMMAND', 'Command must be a JSON object with an operation.');
  if (Buffer.byteLength(JSON.stringify(command)) > MAX_PAYLOAD) throw error('PAYLOAD_TOO_LARGE', 'Command exceeds the 1 MiB limit.');
  const { operation, ...args } = command;
  const definition = definitions.find(item => item.operation === operation);
  if (!definition) throw error('UNKNOWN_OPERATION', 'Unknown operation. Run capabilities to discover supported operations.');
  const parsed = definition.schema.safeParse(args);
  if (!parsed.success) throw error('INVALID_ARGUMENTS', parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; '));
  return { operation, ...parsed.data };
}
module.exports = { definitions, validateCommand, MAX_PAYLOAD, error };
