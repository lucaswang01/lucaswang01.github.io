import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_CONFIG, getWorldObjects, canMove, movePosition } from '../world.mjs';

test('each region has a walkable spawn, two chests, a ranger and the campaign encounters', () => {
  assert.deepEqual(Object.keys(WORLD_CONFIG), ['fern', 'river', 'crystal', 'summit']);
  for (const [id, region] of Object.entries(WORLD_CONFIG)) {
    assert.equal(region.width, 1600);
    assert.equal(region.height, 1000);
    assert.ok(canMove(id, region.spawn.x, region.spawn.y));
    assert.equal(region.objects.filter(o => o.type === 'npc').length, 1);
    assert.equal(region.objects.filter(o => o.type === 'chest').length, 2);
    assert.deepEqual(region.objects.filter(o => o.type === 'enemy' && !o.roaming).map(o => o.id), [1, 2, 3].map(n => `${id}-${n}`));
    for (const object of region.objects) assert.ok(canMove(id, object.x, object.y), `${object.id} has a usable footprint`);
  }
});

test('boundaries, trunks, rocks and water block movement; the bridge does not', () => {
  for (const id of Object.keys(WORLD_CONFIG)) {
    assert.equal(canMove(id, 0, 760), false);
    assert.equal(canMove(id, 1600, 500), false);
    assert.equal(canMove(id, 800, 0), false);
    assert.equal(canMove(id, 500, 1000), false);
    assert.equal(canMove(id, 304, 327), false, 'tree trunk is solid');
    assert.equal(canMove(id, 192, 420), false, 'boulder is solid');
  }
  assert.equal(canMove('river', 830, 420), false);
  assert.equal(canMove('river', 830, 860), false);
  assert.equal(canMove('river', 830, 710), true, 'wooden bridge crosses the river');
  assert.equal(canMove('fern', 900, 180), false, 'forest pond is solid');
  assert.equal(canMove('crystal', 800, 220), false, 'hollow pool is solid');
  assert.equal(canMove('unknown', 220, 760), false);
  assert.equal(canMove('fern', NaN, 760), false);
});

test('movement is continuous, slides along obstacles and cannot tunnel', () => {
  const start = { x: 220, y: 760 };
  const moved = movePosition('fern', start, 115, 0);
  assert.ok(Math.abs(moved.x - 335) < .001);
  assert.equal(moved.y, 760);
  assert.deepEqual(start, { x: 220, y: 760 }, 'caller position is never mutated');
  const riverBlocked = movePosition('river', { x: 700, y: 420 }, 500, 0);
  assert.ok(riverBlocked.x < 750, 'a large frame must not tunnel across water');
  const riverCrossed = movePosition('river', { x: 700, y: 710 }, 290, 0);
  assert.ok(Math.abs(riverCrossed.x - 990) < .001, 'same displacement crosses on the bridge');
  const slide = movePosition('river', { x: 740, y: 430 }, 60, 60);
  assert.ok(slide.x < 750);
  assert.ok(slide.y > 480, 'blocked x movement still allows y movement');
  const boundary = movePosition('fern', start, -10000, 0);
  assert.ok(boundary.x >= 63 && boundary.x < 70);
  assert.deepEqual(movePosition('fern', start, NaN, 0), start);
});

test('campaign guardians and gates unlock in order, while completed enemies become rematches', () => {
  const state = { completed: [], world: { treasures: [], talked: [] } };
  let objects = getWorldObjects('fern', state);
  assert.equal(objects.find(o => o.id === 'fern-3').locked, true);
  assert.equal(objects.find(o => o.id === 'fern-exit').locked, true);
  state.completed.push('fern-1', 'fern-2');
  objects = getWorldObjects('fern', state);
  assert.equal(objects.find(o => o.id === 'fern-1').completed, true);
  assert.equal(objects.find(o => o.id === 'fern-3').locked, false);
  assert.equal(objects.find(o => o.id === 'fern-exit').locked, true);
  state.completed.push('fern-3');
  objects = getWorldObjects('fern', state);
  assert.equal(objects.find(o => o.id === 'fern-exit').locked, false);
  assert.equal(getWorldObjects('river', state).find(o => o.id === 'river-entrance').locked, false);
});

test('treasures and conversations reflect save state without mutating the map or save', () => {
  const state = { completed: ['fern-1'], world: { treasures: ['fern-chest-1'], talked: ['fern-ranger'] } };
  const snapshot = JSON.stringify(state);
  const objects = getWorldObjects('fern', state);
  assert.equal(objects.find(o => o.id === 'fern-chest-1').opened, true);
  assert.equal(objects.find(o => o.id === 'fern-chest-2').opened, false);
  assert.equal(objects.find(o => o.id === 'fern-ranger').talked, true);
  objects.find(o => o.id === 'fern-1').x = 0;
  assert.equal(getWorldObjects('fern', state).find(o => o.id === 'fern-1').x, 470);
  assert.equal(JSON.stringify(state), snapshot);
});

test('every objective is reachable on foot from its spawn, including across the river bridge', () => {
  // Flood-fill a 20-pixel lattice using the actual collision function, not a separate map approximation.
  for (const [id, region] of Object.entries(WORLD_CONFIG)) {
    const queue = [{ ...region.spawn }];
    const seen = new Set([`${region.spawn.x},${region.spawn.y}`]);
    const reached = new Set();
    for (let index = 0; index < queue.length; index++) {
      const position = queue[index];
      region.objects.forEach(object => {
        if (Math.hypot(position.x - object.x, position.y - object.y) < 38) reached.add(object.id);
      });
      for (const [dx, dy] of [[20, 0], [-20, 0], [0, 20], [0, -20]]) {
        const x = position.x + dx, y = position.y + dy, key = `${x},${y}`;
        if (seen.has(key) || !canMove(id, x, y) || !canMove(id, position.x + dx / 2, position.y + dy / 2)) continue;
        seen.add(key);queue.push({ x, y });
      }
    }
    assert.ok(queue.length > 2000, `${id} has a sizeable explorable landscape`);
    for (const object of region.objects) assert.ok(reached.has(object.id), `${object.id} is reachable`);
  }
});
