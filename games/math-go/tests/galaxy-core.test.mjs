import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, normalizeGame, parseGame, serializeGame, customizeExplorer, knownSpells, WEAPONS,
  startBattle, castSpell, captureEnemy, captureInfo, setParty, enemyIntent, isRegionUnlocked,
  REGIONS, DINOS, ENCOUNTERS, updatePosition,
} from '../rpg-core.mjs';
const fresh = () => createGame({ name: 'Galaxy Scout', starter: 'brook', topic: 'mul' });
function advanced(regionId, xp = 1400) {
  let state = fresh(); state.xp = xp;
  const index = REGIONS.findIndex((item) => item.id === regionId);
  state.completed = [...REGIONS.slice(0, index).flatMap((item) => item.encounterIds), ...REGIONS[index].encounterIds.slice(0, 2)];
  state.collection = ['brook', ...DINOS.filter((item) => item.unlockHabitat && state.completed.includes(`${item.unlockHabitat}-3`)).map((item) => item.id)];
  state = normalizeGame(state);
  return updatePosition(state, { regionId, x: 220, y: 760 });
}

test('appearance and weapon choices survive export, and each weapon exposes distinct signatures', () => {
  let state = fresh(); state.xp = 700;
  const look = { hair: 'ponytail', hairColor: 'violet', outfit: 'space', color: 'rust' };
  const original = serializeGame(state);
  for (const weapon of WEAPONS) {
    const changed = customizeExplorer(state, look, weapon.id);
    assert.deepEqual(changed.appearance, look);
    const spells = knownSpells(changed).map((item) => item.id);
    for (const id of weapon.signatures) assert.ok(spells.includes(id));
    for (const other of WEAPONS.filter((item) => item.id !== weapon.id)) for (const id of other.signatures) assert.ok(!spells.includes(id));
    assert.ok(spells.includes('spark') && spells.includes('guard') && spells.includes('mend') && spells.includes('gentle-tap'));
    assert.deepEqual(parseGame(serializeGame(changed)), changed);
  }
  assert.equal(serializeGame(state), original);
  assert.throws(() => customizeExplorer(fresh(), look, 'stormbow'), /weapon/);
  assert.throws(() => customizeExplorer(startBattle(state, 'fern-1'), look, 'staff'), /map/);
  assert.throws(() => customizeExplorer(state, { ...look, hair: '<script>' }), /hairstyle/);
  assert.throws(() => customizeExplorer(state, { ...look, unexpected: true }), /appearance/);
});

test('capture eligibility, failed attempts, successful capture and party selection are real saved rules', () => {
  let state = startBattle(fresh(), 'fern-2'); state.battle.mana = 12;
  assert.equal(captureInfo(state, 'enemy-2').available, false);
  state.battle.enemies[1].hp = 8;
  state.battle.enemies[1].shield = 1;
  assert.match(captureInfo(state, 'enemy-2').reason, /shield/);
  state.battle.enemies[1].shield = 0;
  assert.equal(captureInfo(state, 'enemy-2').chance, 85);
  const before = serializeGame(state);
  const failed = captureEnemy(state, 'enemy-2', () => .99);
  assert.equal(failed.capture.success, false);
  assert.equal(failed.state.battle.activeId, 'brook');
  assert.equal(failed.state.battle.mana, 9);
  assert.equal(failed.state.battle.enemies[1].hp, 8);
  assert.equal(failed.state.collection.includes('pebble'), false);
  assert.equal(captureInfo(failed.state, 'enemy-2').chance, 95);
  const result = captureEnemy(parseGame(serializeGame(failed.state)), 'enemy-2', () => 0);
  assert.equal(result.capture.success, true);
  assert.ok(result.state.collection.includes('pebble'));
  assert.ok(result.state.caught.includes('pebble'));
  assert.ok(result.state.battle.captured.includes('enemy-2'));
  assert.equal(result.state.battle.enemies[1].hp, 0);
  assert.equal(result.timeline[0].kind, 'capture');
  assert.ok(!result.timeline.some((frame) => frame.casterId === 'enemy-2'));
  assert.deepEqual(parseGame(serializeGame(result.state)), result.state);
  assert.equal(serializeGame(state), before);
  assert.throws(() => captureEnemy(result.state, 'enemy-2'), /still in battle/);
  const resting = { ...result.state, battle: null };
  assert.deepEqual(setParty(resting, ['pebble', 'brook']).party, ['pebble', 'brook']);
  assert.throws(() => setParty(resting, ['nova']), /party|friend/);
});

