# Stored receipt fix-forward test lis

- Native desktop acknowledgement uses the exact IDs, kinds, names, and data returned by storage.
- A candidate absent from the returned stored snapshot is not acknowledged as published.
- Two requested template batches remain serialized: batch two sees batch one's stored IDs and creates none.
- The real Workspace template card passes `templateId` through the public `onCreate` callback.
- An agent rename returned during a save becomes the next baseline.
- UI rename, favorite, or data edits made after that save began remain visible and are submitted against the returned baseline on the next save.

Phase A stops at red on untouched `b5b0a04f501ee36611121bf91b8b96dc6aee93e6`. No product implementation is included.
