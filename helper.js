const crypto = require("crypto");

// 🔥 CLEAN STRING (FIX SPASI)
function clean(val) {
  return String(val || "").trim();
}

// 🔐 HMAC SIGNATURE
function generateSignature(method, endpoint, body, token, timestamp, secret) {
  const bodyString = JSON.stringify(body);

  const hashedBody = crypto
    .createHash("sha256")
    .update(bodyString)
    .digest("hex");

  const stringToSign =
    `${method}:${endpoint}:${token}:${hashedBody}:${timestamp}`;

  return crypto
    .createHmac("sha512", secret)
    .update(stringToSign)
    .digest("base64");
}

module.exports = { generateSignature, clean };
