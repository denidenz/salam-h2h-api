const crypto = require("crypto");

function verifySignature(req) {
  try {
    // 🔥 BYPASS UNTUK SANDBOX / SIT
    if (process.env.IS_SANDBOX === "true") {
      console.log("⚠️ SANDBOX MODE - BYPASS SIGNATURE");
      return true;
    }

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

    // 🔥 WAJIB raw body asli (string, bukan object)
    const body = req.rawBody;

    console.log("===== SIGN DEBUG =====");
    console.log("SIGNATURE:", signature);
    console.log("TIMESTAMP:", timestamp);
    console.log("TOKEN:", accessToken);
    console.log("BODY:", body);
    console.log("IS_SANDBOX:", process.env.IS_SANDBOX);

    if (!signature || !timestamp || !accessToken || !body) {
      console.log("❌ Missing required data");
      return false;
    }

    // 🔥 FORMAT RESMI BSI
    const stringToSign =
      `${method}:${endpoint}:${body}:${accessToken}:${timestamp}`;

    console.log("STRING TO SIGN:", stringToSign);
    console.log("BODY LENGTH:", body.length);

    // 🔐 Ambil public key dari ENV
    const publicKey = process.env.BSI_PUBLIC_KEY?.replace(/\\n/g, "\n");

    if (!publicKey) {
      console.log("❌ PUBLIC KEY NOT FOUND");
      return false;
    }

    console.log("PUBLIC KEY LOADED");

    // 🔐 VERIFY RSA SHA256
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
