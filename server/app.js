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

