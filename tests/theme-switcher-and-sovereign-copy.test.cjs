const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const srcDir = path.join(__dirname, '../src');

const readThemeParityBlock = () => {
  const themeCss = fs.readFileSync(path.join(srcDir, 'Theme.css'), 'utf8');
  const marker = '/* Four-theme workspace parity */';
  const markerIndex = themeCss.indexOf(marker);
  assert.notEqual(markerIndex, -1, 'Theme.css must include the four-theme workspace parity block');
  return { themeCss, parityCss: themeCss.slice(markerIndex + marker.length) };
};

const assertRuleUses = (css, selector, declarations) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `Expected a theme parity rule for ${selector}`);
  for (const declaration of declarations) {
    assert.match(match[1], declaration, `Expected ${selector} to use ${declaration}`);
  }
};

const contrastRatio = (foreground, background) => {
  const luminance = (hex) => {
    const channels = hex.slice(1).match(/.{2}/g).map((channel) => {
      const value = Number.parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
};

test('Folio Office includes 44x44px top-right icon-only 4-theme switcher and 4 reading atmospheres', () => {
  const appTsx = fs.readFileSync(path.join(srcDir, 'App.tsx'), 'utf8');
  const workspaceTsx = fs.readFileSync(path.join(srcDir, 'Workspace.tsx'), 'utf8');
  const themeCss = fs.readFileSync(path.join(srcDir, 'Theme.css'), 'utf8');
  const switcherPath = path.join(srcDir, 'CanvasThemeSwitcher.tsx');
  assert.ok(fs.existsSync(switcherPath), 'CanvasThemeSwitcher.tsx must exist');
  const switcherTsx = fs.readFileSync(switcherPath, 'utf8');

  assert.match(switcherTsx, /data-testid="canvas-theme-switcher"/);
  assert.match(switcherTsx, /44px/);
  for (const themeId of ['void', 'paper', 'contrast', 'daltonic']) {
    assert.match(switcherTsx, new RegExp(`id:\\s*'${themeId}'`));
    assert.match(themeCss, new RegExp(`:root\\[data-theme="${themeId}"\\]`));
  }

  // Verify Warm Archival Paper (#FAF5EE / #C84B31), Obsidian Dark (#0A0A0E), High Contrast (#000000 / #FFE600), Maritime Sapphire (#06162E / #56B4E9 / #D55E00)
  for (const hex of ['#0A0A0E', '#FAF5EE', '#C84B31', '#000000', '#FFE600', '#06162E', '#56B4E9', '#D55E00']) {
    assert.ok(
      themeCss.toUpperCase().includes(hex) || switcherTsx.toUpperCase().includes(hex),
      `Expected theme token ${hex} in Theme.css or CanvasThemeSwitcher.tsx`
    );
  }

  assert.match(appTsx, /CanvasThemeSwitcher/);
  assert.match( appTsx + '\n' + workspaceTsx, /100% Yours on Your Machine/);
  assert.match(workspaceTsx, /Generate Client Audit Dossier/);
});

test('all four themes tokenise calculator, continuation, and library surfaces with interactive states', () => {
  const { themeCss, parityCss } = readThemeParityBlock();

  for (const themeId of ['void', 'paper', 'contrast', 'daltonic']) {
    const themeMatch = themeCss.match(new RegExp(`:root\\[data-theme="${themeId}"\\]\\s*\\{([^}]*)\\}`));
    assert.ok(themeMatch, `Expected ${themeId} theme variables`);
    for (const token of ['surface', 'canvas', 'ink', 'muted', 'line', 'accent']) {
      assert.match(themeMatch[1], new RegExp(`--${token}\\s*:`), `Expected --${token} in ${themeId}`);
    }
  }

  assert.doesNotMatch(parityCss, /#[0-9a-f]{3,8}|rgba?\(|hsla?\(/i, 'Parity rules must not add colour literals');

  const surfaceRules = [
    '.sovereign-calculator-section',
    '.continue-card',
    '.library-empty',
    '.library-tools select',
  ];
  for (const selector of surfaceRules) {
    assertRuleUses(parityCss, selector, [/background:\s*var\(--surface\)/, /border-color:\s*var\(--line\)/, /color:\s*var\(--ink\)/]);
  }

  assertRuleUses(parityCss, '.sovereign-calc-card', [/background:\s*var\(--canvas\)/, /border-color:\s*var\(--line\)/, /color:\s*var\(--ink\)/]);
  assertRuleUses(parityCss, '.library-search', [/background:\s*var\(--surface\)/, /border-color:\s*var\(--line\)/, /color:\s*var\(--muted\)/]);
  assertRuleUses(parityCss, '.sovereign-privacy-comparator', [/background:\s*var\(--surface\)/, /border-color:\s*var\(--line\)/, /color:\s*var\(--ink\)/]);
  for (const figureSelector of [
    '.cloud-tax-card .calc-card-figure',
    '.folio-local-card .calc-card-figure',
    '.net-savings-card .calc-card-figure',
  ]) {
    assertRuleUses(parityCss, figureSelector, [/color:\s*var\(--ink\)/]);
  }
  assertRuleUses(parityCss, '.sovereign-calc-card .sovereign-receipt-preview', [/background:\s*var\(--canvas\)/, /border-color:\s*var\(--line\)/, /color:\s*var\(--ink\)/]);
  assertRuleUses(parityCss, '.continue-preview', [/background:\s*var\(--canvas\)/, /color:\s*var\(--muted\)/]);

  assertRuleUses(parityCss, '.sovereign-calculator-presets button', [/background:\s*var\(--surface\)/, /border-color:\s*var\(--line\)/, /color:\s*var\(--ink\)/]);
  assertRuleUses(parityCss, '.sovereign-calculator-presets button:hover', [/border-color:\s*var\(--accent\)/, /color:\s*var\(--ink\)/]);
  assertRuleUses(parityCss, '.sovereign-calculator-presets button.selected', [/background:\s*var\(--ink\)/, /border-color:\s*var\(--accent\)/, /color:\s*var\(--canvas\)/]);
  assertRuleUses(parityCss, '.copy-sovereign-receipt-button', [/background:\s*var\(--ink\)/, /border-color:\s*var\(--accent\)/, /color:\s*var\(--canvas\)/]);
  assertRuleUses(parityCss, '.copy-sovereign-receipt-button:hover', [/background:\s*var\(--canvas\)/, /border-color:\s*var\(--accent\)/, /color:\s*var\(--ink\)/]);
  assertRuleUses(parityCss, '.library-empty button', [/color:\s*var\(--ink\)/]);
  assertRuleUses(parityCss, '.sovereign-calculator-header .workspace-eyebrow', [/color:\s*var\(--muted\)/]);
  assertRuleUses(parityCss, '.library-search:focus-within', [/border-color:\s*var\(--accent\)/]);
  assertRuleUses(parityCss, '.library-search input', [/background:\s*transparent/, /color:\s*var\(--ink\)/]);
  assertRuleUses(parityCss, '.library-search input::placeholder', [/color:\s*var\(--muted\)/]);
  assertRuleUses(parityCss, '.library-tools select:focus-visible', [/outline-color:\s*var\(--accent\)/]);
});

test('all four theme palettes keep workspace text pairs at WCAG AA contrast', () => {
  const themeCss = fs.readFileSync(path.join(srcDir, 'Theme.css'), 'utf8');
  const textPairs = [
    ['ink', 'canvas'],
    ['ink', 'surface'],
    ['muted', 'canvas'],
    ['muted', 'surface'],
  ];

  for (const themeId of ['void', 'paper', 'contrast', 'daltonic']) {
    const themeMatch = themeCss.match(new RegExp(`:root\\[data-theme="${themeId}"\\]\\s*\\{([^}]*)\\}`));
    assert.ok(themeMatch, `Expected ${themeId} theme variables`);
    const palette = Object.fromEntries(
      [...themeMatch[1].matchAll(/--(surface|canvas|ink|muted):\s*(#[0-9a-f]{6})/gi)]
        .map((match) => [match[1].toLowerCase(), match[2]]),
    );

    for (const [foreground, background] of textPairs) {
      const ratio = contrastRatio(palette[foreground], palette[background]);
      assert.ok(
        ratio >= 4.5,
        `${themeId} ${foreground} on ${background} must be at least 4.5:1, received ${ratio.toFixed(2)}:1`,
      );
    }
  }
});

test('Folio Office includes interactive 5-Year SaaS Subscription vs Sovereign Local Office Calculator', () => {
  const workspaceTsx = fs.readFileSync(path.join(srcDir, 'Workspace.tsx'), 'utf8');
  const calcPath = path.join(srcDir, 'SovereignOfficeSavingsCalculator.tsx');
  assert.ok(fs.existsSync(calcPath), 'SovereignOfficeSavingsCalculator.tsx must exist');
  const calcTsx = fs.readFileSync(calcPath, 'utf8');

  assert.match(workspaceTsx, /SovereignOfficeSavingsCalculator/);
  assert.match(calcTsx, /data-testid="sovereign-office-savings-calculator"/);
  for (const presetLabel of ['1 Solo Founder', '5-Person Studio', '15-Person Boutique Agency']) {
    assert.ok(calcTsx.includes(presetLabel), `Expected calculator preset "${presetLabel}"`);
  }
  assert.ok(
    calcTsx.includes('Folio Office ($0/mo Recurring · 100% Local on Your Machine)'),
    'Expected Folio Office ($0/mo Recurring · 100% Local on Your Machine) comparison label',
  );
});

test('Folio Office includes 3-Second Cloud Docs Telemetry vs Air-Gapped Local Vault Privacy Comparator and 1-Click Copy Sovereign Office Verification Receipt', () => {
  const appModulePath = path.join(srcDir, 'app', 'folio-office-app.ts');
  const shellTemplatePath = path.join(srcDir, 'ui', 'shell-template.ts');
  const calcPath = path.join(srcDir, 'SovereignOfficeSavingsCalculator.tsx');

  assert.ok(fs.existsSync(appModulePath), 'src/app/folio-office-app.ts must exist');
  assert.ok(fs.existsSync(shellTemplatePath), 'src/ui/shell-template.ts must exist');

  const appModuleTs = fs.readFileSync(appModulePath, 'utf8');
  const shellTemplateTs = fs.readFileSync(shellTemplatePath, 'utf8');
  const calcTsx = fs.readFileSync(calcPath, 'utf8');

  assert.match(shellTemplateTs, /data-testid="folio-privacy-comparator"/);
  assert.match(shellTemplateTs, /data-testid="copy-sovereign-office-receipt-btn"/);
  assert.match(calcTsx, /data-testid="folio-privacy-comparator"/);
  assert.match(calcTsx, /data-testid="copy-sovereign-office-receipt-btn"/);
  assert.match(appModuleTs, /copySovereignOfficeVerificationReceipt/);

  for (const docType of [
    'M&A Term Sheet & Cap Table (.xlsx + .docx)',
    'Litigation & Client Contract Dossier (.docx)',
    'Board Strategy Deck (.pptx)',
  ]) {
    assert.ok(shellTemplateTs.includes(docType), `Expected confidential document type "${docType}" in shell-template.ts`);
  }
});

test('Folio Office exposes the native preset and sovereign command workspace contracts', () => {
  const suitePath = path.join(srcDir, 'FolioSovereignCommandSuite.tsx');
  assert.ok(fs.existsSync(suitePath), 'FolioSovereignCommandSuite.tsx must exist');
  const suite = fs.readFileSync(suitePath, 'utf8');
  const workspace = fs.readFileSync(path.join(srcDir, 'Workspace.tsx'), 'utf8');
  const appModule = fs.readFileSync(path.join(srcDir, 'app', 'folio-office-app.ts'), 'utf8');

  assert.match(workspace, /FolioSovereignCommandSuite/);
  assert.match(appModule, /FOLIO_NATIVE_PRESETS/);
  assert.match(appModule, /FOLIO_COMMAND_WORKSPACES/);
  assert.match(suite, /data-testid="folio-tri-surface-bar"/);
  assert.match(suite, /data-testid="folio-command-suite"/);
  assert.match(suite, /onKeyDown/);
  assert.match(suite, /buildFolioPresetReceipt/);
  assert.match(suite, /buildFolioNativeArtifact/);
  assert.match(suite, /calculateFolioPresetResult/);
  assert.doesNotMatch(suite, /querySelectorAll|\.click\(\)/, 'Native actions must use Workspace callbacks');
  const presets = {
    'saas-p-and-l': 'SaaS P&L & Cash-Flow Grid',
    'msa-sow-contract': 'Master Services Agreement & SOW',
    'series-a-board-deck': 'Executive Board & Investor Deck',
    'agency-retainer-audit': 'Client Retainer & Margin Audit',
    'ontario-tax-ledger': 'Canadian Corp Tax & HST Ledger',
    'ip-clean-room-dossier': 'Clean-Room IP & SHA-256 Dossier',
  };
  for (const [id, label] of Object.entries(presets)) {
    assert.ok(suite.includes(id), `Expected native preset ${id}`);
    assert.ok(suite.includes(label), `Expected native preset label ${label}`);
    assert.match(suite, /folio-native-preset-/);
  }
  const workspaces = {
    'document-studio': '1. Sovereign Document & Contract Editor',
    'financial-grid': '2. Deterministic Financial Grid & Formula Auditor',
    'deck-builder': '3. Executive Deck & Board Brief Builder',
    'cryptographic-export': '4. Air-Gapped Vault & Multi-Format Cryptographic Export',
  };
  for (const [id, label] of Object.entries(workspaces)) {
    assert.ok(suite.includes(id), `Expected command workspace ${id}`);
    assert.ok(suite.includes(label), `Expected command workspace label ${label}`);
    assert.match(suite, /folio-workspace-tab-/);
  }
  for (const calculation of ['24000-8400', '2-0', '12*18000', '(12000-7200)/12000', '10000*.13']) {
    assert.ok(suite.includes(calculation), `Expected deterministic preset calculation ${calculation}`);
  }
  for (const nativeShape of ["workspace.kind==='spreadsheet'", "workspace.kind==='presentation'", 'data:{html:']) {
    assert.ok(suite.includes(nativeShape), `Expected native artifact shape ${nativeShape}`);
  }
  assert.match(suite, /file\.kind===workspace\.kind&&file\.name===preset\.label/);
  assert.match(workspace, /files=\{p\.files\} ready=\{p\.ready\} onCreate=\{p\.onCreate\} onOpen=\{p\.onOpen\}/);
});

test('native presets create complete editor data and calculated receipts in every workspace', () => {
  assert.match(fs.readFileSync(path.join(srcDir, 'app', 'folio-office-app.ts'), 'utf8'), /default as FolioSovereignCommandSuite/);
  const typescript = require('typescript');
  const Module = require('node:module');
  const filename = path.join(srcDir, 'FolioSovereignCommandSuite.tsx');
  const compiled = typescript.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: typescript.ModuleKind.CommonJS, jsx: typescript.JsxEmit.ReactJSX },
  });
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(compiled.outputText, filename);
  const suite = loaded.exports;
  assert.deepEqual(suite.FOLIO_NATIVE_PRESETS.map(preset => suite.calculateFolioPresetResult(preset.id)), [15600, 2, 216000, 0.4, 1300, 0]);
  for (const preset of suite.FOLIO_NATIVE_PRESETS) {
    for (const workspace of suite.FOLIO_COMMAND_WORKSPACES) {
      const artifact = suite.buildFolioNativeArtifact(preset.id, workspace.id);
      const receipt = suite.buildFolioPresetReceipt(preset.id, workspace.id);
      assert.equal(artifact.kind, workspace.kind);
      assert.equal(artifact.name, preset.label);
      assert.ok(receipt.includes(suite.formatFolioPresetResult(preset.id)));
      assert.ok(receipt.includes(workspace.label));
      assert.match(receipt, /Digest: not calculated/);
      if (artifact.kind === 'presentation') {
        assert.equal(artifact.data.theme, 'editorial');
        assert.equal(artifact.data.slides[0].layout, 'content');
        for (const key of ['title', 'body', 'right', 'notes']) assert.equal(typeof artifact.data.slides[0][key], 'string', key);
      } else if (artifact.kind === 'spreadsheet') {
        assert.equal(artifact.data.activeSheet, artifact.data.sheets[0].id);
        assert.equal(artifact.data.sheets[0].cells[2][1], suite.getFolioSpreadsheetFormula(preset.id));
      } else {
        assert.ok(artifact.data.html.includes(preset.label));
        assert.ok(artifact.data.html.includes(suite.formatFolioPresetResult(preset.id)));
      }
    }
  }
});

test('sovereign command suite uses semantic theme tokens and phone-contained horizontal tabs', () => {
  const workspaceCss = fs.readFileSync(path.join(srcDir, 'Workspace.css'), 'utf8');
  const themeCss = fs.readFileSync(path.join(srcDir, 'Theme.css'), 'utf8');
  const commandCss = `${workspaceCss}\n${themeCss}`;
  assert.match(commandCss, /\.folio-command-suite/);
  for (const token of ['surface', 'canvas', 'ink', 'muted', 'line', 'accent']) {
    assert.match(commandCss, new RegExp(`var\\(--${token}\\)`), `Expected command suite to use --${token}`);
  }
  assert.match(commandCss, /\.folio-workspace-tabs[^}]*overflow-x:\s*auto/s);
  assert.match(commandCss, /@media\(max-width:390px\)/);
  assert.match(themeCss, /@media\s*\(max-width:\s*800px\)[\s\S]*?\.office-app\s*\{\s*min-width:\s*0/);
  assert.match(themeCss, /\.sovereign-receipt-preview\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(themeCss, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+44px/);
  const suiteCss = workspaceCss.slice(workspaceCss.indexOf('.folio-command-suite{'), workspaceCss.indexOf('.sovereign-calculator-section{'));
  assert.doesNotMatch(suiteCss, /#[\da-f]{3,8}\b|rgba?\(|hsla?\(/i);
  for (const match of suiteCss.matchAll(/font-size:(\d+)px/g)) {
    assert.ok(Number(match[1]) >= 12, 'New command-suite text must reach the 12px product-screen floor');
  }
});

test('Folio Office includes 3-Second Multi-Format Sovereign Export & Formula Audit Verifier and 1-Click Copy Client Deliverable Manifest', () => {
  const appModuleTs = fs.readFileSync(path.join(srcDir, 'app', 'folio-office-app.ts'), 'utf8');
  const shellTemplateTs = fs.readFileSync(path.join(srcDir, 'ui', 'shell-template.ts'), 'utf8');
  const calcTsx = fs.readFileSync(path.join(srcDir, 'SovereignOfficeSavingsCalculator.tsx'), 'utf8');

  assert.match(shellTemplateTs, /data-testid="folio-export-verifier"/);
  assert.match(shellTemplateTs, /data-testid="copy-deliverable-manifest-btn"/);
  assert.match(calcTsx, /data-testid="folio-export-verifier"/);
  assert.match(calcTsx, /data-testid="copy-deliverable-manifest-btn"/);
  assert.match(calcTsx, /Copied Deliverable Manifest/);
  assert.match(appModuleTs, /copyClientDeliverableManifest/);

  for (const exportPreset of [
    '.docx Executive Contract Brief',
    '.xlsx Deterministic Financial Waterfall (0 Formula Errors)',
    '.pptx Board Architecture Deck',
  ]) {
    assert.ok(shellTemplateTs.includes(exportPreset), `Expected export preset "${exportPreset}" in shell-template.ts`);
  }
});

test('Zero em dashes anywhere in Folio Office UI source', () => {
  const scan = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) scan(p);
      else if (/\.(tsx?|css)$/.test(p)) {
        const text = fs.readFileSync(p, 'utf8');
        assert.doesNotMatch(text, /\u2014/, `Em dash found in ${p}`);
      }
    }
  };
  scan(srcDir);
});

test('Folio Office ownership hub is interactive and stays inside the source-only release boundary', () => {
  const contractPath = path.join(__dirname, '../desktop/distribution-contract.json');
  assert.ok(fs.existsSync(contractPath), 'desktop/distribution-contract.json must exist');
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  assert.equal(contract.product, 'Folio Office');
  assert.equal(contract.contract_version, '2026-10-21');
  assert.equal(contract.status, 'source_contract_not_release_artifact');
  assert.equal(contract.shared_brain.frontend, 'src');
  assert.equal(contract.shared_brain.calculation_engine, 'src/app/folio-office-app.ts');
  assert.equal(contract.shared_brain.no_backend_fork, true);
  assert.equal(contract.shared_brain.local_llm_loopback, 'http://127.0.0.1:11434');
  assert.equal(contract.shared_brain.fact_sheet_budget_bytes, 3072);
  assert.match(contract.shared_brain.rule, /deterministic engine only/i);
  assert.match(contract.shared_brain.rule, /AI interpretation only/i);
  assert.deepEqual(contract.distribution_channels.map((channel) => channel.id), [
    'web_subscription',
    'windows_desktop',
    'macos_desktop',
    'mobile_companion',
  ]);
  const windows = contract.distribution_channels.find((channel) => channel.id === 'windows_desktop');
  assert.equal(windows.status, 'source_present_release_not_signed');
  assert.match(windows.runtime, /Electron source present/i);
  assert.match(windows.runtime, /Tauri v2 installer and key ring in preparation/i);
  assert.equal(contract.license_boundary.term, 'perpetual_major_version');
  assert.equal(contract.license_boundary.monthly_local_cap, null);
  assert.equal(contract.license_boundary.public_numeric_price, null);
  assert.equal(contract.license_boundary.released_license_key, false);
  assert.equal(contract.installers, undefined);

  const shellTemplateTs = fs.readFileSync(path.join(srcDir, 'ui', 'shell-template.ts'), 'utf8');
  const calcTsx = fs.readFileSync(path.join(srcDir, 'SovereignOfficeSavingsCalculator.tsx'), 'utf8');

  for (const testId of [
    'ownership-model-switcher',
    'desktop-download-hub',
    'local-llm-hardware-selector',
    'offline-parity-table',
  ]) {
    assert.match(shellTemplateTs, new RegExp(`data-testid="${testId}"`), `Expected ${testId} in shell-template.ts`);
    assert.match(calcTsx, new RegExp(`data-testid="${testId}"`), `Expected ${testId} in SovereignOfficeSavingsCalculator.tsx`);
  }

  for (const modelTag of ['llama3.2:3b', 'qwen2.5:7b', 'qwen2.5:14b', 'deepseek-r1:8b', '127.0.0.1:11434']) {
    assert.ok(shellTemplateTs.includes(modelTag), `Expected ${modelTag} in shell-template.ts`);
  }
  for (const label of [
    'One-Time Offline Desktop Purchase (Unlimited Free Local AI)',
    'Monthly Cloud Subscription (Hosted Web & Cloud AI)',
  ]) {
    assert.ok(shellTemplateTs.includes(label), `Expected ownership label ${label}`);
  }
  assert.match(calcTsx, /className="ownership-surface"/);
  assert.match(calcTsx, /className="ownership-model-copy"/);
  assert.match(calcTsx, /aria-pressed=\{selectedOwnershipModelId === option\.id\}/);
  assert.match(calcTsx, /<select[\s\S]*data-testid="local-llm-hardware-selector"/);
  assert.match(calcTsx, /data-release-status="in-preparation"/);
  assert.match(calcTsx, /<table data-testid="offline-parity-table">/);
  assert.match(calcTsx, /<code key=\{command\}>\{command\}<\/code>/);
  assert.doesNotMatch(calcTsx, /href=.*(?:\.msi|\.exe|\.dmg)/i);

  const installerBlock = shellTemplateTs.slice(
    shellTemplateTs.indexOf('export const FOLIO_DESKTOP_INSTALLER_TARGETS'),
    shellTemplateTs.indexOf('export const FOLIO_LOCAL_LLM_HARDWARE_TIERS'),
  );
  assert.doesNotMatch(installerBlock, /[a-f0-9]{64}|\.msi|\.exe|\.dmg|href=/i);
  assert.doesNotMatch(shellTemplateTs, /\$22\/mo Cloud Seat/);
  assert.match(shellTemplateTs, /data-release-status="in-preparation"/);
  assert.match(shellTemplateTs, /proposed hosted subscription model/i);

  const typescript = require('typescript');
  const Module = require('node:module');
  const shellFilename = path.join(srcDir, 'ui', 'shell-template.ts');
  const compiled = typescript.transpileModule(shellTemplateTs, {
    compilerOptions: { module: typescript.ModuleKind.CommonJS },
  });
  const loaded = new Module(shellFilename, module);
  loaded.filename = shellFilename;
  loaded.paths = Module._nodeModulePaths(path.dirname(shellFilename));
  loaded._compile(compiled.outputText, shellFilename);
  const shell = loaded.exports;
  assert.deepEqual(
    shell.FOLIO_LOCAL_LLM_HARDWARE_TIERS.map((tier) => [tier.hardwareTier, tier.modelTag]),
    [['4-8 GB RAM', 'llama3.2:3b'], ['16 GB RAM', 'qwen2.5:7b'], ['32+ GB RAM', 'qwen2.5:14b / deepseek-r1:8b']],
  );
  assert.equal(shell.FOLIO_OFFLINE_PARITY_ROWS.length, 5);
  assert.deepEqual(shell.FOLIO_OFFLINE_PARITY_ROWS.at(-1), {
    capability: 'Cloud team sync',
    offlineDesktopStatus: 'Not available offline',
    cloudWebStatus: 'Within plan allowance',
    needsInternet: 'Yes',
  });
  const rendered = shell.renderFolioOwnershipHubShell('monthly-cloud-subscription', '32gb-plus');
  assert.match(rendered, /data-release-status="in-preparation"/);
  assert.match(rendered, /ollama run qwen2\.5:14b/);
  assert.match(rendered, /ollama run deepseek-r1:8b/);
  assert.doesNotMatch(rendered, /[a-f0-9]{64}|\.msi|\.exe|\.dmg|href=/i);
});
