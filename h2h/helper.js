const crypto = require("crypto");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// 🔐 CONFIG
const CLIENT_ID = "SBI0001";
const CLIENT_SECRET = "ABCDEF12345678";

// ✅ CREATE TOKEN (Firestore)
async function createToken() {
  const token = crypto.randomBytes(20).toString("hex");

  await db.collection("tokens").doc(token).set({
    createdAt: Date.now(),
    expiredAt: Date.now() + 15 * 60 * 1000, // 15 menit
  });

  return token;
}

// ✅ VALIDASI TOKEN
async function isTokenValid(token) {
  const doc = await db.collection("tokens").doc(token).get();

  if (!doc.exists) return false;

  const data = doc.data();

  if (Date.now() > data.expiredAt) {
    await db.collection("tokens").doc(token).delete();
    return false;
  }

  return true;
}

// ✅ HAPUS TOKEN
async function removeToken(token) {
  await db.collection("tokens").doc(token).delete();
}

// 🔐 GENERATE SIGNATURE
function generateSignature(
  httpMethod,
  endpointUrl,
  body,
  accessToken,
  timestamp
) {
  const hashBody = crypto
    .createHash("sha256")
    .update(body)
    .digest("hex")
    .toLowerCase();

  const stringToSign =
    httpMethod +
    ":" +
    endpointUrl +
    ":" +
    accessToken +
    ":" +
    hashBody +
    ":" +
    timestamp;

  const signature = crypto
    .createHmac("sha512", CLIENT_SECRET)
    .update(stringToSign)
    .digest("base64");

  return signature;
}

module.exports = {
  CLIENT_ID,
  CLIENT_SECRET,
  createToken,
  isTokenValid,
  removeToken,
  generateSignature,
};
