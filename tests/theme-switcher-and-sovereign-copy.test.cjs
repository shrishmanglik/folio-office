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
