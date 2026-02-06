const cookie = require('cookie');
const { verifyAuthToken } = require('../auth');
const Store = require('../store');

function socketAuthMiddleware(socket, next) {
  try {
    const header = socket.request && socket.request.headers && socket.request.headers.cookie;
    if (!header) return next();

    const cookies = cookie.parse(header);
    const token = cookies.auth_token;
    if (!token) return next();

    const decoded = verifyAuthToken(token);
    const userId = decoded && decoded.uid;
    if (!userId) return next();

    const user = Store.getUserById(userId);
    if (!user) return next();

    socket.user = { id: user.id, displayName: user.displayName, avatarParts: user.avatarParts || null };
    return next();
  } catch (_) {
    // ignore invalid tokens
    return next();
  }
}

module.exports = socketAuthMiddleware;
