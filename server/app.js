const express = require('express');
const { Server } = require('socket.io');
const favicon = require('serve-favicon');

const app = express();
const server = require('http').createServer(app);
const path = require('path');

const Auth = require('./auth');
const Store = require('./store');

const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));

// --- Auth / config APIs ---
app.get('/api/config', (req, res) => {
  res.json({ googleClientId: Auth.getGoogleClientId() });
});

app.post('/auth/google', async (req, res) => {
  try {
    const credential = req.body && req.body.credential;
    if (!credential) return res.status(400).json({ error: 'MISSING_CREDENTIAL' });

    const info = await Auth.verifyGoogleIdToken(credential);
    if (!info.email || !info.email_verified) {
      return res.status(400).json({ error: 'EMAIL_NOT_VERIFIED' });
    }

    const { user, stats } = Store.getOrCreateUserFromGoogle(info);

    const token = Auth.signAuthToken({ userId: user.id });
    res.setHeader('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`);

    res.json({ ok: true, user: { id: user.id, displayName: user.displayName }, stats });
  } catch (e) {
    console.error('auth/google error', e);
    res.status(400).json({ error: 'AUTH_FAILED' });
  }
});

app.post('/auth/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  try {
    const cookieHeader = req.headers.cookie || '';
    const token = (cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/) || [])[1];
    if (!token) return res.json({ user: null });

    const decoded = Auth.verifyAuthToken(token);
    const userId = decoded && decoded.uid;
    const user = userId ? Store.getUserById(userId) : null;
    if (!user) return res.json({ user: null });

    const stats = Store.getStatsByUserId(user.id);
    res.json({ user: { id: user.id, displayName: user.displayName }, stats });
  } catch (_) {
    res.json({ user: null });
  }
});

app.get('/api/leaderboard', (req, res) => {
  try {
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '20', 10) || 20));

    // Read from JSON store
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(__dirname, 'data', 'users.json');
    let data = { users: {}, stats: {} };
    try {
      data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (_) {}

    const rows = Object.values(data.users || {}).map(u => {
      const s = (data.stats && data.stats[u.id]) || { gamesPlayed: 0, wins: 0, losses: 0 };
      const gamesPlayed = s.gamesPlayed || 0;
      const wins = s.wins || 0;
      const losses = s.losses || 0;
      const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) : 0;
      return {
        userId: u.id,
        displayName: u.displayName || 'Player',
        wins,
        losses,
        gamesPlayed,
        winRate,
      };
    });

    // Default sort: wins desc
    rows.sort((a, b) => (b.wins - a.wins) || (b.winRate - a.winRate) || (b.gamesPlayed - a.gamesPlayed));

    res.json({
      sort: 'wins',
      limit,
      rows: rows.slice(0, limit)
    });
  } catch (e) {
    res.status(500).json({ error: 'LEADERBOARD_FAILED' });
  }
});

app.post('/api/profile', (req, res) => {
  try {
    const cookieHeader = req.headers.cookie || '';
    const token = (cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/) || [])[1];
    if (!token) return res.status(401).json({ error: 'UNAUTHENTICATED' });

    const decoded = Auth.verifyAuthToken(token);
    const userId = decoded && decoded.uid;
    if (!userId) return res.status(401).json({ error: 'UNAUTHENTICATED' });

    const displayName = (req.body && req.body.displayName || '').toString().trim();
    if (displayName.length < 1 || displayName.length > 24) {
      return res.status(400).json({ error: 'INVALID_NAME', message: 'displayName 長度需 1..24' });
    }

    const user = Store.updateDisplayName(userId, displayName);
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    res.json({ ok: true, user: { id: user.id, displayName: user.displayName } });
  } catch (e) {
    res.status(400).json({ error: 'BAD_REQUEST' });
  }
});

// --- Leaderboard page (simple HTML) ---
app.get('/leaderboard', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Leaderboard</title>
<style>
  body{font-family:Arial,sans-serif;background:#0b0b0f;color:#fff;margin:0;padding:18px}
  h1{margin:0 0 12px 0;font-size:20px}
  .hint{opacity:.75;margin-bottom:14px;font-size:13px}
  table{width:100%;border-collapse:collapse;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:12px;overflow:hidden}
  th,td{padding:10px 8px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left;font-size:14px}
  th{opacity:.85}
  tr:last-child td{border-bottom:none}
  .rank{width:44px;opacity:.9}
  .num{font-variant-numeric:tabular-nums}
</style>
</head>
<body>
<h1>Leaderboard（按勝場）</h1>
<div class="hint">資料來源：登入玩家戰績（wins/losses/gamesPlayed）</div>
<table id="t"><thead><tr><th class="rank">#</th><th>玩家</th><th class="num">Wins</th><th class="num">Losses</th><th class="num">Games</th></tr></thead><tbody></tbody></table>
<script>
  fetch('/api/leaderboard?limit=50').then(r=>r.json()).then(data=>{
    const tb=document.querySelector('#t tbody');
    (data.rows||[]).forEach((r,i)=>{
      const tr=document.createElement('tr');
      tr.innerHTML = '<td class="rank">' + (i+1) + '</td>'
        + '<td>' + (r.displayName || '') + '</td>'
        + '<td class="num">' + (r.wins||0) + '</td>'
        + '<td class="num">' + (r.losses||0) + '</td>'
        + '<td class="num">' + (r.gamesPlayed||0) + '</td>';
      tb.appendChild(tr);
    })
  }).catch(()=>{});
</script>
</body></html>`);
});

// --- Static ---
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use(favicon(path.join(__dirname, '..', 'client', 'favicon.ico')));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index'));
});

server.listen(PORT, function(){
  console.log(`Express server listening on port ${PORT}`)
});


const Lobby    = require('./lobby');
const Play     = require('./play');

const io = new Server(server);
// auth (JWT cookie)
const socketAuthMiddleware = require('./middleware/socket_auth');
io.use(socketAuthMiddleware);

// Back-compat for older code that expects a global `serverSocket`
global.serverSocket = io;

io.on('connection', function(client) {
  console.log('New player has connected: ' + client.id);

  // Client-side debug logs (used when ?debug=1 and screenshots are blocked)
  client.on('client log', (msg) => {
    try {
      const s = (msg || '').toString().slice(0, 400);
      console.log('clientlog', client.id, s);
    } catch (_) {}
  });

  client.on('enter lobby', Lobby.onEnterLobby);
  client.on('leave lobby', Lobby.onLeaveLobby);
  client.on('create game', Lobby.onCreateGame);

  client.on('enter pending game', Lobby.onEnterPendingGame);
  client.on('leave pending game', Lobby.onLeavePendingGame);
  client.on('set ai count', Lobby.onSetAICount);
  client.on('set ai difficulty', Lobby.onSetAIDifficulty);

  client.on('start game', Play.onStartGame);

  client.on('update player position', Play.updatePlayerPosition);
  client.on('create bomb', Play.createBomb);
  client.on('kick bomb', Play.kickBomb);
  client.on('pick up spoil', Play.onPickUpSpoil);

  client.on('player died', Play.onPlayerDied);
  client.on('leave game', Play.onLeaveGame);

  client.on('disconnect', onClientDisconnect);
});

function onClientDisconnect() {
  if (this.socket_game_id == null) {
    console.log('Player was not be inside any game...');
    return
  }
  console.log('Player was inside game...');

  // If game is pending then use Lobby.
  Lobby.onLeavePendingGame.call(this)

  // If game is non-pending then use Play.
  Play.onDisconnectFromGame.call(this)
}

