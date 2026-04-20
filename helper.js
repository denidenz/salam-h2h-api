const crypto = require("crypto");

function verifySignature({ clientKey, timestamp, signature, publicKey }) {
  try {
    // 🔥 FORMAT BSI PAYMENT (TANPA BODY)
    const stringToSign = `${clientKey}|${timestamp}`;

    console.log("STRING TO SIGN:", stringToSign);

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(stringToSign);
    verifier.end();

    return verifier.verify(publicKey, signature, "base64");

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return false;
  }
}

module.exports = { verifySignature };
