import test from 'node:test';
import assert from 'node:assert/strict';
import { createSave, beginBattle } from '../core.mjs';
import {
  ADOPTION_COST, SPELLS, DINOS, REGIONS, ENCOUNTERS, createGame, normalizeGame, parseGame, serializeGame,
  getLevel, heroStats, partyUnits, knownSpells, isRegionUnlocked, isEncounterUnlocked,
  startBattle, chargeMana, castSpell, fleeBattle, adoptDino, buyGear, equipGear, setParty,
  grantTreasure, talkToRanger, updatePosition, elementMultiplier,
} from '../rpg-core.mjs';

const game = (changes = {}) => normalizeGame({ ...createGame({ name: 'Lucas', starter: 'sprig', topic: 'mul' }), ...changes });
const clone = (value) => JSON.parse(JSON.stringify(value));
function charge(state) { return chargeMana(state, state.battle.question.answer, () => 0.4).state; }
function campaignBattle(state, encounterId) {
  state = startBattle(state, encounterId, () => 0.4);
  let result;
  for (let turns = 0; turns < 180 && state.battle; turns += 1) {
    if (state.battle.mana < 6) state = charge(state);
    const battle = state.battle;
    const actor = battle.allies.find((unit) => unit.id === battle.activeId);
    const spells = knownSpells(state, actor.id).filter((spell) => !(actor.cooldowns[spell.id] > 0) && spell.cost <= battle.mana);
    const wounded = battle.allies.filter((ally) => ally.hp > 0).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    let spell;
    let target;
    if (wounded.hp < wounded.maxHp * 0.55 && spells.some((item) => item.id === 'mend')) {
      spell = spells.find((item) => item.id === 'mend');
      target = wounded.id;
    } else {
      const enemy = battle.enemies.find((unit) => unit.hp > 0);
      spell = spells.filter((item) => ['damage', 'drain', 'burn'].includes(item.effect)).sort((a, b) => {
        const score = (item) => (item.power + actor.power) * (item.target === 'all' ? battle.enemies.filter((unit) => unit.hp > 0).reduce((sum, unit) => sum + elementMultiplier(item.element, unit.element), 0) : elementMultiplier(item.element, enemy.element));
        return score(b) - score(a);
      })[0];
      target = enemy.id;
    }
    assert.ok(spell, 'A legal tactical choice exists');
    result = castSpell(state, spell.id, target);
    state = parseGame(serializeGame(result.state));
  }
  assert.equal(result?.outcome, 'win', `Balanced party can win ${encounterId}`);
  return result;
}

test('new game, heroes, original roster, and 25 different spells', () => {
  const state = game();
  assert.equal(state.version, 2);
  assert.deepEqual(state.party, ['sprig']);
  assert.equal(state.world.x, 220);
  assert.equal(state.world.y, 760);
  assert.equal(partyUnits(state).length, 2);
  assert.equal(partyUnits(state)[0].id, 'hero');
  assert.equal(DINOS.length, 7);
  assert.equal(SPELLS.length, 25);
  assert.equal(new Set(SPELLS.map((spell) => spell.id)).size, 25);
  assert.ok(['fire', 'water', 'leaf'].every((element) => knownSpells(state, 'hero').some((spell) => spell.element === element)));
  assert.ok(knownSpells(state, 'sprig').every((spell) => ['neutral', 'leaf'].includes(spell.element)));
  assert.ok(SPELLS.filter((spell) => ['damage', 'burn', 'drain'].includes(spell.effect)).every((spell) => spell.cost >= 2));
  assert.deepEqual(parseGame(serializeGame(state)), state);
});

test('level progression really raises health, power, and learned spells', () => {
  const low = game();
  const high = game({ xp: 700 });
  assert.equal(getLevel(high), 8);
  assert.ok(heroStats(high).maxHp > heroStats(low).maxHp);
  assert.ok(heroStats(high).power > heroStats(low).power);
  assert.ok(partyUnits(high)[1].maxHp > partyUnits(low)[1].maxHp);
  assert.ok(knownSpells(high).some((spell) => spell.id === 'prism'));
  assert.ok(!knownSpells(low).some((spell) => spell.id === 'prism'));
  assert.equal(getLevel(game({ xp: 99999 })), 20);
});

