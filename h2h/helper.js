const crypto = require("crypto");

// helper bersihin string
function clean(value) {
  return (value || "").toString().trim();
}

function verifySignature(req) {
  try {
    // 🔥 BYPASS SANDBOX
    if (process.env.IS_SANDBOX === "true") {
      console.log("⚠️ SANDBOX MODE - BYPASS SIGNATURE");
      return true;
    }

    // 🔹 HEADER
    const signature = clean(req.headers["x-signature"]);
    const timestamp = clean(req.headers["x-timestamp"]);
    const accessToken = clean(
      (req.headers["authorization"] || "").replace("Bearer ", "")
    );

    // 🔥 WAJIB PATH dari BSI
    const endpoint = clean(req.headers["endpoint-url"]).split("?")[0];

    const method = req.method.toUpperCase();

    // 🔥 RAW BODY (STRING)
    const rawBody = req.rawBody;

    console.log("===== SIGN DEBUG FINAL =====");
    console.log("SIGNATURE:", signature);
    console.log("TIMESTAMP:", timestamp);
    console.log("TOKEN:", accessToken);
    console.log("ENDPOINT:", endpoint);
    console.log("RAW BODY:", rawBody);

    if (!signature || !timestamp || !accessToken || !endpoint || !rawBody) {
      console.log("❌ Missing required data");
      return false;
    }

    // 🔥 STEP 1: MINIFY BODY
    const minifyBody = JSON.stringify(JSON.parse(rawBody));

    // 🔥 STEP 2: SHA256 → HEX → LOWERCASE
    const bodyHash = crypto
      .createHash("sha256")
      .update(minifyBody)
      .digest("hex")
      .toLowerCase();

    console.log("BODY HASH:", bodyHash);

    // 🔥 STEP 3: STRING TO SIGN (FIXED FORMAT BSI)
    const stringToSign =
      `${method}:${endpoint}:${accessToken}:${bodyHash}:${timestamp}`;

    console.log("STRING TO SIGN:", stringToSign);

    // 🔐 CLIENT SECRET (FIX ENV NAME)
    const clientSecret = process.env.BSI_CLIENT_SECRET;

    if (!clientSecret) {
      console.log("❌ CLIENT SECRET NOT FOUND");
      return false;
    }

    console.log("CLIENT SECRET: ADA ✅");

    // 🔥 STEP 4: HMAC SHA512 → BASE64
    const expectedSignature = crypto
      .createHmac("sha512", clientSecret)
      .update(stringToSign)
      .digest("base64");

    console.log("EXPECTED:", expectedSignature);
    console.log("RECEIVED:", signature);

    const isValid = expectedSignature === signature;

    console.log("MATCH:", isValid ? "✅ VALID" : "❌ INVALID");

    return isValid;

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return false;
  }
}

module.exports = {
  verifySignature,
};
