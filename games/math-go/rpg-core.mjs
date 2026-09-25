// Math Go: original, local-first party RPG. All transitions return fresh state.
import { TOPICS, DINOS as LEGACY_DINOS, HABITATS, GEARS, createQuestion, createSave, validateSave } from './core.mjs';
export { TOPICS, GEARS };

export const ADOPTION_COST = 90;
export const ELEMENTS = Object.freeze([
  { id: 'neutral', name: 'Arcane', color: '#b8a8ef', strongAgainst: null, weakAgainst: null },
  { id: 'leaf', name: 'Leaf', color: '#84c867', strongAgainst: 'water', weakAgainst: 'fire' },
  { id: 'water', name: 'Water', color: '#63c8ee', strongAgainst: 'fire', weakAgainst: 'leaf' },
  { id: 'fire', name: 'Fire', color: '#fa9871', strongAgainst: 'leaf', weakAgainst: 'water' },
  { id: 'stone', name: 'Stone', color: '#c5a382', strongAgainst: 'air', weakAgainst: 'sun' },
  { id: 'air', name: 'Air', color: '#bce1d6', strongAgainst: 'sun', weakAgainst: 'stone' },
  { id: 'sun', name: 'Sun', color: '#ffe185', strongAgainst: 'stone', weakAgainst: 'air' },
]);

export const DINOS = Object.freeze(LEGACY_DINOS.map((dino) => ({
  ...dino,
  element: dino.id === 'breeze' ? 'air' : dino.id === 'ember' ? 'fire' : dino.element,
  description: {
    sprig: 'A fearless fern triceratops. Leaf magic steals a little health back from foes.',
    brook: 'A gentle river longneck. Water spells wash away danger and restore friends.',
    pebble: 'A brave ankylosaurus. Sturdy armor and stone spells hold the front line.',
    breeze: 'A soaring pterosaur. Air spells sweep across an entire enemy team.',
    bloom: 'A flower-crested parasaurolophus. Water magic helps the whole team recover.',
    crystal: 'A shimmering stegosaurus. Crystal armor and heavy stone strikes stop foes.',
    ember: 'A golden-crested tyrannosaur. Fiery attacks leave glowing embers behind.',
  }[dino.id],
})));

export const REGIONS = Object.freeze(HABITATS.map((habitat, index) => ({
  id: habitat.id, name: habitat.name, subtitle: habitat.subtitle,
  description: habitat.description, element: ['leaf', 'water', 'stone', 'fire'][index],
  level: index * 3 + 1, bossId: `${habitat.id}-3`,
  encounterIds: habitat.encounters.map((encounter) => encounter.id),
})));

const teams = [
  [['sprig'], ['sprig', 'pebble'], ['breeze', 'sprig']],
  [['brook', 'bloom'], ['brook', 'sprig'], ['bloom', 'brook', 'pebble']],
  [['pebble', 'crystal'], ['crystal', 'breeze'], ['crystal', 'pebble', 'brook']],
  [['ember', 'breeze'], ['ember', 'crystal'], ['ember', 'crystal', 'breeze']],
];
export const ENCOUNTERS = Object.freeze(REGIONS.flatMap((region, index) => [
  ...HABITATS[index].encounters.map((encounter, stage) => ({
    id: encounter.id, regionId: region.id, name: encounter.name,
    description: encounter.boss ? 'Free the guardian from the drifting gloam and restore this beacon.' : 'Dispel the gloam surrounding these dinosaurs.',
    boss: encounter.boss, roamer: false, level: index * 3 + stage + 1,
    dinoIds: teams[index][stage],
  })),
  { id: `${region.id}-roam`, regionId: region.id, name: 'Wandering gloam pack', description: 'A repeatable wild encounter. Train your team and earn supplies.', boss: false, roamer: true, level: index * 3 + 2, dinoIds: teams[index][1] },
]));

