# Headless file fidelity

`core/formats.cjs` exposes async `exportFile(file, format, outputPath)` and `importFile(inputPath, kind?, name?)`. These functions use local Node libraries and do not require an editor, browser, network, or external executable. The caller is responsible for authorizing input and output paths. Exports create files exclusively and reject existing output with `OUTPUT_EXISTS`. Unsupported conversions reject with `INVALID_FORMAT`; malformed structured input uses `INVALID_INPUT`. Successful exports return path, format, byte count, SHA-256 and warnings. Imports return name, kind, data and warnings. Neither function updates the library workspace.

| Format | Export | Import | Fidelity |
| --- | --- | --- | --- |
| JSON | All four kinds | All four kinds | Exact JSON data, name and kind. Workspace IDs and timestamps are intentionally outside this interchange envelope. |
| DOCX | Document | Document, notebook | Export: paragraph text, basic bold/italic/strike/underline marks, headings and basic tables. Lists, tables, basic marks and embedded PNG/JPEG images are supported by shared conversion. Advanced layout, fields and review data remain unsupported. |
| TXT | Document, notebook | Document, notebook | Plain text. Notebook export includes page titles; importing creates one page. |
| Markdown | Document, notebook | Document, notebook | Text only, not a rich Markdown converter. Import retains literal Markdown syntax. |
| HTML | Document | Document, notebook | Shared semantic HTML import/export retains supported headings, marks, lists, tables and images. Scripts and unsafe content are removed. |
| CSV | Active spreadsheet sheet | Spreadsheet | Quoted fields, embedded line breaks, escaped quotes and empty fields. All imported fields remain strings. Formulas remain raw strings. Other sheets and workbook metadata are lost. |
| XLSX | Spreadsheet | Spreadsheet | Cell values and formula expressions. Canonical numeric strings with up to 15 digits export as numbers; other strings stay text. Imported cells use strings to match the editor data model. Export computes supported cached formulas using the shared formula adapter and requests recalculation. Import reduces dates to ISO text and rich values to text. Basic font, fill, alignment and number formats are retained. Merged cells, charts and advanced workbook features are omitted. |
| PPTX | Presentation | Unsupported | Text, columns, notes, embedded PNG/JPEG/GIF and theme background. Layout and typography are approximate; no animation support. |

PDF, legacy binary Office files, PPTX import, arbitrary image URLs and unlisted kind/format combinations are unsupported. These adapters do not claim full Office fidelity. Keep JSON or the workspace backup when preservation matters. Returned warnings describe known loss; they do not certify every field survived. CSV content is exported verbatim, including leading formula characters, so spreadsheet software may interpret it when opened.

Run `node --test tests/formats.test.cjs` for actual DOCX readback, XLSX formula/value readback, CSV edge cases, PPTX XML slide/notes inspection, all-kind JSON roundtrips, unsupported-format checks and overwrite protection.