test('legacy saves migrate without losing achievements, progress, currency, or stats', () => {
  const legacy = createSave({ name: 'Older Lucas', starter: 'brook', topic: 'add2' });
  legacy.xp = 840;
  legacy.coins = 222;
  legacy.completed = ENCOUNTERS.filter((encounter) => !encounter.roamer).map((encounter) => encounter.id);
  legacy.collection.push('sprig', 'breeze', 'bloom', 'crystal', 'ember');
  legacy.equipped = 'ember';
  legacy.ownedGear.push('sun');
  legacy.gear = 'sun';
  const migrated = normalizeGame(legacy);
  assert.equal(migrated.version, 2);
  for (const key of ['player', 'topic', 'xp', 'coins', 'completed', 'collection', 'equipped', 'gear', 'ownedGear', 'stats', 'settings']) assert.deepEqual(migrated[key], legacy[key]);
  assert.deepEqual(migrated.party, ['ember']);
  assert.equal(migrated.battle, null);
  const activeLegacy = beginBattle(createSave({ name: 'Lucas', starter: 'sprig' }), 'fern', 'fern-1');
  assert.equal(normalizeGame(activeLegacy).battle, null);
  assert.deepEqual(parseGame(serializeGame(migrated)), migrated);
});

test('wrong answers are gentle, count first attempts once, and correct answers charge shared mana', () => {
  const original = startBattle(game(), 'fern-1', () => 0.4);
  assert.equal(original.battle.mana, 0);
  assert.throws(() => castSpell(original, 'spark', 'enemy-1'), /mana/);
  let result = chargeMana(original, original.battle.question.answer + 1);
  assert.equal(result.correct, false);
  assert.equal(result.state.stats.answered, 1);
  assert.equal(result.state.battle.activeId, 'hero');
  assert.deepEqual(result.state.battle.allies, original.battle.allies);
  assert.deepEqual(result.state.battle.enemies, original.battle.enemies);
  result = chargeMana(result.state, original.battle.question.answer + 2);
  assert.equal(result.state.stats.answered, 1);
  result = chargeMana(result.state, original.battle.question.answer);
  assert.equal(result.state.battle.mana, 6);
  assert.equal(result.state.stats.answered, 1);
  assert.equal(result.state.stats.correct, 0);
  assert.equal(result.state.battle.question.attempted, false);
  result = chargeMana(result.state, result.state.battle.question.answer);
  assert.equal(result.state.battle.mana, 12);
  assert.equal(result.state.stats.correct, 1);
  assert.throws(() => charge(result.state), /full/);
  assert.equal(original.stats.answered, 0, 'Transition does not mutate its input');
});

test('party turn order includes hero and two pets, then enemies respond', () => {
  let state = game({ coins: 200 });
  state = adoptDino(state, 'brook');
  state = setParty(state, ['sprig', 'brook']);
  state = charge(startBattle(state, 'fern-2'));
  let result = castSpell(state, 'spark', 'enemy-1');
  assert.equal(result.state.battle.activeId, 'sprig');
  assert.equal(result.state.battle.allies[0].hp, result.state.battle.allies[0].maxHp);
  result = castSpell(result.state, 'spark', 'enemy-1');
  assert.equal(result.state.battle.activeId, 'brook');
  result = castSpell(result.state, 'spark', 'enemy-2');
  assert.equal(result.state.battle.activeId, 'hero');
  assert.equal(result.state.battle.round, 2);
  assert.deepEqual(result.state.battle.acted, []);
  assert.ok(result.state.battle.allies.some((ally) => ally.hp < ally.maxHp));
  assert.deepEqual(parseGame(serializeGame(result.state)), result.state);
});

test('element advantages affect damage and pets cannot cast another element', () => {
  assert.equal(elementMultiplier('fire', 'leaf'), 1.4);
  assert.equal(elementMultiplier('water', 'leaf'), 0.7);
  assert.equal(elementMultiplier('neutral', 'leaf'), 1);
  const state = charge(startBattle(game(), 'fern-1'));
  const fire = castSpell(state, 'ember', 'enemy-1');
  const water = castSpell(state, 'splash', 'enemy-1');
  assert.ok(fire.state.battle.enemies[0].hp < water.state.battle.enemies[0].hp);
  assert.equal(fire.state.battle.enemies[0].status.burn, 2);
  assert.ok(fire.events.some((event) => event.includes('Element advantage')));
  assert.throws(() => castSpell(water.state, 'ember', 'enemy-1'), /not learned/);
});

