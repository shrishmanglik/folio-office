# Validation record: 0.6.0 source preview

Validated locally on Windows using synthetic data in a temporary profile. This is task-based automated validation, not feedback from recruited users and not a claim to have tested every Office feature.

| Viewpoint | Task | Result |
| --- | --- | --- |
| Finance user | Select six cells, apply bold/currency, read sum 9350 | Passed in actual Electron renderer |
| Everyday spreadsheet user | Insert SUM below the selected range | Passed; result 9350 |
| Keyboard user | Extend selection with Shift+ArrowDown | Passed |
| Recovery user | Delete a range and undo | Passed |
| AI agent | Read saved range styles and formula through the shared engine | Passed |
| Formula consumer | Financial/logical/lookup formulas, quoted cross-sheet references, cycles, errors, network-function rejection | Passed in automated fixtures |
| Contributor | Install, tests and build | Initial GitHub CI completed actual steps; later runs are linked from each PR |

The current automated suite contains 34 tests. `npm test` and `npm run build` passed locally. `node scripts/native-spreadsheet.cjs` exercises the native flows above and writes evidence locally. No renderer exceptions were observed in that run.

A rendered screenshot exposed double-encoded toolbar glyphs. The source was corrected and a source-encoding regression check now rejects the known corruption sequences.

## Limits

Local Excel 16.0.20326.20132 was opened. The Windows helper returned an Excel accessibility tree with a screenshot of another app, so further input was stopped. A complete local Excel ribbon inventory and task comparison are **not complete**.

Advanced spreadsheet tools, assistive-technology testing, large-workbook stress, full Office fidelity, an independent release review and clean-machine installer acceptance remain open. Existing document, presentation, notebook, storage, conversion and agent tests do not amount to testing from every possible user viewpoint.

The source no longer depends on HyperFormula. The MIT replacement has bounded compatibility fixtures, not exhaustive equivalence. `buffers@0.1.1` licensing remains unresolved; no public binary release is provided.
