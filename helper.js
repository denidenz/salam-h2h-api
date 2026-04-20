const crypto = require("crypto");

function verifySignature({ clientKey, timestamp, signature, publicKey }) {
  try {
    const data = `${clientKey}${timestamp}`;

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(data);
    verifier.end();

    const isValid = verifier.verify(publicKey, signature, "base64");

    return isValid;
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return false;
  }
}

module.exports = { verifySignature };
