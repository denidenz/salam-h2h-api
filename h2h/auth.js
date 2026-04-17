const crypto = require("crypto");

module.exports = async (req, res) => {
  try {
    const { grantType } = req.body;

    if (grantType !== "client_credentials") {
      throw { code: 4000000, message: "Invalid Grant Type" };
    }

    // ✅ TOKEN STRING
    const accessToken = crypto.randomBytes(32).toString("hex");

    console.log("GENERATED TOKEN:", accessToken);

    return res.status(200).json({
      responseCode: "2000000",
      responseMessage: "Auth Success",
      accessToken: accessToken,
      tokenType: "BearerToken",
      expiresIn: "900",
    });
  } catch (err) {
    return res.status(200).json({
      responseCode: String(err.code || 5000000),
      responseMessage: err.message || "Auth Error",
    });
  }
};