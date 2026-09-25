// Math Go's original, offline game rules. No accounts, services, or purchases.
export const TOPICS = Object.freeze([
  { id: 'add2', label: '2-digit addition' },
  { id: 'sub2', label: '2-digit subtraction' },
  { id: 'add3', label: '3-digit addition' },
  { id: 'sub3', label: '3-digit subtraction' },
  { id: 'mul', label: 'Multiplication facts' },
  { id: 'mul2', label: '2-digit × 1-digit' },
  { id: 'div', label: 'Division facts' },
  { id: 'fractions', label: 'Fraction pieces' },
  { id: 'time', label: 'Elapsed time' },
  { id: 'area', label: 'Area of rectangles' },
]);

export const DINOS = Object.freeze([
  { id: 'sprig', name: 'Sprig', element: 'leaf', description: 'A curious fern triceratops. Leaf friends add 3 power to Trail Strike.', unlockHabitat: null },
  { id: 'brook', name: 'Brook', element: 'water', description: 'A gentle river longneck. Water friends restore 3 extra health with Rest & Restore.', unlockHabitat: null },
  { id: 'pebble', name: 'Pebble', element: 'stone', description: 'A brave pebble ankylosaurus. Stone friends reduce incoming damage by 2.', unlockHabitat: null },
  { id: 'breeze', name: 'Fernwing', element: 'leaf', description: 'A leafy pterosaur who guides lost explorers. Adds 3 power to Trail Strike.', unlockHabitat: 'fern' },
  { id: 'bloom', name: 'Blossom', element: 'water', description: 'A flower-crested parasaurolophus who loves river gardens. Restores 3 extra health.', unlockHabitat: 'river' },
  { id: 'crystal', name: 'Prismback', element: 'stone', description: 'A shimmering stegosaurus with crystal plates. Reduces incoming damage by 2.', unlockHabitat: 'crystal' },
  { id: 'ember', name: 'Suncrest', element: 'sun', description: 'A golden-crested tyrannosaur who protects the summit. Adds 3 power to Solar Burst.', unlockHabitat: 'summit' },
]);

export const HABITATS = Object.freeze([
  {
    id: 'fern', name: 'Fernwood Trail', subtitle: 'Follow the rustling leaves', element: 'leaf', x: 23, y: 57,
    description: 'Help the forest friends bring the ancient trail back to life.',
    encounters: [
      { id: 'fern-1', name: 'A rustle in the ferns', dinoId: 'sprig', boss: false, description: 'Sprig wants a friendly practice match before showing you the trail.' },
      { id: 'fern-2', name: 'The mossy bridge', dinoId: 'pebble', boss: false, description: 'Pebble has a puzzle waiting beside the forest bridge.' },
      { id: 'fern-3', name: 'Guardian of the canopy', dinoId: 'breeze', boss: true, description: 'Win Fernwing’s friendship and open the path to the river.' },
    ],
  },
  {
    id: 'river', name: 'Ripple River', subtitle: 'Make a splash', element: 'water', x: 48, y: 43,
    description: 'Skip across stepping stones and explore a blooming riverside.',
    encounters: [
      { id: 'river-1', name: 'Stepping-stone crossing', dinoId: 'brook', boss: false, description: 'Brook challenges you to a cheerful riverbank match.' },
      { id: 'river-2', name: 'Water-lily lagoon', dinoId: 'sprig', boss: false, description: 'A visiting Sprig has found some tricky river puzzles.' },
      { id: 'river-3', name: 'Guardian of the lagoon', dinoId: 'bloom', boss: true, description: 'Help Blossom protect the river garden and become friends.' },
    ],
  },
  {
    id: 'crystal', name: 'Crystal Hollow', subtitle: 'Let your ideas shine', element: 'stone', x: 75, y: 65,
    description: 'Follow glowing stones into a cavern full of curious creatures.',
    encounters: [
      { id: 'crystal-1', name: 'The echo tunnel', dinoId: 'pebble', boss: false, description: 'Pebble’s friendly challenge echoes through the hollow.' },
      { id: 'crystal-2', name: 'A glimmer in the dark', dinoId: 'bloom', boss: false, description: 'Blossom is exploring the sparkling pools beneath the rocks.' },
      { id: 'crystal-3', name: 'Guardian of the crystals', dinoId: 'crystal', boss: true, description: 'Meet Prismback and unlock a new path toward the sky.' },
    ],
  },
  {
    id: 'summit', name: 'Sunstone Summit', subtitle: 'Reach for the sunshine', element: 'sun', x: 78, y: 23,
    description: 'Climb above the clouds for the final three friendly challenges.',
    encounters: [
      { id: 'summit-1', name: 'Updraft lookout', dinoId: 'breeze', boss: false, description: 'Fernwing swoops in with a high-flying practice challenge.' },
      { id: 'summit-2', name: 'The golden stairway', dinoId: 'crystal', boss: false, description: 'Prismback helps you prepare for the guardian at the top.' },
      { id: 'summit-3', name: 'Guardian of the sunshine', dinoId: 'ember', boss: true, description: 'Befriend Suncrest and restore the whole dinosaur sanctuary.' },
    ],
  },
]);

