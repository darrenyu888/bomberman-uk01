const {
  TILE_SIZE,
  EMPTY_CELL,
  DESTRUCTIBLE_CELL,
  NON_DESTRUCTIBLE_CELL,
  INITIAL_DELAY,
  INITIAL_SPEED,
  MAX_SPEED,
  MIN_DELAY,
} = require('./constants');

const BOT_PREFIX = 'bot:';

// Map special tiles (must match client tile ids)
const TILE_PORTAL = 2;
const TILE_SPEED_FLOOR = 3;

const BOT_DIFFICULTY_PROFILES = {
  easy:   { reactionDelayMs: 450, aggression: 0.20, validateEscape: false, portalCooldownMs: 1500, speedMultiplier: 0.85, wallhack: false },
  normal: { reactionDelayMs: 250, aggression: 0.40, validateEscape: true,  portalCooldownMs: 1100, speedMultiplier: 1.05, wallhack: false },
  hard:   { reactionDelayMs: 100, aggression: 0.75, validateEscape: true,  portalCooldownMs: 700,  speedMultiplier: 1.35, wallhack: true },
};

function difficultyForGame(game) {
  const key = (game && game.aiDifficulty) || 'normal';
  const base = BOT_DIFFICULTY_PROFILES[key] || BOT_DIFFICULTY_PROFILES.normal;

  // Sudden death boost when only bots are left (server sets game.suddenDeathLevel)
  const lvl = Math.max(0, Math.min(8, Number(game && game.suddenDeathLevel) || 0));
  if (!lvl) return base;

  const aggression = Math.min(1.0, base.aggression + (0.08 * lvl));
  const reactionDelayMs = Math.max(18, Math.floor(base.reactionDelayMs / (1 + 0.18 * lvl)));

  return {
    ...base,
    aggression,
    reactionDelayMs,
  };
}

// In-memory bot runtime state (per game)
const botLoopsByGameId = new Map(); // gameId -> { timers: Map(botId->intervalId), bots: Set(botId) }
const playModuleByGameId = new Map(); // gameId -> play module (for createBomb)
const botStateByGameId = new Map(); // gameId -> Map(botId -> { col,row,lastBombAt,lastMoveAt,lastPortalAt })
const desiredBotsByGameId = new Map(); // gameId -> number
const difficultyByGameId = new Map();  // gameId -> 'easy'|'normal'|'hard'
const specialsByGameId = new Map(); // gameId -> { portalCells: [{col,row}], speedCells: Set("c,r") }
const humanPosByGameId = new Map(); // gameId -> Map(humanId -> { col,row,x,y,ts })

// Sudden death state
const suddenDeathByGameId = new Map(); // gameId -> { humansGoneAt, level, lastTickAt }

function isBotId(id) {
  return typeof id === 'string' && id.startsWith(BOT_PREFIX);
}

