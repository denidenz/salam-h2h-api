const crypto = require("crypto");

function verifySignature(req) {
  try {
    if (process.env.IS_SANDBOX === "true") {
      console.log("⚠️ SANDBOX MODE - BYPASS SIGNATURE");
      return true;
    }

    const signature =
      (req.headers["x-signature"] || "").trim();

    const timestamp =
      (req.headers["x-timestamp"] || "").trim();

    const accessToken =
      (req.headers["authorization"] || "")
        .replace("Bearer ", "")
        .trim();

    const method = req.method.toUpperCase();

    // 🔥 WAJIB PATH ONLY
    const endpoint =
      (req.headers["endpoint-url"] ||
        req.originalUrl ||
        req.url ||
        "")
        .split("?")[0]
        .trim();

    const body = req.rawBody;

    console.log("===== SIGN DEBUG BSI =====");

    if (!signature || !timestamp || !accessToken || !body) {
      console.log("❌ Missing header");
      return false;
    }

    // 🔥 STEP 1: MINIFY BODY (WAJIB)
    const minifyBody = JSON.stringify(JSON.parse(body));

    // 🔥 STEP 2: SHA256 → HEX → LOWERCASE
    const bodyHash = crypto
      .createHash("sha256")
      .update(minifyBody)
      .digest("hex")
      .toLowerCase();

    console.log("BODY HASH:", bodyHash);

    // 🔥 STEP 3: STRING TO SIGN
    const stringToSign =
      `${method}:${endpoint}:${accessToken}:${bodyHash}:${timestamp}`;

    console.log("STRING TO SIGN:", stringToSign);

    // 🔐 CLIENT SECRET (BUKAN PUBLIC KEY)
    const clientSecret = process.env.BSI_CLIENT_SECRET;

    if (!clientSecret) {
      console.log("❌ CLIENT SECRET NOT FOUND");
      return false;
    }

    // 🔥 STEP 4: HMAC SHA512
    const expectedSignature = crypto
      .createHmac("sha512", clientSecret)
      .update(stringToSign)
      .digest("base64");

    console.log("EXPECTED:", expectedSignature);
    console.log("RECEIVED:", signature);

    return expectedSignature === signature;

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return false;
  }
}

module.exports = { verifySignature };
