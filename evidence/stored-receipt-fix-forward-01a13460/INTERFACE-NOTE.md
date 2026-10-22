# Private persistence interface recommendation

Keep the public `App` / `Workspace` / `FolioSovereignCommandSuite` callbacks unchanged.

Change only the private `persist(candidate: OfficeFile[])` boundary so success carries the exact stored `OfficeFile[]`, while failure remains explicit. The Electron response is authoritative because `core/engine.cjs::saveSnapshot` already performs the three-way merge and returns the stored snapshot.

On success:

1. Set `baseline.current` and the persisted marker from the returned stored snapshot.
2. Build template acknowledgement, created IDs, existing IDs, kinds, and names only from that stored snapshot.
3. Reconcile visible state against the submitted candidate: begin from the stored snapshot, then retain only edits that appeared in `latest.current` after the candidate was captured. This preserves an agent rename for the baseline while retaining a concurrent UI rename, favorite, or data edit for the next save.

Do not add a second backend merge engine. The frontend reconciliation only carries post-submission local edits across an already authoritative stored response.