function spell(id, name, element, power, cost, cooldown, target, effect, level, description) {
  return { id, name, element, power, cost, cooldown, target, effect, level, description };
}
export const SPELLS = Object.freeze([
  spell('spark', 'Spark Bolt', 'neutral', 15, 2, 0, 'enemy', 'damage', 1, 'An accurate arcane bolt. Reliable against every element.'),
  spell('guard', 'Guardian Bubble', 'neutral', 30, 0, 1, 'self', 'shield', 1, 'Shield yourself for the next enemy attacks. Costs no mana.'),
  spell('vine', 'Vine Lash', 'leaf', 21, 3, 0, 'enemy', 'drain', 1, 'Leaf damage. Restore health equal to one quarter of damage dealt.'),
  spell('splash', 'River Rush', 'water', 23, 3, 0, 'enemy', 'damage', 1, 'A rushing wave. Strong against fire, resisted by leaf.'),
  spell('ember', 'Ember Trail', 'fire', 19, 3, 1, 'enemy', 'burn', 1, 'Fire damage and two rounds of burning embers.'),
  spell('shard', 'Stone Shard', 'stone', 24, 3, 0, 'enemy', 'damage', 1, 'A heavy stone strike. Strong against air.'),
  spell('gust', 'Gust Arrow', 'air', 23, 3, 0, 'enemy', 'damage', 1, 'A swift blast of air. Strong against sun.'),
  spell('sunray', 'Sunray', 'sun', 23, 3, 0, 'enemy', 'damage', 1, 'A warm ray of sunlight. Strong against stone.'),
  spell('mend', 'Moonlit Mend', 'neutral', 30, 3, 1, 'ally', 'heal', 2, 'Restore a living teammate’s health. Choose who needs help.'),
  spell('ward', 'Crystal Ward', 'stone', 42, 2, 2, 'ally', 'shield', 2, 'Give a teammate a sturdy shield before a big attack.'),
  spell('petals', 'Petal Storm', 'leaf', 18, 4, 1, 'all', 'damage', 3, 'Swirling leaves strike every enemy.'),
  spell('rain', 'Healing Rain', 'water', 27, 4, 2, 'ally', 'regen', 3, 'Restore a friend now and for two more rounds.'),
  spell('flamefan', 'Flame Fan', 'fire', 17, 4, 2, 'all', 'burn', 3, 'A wide flame strikes and burns every enemy.'),
  spell('whirlwind', 'Whirlwind', 'air', 20, 4, 1, 'all', 'damage', 3, 'A playful whirlwind sweeps the enemy team.'),
  spell('boulder', 'Boulder Bounce', 'stone', 39, 4, 1, 'enemy', 'damage', 4, 'A powerful focused strike. Excellent against shielded foes.'),
  spell('tidal', 'Tidal Crash', 'water', 37, 4, 1, 'enemy', 'damage', 4, 'Gather the river into one powerful wave.'),
  spell('wildroot', 'Wildroot Grasp', 'leaf', 33, 4, 1, 'enemy', 'drain', 4, 'A mighty root attack that also restores your health.'),
  spell('solar', 'Solar Flare', 'sun', 22, 4, 1, 'all', 'damage', 4, 'Radiant sun magic reaches the whole enemy team.'),
  spell('inferno', 'Phoenix Spiral', 'fire', 29, 5, 2, 'all', 'burn', 6, 'A spiraling firebird scorches all enemies.'),
  spell('monsoon', 'Monsoon', 'water', 33, 5, 2, 'all', 'damage', 6, 'Call a great wave over the entire enemy team.'),
  spell('earthquake', 'Earth Drum', 'stone', 33, 5, 2, 'all', 'damage', 6, 'Stamp the ground and shake the whole enemy team.'),
  spell('forest', 'Forest Heart', 'leaf', 30, 5, 2, 'all', 'drain', 6, 'Ancient forest magic strikes every foe and restores you.'),
  spell('skyfall', 'Skyfall', 'air', 34, 5, 2, 'all', 'damage', 6, 'Bring a whole sky of shooting wind to battle.'),
  spell('daybreak', 'Daybreak', 'sun', 34, 5, 2, 'all', 'damage', 6, 'A brilliant dawn washes over the enemy team.'),
  spell('prism', 'Prismatic Comet', 'neutral', 43, 6, 3, 'all', 'damage', 8, 'Your ultimate spell: a rainbow comet strikes every foe.'),
]);

