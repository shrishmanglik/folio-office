# Round 3 accepted intent boundary

`baseline` remains the latest accepted storage snapshot, including revisions and remote fields. `latest` remains the visible editor state. The new `acceptedSubmittedIntent` holds only the last raw user candidate whose storage call returned a valid successful file list.

Each queued job reads that accepted raw intent when it begins executing. A failed job cannot become the base of a later job. After an accepted write, the ref advances to the raw `candidate`, rather than the rebased `saveCandidate` or returned `stored` snapshot. Those latter values can contain an unseen remote file such as Q; treating either as prior user intent would make Q's absence from an already queued raw candidate look like a user deletion.

`visibleAtSubmission` stays captured when the job is dispatched because it identifies edits made while that exact write was pending. A successful storage write advances accepted intent before post-store conflict detection; the conflict barrier then prevents another write until the existing recovery path loads an authoritative snapshot and resets the ref.
