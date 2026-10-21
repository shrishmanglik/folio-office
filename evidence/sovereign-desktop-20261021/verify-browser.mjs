import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createWriteStream, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(process.argv[2] ?? '.');
const product = process.argv[3] ?? 'thread-intelligence';
assert.ok(['thread-intelligence', 'folio-office'].includes(product));
const output = join(root, 'evidence/sovereign-desktop-20261021');
mkdirSync(output, { recursive: true });
const require = createRequire(join(root, 'package.json'));
const { chromium, expect } = require('@playwright/test');
const isThread = product === 'thread-intelligence';
const port = isThread ? 4491 : 4492;
const url = `http://127.0.0.1:${port}`;
const command = isThread
  ? [join(root, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)]
  : [join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'];
const log = createWriteStream(join(output, 'browser-server.log'));
const server = spawn(process.execPath, command, { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
server.stdout.pipe(log, { end: false });
server.stderr.pipe(log, { end: false });
let browser;
const report = { product, root, url, renderer: null, checks: [], pageErrors: [], status: 'INCOMPLETE' };
try {
  await new Promise((ready, reject) => {
    const timer = setTimeout(() => reject(new Error('Server readiness exceeded 40 seconds')), 40000);
    server.once('error', reject);
    server.once('exit', (code) => reject(new Error(`Server exited before readiness: ${code}`)));
    server.stdout.on('data', (data) => {
      if (/Ready|Local:/.test(data.toString())) { clearTimeout(timer); ready(); }
    });
  });
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--force-high-performance-gpu', '--disable-software-rasterizer'] });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await context.route('**/*', (route) => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  const page = await context.newPage();
  page.on('pageerror', (error) => report.pageErrors.push(error.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  report.renderer = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl');
    const extension = gl?.getExtension('WEBGL_debug_renderer_info');
    return extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : 'UNKNOWN';
  });
  assert.match(report.renderer, /NVIDIA|RTX 5060/i, 'Captures require the NVIDIA renderer');
  const surface = page.locator(isThread ? '.sovereign-ownership' : '.ownership-surface');
  const switcher = page.getByTestId('ownership-model-switcher');
  const detail = page.locator(isThread ? '#thread-ownership-detail' : '.ownership-model-copy');
  const hardware = isThread ? page.getByTestId('local-llm-hardware-selector').locator('select') : page.getByTestId('local-llm-hardware-selector');
  const desktop = switcher.getByRole('button', { name: 'One-Time Offline Desktop Purchase (Unlimited Free Local AI)', exact: true });
  const cloud = switcher.getByRole('button', { name: 'Monthly Cloud Subscription (Hosted Web & Cloud AI)', exact: true });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });

  for (const [width, height] of [[1920, 1080], [1440, 900], [1280, 800], [390, 844]]) {
    await page.setViewportSize({ width, height });
    for (const theme of ['void', 'paper', 'contrast', 'daltonic']) {
      const trigger = page.getByTestId('canvas-theme-switcher');
      await trigger.click();
      await page.locator(`[data-theme-option="${theme}"]`).click();
      if (await trigger.getAttribute('aria-expanded') === 'true') await trigger.click();
      await page.waitForFunction((value) => document.documentElement.dataset.theme === value, theme);
      await cloud.click();
      await expect(cloud).toHaveAttribute('aria-pressed', 'true');
      await expect(desktop).toHaveAttribute('aria-pressed', 'false');
      await expect(detail).toContainText(/hosted/i);
      const cloudText = await detail.innerText();
      await desktop.click();
      await expect(desktop).toHaveAttribute('aria-pressed', 'true');
      await expect(cloud).toHaveAttribute('aria-pressed', 'false');
      await expect(detail).toContainText(/owned major version/);
      assert.notEqual(await detail.innerText(), cloudText);
      for (const [index, commands] of [[0, ['llama3.2:3b']], [2, ['qwen2.5:14b', 'deepseek-r1:8b']], [1, ['qwen2.5:7b']]]) {
        await hardware.selectOption({ index });
        for (const model of commands) await expect(surface.locator('code').filter({ hasText: `ollama run ${model}` })).toBeVisible();
        assert.equal(await surface.locator('code').filter({ hasText: /^ollama run / }).count(), commands.length);
      }
      await expect(page.getByTestId('desktop-download-hub')).toHaveAttribute('data-release-status', 'in-preparation');
      assert.equal(await page.getByTestId('desktop-download-hub').locator('a[href]').count(), 0, 'Pending release must not offer a fake installer');
      const table = page.getByTestId('offline-parity-table');
      assert.equal(await table.locator('tbody tr').count(), isThread ? 4 : 5);
      await expect(table).toContainText('On this computer · No monthly limit');
      await expect(table).toContainText('Online plan allowance');
      await expect(table).toContainText('Needs the internet');
      await expect(table.locator('tbody tr').last()).toContainText(/publishing always needs|Yes/);
      assert.equal(await surface.innerText().then((text) => text.includes('\u2014')), false);
      await surface.evaluate((element) => element.scrollIntoView({ block: 'start' }));
      await page.bringToFront();
      await page.evaluate(async () => {
        for (const animation of document.getAnimations()) {
          if (Number.isFinite(animation.effect?.getComputedTiming().iterations)) animation.finish();
        }
        await document.fonts.ready;
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
      });
      const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
      assert.ok(geometry.scrollWidth <= geometry.width + 1, `${product} ${theme} ${width}: page overflow ${JSON.stringify(geometry)}`);
      const controls = await switcher.getByRole('button').evaluateAll((buttons) => buttons.map((button) => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })));
      for (const control of controls) assert.ok(control.width >= 44 && control.height >= 44, 'Ownership buttons must be usable on touch screens');
      for (const [suffix, target] of [['', surface], ['-hardware', hardware], ['-parity', table]]) {
        await target.evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
        await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
        const capture = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 65, captureBeyondViewport: false, clip: { x: 0, y: await page.evaluate(() => window.scrollY), width, height, scale: Math.min(1, 1600 / width) } });
        writeFileSync(join(output, `${theme}-${width}${suffix}.jpg`), Buffer.from(capture.data, 'base64'));
      }
      report.checks.push({ theme, width, height, ownershipRoundTrip: true, hardwareTiers: 3, pendingDownload: true, parityRows: isThread ? 4 : 5, geometry, controls });
    }
  }
  assert.deepEqual(report.pageErrors, []);
  report.status = 'PASS';
  console.log(`${product}: ${report.checks.length} theme/viewport checks passed; ${report.renderer}`);
} finally {
  writeFileSync(join(output, 'browser-checks.json'), JSON.stringify(report, null, 2));
  await browser?.close();
  if (server.exitCode === null) {
    const exited = new Promise((done) => server.once('exit', done));
    server.kill();
    await exited;
  }
  log.end();
}
