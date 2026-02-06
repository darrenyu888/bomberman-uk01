const test = require('node:test');
const assert = require('node:assert/strict');

const {
  SPEED,
  POWER,
  DELAY,
  SHIELD,
  REMOTE,
  KICK,
  SHIELD_DURATION_MS,
} = require('../server/constants');

const { Player } = require('../server/entity/player');
const { Game } = require('../server/entity/game');

function mkPlayer() {
  return new Player({
    id: 'p1',
    skin: 'Theodora',
    spawn: { x: 35, y: 35 },
    spawnOnGrid: { col: 1, row: 1 },
  });
}

test('Player.pickSpoil: shield activates for 1.5s', () => {
  const p = mkPlayer();
  const before = Date.now();
  p.pickSpoil(SHIELD);
  assert.ok(p.shield_until >= before + SHIELD_DURATION_MS - 10);
});

test('Player.pickSpoil: remote and kick flags set', () => {
  const p = mkPlayer();
  assert.equal(p.hasRemote, false);
  assert.equal(p.hasKick, false);
  p.pickSpoil(REMOTE);
  p.pickSpoil(KICK);
  assert.equal(p.hasRemote, true);
  assert.equal(p.hasKick, true);
});

test('Game.addBomb: rejects stacking bombs in the same tile', () => {
  const g = new Game({ map_name: 'arena_map' });
  const b1 = g.addBomb({ col: 2, row: 2, power: 1, owner_id: 'p1' });
  assert.ok(b1);
  const b2 = g.addBomb({ col: 2, row: 2, power: 1, owner_id: 'p1' });
  assert.equal(b2, false);
});

test('Game.deleteBomb removes bomb from state', () => {
  const g = new Game({ map_name: 'arena_map' });
  const b = g.addBomb({ col: 2, row: 2, power: 1, owner_id: 'p1' });
  assert.ok(b);
  g.deleteBomb(b.id);
  assert.equal(g.findBomb(b.id), undefined);
});

test('Game.findBombAt returns bomb by grid location', () => {
  const g = new Game({ map_name: 'arena_map' });
  const b = g.addBomb({ col: 2, row: 2, power: 1, owner_id: 'p1' });
  assert.ok(b);
  const found = g.findBombAt(2, 2);
  assert.equal(found.id, b.id);
});
