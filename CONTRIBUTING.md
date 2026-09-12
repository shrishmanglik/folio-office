# Contributing to Folio Office

Welcome. Useful contributions improve an actual writing, analysis, presentation, notebook or agent workflow.

## Set up

Use Node.js 22, run `npm ci`, then `npm run build` and `npm start`. Use `npm run dev` for the browser UI. Run `npm test` and `npm run build` before opening a pull request. Windows is currently the verified desktop platform; mark other platform testing explicitly.

## Make a change

1. Open an issue for substantial changes so scope and compatibility are clear.
2. Create a focused branch and explain the user problem in the PR.
3. Keep human and agent behavior aligned through the shared engine. Add a meaningful regression test for data, conversion or calculation changes.
4. Include before/after screenshots for UI work with synthetic data, and actual validation results. Never publish personal files, tokens, workspace backups or machine-specific logs.
5. Describe known fidelity loss and migration implications. Do not claim full Office compatibility from a small fixture.

Use descriptive commits. A maintainer should merge through a pull request with a clear summary and testing section. The merge-summary workflow records the PR and merge commit automatically; direct pushes do not create PR comments. Generated release notes group changes by labels.

Original contributions are submitted under Apache-2.0. Do not add third-party code without preserving its license and notices. Use the third-party inventory to identify unresolved dependency licensing before distributing binaries.
