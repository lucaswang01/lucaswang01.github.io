import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOPICS, HABITATS, DINOS, GEARS, createQuestion, createSave,
  beginBattle, submitAnswer, isHabitatUnlocked, getLevel,
  validateSave, parseSave, serializeSave, adoptDino, ADOPTION_COST,
} from '../core.mjs';

function seeded(seed = 42) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}
const starter = () => createSave({ name: 'Lucas', starter: 'sprig' });
const copy = (value) => JSON.parse(JSON.stringify(value));

test('all Grade 3 question generators produce correct, bounded integer math', () => {
  const rng = seeded();
  for (const { id } of TOPICS) {
    for (let i = 0; i < 500; i += 1) {
      const question = createQuestion(id, rng);
      const d = question.data;
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0);
      assert.ok(question.hint.length > 10 && question.explanation.length > 10);
      if (id.startsWith('add') || id.startsWith('sub')) {
        const min = id.endsWith('3') ? 100 : 10;
        const max = id.endsWith('3') ? 999 : 99;
        assert.ok(d.a >= min && d.a <= max && d.b >= min && d.b <= max);
        assert.equal(question.answer, id.startsWith('add') ? d.a + d.b : d.a - d.b);
      } else if (id.startsWith('mul')) {
        assert.ok(d.a >= (id === 'mul' ? 0 : 10) && d.a <= (id === 'mul' ? 9 : 99));
        assert.ok(d.b >= 0 && d.b <= 9);
        assert.equal(question.answer, d.a * d.b);
      } else if (id === 'div') {
        assert.ok(d.divisor >= 2 && d.divisor <= 9 && d.quotient >= 1 && d.quotient <= 12);
        assert.equal(question.answer, d.quotient);
      } else if (id === 'fractions') {
        assert.ok(d.known + d.missing <= d.denominator);
        assert.equal(question.answer, d.missing);
      } else if (id === 'time') {
        assert.equal(d.start % 15, 0);
        assert.equal(d.duration % 15, 0);
        assert.ok(d.duration >= 15 && d.duration <= 90);
        assert.equal(question.answer, d.duration);
      } else if (id === 'area') {
        assert.equal(question.answer, d.length * d.width);
      }
    }
  }
  const mixedTopics = new Set(Array.from({ length: 300 }, () => createQuestion('mixed', rng).topic));
  assert.equal(mixedTopics.size, TOPICS.length);
});

test('wrong answers allow safe retries and count first-try accuracy exactly once', () => {
  const rng = seeded(7);
  const original = beginBattle(starter(), 'fern', 'fern-1', rng);
  const answer = original.battle.question.answer;
  const first = submitAnswer(original, answer + 1, 'strike', rng);
  assert.equal(first.outcome, 'incorrect');
  assert.equal(first.state.battle.playerHp, original.battle.playerHp);
  assert.equal(first.state.battle.enemyHp, original.battle.enemyHp);
  assert.equal(first.state.stats.answered, 1);
  assert.equal(first.state.stats.correct, 0);
  assert.equal(original.stats.answered, 0, 'input state is not mutated');
  const second = submitAnswer(first.state, answer + 2, 'burst', rng);
  assert.equal(second.state.stats.answered, 1);
  const restored = parseSave(serializeSave(second.state));
  assert.equal(restored.battle.question.attempted, true);
  const success = submitAnswer(restored, answer, 'strike', rng);
  assert.equal(success.outcome, 'hit');
  assert.equal(success.state.stats.answered, 1);
  assert.equal(success.state.stats.correct, 0);
  assert.equal(success.state.battle.enemyHp, original.battle.enemyHp - 28);
  assert.equal(success.state.battle.question.attempted, false);
  const nextSuccess = submitAnswer(success.state, success.state.battle.question.answer, 'strike', rng);
  assert.equal(nextSuccess.state.stats.answered, 2);
  assert.equal(nextSuccess.state.stats.correct, 1);
  assert.equal(nextSuccess.state.stats.streak, 1);
});