export const GEARS = Object.freeze([
  { id: 'field', name: 'Explorer’s scarf', cost: 0, description: 'Your trusty first adventure scarf.', hpBonus: 0, damageBonus: 0 },
  { id: 'moss', name: 'Mossguard charm', cost: 80, description: 'A soft forest charm. Adds 20 maximum health.', hpBonus: 20, damageBonus: 0 },
  { id: 'river', name: 'Riverstone charm', cost: 120, description: 'A smooth river gem. Adds 3 power to every move.', hpBonus: 0, damageBonus: 3 },
  { id: 'sun', name: 'Sunstone charm', cost: 180, description: 'A gift of the sunshine. Adds 30 maximum health and 4 power.', hpBonus: 30, damageBonus: 4 },
]);

export const MOVES = Object.freeze([
  { id: 'strike', name: 'Trail Strike', damage: 25, heal: 0, incoming: 12, description: 'A steady 25-power move.' },
  { id: 'burst', name: 'Solar Burst', damage: 40, heal: 0, incoming: 22, description: '40 power, but your friend takes 10 extra damage afterward.' },
  { id: 'mend', name: 'Rest & Restore', damage: 15, heal: 20, incoming: 12, description: 'Restore 20 health and use a gentle 15-power move.' },
]);

export const ADOPTION_COST = 90;

const topicIds = TOPICS.map((topic) => topic.id);
const starterIds = ['sprig', 'brook', 'pebble'];
const encounterIds = HABITATS.flatMap((habitat) => habitat.encounters.map((encounter) => encounter.id));
const MAX_SAVE_LENGTH = 100_000;

function fail(message) { throw new Error(message); }

function randomInt(min, max, rng) {
  const value = rng();
  if (!Number.isFinite(value) || value < 0 || value >= 1) fail('The random number source must return a number from 0 up to (but not including) 1.');
  return min + Math.floor(value * (max - min + 1));
}

function integer(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max) fail(`Invalid ${label}.`);
  return value;
}

function object(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail(`Invalid ${label}.`);
  if (Object.keys(value).some((key) => !keys.includes(key))) fail(`Unrecognized field in ${label}.`);
  return value;
}

function choice(value, allowed, label) {
  if (!allowed.includes(value)) fail(`Invalid ${label}.`);
  return value;
}

function uniqueList(value, allowed, label) {
  if (!Array.isArray(value) || value.length > allowed.length || new Set(value).size !== value.length || value.some((entry) => !allowed.includes(entry))) fail(`Invalid ${label}.`);
  return [...value];
}

