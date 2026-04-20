const crypto = require("crypto");

/**
 * 🔐 Generate Signature BSI (HMAC SHA256)
 */
function generateSignature({
  method,
  endpoint,
  body,
  accessToken,
  timestamp,
  clientSecret
}) {
  const stringToSign = `${method}:${endpoint}:${body}:${accessToken}:${timestamp}`;

  console.log("STRING TO SIGN:", stringToSign);

  const signature = crypto
    .createHmac("sha256", clientSecret)
    .update(stringToSign)
    .digest("base64");

  console.log("GENERATED SIGN:", signature);

  return signature;
}

/**
 * ✅ Verify Signature dari BSI
 */
function verifySignature(req) {
  try {
    const signature =
      req.headers["x-signature"] || req.headers["bpi-signature"];

    const timestamp =
      req.headers["x-timestamp"] || req.headers["bpi-timestamp"];

    const endpoint = req.headers["endpoint-url"];

    const authorization = req.headers["authorization"];
    const accessToken = authorization?.replace("Bearer ", "");

    const bodyString = JSON.stringify(req.body);

    const stringToSign = `${req.method}:${endpoint}:${bodyString}:${accessToken}:${timestamp}`;

    console.log("STRING TO SIGN:", stringToSign);

    const localSignature = crypto
      .createHmac("sha256", process.env.CLIENT_SECRET)
      .update(stringToSign)
      .digest("base64");

    console.log("LOCAL SIGN:", localSignature);
    console.log("BSI SIGN :", signature);

    return localSignature === signature;

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return false;
  }
}

module.exports = {
  generateSignature,
  verifySignature
};
