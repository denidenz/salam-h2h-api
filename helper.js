const crypto = require("crypto");

function verifySignature({ clientKey, timestamp, signature, publicKey, body }) {
  try {
    // 🔥 stringify HARUS sama persis dengan BSI
    const bodyString = JSON.stringify(body);

    const data = `${clientKey}${timestamp}${bodyString}`;

    console.log("SIGN STRING:", data);

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
