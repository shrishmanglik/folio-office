# PR14 Phase A red and contract recommendation

Exact reviewed head: `b367db8e74383aadc7699c306345ddda0f5fbf6e`.

Focused red against untouched product source: 16 existing tests passed and 5 new cases failed. Four are the intended product counterexamples:

- Same-file agent edit was overwritten on disk by later user text instead of raising the engine conflict and exposing Keep my edits as copies.
- A file deleted while its creation save was in flight returned on disk and in the UI.
- A rename reverted while its save was in flight ended at the temporary name.
- Typing undone while its prior save was in flight returned to disk and the editor.

The fifth initial failure was a test selector reading the Workspace file-count status instead of the editor save status. The corrected targeted control passes and pins both existing behaviors: the editor reads `Unsaved changes` after later edits, and native `{ok:true}` without `files` becomes `Save failed`.

Surviving mutation definitions from the independent review:

- P04 replaces `setSaved(hasUnsavedEdits?'Unsaved changes':window.office?` with `setSaved(window.office?`.
- P05 replaces `const saveCandidate=reconcileStoredSnapshot(baseline.current,baselineAtSubmission,candidate);` with `const saveCandidate=candidate;`.
- P09 replaces the missing-files throw and stored response assignment with `stored=structuredClone(r.files??saveCandidate)`.

P04 and P09 are now pinned by the passing targeted control. P05 is red through the deletion, reverted-rename, and undone-typing cases.

## Recommended private queue contrac

Keep the backend conflict contract unchanged. Track three distinct values: the latest disk snapshot actually returned by storage, the previous submitted intent that a newly queued candidate was based on, and the current visible user state. At submission, capture `basedOn = previousSubmittedIntent`, then advance `previousSubmittedIntent = candidate`. At execution, rebase the candidate's delta from `basedOn` onto the latest disk snapshot. This preserves queued deletions and changes back to older values.

At settlement, detect file IDs changed both by storage relative to the submitted candidate and by the user after submission. Do not overlay those files and do not advance their conflict baseline to the returned revision. Return an explicit conflict result so the existing Save failed and Keep my edits as copies path remains authoritative. Files changed on only one side may adopt the stored version or retain the later local delta. Keep the actual disk snapshot separate from the per-file conflict baseline.

No product or backend source was changed in Phase A.
