const crypto = require("crypto");

function verifySignature({ clientKey, timestamp, signature, publicKey }) {
  try {
    // 🔥 TANPA PIPE (INI KUNCI)
    const data = `${clientKey}${timestamp}`;

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(data);
    verifier.end();

    return verifier.verify(publicKey, signature, "base64");
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return false;
  }
}

module.exports = { verifySignature };
