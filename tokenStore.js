const tokens = new Map();

function saveToken(token) {
  tokens.set(token, Date.now() + 900000);
}

function isTokenValid(token) {
  if (!tokens.has(token)) return false;

  const exp = tokens.get(token);
  if (Date.now() > exp) {
    tokens.delete(token);
    return false;
  }

  return true;
}

module.exports = { saveToken, isTokenValid };