test('all twelve challenges unlock in order and award each friend once', () => {
  let state = starter();
  const rng = seeded(93);
  assert.equal(isHabitatUnlocked(state, 'fern'), true);
  assert.equal(isHabitatUnlocked(state, 'river'), false);
  assert.throws(() => beginBattle(state, 'river', 'river-1', rng), /earlier habitat/);
  let finalReward;
  for (const habitat of HABITATS) {
    assert.equal(isHabitatUnlocked(state, habitat.id), true);
    for (const encounter of habitat.encounters) {
      state = beginBattle(state, habitat.id, encounter.id, rng);
      let turnCount = 0;
      while (state.battle) {
        const result = submitAnswer(state, state.battle.question.answer, 'strike', rng);
        assert.notEqual(result.outcome, 'retreat');
        state = result.state;
        if (result.reward) finalReward = result.reward;
        assert.ok(++turnCount < 20);
      }
      assert.ok(state.completed.includes(encounter.id));
      state = parseSave(serializeSave(state));
    }
    assert.ok(state.collection.includes(DINOS.find((dino) => dino.unlockHabitat === habitat.id).id));
  }
  assert.equal(state.completed.length, 12);
  assert.equal(state.collection.length, 5);
  assert.equal(state.xp, 840);
  assert.equal(state.coins, 380);
  assert.equal(getLevel(state), 8);
  assert.equal(finalReward.campaignComplete, true);
  const before = copy(state);
  state = beginBattle(state, 'fern', 'fern-3', rng);
  while (state.battle) {
    const result = submitAnswer(state, state.battle.question.answer, 'burst', rng);
    state = result.state;
    if (result.reward) {
      assert.equal(result.reward.firstClear, false);
      assert.equal(result.reward.creature, null);
    }
  }
  assert.deepEqual(state.collection, before.collection);
  assert.deepEqual(state.completed, before.completed);
  assert.equal(state.coins - before.coins, 8);
  assert.throws(() => submitAnswer(state, 1), /Choose a challenge/);
});

test('moves, friend perks, gear, and retreat behave without penalizing mistakes', () => {
  const rng = seeded(54);
  const base = beginBattle(starter(), 'fern', 'fern-1', rng);
  const strike = submitAnswer(base, base.battle.question.answer, 'strike', rng);
  const burst = submitAnswer(base, base.battle.question.answer, 'burst', rng);
  assert.equal(strike.damage, 28);
  assert.equal(burst.damage, 40);
  assert.equal(burst.incoming - strike.incoming, 10);
  const hurt = copy(base);
  hurt.battle.playerHp = 30;
  const restored = submitAnswer(hurt, hurt.battle.question.answer, 'mend', rng);
  assert.equal(restored.state.battle.playerHp, 38);
  hurt.battle.playerHp = 1;
  const retreat = submitAnswer(hurt, hurt.battle.question.answer, 'strike', rng);
  assert.equal(retreat.outcome, 'retreat');
  assert.equal(retreat.state.battle, null);
  assert.deepEqual(retreat.state.completed, []);
  assert.equal(beginBattle(retreat.state, 'fern', 'fern-1', rng).battle.playerHp, 100);
  const water = beginBattle(createSave({ name: 'River', starter: 'brook' }), 'fern', 'fern-1', rng);
  water.battle.playerHp = 30;
  assert.equal(submitAnswer(water, water.battle.question.answer, 'mend', rng).healing, 23);
  const stone = beginBattle(createSave({ name: 'Rock', starter: 'pebble' }), 'fern', 'fern-1', rng);
  assert.equal(submitAnswer(stone, stone.battle.question.answer, 'strike', rng).incoming, 10);
  const equipped = starter();
  equipped.ownedGear.push('sun');
  equipped.gear = 'sun';
  const gearedBattle = beginBattle(equipped, 'fern', 'fern-1', rng);
  assert.equal(gearedBattle.battle.playerMaxHp, 100 + GEARS.find((gear) => gear.id === 'sun').hpBonus);
  assert.equal(submitAnswer(gearedBattle, gearedBattle.battle.question.answer, 'strike', rng).damage, 32);
});