test('healing, shields, cooldowns, and active battle saves retain real tactical state', () => {
  let state = startBattle(game({ xp: 100 }), 'fern-2');
  state.battle.allies[0].hp -= 45;
  state = charge(state);
  const healed = castSpell(state, 'mend', 'hero');
  assert.equal(healed.state.battle.allies[0].hp, state.battle.allies[0].hp + 33);
  assert.equal(healed.state.battle.allies[0].cooldowns.mend, 2);
  state = castSpell(healed.state, 'guard').state;
  assert.equal(state.battle.allies[0].cooldowns.mend, 1);
  assert.throws(() => castSpell(state, 'mend', 'hero'), /cooling/);
  assert.ok(state.battle.allies[1].shield >= 0);
  assert.deepEqual(parseGame(serializeGame(state)), state);
  const ultimate = charge(startBattle(game({ xp: 700 }), 'fern-2'));
  // A high-level cooldown value of four is valid before the party round ends.
  ultimate.battle.enemies.forEach((enemy) => { enemy.shield = 200; });
  const prism = castSpell(ultimate, 'prism');
  assert.equal(prism.state.battle.allies[0].cooldowns.prism, 4);
  assert.doesNotThrow(() => serializeGame(prism.state));
});

test('downed teammates skip turns and cannot be healed without revival', () => {
  let state = charge(startBattle(game({ xp: 100 }), 'fern-2'));
  state.battle.allies[1].hp = 0;
  assert.throws(() => castSpell(state, 'mend', 'sprig'), /living teammate/);
  const result = castSpell(state, 'spark', 'enemy-1');
  assert.equal(result.state.battle.activeId, 'hero');
  assert.equal(result.state.battle.round, 2);
});

test('region gates, boss gates, and roamer encounters work without skipping the story', () => {
  const state = game();
  assert.ok(isRegionUnlocked(state, 'fern'));
  assert.ok(!isRegionUnlocked(state, 'river'));
  assert.ok(!isEncounterUnlocked(state, 'fern-3'));
  assert.throws(() => startBattle(state, 'fern-3'), /two trail/);
  assert.throws(() => startBattle(state, 'river-1'), /previous region/);
  const roamer = campaignBattle(state, 'fern-roam');
  assert.equal(roamer.reward.firstClear, false);
  assert.equal(roamer.state.completed.length, 0);
  assert.equal(roamer.state.xp, 30);
});

test('full campaign is winnable with mixed-element decisions and grants XP, friends, and unlocks', () => {
  let state = game();
  for (const region of REGIONS) {
    assert.ok(isRegionUnlocked(state, region.id));
    state = updatePosition(state, { regionId: region.id, x: 220, y: 760 });
    state = grantTreasure(state, `${region.id}-chest-1`);
    state = grantTreasure(state, `${region.id}-chest-2`);
    if (state.coins >= ADOPTION_COST && !state.collection.includes('brook')) {
      state = adoptDino(state, 'brook');
      state = setParty(state, ['sprig', 'brook']);
    }
    for (const encounterId of region.encounterIds) {
      const result = campaignBattle(state, encounterId);
      state = result.state;
      assert.ok(result.reward.firstClear);
      assert.ok(state.completed.includes(encounterId));
    }
    assert.ok(state.collection.includes(DINOS.find((dino) => dino.unlockHabitat === region.id).id));
    if (state.coins >= 180 && !state.ownedGear.includes('sun')) state = buyGear(state, 'sun');
  }
  assert.equal(state.completed.length, 12);
  assert.ok(getLevel(state) >= 14);
  assert.ok(knownSpells(state).some((spell) => spell.id === 'prism'));
  assert.ok(state.stats.correct > 0);
  assert.deepEqual(parseGame(serializeGame(state)), state);
  const replay = campaignBattle(state, 'summit-3');
  assert.equal(replay.reward.firstClear, false);
  assert.equal(replay.reward.creature, null);
  assert.equal(replay.reward.xp, 30);
});

test('all starters can finish the story without optional treasure, gear, or adoption', () => {
  for (const starter of ['sprig', 'brook', 'pebble']) {
    let state = createGame({ name: 'Explorer', starter });
    for (const region of REGIONS) {
      state = updatePosition(state, { regionId: region.id, x: 220, y: 760 });
      for (const encounterId of region.encounterIds) state = campaignBattle(state, encounterId).state;
    }
    assert.equal(state.completed.length, 12, `${starter} can complete the whole adventure`);
    assert.equal(state.ownedGear.length, 1);
    assert.equal(state.party.length, 2, 'First guardian automatically fills the second companion slot');
  }
});

test('guardian shield and team-wide roar are telegraphed and affect all living teammates', () => {
  let state = game({ completed: ['fern-1', 'fern-2'], xp: 170 });
  state = startBattle(state, 'fern-3');
  // Keep the guardian alive while moving through its first two rounds.
  for (let round = 1; round <= 2; round += 1) {
    state = charge(state);
    state = castSpell(state, round === 1 ? 'guard' : 'spark', 'enemy-1').state;
    const result = castSpell(state, round === 1 ? 'guard' : 'spark', 'enemy-1');
    state = result.state;
    if (round === 1) assert.ok(state.battle.enemies[0].shield > 0);
    if (round === 2) assert.ok(result.events.some((event) => event.includes('Warning:')));
  }
  assert.equal(state.battle.round, 3);
  state = charge(state);
  state = castSpell(state, 'spark', 'enemy-1').state;
  const result = castSpell(state, 'guard');
  assert.ok(result.events.filter((event) => event.includes('Guardian roar!')).length >= 2);
  assert.ok(result.events.some((event) => event.includes('blocked')));
});

