# Four-template persistence interface

`App` owns `onEnsureTemplates(seeds)` because it owns the serialized persistence queue and the latest workspace snapshot. The callback returns a discriminated acknowledgement with the actual persisted file IDs, created and existing IDs, and the truthful storage surface.

The batch deduplicates by `templateId`, with kind and name as the legacy fallback. Existing objects remain unchanged so renamed files, edited data, revisions, stars, and timestamps survive. Missing templates are persisted as one candidate batch. They enter visible React state only after persistence succeeds, combined with the then-current workspace snapshot so concurrent edits are not replaced by stale pre-save state.

`FolioSovereignCommandSuite` snapshots the selected persona, waits for the storage acknowledgement, then separately waits for clipboard completion. Clipboard failure retains the acknowledged receipt in a readonly manual-copy field. Retrying that receipt reuses the acknowledgement and does not create files again.
