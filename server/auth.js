const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

function getGoogleClientId() {
  return process.env.GOOGLE_CLIENT_ID || '';
}

function getJwtSecret() {
  return process.env.JWT_SECRET || 'dev-secret-change-me';
}

function makeOAuthClient() {
  const cid = getGoogleClientId();
  return new OAuth2Client(cid);
}

async function verifyGoogleIdToken(idToken) {
  const client = makeOAuthClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: getGoogleClientId(),
  });
  const payload = ticket.getPayload();
  if (!payload) throw new Error('NO_PAYLOAD');

  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: payload.email_verified,
    name: payload.name,
    picture: payload.picture,
  };
}

function signAuthToken({ userId }) {
  const secret = getJwtSecret();
  // 30 days
  return jwt.sign({ uid: userId }, secret, { expiresIn: '30d' });
}

function verifyAuthToken(token) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
}

module.exports = {
  getGoogleClientId,
  verifyGoogleIdToken,
  signAuthToken,
  verifyAuthToken,
};
