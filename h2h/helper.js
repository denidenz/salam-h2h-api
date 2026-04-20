const crypto = require("crypto");

function verifySignature(req) {
  try {
    // 🔹 Ambil header
    const signature =
      req.headers["x-signature"] || req.headers["bpi-signature"];

    const timestamp =
      req.headers["x-timestamp"] || req.headers["bpi-timestamp"];

    const accessToken =
      req.headers["authorization"]?.replace("Bearer ", "") ||
      req.headers["bpi-authorization"]?.replace("Bearer ", "");

    const method = req.method.toUpperCase(); // POST
    const endpoint = "/payment";

    // 🔥 WAJIB raw body asli
    const body = req.rawBody;

    console.log("===== SIGN DEBUG (HELPER) =====");
    console.log("SIGNATURE:", signature);
    console.log("TIMESTAMP:", timestamp);
    console.log("TOKEN:", accessToken);
    console.log("BODY:", body);

    if (!signature || !timestamp || !accessToken || !body) {
      console.log("❌ Missing required data");
      return false;
    }

    // 🔥 FORMAT RESMI BSI
    const stringToSign =
      `${method}:${endpoint}:${body}:${accessToken}:${timestamp}`;

    console.log("STRING TO SIGN:", stringToSign);
    console.log("BODY LENGTH:", body.length);

    // ✅ PUBLIC KEY LANGSUNG DARI ENV (SUDAH ADA HEADER)
    const publicKey = process.env.BSI_PUBLIC_KEY.replace(/\\n/g, "\n");

    console.log("PUBLIC KEY CHECK:", publicKey.substring(0, 50));

    // 🔐 VERIFY
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(stringToSign);
    verifier.end();

    const isValid = verifier.verify(
      publicKey,
      signature,
      "base64"
    );

    console.log("VERIFY RESULT:", isValid);

    return isValid;

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return false;
  }
}

module.exports = {
  verifySignature
};
