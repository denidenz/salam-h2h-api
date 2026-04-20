const crypto = require("crypto");
const { saveToken } = require("../tokenStore");

module.exports = async (req, res) => {
  try {
    const signature = req.headers["x-signature"];
    const clientKey = req.headers["x-client-key"];
    const timestamp = req.headers["x-timestamp"];

    if (!signature || !clientKey || !timestamp) {
      return res.json({
        responseCode: "4007300",
        responseMessage: "Missing Header"
      });
    }

    // ✅ BI-SNAP FORMAT (TANPA |)
    const data = `${clientKey}${timestamp}`;

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(data);
    verifier.end();

    const isValid = verifier.verify(
      process.env.BSI_PUBLIC_KEY,
      signature,
      "base64"
    );

    console.log("AUTH VALID:", isValid);

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
    console.error(err);
    return res.json({
      responseCode: "5007300",
      responseMessage: "Auth Error"
    });
  }
};