test('capturing the last opponent completes an encounter and rewards it exactly once', () => {
  let state = startBattle(fresh(), 'fern-1'); state.battle.mana = 3; state.battle.enemies[0].hp = 1;
  const result = captureEnemy(state, 'enemy-1', () => 0);
  assert.equal(result.outcome, 'win');
  assert.ok(result.state.completed.includes('fern-1'));
  assert.ok(result.state.collection.includes('sprig'));
  assert.equal(result.state.xp, 85);
  assert.deepEqual(parseGame(serializeGame(result.state)), result.state);
  const replay = startBattle(result.state, 'fern-1'); replay.battle.enemies[0].hp = 1;
  assert.match(captureInfo(replay, 'enemy-1').reason, /already/);
});

test('Gentle Tap cannot knock out a capture target, even at maximum level', () => {
  let state = fresh(); state.xp = 5000; state = startBattle(state, 'fern-1'); state.battle.mana = 12;
  const result = castSpell(state, 'gentle-tap', 'enemy-1');
  assert.equal(result.state.battle.enemies[0].hp, 1);
  assert.equal(captureInfo(result.state, 'enemy-1').chance, 85);
  assert.equal(result.state.battle.mana, 11);
  const burning = structuredClone(state);
  burning.battle.enemies[0].hp = 1;
  burning.battle.enemies[0].shield = 2;
  burning.battle.enemies[0].status.burn = 2;
  burning.battle.acted = ['hero']; burning.battle.activeId = 'brook';
  const calm = castSpell(burning, 'gentle-tap', 'enemy-1');
  assert.equal(calm.state.battle.enemies[0].hp, 1, 'Calming embers preserves the target through the enemy round');
  assert.equal(calm.state.battle.enemies[0].shield, 0);
  assert.equal(calm.state.battle.enemies[0].status.burn, 0);
  assert.equal(captureInfo(calm.state, 'enemy-1').available, true);
});

test('star gates open from the stated guardians and fresh-world content is reachable', () => {
  const state = fresh();
  assert.equal(isRegionUnlocked(state, 'luna'), false);
  assert.equal(isRegionUnlocked({ ...state, completed: ['fern-1', 'fern-2', 'fern-3'] }, 'luna'), true);
  assert.equal(isRegionUnlocked({ ...state, completed: ['fern-1', 'fern-2', 'fern-3'] }, 'cinder'), false);
  for (const id of ['luna', 'cinder', 'zephyr']) {
    const opened = advanced(id);
    assert.ok(isRegionUnlocked(opened, id));
    assert.doesNotThrow(() => startBattle(opened, `${id}-3`));
    assert.deepEqual(parseGame(serializeGame(opened)), opened);
  }
  for (const pet of DINOS.filter((item) => item.planet !== 'bramble')) assert.ok(ENCOUNTERS.some((fight) => fight.dinoIds.includes(pet.id)));
});