const STARTERS = ['sprig', 'brook', 'pebble'];
const CAMPAIGN = ENCOUNTERS.filter((encounter) => !encounter.roamer).map((encounter) => encounter.id);
const TREASURES = REGIONS.flatMap((region) => [1, 2].map((number) => `${region.id}-chest-${number}`));
const RANGERS = REGIONS.map((region) => `${region.id}-ranger`);
const REGION_IDS = REGIONS.map((region) => region.id);
const MAX_SAVE_LENGTH = 512_000;
const fail = (message) => { throw new Error(message); };
const integer = (value, min, max, label) => Number.isInteger(value) && value >= min && value <= max ? value : fail(`Invalid ${label}.`);
const choose = (value, allowed, label) => allowed.includes(value) ? value : fail(`Invalid ${label}.`);
function object(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value)) || Object.keys(value).some((key) => !allowed.includes(key))) fail(`Invalid ${label}.`);
  return value;
}
function list(value, allowed, label) {
  if (!Array.isArray(value) || value.length > allowed.length || new Set(value).size !== value.length || value.some((id) => !allowed.includes(id))) fail(`Invalid ${label}.`);
  return [...value];
}
function regionForId(id) { return REGION_IDS.find((region) => id.startsWith(`${region}-`)); }
function encounterFor(id) { return ENCOUNTERS.find((encounter) => encounter.id === id) || fail('Unknown encounter.'); }
function worldStart(regionId = 'fern') { return { regionId, x: 220, y: 760, treasures: [], talked: [] }; }

export function getLevel(state) { return Math.min(20, 1 + Math.floor(state.xp / 100)); }
export function isRegionUnlocked(state, id) {
  const index = REGION_IDS.indexOf(id);
  return index >= 0 && REGIONS.slice(0, index).every((region) => region.encounterIds.every((encounterId) => state.completed.includes(encounterId)));
}
export function isEncounterUnlocked(state, id) {
  const encounter = ENCOUNTERS.find((item) => item.id === id);
  return Boolean(encounter && isRegionUnlocked(state, encounter.regionId) && (!encounter.boss || REGIONS.find((region) => region.id === encounter.regionId).encounterIds.slice(0, 2).every((entry) => state.completed.includes(entry))));
}

export function heroStats(state) {
  const level = getLevel(state);
  const gear = GEARS.find((item) => item.id === state.gear) || GEARS[0];
  return { id: 'hero', name: state.player.name, artId: 'hero', element: 'neutral', maxHp: 110 + (level - 1) * 12 + gear.hpBonus, power: (level - 1) * 3 + gear.damageBonus, level };
}
function unit(stats) { return { ...stats, hp: stats.maxHp, shield: 0, cooldowns: {}, status: { burn: 0, regen: 0 } }; }
export function partyUnits(state) {
  const level = getLevel(state);
  return [unit(heroStats(state)), ...state.party.map((id) => {
    const dino = DINOS.find((item) => item.id === id);
    return unit({ id, artId: id, name: dino.name, element: dino.element, level, maxHp: 88 + (level - 1) * 10 + (dino.element === 'stone' ? 20 : 0), power: 3 + (level - 1) * 3 });
  })];
}
export function knownSpells(state, actorId = 'hero') {
  const element = actorId === 'hero' ? null : DINOS.find((dino) => dino.id === actorId)?.element;
  if (actorId !== 'hero' && (!state.party.includes(actorId) || !element)) return [];
  return SPELLS.filter((spell) => spell.level <= getLevel(state) && (actorId === 'hero' || spell.element === element || spell.element === 'neutral'));
}

