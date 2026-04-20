const crypto = require("crypto");

function verifySignature(req) {
  try {
    const signature =
      (req.headers["x-signature"] || req.headers["bpi-signature"])?.trim();

    const timestamp =
      (req.headers["x-timestamp"] || req.headers["bpi-timestamp"])?.trim();

    const accessToken =
      req.headers["authorization"]?.replace("Bearer ", "").trim() ||
      req.headers["bpi-authorization"]?.replace("Bearer ", "").trim();

    const method = req.method.toUpperCase();
    const endpoint = "/payment";

    const body = req.rawBody || "";

    console.log("===== SIGN DEBUG (FINAL) =====");
    console.log("SIGNATURE:", signature);
    console.log("TIMESTAMP:", timestamp);
    console.log("TOKEN:", accessToken);
    console.log("BODY:", body);
    console.log("RAW BODY EXACT:", body);
    console.log("RAW BODY HEX:", Buffer.from(body).toString("hex"));

    if (!signature || !timestamp || !accessToken || !body) {
      console.log("❌ Missing required data");
      return false;
    }

    const stringToSign =
      `${method}:${endpoint}:${body}:${accessToken}:${timestamp}`;

    console.log("STRING TO SIGN:", stringToSign);
    console.log("BODY LENGTH:", body.length);

    const publicKey = process.env.BSI_PUBLIC_KEY.replace(/\\n/g, "\n");

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(stringToSign, "utf8");
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
  verifySignature
};
