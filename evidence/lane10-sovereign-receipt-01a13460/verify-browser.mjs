import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { readFile, writeFile } from "node:fs/promises";
import { freemem } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("@playwright/test");
const sharpModule = process.env.QUALIFICATION_SHARP_MODULE || "sharp";
const sharp = require(sharpModule);
const root = process.cwd();
const out = path.join(root, "evidence/lane10-sovereign-receipt-01a13460");
const origin = "http://127.0.0.1:3503";
const viewports = [{ width: 1920, height: 1080 }, { width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 390, height: 844 }];
const themes = ["paper", "void", "contrast", "daltonic"];
const expectedKinds = ["document", "spreadsheet", "presentation", "notebook"];
const receipt = {
  sourceHead: execFileSync("git", ["-c", "core.fsmonitor=false", "rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  started: new Date().toISOString(), origin,
  fixture: "Owned local Vite production build. Main matrix proves real browser localStorage; isolated synthetic window.office cases are labelled adapter proof only. Clipboard is in-page only; no operating-system clipboard, desktop app, provider, preview or live URL.",
  views: [], captures: [], adapterProofs: [], errors: [], externalRequestsBlocked: [], memory: [], cleanup: {},
};
let server;
let browserServer;
let browser;
let serverOutput = "";
let deadline;
const appendOutput = (chunk) => { serverOutput = (serverOutput + chunk.toString()).slice(-65536); };
const memoryFloor = (stage) => {
  const availableMib = Math.round(freemem() / 1048576);
  receipt.memory.push({ stage, availableMib });
  assert.ok(availableMib >= 2048, `INVALID_SETUP: ${availableMib} MiB available before ${stage}`);
};
async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const animation of document.getAnimations()) {
      const end = animation.effect?.getComputedTiming().endTime;
      if (Number.isFinite(end) && animation.playState === "running") animation.finish();
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}
async function waitForServer() {
  const until = Date.now() + 45000;
  while (Date.now() < until) {
    if (server.exitCode !== null) throw new Error(`Owned Vite preview exited ${server.exitCode}`);
    try { if ((await fetch(origin)).ok) return; } catch { /* server is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("Owned Vite preview readiness deadline");
}
const clipboard = (page) => page.evaluate(() => ({
  mode: window.__folioClipboard.mode,
  writes: [...window.__folioClipboard.writes],
  pending: window.__folioClipboard.pending.length,
}));
const setClipboard = (page, mode, supported = true) => page.evaluate(({ mode, supported }) => {
  window.__folioClipboard.mode = mode;
  window.__setFolioClipboard(supported);
}, { mode, supported });
const storedFiles = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("office-workspace-preview") || "[]"));
const validateFourFiles = (files) => {
  assert.equal(files.length, 4);
  assert.equal(new Set(files.map((file) => file.id)).size, 4);
  assert.equal(new Set(files.map((file) => file.templateId)).size, 4);
  assert.deepEqual([...files.map((file) => file.kind)].sort(), [...expectedKinds].sort());
  const notebook = files.find((file) => file.kind === "notebook");
  const deck = files.find((file) => file.kind === "presentation");
  assert.equal(notebook.data.pages.length, 2);
  assert.equal(deck.data.slides.length, 2);
};
const validateReceipt = (text, files, storage) => {
  assert.match(text, /^Folio Office 4-in-1 Sovereign Template Receipt/m);
  assert.ok(text.includes(`Storage: ${storage}`));
  assert.match(text, /Illustrative annual cloud-seat fee comparison:/);
  assert.match(text, /Illustrative five-year comparison:/);
  assert.ok(text.includes("Excludes future acquisition price and buyer hardware costs."));
  assert.doesNotMatch(text, /actual bill/i);
  for (const file of files) { assert.ok(text.includes(file.id)); assert.ok(text.includes(file.name)); }
};
async function installBaseInit(context, theme, officeMode = "browser") {
  await context.addInitScript(({ theme, officeMode }) => {
    const nativeSetItem = Storage.prototype.setItem;
    nativeSetItem.call(localStorage, "agi-theme", theme);
    nativeSetItem.call(localStorage, "office-workspace-preview", "[]");
    window.__folioStorageWrites = [];
    Storage.prototype.setItem = function(key, value) {
      if (key === "office-workspace-preview") window.__folioStorageWrites.push(value);
      return nativeSetItem.call(this, key, value);
    };
    const clip = { mode: "resolve", writes: [], pending: [] };
    window.__folioClipboard = clip;
    const adapter = { writeText(text) {
      clip.writes.push(text);
      if (clip.mode === "reject") return Promise.reject(new Error("Synthetic clipboard denial"));
      if (clip.mode === "defer") return new Promise((resolve, reject) => clip.pending.push({ resolve, reject }));
      return Promise.resolve();
    } };
    window.__setFolioClipboard = (supported) => Object.defineProperty(navigator, "clipboard", { configurable: true, value: supported ? adapter : undefined });
    window.__setFolioClipboard(true);
    if (officeMode !== "browser") {
      const fixture = { mode: officeMode, snapshots: [], pending: [] };
      window.__folioOfficeAdapter = fixture;
      window.office = {
        load: async () => [],
        save: async (files) => {
          const snapshot = structuredClone(files);
          fixture.snapshots.push(snapshot);
          if (fixture.mode === "reject") return { ok: false, error: "Synthetic storage rejection", code: "IO_ERROR" };
          return new Promise((resolve, reject) => fixture.pending.push({ resolve, reject, snapshot }));
        },
      };
    }
  }, { theme, officeMode });
}
async function blockExternal(context, viewport, theme) {
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    receipt.externalRequestsBlocked.push({ viewport, theme, method: route.request().method(), origin: url.origin, path: url.pathname });
    return route.abort("blockedbyclient");
  });
}
function watch(page, viewport, theme) {
  page.setDefaultTimeout(12000);
  page.on("pageerror", (error) => receipt.errors.push({ viewport, theme, kind: "pageerror", message: error.message }));
  page.on("console", (message) => { if (message.type() === "error") receipt.errors.push({ viewport, theme, kind: "console", message: message.text() }); });
  page.on("response", (response) => { if (response.status() >= 400) receipt.errors.push({ viewport, theme, kind: "http", path: new URL(response.url()).pathname, status: response.status() }); });
}

async function verifyBrowserStorage(page) {
  const button = page.getByTestId("copy-four-in-one-sovereign-receipt-btn");
  const status = page.getByTestId("copy-four-in-one-sovereign-receipt-status");
  await page.getByTestId("four-in-one-workspace-deck").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('[data-testid="copy-four-in-one-sovereign-receipt-btn"]').disabled);
  await button.click();
  await page.waitForFunction(() => /receipt copied/i.test(document.querySelector('[data-testid="copy-four-in-one-sovereign-receipt-status"]')?.textContent || ""));
  const files = await storedFiles(page);
  validateFourFiles(files);
  const firstReceipt = (await clipboard(page)).writes.at(-1);
  validateReceipt(firstReceipt, files, "browser-preview");
  assert.equal((await page.evaluate(() => JSON.parse(window.__folioStorageWrites.at(-1) || "[]"))).length, 4);

  await setClipboard(page, "reject");
  await button.click();
  await page.waitForFunction(() => document.querySelector('[data-testid="copy-four-in-one-sovereign-receipt-fallback"]'));
  const rejectedPayload = (await clipboard(page)).writes.at(-1);
  const fallback = page.getByTestId("copy-four-in-one-sovereign-receipt-fallback");
  assert.equal(await fallback.inputValue(), rejectedPayload);
  assert.equal(await fallback.getAttribute("readonly"), "");
  assert.doesNotMatch(await status.innerText(), /receipt copied/i);
  assert.doesNotMatch(await button.innerText(), /Receipt Copied/i);
  validateFourFiles(await storedFiles(page));

  const writesBeforeMissing = (await clipboard(page)).writes.length;
  await setClipboard(page, "resolve", false);
  await button.click();
  await page.waitForFunction(() => /not copied/i.test(document.querySelector('[data-testid="copy-four-in-one-sovereign-receipt-status"]')?.textContent || ""));
  assert.equal((await clipboard(page)).writes.length, writesBeforeMissing);
  assert.equal(await fallback.inputValue(), rejectedPayload);
  validateFourFiles(await storedFiles(page));

  await setClipboard(page, "resolve");
  await button.click();
  await page.waitForFunction(() => /receipt copied/i.test(document.querySelector('[data-testid="copy-four-in-one-sovereign-receipt-status"]')?.textContent || ""));
  const afterRetry = await storedFiles(page);
  assert.deepEqual(afterRetry.map((file) => file.id).sort(), files.map((file) => file.id).sort());

  await page.getByTestId("zero-rent-persona-pill-independent-writer").click();
  await setClipboard(page, "defer");
  await button.click();
  await page.waitForFunction(() => window.__folioClipboard.pending.length === 1);
  const pendingReceipt = (await clipboard(page)).writes.at(-1);
  assert.ok(pendingReceipt.includes("Independent Writer"));
  await page.getByTestId("zero-rent-persona-pill-family-business").click();
  await page.evaluate(() => window.__folioClipboard.pending.shift().resolve());
  await page.waitForFunction(() => /Ready for the current persona/i.test(document.querySelector('[data-testid="copy-four-in-one-sovereign-receipt-status"]')?.textContent || ""));
  assert.ok(!(await status.innerText()).includes("Family Business") || !/copied for.*Family Business/i.test(await status.innerText()));
  assert.doesNotMatch(await button.innerText(), /Receipt Copied/i);
  return { files: 4, browserStorage: true, storageWrites: await page.evaluate(() => window.__folioStorageWrites.length), fallbackCases: 2, retryDeduplicated: true, personaStaleGuard: true };
}

async function verifyDesktopAdapter(mode) {
  const viewport = { width: 1920, height: 1080 };
  const context = await browser.newContext({ viewport, serviceWorkers: "block" });
  try {
    await blockExternal(context, viewport, `paper-adapter-${mode}`);
    await installBaseInit(context, "paper", mode);
    const page = await context.newPage(); watch(page, viewport, `paper-adapter-${mode}`);
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    const button = page.getByTestId("copy-four-in-one-sovereign-receipt-btn");
    await page.getByTestId("four-in-one-workspace-deck").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => !document.querySelector('[data-testid="copy-four-in-one-sovereign-receipt-btn"]').disabled);
    await button.click();
    await page.waitForFunction(() => window.__folioOfficeAdapter.snapshots.length === 1);
    const before = await page.evaluate(() => ({ snapshot: window.__folioOfficeAdapter.snapshots[0], pending: window.__folioOfficeAdapter.pending.length, clipboardCalls: window.__folioClipboard.writes.length }));
    validateFourFiles(before.snapshot);
    assert.equal(before.clipboardCalls, 0);
    assert.equal(await page.locator(".file-row").count(), 0, "unacknowledged adapter files must not be visible");
    if (mode === "defer") {
      assert.equal(before.pending, 1);
      assert.match(await page.getByTestId("copy-four-in-one-sovereign-receipt-status").innerText(), /Saving four templates/i);
      await page.evaluate(() => { const item = window.__folioOfficeAdapter.pending.shift(); item.resolve({ ok: true, files: item.snapshot }); });
      await page.waitForFunction(() => window.__folioClipboard.writes.length === 1);
      const payload = (await clipboard(page)).writes[0];
      validateReceipt(payload, before.snapshot, "desktop-local");
      await page.waitForFunction(() => /receipt copied/i.test(document.querySelector('[data-testid="copy-four-in-one-sovereign-receipt-status"]')?.textContent || ""));
      assert.equal(await page.locator(".file-row").count(), 4);
      return { proofClass: "synthetic desktop-local adapter acknowledgement only", outcome: "accepted", files: 4 };
    }
    await page.waitForFunction(() => /Synthetic storage rejection/i.test(document.querySelector('[data-testid="copy-four-in-one-sovereign-receipt-status"]')?.textContent || ""));
    assert.equal(await page.locator(".file-row").count(), 0);
    assert.equal((await clipboard(page)).writes.length, 0);
    return { proofClass: "synthetic desktop-local adapter rejection only", outcome: "rejected", files: 0 };
  } finally { await context.close(); }
}

try {
  const [indexHtml, component, app] = await Promise.all([
    readFile(path.join(root, "dist/index.html")), readFile(path.join(root, "src/FolioSovereignCommandSuite.tsx")), readFile(path.join(root, "src/App.tsx")),
  ]);
  receipt.build = {
    indexSha256: createHash("sha256").update(indexHtml).digest("hex"),
    componentSha256: createHash("sha256").update(component).digest("hex"),
    appSha256: createHash("sha256").update(app).digest("hex"),
    dependencies: { playwright: require("@playwright/test/package.json").version, sharp: sharp.versions.sharp, sharpModule },
  };
  memoryFloor("server launch");
  server = spawn(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), "preview", "--host", "127.0.0.1", "--port", "3503", "--strictPort"], { cwd: root, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  receipt.server = { pid: server.pid, retainedProcessHandle: true, outputLimitBytes: 65536 };
  server.stdout.on("data", appendOutput); server.stderr.on("data", appendOutput);
  deadline = setTimeout(() => { receipt.timedOut = true; server?.kill(); void browserServer?.close(); }, 300000);
  await waitForServer();
  memoryFloor("browser launch");
  browserServer = await chromium.launchServer({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--enable-gpu", "--use-angle=d3d11", "--force-high-performance-gpu"] });
  browser = await chromium.connect(browserServer.wsEndpoint());
  const cdp = await browser.newBrowserCDPSession();
  const gpu = await cdp.send("SystemInfo.getInfo");
  receipt.gpu = { renderer: gpu.gpu.auxAttributes.glRenderer, devices: gpu.gpu.devices.map((device) => ({ vendorString: device.vendorString, deviceString: device.deviceString })) };
  assert.match(receipt.gpu.renderer, /NVIDIA.*RTX 5060/i); assert.doesNotMatch(receipt.gpu.renderer, /SwiftShader|software|llvmpipe/i);
  await cdp.detach();

  for (const viewport of viewports) for (const theme of themes) {
    memoryFloor(`${viewport.width}x${viewport.height}/${theme}`);
    const context = await browser.newContext({ viewport, serviceWorkers: "block" });
    try {
      await blockExternal(context, viewport, theme);
      await installBaseInit(context, theme, "browser");
      const page = await context.newPage(); watch(page, viewport, theme);
      await page.goto(origin, { waitUntil: "domcontentloaded" }); await page.bringToFront();
      await page.waitForFunction((expected) => document.documentElement.dataset.theme === expected, theme);
      const checks = await verifyBrowserStorage(page);
      await settle(page);
      const geometry = await page.evaluate(() => ({ horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - innerWidth), emDashes: (document.body.innerText.match(/\u2014/g) ?? []).length }));
      assert.equal(geometry.horizontalOverflowPx, 0); assert.equal(geometry.emDashes, 0);
      const row = { viewport, theme, ...checks, ...geometry };
      if (theme === "paper" || viewport.width === 390) {
        const region = page.getByTestId("four-in-one-workspace-deck"); await region.scrollIntoViewIfNeeded(); await settle(page);
        const name = `${viewport.width}x${viewport.height}-${theme}-sovereign-receipt.jpg`;
        const target = path.join(out, name);
        await sharp(await region.screenshot()).resize({ width: Math.min(1600, viewport.width), withoutEnlargement: true }).jpeg({ quality: 76 }).toFile(target);
        const [metadata, stats] = await Promise.all([sharp(target).metadata(), sharp(target).stats()]);
        assert.ok(metadata.width <= 1600);
        const paintedRange = Math.max(...stats.channels.map((channel) => channel.max - channel.min));
        assert.ok(paintedRange >= 24, "capture region must contain painted UI pixels");
        receipt.captures.push({ name, width: metadata.width, height: metadata.height, paintedRange }); row.capture = name;
      }
      receipt.views.push(row);
    } finally { await context.close(); }
  }
  receipt.adapterProofs.push(await verifyDesktopAdapter("defer"), await verifyDesktopAdapter("reject"));
  assert.equal(receipt.views.length, 16); assert.equal(receipt.captures.length, 7); assert.equal(receipt.errors.length, 0);
  receipt.status = "PASS";
} catch (error) {
  receipt.status = receipt.timedOut ? "TIMEOUT" : "FAIL"; receipt.failure = { message: error.message, stack: error.stack }; process.exitCode = 1;
} finally {
  clearTimeout(deadline);
  if (browser) await browser.close();
  if (browserServer) await browserServer.close();
  if (server?.exitCode === null) { server.kill(); await Promise.race([once(server, "exit"), new Promise((resolve) => setTimeout(resolve, 5000))]); }
  receipt.cleanup = { browserClosed: Boolean(browser), browserServerClosed: Boolean(browserServer), serverExit: server?.exitCode, serverSignal: server?.signalCode };
  receipt.finished = new Date().toISOString();
  await writeFile(path.join(out, "browser-receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
  await writeFile(path.join(out, "browser-server.txt"), serverOutput);
  console.log(JSON.stringify({ status: receipt.status, views: receipt.views.length, captures: receipt.captures.length, errors: receipt.errors.length, failure: receipt.failure?.message, cleanup: receipt.cleanup }));
}
