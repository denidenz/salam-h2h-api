let currentToken = null;

function saveToken(token) {
  currentToken = token;
}

function getToken() {
  return currentToken;
}

module.exports = { saveToken, getToken };
