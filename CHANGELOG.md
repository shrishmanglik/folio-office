# Changelog

## 0.8.0

- Shared desktop and agent formatting: fonts, underline/strike, wrapping, vertical alignment, indent, rotation and physical cell borders, retained by XLSX style conversion.
- Copy ranges with translated formulas, calculated values, formatting, transpose and skip-blank modes. Copying calculated text retains its text type.
- Fill in all four directions and replace literal text within a selected range.
- Compact formatting controls, mixed-format notice and undoable copy/replace operations.
- Full catalog acceptance remains pending; see docs/EXECUTION-STATE.json for precise limitations.

## 0.7.0 Home workflow increment

- Shared UI/agent fill, selective clear, record sort and worksheet rename/duplicate/reorder/delete.
- Row, column and whole-grid header selection.
- Quote-aware formula reference translation and referenced-sheet deletion safeguards.
- Bounded recovery from Windows delete-pending workspace lock errors.
- Full 165-entry scope remains tracked in docs/EXECUTION-STATE.json; advanced and unsupported variants remain open.

## 0.6.0 source preview

First public source snapshot of the existing local desktop application. Earlier work was local development, not GitHub releases.

- Four local editors with a redesigned workspace, recent files, sorting and navigation.
- Document outline/focus mode and clearer spreadsheet/presentation controls.
- Shared CLI/MCP engine with revision checks, dry runs, semantic edits and recovery.
- Shared document/spreadsheet conversion and bounded saved-version history.
- Apache-2.0 license for original source, third-party notices and an MIT formula-engine replacement, and contribution/security documentation.

Known limits are in the README and roadmap. No signed installer or full Office parity is claimed.

- Spreadsheet range selection, range formatting/copy/clear, selection totals and summary-function insertion.