function hasOnlyBots(game) {
  const ids = Object.keys(game.players || {});
  if (ids.length === 0) return false;
  return ids.every(isBotId);
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

function pickEdgeEmptyCells(game, count) {
  const cells = [];
  if (!game || !game.shadow_map) return cells;
  const h = game.shadow_map.length;
  const w = game.shadow_map[0] ? game.shadow_map[0].length : 0;
  if (!h || !w) return cells;

  const candidates = [];
  const add = (r, c) => {
    if (r < 0 || c < 0 || r >= h || c >= w) return;
    if (game.shadow_map[r][c] !== EMPTY_CELL) return;
    candidates.push({ row: r, col: c });
  };

  // perimeter rings: outer + one inner ring
  for (let c = 0; c < w; c++) { add(0, c); add(h - 1, c); if (h > 2) { add(1, c); add(h - 2, c); } }
  for (let r = 0; r < h; r++) { add(r, 0); add(r, w - 1); if (w > 2) { add(r, 1); add(r, w - 2); } }

  // shuffle-ish sampling
  for (let i = 0; i < count && candidates.length; i++) {
    const idx = Math.floor(Math.random() * candidates.length);
    cells.push(candidates[idx]);
    candidates.splice(idx, 1);
  }
  return cells;
}

function suddenDeathTick(game) {
  if (!game || !game.id) return;
  const humans = countAliveHumans(game);
  const now = Date.now();

  if (humans > 0) {
    suddenDeathByGameId.delete(game.id);
    game.suddenDeathLevel = 0;
    return;
  }

  const st = suddenDeathByGameId.get(game.id) || { humansGoneAt: now, level: 0, lastTickAt: 0 };
  if (!st.humansGoneAt) st.humansGoneAt = now;

  const goneFor = now - st.humansGoneAt;
  // Start sudden death after 30s with only bots
  if (goneFor < 30000) {
    suddenDeathByGameId.set(game.id, st);
    return;
  }

  // escalate every 4s
  if (now - st.lastTickAt < 4000) {
    suddenDeathByGameId.set(game.id, st);
    return;
  }

  st.lastTickAt = now;
  st.level = Math.min(6, (st.level || 0) + 1);
  game.suddenDeathLevel = st.level;
  suddenDeathByGameId.set(game.id, st);

  // "Skyfall" walls from edges (shrink arena)
  const wallsToDrop = Math.min(10, 3 + st.level);
  const drops = pickEdgeEmptyCells(game, wallsToDrop);
  if (!drops.length) return;

  // Update server shadow map so bots/pathing see it as wall
  for (const d of drops) {
    try { game.shadow_map[d.row][d.col] = NON_DESTRUCTIBLE_CELL; } catch (_) {}
  }

  // Notify clients to place wall tiles visually
  try {
    global.serverSocket.sockets.in(game.id).emit('sudden death tiles', {
      level: st.level,
      tiles: drops.map(d => ({ col: d.col, row: d.row, kind: 'wall' }))
    });
  } catch (_) {}
}

function makeBotId(game) {
  // stable-ish uniqueness
  return `${BOT_PREFIX}${game.id}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function getSpecials(game) {
  if (!game || !game.id) return { portalCells: [], speedCells: new Set() };
  if (specialsByGameId.has(game.id)) return specialsByGameId.get(game.id);

  const portalCells = [];
  const speedCells = new Set();

  try {
    const tiles = (game.layer_info && game.layer_info.data) || [];
    const width = game.layer_info && game.layer_info.width;
    const height = game.layer_info && game.layer_info.height;
    if (!width || !height || !Array.isArray(tiles)) {
      const res = { portalCells, speedCells };
      specialsByGameId.set(game.id, res);
      return res;
    }

    let i = 0;
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const v = tiles[i++];
        // Portal tile id must NOT conflict with balk tile id (e.g. cold_map has balk=2).
        if (v === TILE_PORTAL && v !== (game.layer_info && game.layer_info.properties && game.layer_info.properties.balk)) {
          portalCells.push({ col, row });
        }
        if (v === TILE_SPEED_FLOOR) speedCells.add(`${col},${row}`);
      }
    }
  } catch (_) {}

  const res = { portalCells, speedCells };
  specialsByGameId.set(game.id, res);
  return res;
}

function gridFromPlayer(player) {
  if (player && player.spawnOnGrid && typeof player.spawnOnGrid.col === 'number') {
    return { col: player.spawnOnGrid.col, row: player.spawnOnGrid.row };
  }
  if (player && player.spawn && typeof player.spawn.x === 'number') {
    return {
      col: Math.floor(player.spawn.x / TILE_SIZE),
      row: Math.floor(player.spawn.y / TILE_SIZE),
    };
  }
  return { col: 1, row: 1 };
}

function getDifficulty(game) {
  if (!game || !game.id) return 'normal';
  if (!difficultyByGameId.has(game.id)) difficultyByGameId.set(game.id, 'normal');
  return difficultyByGameId.get(game.id) || 'normal';
}

function setDifficulty(game, key) {
  if (!game || !game.id) return;
  const k = (key || '').toString().toLowerCase();
  const v = (k === 'easy' || k === 'hard' || k === 'normal') ? k : 'normal';
  difficultyByGameId.set(game.id, v);
  game.aiDifficulty = v;
}

function getDesiredBots(game) {
  if (!game || !game.id) return 0;
  // default: fill to max (human + bots)
  if (!desiredBotsByGameId.has(game.id)) {
    desiredBotsByGameId.set(game.id, Math.max(0, (game.max_players || 4) - 1));
  }
  return desiredBotsByGameId.get(game.id) || 0;
}

function setDesiredBots(game, n) {
  if (!game || !game.id) return;
  const max = Math.max(0, (game.max_players || 4) - 1);
  const v = Math.max(0, Math.min(max, Number.isFinite(n) ? Math.floor(n) : 0));
  desiredBotsByGameId.set(game.id, v);
}

function countBots(game) {
  return Object.keys(game.players || {}).filter(isBotId).length;
}

function ensureBotsInPendingGame(game) {
  const desired = getDesiredBots(game);

  // remove extra bots first
  const botIds = Object.keys(game.players || {}).filter(isBotId);
  while (botIds.length > desired) {
    const id = botIds.pop();
    try { game.removePlayer(id); } catch (_) {}
  }

  // add missing bots
  while (countBots(game) < desired && Object.keys(game.players).length < game.max_players) {
    const botId = makeBotId(game);
    game.addPlayer(botId);

    // Track bot starting position
    const stateMap = botStateByGameId.get(game.id) || new Map();
    const p = game.players[botId];
    const { col, row } = gridFromPlayer(p);
    stateMap.set(botId, { col, row, lastBombAt: 0, lastMoveAt: 0, lastPortalAt: 0 });
    botStateByGameId.set(game.id, stateMap);
  }
}

function removeBotsFromGame(game) {
  for (const id of Object.keys(game.players || {})) {
    if (isBotId(id)) {
      try {
        game.removePlayer(id);
      } catch (e) {
        // ignore
      }
    }
  }

  stopBotsForGame(game.id);
}

function inBounds(game, row, col) {
  if (!game || !game.shadow_map) return false;
  if (row < 0 || col < 0) return false;
  if (row >= game.shadow_map.length) return false;
  if (col >= game.shadow_map[0].length) return false;
  return true;
}

function isWalkable(game, row, col) {
  if (!inBounds(game, row, col)) return false;
  const cell = game.shadow_map[row][col];
  // only walk on empty cells
  return cell === EMPTY_CELL;
}

function computeBlastCells(game, col, row, power) {
  const cells = [];
  if (!inBounds(game, row, col)) return cells;

  cells.push({ col, row });

  const dirs = [
    { dc: 0, dr: -1 },
    { dc: 1, dr: 0 },
    { dc: 0, dr: 1 },
    { dc: -1, dr: 0 },
  ];

  for (const d of dirs) {
    for (let i = 1; i <= power; i++) {
      const r = row + d.dr * i;
      const c = col + d.dc * i;
      if (!inBounds(game, r, c)) break;

      const cell = game.getMapCell(r, c);
      const isWall = cell === NON_DESTRUCTIBLE_CELL;
      const isBalk = cell === DESTRUCTIBLE_CELL;

      cells.push({ col: c, row: r });

      if (isWall || isBalk) break;
    }
  }

  return cells;
}

function buildDangerAndBlocks(game) {
  const danger = new Set();
  const blocks = new Set();

  if (!game || !game.bombs) return { danger, blocks };

  for (const bomb of game.bombs.values()) {
    if (!bomb) continue;
    blocks.add(`${bomb.col},${bomb.row}`);
    const blast = computeBlastCells(game, bomb.col, bomb.row, bomb.power || 1);
    for (const c of blast) danger.add(`${c.col},${c.row}`);
  }

  return { danger, blocks };
}

function bfsNextStepToTarget(game, startCol, startRow, targetCol, targetRow, { danger, blocks }, maxDepth = 18) {
  const startKey = `${startCol},${startRow}`;
  const targetKey = `${targetCol},${targetRow}`;
  if (startKey === targetKey) return { col: startCol, row: startRow, dist: 0 };

  const q = [{ col: startCol, row: startRow, dist: 0 }];
  const seen = new Set([startKey]);
  const parent = new Map();

  const neigh = [
    { dc: 1, dr: 0 },
    { dc: -1, dr: 0 },
    { dc: 0, dr: 1 },
    { dc: 0, dr: -1 },
  ];

  let foundKey = null;

  while (q.length) {
    const cur = q.shift();
    const curKey = `${cur.col},${cur.row}`;

    if (curKey === targetKey) {
      foundKey = curKey;
      break;
    }

    if (cur.dist >= maxDepth) continue;

    for (const d of neigh) {
      const nc = cur.col + d.dc;
      const nr = cur.row + d.dr;
      const k = `${nc},${nr}`;
      if (seen.has(k)) continue;
      if (!isWalkable(game, nr, nc)) continue;
      if (blocks.has(k)) continue;
      if (danger.has(k)) continue; // prefer safe path

      seen.add(k);
      parent.set(k, curKey);
      q.push({ col: nc, row: nr, dist: cur.dist + 1 });
    }
  }

  if (!foundKey) return { col: startCol, row: startRow, dist: Infinity };

  // backtrack to first step
  let stepKey = foundKey;
  let prevKey = parent.get(stepKey);
  while (prevKey && prevKey !== startKey) {
    stepKey = prevKey;
    prevKey = parent.get(stepKey);
  }

  const [sc, sr] = stepKey.split(',').map(Number);

  // compute distance
  let dist = 0;
  let t = foundKey;
  while (t && t !== startKey) {
    dist++;
    t = parent.get(t);
  }

  return { col: sc, row: sr, dist };
}

function bfsNextStepToSafety(game, startCol, startRow, { danger, blocks }, maxDepth = 14) {
  // If already safe, no need
  const startKey = `${startCol},${startRow}`;
  if (!danger.has(startKey) && !blocks.has(startKey)) return { col: startCol, row: startRow, dist: 0 };

  const q = [{ col: startCol, row: startRow, dist: 0 }];
  const seen = new Set([startKey]);
  const parent = new Map(); // key -> prevKey

  const neigh = [
    { dc: 1, dr: 0 },
    { dc: -1, dr: 0 },
    { dc: 0, dr: 1 },
    { dc: 0, dr: -1 },
  ];

  let foundKey = null;

  while (q.length) {
    const cur = q.shift();
    const curKey = `${cur.col},${cur.row}`;

    // accept first safe tile
    if (!danger.has(curKey) && !blocks.has(curKey) && isWalkable(game, cur.row, cur.col)) {
      foundKey = curKey;
      break;
    }

    if (cur.dist >= maxDepth) continue;

    for (const d of neigh) {
      const nc = cur.col + d.dc;
      const nr = cur.row + d.dr;
      const k = `${nc},${nr}`;
      if (seen.has(k)) continue;
      if (!isWalkable(game, nr, nc)) continue;
      if (blocks.has(k)) continue;

      seen.add(k);
      parent.set(k, curKey);
      q.push({ col: nc, row: nr, dist: cur.dist + 1 });
    }
  }

  if (!foundKey) return { col: startCol, row: startRow, dist: Infinity };

  // backtrack to first step
  let stepKey = foundKey;
  let prevKey = parent.get(stepKey);
  while (prevKey && prevKey !== startKey) {
    stepKey = prevKey;
    prevKey = parent.get(stepKey);
  }

  const [sc, sr] = stepKey.split(',').map(Number);
  // compute distance from start
  let dist = 0;
  let t = foundKey;
  while (t && t !== startKey) {
    dist++;
    t = parent.get(t);
  }

  return { col: sc, row: sr, dist };
}

function hasLineOfSight(game, fromCol, fromRow, toCol, toRow) {
  if (fromCol !== toCol && fromRow !== toRow) return false;

  if (fromCol === toCol) {
    const c = fromCol;
    const r0 = Math.min(fromRow, toRow);
    const r1 = Math.max(fromRow, toRow);
    for (let r = r0; r <= r1; r++) {
      const cell = game.getMapCell(r, c);
      if (cell === NON_DESTRUCTIBLE_CELL || cell === DESTRUCTIBLE_CELL) return false;
    }
    return true;
  }

  if (fromRow === toRow) {
    const r = fromRow;
    const c0 = Math.min(fromCol, toCol);
    const c1 = Math.max(fromCol, toCol);
    for (let c = c0; c <= c1; c++) {
      const cell = game.getMapCell(r, c);
      if (cell === NON_DESTRUCTIBLE_CELL || cell === DESTRUCTIBLE_CELL) return false;
    }
    return true;
  }

  return false;
}

function updateHumanPosition(gameId, humanId, { x, y }) {
  if (!gameId || !humanId) return;
  const m = humanPosByGameId.get(gameId) || new Map();
  const col = Math.floor((x || 0) / TILE_SIZE);
  const row = Math.floor((y || 0) / TILE_SIZE);
  m.set(humanId, { x, y, col, row, ts: Date.now() });
  humanPosByGameId.set(gameId, m);
}

function findNearestHuman(game, botId) {
  const sMap = botStateByGameId.get(game.id);
  const me = sMap && sMap.get(botId);
  if (!me) return null;

  const posMap = humanPosByGameId.get(game.id);

  let best = null;
  for (const [id, p] of Object.entries(game.players || {})) {
    if (!p || !p.isAlive) continue;
    if (isBotId(id)) continue;

    // Prefer real-time position if available; otherwise fall back to spawn
    let col, row;
    const live = posMap && posMap.get(id);
    if (live && (Date.now() - live.ts) < 10000) {
      col = live.col; row = live.row;
    } else {
      const g = gridFromPlayer(p);
      col = g.col; row = g.row;
    }

    const dist = Math.abs(col - me.col) + Math.abs(row - me.row);
    if (!best || dist < best.dist) best = { id, col, row, dist };
  }
  return best;
}

function findNearestDestructible(game, botId, radius = 9) {
  const sMap = botStateByGameId.get(game.id);
  const me = sMap && sMap.get(botId);
  if (!me) return null;

  let best = null;
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      const r = me.row + dr;
      const c = me.col + dc;
      if (!inBounds(game, r, c)) continue;
      if (game.getMapCell(r, c) !== DESTRUCTIBLE_CELL) continue;
      const dist = Math.abs(dc) + Math.abs(dr);
      if (!best || dist < best.dist) best = { col: c, row: r, dist };
    }
  }
  return best;
}

function adjacentToDestructible(game, col, row) {
  const neigh = [
    { dc: 1, dr: 0 },
    { dc: -1, dr: 0 },
    { dc: 0, dr: 1 },
    { dc: 0, dr: -1 },
  ];
  for (const d of neigh) {
    const r = row + d.dr;
    const c = col + d.dc;
    if (!inBounds(game, r, c)) continue;
    if (game.getMapCell(r, c) === DESTRUCTIBLE_CELL) return true;
  }
  return false;
}

function canEscapeAfterDroppingBomb(game, botId, stateMap, s, playModule) {
  const p = game.players && game.players[botId];
  if (!p) return false;

  const power = p.power || 1;

  // simulate danger: existing bombs + new bomb
  const { danger, blocks } = buildDangerAndBlocks(game);
  blocks.add(`${s.col},${s.row}`);
  for (const c of computeBlastCells(game, s.col, s.row, power)) {
    danger.add(`${c.col},${c.row}`);
  }

  const speed = (p.speed || INITIAL_SPEED);
  const minPeriod = 120;
  const maxPeriod = 320;
  const t = Math.max(0, Math.min(1, (speed - INITIAL_SPEED) / Math.max(1, (MAX_SPEED - INITIAL_SPEED))));
  const movePeriod = Math.floor(maxPeriod - (maxPeriod - minPeriod) * t);

  const explosion = 2000;
  const maxSteps = Math.max(1, Math.floor((explosion - 250) / Math.max(60, movePeriod)));

  const res = bfsNextStepToSafety(game, s.col, s.row, { danger, blocks }, Math.min(18, maxSteps + 8));
  return res.dist <= maxSteps;
}

function findSpoilAt(game, row, col) {
  if (!game || !game.spoils) return null;
  for (const spoil of game.spoils.values()) {
    if (spoil && spoil.row === row && spoil.col === col) return spoil;
  }
  return null;
}

function pickNextStep(game, col, row) {
  const dirs = [
    { dc: 1, dr: 0 },
    { dc: -1, dr: 0 },
    { dc: 0, dr: 1 },
    { dc: 0, dr: -1 },
  ];

  // shuffle dirs
  for (let i = dirs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
  }

  for (const d of dirs) {
    const nr = row + d.dr;
    const nc = col + d.dc;
    if (isWalkable(game, nr, nc)) {
      return { col: nc, row: nr };
    }
  }

  return { col, row };
}

function applyBlastToBots({ game, blastedCells, killerId }) {
  if (!game || !blastedCells || blastedCells.length === 0) return;

  const stateMap = botStateByGameId.get(game.id);
  if (!stateMap) return;

  const danger = new Set(blastedCells.map(c => `${c.col},${c.row}`));

  let someoneDied = false;

  for (const [botId, s] of stateMap.entries()) {
    const p = game.players && game.players[botId];
    if (!p || !isBotId(botId)) continue;
    if (!p.isAlive) continue;

    if (danger.has(`${s.col},${s.row}`)) {
      if (p.shield_until && Date.now() < p.shield_until) {
        continue;
      }
      p.dead();
      someoneDied = true;

      // Horde scoring: attribute bot kills to bomb owner (killerId)
      if (game && game.mode === 'horde') {
        try {
          const Horde = require('./horde');
          Horde.recordBotKill({ game, killerId });
        } catch (_) {}

        // Remove dead bot to free a slot for future spawns
        setTimeout(() => {
          try {
            game.removePlayer(botId);
          } catch (_) {
            try { delete (game.players || {})[botId]; } catch (_) {}
          }
          try {
            stateMap.delete(botId);
          } catch (_) {}
        }, 900);
      }

      global.serverSocket.sockets.to(game.id).emit('show bones', {
        player_id: botId,
        col: s.col,
        row: s.row,
      });
    }
  }

  if (!someoneDied) return;

  // Horde: bots dying doesn't end the match.
  if (game && game.mode === 'horde') return;

  // Check win condition (reuse logic similar to Play.onPlayerDied)
  let alivePlayersCount = 0;
  let alivePlayerSkin = null;
  for (let player of Object.values(game.players || {})) {
    if (!player.isAlive) continue;
    alivePlayerSkin = player.skin;
    alivePlayersCount += 1;
  }

  if (alivePlayersCount >= 2) return;

  setTimeout(function() {
    global.serverSocket.sockets.to(game.id).emit('player win', alivePlayerSkin);
  }, 800);
}

function createBotInterval({ game, botId, stateMap, playModule }) {
  // movement + bomb loop per bot
  const moveTimer = setInterval(() => {
    try {
      const s = stateMap.get(botId);
      if (!s) return;
      const p = game.players && game.players[botId];
      if (!p || !p.isAlive) return;

      const now = Date.now();

      const specials = getSpecials(game);
      const profile = difficultyForGame(game);
      const onSpeed = specials.speedCells.has(`${s.col},${s.row}`);

      // Move rate loosely based on speed (higher speed -> more frequent steps)
      const speed = (p.speed || INITIAL_SPEED) * (onSpeed ? profile.speedMultiplier : 1.0);
      const minPeriod = 90;
      const maxPeriod = 320;
      const t = Math.max(0, Math.min(1, (speed - INITIAL_SPEED) / Math.max(1, (MAX_SPEED - INITIAL_SPEED))));
      const movePeriod = Math.floor(maxPeriod - (maxPeriod - minPeriod) * t);

      if (!s.lastMoveAt) s.lastMoveAt = 0;
      if (now - s.lastMoveAt >= movePeriod) {
        s.lastMoveAt = now;

        const { danger, blocks } = buildDangerAndBlocks(game);
        const hereKey = `${s.col},${s.row}`;

        let next;
        if (danger.has(hereKey) || blocks.has(hereKey)) {
          // emergency: path to nearest safe tile (prefer reaching a portal if available)
          const specials = getSpecials(game);
          let step = null;

          if (specials.portalCells && specials.portalCells.length >= 2) {
            // pick nearest portal
            let bestP = null;
            for (const pp of specials.portalCells) {
              const d = Math.abs(pp.col - s.col) + Math.abs(pp.row - s.row);
              if (!bestP || d < bestP.d) bestP = { ...pp, d };
            }
            if (bestP) {
              const via = bfsNextStepToTarget(game, s.col, s.row, bestP.col, bestP.row, { danger, blocks }, 18);
              // reaction delay: bots don't instantly snap to the optimal escape
              if (profile.reactionDelayMs && (now - (s._lastReactAt || 0) < profile.reactionDelayMs)) {
                step = null;
              } else {
                s._lastReactAt = now;
              }
              if (via && via.dist !== Infinity) step = via;
            }
          }

          if (!step) step = bfsNextStepToSafety(game, s.col, s.row, { danger, blocks }, 16);
          next = { col: step.col, row: step.row };
        } else {
          // Goal selection (priority): visible human -> destructible nearby -> roam
          const human = findNearestHuman(game, botId);
          const destr = findNearestDestructible(game, botId, 9);

          if (human && hasLineOfSight(game, s.col, s.row, human.col, human.row)) {
            next = bfsNextStepToTarget(game, s.col, s.row, human.col, human.row, { danger, blocks }, 14);
          } else if (destr) {
            const approach = [
              { col: destr.col + 1, row: destr.row },
              { col: destr.col - 1, row: destr.row },
              { col: destr.col, row: destr.row + 1 },
              { col: destr.col, row: destr.row - 1 },
            ].filter(t => isWalkable(game, t.row, t.col) && !danger.has(`${t.col},${t.row}`) && !blocks.has(`${t.col},${t.row}`));

            let best = null;
            for (const a of approach) {
              const step = bfsNextStepToTarget(game, s.col, s.row, a.col, a.row, { danger, blocks }, 16);
              if (step.dist === Infinity) continue;
              if (!best || step.dist < best.dist) best = step;
            }

            next = best ? { col: best.col, row: best.row } : pickNextStep(game, s.col, s.row);
          } else {
            next = pickNextStep(game, s.col, s.row);
          }

          const nk = `${next.col},${next.row}`;
          if (danger.has(nk) || blocks.has(nk)) {
            const step = bfsNextStepToSafety(game, s.col, s.row, { danger, blocks }, 10);
            next = { col: step.col, row: step.row };
          }
        }

        s.col = next.col;
        s.row = next.row;

        // Portal usage: if step onto portal, teleport to its paired portal
        if (specials.portalCells.length >= 2) {
          const now2 = Date.now();
          const hereIdx = specials.portalCells.findIndex(p2 => p2.col === s.col && p2.row === s.row);
          if (hereIdx >= 0 && (now2 - (s.lastPortalAt || 0) > profile.portalCooldownMs)) {
            const pairIdx = (hereIdx % 2 === 0) ? hereIdx + 1 : hereIdx - 1;
            const target = specials.portalCells[pairIdx];
            if (target) {
              s.col = target.col;
              s.row = target.row;
              s.lastPortalAt = now2;
            }
          }
        }

        // Emit movement in pixels (top-left like player sprite)
        global.serverSocket.sockets.to(game.id).emit('move player', {
          player_id: botId,
          x: s.col * TILE_SIZE,
          y: s.row * TILE_SIZE,
        });
      }

      // Auto-pick spoils on the tile (Monsters eat spoils?)
      const spoil = findSpoilAt(game, s.row, s.col);
      if (spoil) {
        try {
          game.deleteSpoil(spoil.id);

          // Bots/NPCs now consume spoils to get stronger (classic feel)
          try { p.pickSpoil(spoil.spoil_type); } catch (_) {}

          global.serverSocket.sockets.to(game.id).emit('spoil was picked', {
            player_id: botId,
            spoil_id: spoil.id,
            spoil_type: spoil.spoil_type,
          });
        } catch (_) {}
      }

      // Sudden death tick (only bots left)
      try { suddenDeathTick(game); } catch (_) {}

      // Bomb rate based on delay stat
      const delay = (p.delay || INITIAL_DELAY);
      const sdLevel = Math.max(0, Number(game.suddenDeathLevel) || 0);
      const bombCooldown = Math.max(MIN_DELAY, Math.floor(delay / (1 + 0.12 * sdLevel)));
      if (now - (s.lastBombAt || 0) > bombCooldown) {
        if (isWalkable(game, s.row, s.col)) {
          const nearBox = adjacentToDestructible(game, s.col, s.row);
          const bombChance = nearBox ? 0.92 : 0.45;

          if (Math.random() < bombChance * profile.aggression) {
            let ok = true;
            if (profile.validateEscape) {
              ok = canEscapeAfterDroppingBomb(game, botId, stateMap, s, playModule);
              if (!ok) {
                const neigh = [
                  { dc: 1, dr: 0 },
                  { dc: -1, dr: 0 },
                  { dc: 0, dr: 1 },
                  { dc: 0, dr: -1 },
                ];
                ok = neigh.some(d => isWalkable(game, s.row + d.dr, s.col + d.dc));
              }
            }

            if (ok) {
              s.lastBombAt = now;
              const fakeSocket = { socket_game_id: game.id, id: botId };
              playModule.createBomb.call(fakeSocket, { col: s.col, row: s.row });
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }, 260);

  return moveTimer;
}

function startBotsForRunningGame({ game, playModule }) {
  if (!game || !game.id) return;
  try {
    console.log('bots:start', { gameId: game.id, desired: getDesiredBots(game), diff: getDifficulty(game) });
  } catch (_) {}
  if (botLoopsByGameId.has(game.id)) return; // already running

  const stateMap = botStateByGameId.get(game.id) || new Map();
  // ensure any bots that exist have state
  for (const id of Object.keys(game.players || {})) {
    if (!isBotId(id)) continue;
    if (!stateMap.has(id)) {
      const p = game.players[id];
      stateMap.set(id, { ...gridFromPlayer(p), lastBombAt: 0, lastMoveAt: 0, lastPortalAt: 0 });
    }
  }
  botStateByGameId.set(game.id, stateMap);

  const botIds = new Set(Object.keys(game.players || {}).filter(isBotId));

  const timers = new Map();
  playModuleByGameId.set(game.id, playModule);

  for (const botId of botIds) {
    const moveTimer = createBotInterval({ game, botId, stateMap, playModule });
    timers.set(botId, moveTimer);
  }

  botLoopsByGameId.set(game.id, { timers, bots: botIds });
}

function ensureBotRuntimeForId({ game, botId }) {
  if (!game || !game.id || !botId) return;

  const stateMap = botStateByGameId.get(game.id) || new Map();
  if (!stateMap.has(botId)) {
    const p = game.players && game.players[botId];
    stateMap.set(botId, { ...gridFromPlayer(p), lastBombAt: 0, lastMoveAt: 0, lastPortalAt: 0 });
    botStateByGameId.set(game.id, stateMap);
  }

  const entry = botLoopsByGameId.get(game.id);
  if (!entry) return; // not running yet

  entry.bots.add(botId);
  if (entry.timers && entry.timers.has(botId)) return;

  const playModule = playModuleByGameId.get(game.id);
  if (!playModule) return;

  const tid = createBotInterval({ game, botId, stateMap, playModule });
  entry.timers.set(botId, tid);
}

function makeBotIdForGame(game) {
  return makeBotId(game);
}

function stopBotsForGame(gameId) {
  if (!gameId) return;
  const entry = botLoopsByGameId.get(gameId);
  if (!entry) return;

  for (const t of (entry.timers && entry.timers.values ? entry.timers.values() : [])) {
    try { clearInterval(t); } catch (_) {}
  }

  botLoopsByGameId.delete(gameId);
  playModuleByGameId.delete(gameId);
  // Keep botStateByGameId so bots in pending games preserve position; optional.
}

module.exports = {
  BOT_PREFIX,
  isBotId,
  hasOnlyBots,
  getDesiredBots,
  setDesiredBots,
  getDifficulty,
  setDifficulty,
  updateHumanPosition,
  ensureBotsInPendingGame,
  removeBotsFromGame,
  startBotsForRunningGame,
  ensureBotRuntimeForId,
  makeBotIdForGame,
  stopBotsForGame,
  applyBlastToBots,
};
