const crypto = require("crypto");

function verifySignature(req) {
  try {
    const signature =
      req.headers["x-signature"] || req.headers["bpi-signature"];

    const timestamp =
      req.headers["x-timestamp"] || req.headers["bpi-timestamp"];

    const accessToken =
      req.headers["authorization"]?.replace("Bearer ", "") ||
      req.headers["bpi-authorization"]?.replace("Bearer ", "");

    const method = req.method.toUpperCase(); // POST
    const endpoint = "/payment"; // HARUS FIX
    const body = req.rawBody; // HARUS RAW

    if (!signature || !timestamp || !accessToken || !body) {
      console.log("❌ DATA KURANG:", {
        signature,
        timestamp,
        accessToken,
        body
      });
      return false;
    }

    const stringToSign =
      `${method}:${endpoint}:${body}:${accessToken}:${timestamp}`;

    console.log("===== SIGN DEBUG =====");
    console.log("STRING TO SIGN:", stringToSign);
    console.log("BSI SIGN:", signature);

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(stringToSign);
    verifier.end();

    const isValid = verifier.verify(
      process.env.BSI_PUBLIC_KEY,
      signature,
      "base64"
    );

    return isValid;

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return false;
  }
}