test('new bosses have visible schedules, enrage and uncapturable guardian roles', () => {
  for (const id of ['luna', 'cinder', 'zephyr']) {
    let state = startBattle(advanced(id), `${id}-3`);
    const boss = state.battle.enemies[0], area = REGIONS.find((item) => item.id === id);
    assert.equal(boss.name, area.bossName);
    state.battle.round = area.bossPeriod;
    assert.equal(enemyIntent(state.battle, boss).name, area.bossMove);
    assert.equal(enemyIntent(state.battle, boss).roar, true);
    boss.hp = Math.floor(boss.maxHp / 2);
    assert.equal(enemyIntent(state.battle, boss).enraged, true);
    assert.match(captureInfo(state, boss.id).reason, /Guardians/);
    state.battle.acted = ['hero']; state.battle.activeId = 'brook';
    const result = castSpell(state, 'guard');
    assert.ok(result.timeline.some((frame) => frame.name === `${area.bossMove}!`));
    assert.ok(result.state.battle.allies[0].hp < state.battle.allies[0].hp);
  }
});

test('old version 2 saves get defaults; forged captures and malformed new fields fail safely', () => {
  const veteran = fresh(); veteran.xp = 5000;
  const old = startBattle(veteran, 'fern-1');
  delete old.appearance; delete old.weapon; delete old.caught; delete old.battle.captureAttempts; delete old.battle.captured;
  const migrated = parseGame(JSON.stringify(old));
  assert.equal(migrated.battle.allies[0].level, 20, 'The existing level cap preserves veteran battle statistics');
  assert.equal(migrated.appearance.hair, 'hat'); assert.equal(migrated.weapon, 'staff'); assert.deepEqual(migrated.caught, []);
  for (const mutate of [
    (s) => { s.caught = ['nova']; s.collection.push('nova'); },
    (s) => { s.caught = ['sprig']; },
    (s) => { s.battle.captureAttempts = { 'enemy-1': -1 }; },
    (s) => { s.battle.captureAttempts = { 'enemy-9': 2 }; },
    (s) => { s.battle.captured = ['enemy-1']; },
    (s) => { s.appearance.outfit = 'unknown'; },
    (s) => { s.completed.push('luna-1'); },
  ]) { const changed = structuredClone(migrated); mutate(changed); assert.throws(() => normalizeGame(changed)); }
});

test('new wild species become playable companions with saved elemental spells', () => {
  for (const [regionId, id] of [['luna', 'nova'], ['cinder', 'aurora'], ['zephyr', 'fernix']]) {
    let state = startBattle(advanced(regionId), `${regionId}-1`);
    state.battle.mana = 3; state.battle.enemies[0].hp = 1;
    const result = captureEnemy(state, 'enemy-1', () => 0);
    assert.ok(result.state.collection.includes(id));
    assert.ok(result.state.caught.includes(id));
    const chosen = setParty({ ...result.state, battle: null }, [id, 'brook']);
    const rematch = startBattle(chosen, `${regionId}-1`);
    assert.equal(rematch.battle.allies[1].artId, id);
    assert.ok(knownSpells(rematch, id).some((spell) => spell.element === DINOS.find((pet) => pet.id === id).element));
    assert.deepEqual(parseGame(serializeGame(rematch)), rematch);
  }
});

test('the Tempest Crown heals on its advertised schedule and its enrage deals more damage', () => {
  const base = startBattle(advanced('zephyr'), 'zephyr-3');
  base.battle.acted = ['hero']; base.battle.activeId = 'brook';
  base.battle.round = 3; base.battle.enemies[0].hp = 100;
  const restored = castSpell(base, 'guard');
  assert.ok(restored.timeline.some((frame) => frame.name === 'Cloudlight renewal'));
  assert.equal(restored.state.battle.enemies[0].hp, 100 + Math.ceil(base.battle.enemies[0].maxHp * .08));
  base.battle.round = 2;
  const enraged = castSpell(base, 'guard');
  base.battle.enemies[0].hp = base.battle.enemies[0].maxHp;
  const calm = castSpell(base, 'guard');
  assert.ok(enraged.timeline[1].battle.allies[0].hp < calm.timeline[1].battle.allies[0].hp);
  assert.match(base.battle.log.join(' '), /every second round/);
});
