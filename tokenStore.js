const tokens = new Map();

function saveToken(token) {
  tokens.set(token, Date.now() + 900000); // 15 menit
}

function isTokenValid(token) {
  if (!tokens.has(token)) return false;

  const expired = tokens.get(token);
  if (Date.now() > expired) {
    tokens.delete(token);
    return false;
  }

  return true;
}

module.exports = { saveToken, isTokenValid };
