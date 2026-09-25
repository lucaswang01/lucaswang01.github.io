// Real-browser RPG regression checks. Run: node games/math-go/tests/rpg-browser.mjs
// Uses local Chrome/Playwright; all game requests stay on an ephemeral local server.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSave as createLegacySave, beginBattle as beginLegacyBattle, submitAnswer as legacyAnswer } from '../core.mjs';
import { createGame, normalizeGame, startBattle, knownSpells, SPELLS, getLevel } from '../rpg-core.mjs';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(process.env.MATH_GO_PLAYWRIGHT || path.join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
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
let page;
let animationCaptured = false;
const errors = [];
const action = (name, target = page) => target.locator(`[data-action="${name}"]`);
const navigate = async (view, target = page) => {
  const control = target.locator(`nav [data-action="navigate"][data-view="${view}"]`);
  if (await control.isVisible()) await control.click();
  else await control.evaluate(button => button.click());
};
const save = async (target = page) => target.evaluate(() => {
  const key = localStorage.getItem('math-go-save-v2') ? 'math-go-save-v2' : 'math-go-save-v1';
  return JSON.parse(localStorage.getItem(key));
});
function watch(target) {
  target.on('pageerror', error => errors.push(error.message));
  target.on('request', request => {
    if (!request.url().startsWith(base) && /^https?:/.test(request.url())) errors.push(`Unexpected remote request: ${request.url()}`);
  });
  target.on('response', response => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) errors.push(`HTTP ${response.status()} ${response.url()}`);
  });
}
async function noOverflow(label, target = page) {
  const sizes = await target.evaluate(() => ({ width: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  assert.ok(sizes.content <= sizes.width + 1, `${label} overflows: ${JSON.stringify(sizes)}`);
}
async function unlock(target = page) {
  await target.locator('#access-code').fill(Buffer.from('THVjYXM=', 'base64').toString());
  await target.locator('#gate-form button[type="submit"]').click();
}
async function createExplorer(name, target = page) {
  await target.locator('#explorer-name').fill(name);
  await target.locator('[name="starter"][value="sprig"]').check();
  await target.locator('#setup-topic').selectOption('add2');
  await target.locator('#setup-form button[type="submit"]').click();
}
async function importFile(contents, target = page) {
  await target.locator('#import-file').setInputFiles({ name: 'math-go-rpg-test.json', mimeType: 'application/json', buffer: Buffer.from(typeof contents === 'string' ? contents : JSON.stringify(contents)) });
  await target.locator('#dialog[open]').waitFor();
}
async function confirmImport(contents, target = page) {
  await importFile(contents, target);
  await action('confirm-import', target).click();
}
async function downloadState(target = page) {
  const waiting = target.waitForEvent('download');
  await action('export', target).first().click();
  const download = await waiting;
  assert.match(download.suggestedFilename(), /^math-go-.*\.json$/);
  return JSON.parse(await readFile(await download.path(), 'utf8'));
}
async function holdKey(key, milliseconds, target = page) {
  await target.keyboard.down(key);
  await target.waitForTimeout(milliseconds);
  await target.keyboard.up(key);
}
async function worldPosition(target = page) {
  return target.locator('#world-canvas').evaluate(canvas => ({ x: Number(canvas.dataset.playerX), y: Number(canvas.dataset.playerY) }));
}
async function charge(target = page) {
  if (!await target.locator('#battle-answer').count()) await action('charge', target).first().click();
  const state = await save(target);
  await target.locator('#battle-answer').fill(String(state.battle.question.answer));
  await target.locator('#charge-magic').click();
}
async function cast(spellId, targetId, target = page) {
  const captureAnimation = !animationCaptured && spellId !== 'guard';
  if (captureAnimation) await target.emulateMedia({ reducedMotion: 'no-preference' });
  await target.locator(`[data-action="select-spell"][data-id="${spellId}"]`).click();
  if (targetId && targetId !== 'all') await target.locator(`[data-action="target"][data-id="${targetId}"]`).click();
  else await target.locator('#cast-spell').click();
  await target.locator('.spell-flight').waitFor({ state: 'attached' });
  if (captureAnimation) {
    await target.waitForTimeout(480);
    await target.screenshot({ path: '/tmp/math-go-rpg-spell-animation.png', fullPage: true });
    await target.waitForTimeout(650);
    await target.emulateMedia({ reducedMotion: 'reduce' });
    animationCaptured = true;
  } else await target.waitForTimeout(120);
}
function available(state, effect = 'damage') {
  const actor = state.battle.allies.find(unit => unit.id === state.battle.activeId);
  return knownSpells(state, actor.id).map(spell => typeof spell === 'string' ? SPELLS.find(item => item.id === spell) : spell)
    .filter(spell => (effect === 'damage' ? ['damage', 'drain', 'burn'].includes(spell.effect) : spell.effect === effect) && !actor.cooldowns[spell.id]);
}
async function finishBattle(target = page) {
  for (let turn = 0; turn < 80; turn += 1) {
    let state = await save(target);
    if (!state.battle) return state;
    const injured = state.battle.allies.filter(unit => unit.hp > 0).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    const visible = new Set(await target.locator('[data-action="select-spell"]').evaluateAll(buttons => buttons.map(button => button.dataset.id)));
    const heal = injured.hp < injured.maxHp * .6 ? available(state, 'heal').find(spell => visible.has(spell.id)) : null;
    const spell = heal || available(state).filter(spell => visible.has(spell.id)).sort((a, b) => b.power / Math.max(1, b.cost) - a.power / Math.max(1, a.cost))[0];
    assert.ok(spell, 'Every active party member must have a usable attack');
    while (state.battle.mana < spell.cost) { await charge(target); state = await save(target); }
    const targetId = heal ? injured.id : spell.target === 'all' ? 'all' : state.battle.enemies.find(unit => unit.hp > 0).id;
    await cast(spell.id, targetId, target);
  }
  assert.fail('Battle did not finish within 80 actions');
}
function legacyFixture() {
  let state = createLegacySave({ name: 'Legacy Explorer', starter: 'sprig', topic: 'add2' });
  state.xp = 240;
  state.coins = 200;
  state.completed = ['fern-1', 'fern-2', 'fern-3'];
  state.collection = ['sprig', 'brook', 'breeze'];
  state.equipped = 'brook';
  state.gear = 'moss';
  state.ownedGear.push('moss');
  state = beginLegacyBattle(state, 'river', 'river-1');
  return legacyAnswer(state, state.battle.question.answer + 1).state;
}

try {
  browser = await playwright.chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const context = await browser.newContext({ viewport: { width: 1360, height: 920 }, acceptDownloads: true, reducedMotion: 'reduce' });
  context.setDefaultTimeout(10_000);
  page = await context.newPage();
  watch(page);
  await page.goto(`${base}/games/math-go/`);
  await page.waitForLoadState('networkidle');
  assert.match(await page.title(), /Math Go/);
  await page.locator('#access-code').fill('lucas');
  await page.locator('#gate-form button[type="submit"]').click();
  assert.equal(await page.locator('#setup-form').count(), 0, 'Incorrect code cannot open setup');
  await unlock();
  await createExplorer('RPG Explorer');
  const initial = await save();
  assert.equal(initial.version, 2, 'RPG uses a new versioned save');
  assert.equal(initial.player.name, 'RPG Explorer');
  await noOverflow('Desktop RPG');
  await page.locator('#world-canvas').waitFor();
  await page.waitForTimeout(1600);
  const spawn = await worldPosition();
  assert.ok(Number.isFinite(spawn.x) && Number.isFinite(spawn.y));
  // Exercise the real keyboard input guard while the world renderer is alive.
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'qa-typing-field'; input.setAttribute('aria-label', 'Typing focus check');
    input.style.cssText = 'position:fixed;left:0;top:0;z-index:9999'; document.body.append(input); input.focus();
  });
  await holdKey('ArrowRight', 250);
  await page.locator('#qa-typing-field').fill('wasd');
  assert.deepEqual(await worldPosition(), spawn, 'Typing and arrow keys in an input must not move the explorer');
  await page.evaluate(() => document.querySelector('#qa-typing-field').remove());
  await page.locator('#world-canvas').focus();
  await holdKey('ArrowUp', 250);
  const moved = await worldPosition();
  assert.ok(moved.y < spawn.y - 20, 'ArrowUp must move the on-screen explorer');
  await holdKey('ArrowDown', 250);
  await page.screenshot({ path: '/tmp/math-go-rpg-world-desktop.png', fullPage: true });
  await holdKey('ArrowRight', 1600);
  await page.locator('.battle-page').waitFor();
  let battle = await save();
  assert.equal(battle.battle.encounterId, 'fern-1', 'Walking into a visible enemy must start its battle');
  assert.deepEqual(battle.battle.allies.map(unit => unit.id), ['hero', 'sprig']);
  assert.equal(battle.battle.mana, 0);
  const dockSpells = page.locator('[data-action="select-spell"]');
  assert.ok(await dockSpells.count() <= 4, 'Battle dock intentionally shows no more than four spells');
  for (const button of await dockSpells.all()) if (await button.getAttribute('data-id') !== 'guard') assert.ok(await button.isDisabled(), 'Damage spells must require math-charged mana');
  assert.ok(await page.locator('#cast-spell').isDisabled());
  const hpBeforeGuard = battle.battle.enemies.map(unit => unit.hp);
  await cast('guard', 'hero');
  battle = await save();
  assert.deepEqual(battle.battle.enemies.map(unit => unit.hp), hpBeforeGuard, 'Free defensive action cannot damage enemies');
  assert.equal(battle.battle.mana, 0);
  assert.equal(battle.stats.answered, 0);
  assert.equal(battle.battle.activeId, 'sprig', 'Companion must receive its own real turn');
  const beforeWrong = battle;
  await page.locator('#battle-answer').fill(String(battle.battle.question.answer + 1));
  await page.locator('#charge-magic').click();
  let wrong = await save();
  assert.equal(wrong.battle.mana, 0);
  assert.deepEqual(wrong.battle.allies.map(unit => unit.hp), beforeWrong.battle.allies.map(unit => unit.hp));
  assert.deepEqual(wrong.battle.enemies.map(unit => unit.hp), beforeWrong.battle.enemies.map(unit => unit.hp));
  assert.equal(wrong.battle.question.id, beforeWrong.battle.question.id);
  assert.equal(wrong.battle.activeId, 'sprig');
  assert.equal(wrong.stats.answered, 1);
  await page.locator('#battle-answer').fill(String(battle.battle.question.answer + 2));
  await page.locator('#charge-magic').click();
  assert.equal((await save()).stats.answered, 1, 'Repeated mistakes count as one question');
  await page.reload();
  assert.equal((await save()).battle.question.id, beforeWrong.battle.question.id, 'Question and attempt marker survive reload');
  await charge();
  const charged = await save();
  assert.equal(charged.battle.mana, 6);
  assert.equal(charged.stats.correct, 0, 'Retrying correctly does not erase first-try history');
  assert.equal(charged.battle.activeId, 'sprig', 'Charging does not consume a teammate turn');
  await cast('vine', 'enemy-1');
  const petHit = await save();
  assert.ok(petHit.battle.enemies[0].hp < charged.battle.enemies[0].hp, 'The dinosaur itself must damage the selected target');
  assert.equal(petHit.battle.mana, 3, 'Casting spends shared mana');
  assert.match(await page.locator('.battle-log').textContent(), /Sprig casts Vine Lash/);
  await noOverflow('Desktop party battle');
  await page.screenshot({ path: '/tmp/math-go-rpg-battle-desktop.png', fullPage: true });
  const firstWin = await finishBattle();
  assert.ok(firstWin.completed.includes('fern-1'));
  console.log('PASS keyboard exploration, focused-input guard, visible encounter, real pet turn, math-only damage resource, retries, reload, and first win');

  // A valid imported adventure exercises three-character combat and a level boundary.
  let teamFixture = createGame({ name: 'Team Explorer', starter: 'sprig', topic: 'mul' });
  teamFixture.xp = 90;
  teamFixture.coins = 180;
  teamFixture.collection.push('brook'); teamFixture.party.push('brook');
  teamFixture = startBattle(normalizeGame(teamFixture), 'fern-2');
  await confirmImport(teamFixture);
  assert.equal(await page.evaluate(() => window.scrollY), 0, 'Importing a battle must reveal its heading above the sticky mobile navigation');
  assert.equal(await page.locator('.party-side .battle-unit').count(), 3);
  assert.equal(await page.locator('.enemy-side .battle-unit').count(), 2);
  for (const actorId of ['hero', 'sprig', 'brook']) {
    let current = await save();
    assert.equal(current.battle.activeId, actorId);
    if (current.battle.mana < 2) await charge();
    current = await save();
    const visible = new Set(await page.locator('[data-action="select-spell"]').evaluateAll(buttons => buttons.map(button => button.dataset.id)));
    const attack = knownSpells(current, actorId).find(spell => spell.target === 'enemy' && visible.has(spell.id));
    assert.ok(attack, `${actorId} must have a focused spell in the four-card dock`);
    while (current.battle.mana < attack.cost) { await charge(); current = await save(); }
    const targetId = actorId === 'sprig' ? 'enemy-1' : 'enemy-2';
    const selectedBefore = current.battle.enemies.find(unit => unit.id === targetId).hp;
    const otherBefore = current.battle.enemies.find(unit => unit.id !== targetId).hp;
    await cast(attack.id, targetId);
    const after = await save();
    assert.ok(after.battle.enemies.find(unit => unit.id === targetId).hp < selectedBefore);
    assert.equal(after.battle.enemies.find(unit => unit.id !== targetId).hp, otherBefore, 'Single-target spells must only hit the selected enemy');
  }
  assert.equal((await save()).battle.round, 2);
  const levelWin = await finishBattle();
  assert.ok(levelWin.completed.includes('fern-2'));
  assert.equal(getLevel(levelWin), 2);
  assert.match(await page.locator('.result-page').textContent(), /Level up/);
  assert.match(await page.locator('.unlock-box').textContent(), /Moonlit Mend/);
  await navigate('spells');
  assert.ok(await page.locator('.spell-book-card').count() >= 18);
  assert.ok(await page.locator('.spell-book-card.locked').count() > 0);
  console.log('PASS hero plus two active dinosaur turns, explicit target choice, round transition, XP level-up, and unlocked spellbook');

  let healing = createGame({ name: 'Healing Explorer', starter: 'brook', topic: 'sub2' });
  healing.xp = 200; healing.collection.push('sprig'); healing.party.push('sprig');
  healing = startBattle(normalizeGame(healing), 'fern-2');
  healing.battle.allies.find(unit => unit.id === 'brook').hp -= 50;
  await confirmImport(healing);
  await charge();
  const healingVisible = new Set(await page.locator('[data-action="select-spell"]').evaluateAll(buttons => buttons.map(button => button.dataset.id)));
  const healingSpell = knownSpells(await save(), 'hero').find(spell => ['heal', 'regen'].includes(spell.effect) && healingVisible.has(spell.id));
  assert.ok(healingSpell, 'The compact dock keeps one healing spell available');
  const hurtHp = (await save()).battle.allies.find(unit => unit.id === 'brook').hp;
  await cast(healingSpell.id, 'brook');
  let healed = await save();
  assert.ok(healed.battle.allies.find(unit => unit.id === 'brook').hp > hurtHp, 'Healing must restore the selected ally');
  assert.ok(healed.battle.allies[0].cooldowns[healingSpell.id] > 0);
  await cast('guard', 'brook');
  await cast('guard', 'sprig');
  healed = await save();
  assert.equal(healed.battle.activeId, 'hero');
  assert.ok(await page.locator(`[data-action="select-spell"][data-id="${healingSpell.id}"]`).isDisabled(), 'Healing cooldown must prevent immediate reuse on the next hero turn');
  const exportBefore = await save();
  await navigate('camp');
  const exported = await downloadState();
  assert.deepEqual(exported, exportBefore, 'Download includes the full party battle, cooldowns, question, and world state');
  const unchanged = await save();
  for (const invalid of ['{broken', '{"format":"math-go","version":99}', JSON.stringify({ ...exported, player: { ...exported.player, name: '<script>' } })]) {
    await importFile(invalid);
    assert.match(await page.locator('#dialog-title').textContent(), /Could not import/);
    assert.deepEqual(await save(), unchanged);
    await action('close-dialog').click();
  }
  await importFile(exported);
  assert.deepEqual(await save(), unchanged, 'Choosing a file does not replace progress before confirmation');
  await action('close-dialog').click();
  await confirmImport(exported);
  assert.deepEqual(await save(), exported);
  await page.reload();
  assert.deepEqual(await save(), exported, 'Imported active battle survives refresh');
  await navigate('camp');
  await page.locator('#practice-topic').selectOption('area');
  await page.locator('#settings-form button[type="submit"]').click();
  assert.equal((await save()).battle.question.id, exported.battle.question.id, 'Topic change preserves the current saved puzzle');
  await navigate('world');
  await page.locator('.battle-page').waitFor();
  console.log('PASS targeted healing and cooldown, downloaded JSON, invalid import protection, confirmation/cancel, reload, settings, and returning to an active battle');

  const legacy = legacyFixture();
  await confirmImport(legacy);
  const migrated = await save();
  assert.equal(migrated.version, 2);
  assert.equal(migrated.xp, legacy.xp);
  assert.equal(migrated.coins, legacy.coins);
  assert.equal(migrated.gear, legacy.gear);
  assert.deepEqual(migrated.collection, legacy.collection);
  assert.deepEqual(migrated.completed, legacy.completed);
  assert.deepEqual(migrated.stats, legacy.stats);
  assert.equal(migrated.battle, null, 'Legacy solo battle safely returns to exploration');
  await page.locator('[data-action="travel"][data-id="river"]').click();
  await page.waitForTimeout(100);
  assert.equal((await save()).world.regionId, 'river', 'Fast travel must not be overwritten by the old world renderer during cleanup');
  assert.equal(await page.locator('#world-canvas').getAttribute('data-region'), 'river');
  await navigate('camp');
  const migratedDownload = await downloadState();
  assert.equal(migratedDownload.version, 2);
  await action('lock').click(); await unlock();
  assert.deepEqual(await save(), migratedDownload);
  console.log('PASS legacy v1 JSON migration preserves earned progress and lock/unlock');

  const upgradeContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await upgradeContext.addInitScript(oldSave => localStorage.setItem('math-go-save-v1', JSON.stringify(oldSave)), legacy);
  const upgradePage = await upgradeContext.newPage(); watch(upgradePage);
  await upgradePage.goto(`${base}/games/math-go/`); await unlock(upgradePage);
  const automaticMigration = await save(upgradePage);
  assert.equal(automaticMigration.version, 2);
  assert.deepEqual(automaticMigration.stats, legacy.stats);
  assert.deepEqual(automaticMigration.completed, legacy.completed);
  assert.equal(automaticMigration.coins, legacy.coins);
  assert.equal(await upgradePage.locator('#setup-form').count(), 0, 'An existing browser save must migrate without requiring new setup');
  await upgradeContext.close();
  console.log('PASS automatic browser-save upgrade from v1');

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  mobile.setDefaultTimeout(10_000);
  const phone = await mobile.newPage(); watch(phone);
  await phone.goto(`${base}/games/math-go/`); await unlock(phone); await createExplorer('Touch Explorer', phone);
  await phone.locator('#world-canvas').waitFor();
  await noOverflow('Mobile world', phone);
  const phoneBefore = await worldPosition(phone);
  const down = phone.locator('[data-direction="down"]');
  await down.dispatchEvent('pointerdown', { pointerId: 7, pointerType: 'touch', isPrimary: true });
  await phone.waitForTimeout(400);
  await down.dispatchEvent('pointerup', { pointerId: 7, pointerType: 'touch', isPrimary: true });
  const phoneAfter = await worldPosition(phone);
  assert.ok(phoneAfter.y > phoneBefore.y + 25, 'Touch D-pad moves the explorer');
  await phone.waitForTimeout(180);
  assert.deepEqual(await worldPosition(phone), phoneAfter, 'Releasing D-pad stops movement');
  await phone.screenshot({ path: '/tmp/math-go-rpg-world-mobile.png', fullPage: true });
  await confirmImport(exported, phone);
  await noOverflow('Mobile party battle', phone);
  await phone.screenshot({ path: '/tmp/math-go-rpg-battle-mobile.png', fullPage: true });
  for (const screen of ['party', 'spells', 'journal', 'camp']) { await navigate(screen, phone); await noOverflow(`Mobile ${screen}`, phone); }
  await phone.setViewportSize({ width: 320, height: 740 });
  for (const screen of ['world', 'party', 'spells', 'journal', 'camp']) { await navigate(screen, phone); await noOverflow(`Small phone ${screen}`, phone); }
  await mobile.close();
  console.log('PASS touch movement/release and 390px/320px party, spellbook, journal, camp layouts');

  await confirmImport(exported);
  await navigate('camp');
  const other = await context.newPage();
  await other.goto(`${base}/games/math-go/`);
  const changedElsewhere = { ...exported, topic: 'fractions' };
  await other.evaluate(next => localStorage.setItem('math-go-save-v2', JSON.stringify(next)), changedElsewhere);
  await page.locator('.notice').filter({ hasText: 'Another tab' }).waitFor();
  await page.locator('#practice-topic').selectOption('time');
  await page.locator('#settings-form button[type="submit"]').click();
  assert.deepEqual(await save(), changedElsewhere, 'Old tab must not overwrite another explorer’s newer save');
  const memory = await downloadState();
  assert.equal(memory.topic, 'time', 'Conflict permits progress and download in this tab’s memory');
  await action('lock').click(); await unlock();
  assert.equal((await downloadState()).topic, 'time', 'Locking preserves unsaved conflicting progress');
  await other.close();
  console.log('PASS conflicting tabs preserve both adventures and lock keeps unsaved memory');

  assert.deepEqual(errors, [], 'No browser errors or missing assets');
  await context.close();
  console.log('Math Go RPG browser checks passed.');
} catch (error) {
  if (page && !page.isClosed()) await page.screenshot({ path: '/tmp/math-go-rpg-failure.png', fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
