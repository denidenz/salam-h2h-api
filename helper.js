const crypto = require("crypto");

function verifySignature(req) {
  try {
    // ambil dari header
    const signature =
      req.headers["x-signature"] || req.headers["bpi-signature"];

    const clientKey =
      req.headers["x-client-key"] ||
      req.headers["bpi-partner-id"];

    const timestamp =
      req.headers["x-timestamp"] ||
      req.headers["bpi-timestamp"];

    console.log("SIGNATURE:", signature);
    console.log("CLIENT KEY:", clientKey);
    console.log("TIMESTAMP:", timestamp);

    if (!signature || !clientKey || !timestamp) {
      console.log("❌ Header tidak lengkap");
      return false;
    }

    const stringToSign = `${clientKey}|${timestamp}`;
    console.log("STRING TO SIGN:", stringToSign);

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(stringToSign, "utf8");
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

module.exports = verifySignature;
