const { createRemoteJWKSet, jwtVerify } = require('jose');

const ISSUER = process.env.CLERK_ISSUER;
const AUDIENCE = process.env.CLERK_AUDIENCE || undefined;

let jwks = null;
function getJwks() {
  if (!ISSUER) throw new Error('CLERK_ISSUER not configured');
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${ISSUER.replace(/\/$/, '')}/.well-known/jwks.json`));
  }
  return jwks;
}

async function verifyClerkToken(token) {
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  return payload;
}

module.exports = { verifyClerkToken };
