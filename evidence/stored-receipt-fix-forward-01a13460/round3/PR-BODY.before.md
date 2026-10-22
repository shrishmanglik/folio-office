## Problem and resulting behavior

Folio's first stored-receipt fix correctly acknowledged the native storage response, but its frontend field merge could silently overwrite a same-file agent edit and could lose queued user intent. A file deleted while its creation save was pending could return, a reverted rename could become temporary again, and undone text could reappear.

The frontend queue now keeps three states separate: the latest accepted disk baseline, the previous submitted intent, and the current visible UI. Each queued save expresses its delta from the preceding submitted intent, then rebases that delta onto the latest disk snapshot. Deletions, rename reversions, and text undo therefore remain true user intent.

When the returned storage snapshot and post-submission UI both changed the same file, Folio does not merge over the agent revision. It preserves the user's visible work and original edit baseline, shows the existing Save failed and Keep my edits as copies recovery, and blocks already queued writes until explicit recovery. Initial load, remote refresh, history restore, and Keep copies deliberately reinitialize queue intent and the conflict barrier. `core/engine.cjs::saveSnapshot` remains authoritative and unchanged.

AUTHOR: Codex CEO 01a13460-501c-7210-85f6-4f1e2e15bf7d

## DETERMINISTIC ENGINE CHECK

- Red on `b367db8e74383aadc7699c306345ddda0f5fbf6e`: 16 existing tests passed and four valid product counterexamples failed for same-file agent conflict, queued deletion, reverted rename, and undone typing.
- One initial status-selector failure was classified INVALIDTEST; the corrected P04/P09 positive control passes.
- Final focused UI: 43/43 twice.
- Real-engine controls pass for agent edit plus local edit and remote deletion plus local edit.
- Node engine: 68/68.
- TypeScript project check and production build: pass.
- P04, P05, P09, MA10, MA13, and MW04 mutants are each killed and restored exactly.

## LLM BOUNDARY CHECK

No LLM boundary changed. Queue intent, disk reconciliation, conflict detection, acknowledgement selection, and recovery are deterministic.

## MULTI-SURFACE CHECK

The behavioral proof exercises the actual React App boundary and the real native engine against isolated synthetic workspaces. Packaged-native, rendered, and live checks remain NOT_RUN for this new head.

## EXHAUST & COST CHECK

No dependency, package, workflow, CSS, backend engine, Electron provider, or external service changed. The correction is confined to `App.tsx`, its existing behavioral test, and scoped evidence.

## ROOT-CAUSE & RULE DELTA

The prior queue captured a stale disk baseline when `persist()` was called and later advanced the same-file baseline to an agent revision before saving the user's later edit. The corrected queue advances submitted intent at submission and preserves the original per-file conflict baseline whenever both sides changed.

## Learnings landed

- A disk snapshot, a submitted intent, and visible UI are separate states.
- A queued delta must be based on the preceding submitted intent, including changes back to older values.
- Same-file two-sided changes belong to the backend conflict and existing recovery path, never a frontend merge.
- An `ok:true` response without stored files is a failure, not an acknowledgement.

## Qualification still pending

- The prior canonical CI success at `b367db8e74383aadc7699c306345ddda0f5fbf6e` does not qualify this new head.
- Exact-head canonical local CI is pending.
- Packaged-native, rendered, and live qualification are NOT_RUN.
- Independent Claude re-review at the new exact head is pending.
- Merge and release remain pending.

This pull request remains draft.
