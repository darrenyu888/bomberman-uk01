var Lobby    = require('./lobby');
var { Game } = require('./entity/game');
var Bots     = require('./bots');

const { TILE_SIZE, EMPTY_CELL } = require('./constants');

var runningGames = new Map();

// Do NOT store Node.js Timeout objects on the game object (Socket.IO cannot serialize them and may crash).
const matchTimersByGameId = new Map(); // gameId -> timeoutId

function clearMatchTimer(gameOrId) {
  try {
    const gameId = (typeof gameOrId === 'string') ? gameOrId : (gameOrId && gameOrId.id);
    if (!gameId) return;
    const t = matchTimersByGameId.get(gameId);
    if (t) {
      clearTimeout(t);
      matchTimersByGameId.delete(gameId);
    }
  } catch (_) {}
}

function emitWinAndCleanup({ game, reason }) {
  if (!game) return;
  const game_id = game.id;

  // pick a winner among alive players if any
  let winnerSkin = null;
  let winnerId = null;
  for (const [pid, p] of Object.entries(game.players || {})) {
    if (!p || !p.isAlive) continue;
    winnerSkin = p.skin;
    winnerId = pid;
    break;
  }

  try {
    serverSocket.sockets.to(game_id).emit('player win', {
      skin: winnerSkin,
      player_id: winnerId,
      reason: reason || 'unknown'
    });
  } catch (_) {}

  // stop bots + cleanup running game state after a short grace period
  try { Bots.stopBotsForGame(game_id); } catch (_) {}
  clearMatchTimer(game_id);

  setTimeout(() => {
    try { runningGames.delete(game_id); } catch (_) {}
  }, 8000);
}

