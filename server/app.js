const express = require('express');
const { Server } = require('socket.io');
const favicon = require('serve-favicon');

const app = express();
const server = require('http').createServer(app);
const path = require('path');

const Auth = require('./auth');
const Store = require('./store');

const PORT = process.env.PORT || 3000;

// Behind nginx reverse proxy
app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));

function setAuthCookie(res, req, token, maxAgeSeconds) {
  // Only set Secure when the request is actually over HTTPS.
  // (nginx terminates TLS and forwards X-Forwarded-Proto)
  const xfProto = (req.headers['x-forwarded-proto'] || '').toString().split(',')[0].trim().toLowerCase();
  const isHttps = xfProto === 'https' || req.secure === true;

  let cookie = `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
  if (isHttps) cookie += '; Secure';
  res.setHeader('Set-Cookie', cookie);
}

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
    setAuthCookie(res, req, token, (60 * 60 * 24 * 30));

    res.json({ ok: true, user: { id: user.id, displayName: user.displayName }, stats });
  } catch (e) {
    console.error('auth/google error', e);
    res.status(400).json({ error: 'AUTH_FAILED' });
  }
});

app.post('/auth/logout', (req, res) => {
  // Expire cookie; keep attributes consistent (and Secure when HTTPS)
  setAuthCookie(res, req, '', 0);
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
    res.json({ user: { id: user.id, displayName: user.displayName, avatarParts: user.avatarParts || null }, stats });
  } catch (_) {
    res.json({ user: null });
  }
});

app.get('/api/leaderboard', (req, res) => {
  try {
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '20', 10) || 20));
    const sort = (req.query.sort || 'wins').toString();
    const minGames = Math.max(0, Math.min(9999, parseInt(req.query.minGames || '0', 10) || 0));

    // Read from JSON store
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(__dirname, 'data', 'users.json');
    let data = { users: {}, stats: {} };
    try {
      data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (_) {}

    let rows = Object.values(data.users || {}).map(u => {
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

    // Optional filter for winRate sorting fairness
    if (minGames > 0) {
      rows = rows.filter(r => (r.gamesPlayed || 0) >= minGames);
    }

    const byWins = (a, b) => (b.wins - a.wins) || (b.winRate - a.winRate) || (b.gamesPlayed - a.gamesPlayed);
    const byGames = (a, b) => (b.gamesPlayed - a.gamesPlayed) || (b.wins - a.wins);
    const byWinRate = (a, b) => (b.winRate - a.winRate) || (b.wins - a.wins) || (b.gamesPlayed - a.gamesPlayed);

    if (sort === 'games') rows.sort(byGames);
    else if (sort === 'winrate') rows.sort(byWinRate);
    else rows.sort(byWins);

    res.json({
      sort: (sort === 'games' || sort === 'winrate' || sort === 'wins') ? sort : 'wins',
      minGames,
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

    // Optional avatar parts
    let avatarParts = req.body && req.body.avatarParts;

    if (avatarParts != null) {
      // validate basic shape: { hair: string|null, outfit: string|null, hat: string|null }
      const norm = {};
      const pick = (k, allowedPrefix) => {
        const v = (avatarParts && avatarParts[k]) || '';
        if (!v) return null;
        const s = v.toString();
        if (!s.startsWith(allowedPrefix)) return null;
        return s;
      };
      norm.hair = pick('hair', 'hair_');
      norm.outfit = pick('outfit', 'outfit_');
      norm.hat = pick('hat', 'hat_');
      norm.face = pick('face', 'face_');
      norm.pattern = pick('pattern', 'pattern_');
      norm.character = pick('character', 'char_');
      avatarParts = norm;
    }

    let user = Store.updateDisplayName(userId, displayName);
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    if (avatarParts != null) {
      user = Store.updateAvatarParts(userId, avatarParts) || user;
    }

    res.json({ ok: true, user: { id: user.id, displayName: user.displayName, avatarParts: user.avatarParts || null } });
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
  .hint{opacity:.75;margin-bottom:14px;font-size:13px;white-space:pre-line}
  .controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:10px 0 14px 0}
  .pill{padding:8px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-size:14px}
  .pill.active{background:rgba(0,229,255,.22);border-color:rgba(0,229,255,.55)}
  .spacer{flex:1}
  .min{opacity:.85;font-size:13px}
  #minGames{width:90px;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.25);color:#fff}
  .me{opacity:.9;font-size:12px}
  .me-row{background:rgba(122,28,255,.18)}
  table{width:100%;border-collapse:collapse;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:12px;overflow:hidden}
  th,td{padding:10px 8px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left;font-size:14px}
  th{opacity:.85}
  tr:last-child td{border-bottom:none}
  .rank{width:44px;opacity:.9}
  .num{font-variant-numeric:tabular-nums}
</style>
</head>
<body>
<h1>Leaderboard</h1>
<div class="hint">預設按勝場（Wins）排序；WinRate 可設定最低場次門檻。</div>

<div class="controls">
  <button class="pill active" data-sort="wins">Wins</button>
  <button class="pill" data-sort="winrate">WinRate</button>
  <button class="pill" data-sort="games">Games</button>

  <span class="spacer"></span>
  <label class="min">Min games</label>
  <input id="minGames" type="number" min="0" max="999" value="10" />
</div>

<div id="me-rank" class="hint"></div>

<table id="t"><thead><tr><th class="rank">#</th><th>玩家</th><th class="num">Wins</th><th class="num">Losses</th><th class="num">Games</th><th class="num">WinRate</th></tr></thead><tbody></tbody></table>
<script>
  let currentSort = 'wins';
  let currentMe = null;

  function esc(s){
    const str = String(s || '');
    return str.replace(/[&<>"']/g, (c) => {
      if (c === '&') return '&amp;';
      if (c === '<') return '&lt;';
      if (c === '>') return '&gt;';
      if (c === '"') return '&quot;';
      return '&#39;';
    });
  }

  function setActive(){
    document.querySelectorAll('.pill').forEach(p=>{
      p.classList.toggle('active', p.getAttribute('data-sort') === currentSort);
    });
  }

  async function fetchMe(){
    try {
      const r = await fetch('/api/me');
      const d = await r.json();
      currentMe = d && d.user ? d.user : null;
    } catch (_) { currentMe = null; }
  }

  async function load(){
    const minGames = parseInt(document.getElementById('minGames').value || '0', 10) || 0;
    const url = '/api/leaderboard?limit=50&sort=' + encodeURIComponent(currentSort) + '&minGames=' + encodeURIComponent(minGames);

    const r = await fetch(url);
    const data = await r.json();

    const tb=document.querySelector('#t tbody');
    tb.innerHTML='';

    let myRank = null;

    (data.rows||[]).forEach((row,i)=>{
      const tr=document.createElement('tr');
      const isMe = currentMe && row.userId === currentMe.id;
      if (isMe) myRank = i+1;

      const wr = row.gamesPlayed ? (row.wins/row.gamesPlayed) : 0;
      const wrPct = Math.round(wr*1000)/10;

      tr.innerHTML = '<td class="rank">' + (i+1) + '</td>'
        + '<td>' + esc(row.displayName) + (isMe ? ' <span class="me">(你)</span>' : '') + '</td>'
        + '<td class="num">' + (row.wins||0) + '</td>'
        + '<td class="num">' + (row.losses||0) + '</td>'
        + '<td class="num">' + (row.gamesPlayed||0) + '</td>'
        + '<td class="num">' + wrPct + '%</td>';

      if (isMe) tr.classList.add('me-row');
      tb.appendChild(tr);
    });

    const meEl = document.getElementById('me-rank');
    if (currentMe) {
      meEl.textContent = myRank ? ('你的名次：#' + myRank) : '你的名次：未上榜（可能因 min games 過濾）';
    } else {
      meEl.textContent = '（未登入：無法標示你的名次）';
    }
  }

  document.querySelectorAll('.pill').forEach(p=>{
    p.addEventListener('click', async ()=>{
      currentSort = p.getAttribute('data-sort') || 'wins';
      setActive();
      await load();
    });
  });

  document.getElementById('minGames').addEventListener('change', load);

  (async ()=>{
    await fetchMe();
    setActive();
    await load();
  })();
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

