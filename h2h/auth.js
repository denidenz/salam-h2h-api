const crypto = require("crypto");
const { saveToken } = require("../tokenStore");

module.exports = async (req, res) => {
  try {
    const { grantType } = req.body;

    if (grantType !== "client_credentials") {
      return res.json({
        responseCode: "4007300",
        responseMessage: "Invalid Grant Type"
      });
    }

    // 🔥 generate token dinamis
    const token = crypto.randomBytes(32).toString("hex");

    saveToken(token);

    console.log("TOKEN GENERATED:", token);

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
