# Folio Office PR 10 round 2 focused result

- Base head: `8999118c2254d9119e3236d4cf6b14609d3c6824`
- Scope: App central template creation and queued batch admission; Workspace and Suite tagged launches; receipt controls and fallback dimensions; focused tests and evidence.
- Initial red: valid after three memory-floor `INVALID_SETUP` admissions. The old source failed the new fourth-argument launch, pending-card disable, 13-row fallback, App provenance, pre-ready and queue tests, and the Workspace static contract.

## Focused proof

- Green 1: App 11/11 and Suite 20/20; Node static persistence contracts 2/2.
- Green 2: App 11/11 and Suite 20/20.
- M8, legacy kind-and-name fallback removed: killed, 1 failed and 10 passed. The legacy file `legacy-exact` was not acknowledged.
- M10, central `templateId` argument removed: killed, 3 failed and 8 passed. Batch acknowledgements lost template identity and the renamed individual template was not stable across a second batch.
- Restored final App: 11/11.
- Normal heavy slots released successfully. Vitest used one worker. Available memory was checked before every heavy command.

The M10 run's third failure is a timeout in the queued-batch test after identity loss caused an extra unresolved save. The two direct identity assertions already kill M10 independently; the timeout is retained as part of the raw mutant output rather than hidden.

## Limits

This lane did not run full Node tests, full UI tests, typecheck, build, browser, GPU, local CI, provider status, commit, push, review, merge, or deployment. Root owns those checks and the final-head browser helper. Root's existing `evidence/interface.md` change and `round2/verify-browser-round2.mjs` are preserved and were not authored here.

## Follow-up after intermediate head 6d3553453

- Red: 2 failed, 10 passed. Tagged creation opened a file between queued acknowledgements, and the acknowledgement reported a rename/favorite made after desktop persistence began.
- Fix: every tagged launch is refused while the pending-count ref is nonzero. Receipt files come from the exact persisted candidate and are filtered to IDs still present in the published workspace; the visible concurrent rename/favorite remains intact.
- Green 1: App 12/12. Green 2: App 12/12.
- M8 rerun: killed, 3 failed and 9 passed.
- M10 rerun: killed, 1 failed and 11 passed.
- M11, `await writes.current` removed: killed, 1 failed and 11 passed because the first template candidate omitted the ordinary file created while the prior Ctrl+S write was held.
- App restored after each mutant and final SHA-256: `d9509d9b8039d7e9ebf5d0da515614df29a6d27af806ae06b5daf29803b220f6`.

## Root pre-commit qualification, 2026-10-22 12:45Z

The complete declared Node command passes 68/68 with zero failures and skips. The complete declared UI command passes 32/32 across two files. TypeScript project checking and the Vite production build pass. These checks ran on the combined working source after the follow-up, with source hashes retained below; they are not presented as exact-head CI or final-head GPU proof.

The final-head browser helper refuses a deliberately wrong full expected SHA before running its browser flow. It requires a clean committed worktree, an external output directory, and a source/built-asset hash manifest. The matrix exercises both actual individual launch surfaces, a real rename, browser storage readback and batch reuse, denied/missing/deferred clipboard cases, 44px targets and receipt geometry. Desktop storage cases use an explicitly synthetic window.office adapter. Native installer, local AI, Node22, provider deployment and production proof remain NOT_QUALIFIED or NOT_RUN as appropriate.

Sidebar Chat10 externally committed the intermediate 6d3553453 while this task was active. Chief of Staff order34 stopped that duplicate writer, restored sole ownership to Codex01a13460 and froze approval/merge/deploy of the intermediate head. This author continues forward without resetting that commit. Claude CEO edea120f is the independent reviewer requested; the author/helper and the intermediate committer do not approve this increment.

CI and GPU at the next pushed head are PENDING at this receipt timestamp. Their subsequent exact-head receipts belong in paired estate records and the PR body. No earlier capture is transferred to the next head.
