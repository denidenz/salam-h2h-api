const crypto = require("crypto");

function verifySignature(req) {
  try {
    if (process.env.IS_SANDBOX === "true") {
      console.log("⚠️ SANDBOX MODE - BYPASS SIGNATURE");
      return true;
    }

    const signature =
      (req.headers["x-signature"] || req.headers["bpi-signature"] || "").trim();

    const timestamp =
      (req.headers["x-timestamp"] || req.headers["bpi-timestamp"] || "").trim();

    const accessToken =
      (req.headers["authorization"]?.replace("Bearer ", "") ||
        req.headers["bpi-authorization"]?.replace("Bearer ", "") ||
        "").trim();

    const method = req.method.toUpperCase();

    const endpoint =
      (req.headers["endpoint-url"] || req.originalUrl || req.url || "")
        .split("?")[0]
        .trim();

    const body = req.rawBody;

    console.log("===== SIGN DEBUG FINAL (BASE64 HASH) =====");

    if (!signature || !timestamp || !accessToken || !body) {
      return false;
    }

    // 🔥 HASH BASE64 (INI FIX UTAMA)
    const bodyHash = crypto
      .createHash("sha256")
      .update(body)
      .digest("base64");

    console.log("BODY HASH (BASE64):", bodyHash);

    const stringToSign =
      `${method}:${endpoint}:${bodyHash}:${accessToken}:${timestamp}`;

    console.log("STRING TO SIGN:", stringToSign);

    const publicKey = process.env.BSI_PUBLIC_KEY?.replace(/\\n/g, "\n");

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(stringToSign);
    verifier.end();

    const isValid = verifier.verify(publicKey, signature, "base64");

    console.log("VERIFY RESULT:", isValid);

    return isValid;

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return false;
  }
}

module.exports = { verifySignature };
