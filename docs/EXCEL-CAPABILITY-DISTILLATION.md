# Excel capability distillation

165 capability entries across 25 groups. Machine-readable source: [EXCEL-CAPABILITY-CATALOG.json](EXCEL-CAPABILITY-CATALOG.json). This Markdown is its human-readable companion.

## Scope and evidence

Expanded Home ribbon plus broader spreadsheet capability inventory. Not an exhaustive inventory of every Excel build, add-in, function signature or hidden menu.

The screenshot shows the Home ribbon and tab names. It does not expose every submenu. Visible controls, documented expansions and broader product requirements are distinguished in the catalog. The earlier local inspection covered Home, Insert and Data. No implementation or parity status is awarded by this document.

## Expanded inventory

### Workspace and command access

Evidence class: `visible`. Proposed agent family: `workspace`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-01-01 | Quick access | Save, undo, redo, customize frequently used commands |
| XL-01-02 | Ribbon navigation | File, Home, Insert, Draw, Page Layout, Formulas, Data, Review, View, Help |
| XL-01-03 | Command search | Find a command by intent or name and invoke it with explicit arguments |
| XL-01-04 | Name box | Read the active address, jump to a cell or range, select a named range |
| XL-01-05 | Formula bar | Inspect raw content, edit formula/value, confirm, cancel, insert a function |
| XL-01-06 | Grid navigation | Cell, range, row, column, whole-sheet and disjoint selection; keyboard extension |
| XL-01-07 | Workbook identity | Title, file name, dirty/saved/conflict state and current workspace |
| XL-01-08 | Window controls | Minimize, maximize, restore, close and ribbon visibility |
| XL-01-09 | Sharing entry point | Inspect sharing options; online delivery is an optional integration |
| XL-01-10 | Add-ins entry point | Discover installed extensions and their declared capabilities |

Acceptance requirement: Keyboard focus remains visible; editing Escape restores the previous value; close waits for a save or exposes recovery. Shared commands never require an agent to click a ribbon.

