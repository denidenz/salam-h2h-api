const axios = require("axios");
const crypto = require("crypto");

const BASE_URL = process.env.BASE_URL;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

// 🔐 SIGNATURE
function generateSignature({ method, endpoint, token, timestamp, body }) {
  const bodyString = JSON.stringify(body);

  const hashedBody = crypto
    .createHash("sha256")
    .update(bodyString)
    .digest("hex");

  const stringToSign =
    method + ":" +
    endpoint + ":" +
    token + ":" +
    hashedBody + ":" +
    timestamp;

  console.log("STRING TO SIGN:", stringToSign);

  return crypto
    .createHmac("sha512", CLIENT_SECRET)
    .update(stringToSign)
    .digest("hex");
}

// 🚀 MAIN
module.exports = async (req, res) => {
  try {
    const body = req.body;

    if (!body.virtualAccountNo) {
      return res.status(400).json({
        responseCode: "4002400",
        responseMessage: "Invalid request body",
      });
    }

    const endpoint = "/inquiry";
    const method = "POST";

    const timestamp = new Date().toISOString().split(".")[0] + "Z";

    const signature = generateSignature({
      method,
      endpoint,
      token: ACCESS_TOKEN,
      timestamp,
      body,
    });

    console.log("=== CALL BSI ===");
    console.log("URL:", BASE_URL + endpoint);
    console.log("BODY:", body);

    const response = await axios.post(
      BASE_URL + endpoint,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ACCESS_TOKEN}`,
          "X-TIMESTAMP": timestamp,
          "X-SIGNATURE": signature,
        },
        timeout: 30000,
      }
    );

    console.log("=== RESPONSE BSI ===");
    console.log(response.data);

    return res.json(response.data);

  } catch (error) {
    console.error("=== ERROR ===");
    console.error(error.response?.data || error.message);

    return res.status(500).json({
      message: "Inquiry failed",
      error: error.response?.data || error.message,
    });
  }
};