function enemyUnits(encounter) {
  return encounter.dinoIds.map((id, index) => {
    const dino = DINOS.find((item) => item.id === id);
    const boss = encounter.boss && index === 0;
    return unit({ id: `enemy-${index + 1}`, artId: id, name: `${boss ? 'Gloam Guardian' : 'Gloam'} ${dino.name}`, element: dino.element, level: encounter.level, maxHp: 42 + encounter.level * 10 + (boss ? 55 : 0), power: 7 + encounter.level * 2 + (boss ? 4 : 0) });
  });
}

export function createGame({ name, starter, topic = 'mixed' }) {
  return normalizeGame({ ...createSave({ name, starter, topic }), version: 2, party: [starter], world: worldStart() });
}

function normalizeQuestion(question, state) {
  const sample = createSave({ name: state.player.name, starter: state.player.starter, topic: state.topic });
  sample.stats = state.stats;
  sample.battle = { habitatId: 'fern', encounterId: 'fern-1', enemyHp: 60, enemyMaxHp: 60, playerHp: 100, playerMaxHp: 100, question, turn: 1, selectedMove: 'strike' };
  return validateSave(sample).battle.question;
}

function normalizeUnits(rawUnits, templates, state, label) {
  if (!Array.isArray(rawUnits) || rawUnits.length !== templates.length) fail(`Invalid ${label}.`);
  return templates.map((template, index) => {
    const raw = object(rawUnits[index], ['id', 'artId', 'name', 'element', 'maxHp', 'power', 'level', 'hp', 'shield', 'cooldowns', 'status'], label);
    for (const key of ['id', 'artId', 'name', 'element', 'maxHp', 'power', 'level']) if (raw[key] !== template[key]) fail(`The saved ${label} do not match this party, equipment, or encounter.`);
    const isEnemy = template.id.startsWith('enemy-');
    object(raw.cooldowns, isEnemy ? [] : knownSpells(state, template.id).map((spell) => spell.id), 'spell cooldowns');
    const cooldowns = {};
    for (const [id, value] of Object.entries(raw.cooldowns)) cooldowns[id] = integer(value, 0, 4, 'spell cooldown');
    object(raw.status, ['burn', 'regen'], 'status effects');
    return { ...template, hp: integer(raw.hp, 0, template.maxHp, 'health'), shield: integer(raw.shield, 0, 200, 'shield'), cooldowns,
      status: { burn: integer(raw.status.burn, 0, 2, 'burn duration'), regen: integer(raw.status.regen, 0, 2, 'regeneration duration') } };
  });
}

