// Run with: node games/math-go/tests/browser-smoke.mjs
// Uses an installed Playwright package and Chrome. No web server or downloads required.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require(process.env.MATH_GO_PLAYWRIGHT || path.join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
    if (!file.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }
    const contents = await readFile(file);
    response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(file)] || 'application/octet-stream' });
    response.end(contents);
  } catch {
    response.writeHead(404).end();
  }
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
let page;
const errors = [];
const saves = async (target = page) => target.evaluate(() => JSON.parse(localStorage.getItem('math-go-save-v1')));
const action = (name, target = page) => target.locator(`[data-action="${name}"]`);
const navigate = async (view, target = page) => {
  await target.locator(`nav [data-action="navigate"][data-view="${view}"]`).click();
};
function watch(target) {
  target.on('pageerror', error => errors.push(error.message));
  target.on('response', response => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
      errors.push(`HTTP ${response.status()} ${response.url()}`);
    }
  });
}
async function noOverflow(label, target = page) {
  const dimensions = await target.evaluate(() => ({
    width: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
    overflowing: [...document.querySelectorAll('body *')].filter(element => {
      const bounds = element.getBoundingClientRect();
      return bounds.width && (bounds.right > document.documentElement.clientWidth + 1 || bounds.left < -1);
    }).slice(0, 8).map(element => `${element.tagName}.${element.className?.baseVal ?? element.className}`),
  }));
  if (dimensions.content > dimensions.width + 1) await target.screenshot({ path: '/tmp/math-go-overflow.png', fullPage: true });
  assert.ok(dimensions.content <= dimensions.width + 1, `${label} has horizontal overflow: ${JSON.stringify(dimensions)}`);
}
async function unlock(target = page) {
  await target.locator('#access-code').fill(Buffer.from('THVjYXM=', 'base64').toString());
  await target.locator('#gate-form button[type="submit"]').click();
}
async function importSave(contents, target = page) {
  await target.locator('#import-file').setInputFiles({ name: 'math-go-test.json', mimeType: 'application/json', buffer: Buffer.from(contents) });
  await target.locator('#dialog[open]').waitFor();
}
async function startBattle(habitatId, encounterId, target = page) {
  await navigate('map', target);
  await target.locator(`[data-action="habitat"][data-id="${habitatId}"]`).click();
  await target.locator(`[data-action="encounter"][data-id="${encounterId}"]`).click();
  await action('start-encounter', target).click();
  await target.locator('#battle-answer').waitFor();
}
async function finishBattle() {
  for (let turn = 0; turn < 20; turn += 1) {
    const state = await saves();
    if (!state.battle) return;
    if (await page.locator('#next-question').count()) await page.locator('#next-question').click();
    const move = state.battle.playerHp < 35 && state.battle.enemyHp > 40 ? 'mend' : 'burst';
    await page.locator(`[data-action="move"][data-id="${move}"]`).click();
    await page.locator('#battle-answer').fill(String(state.battle.question.answer));
    await page.locator('#submit-answer').click();
  }
  assert.fail('Challenge did not finish within 20 turns');
}

