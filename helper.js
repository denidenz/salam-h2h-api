const crypto = require("crypto");

function verifySignature({ req, signature, publicKey }) {
  try {
    const accessToken = req.headers["authorization"]?.replace("Bearer ", "");

    const bodyHash = crypto
      .createHash("sha256")
      .update(req.rawBody)
      .digest("hex");

    const stringToSign = `${req.method}:${req.originalUrl}:${accessToken}:${bodyHash}`;

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
