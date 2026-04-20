const crypto = require("crypto");

function verifySignature({ clientKey, timestamp, signature, publicKey, rawBody }) {
  const stringToSign = `${clientKey}|${timestamp}|${rawBody}`;

  console.log("STRING TO SIGN:", stringToSign);

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(stringToSign);
  verifier.end();

  return verifier.verify(publicKey, signature, "base64");
}
