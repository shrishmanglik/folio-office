# Roadmap

Statuses describe current coverage, not promised dates.

1. **Spreadsheet usability and depth:** inspect local Excel workflows; range selection, range formatting/copy/clear and selection summaries are implemented; next add sorting, fill, sheet management, charts, pivots, validation, conditional formatting and print controls. Verify novice, finance, analyst, keyboard-only and agent tasks with synthetic workbooks. Current basic controls do not meet this goal.
2. **Permissive spreadsheet calculation:** MIT parser adapter replaces HyperFormula with existing regression coverage. Extend reference, date, financial and large-workbook comparison fixtures; resolve the legacy buffers dependency license before binary license clearance.
3. **Shared human/agent behavior:** unify presentation conversion and extend semantic commands so each feature is callable, inspectable and recoverable.
4. **Advanced core editors:** document review/layout, spreadsheet analysis, presentation import/masters and richer notebook blocks.
5. **Remaining suite:** local mail/calendar, database/forms, publishing, diagramming and project planning.
6. **Release readiness:** larger native role-based acceptance, accessibility testing, clean-machine installation, dependency/security review and signed distributions.

An Excel feature inventory is a compatibility target, not evidence that those features already work here. Preserve data and disclose unsupported conversions.

Detailed spreadsheet specification: [Excel capability distillation](EXCEL-CAPABILITY-DISTILLATION.md), with 165 catalog entries and a [machine-readable catalog](EXCEL-CAPABILITY-CATALOG.json). These entries define required behavior and paired human/agent acceptance; they are not implementation-completion claims.
