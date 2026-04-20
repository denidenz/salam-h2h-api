const crypto = require("crypto");
const { saveToken } = require("../tokenStore");

module.exports = async (req, res) => {
  try {
    console.log("HEADERS:", req.headers);

    const signature = req.headers["bpi-signature"];
    const clientKey = req.headers["bpi-client-key"];
    const timestamp = req.headers["bpi-timestamp"];

    if (!signature || !clientKey || !timestamp) {
      return res.json({
        responseCode: "4007300",
        responseMessage: "Missing Header"
      });
    }

    const data = `${clientKey}|${timestamp}`;

    const publicKey = process.env.BSI_PUBLIC_KEY
      .replace(/\\n/g, "\n")
      .trim();

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(data);
    verifier.end();

    const isValid = verifier.verify(publicKey, signature, "base64");

    console.log("DATA:", data);
    console.log("VALID:", isValid);

    if (!isValid) {
      return res.json({
        responseCode: "4037300",
        responseMessage: "Invalid Signature"
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    saveToken(token);

    return res.json({
      responseCode: "2007300",
      responseMessage: "Successful",
      accessToken: token,
      tokenType: "Bearer",
      expiresIn: 900
    });

  } catch (err) {
    console.error("AUTH ERROR:", err);

    return res.json({
      responseCode: "5007300",
      responseMessage: "Auth Error"
    });
  }
};