export function normalizeGame(raw) {
  if (raw?.version === 1) {
    const legacy = validateSave(raw);
    return { ...legacy, version: 2, battle: null, party: [legacy.equipped], world: worldStart() };
  }
  object(raw, ['format', 'version', 'player', 'topic', 'xp', 'coins', 'completed', 'collection', 'equipped', 'gear', 'ownedGear', 'stats', 'settings', 'battle', 'party', 'world'], 'save file');
  if (raw.format !== 'math-go' || raw.version !== 2) fail('Choose a supported Math Go save file (version 1 or 2).');
  const { party: rawParty, world: rawWorld, ...legacyFields } = raw;
  // Reuse the original strict allowlist and progression/statistics validation.
  const state = { ...validateSave({ ...legacyFields, version: 1, battle: null }), version: 2 };
  state.party = list(rawParty, state.collection, 'adventure party');
  if (state.party.length < 1 || state.party.length > 2 || state.equipped !== state.party[0]) fail('Choose one or two collected companions for your party.');
  object(rawWorld, ['regionId', 'x', 'y', 'treasures', 'talked'], 'world position');
  const regionId = choose(rawWorld.regionId, REGION_IDS, 'region');
  if (!isRegionUnlocked(state, regionId)) fail('The explorer is in a locked region.');
  const coord = (value, max) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max ? value : fail('Invalid map coordinates.');
  state.world = { regionId, x: coord(rawWorld.x, 1600), y: coord(rawWorld.y, 1000), treasures: list(rawWorld.treasures, TREASURES, 'opened chests'), talked: list(rawWorld.talked, RANGERS, 'ranger conversations') };
  if ([...state.world.treasures, ...state.world.talked].some((id) => !isRegionUnlocked(state, regionForId(id)))) fail('A saved discovery is in a locked region.');
  if (raw.battle !== null) {
    const battle = object(raw.battle, ['encounterId', 'regionId', 'round', 'activeId', 'acted', 'mana', 'maxMana', 'question', 'allies', 'enemies', 'log'], 'battle');
    const encounter = encounterFor(battle.encounterId);
    if (!isEncounterUnlocked(state, encounter.id) || encounter.regionId !== battle.regionId || state.world.regionId !== battle.regionId) fail('The battle is not available in this region.');
    if (battle.maxMana !== 12) fail('Invalid maximum mana.');
    const allies = normalizeUnits(battle.allies, partyUnits(state), state, 'allies');
    const enemies = normalizeUnits(battle.enemies, enemyUnits(encounter), state, 'enemies');
    if (!allies.some((ally) => ally.hp > 0) || !enemies.some((enemy) => enemy.hp > 0)) fail('This battle has already ended.');
    const acted = list(battle.acted, allies.map((ally) => ally.id), 'turn order');
    const activeId = choose(battle.activeId, allies.filter((ally) => ally.hp > 0 && !acted.includes(ally.id)).map((ally) => ally.id), 'active teammate');
    if (!Array.isArray(battle.log) || battle.log.length > 8 || battle.log.some((line) => typeof line !== 'string' || line.length > 250 || /[<>\u0000-\u001f]/.test(line))) fail('Invalid battle log.');
    state.battle = { encounterId: encounter.id, regionId: encounter.regionId, round: integer(battle.round, 1, 10_000, 'battle round'), activeId, acted, mana: integer(battle.mana, 0, 12, 'mana'), maxMana: 12,
      question: normalizeQuestion(battle.question, state), allies, enemies, log: [...battle.log] };
  }
  return state;
}

export function parseGame(text) {
  if (typeof text !== 'string' || text.length > MAX_SAVE_LENGTH) fail('Choose a Math Go JSON save smaller than 512 KB.');
  let raw;
  try { raw = JSON.parse(text); } catch { fail('This is not a valid JSON save file.'); }
  return normalizeGame(raw);
}
export function serializeGame(state) { return JSON.stringify(normalizeGame(state), null, 2); }