function clockText(totalMinutes) {
  const hour = Math.floor(totalMinutes / 60);
  return `${hour > 12 ? hour - 12 : hour}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

// All displayed wording and answers are derived from a small validated data record.
// Importing a save therefore cannot replace the correct answer with an arbitrary one.
function questionContent(topic, rawData) {
  let data;
  let prompt;
  let answer;
  let hint;
  let explanation;
  if (['add2', 'sub2', 'add3', 'sub3', 'mul', 'mul2'].includes(topic)) {
    object(rawData, ['a', 'b'], 'question numbers');
    const isThree = topic.endsWith('3');
    const aMin = topic === 'mul' ? 0 : isThree ? 100 : 10;
    const aMax = topic === 'mul' ? 9 : isThree ? 999 : 99;
    const bMin = topic === 'mul' || topic === 'mul2' ? 0 : aMin;
    const bMax = topic === 'mul' || topic === 'mul2' ? 9 : aMax;
    const a = integer(rawData.a, aMin, aMax, 'first question number');
    const b = integer(rawData.b, bMin, bMax, 'second question number');
    data = { a, b };
    if (topic.startsWith('add')) {
      prompt = `${a} + ${b} = ?`;
      answer = a + b;
      const tens = Math.floor(b / 10) * 10;
      const ones = b % 10;
      hint = `Break ${b} into ${tens} and ${ones}. Add ${tens} first, then add ${ones}.`;
      explanation = `${a} + ${tens} = ${a + tens}. Then ${a + tens} + ${ones} = ${answer}.`;
    } else if (topic.startsWith('sub')) {
      if (a < b) fail('Subtraction questions cannot have negative answers.');
      prompt = `${a} − ${b} = ?`;
      answer = a - b;
      const tens = Math.floor(b / 10) * 10;
      const ones = b % 10;
      hint = `Break ${b} into ${tens} and ${ones}. Take away ${tens} first, then take away ${ones}.`;
      explanation = `${a} − ${tens} = ${a - tens}. Then ${a - tens} − ${ones} = ${answer}.`;
    } else {
      prompt = `${a} × ${b} = ?`;
      answer = a * b;
      if (topic === 'mul2') {
        const tens = Math.floor(a / 10) * 10;
        const ones = a % 10;
        hint = `Split ${a} into ${tens} and ${ones}. Multiply each part by ${b}, then add.`;
        explanation = `${tens} × ${b} = ${tens * b}, and ${ones} × ${b} = ${ones * b}. ${tens * b} + ${ones * b} = ${answer}.`;
      } else {
        hint = b === 0 ? 'Zero groups have no objects.' : `Think of ${b} equal groups with ${a} in each group. Try counting by ${a}.`;
        explanation = `${b} groups of ${a} make ${answer}. So ${a} × ${b} = ${answer}.`;
      }
    }
  } else if (topic === 'div') {
    object(rawData, ['divisor', 'quotient'], 'division numbers');
    const divisor = integer(rawData.divisor, 2, 9, 'divisor');
    const quotient = integer(rawData.quotient, 1, 12, 'quotient');
    const total = divisor * quotient;
    data = { divisor, quotient };
    prompt = `${total} ÷ ${divisor} = ?`;
    answer = quotient;
    hint = `What number times ${divisor} makes ${total}?`;
    explanation = `${divisor} × ${quotient} = ${total}, so ${total} ÷ ${divisor} = ${quotient}.`;
  } else if (topic === 'fractions') {
    object(rawData, ['denominator', 'known', 'missing'], 'fraction pieces');
    const denominator = integer(rawData.denominator, 2, 10, 'fraction denominator');
    const known = integer(rawData.known, 1, denominator - 1, 'known fraction pieces');
    const missing = integer(rawData.missing, 1, denominator - known, 'missing fraction pieces');
    data = { denominator, known, missing };
    prompt = `A leaf is split into ${denominator} equal pieces. ${known} pieces are green and some are yellow. Together, ${known + missing} pieces are colored. How many pieces are yellow?`;
    answer = missing;
    hint = `Each piece is 1/${denominator} of the leaf. Count on from ${known} to ${known + missing} to find the missing pieces.`;
    explanation = `${known}/${denominator} + ${missing}/${denominator} = ${known + missing}/${denominator}. There are ${missing} yellow pieces.`;
  } else if (topic === 'time') {
    object(rawData, ['start', 'duration'], 'time numbers');
    const start = integer(rawData.start, 60, 11 * 60 + 45, 'start time');
    const duration = integer(rawData.duration, 15, 90, 'elapsed minutes');
    if (start % 15 || duration % 15) fail('Time questions must use quarter-hour intervals.');
    data = { start, duration };
    prompt = `Your nature walk starts at ${clockText(start)} and ends at ${clockText(start + duration)}. How many minutes is the walk?`;
    answer = duration;
    hint = 'Count forward in 15-minute jumps. Four jumps make one hour (60 minutes).';
    explanation = `There are ${duration / 15} jumps of 15 minutes from ${clockText(start)} to ${clockText(start + duration)}. ${duration / 15} × 15 = ${duration} minutes.`;
  } else if (topic === 'area') {
    object(rawData, ['length', 'width'], 'rectangle dimensions');
    const length = integer(rawData.length, 2, 12, 'rectangle length');
    const width = integer(rawData.width, 2, 9, 'rectangle width');
    data = { length, width };
    prompt = `A rectangular dinosaur garden is ${length} meters long and ${width} meters wide. What is its area in square meters?`;
    answer = length * width;
    hint = `Area is length × width. Imagine ${width} rows with ${length} squares in each row.`;
    explanation = `${length} × ${width} = ${answer}. The area is ${answer} square meters.`;
  } else {
    fail('Choose a Grade 3 math topic.');
  }
  return { topic, prompt, answer, hint, explanation, data };
}

export function createQuestion(topic, rng = Math.random) {
  if (topic === 'mixed') topic = topicIds[randomInt(0, topicIds.length - 1, rng)];
  choice(topic, topicIds, 'math topic');
  let data;
  if (['add2', 'sub2', 'add3', 'sub3', 'mul', 'mul2'].includes(topic)) {
    const min = topic === 'mul' ? 0 : topic.endsWith('3') ? 100 : 10;
    const max = topic === 'mul' ? 9 : topic.endsWith('3') ? 999 : 99;
    let a = randomInt(min, max, rng);
    let b = randomInt(topic.startsWith('mul') ? 0 : min, topic.startsWith('mul') ? 9 : max, rng);
    if (topic.startsWith('sub') && a < b) [a, b] = [b, a];
    data = { a, b };
  } else if (topic === 'div') {
    data = { divisor: randomInt(2, 9, rng), quotient: randomInt(1, 12, rng) };
  } else if (topic === 'fractions') {
    const denominator = randomInt(2, 10, rng);
    const known = randomInt(1, denominator - 1, rng);
    data = { denominator, known, missing: randomInt(1, denominator - known, rng) };
  } else if (topic === 'time') {
    data = { start: randomInt(4, 47, rng) * 15, duration: randomInt(1, 6, rng) * 15 };
  } else {
    data = { length: randomInt(2, 12, rng), width: randomInt(2, 9, rng) };
  }
  return { id: `q_${topic}_${randomInt(0, 0xffffffffff, rng).toString(36)}`, ...questionContent(topic, data) };
}

export function createSave({ name, starter, topic = 'mixed' }) {
  return validateSave({
    format: 'math-go', version: 1,
    player: { name, starter }, topic, xp: 0, coins: 0,
    completed: [], collection: [starter], equipped: starter,
    gear: 'field', ownedGear: ['field'],
    stats: { answered: 0, correct: 0, streak: 0, bestStreak: 0, byTopic: {} },
    settings: { sound: false }, battle: null,
  });
}

export function getLevel(state) { return Math.min(50, 1 + Math.floor(state.xp / 120)); }

export function isHabitatUnlocked(state, id) {
  const index = HABITATS.findIndex((habitat) => habitat.id === id);
  return index >= 0 && HABITATS.slice(0, index).every((habitat) => habitat.encounters.every((encounter) => state.completed.includes(encounter.id)));
}

function battleLimits(state, habitatId, encounterId) {
  const habitatIndex = HABITATS.findIndex((habitat) => habitat.id === habitatId);
  if (habitatIndex < 0) fail('Unknown habitat.');
  const encounterIndex = HABITATS[habitatIndex].encounters.findIndex((encounter) => encounter.id === encounterId);
  if (encounterIndex < 0) fail('This challenge does not belong to this habitat.');
  const gear = GEARS.find((item) => item.id === state.gear);
  return { enemyMaxHp: 60 + habitatIndex * 15 + encounterIndex * 15, playerMaxHp: 100 + gear.hpBonus, habitatIndex };
}

function validateQuestion(raw) {
  object(raw, ['id', 'topic', 'prompt', 'answer', 'hint', 'explanation', 'data', 'attempted'], 'saved question');
  choice(raw.topic, topicIds, 'saved question topic');
  if (typeof raw.id !== 'string' || !new RegExp(`^q_${raw.topic}_[a-z0-9]{1,9}$`).test(raw.id)) fail('Invalid saved question ID.');
  const rebuilt = questionContent(raw.topic, raw.data);
  for (const key of ['prompt', 'answer', 'hint', 'explanation']) {
    if (raw[key] !== rebuilt[key]) fail('The saved question does not match its math.');
  }
  if (typeof raw.attempted !== 'boolean') fail('Invalid question attempt marker.');
  return { id: raw.id, ...rebuilt, attempted: raw.attempted };
}

export function validateSave(raw) {
  object(raw, ['format', 'version', 'player', 'topic', 'xp', 'coins', 'completed', 'collection', 'equipped', 'gear', 'ownedGear', 'stats', 'settings', 'battle'], 'save file');
  if (raw.format !== 'math-go' || raw.version !== 1) fail('This is not a supported Math Go save (version 1).');
  object(raw.player, ['name', 'starter'], 'explorer');
  if (typeof raw.player.name !== 'string' || raw.player.name.trim().length < 1 || raw.player.name.trim().length > 24 || /[<>\u0000-\u001f\u007f]/.test(raw.player.name)) fail('Explorer names must have 1–24 characters and no markup.');
  const starter = choice(raw.player.starter, starterIds, 'starter friend');
  const completed = uniqueList(raw.completed, encounterIds, 'completed challenges');
  for (const habitat of HABITATS) {
    if (habitat.encounters.some((encounter) => completed.includes(encounter.id)) && !isHabitatUnlocked({ completed }, habitat.id)) fail('A completed challenge is in a locked habitat.');
  }
  const collection = uniqueList(raw.collection, DINOS.map((dino) => dino.id), 'dinosaur collection');
  const earned = [starter, ...DINOS.filter((dino) => dino.unlockHabitat && HABITATS.find((habitat) => habitat.id === dino.unlockHabitat).encounters.every((encounter) => completed.includes(encounter.id))).map((dino) => dino.id)];
  if (earned.some((id) => !collection.includes(id)) || collection.some((id) => !starterIds.includes(id) && !earned.includes(id))) fail('The dinosaur collection does not match completed habitats.');
  const ownedGear = uniqueList(raw.ownedGear, GEARS.map((gear) => gear.id), 'owned gear');
  if (!ownedGear.includes('field')) fail('The explorer’s scarf is missing.');
  object(raw.settings, ['sound'], 'settings');
  if (typeof raw.settings.sound !== 'boolean') fail('Invalid sound setting.');
  object(raw.stats, ['answered', 'correct', 'streak', 'bestStreak', 'byTopic'], 'practice stats');
  const answered = integer(raw.stats.answered, 0, 1_000_000, 'answered count');
  const correct = integer(raw.stats.correct, 0, answered, 'first-try correct count');
  const bestStreak = integer(raw.stats.bestStreak, 0, correct, 'best streak');
  const streak = integer(raw.stats.streak, 0, bestStreak, 'streak');
  object(raw.stats.byTopic, topicIds, 'topic stats');
  const byTopic = {};
  let totalAnswered = 0;
  let totalCorrect = 0;
  for (const topic of Object.keys(raw.stats.byTopic)) {
    const value = object(raw.stats.byTopic[topic], ['answered', 'correct'], 'topic counts');
    const topicAnswered = integer(value.answered, 0, answered, 'topic answered count');
    const topicCorrect = integer(value.correct, 0, topicAnswered, 'topic correct count');
    byTopic[topic] = { answered: topicAnswered, correct: topicCorrect };
    totalAnswered += topicAnswered;
    totalCorrect += topicCorrect;
  }
  if (totalAnswered !== answered || totalCorrect !== correct) fail('Practice totals do not match the topic totals.');
  const state = {
    format: 'math-go', version: 1,
    player: { name: raw.player.name.trim(), starter },
    topic: choice(raw.topic, ['mixed', ...topicIds], 'practice topic'),
    xp: integer(raw.xp, 0, 100_000_000, 'experience'),
    coins: integer(raw.coins, 0, 100_000_000, 'leaf coin total'),
    completed, collection,
    equipped: choice(raw.equipped, collection, 'equipped friend'),
    gear: choice(raw.gear, ownedGear, 'equipped gear'), ownedGear,
    stats: { answered, correct, streak, bestStreak, byTopic },
    settings: { sound: raw.settings.sound }, battle: null,
  };
  if (raw.battle !== null) {
    const battle = object(raw.battle, ['habitatId', 'encounterId', 'enemyHp', 'enemyMaxHp', 'playerHp', 'playerMaxHp', 'question', 'turn', 'selectedMove'], 'active challenge');
    const limits = battleLimits(state, battle.habitatId, battle.encounterId);
    if (!isHabitatUnlocked(state, battle.habitatId)) fail('The active challenge is in a locked habitat.');
    if (battle.enemyMaxHp !== limits.enemyMaxHp || battle.playerMaxHp !== limits.playerMaxHp) fail('Challenge health limits do not match the equipped gear and habitat.');
    const question = validateQuestion(battle.question);
    if (question.attempted && (!byTopic[question.topic] || byTopic[question.topic].answered < 1)) fail('The question attempt is missing from the practice stats.');
    state.battle = {
      habitatId: battle.habitatId, encounterId: battle.encounterId,
      enemyHp: integer(battle.enemyHp, 1, limits.enemyMaxHp, 'opponent health'), enemyMaxHp: limits.enemyMaxHp,
      playerHp: integer(battle.playerHp, 1, limits.playerMaxHp, 'friend health'), playerMaxHp: limits.playerMaxHp,
      question, turn: integer(battle.turn, 1, 10_000, 'turn number'),
      selectedMove: choice(battle.selectedMove, MOVES.map((move) => move.id), 'selected move'),
    };
  }
  return state;
}

export function parseSave(text) {
  if (typeof text !== 'string' || text.length > MAX_SAVE_LENGTH) fail('Choose a Math Go JSON file smaller than 100 KB.');
  let raw;
  try { raw = JSON.parse(text); } catch { fail('This file is not valid JSON. Choose an exported Math Go save.'); }
  return validateSave(raw);
}

export function serializeSave(state) { return JSON.stringify(validateSave(state), null, 2); }

export function adoptDino(rawState, id) {
  const state = validateSave(rawState);
  choice(id, starterIds, 'adoptable friend');
  if (state.collection.includes(id)) fail('This dinosaur is already your friend.');
  if (state.coins < ADOPTION_COST) fail(`Earn ${ADOPTION_COST} leaf coins to adopt this friend.`);
  state.coins -= ADOPTION_COST;
  state.collection.push(id);
  return state;
}

export function beginBattle(rawState, habitatId, encounterId, rng = Math.random) {
  const state = validateSave(rawState);
  if (state.battle) fail('Finish or leave your current challenge first.');
  if (!isHabitatUnlocked(state, habitatId)) fail('Complete the earlier habitat to open this trail.');
  const limits = battleLimits(state, habitatId, encounterId);
  state.battle = {
    habitatId, encounterId,
    enemyHp: limits.enemyMaxHp, enemyMaxHp: limits.enemyMaxHp,
    playerHp: limits.playerMaxHp, playerMaxHp: limits.playerMaxHp,
    question: { ...createQuestion(state.topic, rng), attempted: false },
    turn: 1, selectedMove: 'strike',
  };
  return state;
}

export function submitAnswer(rawState, answer, move = 'strike', rng = Math.random) {
  const state = validateSave(rawState);
  if (!state.battle) fail('Choose a challenge before answering a question.');
  if (!Number.isSafeInteger(answer) || answer < 0 || answer > 1_000_000) fail('Enter a whole number from 0 to 1,000,000.');
  const chosenMove = MOVES.find((item) => item.id === move);
  if (!chosenMove) fail('Choose a valid move.');
  const battle = state.battle;
  const question = battle.question;
  const isCorrect = answer === question.answer;
  const firstTry = !question.attempted;
  battle.selectedMove = move;
  if (firstTry) {
    state.stats.answered += 1;
    state.stats.byTopic[question.topic] ??= { answered: 0, correct: 0 };
    state.stats.byTopic[question.topic].answered += 1;
    if (isCorrect) {
      state.stats.correct += 1;
      state.stats.byTopic[question.topic].correct += 1;
      state.stats.streak += 1;
      state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
    } else {
      state.stats.streak = 0;
    }
    question.attempted = true;
  }
  if (!isCorrect) return { state, outcome: 'incorrect', message: `Keep going — your friend is safe. ${question.hint}` };

  const dino = DINOS.find((item) => item.id === state.equipped);
  const gear = GEARS.find((item) => item.id === state.gear);
  const { habitatIndex } = battleLimits(state, battle.habitatId, battle.encounterId);
  const elementPower = (dino.element === 'leaf' && move === 'strike') || (dino.element === 'sun' && move === 'burst') ? 3 : 0;
  const damage = chosenMove.damage + gear.damageBonus + elementPower;
  const healing = chosenMove.heal ? chosenMove.heal + (dino.element === 'water' ? 3 : 0) : 0;
  battle.enemyHp = Math.max(0, battle.enemyHp - damage);
  battle.playerHp = Math.min(battle.playerMaxHp, battle.playerHp + healing);
  if (battle.enemyHp === 0) {
    const habitat = HABITATS[habitatIndex];
    const encounter = habitat.encounters.find((item) => item.id === battle.encounterId);
    const firstClear = !state.completed.includes(encounter.id);
    const reward = { xp: firstClear ? 60 + (encounter.boss ? 30 : 0) : 15, coins: firstClear ? 25 + (encounter.boss ? 20 : 0) : 8, firstClear, creature: null, habitatComplete: false, campaignComplete: false };
    if (firstClear) state.completed.push(encounter.id);
    const habitatComplete = habitat.encounters.every((item) => state.completed.includes(item.id));
    const friend = DINOS.find((item) => item.unlockHabitat === habitat.id);
    if (habitatComplete && !state.collection.includes(friend.id)) {
      state.collection.push(friend.id);
      reward.creature = friend.id;
      reward.habitatComplete = true;
    }
    state.xp += reward.xp;
    state.coins += reward.coins;
    reward.campaignComplete = firstClear && state.completed.length === encounterIds.length;
    state.battle = null;
    return { state, outcome: 'win', message: `${question.explanation} Challenge complete!${reward.creature ? ` ${friend.name} joined your friends!` : ''}`, reward, damage, healing };
  }
  const incoming = Math.max(1, chosenMove.incoming + habitatIndex * 2 - (dino.element === 'stone' ? 2 : 0));
  battle.playerHp = Math.max(0, battle.playerHp - incoming);
  if (battle.playerHp === 0) {
    state.battle = null;
    return { state, outcome: 'retreat', message: `${question.explanation} Your friend needs a rest. Come back at full health and try Rest & Restore!`, damage, healing, incoming };
  }
  battle.turn += 1;
  battle.question = { ...createQuestion(state.topic, rng), attempted: false };
  return { state, outcome: 'hit', message: `${question.explanation} ${chosenMove.name} used ${damage} power${healing ? ` and restored up to ${healing} health` : ''}.`, damage, healing, incoming };
}
