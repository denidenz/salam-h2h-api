const crypto = require("crypto");

function verifySignature(req) {
  try {
    // ambil header
    const signature =
      req.headers["x-signature"] || req.headers["bpi-signature"];

    const timestamp =
      req.headers["x-timestamp"] || req.headers["bpi-timestamp"];

    const clientKey =
      req.headers["x-client-key"] || req.headers["bpi-partner-id"];

    console.log("===== SIGN DEBUG =====");
    console.log("SIGNATURE:", signature);
    console.log("CLIENT KEY:", clientKey);
    console.log("TIMESTAMP:", timestamp);

    // validasi awal
    if (!signature || !clientKey || !timestamp) {
      console.log("❌ Missing header for signature");
      return false;
    }

    // ✅ FORMAT BSI RSA (PAYMENT)
    const stringToSign = `${clientKey}|${timestamp}`;
    console.log("STRING TO SIGN:", stringToSign);

    // verify RSA
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(stringToSign, "utf8");
    verifier.end();

    const isValid = verifier.verify(
      process.env.BSI_PUBLIC_KEY,
      signature,
      "base64"
    );

    console.log("SIGN VALID:", isValid);

    return isValid;
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return false;
  }
}

module.exports = {
  verifySignature,
};
