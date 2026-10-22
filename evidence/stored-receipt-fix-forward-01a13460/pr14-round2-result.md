# PR14 Round 2 author resul

The frontend queue now keeps three states distinct: latest accepted disk baseline, previous submitted intent, and current visible UI. Submitted intent advances when each save is queued. A queued candidate's delta is rebased from that intent onto the latest disk snapshot, preserving deletion, rename reversion, and text undo.

At settlement, a same-file two-sided change is detected across the returned stored snapshot and post-submission UI. The conflicted file keeps its original edit baseline, visible user work remains open, the existing Save failed and Keep my edits as copies path appears, and a conflict barrier prevents already queued writes from overwriting agent storage. Initial load, remote refresh, history restore, and Keep copies recovery reinitialize the intent and barrier deliberately. The backend engine is unchanged.

Proof on final source:

- Focused UI: 43/43 twice.
- Real-engine conflict controls cover agent edit plus local edit and remote deletion plus local edit.
- Queued deletion, reverted rename, and undone typing remain green.
- P04, P05, P09, MA10, MA13, and MW04 mutants are each killed and restored byte-for-byte.
- Node engine: 68/68.
- TypeScript project check: clean.
- Production build: success, 2,122 modules; inherited chunk-size warning only.
- `git diff --check`: clean.

Final hashes:

- `src/App.tsx`: `634d895b8c6a5c18f797605c300a124126ce789e6e9ca31f6b6ac43d3345edf5
- `src/App.four-in-one.test.tsx`: `e278c724a3f92862cce52f02ad50d86296a56acce0f9e0029ae1d71510658d52
- Untouched Suite test: `2eb196ca03b89032a13a6d78af26b30a42c79e692d64ece7f50005ecdfc3071d
- Untouched Workspace: `954acc7f2403eda34a3e0bf40d4ee938f8d0080767e4cb238ac83d9030820342

No commit, push, PR mutation, CI, GPU, approval, merge, or deployment was performed.
