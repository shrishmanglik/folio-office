# Folio Office desktop ownership upgrade

Author-side implementation receipt. Independent review is pending.

## Scope and reconciliation

The task began at PR 9 head `09c373de5c139caf31bb886444a7756763178b9c`. Another session pushed the same feature as `91e90402ec33146da61cefb38d61fedd33013af5` during implementation. The earlier isolated work was preserved in local rescue commit `45f0f36f1367a99ada0ab4e95e312f602d85422e`. PR 9 then merged during validation. The final repair uses a fresh branch from merged main `8b9feca3dbaa6cc67b6c9d4a56538c1fc83495ba`, with no force push or shared-checkout overwrite. The pre-fix and merged-main trees are identical at `90d43d5f842fb1231799c6aa27632a23979959ff`; the branch move did not change the tested source bytes.

The repair replaces unsupported installer filenames, checksum records and numeric cloud pricing with a source-only contract and explicit release requirements. Both the React UI and the existing shell renderer use the same ownership and hardware data. The runtime remains Electron source; Tauri v2 signing, the license key ring and local AI integration remain pending.

## Verification checkpoint

- The new contract test failed on the concurrent pre-fix head because the required contract version and source-only schema were absent. Receipt: `remote-reconciliation-red.log`.
- The repaired focused ownership test passed twice. Receipts: `remote-reconciliation-green-1.log` and `remote-reconciliation-green-2.log`.
- The focused theme and ownership file passed 11 tests with zero failures. Receipt: `focused-file-green.log`.
- `npm test`: exit 0, 65 passed, 0 failed, 0 skipped. Receipt: `test.log`.
- `npm run build`: exit 0, including TypeScript. Vite reports a large-bundle warning. Receipt: `build.log`.
- GPU browser verification: 16 theme/viewport combinations passed on the NVIDIA RTX 5060 D3D11 renderer. Both ownership choices, all RAM tiers, pending download status, parity boundaries, page containment and 44px ownership buttons were exercised. Receipt: `browser-checks.json`; replay with `node evidence/sovereign-desktop-20261021/verify-browser.mjs . folio-office`.
- Each combination has separate ownership, hardware and parity JPEG captures, capped at 1600 pixels wide. Painted samples were inspected. No browser or preview server was left running.

Full commands ran sequentially in the parent builder's normal heavy slot after checking the 2048 MB available-memory floor. No exclusive slot or priority change was used.

## Review boundary

Local AI costs refer only to studio server and API tokens, excluding buyer hardware, electricity and downloads. Hardware tiers are starting guidance. Unlimited local use applies to the owned major version. One-time license pricing is unpublished, and the recurring-cost comparison excludes a future acquisition price. Cloud team sync always requires internet. The pending download hub offers no installer link or checksum.

The owning independent reviewer must reproduce the checks at the final pushed head before merge or release. This receipt is not installer, license, provider or production proof.

Receipt encoding: command logs are UTF-8 display copies with line endings and trailing whitespace normalized. Matching `.raw.gz` files preserve the original command-output bytes losslessly.
