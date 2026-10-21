const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const srcDir = path.join(__dirname, '../src');

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