test('save import rejects malformed, incompatible, forged, and oversized files', () => {
  const good = starter();
  assert.deepEqual(parseSave(serializeSave(good)), good);
  assert.throws(() => parseSave('{broken json'), /valid JSON/);
  assert.throws(() => parseSave(' '.repeat(100_001)), /100 KB/);
  for (const mutate of [
    (s) => { s.version = 2; },
    (s) => { s.player.name = '<script>'; },
    (s) => { s.player.name = ''; },
    (s) => { s.player.starter = 'ember'; },
    (s) => { s.coins = -1; },
    (s) => { s.xp = 1.2; },
    (s) => { s.topic = 'calculus'; },
    (s) => { s.completed = ['river-1']; },
    (s) => { s.completed = ['fern-1', 'fern-1']; },
    (s) => { s.collection.push('ember'); },
    (s) => { s.equipped = 'brook'; },
    (s) => { s.gear = 'sun'; },
    (s) => { s.stats.correct = 1; },
    (s) => { s.stats.answered = 1; },
    (s) => { s.stats.byTopic.unknown = { answered: 0, correct: 0 }; },
    (s) => { s.settings.sound = 'yes'; },
    (s) => { s.unexpected = true; },
    (s) => { delete s.battle; },
  ]) {
    const bad = copy(good);
    mutate(bad);
    assert.throws(() => validateSave(bad));
  }
  assert.throws(() => parseSave('{"__proto__":{"polluted":true}}'));
  assert.equal({}.polluted, undefined);
  const battle = beginBattle(good, 'fern', 'fern-1', seeded());
  assert.deepEqual(parseSave(serializeSave(battle)), battle);
  for (const mutate of [
    (s) => { s.battle.question.answer += 1; },
    (s) => { s.battle.question.prompt = 'Fake question'; },
    (s) => { s.battle.question.data.a = 999999; },
    (s) => { s.battle.question.attempted = true; },
    (s) => { s.battle.encounterId = 'summit-1'; },
    (s) => { s.battle.enemyHp = 0; },
    (s) => { s.battle.playerHp = 9999; },
    (s) => { s.battle.enemyMaxHp = 999; },
    (s) => { s.battle.selectedMove = 'cheat'; },
  ]) {
    const bad = copy(battle);
    mutate(bad);
    assert.throws(() => validateSave(bad));
  }
});

test('invalid answers never mutate or count a submission', () => {
  const state = beginBattle(starter(), 'fern', 'fern-1', seeded());
  for (const answer of [NaN, Infinity, '', '4', -1, 1.5, 1_000_001]) {
    assert.throws(() => submitAnswer(state, answer));
  }
  assert.equal(state.stats.answered, 0);
  assert.throws(() => beginBattle(state, 'fern', 'fern-2'), /current challenge/);
});

test('earned coins can adopt the other starters, but not habitat reward friends', () => {
  const original = starter();
  assert.throws(() => adoptDino(original, 'brook'), /Earn 90/);
  assert.throws(() => adoptDino(original, 'sprig'), /already/);
  assert.throws(() => adoptDino(original, 'ember'), /adoptable friend/);
  original.coins = ADOPTION_COST * 2;
  const withBrook = adoptDino(original, 'brook');
  assert.equal(original.coins, ADOPTION_COST * 2);
  assert.equal(original.collection.length, 1);
  assert.equal(withBrook.coins, ADOPTION_COST);
  assert.deepEqual(withBrook.collection, ['sprig', 'brook']);
  const withPebble = adoptDino(withBrook, 'pebble');
  withPebble.equipped = 'pebble';
  assert.equal(withPebble.coins, 0);
  assert.deepEqual(parseSave(serializeSave(withPebble)), withPebble);
  assert.throws(() => adoptDino(withPebble, 'pebble'), /already/);
});
