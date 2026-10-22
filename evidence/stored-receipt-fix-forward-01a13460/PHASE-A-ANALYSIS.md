# Phase A analysis and red receip

- Base: `b5b0a04f501ee36611121bf91b8b96dc6aee93e6` (`origin/main`, clean before test authoring).
- Branch: `codex/folio-stored-receipt-fix-forward-20261022`.
- Collision check: no open pull request in `shrishmanglik/folio-office`; no matching stored-receipt worktree or branch existed.
- Store check: primary top-level, config, index, and objects were present; `git fsck --connectivity-only` reported only dangling blobs.
- Existing native signature: `window.office.save(files: OfficeFile[], baseline: OfficeFile[]) => Promise<{ok:boolean; error?:string; files?:OfficeFile[]; code?:string; details?:any}>`.
- Existing private signature: `persist(value: OfficeFile[]) => Promise<boolean>`.
- Backend truth: `core/engine.cjs::saveSnapshot(incoming, baseline)` already rejects same-file concurrent changes, merges unrelated agent edits, and returns the resulting stored snapshot. `electron/main.cjs` returns that snapshot as `{ok:true, files}`.
- No frontend three-way merge or reconciliation helper exists.

## Recommended private contrac

Keep every public component callback unchanged. Make private persistence return a discriminated success carrying the exact stored `OfficeFile[]`, or an explicit failure. On success, set the baseline and persisted marker from storage. Reconcile visible state by applying only edits made after the submitted candidate onto the stored snapshot. This preserves storage truth without discarding concurrent UI edits and avoids a second backend merge kernel.

## Valid red

Command: `npx vitest run src/App.four-in-one.test.tsx src/FolioSovereignCommandSuite.test.tsx --maxWorkers=1

Result on untouched product source: 36 tests, 33 passed, 3 failed for the intended missing behavior:

1. acknowledgement used `Executive Client Audit Document` instead of returned `Agent renamed audit`;
2. four candidate IDs were acknowledged when storage returned only three;
3. the next save baseline retained the stale candidate name instead of the returned agent rename.

The queue-serialization assertion and real Workspace card launch control passed on current source and are positioned to kill `MA10` and `MW04`. The missing-published-file red pins `MA13` behavior. Raw logs: `npm-ci.txt`, `red-vitest.txt`, and `phase-a-result.json`.

No product implementation, commit, push, pull request, CI, browser, GPU, approval, merge, or deployment was performed.
