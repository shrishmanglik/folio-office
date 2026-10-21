# Wave 5 four-theme parity

Author evidence, 2026-10-21. Independent review and deployment are pending.

The calculator section, cards, privacy comparator, receipts, presets, copy buttons, continuation cards and previews, empty library, search and sort controls now use the existing surface, canvas, ink, muted, line and accent tokens. Specific selectors override the old card-figure and receipt-paragraph colours. Layout and palette values are unchanged.

Selected presets and copy buttons use ink and canvas for readable text. Accent remains on borders and focus states because the paper accent is below 4.5:1 when paired with the light grounds for small text. Hover, focus, placeholders and option menus retain theme parity. The tests pin all four palettes and require the actual text pairs to reach 4.5:1.

Validation:

| Command | Result |
| --- | --- |
| `node --test tests/theme-switcher-and-sovereign-copy.test.cjs`, before the CSS fix | 5 passed, 1 failed because the parity block was absent |
| Follow-up red cases | Failed on the missing comparator background and unsafe accent text before each respective fix |
| Final focused test, two runs | 7 passed, 0 failed each |
| `npm test` | 61 passed, 0 failed |
| `npm run build` | Passed |
| Production-build browser checks | 16 passed: four themes at 1920, 1440, 1280 and 390 pixels |
| `git diff --check` | Passed |

Vite reports its existing bundle-size warning. No limit was changed. No colour or font-size literal was added to the parity CSS. No tracked source or test code contains a literal em dash.

The first full-check wrapper started after a separate slot request was refused and then mishandled Vite stderr. That attempt is not the qualification receipt. The final full tests and build ran sequentially under the already acquired normal `lane10-wave5` slot, with memory checked before each command. A build launch was paused below 2 GB and started only after the floor recovered. The final `build.log` records exit 0 and the completed Vite output.

The browser report confirms the NVIDIA RTX 5060 D3D11 renderer. Theme changes were made through the actual switcher. Computed backgrounds and text were checked on the built page, followed by painted captures. `theme-contact-sheet.jpg` shows void, paper, contrast and daltonic in reading order. Continuation surfaces are pinned by source regression; the fresh browser workspace had no existing file. This is author verification, not an independent taste verdict.

The browser and loopback server closed after verification. External page requests were blocked. File hashes are recorded in `source-hashes.json`; full command output is in the adjacent logs. The reproducible browser driver is committed in Thread Intelligence at `evidence/wave5-4theme-parity-20261021/verify-themes.mjs` and accepts `folio-office` as its product argument.

The code and regression tests are the durable capture. No new operating doctrine or memory was needed for this scoped repair. Lane 10 owns independent review, merge and any separately authorized deployment.
