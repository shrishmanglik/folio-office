# Local agent access

Office Workspace exposes its shared local data engine through a JSON CLI and an MCP stdio server. Supply an explicit absolute workspace directory. No network service or account is needed, and no MCP host configuration is changed automatically. Semantic tool coverage is partial; the complete feature requirement is tracked in ROADMAP.md.

In the 0.5 Windows app, open **Agent tools** to copy an MCP configuration containing the actual executable and workspace paths. The unpacked executable also runs tools directly, without a separate Node install:

```powershell
& 'C:\Apps\Folio\win-unpacked\Office Workspace.exe' --agent --workspace 'C:\OfficeWorkspace' capabilities
```

The adjacent files in `win-unpacked` must stay together. For automation, prefer the unpacked executable so each tool invocation does not extract the portable archive again. The source CLI below works in Node environments on other operating systems; this run tested Windows only.

From the source checkout, with Node.js and dependencies installed:

```powershell
node agent/cli.cjs --workspace C:\FolioWorkspace capabilities
node agent/cli.cjs --workspace C:\FolioWorkspace exec --file C:\Commands\create.json
```

Example `create.json`:

```json
{"operation":"file.create","kind":"document","name":"Project brief","requestId":"brief-create-001"}
```

Use `workspace.list` to discover file IDs and revisions, then `file.read` to inspect content. For changes, include the exact `expectedRevision` returned by the current read and a new `requestId`. If the response is lost, retry the identical command with the identical request ID. A revision conflict means another writer changed the file: read again and reconcile before retrying with a new request ID.

Successful CLI calls write one JSON value to stdout. Errors write `{ "error": { "code": "...", "message": "..." } }` to stderr and exit nonzero. Command payloads are limited to 1 MiB. `exec --file` avoids Windows shell quoting problems. `capabilities` returns typed input schemas, mutation annotations, and supported operation names.

Idempotency receipts retain the most recent 128 mutations and audit retains 256 entries; these are bounded recovery records, not permanent history. Imports are capped at 25 MB compressed, Office ZIP content at 100 MB expanded, and materialized worksheets at one million cells. All mutation tools expose `dryRun: true`: previews validate and return the proposed result without saving or consuming the request ID. `workspace.audit` returns retained history; `workspace.search` searches content with snippets and object locations; `file.inspect` returns compact structure; `workspace.list` supports kind/query filters and offset/limit paging. Preview-created IDs are provisional. Export output paths must be new; existing files are never overwritten by agent exports. An agent's scope includes the explicit import/export paths, so the workspace setting is not a filesystem sandbox.

The 0.2 engine reads the original `workspace.json` only until the first new commit. It then uses `workspace.state.json`, atomically storing files, revisions, idempotency receipts and audit. The prior state is `workspace.state.previous.json`. Close the 0.1 app before moving a real workspace to 0.2. Do not edit the same workspace with 0.1 afterward: the older build does not understand the new state format.

For packaged MCP, copy **Agent tools** from version 0.3. It runs the bundled Node runtime with `ELECTRON_RUN_AS_NODE=1` and the packaged `resources/app.asar/agent/cli.cjs` entry point. This needs no separate Node installation. The legacy GUI-runtime `--agent ... mcp` invocation can hang and must not be used for MCP. Ordinary one-shot `--agent ... exec` calls remain supported.

For an MCP host using source Node, add a stdio entry using its documented configuration UI. Example entry (substitute your actual paths):

```json
{
  "command": "C:\\Program Files\\nodejs\\node.exe",
  "args": ["C:\\Source\\folio-office\\agent\\cli.cjs", "--workspace", "C:\\FolioWorkspace", "mcp"]
}
```

Tools use underscore names (`workspace_list`, `document_append`, `spreadsheet_write`, `slides_add`, `notebook_addPage`, `file_export`, `file_import`). Discover all tools through `tools/list`. Results contain both `structuredContent` and equivalent JSON text. Export/import can access their explicit local paths, so choose those paths intentionally. Spreadsheet writes and full data replacements can overwrite content and advertise that in their tool annotations.

MCP uses the official TypeScript SDK v1 stdio implementation and tool schema validation: [SDK server documentation](https://ts.sdk.modelcontextprotocol.io/server). Protocol verification runs a real SDK client against a child process:

```powershell
node --test tests/agent-transport.test.cjs
```

## Shared editing and history in 0.4

`file.history` lists retained revision metadata. `file.restore` takes targetRevision plus the current expectedRevision and a new requestId. Restore preserves newer history and changes only the selected current file. Retention is 30 distinct versions per file and 20 MB shared across the workspace; oldest recorded entries are pruned, individual oversized snapshots are skipped. This is bounded local recovery, not permanent archival history.

`document.replaceText` takes find/replacement and an optional nodePath; matches stay within individual text nodes and preserve their marks. `document.format` takes nodePath (child-index array relative to data.content), marks (sets bold/italic/underline/strike/code), alignment and heading0..6. `spreadsheet.format` takes an A1 range and style fields bold/italic/numberFormat/fill/color/align. `notebook.updatePage` and `notebook.deletePage` address pageId, protecting the final page. All require current expectedRevision/requestId and support dryRun. Discover exact validated schemas through capabilities.

Human document/spreadsheet import/export now calls the same local conversion module. Semantic HTML/DOCX structure and embedded PNG/JPEG DOCX images are supported; advanced layout remains approximate. XLSX uses sheet.styles[A1] for the same basic formatting the UI and agents edit.

## Shared Home operations in 0.7

`spreadsheet.edit` provides `clear`, `fill`, `sort`, `sheetRename`, `sheetDuplicate`, `sheetMove` and `sheetDelete`. It uses the same pure operation module as the editor and the engine's existing revision, dry-run and idempotency protection. Discover the exact schema through `capabilities` or MCP `tools/list`.

```json
{"operation":"spreadsheet.edit","fileId":"FILE_ID_FROM_READ","sheetId":"SHEET_ID_FROM_READ","expectedRevision":"CURRENT_REVISION","requestId":"fill-example-001","action":"fill","range":"B2:B10","direction":"down","dryRun":true}
```

Ranges are bounded to 10000 cells. Sort requires `keyColumn` as a zero-based absolute column index, `direction` asc/desc and `hasHeader`. It rejects formula-containing regions. Fill supports down/right with A1 relative, absolute and mixed references; unsupported external, 3D and whole-axis references are rejected. Sheet deletion rejects references from other sheets. Sheet identity operations reject INDIRECT and unsupported qualifier syntax. These limits prevent silent reference corruption; they are pending compatibility work, not full Excel behavior.


### Range copying and expanded formatting

`spreadsheet.edit` now accepts `copyRange` with source `sheetId` / `range`, destination `target` / optional `targetSheetId`, `mode` (`all`, `values`, `formulas`, `formats`), `transpose`, and `skipBlanks`. Overlapping source/destination uses a snapshot. Calculated text results stay text. The usual expectedRevision/requestId/dryRun contract applies.

Fill direction also accepts `up` and `left`. Action `replace` accepts `find`, `replacement`, `matchCase` and `wholeCell`; it searches raw stored cell content including formula text within the explicit range. No regex execution or wildcard interpretation occurs.

`spreadsheet.format` uses the same validator as the desktop. Discover supported style keys and bounds through capabilities. Border presets expand to stored physical edges, and unspecified scalar properties remain unchanged. XLSX retains supported font and alignment styles; date cells still reimport as ISO text. No full Excel compatibility claim is made.
