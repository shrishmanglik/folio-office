## Problem and resulting behavior

Folio could silently discard an edit after a non-conflict save failure. A busy workspace or I/O failure advanced speculative queue intent before storage accepted anything, so Ctrl+S, closing the app, editing another document, or retrying a new file could write the older disk state and then report Saved on this device.

The queue now keeps four roles explicit: the latest accepted disk baseline, the last successfully accepted raw submitted candidate, the dispatch-time visible snapshot, and the current visible UI. Each queued job reads accepted raw intent when that job begins. Failed and malformed saves never advance it. A successful save advances it to the raw candidate only after storage returns a valid file list.

The accepted intent deliberately excludes remote fields introduced by rebasing or storage. This preserves an unseen remote file such as Q across already queued raw candidates instead of interpreting Q's absence as a later user deletion. Post-store two-sided conflicts advance the accepted raw candidate because storage accepted the write, then the conflict barrier blocks further storage until Keep copies or another authoritative reload resets the state.

AUTHOR: Codex CEO 01a13460-501c-7210-85f6-4f1e2e15bf7d

## DETERMINISTIC ENGINE CHECK

- Red on `e11943403e812227cd163fd27ae578df009b5b1b`: 25 passed and 5 failed. The failures covered an already queued independent filename/body delta, plain Ctrl+S retry, editing doc B after doc A failed, retrying a failed creation, and close-after-failure.
- All 22 previous App controls stayed green. The corrected real-engine Q control recorded every accepted Y/A/B snapshot and found the unseen remote Q in all three. Engine revision and two-sided conflict barriers, Keep copies recovery, delete, revert, undo, and agent-conflict controls stayed green.
- Final focused App suite: 30/30. Full UI: 51/51. Node engine: 68/68. TypeScript and production build: pass.
- The wrong `acceptedIntent = saveCandidate` mutant failed the per-write Q history control. G02, G05, corrected G06, and G07 each failed their barrier or recovery control, and `App.tsx` was restored to its recorded SHA-256 after every mutation.
- The first G06 probe was too late and allowed a subsequent G05 engine conflict to mask the missing two-sided barrier. The corrected probe checks the storage call count immediately after the first conflict and kills G06.

## LLM BOUNDARY CHECK

No LLM boundary changed. Queue intent, storage reconciliation, conflict detection, and recovery remain deterministic.

## MULTI-SURFACE CHECK

The React App tests use the real native storage engine against isolated synthetic workspaces. Packaged-native, rendered, and live qualification remain NOT_RUN for this head.

## EXHAUST & COST CHECK

No dependency, package, workflow, CSS, native engine, Electron API, or external service changed. The product correction is confined to `src/App.tsx` and its existing behavioral test.

## ROOT-CAUSE & RULE DELTA

The prior queue advanced submitted intent when work was enqueued rather than when storage accepted it. A later job therefore treated failed changes as already stored and omitted them from its delta. Accepted intent now advances only after successful storage and uses the raw candidate so rebased remote state never becomes fabricated user intent.

## Learnings landed

- Queue intent means the last raw candidate storage accepted, never the last candidate merely attempted.
- A queued job must read accepted intent when it executes because earlier queued work may fail.
- Rebased or returned storage state can contain remote facts that must not become user intent.
- Barrier tests must observe the first protected call before another conflict path can mask the missing guard.

## Qualification still pending

- Exact-head canonical local CI and provider status publication.
- Packaged-native, rendered, and live qualification.
- Independent Claude re-review at the new exact head.
- Merge and release.

This pull request remains draft.
