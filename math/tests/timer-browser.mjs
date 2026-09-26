import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(process.env.MATH_PLAYWRIGHT || path.join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
    if (!file.startsWith(`${root}${path.sep}`)) { response.writeHead(403).end(); return; }
    const contents = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    response.end(contents);
  } catch { response.writeHead(404).end(); }
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;

try {
  browser = await playwright.chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto(`${base}/math/grade-3/`);
  assert.equal(await page.locator('#timer-enabled').isChecked(), true);
  assert.equal(await page.locator('#timer-seconds').inputValue(), '30');
  await page.locator('#timer-seconds').fill('5');
  await page.locator('#timer-seconds').press('Tab');
  await page.locator('.level').first().click();
  assert.match(await page.locator('#timer-countdown').textContent(), /^5 seconds$/);

  const equation = await page.locator('#question').textContent();
  const [, left, right] = equation.match(/(\d+) \+ (\d+)/);
  await page.locator('#answer').fill(String(Number(left) + Number(right)));
  await page.locator('#submit').click();
  await page.getByText('Question 2 of 10').waitFor();
  await page.getByText("Time's up! Your new 10-question round starts at question 1.").waitFor({ timeout: 7000 });
  assert.equal(await page.locator('#progress-text').textContent(), 'Question 1 of 10');

  await page.locator('#timer-game-toggle').click();
  assert.equal(await page.locator('#timer-countdown').textContent(), 'Timer off');
  await page.waitForTimeout(5500);
  assert.equal(await page.locator('#progress-text').textContent(), 'Question 1 of 10');

  assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= 391, 'Grade 3 timer UI should not overflow on mobile');
  await page.goto(`${base}/math/k/`);
  assert.equal(await page.locator('#timer-settings').count(), 0);
  assert.equal(await page.locator('#question-timer').count(), 0);
  await page.locator('.level').first().click();
  assert.equal(await page.locator('#progress-text').textContent(), 'Question 1 of 10');
  assert.deepEqual(errors, []);
  console.log('Grade 3 timer browser checks passed.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
