Calculator, receipt, continuation and library surfaces retained fixed light backgrounds and green text after a dark-theme switch. Final-cascade rules now use the existing theme tokens for their grounds, text, borders, controls and interactive states. Specific rules also fix card-figure and receipt-paragraph overrides. Ink/canvas button pairs preserve readable small text in the paper theme.

Validation: all 61 tests and the production build passed. The production build passed 16 theme/viewport checks using the RTX 5060 renderer. Vite retains its bundle-size warning. No colour or type literal was added to the parity CSS and no tracked source or test code contains a literal em dash.

## Learnings landed

The requested regression in `tests/theme-switcher-and-sovereign-copy.test.cjs` pins all four palettes, the requested surfaces, specificity-sensitive text and interactive states. A second test requires the palette text pairs to reach WCAG AA. Red cases preceded each CSS fix; the final focused suite passed twice.

## Review request

Lane 10 independent reviewer: reproduce the checks at this exact head and review the changed source and committed evidence. Review, merge, deployment and production readback remain with the separate reviewer session. Author evidence, the corrected check setup and limitations: `evidence/wave5-4theme-parity-20261021/RESULT.md`.
