const crypto = require("crypto");

function verifySignature(req) {
  try {
    // 🔥 BYPASS UNTUK SANDBOX
    if (process.env.IS_SANDBOX === "true") {
      console.log("⚠️ SANDBOX MODE - BYPASS SIGNATURE");
      return true;
    }

    // 🔹 Ambil header
    const signature =
      (req.headers["x-signature"] || req.headers["bpi-signature"] || "").trim();

    const timestamp =
      (req.headers["x-timestamp"] || req.headers["bpi-timestamp"] || "").trim();

    const accessToken =
      (req.headers["authorization"]?.replace("Bearer ", "") ||
        req.headers["bpi-authorization"]?.replace("Bearer ", "") ||
        "").trim();

    const method = req.method.toUpperCase();

    // 🔥 RAW BODY WAJIB
    const body = req.rawBody;

    console.log("===== SIGN DEBUG AUTO =====");
    console.log("SIGNATURE:", signature);
    console.log("TIMESTAMP:", timestamp);
    console.log("TOKEN:", accessToken);
    console.log("BODY:", body);

    if (!signature || !timestamp || !accessToken || !body) {
      console.log("❌ Missing required data");
      return false;
    }

    // 🔐 PUBLIC KEY
    const publicKey = process.env.BSI_PUBLIC_KEY?.replace(/\\n/g, "\n");

    if (!publicKey) {
      console.log("❌ PUBLIC KEY NOT FOUND");
      return false;
    }

    console.log("PUBLIC KEY LOADED");

    // 🔥 LIST ENDPOINT YANG DICOBA
    const endpointsToTry = [
      req.headers["endpoint-url"],
      req.originalUrl,
      req.url,
      "/inquiry",
      "/payment",
      "/bpi/inquiry",
      "/bpi/payment"
    ].filter(Boolean);

    // 🔥 LOOP CHECK
    for (const ep of endpointsToTry) {
      const cleanEndpoint = ep.split("?")[0].trim();

      const stringToSign =
        `${method}:${cleanEndpoint}:${body}:${accessToken}:${timestamp}`;

      const verifier = crypto.createVerify("RSA-SHA256");
      verifier.update(stringToSign);
      verifier.end();

      const isValid = verifier.verify(publicKey, signature, "base64");

      console.log("TRY ENDPOINT:", cleanEndpoint, "=>", isValid);

      if (isValid) {
        console.log("✅ SIGNATURE VALID DENGAN ENDPOINT:", cleanEndpoint);
        return true;
      }
    }

    console.log("❌ SIGNATURE TIDAK VALID DI SEMUA ENDPOINT");
    return false;

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return false;
  }
}

module.exports = {
  verifySignature,
};
