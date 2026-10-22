# Folio acknowledged four-template receipt and honest desktop boundary

AUTHORS: Original PR10 source-contract work by Codex 01a15f0a-68e4-7020-8e30-d37505d54904; integrated receipt repair by Codex 01a13460-501c-7210-85f6-4f1e2e15bf7d.
Standing independent reviewer/merger/deployer: Claude Code CEO edea120f, Chief of Staff orders04,05,06.
Original PR10 head: ce1d7fc335342ad5e4b447f933d553214fb5d031. Main b1b66a4cf56de5ba73bd9f59806b65c27950bcea merged in the isolated repair branch without conflict, preserving honest desktop release claims.

The named four-template action waits for one serialized batch save acknowledgement, then copies a receipt built from actual saved file IDs, names and kinds. App deduplicates by stable template provenance (or legacy kind/name), preserves edited/renamed existing work and saves before acknowledgement even when all templates already exist. Publication after the save merges additions into current local state, rather than replacing it with a stale snapshot. Failed saves leave the visible workspace unchanged.

The four rich first-party templates now have one canonical catalogue shared by the individual picker and batch action. Clipboard rejection/absence offers an accessible readonly manual-copy receipt. Retries recheck persistence and reuse existing files; a delayed result for an older persona cannot mark the currently selected persona copied. Fee figures are explicitly illustrative comparisons and exclude future acquisition price and buyer hardware costs.

## Author verification

- Focused cases against original source: 11 fail, 10 pass. Additional acknowledgement regressions against the partial repair: 10 fail,16 pass. Both reds retained.
- Final rendered Suite and actual App callback tests: 26 pass,0 fail, twice.
- Full Node suite: 67 pass, 0 fail, 0 skip, including the real native-engine persistence/readback test. The initial catalogue-location test was deliberately inverted to verify the shared catalogue and both Workspace consumers.
- Final UI suite: 26 pass, 0 fail, including the final typed harness. Production build: 2,122 modules, exit 0. Initial compiler failures are retained as build-red-types.txt; no test was excluded.
- GPU local production browser: 16 theme/viewport cases, seven readable region captures, zero horizontal overflow or page errors. Browser-local persistence is real; two additional desktop-bridge cases use labeled synthetic adapters. All owned browser/server handles closed.
- Screenshot processing requires explicit QUALIFICATION_SHARP_MODULE when Sharp is absent locally. This is tooling only. Missing-tool and retired-header verifier failures are preserved separately and are not product failures or passing runs.
- UI tests now have a declared test:ui command and Vitest configuration, so the Node engine runner and React UI runner each execute their real test files. The existing local-CI workflow replays both.

## Boundaries

The original desktop release honesty repair is preserved. A signed downloadable release, complete license key ring, local AI adapter and hosted subscription are not established by these changes. Browser-local saves are labeled browser-preview. Synthetic window.office tests prove the acknowledged bridge contract, not a packaged Electron installer or real desktop IPC. The Node engine test proves the actual source storage path separately.

Only synthetic fixtures and local builds are used. No operating-system clipboard, personal application material, customer data, credential, real payment, merge or deployment was used. Hosted CI was active at intake and read back disabled_manually before the PR10 update. Exact-head local CI and independent review remain post-push gates.