function noBattle(state) { if (state.battle) fail('Return to the map before changing your party or equipment.'); }
export function updatePosition(raw, position) {
  const state = normalizeGame(raw);
  if (state.battle) fail('Finish or leave the battle before exploring.');
  return normalizeGame({ ...state, world: { ...state.world, ...position } });
}
export function grantTreasure(raw, id) {
  const state = normalizeGame(raw);
  noBattle(state);
  choose(id, TREASURES, 'treasure chest');
  if (regionForId(id) !== state.world.regionId || !isRegionUnlocked(state, regionForId(id))) fail('Explore this region to find its chest.');
  if (state.world.treasures.includes(id)) return state;
  state.world.treasures.push(id);
  state.coins += 30;
  state.xp += 20;
  return state;
}
export function talkToRanger(raw, id) {
  const state = normalizeGame(raw);
  noBattle(state);
  choose(id, RANGERS, 'ranger');
  if (regionForId(id) !== state.world.regionId) fail('Meet this ranger in their region first.');
  if (!state.world.talked.includes(id)) state.world.talked.push(id);
  return state;
}
export function setParty(raw, ids) {
  const state = normalizeGame(raw);
  noBattle(state);
  return normalizeGame({ ...state, party: ids, equipped: ids[0] });
}
export function adoptDino(raw, id) {
  const state = normalizeGame(raw);
  noBattle(state);
  choose(id, STARTERS, 'adoptable dinosaur');
  if (state.collection.includes(id)) fail('This dinosaur is already your friend.');
  if (state.coins < ADOPTION_COST) fail(`You need ${ADOPTION_COST} leaf coins to adopt this friend.`);
  state.coins -= ADOPTION_COST;
  state.collection.push(id);
  return state;
}
export function buyGear(raw, id) {
  const state = normalizeGame(raw);
  noBattle(state);
  const item = GEARS.find((gear) => gear.id === id) || fail('Unknown equipment.');
  if (state.ownedGear.includes(id)) fail('You already own this equipment.');
  if (state.coins < item.cost) fail(`You need ${item.cost} leaf coins for this equipment.`);
  state.coins -= item.cost;
  state.ownedGear.push(id);
  state.gear = id;
  return state;
}
export function equipGear(raw, id) {
  const state = normalizeGame(raw);
  noBattle(state);
  state.gear = choose(id, state.ownedGear, 'owned equipment');
  return state;
}

export function startBattle(raw, encounterId, rng = Math.random) {
  const state = normalizeGame(raw);
  if (state.battle) fail('Finish or leave your current battle first.');
  const encounter = encounterFor(encounterId);
  if (!isEncounterUnlocked(state, encounterId)) fail(encounter.boss ? 'Clear the two trail encounters before challenging the guardian.' : 'Restore the previous region to open this trail.');
  if (state.world.regionId !== encounter.regionId) fail('Travel to this encounter’s region first.');
  state.battle = { encounterId, regionId: encounter.regionId, round: 1, activeId: 'hero', acted: [], mana: 0, maxMana: 12,
    question: { ...createQuestion(state.topic, rng), attempted: false }, allies: partyUnits(state), enemies: enemyUnits(encounter),
    log: [encounter.boss ? 'The guardian prepares a team-wide roar every third round. Shield or heal your team!' : 'Answer a math question to charge mana. Your whole team shares this energy.'] };
  return state;
}

export function chargeMana(raw, answer, rng = Math.random) {
  const state = normalizeGame(raw);
  if (!state.battle) fail('Meet an enemy before charging battle mana.');
  integer(answer, 0, 1_000_000, 'whole-number answer');
  if (state.battle.mana === state.battle.maxMana) fail('Your mana is full. Choose a spell!');
  const question = state.battle.question;
  const correct = answer === question.answer;
  if (!question.attempted) {
    state.stats.answered += 1;
    const stats = state.stats.byTopic[question.topic] ??= { answered: 0, correct: 0 };
    stats.answered += 1;
    if (correct) {
      state.stats.correct += 1;
      stats.correct += 1;
      state.stats.streak += 1;
      state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
    } else state.stats.streak = 0;
    question.attempted = true;
  }
  if (!correct) return { state, correct: false, message: 'Not quite. Your team is safe — use the hint and try again!', explanation: question.hint };
  const explanation = question.explanation;
  const gained = Math.min(6, state.battle.maxMana - state.battle.mana);
  state.battle.mana += gained;
  state.battle.question = { ...createQuestion(state.topic, rng), attempted: false };
  return { state, correct: true, message: `Great thinking! +${gained} mana for your team.`, explanation };
}

export function elementMultiplier(attack, defense) {
  const element = ELEMENTS.find((item) => item.id === attack);
  if (!element) return 1;
  return element.strongAgainst === defense ? 1.4 : element.weakAgainst === defense ? 0.7 : 1;
}

