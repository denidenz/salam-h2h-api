const crypto = require("crypto");

module.exports = async (req, res) => {
  try {
    const signature = req.headers["x-signature"];
    const clientKey = req.headers["x-client-key"];
    const timestamp = req.headers["x-timestamp"];

    const data = `${clientKey}.${timestamp}`;

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(data);

    const isValid = verifier.verify(
      process.env.BSI_PUBLIC_KEY,
      signature,
      "base64"
    );

    if (!isValid) {
      return res.json({
        responseCode: "4037300",
        responseMessage: "Auth Error"
      });
    }

    const token = "TEST_TOKEN";

    return res.json({
      responseCode: "2007300",
      responseMessage: "Auth Success",
      accessToken: token,
      tokenType: "BearerToken",
      expiresIn: "900"
    });

  } catch (err) {
    return res.json({
      responseCode: "5007300",
      responseMessage: "Auth Error"
    });
  }
};
