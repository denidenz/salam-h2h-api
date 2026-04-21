const crypto = require("crypto");

function verifySignature(req) {
  try {
    // 🔥 BYPASS KHUSUS SANDBOX / SIT
    if (process.env.IS_SANDBOX === "true") {
      console.log("⚠️ SANDBOX MODE - BYPASS SIGNATURE");
      return true;
    }

    // 🔹 Ambil header + trim (ANTI BUG BSI)
    const signature =
      (req.headers["x-signature"] || req.headers["bpi-signature"] || "").trim();

    const timestamp =
      (req.headers["x-timestamp"] || req.headers["bpi-timestamp"] || "").trim();

    const accessToken =
      (req.headers["authorization"]?.replace("Bearer ", "") ||
        req.headers["bpi-authorization"]?.replace("Bearer ", "") ||
        "").trim();

    const method = req.method.toUpperCase();

    // 🔥 ENDPOINT DINAMIS (WAJIB, JANGAN HARDCODE)
    const endpoint =
      (req.headers["endpoint-url"] || req.originalUrl || req.url || "").trim();

    // 🔥 RAW BODY ASLI (JANGAN DIUBAH)
    const body = req.rawBody;

    console.log("===== SIGN DEBUG FINAL =====");
    console.log("SIGNATURE:", signature);
    console.log("TIMESTAMP:", timestamp);
    console.log("TOKEN:", accessToken);
    console.log("ENDPOINT:", endpoint);
    console.log("BODY:", body);
    console.log("BODY LENGTH:", body?.length);
    console.log("BODY HEX:", Buffer.from(body || "").toString("hex"));

    // ❌ Validasi basic
    if (!signature || !timestamp || !accessToken || !body) {
      console.log("❌ Missing required data");
      return false;
    }

    // 🔥 FORMAT RESMI BSI (HARUS PERSIS)
    const stringToSign =
      `${method}:${endpoint}:${body}:${accessToken}:${timestamp}`;

    console.log("STRING TO SIGN:", stringToSign);

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

    const isValid = verifier.verify(publicKey, signature, "base64");

    console.log("VERIFY RESULT:", isValid);

    return isValid;

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return false;
  }
}

module.exports = {
  verifySignature,
};
