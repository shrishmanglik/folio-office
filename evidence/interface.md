# Four-template persistence interface

`App` owns `onEnsureTemplates(seeds)` because it owns the serialized persistence queue and the latest workspace snapshot. The callback returns a discriminated acknowledgement with the actual persisted file IDs, created and existing IDs, and the truthful storage surface.

The batch deduplicates by `templateId`, with kind and name as the legacy fallback. Existing objects remain unchanged so renamed files, edited data, revisions, stars, and timestamps survive. Missing templates are persisted as one candidate batch. They enter visible React state only after persistence succeeds, combined with the then-current workspace snapshot so concurrent edits are not replaced by stale pre-save state.

`FolioSovereignCommandSuite` snapshots the selected persona, waits for the storage acknowledgement, then separately waits for clipboard completion. Clipboard failure retains the acknowledged receipt in a readonly manual-copy field. Retrying that receipt reuses the acknowledgement and does not create files again.

## Round2 interface decision, 2026-10-22

Extend the existing onCreate(kind, name?, data?, templateId?) callback with one optional fourth argument. App remains the owner of file identity, data cloning, queued writes and acknowledgement. makeFile stamps a supplied templateId and clones provided catalogue data; ordinary three-argument callers keep their existing defaults. Both individual launch surfaces pass the canonical seed.templateId. ensureTemplates uses the same constructor, retains exact legacy kind-plus-name reuse, refuses calls before readyRef, and exposes one batch-busy boolean while a pending-count ref protects queued saves. A tagged creation is refused during a pending batch and opens an existing canonical file when already present. Receipt/pillar controls use existing tokens with 44px minimum height; the readonly fallback uses the available width.

Rejected: a second template catalogue, a new store, or caller-side cloning/stamping at each launch site. Those would duplicate provenance rules and leave the two launch paths inconsistent. Existing persistence acknowledgements remain mandatory; no optimistic storage or local-AI/installer claim is added.
