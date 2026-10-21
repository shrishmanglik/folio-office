## Summary

Follow-up to https://github.com/shrishmanglik/folio-office/pull/8, which merged while Wave 6 was being built. The follow-up starts from merged main; its baseline tree is identical to the original feature-branch baseline.

Retain the four-theme parity repair and add the Vedic-style sovereign command suite. Six native business presets feed four horizontal workspaces for documents, deterministic financial grids, executive decks and local receipts. Actions create or open real native files through Workspace callbacks, and the suite is exported through src/app/folio-office-app.ts.

## Validation

- npm test: 64 passed, zero failed, zero skipped.
- npm run build: passed, including TypeScript. The existing large-chunk warning remains.
- NVIDIA RTX 5060 browser smoke: all 24 preset/workspace actions, persisted native data, clipboard receipts, keyboard tabs and sixteen theme/viewport combinations passed.
- The populated library stays within the 390px viewport, and sovereign status text clears the theme control.
- New surfaces use semantic variables in all four themes. Added/changed text contains zero em dashes.

Author receipt and reproducible browser script: evidence/wave6-archetypes/. Independent review and production verification are requested; this builder did not merge or deploy.

## Learnings landed

- All six presets are tested across all four workspace data paths. Complete native slide fields and calculated receipt contents are pinned in tests/theme-switcher-and-sovereign-copy.test.cjs.
- Real file creation and local-storage readback catch schema mismatches that a rendered button alone cannot detect.
- Populated-library browser coverage catches inherited receipt and table overflow, while phone status geometry prevents the theme control obscuring the new copy.

## Boundaries

Business figures are samples. Local AI requires a configured compatible provider, vault availability follows the installed provider, and an exported-file SHA-256 digest is not claimed before export. No new dependency, hosted workflow or provider mutation is included.
