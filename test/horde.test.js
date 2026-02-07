const test = require('node:test');
const assert = require('node:assert/strict');

const { Game } = require('../server/entity/game');
const Horde = require('../server/horde');

test('Horde.recordBotKill increments team + per-player kills (humans only)', () => {
  const g = new Game({ map_name: 'arena_map', mode: 'horde' });
  g.addPlayer('p1');
  g.addPlayer('bot:1');

  assert.equal(g.stats.teamKills, 0);
  assert.deepEqual(g.stats.perPlayerKills, {});

  Horde.recordBotKill({ game: g, killerId: 'p1' });
  Horde.recordBotKill({ game: g, killerId: 'p1' });
  Horde.recordBotKill({ game: g, killerId: 'bot:1' }); // ignored for per-player

  assert.equal(g.stats.teamKills, 3);
  assert.equal(g.stats.perPlayerKills['p1'], 2);
});

test('Horde.buildSummary computes survival time for alive players', () => {
  const g = new Game({ map_name: 'arena_map', mode: 'horde' });
  g.addPlayer('p1');
  g.players['p1'].displayName = 'Alice';
  g.startedAt = 1000;
  g.endedAt = 6000;

  // p1 alive at end
  const summary = Horde.buildSummary(g);
  assert.equal(summary.mode, 'horde');
  assert.equal(summary.durationMs, 5000);
  assert.equal(summary.teamKills, 0);
  assert.equal(summary.perPlayer.length, 1);
  assert.equal(summary.perPlayer[0].displayName, 'Alice');
  assert.equal(summary.perPlayer[0].survivalMs, 5000);
});