try {
  browser = await playwright.chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  context.setDefaultTimeout(8000);
  page = await context.newPage();
  watch(page);
  await page.goto(`${base}/games/math-go/`);
  await page.waitForLoadState('networkidle');
  assert.match(await page.title(), /Math Go/i);
  await noOverflow('Desktop access gate');
  await page.screenshot({ path: '/tmp/math-go-gate-desktop.png', fullPage: true });
  await page.locator('#access-code').fill('lucas');
  await page.locator('#gate-form button[type="submit"]').click();
  assert.match(await page.locator('#gate-error').textContent(), /doesn’t match/);
  assert.equal(await page.locator('#setup-form').count(), 0);
  await unlock();
  await page.locator('#explorer-name').fill('<b>unsafe</b>');
  await page.locator('#setup-form button[type="submit"]').click();
  assert.match(await page.locator('#setup-error').textContent(), /no markup/);
  await page.locator('#explorer-name').fill('Test Explorer');
  await page.locator('[name="starter"][value="sprig"]').check();
  await page.locator('#setup-topic').selectOption('add2');
  await page.locator('#setup-form button[type="submit"]').click();
  assert.equal((await saves()).player.name, 'Test Explorer');
  await noOverflow('Desktop island map');
  await page.screenshot({ path: '/tmp/math-go-map-desktop.png', fullPage: true });
  await page.locator('[data-action="habitat"][data-id="river"]').click();
  assert.match(await page.locator('.habitat-card').textContent(), /previous habitat/);
  assert.equal(await action('encounter').count(), 0);
  console.log('PASS access gate, explorer creation, and habitat locking');

  await startBattle('fern', 'fern-1');
  const initial = await saves();
  await page.locator('#battle-answer').fill(String(initial.battle.question.answer + 1));
  await page.locator('#submit-answer').click();
  const wrong = await saves();
  assert.equal(wrong.battle.question.id, initial.battle.question.id);
  assert.equal(wrong.battle.playerHp, initial.battle.playerHp);
  assert.equal(wrong.battle.enemyHp, initial.battle.enemyHp);
  assert.equal(wrong.stats.answered, 1);
  assert.equal(wrong.stats.correct, 0);
  assert.ok(await page.locator('.hint').isVisible());
  await page.locator('#battle-answer').fill(String(initial.battle.question.answer + 2));
  await page.locator('#submit-answer').click();
  assert.equal((await saves()).stats.answered, 1, 'Retries count as one puzzle');
  await page.reload();
  assert.equal((await saves()).battle.question.id, initial.battle.question.id, 'Active question survives reload');
  await page.locator('#battle-answer').fill(String(initial.battle.question.answer));
  await action('hint').click();
  assert.equal(await page.locator('#battle-answer').inputValue(), String(initial.battle.question.answer), 'Hint preserves typed answer');
  await page.locator('[data-action="move"][data-id="burst"]').click();
  assert.equal(await page.locator('#battle-answer').inputValue(), String(initial.battle.question.answer), 'Move change preserves typed answer');
  await page.screenshot({ path: '/tmp/math-go-battle-desktop.png', fullPage: true });
  await noOverflow('Desktop battle');
  await page.locator('#submit-answer').click();
  assert.equal((await saves()).stats.correct, 0, 'Retry does not become first-try correct');
  assert.ok((await saves()).battle.enemyHp < initial.battle.enemyHp);
  await page.locator('#next-question').click();
  const activeBefore = await saves();
  await navigate('camp');
  await page.locator('#practice-topic').selectOption('fractions');
  await page.locator('#settings-form button[type="submit"]').click();
  assert.equal((await saves()).battle.question.id, activeBefore.battle.question.id, 'Settings do not replace the current puzzle');
  await action('resume').click();
  await finishBattle();
  assert.ok((await saves()).completed.includes('fern-1'));
  console.log('PASS wrong-answer retries, hints, move choice, active reload, settings, and first win');

  const habitats = ['fern', 'river', 'crystal', 'summit'];
  for (const area of habitats) {
    for (let index = 1; index <= 3; index += 1) {
      const encounter = `${area}-${index}`;
      if ((await saves()).completed.includes(encounter)) continue;
      await startBattle(area, encounter);
      assert.equal((await saves()).battle.question.topic, 'fractions');
      await finishBattle();
      assert.ok((await saves()).completed.includes(encounter), `${encounter} must be won, not abandoned`);
    }
    assert.ok((await saves()).collection.length >= habitats.indexOf(area) + 2);
  }
  assert.match(await page.locator('.result h1').textContent(), /restored Bramble Island/);
  assert.equal((await saves()).completed.length, 12);
  await page.screenshot({ path: '/tmp/math-go-finish-desktop.png', fullPage: true });
  await navigate('companions');
  await page.locator('[data-action="adopt-dino"][data-id="brook"]').click();
  assert.ok((await saves()).collection.includes('brook'));
  await page.locator('[data-action="equip-dino"][data-id="brook"]').click();
  assert.equal((await saves()).equipped, 'brook');
  await navigate('gear');
  await page.locator('[data-action="gear"][data-id="sun"]').click();
  assert.equal((await saves()).gear, 'sun');
  await navigate('journal');
  assert.equal(await page.locator('.topic-table tbody tr').count(), 10);
  console.log('PASS all 12 challenges, all habitat guardians, companion adoption/equip, earned gear, journal');

  await startBattle('summit', 'summit-3');
  assert.equal((await saves()).battle.playerMaxHp, 130, 'Earned sun gear applies health bonus');
  await navigate('camp');
  const beforeExport = await saves();
  const downloadPromise = page.waitForEvent('download');
  await action('export').click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /^math-go-Test-Explorer-.*\.json$/);
  const exportedText = await readFile(await download.path(), 'utf8');
  assert.deepEqual(JSON.parse(exportedText), beforeExport, 'Downloaded JSON preserves full active adventure');
  await action('resume').click();
  await action('leave-battle').click();
  await action('confirm-leave').click();
  assert.equal((await saves()).battle, null);
  await navigate('camp');
  const savedBeforeInvalidImport = await saves();
  for (const invalid of ['{ invalid JSON', '{"format":"math-go","version":99}', JSON.stringify({ ...savedBeforeInvalidImport, player: { ...savedBeforeInvalidImport.player, name: '<svg onload=alert(1)>' } })]) {
    await importSave(invalid);
    assert.match(await page.locator('#dialog-title').textContent(), /Could not import/);
    assert.deepEqual(await saves(), savedBeforeInvalidImport, 'Invalid imports preserve the current adventure');
    assert.equal(await page.locator('#dialog svg').count(), 0, 'Imported markup is never inserted');
    await action('close-dialog').click();
  }
  await importSave(exportedText);
  assert.deepEqual(await saves(), savedBeforeInvalidImport, 'Import must wait for confirmation');
  await action('close-dialog').click();
  assert.deepEqual(await saves(), savedBeforeInvalidImport, 'Cancel keeps existing save');
  await importSave(exportedText);
  await action('confirm-import').click();
  assert.deepEqual(await saves(), beforeExport, 'Confirmed import restores the downloaded JSON exactly');
  assert.ok(await page.locator('#battle-answer').isVisible());
  await page.reload();
  assert.deepEqual(await saves(), beforeExport, 'Imported adventure survives reload');
  await navigate('camp');
  await action('lock').click();
  assert.ok(await page.locator('#access-code').isVisible());
  await unlock();
  assert.deepEqual(await saves(), beforeExport, 'Lock/unlock keeps the adventure');
  await action('resume').click();
  assert.ok(await page.locator('#battle-answer').isVisible());
  console.log('PASS JSON download/import, invalid imports, cancel/confirmation, persistent active challenge, lock/unlock');

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  mobile.setDefaultTimeout(8000);
  const phone = await mobile.newPage();
  watch(phone);
  await phone.goto(`${base}/games/math-go/`);
  await noOverflow('Phone gate', phone);
  await unlock(phone);
  await noOverflow('Phone setup', phone);
  await importSave(exportedText, phone);
  await action('confirm-import', phone).click();
  await noOverflow('Phone battle', phone);
  await phone.screenshot({ path: '/tmp/math-go-battle-mobile.png', fullPage: true });
  await action('leave-battle', phone).click();
  await action('confirm-leave', phone).click();
  for (const screen of ['map', 'companions', 'gear', 'journal', 'camp']) {
    await navigate(screen, phone);
    await noOverflow(`Phone ${screen}`, phone);
  }
  await navigate('map', phone);
  await phone.screenshot({ path: '/tmp/math-go-map-mobile.png', fullPage: true });
  await phone.setViewportSize({ width: 320, height: 740 });
  for (const screen of ['map', 'companions', 'gear', 'journal', 'camp']) {
    await navigate(screen, phone);
    await noOverflow(`Small phone ${screen}`, phone);
  }
  await mobile.close();
  console.log('PASS mobile navigation and layout at 390 px and 320 px');

  await page.evaluate(() => localStorage.setItem('math-go-save-v1', '{broken browser save'));
  await page.reload();
  assert.match(await page.locator('.notice').textContent(), /could not open the browser save/);
  assert.ok(await page.locator('#setup-form button[type="submit"]').isDisabled());
  assert.equal(await page.evaluate(() => localStorage.getItem('math-go-save-v1')), '{broken browser save');
  await importSave(exportedText);
  await action('confirm-import').click();
  assert.deepEqual(await saves(), beforeExport, 'Downloaded JSON recovers a corrupt browser save');
  console.log('PASS corrupt browser save protection and recovery');

  const secondTab = await context.newPage();
  await secondTab.goto(`${base}/games/math-go/`);
  const secondTabSave = { ...beforeExport, player: { ...beforeExport.player, name: 'Second Explorer' } };
  await secondTab.evaluate(save => localStorage.setItem('math-go-save-v1', JSON.stringify(save)), secondTabSave);
  await page.locator('.notice').waitFor();
  assert.match(await page.locator('.notice').textContent(), /Another tab/);
  await page.locator('#battle-answer').fill(String(beforeExport.battle.question.answer));
  await page.locator('#submit-answer').click();
  assert.deepEqual(await saves(), secondTabSave, 'Conflicting tab must not overwrite the other explorer');
  const conflictDownloadPromise = page.waitForEvent('download');
  await action('export').first().click();
  const conflictDownload = await conflictDownloadPromise;
  const memoryBackup = JSON.parse(await readFile(await conflictDownload.path(), 'utf8'));
  assert.equal(memoryBackup.player.name, 'Test Explorer', 'Download preserves this tab’s in-memory explorer');
  assert.ok(memoryBackup.battle.turn > beforeExport.battle.turn, 'In-memory adventure can progress during a storage conflict');
  await secondTab.close();
  console.log('PASS cross-tab conflict preserves both explorers and allows an in-memory backup');

  const blocked = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  blocked.setDefaultTimeout(8000);
  await blocked.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage is unavailable', 'QuotaExceededError'); };
  });
  const privatePage = await blocked.newPage();
  watch(privatePage);
  await privatePage.goto(`${base}/games/math-go/`);
  await unlock(privatePage);
  await privatePage.locator('#explorer-name').fill('Memory Explorer');
  await privatePage.locator('#setup-form button[type="submit"]').click();
  assert.match(await privatePage.locator('.notice').textContent(), /cannot autosave/);
  await navigate('camp', privatePage);
  await action('lock', privatePage).click();
  await unlock(privatePage);
  assert.match(await privatePage.locator('.status-chip.name').textContent(), /Memory Explorer/);
  const memoryDownloadPromise = privatePage.waitForEvent('download');
  await action('export', privatePage).first().click();
  const memoryDownload = await memoryDownloadPromise;
  const blockedBackup = JSON.parse(await readFile(await memoryDownload.path(), 'utf8'));
  assert.equal(blockedBackup.player.name, 'Memory Explorer');
  await blocked.close();
  console.log('PASS unavailable browser storage still permits play, lock/unlock, and JSON download');
  assert.deepEqual(errors, [], 'No browser errors or missing assets');
  await context.close();
  console.log('All Math Go browser smoke checks passed. Screenshots: /tmp/math-go-*.png');
} catch (error) {
  if (page && !page.isClosed()) await page.screenshot({ path: '/tmp/math-go-smoke-failure.png', fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
