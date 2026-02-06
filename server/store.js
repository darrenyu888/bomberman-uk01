const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_PATH = path.join(DATA_DIR, 'users.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_PATH)) {
    fs.writeFileSync(USERS_PATH, JSON.stringify({ users: {}, stats: {} }, null, 2));
  }
}

function readAll() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(USERS_PATH, 'utf8');
    const data = JSON.parse(raw || '{}');
    if (!data.users) data.users = {};
    if (!data.stats) data.stats = {};
    return data;
  } catch (e) {
    return { users: {}, stats: {} };
  }
}

function writeAll(data) {
  ensureDataFile();
  const tmp = USERS_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, USERS_PATH);
}

function getOrCreateUserFromGoogle({ sub, email, name, picture }) {
  const data = readAll();

  // use Google sub as stable id
  const id = `google:${sub}`;

  const existing = data.users[id] || {};
  const user = {
    id,
    provider: 'google',
    sub,
    email,
    gmail: email, // keep explicit gmail field for admin/backoffice
    picture: picture || existing.picture || null,
    displayName: existing.displayName || name || 'Player',
    createdAt: existing.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  data.users[id] = user;

  if (!data.stats[id]) {
    data.stats[id] = {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      updatedAt: Date.now(),
    };
  }

  writeAll(data);
  return { user, stats: data.stats[id] };
}

function getUserById(id) {
  const data = readAll();
  return data.users[id] || null;
}

function getStatsByUserId(id) {
  const data = readAll();
  return data.stats[id] || { gamesPlayed: 0, wins: 0, losses: 0 };
}

function updateDisplayName(userId, displayName) {
  const data = readAll();
  const u = data.users[userId];
  if (!u) return null;
  u.displayName = displayName;
  u.updatedAt = Date.now();
  data.users[userId] = u;
  writeAll(data);
  return u;
}

function recordGameStart(userIds) {
  const data = readAll();
  for (const id of userIds) {
    if (!data.stats[id]) data.stats[id] = { gamesPlayed: 0, wins: 0, losses: 0, updatedAt: Date.now() };
    data.stats[id].gamesPlayed += 1;
    data.stats[id].updatedAt = Date.now();
  }
  writeAll(data);
}

function recordGameResult({ winnerUserId, loserUserIds }) {
  const data = readAll();
  if (winnerUserId) {
    if (!data.stats[winnerUserId]) data.stats[winnerUserId] = { gamesPlayed: 0, wins: 0, losses: 0, updatedAt: Date.now() };
    data.stats[winnerUserId].wins += 1;
    data.stats[winnerUserId].updatedAt = Date.now();
  }
  for (const id of loserUserIds || []) {
    if (!id) continue;
    if (!data.stats[id]) data.stats[id] = { gamesPlayed: 0, wins: 0, losses: 0, updatedAt: Date.now() };
    data.stats[id].losses += 1;
    data.stats[id].updatedAt = Date.now();
  }
  writeAll(data);
}

module.exports = {
  getOrCreateUserFromGoogle,
  getUserById,
  getStatsByUserId,
  updateDisplayName,
  recordGameStart,
  recordGameResult,
};
