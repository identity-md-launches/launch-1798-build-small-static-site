import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

// Verification tools are installed outside the repository; no test dependency is needed at runtime.
const toolsPath = process.argv[2];
if (!toolsPath) throw new Error('Usage: node scripts/check-browser.mjs /path/to/check-tools');
const { chromium, webkit } = await import(pathToFileURL(resolve(toolsPath, 'node_modules/playwright/index.mjs')).href);
const { default: AxeBuilder } = await import(pathToFileURL(resolve(toolsPath, 'node_modules/@axe-core/playwright/dist/index.mjs')).href);
const root = resolve('dist');
const output = 'test/scratch/interactions';
await mkdir(output, { recursive: true });
const snapshot = JSON.parse(await readFile('dist/artifacts/worker-node.json', 'utf8'));
const report = { exportCapturedAt: snapshot.startedAt, checks: [], limitations: [] };
const passed = (name, details = '') => { report.checks.push({ name, passed: true, details }); console.log(`PASS: ${name}${details ? ` (${details})` : ''}`); };
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (!pathname.startsWith('/preview/')) return response.writeHead(404).end();
    const path = resolve(root, decodeURIComponent(pathname.slice('/preview/'.length)) || 'index.html');
    if (!path.startsWith(root + sep)) return response.writeHead(403).end();
    const body = await readFile(path);
    response.writeHead(200, { 'Content-Type': `${mime[extname(path)] || 'application/octet-stream'}; charset=utf-8` }).end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const url = `${origin}/preview/`;
let browser;

