function verifySignature(req) {
  try {
    const signature =
      req.headers["x-signature"] || req.headers["bpi-signature"];

    const clientKey =
      req.headers["x-client-key"] ||
      req.headers["bpi-partner-id"];

    const timestamp =
      req.headers["x-timestamp"] ||
      req.headers["bpi-timestamp"];

    if (!signature || !clientKey || !timestamp) {
      console.log("❌ Missing header");
      return false;
    }

    console.log("CLIENT KEY:", clientKey);
    console.log("TIMESTAMP:", timestamp);
    console.log("SIGNATURE:", signature);

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