var Play = {
  onLeaveGame: function (data) {
    // Stop bots and drop running game state
    const g = runningGames.get(this.socket_game_id);
    if (g) clearMatchTimer(g.id);

    Bots.stopBotsForGame(this.socket_game_id);
    runningGames.delete(this.socket_game_id);

    this.leave(this.socket_game_id);
    this.socket_game_id = null;
  },

  onStartGame: function() {
    if (!this.socket_game_id) {
      console.warn('start game ignored: missing socket_game_id', this.id);
      return;
    }

    // If already running, just re-emit launch to help late/buggy clients.
    const already = runningGames.get(this.socket_game_id);
    if (already) {
      try {
        serverSocket.sockets.in(already.id).emit('launch game', already);
      } catch (_) {}
      console.log('start game: already running, re-launch emitted', { gameId: already.id, by: this.id });
      return;
    }

    let game = Lobby.deletePendingGame(this.socket_game_id);
    if (!game) {
      console.warn('start game ignored: pending game missing', this.socket_game_id);
      return;
    }

    console.log('start game', { gameId: game.id, by: this.id, players: Object.keys(game.players || {}).length });

    runningGames.set(game.id, game)

    // Hard time limit when only humans remain: 3 minutes max per match.
    // (Still applies even if bots exist; it prevents endless games.)
    try {
      clearMatchTimer(game.id);
      const tid = setTimeout(() => {
        try {
          const g = runningGames.get(game.id);
          if (!g) return;
          // If already ended naturally, no-op.
          const alive = Object.values(g.players || {}).filter(p => p && p.isAlive).length;
          if (alive <= 1) return;

          emitWinAndCleanup({ game: g, reason: 'timeout_3m' });
        } catch (_) {}
      }, 180000);
      matchTimersByGameId.set(game.id, tid);
    } catch (_) {}

    // Ensure authenticated profile fields (displayName/avatarParts) are present at launch
    // (Players may have joined pending room before login or before saving cosmetics.)
    try {
      const Store = require('./store');
      for (const p of Object.values(game.players || {})) {
        if (!p || !p.userId) continue;
        const u = Store.getUserById(p.userId);
        if (u) {
          p.displayName = u.displayName || p.displayName;
          p.avatarParts = u.avatarParts || p.avatarParts || null;
        }
      }

      // Record gamesPlayed for authenticated humans
      const userIds = [];
      for (const p of Object.values(game.players || {})) {
        if (p && p.userId) userIds.push(p.userId);
      }
      if (userIds.length) Store.recordGameStart(userIds);
    } catch (_) {}

    // Start server-side bots (Normal difficulty)
    Bots.startBotsForRunningGame({ game, playModule: Play });

    serverSocket.sockets.in(game.id).emit('launch game', game);
  },

  updatePlayerPosition: function (coordinates) {
    if (!this.socket_game_id) return;

    const current_game = runningGames.get(this.socket_game_id);
    if (current_game && current_game.players && current_game.players[this.id]) {
      const p = current_game.players[this.id];
      const x = coordinates.x;
      const y = coordinates.y;
      p.position = {
        x,
        y,
        col: Math.floor(x / TILE_SIZE),
        row: Math.floor(y / TILE_SIZE),
        ts: Date.now(),
      };
    }

    // Keep server-side copy of human positions for smarter bots
    try {
      if (!Bots.isBotId || !Bots.isBotId(this.id)) {
        Bots.updateHumanPosition(this.socket_game_id, this.id, coordinates);
      }
    } catch (_) {}

    // NOTE: We broadcast only for opponents.
    this.broadcast.to(this.socket_game_id).emit('move player', Object.assign({}, { player_id: this.id }, coordinates));
  },

  onDisconnectFromGame: function() {
    let current_game = runningGames.get(this.socket_game_id);

    if (current_game) {
      serverSocket.sockets.in(this.socket_game_id).emit('player disconnect', {player_id: this.id } );
    }
  },

  createBomb: function({ col, row }) {
    let game_id = this.socket_game_id;
    if (!game_id) return;

    let current_game = runningGames.get(game_id);
    if (!current_game) return;

    let current_player = current_game.players[this.id];
    if (!current_player) return;

    const detonateAndBroadcast = (bomb) => {
      if (!bomb) return;
      try {
        if (bomb._timer) {
          clearTimeout(bomb._timer);
          bomb._timer = null;
        }
      } catch (_) {}

      let blastedCells = bomb.detonate();

      // remove bomb from server state (important for bots / kick / remote)
      try { current_game.deleteBomb(bomb.id); } catch (_) {}

      // Cache last blast danger cells briefly to validate client-reported deaths
      try {
        current_game._lastBlastAt = Date.now();
        current_game._lastBlastDanger = new Set((blastedCells || []).map(c => `${c.col},${c.row}`));
      } catch (_) {}

      // Apply blast to server-side bots (they don't have a client to report death)
      Bots.applyBlastToBots({ game: current_game, blastedCells });

      // Also apply blast to humans server-side to avoid client-side mismatch / false positives
      try {
        const danger = current_game._lastBlastDanger || new Set();
        let someoneDied = false;

        for (const [pid, p] of Object.entries(current_game.players || {})) {
          if (!p || !p.isAlive) continue;
          // bots handled above
          if (typeof pid === 'string' && pid.startsWith('bot:')) continue;

          const pos = p.position;
          const key = pos ? `${pos.col},${pos.row}` : null;
          if (!key) continue;
          if (!danger.has(key)) continue;

          if (p.shield_until && Date.now() < p.shield_until) continue;

          p.dead();
          someoneDied = true;
          serverSocket.sockets.to(game_id).emit('show bones', {
            player_id: pid,
            col: pos.col,
            row: pos.row,
          });
        }

        // If humans died from this blast, check win condition (same logic as onPlayerDied)
        if (someoneDied) {
          let alivePlayersCount = 0;
          let alivePlayerSkin = null;
          let alivePlayerId = null;
          let aliveWinnerUserId = null;

          for (const [pid, player] of Object.entries(current_game.players || {})) {
            if (!player || !player.isAlive) continue;
            alivePlayerId = pid;
            alivePlayerSkin = player.skin;
            aliveWinnerUserId = player.userId || null;
            alivePlayersCount += 1;
          }

          if (alivePlayersCount <= 1) {
            // Record win/loss stats for authenticated humans.
            try {
              const Store = require('./store');
              const loserUserIds = [];
              for (const pp of Object.values(current_game.players || {})) {
                if (!pp || !pp.userId) continue;
                if (pp.userId === aliveWinnerUserId) continue;
                loserUserIds.push(pp.userId);
              }
              if (aliveWinnerUserId || loserUserIds.length) {
                Store.recordGameResult({ winnerUserId: aliveWinnerUserId, loserUserIds });
              }
            } catch (_) {}

            try { clearMatchTimer(current_game); } catch (_) {}

            setTimeout(function() {
              serverSocket.sockets.to(game_id).emit('player win', {
                skin: alivePlayerSkin,
                player_id: alivePlayerId,
                reason: 'last_alive'
              });
            }, 800);
          }
        }
      } catch (_) {}

      serverSocket.sockets.to(game_id).emit('detonate bomb', { bomb_id: bomb.id, blastedCells: blastedCells });
    };

    // Remote powerup: pressing bomb again detonates nearest active owned bomb
    if (current_player.hasRemote) {
      let nearest = null;
      let bestD = Infinity;
      const pos = current_player.position || { col, row };

      for (const b of current_game.bombs.values()) {
        if (!b) continue;
        if (b.owner_id !== this.id) continue;
        const d = Math.abs((pos.col ?? col) - b.col) + Math.abs((pos.row ?? row) - b.row);
        if (d < bestD) {
          bestD = d;
          nearest = b;
        }
      }

      if (nearest) {
        detonateAndBroadcast(nearest);
        return;
      }
      // else: no active bombs -> fallthrough to place one
    }

    let bomb = current_game.addBomb({ col: col, row: row, power: current_player.power, owner_id: this.id })
    if (bomb) {
      bomb.created_at = Date.now();
    }

    if ( bomb ){
      bomb._timer = setTimeout(function() {
        detonateAndBroadcast(bomb);
      }, bomb.explosion_time);

      serverSocket.sockets.to(game_id).emit('show bomb', { bomb_id: bomb.id, col: bomb.col, row: bomb.row });
    }
  },

  kickBomb: function({ bomb_id, dir }) {
    let game_id = this.socket_game_id;
    if (!game_id) return;

    let current_game = runningGames.get(game_id);
    if (!current_game) return;

    let current_player = current_game.players[this.id];
    if (!current_player || !current_player.hasKick) return;

    const bomb = current_game.findBomb(bomb_id);
    if (!bomb) return;

    const pos = current_player.position || { col: current_player.spawnOnGrid.col, row: current_player.spawnOnGrid.row };
    const pc = pos.col;
    const pr = pos.row;

    const dirs = {
      left:  { dc: -1, dr: 0 },
      right: { dc: 1,  dr: 0 },
      up:    { dc: 0,  dr: -1 },
      down:  { dc: 0,  dr: 1 },
    };

    const d = dirs[dir];
    if (!d) return;

    // must be contacting from that direction (player adjacent behind the bomb)
    if (bomb.col !== pc + d.dc || bomb.row !== pr + d.dr) {
      return;
    }

    const targetCol = bomb.col + d.dc;
    const targetRow = bomb.row + d.dr;

    // bounds check
    if (!current_game.shadow_map || targetRow < 0 || targetCol < 0 ||
        targetRow >= current_game.shadow_map.length ||
        targetCol >= current_game.shadow_map[0].length) {
      return;
    }

    // can only kick into empty tile and not onto another bomb
    if (current_game.getMapCell(targetRow, targetCol) !== EMPTY_CELL) return;
    if (current_game.findBombAt(targetRow, targetCol)) return;

    bomb.col = targetCol;
    bomb.row = targetRow;

    serverSocket.sockets.to(game_id).emit('move bomb', { bomb_id: bomb.id, col: bomb.col, row: bomb.row });
  },

  onPickUpSpoil: function({ spoil_id }) {
    let game_id = this.socket_game_id;
    if (!game_id) return;

    let current_game = runningGames.get(game_id);
    if (!current_game) return;

    let current_player = current_game.players[this.id];
    if (!current_player) return;

    let spoil = current_game.findSpoil(spoil_id)

    if (spoil) {
      current_game.deleteSpoil(spoil.id)

      current_player.pickSpoil(spoil.spoil_type)

      serverSocket.sockets.to(game_id).emit('spoil was picked', { player_id: current_player.id, spoil_id: spoil.id, spoil_type: spoil.spoil_type });
    }
  },

  onPlayerDied: function(coordinates) {
    let game_id = this.socket_game_id;
    if (!game_id) return;

    let current_game = runningGames.get(game_id);
    if (!current_game) return;

    let current_player = current_game.players[this.id]
    if (!current_player) return;

    // Shield powerup: brief invulnerability
    if (current_player.shield_until && Date.now() < current_player.shield_until) {
      return;
    }

    // Validate that the death is actually caused by a recent blast at server-known position.
    // Prevents accidental self-kills due to client-side overlap bugs.
    try {
      const now = Date.now();
      const age = now - (current_game._lastBlastAt || 0);
      const danger = current_game._lastBlastDanger;
      const pos = current_player.position;
      const key = pos ? `${pos.col},${pos.row}` : null;

      // allow within 1200ms after detonation
      if (!danger || !key || age > 1200 || !danger.has(key)) {
        return;
      }
    } catch (_) {}

    serverSocket.sockets.to(game_id).emit('show bones', Object.assign({}, { player_id: this.id }, coordinates));

    current_player.dead()

    let alivePlayersCount = 0
    let alivePlayerSkin = null
    let alivePlayerId = null
    let aliveWinnerUserId = null

    for (let [pid, player] of Object.entries(current_game.players)) {
      if (!player || !player.isAlive) continue;

      alivePlayerId = pid;
      alivePlayerSkin = player.skin;
      aliveWinnerUserId = player.userId || null;
      alivePlayersCount += 1;
    }

    if (alivePlayersCount >= 2) {
      return
    }

    // Record simple win/loss stats for authenticated humans.
    try {
      const Store = require('./store');
      const loserUserIds = [];
      for (const p of Object.values(current_game.players || {})) {
        if (!p || !p.userId) continue;
        if (p.userId === aliveWinnerUserId) continue;
        loserUserIds.push(p.userId);
      }
      if (aliveWinnerUserId || loserUserIds.length) {
        Store.recordGameResult({ winnerUserId: aliveWinnerUserId, loserUserIds });
      }
    } catch (_) {}

    // stop match timer once game is effectively decided
    try { clearMatchTimer(current_game); } catch (_) {}

    setTimeout(function() {
      // keep backward compatibility: send skin; also send winner id + reason
      serverSocket.sockets.to(game_id).emit('player win', {
        skin: alivePlayerSkin,
        player_id: alivePlayerId,
        reason: 'last_alive'
      });
    }, 3000);
  }
}

module.exports = Play;