async function exactOutputs(page) {
  for (const command of snapshot.commands) {
    assert.equal(await page.locator(`#${command.id}-output`).textContent(), command.stdout);
  }
}
async function noOverflow(page) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'Document overflows horizontally');
}
async function download(page, name, file) {
  const event = page.waitForEvent('download');
  await page.getByRole('link', { name, exact: true }).click();
  const result = await event;
  assert.equal(await result.failure(), null);
  assert.deepEqual(await readFile(await result.path()), await readFile(`dist/artifacts/${file}`));
}

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const errors = [];
  await context.route('**/*', (route) => {
    if (route.request().url().startsWith(origin)) return route.continue();
    errors.push(`External resource: ${route.request().url()}`);
    return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(url);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    await exactOutputs(page);
    await noOverflow(page);
    if (width === 390) {
      const action = await page.getByRole('link', { name: 'Download snapshot', exact: true }).boundingBox();
      const product = await page.locator('#hostname-output').boundingBox();
      assert.ok(action.y + action.height < 844 && product.y + product.height < 844);
      await page.screenshot({ path: `${output}/390.png` });
    }
    if (width === 1440) await page.screenshot({ path: `${output}/1440.png` });
  }
  passed('Chromium layout, static output fidelity, and relative assets at a hosting subpath', '320, 390, 768, 1024, 1440 CSS pixels');
  passed('Product and primary action on the first screen at 390 × 844');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('checkbox', { name: 'Wrap long lines' }).uncheck();
  assert.equal(await page.locator('#listeners-output').evaluate((element) => getComputedStyle(element).whiteSpace), 'pre');
  assert.ok(await page.locator('#listeners-output').evaluate((element) => element.scrollWidth > element.clientWidth));
  await noOverflow(page);
  await exactOutputs(page);
  await page.getByRole('checkbox', { name: 'Wrap long lines' }).check();
  await exactOutputs(page);
  passed('Wrapping preserves every character; unwrapped sockets scroll inside their output');

  for (const command of snapshot.commands) {
    await page.getByRole('button', { name: `Copy ${command.invocation} output`, exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[role=status]').textContent.endsWith('copied.'));
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), command.stdout);
    await page.getByRole('button', { name: 'Dismiss message' }).click();
    assert.equal(await page.getByRole('status').textContent(), '');
  }
  passed('All four copy actions write the exact stdout to the real Chromium clipboard; feedback can be dismissed');

  await download(page, 'Download snapshot', 'worker-node.txt');
  await download(page, 'Download JSON', 'worker-node.json');
  for (const command of snapshot.commands) await download(page, `Download output for ${command.invocation}`, command.file);
  passed('All six actual download interactions match exported files byte for byte');

  for (const command of snapshot.commands) {
    await page.getByRole('link', { name: command.label, exact: true }).click();
    assert.equal(new URL(page.url()).hash, `#${command.id}`);
    const box = await page.locator(`#${command.id}`).boundingBox();
    assert.ok(box.y >= 0 && box.y < 100);
  }
  passed('All four in-page navigation links reach the corresponding section');

  await page.goto(url);
  const focusOrder = [];
  for (let step = 0; step < 5; step++) {
    await page.keyboard.press('Tab');
    focusOrder.push(await page.evaluate(() => ({ tag: document.activeElement.tagName, name: document.activeElement.getAttribute('aria-label') || document.activeElement.textContent.trim(), id: document.activeElement.id })));
  }
  assert.equal(focusOrder[0].name, 'Skip to outputs');
  assert.equal(focusOrder[2].name, 'Download snapshot');
  assert.equal(focusOrder[3].id, 'wrap-lines');
  assert.equal(focusOrder[4].name, 'Copy hostname output');
  assert.equal(await page.locator('button[data-copy="hostname-output"]').evaluate((element) => getComputedStyle(element).outlineStyle), 'solid');
  await page.screenshot({ path: `${output}/keyboard-focus.png` });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('[role=status]').textContent === 'hostname output copied.');
  passed('Keyboard flow reaches download, wrap, and copy before secondary navigation; Enter activates Copy', JSON.stringify(focusOrder));
  await page.getByRole('button', { name: 'Dismiss message' }).click();

  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  await writeFile(`${output}/axe.json`, JSON.stringify({ violations: axe.violations, incomplete: axe.incomplete, passes: axe.passes.map((check) => check.id) }, null, 2));
  assert.deepEqual(axe.violations, []);
  passed('Automated accessibility audit', `${axe.passes.length} rules passed; ${axe.incomplete.length} rules require manual review; 0 violations`);

  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await noOverflow(page);
  await exactOutputs(page);
  await page.screenshot({ path: `${output}/text-200-percent.png` });
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; document.documentElement.dir = 'rtl'; });
  await noOverflow(page);
  assert.equal(await page.locator('#hostname-output').evaluate((element) => getComputedStyle(element).direction), 'ltr');
  await page.evaluate(() => { document.documentElement.dir = 'ltr'; });
  passed('200% text enlargement reflows at 390px, RTL mirror preserves left-to-right command output');
  report.limitations.push('Text enlargement was tested; browser-native zoom and physical devices were not tested. No screen-reader session was performed.');

  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto(url);
  for (let step = 0; step < 3; step++) await page.keyboard.press('Tab');
  await page.screenshot({ path: `${output}/forced-colors-focus.png` });
  assert.equal(await page.locator('.primary-button').evaluate((element) => getComputedStyle(element).transitionDuration), '0s');
  passed('Reduced motion disables transitions; forced-colors focus screenshot captured');
  await context.close();

  const failedClipboard = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await failedClipboard.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new DOMException('Permission denied', 'NotAllowedError'); } } }));
  const fallbackPage = await failedClipboard.newPage();
  await fallbackPage.goto(url);
  await fallbackPage.getByRole('button', { name: 'Copy hostname -I output', exact: true }).click();
  await fallbackPage.waitForFunction(() => document.querySelector('[role=status]').textContent.startsWith('Clipboard unavailable.'));
  assert.equal(await fallbackPage.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Download output for hostname -I');
  assert.equal(await fallbackPage.getByRole('button', { name: 'Copy hostname -I output' }).isEnabled(), true);
  await fallbackPage.screenshot({ path: `${output}/clipboard-fallback.png` });
  await download(fallbackPage, 'Download output for hostname -I', snapshot.commands[1].file);
  passed('Denied clipboard access focuses the correct download, explains recovery, and preserves every byte through that download');
  await failedClipboard.close();

  const noScript = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const staticPage = await noScript.newPage();
  await staticPage.goto(url);
  await exactOutputs(staticPage);
  assert.equal(await staticPage.getByRole('button').count(), 0);
  await download(staticPage, 'Download snapshot', 'worker-node.txt');
  await noOverflow(staticPage);
  passed('Without JavaScript, all four outputs remain readable and the primary download works');
  await noScript.close();
  assert.deepEqual(errors, []);
  passed('No page errors, HTTP errors, or external requests during Chromium validation');
  await browser.close();
  browser = undefined;

  try { browser = await webkit.launch({ headless: true }); }
  catch (error) {
    report.limitations.push(`WebKit could not launch: ${error.message}`);
    console.log('LIMITATION: WebKit could not launch; see saved report.');
  }
  if (browser) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(url);
    await exactOutputs(page);
    await noOverflow(page);
    await download(page, 'Download snapshot', 'worker-node.txt');
    await page.getByRole('checkbox', { name: 'Wrap long lines' }).uncheck();
    await noOverflow(page);
    await exactOutputs(page);
    await page.getByRole('checkbox', { name: 'Wrap long lines' }).check();
    await page.screenshot({ path: `${output}/webkit-390.png` });
    passed('WebKit mobile primary download, verbatim outputs, wrapping, and reflow');
  }
} catch (error) {
  report.checks.push({ name: 'Browser validation', passed: false, details: error.stack });
  process.exitCode = 1;
  console.error(error);
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
  await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2) + '\n');
}