test('losing and fleeing return safely to camp without erasing progress', () => {
  let state = charge(startBattle(game(), 'fern-2'));
  state.battle.allies.forEach((ally) => { ally.hp = 1; });
  state = castSpell(state, 'spark', 'enemy-1').state;
  const result = castSpell(state, 'spark', 'enemy-2');
  assert.equal(result.outcome, 'lose');
  assert.equal(result.state.battle, null);
  assert.equal(result.state.world.x, 220);
  assert.equal(result.state.stats.correct, 1);
  const fled = fleeBattle(startBattle(result.state, 'fern-1'));
  assert.equal(fled.battle, null);
  assert.equal(fled.world.y, 760);
  assert.deepEqual(fled.stats, result.state.stats);
});

test('treasures and ranger conversations are one-time discoveries; party and gear are constrained', () => {
  let state = grantTreasure(game(), 'fern-chest-1');
  assert.equal(state.coins, 30);
  assert.equal(state.xp, 20);
  assert.deepEqual(grantTreasure(state, 'fern-chest-1'), state);
  assert.throws(() => grantTreasure(state, 'river-chest-1'), /region/);
  state = talkToRanger(state, 'fern-ranger');
  assert.deepEqual(talkToRanger(state, 'fern-ranger'), state);
  assert.throws(() => adoptDino(state, 'brook'), /90/);
  assert.throws(() => buyGear(state, 'moss'), /80/);
  state.coins = 500;
  state = adoptDino(state, 'brook');
  assert.equal(state.coins, 410);
  state = setParty(state, ['brook', 'sprig']);
  assert.equal(state.equipped, 'brook');
  assert.throws(() => setParty(state, []), /party|friend/);
  assert.throws(() => setParty(state, ['brook', 'brook']), /party/);
  const hpBefore = heroStats(state).maxHp;
  state = buyGear(state, 'moss');
  assert.equal(heroStats(state).maxHp, hpBefore + 20);
  assert.equal(state.coins, 330);
  state = equipGear(state, 'field');
  assert.equal(heroStats(state).maxHp, hpBefore);
  state = startBattle(state, 'fern-1');
  assert.throws(() => setParty(state, ['sprig']), /map/);
  assert.throws(() => equipGear(state, 'moss'), /map/);
  assert.throws(() => grantTreasure(state, 'fern-chest-2'), /map/);
});

test('malformed saves fail safely: IDs, bounds, forged questions, party state, and metadata', () => {
  assert.throws(() => parseGame('not json'), /JSON/);
  assert.throws(() => parseGame(' '.repeat(512001)), /512/);
  const changes = [
    (s) => { s.version = 3; },
    (s) => { s.world.x = Infinity; },
    (s) => { s.world.regionId = 'river'; },
    (s) => { s.world.treasures = ['fern-chest-1', 'fern-chest-1']; },
    (s) => { s.player.name = '<img>'; },
    (s) => { s.xp = -1; },
    (s) => { s.party = ['ember']; },
    (s) => { s.extra = 'injected'; },
    (s) => { s.stats.correct = 1; },
    (s) => { s.collection.push('ember'); },
  ];
  for (const change of changes) {
    const state = game();
    change(state);
    assert.throws(() => normalizeGame(state));
  }
  const battleChanges = [
    (s) => { s.battle.question.answer += 1; },
    (s) => { s.battle.question.prompt = 'Forged prompt'; },
    (s) => { s.battle.mana = 13; },
    (s) => { s.battle.activeId = 'enemy-1'; },
    (s) => { s.battle.acted = ['hero']; },
    (s) => { s.battle.allies[0].maxHp += 1; },
    (s) => { s.battle.allies[0].hp = -1; },
    (s) => { s.battle.allies[0].cooldowns.fake = 1; },
    (s) => { s.battle.enemies[0].hp = 0; },
    (s) => { s.battle.log = ['<img>']; },
    (s) => { s.battle.question.attempted = true; },
  ];
  for (const change of battleChanges) {
    const state = startBattle(game(), 'fern-1');
    change(state);
    assert.throws(() => normalizeGame(state));
  }
});
