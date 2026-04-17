const functions = require("firebase-functions");
const axios = require("axios");
const crypto = require("crypto");
const cors = require("cors")({ origin: true });

// 🔐 CONFIG (GANTI SESUAI PUNYA KAMU)
const BASE_URL = "https://inquiry-nkopprxlqa-uc.a.run.app";
const ACCESS_TOKEN = "YcAhPW4ty3gvdErRkJxHq6ljufzoFsmDQG2e5Uip";
const CLIENT_SECRET = "SALAM212411";

// 🔧 FUNCTION: GENERATE SIGNATURE (FIX ORDER)
function generateSignature({ method, endpoint, token, timestamp, body }) {
  // 🔥 FIX URUTAN BODY (WAJIB BSI)
  const fixedBody = {
    partnerServiceId: body.partnerServiceId,
    customerNo: body.customerNo,
    virtualAccountNo: body.virtualAccountNo,
    inquiryRequestId: body.inquiryRequestId,
  };

  const bodyString = JSON.stringify(fixedBody);

  const hashedBody = crypto
    .createHash("sha256")
    .update(bodyString)
    .digest("hex");

  const stringToSign =
    method +
    ":" +
    endpoint +
    ":" +
    token +
    ":" +
    hashedBody +
    ":" +
    timestamp;

  console.log("=== DEBUG SIGNATURE ===");
  console.log("BODY:", bodyString);
  console.log("HASH BODY:", hashedBody);
  console.log("STRING TO SIGN:", stringToSign);

  const signature = crypto
    .createHmac("sha512", CLIENT_SECRET)
    .update(stringToSign)
    .digest("hex");

  console.log("SIGNATURE:", signature);

  return signature;
}

// 🚀 MAIN FUNCTION
exports.inquiry = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // 🔹 VALIDASI REQUEST
      if (!req.body || !req.body.virtualAccountNo) {
        return res.status(400).json({
          responseCode: "4002400",
          responseMessage: "Invalid request body",
        });
      }

      const body = req.body;

      const endpoint = "/inquiry";
      const method = "POST";

      // 🔥 TIMESTAMP FORMAT (NO MILLISECOND)
      const timestamp = new Date().toISOString().split(".")[0] + "Z";

      // 🔐 GENERATE SIGNATURE
      const signature = generateSignature({
        method,
        endpoint,
        token: ACCESS_TOKEN,
        timestamp,
        body,
      });

      console.log("=== CALL BSI ===");
      console.log("URL:", BASE_URL + endpoint);
      console.log("TIMESTAMP:", timestamp);

      // 🚀 CALL BSI API
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
          timeout: 20000,
        }
      );

      console.log("=== RESPONSE BSI ===");
      console.log(response.data);

      // 🔹 RETURN KE FLUTTERFLOW
      return res.status(200).json(response.data);

    } catch (error) {
      console.error("=== ERROR ===");
      console.error(error.response?.data || error.message);

      return res.status(500).json({
        message: "Inquiry failed",
        error: error.response?.data || error.message,
      });
    }
  });
});