function damageUnit(target, damage) {
  const absorbed = Math.min(target.shield, damage);
  target.shield -= absorbed;
  const dealt = Math.min(target.hp, damage - absorbed);
  target.hp -= dealt;
  return { dealt, absorbed };
}
function healUnit(target, amount) {
  const healing = Math.min(target.maxHp - target.hp, amount);
  target.hp += healing;
  return healing;
}
function winBattle(state, events) {
  const encounter = encounterFor(state.battle.encounterId);
  const firstClear = !encounter.roamer && !state.completed.includes(encounter.id);
  const oldLevel = getLevel(state);
  const reward = { xp: firstClear ? encounter.boss ? 140 : 85 : 30, coins: firstClear ? encounter.boss ? 55 : 30 : 12, firstClear, creature: null, regionComplete: false, campaignComplete: false, oldLevel, newLevel: oldLevel, unlockedSpells: [] };
  if (firstClear) state.completed.push(encounter.id);
  const region = REGIONS.find((item) => item.id === encounter.regionId);
  if (region.encounterIds.every((id) => state.completed.includes(id))) {
    const friend = DINOS.find((dino) => dino.unlockHabitat === region.id);
    if (!state.collection.includes(friend.id)) {
      state.collection.push(friend.id);
      reward.creature = friend.id;
      reward.regionComplete = true;
      if (state.party.length < 2) state.party.push(friend.id);
      events.push(`${friend.name} is free of the gloam and joins your team!`);
    }
  }
  state.xp += reward.xp;
  state.coins += reward.coins;
  reward.newLevel = getLevel(state);
  reward.unlockedSpells = SPELLS.filter((spell) => spell.level > oldLevel && spell.level <= reward.newLevel).map((spell) => spell.id);
  reward.campaignComplete = firstClear && state.completed.length === CAMPAIGN.length;
  if (reward.newLevel > oldLevel) events.push(`Level ${reward.newLevel}! Your whole team gains health and spell power.`);
  state.battle = null;
  return { state, events, outcome: 'win', reward };
}

function enemyRound(state, events) {
  const battle = state.battle;
  const encounter = encounterFor(battle.encounterId);
  for (const enemy of battle.enemies) {
    if (enemy.hp <= 0) continue;
    if (enemy.status.burn > 0) {
      enemy.status.burn -= 1;
      const { dealt } = damageUnit(enemy, 7 + Math.floor(getLevel(state) / 2));
      events.push(`${enemy.name} takes ${dealt} ember damage.`);
      if (enemy.hp === 0) continue;
    }
    const alive = battle.allies.filter((ally) => ally.hp > 0);
    if (!alive.length) break;
    const isGuardian = encounter.boss && enemy.id === 'enemy-1';
    if (isGuardian && battle.round % 3 === 0) {
      for (const target of alive) {
        const { dealt, absorbed } = damageUnit(target, Math.round(enemy.power * 0.85));
        events.push(`Guardian roar! ${target.name} takes ${dealt}${absorbed ? ` (${absorbed} blocked)` : ''}.`);
      }
    } else {
      const index = (battle.round + Number(enemy.id.slice(-1)) - 2) % alive.length;
      const target = alive[index];
      const hit = Math.round(enemy.power * elementMultiplier(enemy.element, target.element));
      const { dealt, absorbed } = damageUnit(target, hit);
      events.push(`${enemy.name} hits ${target.name} for ${dealt}${absorbed ? ` (${absorbed} blocked)` : ''}.`);
      if (isGuardian && battle.round % 3 === 1) {
        enemy.shield = Math.min(200, enemy.shield + 18 + encounter.level);
        events.push('The guardian raises a crystal shield. Keep attacking to break it.');
      }
    }
  }
  for (const ally of battle.allies) {
    if (ally.hp > 0 && ally.status.regen > 0) {
      ally.status.regen -= 1;
      const restored = healUnit(ally, 10 + getLevel(state));
      events.push(`${ally.name} restores ${restored} health in the healing rain.`);
    }
    for (const id of Object.keys(ally.cooldowns)) {
      ally.cooldowns[id] -= 1;
      if (ally.cooldowns[id] <= 0) delete ally.cooldowns[id];
    }
  }
}

