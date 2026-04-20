const crypto = require("crypto");

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

    // 🔥 STRING YANG DI-SIGN (SAMA PERSIS DENGAN PHP)
    const data = `${clientKey}.${timestamp}`;

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(data);

    const isValid = verifier.verify(
      process.env.BSI_PUBLIC_KEY, // PUBLIC KEY DARI BSI
      signature,
      "base64"
    );

    if (!isValid) {
      return res.json({
        responseCode: "4037300",
        responseMessage: "Invalid Signature"
      });
    }

    // 🔥 GENERATE TOKEN DINAMIS
    const token = crypto.randomBytes(32).toString("hex");

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
