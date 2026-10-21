import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const root = path.resolve(__dirname, '../..');
const port = 44108;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
const presets = ['saas-p-and-l', 'msa-sow-contract', 'series-a-board-deck', 'agency-retainer-audit', 'ontario-tax-ledger', 'ip-clean-room-dossier'];
const workspaces = [['document-studio', 'document'], ['financial-grid', 'spreadsheet'], ['deck-builder', 'presentation'], ['cryptographic-export', 'receipt']];
const results = { interactions: [], viewports: [], errors: [], serverDiagnostics: [] };
let browser;
const ready = new Promise((resolve, reject) => {
  server.stdout.on('data', chunk => { if (chunk.toString().includes('http://127.0.0.1')) resolve(); });
  server.stderr.on('data', chunk => results.serverDiagnostics.push(chunk.toString().slice(0, 1500)));
  server.once('exit', code => reject(new Error(`Local server exited ${code}`)));
});
const timeout = setTimeout(() => server.kill(), 180000);

(async () => {
  try {
    await ready;
    browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--force-high-performance-gpu'] });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    page.on('pageerror', error => results.errors.push(error.message));
    const url = `http://127.0.0.1:${port}`;
    for (const preset of presets) {
      for (const [workspace, kind] of workspaces) {
        await page.goto(url, { waitUntil: 'networkidle' });
        const suite = page.getByTestId('folio-command-suite');
        await suite.waitFor();
        await page.getByTestId(`folio-native-preset-${preset}`).click();
        const name = await page.getByTestId(`folio-native-preset-${preset}`).innerText();
        await page.getByTestId(`folio-workspace-tab-${workspace}`).click();
        await suite.getByRole('tabpanel').getByRole('button').click();
        if (kind === 'receipt') {
          await suite.getByRole('status').waitFor();
          const receipt = await page.evaluate(() => navigator.clipboard.readText());
          assert.ok(receipt.includes(name));
          assert.match(receipt, /Digest: not calculated/);
        } else {
          await page.waitForFunction(({ name, kind }) => JSON.parse(localStorage.getItem('office-workspace-preview') || '[]').some(file => file.name === name && file.kind === kind), { name, kind });
          const artifact = await page.evaluate(({ name, kind }) => JSON.parse(localStorage.getItem('office-workspace-preview')).find(file => file.name === name && file.kind === kind), { name, kind });
          if (kind === 'document') assert.ok(artifact.data.html.includes(name));
          if (kind === 'spreadsheet') assert.ok(artifact.data.sheets[0].cells[2][1].startsWith('='));
          if (kind === 'presentation') assert.equal(artifact.data.slides[0].layout, 'content');
        }
        results.interactions.push({ preset, workspace, kind });
      }
    }
    await page.goto(url, { waitUntil: 'networkidle' });
    const suite = page.getByTestId('folio-command-suite');
    await page.getByTestId('folio-workspace-tab-document-studio').focus();
    await page.keyboard.press('End');
    assert.equal(await page.getByTestId('folio-workspace-tab-cryptographic-export').getAttribute('aria-selected'), 'true');
    await page.keyboard.press('Home');
    assert.equal(await page.getByTestId('folio-workspace-tab-document-studio').getAttribute('aria-selected'), 'true');
    results.renderer = await page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl', { powerPreference: 'high-performance' }); const ext = gl?.getExtension('WEBGL_debug_renderer_info'); return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unavailable'; });
    assert.match(results.renderer, /NVIDIA/i);
    const cdp = await context.newCDPSession(page);
    for (const width of [1920, 1440, 1280, 390]) {
      await page.setViewportSize({ width, height: 1080 });
      for (const theme of ['void', 'paper', 'contrast', 'daltonic']) {
        await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
        await suite.scrollIntoViewIfNeeded();
        await page.evaluate(async () => { await document.fonts.ready; for (const animation of document.getAnimations()) if (animation.effect?.getTiming().iterations !== Infinity) animation.finish(); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
        const metrics = await suite.evaluate(el => ({ componentWidth: el.getBoundingClientRect().width, pageWidth: document.documentElement.scrollWidth, viewport: innerWidth, background: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color, cardBackgrounds: [...el.querySelectorAll('.folio-surface-grid article')].map(card => getComputedStyle(card).backgroundColor) }));
        if (metrics.pageWidth > width + 1) {
          const offenders = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); return r.width && r.right > innerWidth + 1; }).slice(0, 25).map(el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return { tag: el.tagName, className: el.className, x: r.x, width: r.width, right: r.right, minWidth: s.minWidth, display: s.display, grid: s.gridTemplateColumns }; }));
          const textOffenders = await page.evaluate(() => { const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const found = []; while (walker.nextNode()) { const node = walker.currentNode; if (!node.textContent.trim()) continue; const range = document.createRange(); range.selectNodeContents(node); const rect = range.getBoundingClientRect(); if (rect.right > innerWidth + 1) found.push({ text: node.textContent.slice(0, 100), parent: node.parentElement.className, right: rect.right, whiteSpace: getComputedStyle(node.parentElement).whiteSpace }); } return found.slice(0, 20); });
          const containmentControl = await suite.evaluate(el => { const original = el.style.overflow; const before = document.documentElement.scrollWidth; el.style.overflow = 'hidden'; const after = document.documentElement.scrollWidth; el.style.overflow = original; return { before, after }; });
          writeFileSync(path.join(__dirname, 'overflow-diagnostic.json'), JSON.stringify({ width, theme, metrics, offenders, textOffenders, containmentControl }, null, 2));
          const y = await page.evaluate(() => scrollY);
          const capture = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 74, clip: { x: 0, y, width, height: 1080, scale: Math.min(1, 1600 / width) }, captureBeyondViewport: true });
          writeFileSync(path.join(__dirname, 'overflow-diagnostic.jpg'), Buffer.from(capture.data, 'base64'));
        }
        if (width === 390) {
          const overlaps = await page.evaluate(() => { const title = document.querySelector('.folio-tri-surface > strong'); const dock = document.querySelector('[data-testid="canvas-theme-switcher"]').getBoundingClientRect(); const range = document.createRange(); range.selectNodeContents(title); return [...range.getClientRects()].some(rect => rect.left < dock.right && rect.right > dock.left && rect.top < dock.bottom && rect.bottom > dock.top); });
          assert.equal(overlaps, false, 'Sovereign status text must clear the phone theme control');
        }
        assert.ok(metrics.pageWidth <= width + 1, `page overflow at ${width}/${theme}: ${metrics.pageWidth}`);
        results.viewports.push({ width, theme, ...metrics });
        if (theme === 'paper' || width === 390) {
          await page.bringToFront();
          const y = await page.evaluate(() => scrollY);
          const capture = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 74, clip: { x: 0, y, width, height: 1080, scale: Math.min(1, 1600 / width) }, captureBeyondViewport: true });
          writeFileSync(path.join(__dirname, `command-suite-${width}-${theme}.jpg`), Buffer.from(capture.data, 'base64'));
        }
      }
    }
    assert.equal(new Set(results.viewports.filter(row => row.width === 1920).map(row => row.background)).size, 4);
    assert.deepEqual(results.errors, []);
    writeFileSync(path.join(__dirname, 'browser-results.json'), JSON.stringify(results, null, 2));
    console.log(`PASS: ${results.interactions.length} preset/workspace actions; keyboard tabs; ${results.viewports.length} theme/viewport checks; ${results.renderer}`);
  } finally {
    clearTimeout(timeout);
    if (browser) await browser.close();
    if (server.exitCode === null) { const exited = once(server, 'exit'); server.kill(); await exited; }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