export function castSpell(raw, spellId, targetId) {
  const state = normalizeGame(raw);
  if (!state.battle) fail('Meet an enemy before casting a spell.');
  const battle = state.battle;
  const actor = battle.allies.find((unit) => unit.id === battle.activeId);
  const spell = knownSpells(state, actor.id).find((item) => item.id === spellId) || fail('This teammate has not learned that spell yet.');
  if (actor.cooldowns[spellId] > 0) fail('That spell is cooling down. Choose another spell.');
  if (battle.mana < spell.cost) fail('Answer a math question to charge more mana.');
  let targets;
  if (spell.target === 'all') targets = battle.enemies.filter((enemy) => enemy.hp > 0);
  else if (spell.target === 'self') targets = [actor];
  else {
    const pool = spell.target === 'ally' ? battle.allies : battle.enemies;
    const target = pool.find((unit) => unit.id === targetId && unit.hp > 0);
    if (!target) fail(spell.target === 'ally' ? 'Choose a living teammate to help.' : 'Choose a living enemy to target.');
    targets = [target];
  }
  battle.mana -= spell.cost;
  if (spell.cooldown) actor.cooldowns[spellId] = spell.cooldown + 1;
  const events = [];
  for (const target of targets) {
    const power = spell.power + actor.power;
    if (spell.effect === 'heal' || spell.effect === 'regen') {
      const healing = healUnit(target, power);
      if (spell.effect === 'regen') target.status.regen = 2;
      events.push(`${actor.name} uses ${spell.name}: ${target.name} restores ${healing} health.`);
    } else if (spell.effect === 'shield') {
      target.shield = Math.min(200, target.shield + power);
      events.push(`${actor.name} uses ${spell.name}: ${target.name} gains ${power} shield.`);
    } else {
      const multiplier = elementMultiplier(spell.element, target.element);
      const { dealt, absorbed } = damageUnit(target, Math.round(power * multiplier));
      if (spell.effect === 'burn' && target.hp > 0) target.status.burn = 2;
      if (spell.effect === 'drain') healUnit(actor, Math.ceil(dealt / 4));
      events.push(`${actor.name} casts ${spell.name}: ${dealt} damage to ${target.name}${absorbed ? ` (${absorbed} shield blocked)` : ''}.${multiplier > 1 ? ' Element advantage!' : multiplier < 1 ? ' Resisted.' : ''}`);
    }
  }
  if (!battle.enemies.some((enemy) => enemy.hp > 0)) return winBattle(state, events);
  battle.acted.push(actor.id);
  let next = battle.allies.find((unit) => unit.hp > 0 && !battle.acted.includes(unit.id));
  if (!next) {
    enemyRound(state, events);
    if (!battle.enemies.some((enemy) => enemy.hp > 0)) return winBattle(state, events);
    if (!battle.allies.some((ally) => ally.hp > 0)) {
      state.battle = null;
      state.world.x = 220;
      state.world.y = 760;
      events.push('Your team returns to camp to recover. You keep all your progress and supplies.');
      return { state, events, outcome: 'lose' };
    }
    battle.round += 1;
    battle.acted = [];
    next = battle.allies.find((ally) => ally.hp > 0);
    if (encounterFor(battle.encounterId).boss && battle.round % 3 === 0) events.push('Warning: the guardian will roar at the whole team this round. Shield or heal now!');
  }
  battle.activeId = next.id;
  battle.log = events.slice(-8);
  return { state, events, outcome: 'ongoing' };
}

export function fleeBattle(raw) {
  const state = normalizeGame(raw);
  state.battle = null;
  state.world.x = 220;
  state.world.y = 760;
  return state;
}
