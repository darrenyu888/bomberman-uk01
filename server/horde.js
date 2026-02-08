const Bots = require('./bots');

// Horde mode v1:
// - Endless-ish waves of bots. Spawn loop fills empty slots with fresh bots.
// - Scoring: count bot kills attributed to bomb owner.
// - End condition: all humans dead.

const hordeLoopsByGameId = new Map(); // gameId -> intervalId

function isBotId(id) {
  return Bots && Bots.isBotId ? Bots.isBotId(id) : (typeof id === 'string' && id.startsWith('bot:'));
}

function countAliveHumans(game) {
  let n = 0;
  for (const [id, p] of Object.entries(game.players || {})) {
    if (!p || !p.isAlive) continue;
    if (isBotId(id)) continue;
    n += 1;
  }
  return n;
}

function countAliveBots(game) {
  let n = 0;
  for (const [id, p] of Object.entries(game.players || {})) {
    if (!p || !p.isAlive) continue;
    if (!isBotId(id)) continue;
    n += 1;
  }
  return n;
}

function recordBotKill({ game, killerId }) {
  if (!game || !game.stats) return;

  // Team score: humans vs horde
  game.stats.teamKills = (game.stats.teamKills || 0) + 1;

  if (!killerId || isBotId(killerId)) return;
  game.stats.perPlayerKills = game.stats.perPlayerKills || {};
  game.stats.perPlayerKills[killerId] = (game.stats.perPlayerKills[killerId] || 0) + 1;
}

function recordHumanDeath({ game, playerId, atMs }) {
  if (!game || !game.startedAt || !game.stats || !playerId) return;
  if (isBotId(playerId)) return;

  const diedAt = Number.isFinite(atMs) ? atMs : Date.now();
  const survival = Math.max(0, diedAt - game.startedAt);

  game.stats.perPlayerSurvivalMs = game.stats.perPlayerSurvivalMs || {};
  if (typeof game.stats.perPlayerSurvivalMs[playerId] !== 'number') {
    game.stats.perPlayerSurvivalMs[playerId] = survival;
  }
}

function buildSummary(game) {
  const endedAt = game.endedAt || Date.now();
  const startedAt = game.startedAt || endedAt;

  const perPlayer = [];
  for (const [id, p] of Object.entries(game.players || {})) {
    if (!p) continue;
    if (isBotId(id)) continue;

    const kills = (game.stats && game.stats.perPlayerKills && game.stats.perPlayerKills[id]) || 0;

    let survivalMs = (game.stats && game.stats.perPlayerSurvivalMs && game.stats.perPlayerSurvivalMs[id]);
    if (typeof survivalMs !== 'number') {
      // still alive at end
      survivalMs = Math.max(0, endedAt - startedAt);
    }

    perPlayer.push({
      player_id: id,
      displayName: p.displayName || p.skin,
      skin: p.skin,
      kills,
      survivalMs,
      alive: !!p.isAlive,
    });
  }

  perPlayer.sort((a, b) => (b.survivalMs - a.survivalMs) || (b.kills - a.kills));

  return {
    mode: 'horde',
    startedAt,
    endedAt,
    durationMs: Math.max(0, endedAt - startedAt),
    teamKills: (game.stats && game.stats.teamKills) || 0,
    perPlayer,
  };
}

function stopHordeForGame(gameId) {
  if (!gameId) return;
  const t = hordeLoopsByGameId.get(gameId);
  if (t) {
    try { clearInterval(t); } catch (_) {}
    hordeLoopsByGameId.delete(gameId);
  }
}

function startHordeForRunningGame({ game }) {
  if (!game || !game.id) return;
  if (game.mode !== 'horde') return;
  if (hordeLoopsByGameId.has(game.id)) return;

  const tick = () => {
    try {
      if (!game.startedAt) game.startedAt = Date.now();

      const aliveHumans = countAliveHumans(game);
      if (aliveHumans <= 0) {
        stopHordeForGame(game.id);
        return;
      }

      // Spawn target: keep some pressure, ramp slowly over time.
      const age = Date.now() - (game.startedAt || Date.now());
      const wave = Math.min(8, Math.floor(age / 25000)); // increase every 25s

      const maxSlots = Math.max(0, Number(game.max_players) || 4);
      const desiredAliveBots = Math.max(1, Math.min(maxSlots - aliveHumans, 1 + wave));

      // Fill empty slots with alive bots.
      const aliveBots = countAliveBots(game);
      const missing = Math.max(0, desiredAliveBots - aliveBots);

      for (let i = 0; i < missing; i++) {
        // Add a fresh bot player entity
        const botId = Bots.makeBotIdForGame ? Bots.makeBotIdForGame(game) : null;
        const id = botId || `bot:${game.id}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
        try {
          if (Object.keys(game.players || {}).length >= maxSlots) break;
          game.addPlayer(id);

          // Give horde NPCs a visible character variant + archetype
          try {
            const p = game.players && game.players[id];
            if (p) {
              const types = [
                // Use distinct paper-doll cosmetics so types are visually obvious.
                { key: 'chaser',  name: '追擊者', char: 'char_5', hat: 'hat_3',  outfit: 'outfit_6', face: 'face_2', pattern: 'pattern_3', w: 28 },
                { key: 'miner',   name: '工兵',   char: 'char_7', hat: 'hat_6',  outfit: 'outfit_3', face: 'face_1', pattern: 'pattern_5', w: 18 },
                { key: 'sniper',  name: '狙擊手', char: 'char_6', hat: 'hat_9',  outfit: 'outfit_8', face: 'face_4', pattern: 'pattern_2', w: 18 },
                { key: 'ghoster', name: '幽靈',   char: 'char_8', hat: 'hat_1',  outfit: 'outfit_2', face: 'face_3', pattern: 'pattern_6', w: 18 },
                { key: 'trapper', name: '陷阱師', char: 'char_2', hat: 'hat_8',  outfit: 'outfit_9', face: 'face_2', pattern: 'pattern_1', w: 18 },
              ];
              let total = types.reduce((s, x) => s + x.w, 0);
              let r = Math.random() * total;
              let pick = types[0];
              for (const t of types) { if (r < t.w) { pick = t; break; } r -= t.w; }

              p.npcType = pick.key;
              p.displayName = pick.name;
              p.avatarParts = p.avatarParts || {};
              p.avatarParts.character = pick.char;
              p.avatarParts.hat = pick.hat;
              p.avatarParts.outfit = pick.outfit;
              p.avatarParts.face = pick.face;
              p.avatarParts.pattern = pick.pattern;
            }
          } catch (_) {}

          Bots.ensureBotRuntimeForId && Bots.ensureBotRuntimeForId({ game, botId: id });

          // Notify clients so they can render newly spawned bots after match start
          try {
            if (global.serverSocket && global.serverSocket.sockets) {
              global.serverSocket.sockets.to(game.id).emit('spawn player', { player: (game.players && game.players[id]) || null });
            }
          } catch (_) {}
        } catch (_) {}
      }
    } catch (_) {}
  };

  const iid = setInterval(tick, 1300);
  hordeLoopsByGameId.set(game.id, iid);
  // fire once
  tick();
}

module.exports = {
  startHordeForRunningGame,
  stopHordeForGame,
  recordBotKill,
  recordHumanDeath,
  buildSummary,
};