References: [Microsoft: Excel keyboard shortcuts](https://support.microsoft.com/en-us/office/keyboard-shortcuts-in-excel-1798d9d5-842a-42b8-9c99-9b7213f0040f).

### Home / Clipboard

Evidence class: `visible_with_documented_expansion`. Proposed agent family: `range.transfer`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-02-01 | Cut and copy | Move or duplicate a cell range |
| XL-02-02 | Paste | Apply selected source content to an explicit destination |
| XL-02-03 | Paste values or formulas | Choose computed values versus formula expressions |
| XL-02-04 | Paste formats | Apply cell appearance separately from content |
| XL-02-05 | Other paste modes | Number formats, validation, comments/notes, widths and transposition where supported |
| XL-02-06 | Paste Special arithmetic | Add, subtract, multiply or divide destination values by source values |
| XL-02-07 | Blank handling and links | Skip source blanks; explicit linked paste rather than accidental external dependencies |
| XL-02-08 | Format Painter | Reuse appearance on a different selection |

Acceptance requirement: Copy B2 formula =A2*$F$1 down one row and obtain =A3*$F$1. Paste-values freezes the result. A multi-cell operation is atomic and undoable; overlapping moves cannot erase source data before it is read.

References: [Microsoft: Paste options](https://support.microsoft.com/en-us/excel/paste-options).

### Home / Font and borders

Evidence class: `visible_with_documented_expansion`. Proposed agent family: `range.format`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-03-01 | Typeface and size | Font family, size, increase/decrease |
| XL-03-02 | Emphasis | Bold, italic, underline and its variants |
| XL-03-03 | Font effects | Strike, superscript and subscript via detailed formatting |
| XL-03-04 | Foreground and fill | Text and background colors, automatic/theme/custom colors |
| XL-03-05 | Border formatting | Selected sides, inside/outside, style, weight and color |
| XL-03-06 | Detailed cell formatting | Inspect and modify compatible properties in a single dialog |

Acceptance requirement: Range formatting changes only specified properties, retains formulas and exports/reimports supported appearance. Mixed selections show mixed state. Font availability is reported when an offline machine lacks a requested typeface.

References: [Microsoft: Format text in cells](https://support.microsoft.com/en-US/Excel/format-text-in-cells), [Microsoft: Format Cells settings](https://learn.microsoft.com/en-us/troubleshoot/microsoft-365-apps/excel/format-cells-settings).

### Home / Alignment

Evidence class: `visible_with_documented_expansion`. Proposed agent family: `range.align`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-04-01 | Horizontal alignment | Left, center and right; additional alignment modes in detailed settings |
| XL-04-02 | Vertical alignment | Top, middle and bottom |
| XL-04-03 | Text orientation | Rotate or orient content vertically |
| XL-04-04 | Indentation | Increase/decrease text indentation |
| XL-04-05 | Wrap | Wrap text within the cell width |
| XL-04-06 | Shrink to fit | Fit display text without changing its stored content |
| XL-04-07 | Merge variants | Merge-and-center, merge across, merge cells, unmerge |
| XL-04-08 | Reading direction | Support left-to-right and right-to-left content |

Acceptance requirement: Merging a range containing several values first exposes the loss and a recoverable choice. Unmerge restores cell geometry. Wrapped row heights and rotation survive XLSX conversion where supported.

References: [Microsoft: Format Cells settings](https://learn.microsoft.com/en-us/troubleshoot/microsoft-365-apps/excel/format-cells-settings).

### Home / Number formats

Evidence class: `visible_with_documented_expansion`. Proposed agent family: `range.numberFormat`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-05-01 | General and numeric | General display, decimal precision, grouping and negative-number styles |
| XL-05-02 | Currency and accounting | Currency symbols; accounting alignment of amounts |
| XL-05-03 | Percentages | Percentage presentation with configurable precision |
| XL-05-04 | Dates and times | Short/long dates, time-of-day and elapsed-time formats |
| XL-05-05 | Fraction and scientific | Fractional and exponential display |
| XL-05-06 | Text and special formats | Preserve identifiers and locale-specific patterns |
| XL-05-07 | Decimal controls | Increase or decrease displayed decimal places |
| XL-05-08 | Custom formats | Positive/negative/zero/text sections, literals, conditions and colors |

Acceptance requirement: A stored 0.125 becomes 12.5% without changing the value. Leading-zero identifiers remain text. Display precision cannot silently round saved calculations. Date interpretation and locale must be explicit.

References: [Microsoft: Format Cells settings](https://learn.microsoft.com/en-us/troubleshoot/microsoft-365-apps/excel/format-cells-settings).

### Home / Conditional formatting

Evidence class: `visible_with_documented_expansion`. Proposed agent family: `conditionalRules`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-06-01 | Value and text rules | Comparison, text matching and date-based conditions |
| XL-06-02 | Ranking rules | Top/bottom, above/below average and duplicates/uniques |
| XL-06-03 | Visual indicators | Data bars, color scales and icon sets |
| XL-06-04 | Formula rules | Evaluate a condition relative to each target cell |
| XL-06-05 | Rule management | Create, inspect, edit, order, clear and scope rules |
| XL-06-06 | Conflicts and priority | Resolve overlapping rules predictably and expose supported stop behavior |

Acceptance requirement: Changing an input recalculates the relevant visual rule. The saved rule is readable by agents and survives reopening; colors alone are not the only accessible explanation.

References: [Microsoft: Conditional formatting API](https://learn.microsoft.com/en-us/office/dev/add-ins/excel/excel-add-ins-conditional-formatting).

### Home / Tables and cell styles

Evidence class: `visible_with_documented_expansion`. Proposed agent family: `tables`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-07-01 | Create table | Explicit range, table name and header interpretation |
| XL-07-02 | Table presentation | Banded rows/columns, header and totals presentation |
| XL-07-03 | Structured references | Use persistent table and column names in formulas |
| XL-07-04 | Calculated columns | Apply a column calculation as the table grows |
| XL-07-05 | Table operations | Resize, rename and convert to a plain range |
| XL-07-06 | Reusable styles | Apply named styles; inspect, create and modify style definitions |

Acceptance requirement: Adding a record extends the table and its column formulas. Renaming a column updates valid references. A table is stored as a semantic object, not inferred from colored cells.

References: [Microsoft: Structured references with tables](https://support.microsoft.com/en-us/excel/using-structured-references-with-excel-tables).

### Home / Cells and sheets

Evidence class: `visible_with_documented_expansion`. Proposed agent family: `sheet.structure`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-08-01 | Insert cells | Shift neighboring cells right or down |
| XL-08-02 | Delete cells | Shift remaining cells left or up |
| XL-08-03 | Row operations | Insert/delete selected rows and preserve record alignment |
| XL-08-04 | Column operations | Insert/delete selected columns |
| XL-08-05 | Dimensions | Set row height and column width; autofit |
| XL-08-06 | Visibility | Hide/unhide rows, columns and worksheets |
| XL-08-07 | Sheet creation and deletion | Add, duplicate and remove sheets with recovery |
| XL-08-08 | Sheet organization | Rename, reorder, move/copy sheets and set tab colors |
| XL-08-09 | Cell protection attributes | Set locked/hidden attributes independently of workbook encryption |
| XL-08-10 | Sheet protection | Enforce configured restrictions in both UI and agent operations |

Acceptance requirement: Inserting a row updates dependent references, tables, styles and ranges together. Deleting a referenced cell yields an explicit error or documented transformation. Undo restores structure as well as values.

### Home / Fill, clear and summaries

Evidence class: `visible_with_documented_expansion`. Proposed agent family: `range.edit`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-09-01 | AutoSum family | Sum, average, count numbers, minimum and maximum; open further function selection |
| XL-09-02 | Directional fill | Fill down, right, up or left |
| XL-09-03 | Series fill | Numbers, dates and explicit steps/stops |
| XL-09-04 | Pattern fill | Infer a pattern with a preview and a way to reject it |
| XL-09-05 | Clear contents | Remove values/formulas while retaining other cell properties |
| XL-09-06 | Selective clearing | Clear formats, comments/notes, hyperlinks or all selected content |
| XL-09-07 | Undo and redo | Restore a complete logical operation |

Acceptance requirement: Fill distinguishes relative, absolute and mixed references. AutoSum identifies or accepts the intended range and refuses a silent overwrite. Clear-contents leaves formatting intact; Clear-all is a separate operation.

References: [Microsoft: Excel keyboard shortcuts](https://support.microsoft.com/en-us/office/keyboard-shortcuts-in-excel-1798d9d5-842a-42b8-9c99-9b7213f0040f).

### Home / Sort and filter

Evidence class: `visible_with_documented_expansion`. Proposed agent family: `range.sortFilter`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-10-01 | Simple sorting | Ascending/descending text, numeric or date ordering |
| XL-10-02 | Custom sorting | Multiple keys, headers, custom order, colors/icons when supported |
| XL-10-03 | Filtering | Value lists, text/number/date conditions and blanks |
| XL-10-04 | Filter management | Clear, reapply and inspect active criteria |
| XL-10-05 | Selection scope | Distinguish visible records from all records |

Acceptance requirement: Sort keeps complete records together and shows the actual affected range. Filter state is inspectable and does not delete data. Hidden-row copy, fill and summary semantics are explicit.

### Home / Find and select

Evidence class: `visible_with_documented_expansion`. Proposed agent family: `range.find`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-11-01 | Find | Search within selection, sheet or workbook with explicit match settings |
| XL-11-02 | Replace | Preview matches, replace one or all, and retain recovery |
| XL-11-03 | Go To | Navigate directly to addresses or named ranges |
| XL-11-04 | Go To Special | Select formulas, constants, blanks, comments, regions, arrays, objects or row/column differences |
| XL-11-05 | Object selection | Select and inspect drawing/chart objects independently of cells |

Acceptance requirement: A find result returns stable sheet identity and cell/object location. Replace reports affected cells before a bulk write. Search in formulas and displayed values are distinct modes.

References: [Microsoft: Find and select cells by conditions](https://support.microsoft.com/en-us/office/find-and-select-cells-that-meet-specific-conditions-in-excel-2d686424-6150-4015-a8e4-a5990f4d7e3a).

### Insert / Analysis objects

Evidence class: `broader_suite_inventory`. Proposed agent family: `objects.analysis`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-12-01 | Pivot tables | Source data, field placement, aggregation, grouping, filters and refresh |
| XL-12-02 | Pivot charts | Chart a pivot result with the related field/filter state |
| XL-12-03 | Charts | Column/bar, line/area, pie/doughnut, scatter/bubble, statistical, hierarchy, waterfall and combo families |
| XL-12-04 | Chart editing | Series, axes, titles, legends, labels, units and data-source changes |
| XL-12-05 | Sparklines | Compact line, column and win/loss visualizations |
| XL-12-06 | Slicers and timelines | Interactive filtering controls linked to supported data objects |

Acceptance requirement: Objects reference structured source data; their calculations and chart series are readable without screenshots. Stale pivots are marked until refreshed. Offline maps must declare their local data requirements.

References: [Microsoft: Explore Excel with a screen reader](https://support.microsoft.com/en-gb/office/use-a-screen-reader-to-explore-and-navigate-excel-cbf024e8-2abd-4764-b639-f24eed659a53), [Microsoft: Structured references with tables](https://support.microsoft.com/en-us/excel/using-structured-references-with-excel-tables).

### Insert / Content objects

Evidence class: `broader_suite_inventory`. Proposed agent family: `objects.content`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-13-01 | Images | Embed, crop, resize, position and supply alternative text |
| XL-13-02 | Shapes and diagrams | Shapes, connectors, icons and grouped objects |
| XL-13-03 | Rich visual assets | Diagram templates, screenshots and supported 3D assets |
| XL-13-04 | Text elements | Text boxes, decorative text and symbols/equations |
| XL-13-05 | Links and embedded objects | Explicit destinations, local references and supported attachments |
| XL-13-06 | Object layout | Select, reorder layers, align, distribute, group and lock |

Acceptance requirement: Every object has a stable ID, geometry, reading order and semantic content. Local assets remain available offline; unsupported external or embedded content is identified rather than executed implicitly.

References: [Microsoft: Explore Excel with a screen reader](https://support.microsoft.com/en-gb/office/use-a-screen-reader-to-explore-and-navigate-excel-cbf024e8-2abd-4764-b639-f24eed659a53).

### Draw

Evidence class: `broader_suite_inventory`. Proposed agent family: `ink`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-14-01 | Pen tools | Pen/highlighter, color and thickness |
| XL-14-02 | Ink editing | Erase, select and move ink strokes |
| XL-14-03 | Ink interpretation | Optional shape/math conversion and replay where available |

Acceptance requirement: Store editable strokes and accessible descriptions; optional recognition must declare model availability and its confidence. Do not claim a cloud recognition service works offline.

References: [Microsoft: Explore Excel with a screen reader](https://support.microsoft.com/en-gb/office/use-a-screen-reader-to-explore-and-navigate-excel-cbf024e8-2abd-4764-b639-f24eed659a53).

### Page Layout and printing

Evidence class: `broader_suite_inventory`. Proposed agent family: `print`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-15-01 | Themes | Coordinated colors, fonts and effects |
| XL-15-02 | Paper setup | Margins, orientation, paper size and page order |
| XL-15-03 | Print scope | Print area, selected ranges and repeated title rows/columns |
| XL-15-04 | Pagination | Page breaks and fit-to-page scaling |
| XL-15-05 | Page content | Headers, footers, page numbers and background behavior |
| XL-15-06 | Print visibility | Gridlines, row/column headings and hidden content policy |
| XL-15-07 | Output | Preview, printer selection and local PDF generation |

Acceptance requirement: Preview and exported/printed pages use the same layout calculation. A ten-page sheet cannot silently lose its final rows. Agents can request pagination metadata and a PDF without opening a printer dialog.

References: [Microsoft: Explore Excel with a screen reader](https://support.microsoft.com/en-gb/office/use-a-screen-reader-to-explore-and-navigate-excel-cbf024e8-2abd-4764-b639-f24eed659a53), [Microsoft: Excel keyboard shortcuts](https://support.microsoft.com/en-us/office/keyboard-shortcuts-in-excel-1798d9d5-842a-42b8-9c99-9b7213f0040f).

### Formulas / Calculation model

Evidence class: `broader_suite_inventory`. Proposed agent family: `calculation`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-16-01 | Operators and precedence | Arithmetic, comparison, concatenation and reference operators |
| XL-16-02 | Reference types | Relative, absolute, mixed, cross-sheet and structured references |
| XL-16-03 | Defined names | Workbook/sheet scope, creation, inspection, rename and deletion |
| XL-16-04 | Array behavior | Array formulas, dynamic spills and explicit spill conflicts |
| XL-16-05 | Recalculation | Automatic/manual mode, dirty dependencies and targeted/full recalculation |
| XL-16-06 | Errors and cycles | Typed errors, traceable causes and defined circular-reference behavior |
| XL-16-07 | Dates, locale and precision | Date systems, numeric limits and locale-aware input/output |
| XL-16-08 | Function availability | Versioned function catalog with explicit support status for each function |

Acceptance requirement: Function existence is not proof of compatibility. Test coercion, blanks, errors, arrays and edge cases per function. Unsupported functions return a precise diagnostic without rewriting the workbook.

References: [Microsoft: Formula concepts](https://support.microsoft.com/en-us/excel/get-started/overview-of-formulas-in-excel), [Microsoft: Versioned alphabetical function catalog](https://support.microsoft.com/en-us/excel/excel-functions-alphabetical).

### Formulas / Function families

Evidence class: `broader_suite_inventory`. Proposed agent family: `functions`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-17-01 | Arithmetic and aggregation | SUM/SUMIFS, PRODUCT, rounding, conditional counts and sums |
| XL-17-02 | Logical and errors | IF/IFS, AND/OR/NOT, SWITCH, IFERROR/IFNA |
| XL-17-03 | Lookup and reference | Lookup families, INDEX/MATCH and reference construction |
| XL-17-04 | Text | Parsing, joining, searching, replacement, case and character handling |
| XL-17-05 | Date and time | Calendar arithmetic, business-day and elapsed-time calculations |
| XL-17-06 | Financial | Cashflow, interest, depreciation and valuation functions |
| XL-17-07 | Statistics | Distributions, descriptive statistics, regression and testing |
| XL-17-08 | Specialized families | Engineering, complex numbers, database criteria, information and compatibility functions |
| XL-17-09 | Modern formula composition | Dynamic-array transformation, LET/LAMBDA and helper functions where supported |
| XL-17-10 | External function classes | Cube, web, real-time and extension functions require explicit integrations |

Acceptance requirement: Use the official alphabetical catalog as the versioned index. Maintain one support/test row per function and variant in implementation work; this feature-family list is not a claim that every function is implemented.

References: [Microsoft: Versioned alphabetical function catalog](https://support.microsoft.com/en-us/excel/excel-functions-alphabetical).

### Formulas / Inspection and audit

Evidence class: `broader_suite_inventory`. Proposed agent family: `formula.audit`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-18-01 | Function help | Search functions, inspect signatures and enter arguments |
| XL-18-02 | Reference picking | Select referenced cells/ranges while editing a formula |
| XL-18-03 | Formula display | Toggle formulas versus calculated results |
| XL-18-04 | Dependency inspection | Trace precedents/dependents and navigate errors |
| XL-18-05 | Evaluation tools | Inspect intermediate evaluation and watch selected values |

Acceptance requirement: Return an agent-readable dependency graph and evaluation explanation. UI tracing uses the same engine data; stale cached values are labeled.

References: [Microsoft: Excel keyboard shortcuts](https://support.microsoft.com/en-us/office/keyboard-shortcuts-in-excel-1798d9d5-842a-42b8-9c99-9b7213f0040f).

### Data / Import and transformation

Evidence class: `broader_suite_inventory`. Proposed agent family: `data.query`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-19-01 | Local import | Text/CSV, workbook and structured local-file sources |
| XL-19-02 | Import controls | Encoding, delimiters, headers and column data types |
| XL-19-03 | Query definitions | Reusable transformation steps and inspectable dependencies |
| XL-19-04 | Table transformations | Select/filter, change types, split, merge, join, append, group and pivot/unpivot |
| XL-19-05 | Connections and refresh | List, refresh, cancel and inspect source status |
| XL-19-06 | External sources | Web/database connectors are optional, separately configured integrations |

Acceptance requirement: Preview inferred types before committing. A refresh is transactional. Offline operation succeeds for available local sources and reports unavailable external sources without freezing the app.

References: [Microsoft: Explore Excel with a screen reader](https://support.microsoft.com/en-gb/office/use-a-screen-reader-to-explore-and-navigate-excel-cbf024e8-2abd-4764-b639-f24eed659a53).

### Data / Quality and modeling

Evidence class: `broader_suite_inventory`. Proposed agent family: `data.quality`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-20-01 | Text to columns | Delimiter/fixed-width splitting with destination preview |
| XL-20-02 | Duplicate handling | Identify and remove duplicates by explicit keys |
| XL-20-03 | Validation | Type/range/list/custom rules with input messages and error behavior |
| XL-20-04 | Data consolidation | Combine compatible ranges using explicit keys/aggregations |
| XL-20-05 | Relational model | Relationships, keys, measures and supported model refresh |
| XL-20-06 | Data cleanup | Trim/normalize/convert with an affected-value preview |

Acceptance requirement: Agents cannot bypass validation that constrains human writes. A duplicate-removal receipt records the chosen keys and removed rows. Preserve numeric-looking identifiers during import and cleanup.

### Data / Forecast and outline

Evidence class: `broader_suite_inventory`. Proposed agent family: `analysis`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-21-01 | What-if analysis | Goal seek, scenarios and one-/two-input data tables |
| XL-21-02 | Forecasting | Forecast series with visible assumptions and uncertainty |
| XL-21-03 | Optimization | Solver-style objectives, constraints and local solver capabilities |
| XL-21-04 | Outline | Group/ungroup rows or columns and show/hide detail |
| XL-21-05 | Subtotals | Grouped aggregation with clear behavior under filtering |

Acceptance requirement: Analysis reports assumptions, convergence and errors. A forecast is labeled as a model output. Scenario changes have deterministic restoration and an agent-readable result.

### Review

Evidence class: `broader_suite_inventory`. Proposed agent family: `review`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-22-01 | Language tools | Spelling, thesaurus and optional translation |
| XL-22-02 | Comments and notes | Create, inspect, navigate, resolve and distinguish threaded discussion from notes |
| XL-22-03 | Accessibility | Inspect names, contrast, reading order and object alternatives |
| XL-22-04 | Workbook protection | Sheet restrictions, workbook structure and file-level protection are separate |
| XL-22-05 | Review history | Inspect supported change history and compare versions |

Acceptance requirement: Local review works without an account. Translation/cloud comments are optional integrations. Protection capabilities and cryptographic limits must be described precisely.

References: [Microsoft: Explore Excel with a screen reader](https://support.microsoft.com/en-gb/office/use-a-screen-reader-to-explore-and-navigate-excel-cbf024e8-2abd-4764-b639-f24eed659a53).

### View

Evidence class: `broader_suite_inventory`. Proposed agent family: `view`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-23-01 | View modes | Normal, page layout and page-break preview |
| XL-23-02 | Visibility | Gridlines, headings, formula bar and other workspace elements |
| XL-23-03 | Zoom | Continuous zoom, presets and selection-based zoom |
| XL-23-04 | Freeze and split | Freeze configured rows/columns, split panes and unfreeze |
| XL-23-05 | Multiple windows | Arrange, compare side by side and supported synchronized navigation |
| XL-23-06 | Saved views | Persist useful filters, layout and view configuration |
| XL-23-07 | Status summaries | Count, numeric count, sum, average, minimum and maximum for a selection |

Acceptance requirement: View changes do not modify cell values. Expose visible bounds, filters and frozen ranges to agents so human context can be understood without taking a screenshot.

References: [Microsoft: Explore Excel with a screen reader](https://support.microsoft.com/en-gb/office/use-a-screen-reader-to-explore-and-navigate-excel-cbf024e8-2abd-4764-b639-f24eed659a53), [Microsoft: Excel keyboard shortcuts](https://support.microsoft.com/en-us/office/keyboard-shortcuts-in-excel-1798d9d5-842a-42b8-9c99-9b7213f0040f).

### File, recovery and interoperability

Evidence class: `broader_suite_inventory`. Proposed agent family: `files`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-24-01 | File lifecycle | New, templates, open, recent, save, save-as and close |
| XL-24-02 | Formats | XLSX and supported CSV/text/ODS/PDF/legacy or macro formats with explicit fidelity levels |
| XL-24-03 | Metadata | Properties, authoring metadata and document inspection |
| XL-24-04 | Recovery | Autosave, version history, crash recovery and conflict handling |
| XL-24-05 | Options | Locale, defaults, calculation settings and accessibility preferences |
| XL-24-06 | Sharing/export | Local copies and optional configured collaboration providers |

Acceptance requirement: Round-trip fixtures cover data, formulas, types, formats, objects and metadata independently. Unsupported content yields a loss report. Recovery restores a complete consistent document rather than only visible values.

References: [Microsoft: Explore Excel with a screen reader](https://support.microsoft.com/en-gb/office/use-a-screen-reader-to-explore-and-navigate-excel-cbf024e8-2abd-4764-b639-f24eed659a53).

### Extensions and automation

Evidence class: `broader_suite_inventory`. Proposed agent family: `extensions`.

| ID | Capability | Required variants |
| --- | --- | --- |
| XL-25-01 | Local agent API | Schema discovery, commands, event subscriptions and structured results |
| XL-25-02 | Macros/scripts | Record or execute supported automation in a bounded local environment |
| XL-25-03 | Custom functions | Register names, signatures, permissions and calculation behavior |
| XL-25-04 | Extension management | Inspect, enable, disable, update and remove extensions |
| XL-25-05 | Developer workflows | Debugging, script logs, diagnostics and reproducible automation |
| XL-25-06 | Optional services | Cloud AI, online sharing and remote connectors are separate from the offline core |

Acceptance requirement: Never interpret imported macros as authorization to run code. Extension installation and execution declare permissions. The offline core must remain usable with every optional service disconnected.

References: [Microsoft: Explore Excel with a screen reader](https://support.microsoft.com/en-gb/office/use-a-screen-reader-to-explore-and-navigate-excel-cbf024e8-2abd-4764-b639-f24eed659a53).

## Shared human and agent contract

Every feature needs a stable target (file, sheet, range, table or object), an inspectable representation, validated arguments, identical engine semantics and structured results. A visual control alone is not completion. Proposed families in this document are not existing API names.

1. Discovery declares supported operations, formats, function variants, limits and unavailable optional services.
2. Reads distinguish raw values, formulas, evaluated values, number formats and rendered appearance. Large reads support paging.
3. Mutations accept an expected revision and idempotency key, produce an affected-object diff, and support dry-run previews.
4. Multi-object changes commit atomically and provide undo or recovery. UI and agent changes enter the same history.
5. Formula dependencies, validation, protection, filter state and hidden-row behavior are enforced by the shared engine.
6. Long calculations/imports expose progress, cancellation, resource limits and deterministic partial-failure handling.
7. Tools work without a window, pointer, clipboard or cloud account. Human workflows remain discoverable with menus, keyboard navigation and accessible labels.
8. Cloud features remain optional; disconnected capability discovery clearly identifies unavailable services.

## Behavior tests that decide whether a feature exists

| Workflow | Required proof |
| --- | --- |
| Finance | Currency/percentage display preserves precision; copy/fill preserves relative and absolute references; record sorting retains row relationships. |
| Analyst | Filtered data, pivot/chart sources, validation and refresh semantics agree between UI and agent reads. |
| Everyday user | Commands are discoverable; occupied destinations and merge losses are clear; undo restores the whole operation. |
| Keyboard and assistive-technology user | Focus, range selection, dialogs, mixed formatting and errors are perceivable and operable without a pointer. |
| Agent | Discover, inspect, preview, edit, export and reopen the same artifact using structured commands; stale revisions fail without loss. |
| Interoperability user | Open/export/reopen preserves supported content; unsupported content has an explicit fidelity report. |
| Large-workbook user | Publish measured latency/memory and cancellation behavior using stated dimensions, formula graph and hardware. |

## Implementation order

1. Finish the Home foundation: clipboard semantics, formatting/borders/alignment, reference-safe structure changes, fill, sort, filter and search.
2. Implement semantic tables, validation and conditional rules with common UI/agent data models.
3. Add chart/pivot objects, query transformations and dependable printing.
4. Expand calculation/function compatibility with a per-function versioned fixture catalog.
5. Complete review, accessibility, automation, recovery and interchange coverage across those objects.

Full Microsoft Office coverage also needs separate inventories for the document, presentation, notebook, mail/calendar, database, publishing, diagramming and project-planning apps. This workbook inventory does not stand in for those.
