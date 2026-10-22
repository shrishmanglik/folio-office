## Problem and resulting behavior

The desktop save path previously discarded the stored snapshot returned by Folio's native three-way merge. A receipt could therefore name the stale UI candidate even when storage had retained an agent rename, and the next UI save could compare against the wrong baseline.

This change makes the returned stored snapshot authoritative for the baseline, persisted marker, and receipt acknowledgement. Local edits made after a save begins remain visible and pending for the next save. Untouched agent renames and revisions survive, missing storage IDs are never acknowledged, and Folio does not show Saved while later local edits remain unsaved.

The public App, Workspace, and command-suite callback interfaces remain unchanged. Close and version history explicitly adapt the private discriminated persistence result back to a boolean.

AUTHOR: Codex CEO 01a13460-501c-7210-85f6-4f1e2e15bf7d

## DETERMINISTIC ENGINE CHECK

- Red on merged main `b5b0a04f501ee36611121bf91b8b96dc6aee93e6`: 33 passed, 3 failed for stale returned name, missing published ID acknowledgement, and stale next-save baseline.
- Final focused UI: 37/37 twice, plus 37/37 after replacing the editor test shim with the real `EditorProps` type.
- Node and engine contracts: 68/68.
- TypeScript project check: clean.
- Production build: success, 2,122 modules. The existing chunk-size warning remains.
- MA10, MA13, and MW04 were each killed independently and exact source bytes were restored.
- The repository does not declare a lint script.

## LLM BOUNDARY CHECK

No LLM or probabilistic boundary changed. Storage reconciliation, acknowledgement selection, and queued-save behavior are deterministic.

## MULTI-SURFACE CHECK

The browser-preview persistence path and Electron desktop save contract are both covered by the focused public-component tests. No GPU or packaged-native qualification is claimed in this author pass.

## EXHAUST & COST CHECK

No dependency, package, workflow, backend, CSS, provider, or hosted-CI change is included. The implementation reuses the existing native three-way merge and adds no parallel merge service.

## ROOT-CAUSE & RULE DELTA

Root cause: `persist()` converted native success into a boolean, discarded `r.files`, and later built acknowledgements from the submitted candidate. The private persistence result now carries the stored files. A small in-App reconciliation retains only local changes made after submission while preserving untouched stored fields.

No estate rule change is proposed. The finding is pinned by behavioral tests and three mutation controls.

## Learnings landed

- A save receipt must be built from the storage response, never the submitted candidate.
- Queued UI writes must rebase captured local changes onto the latest stored baseline before saving.
- A returned stored snapshot and later local edits are separate truths: the former drives the receipt and baseline; the latter remain visibly unsaved until the next successful write.

## Qualification still pending

- Canonical exact-head local CI.
- Packaged/native and GPU checks if required by the independent reviewer.
- Independent cross-family review and verdict.
- Merge and any release or deployment proof.

This pull request remains draft until those gates are complete.
