const db = require('./firebase');
const crypto = require("crypto");

function verifySignature(req) {
  try {
    const signature =
      req.headers["x-signature"] || req.headers["bpi-signature"];

    const timestamp =
      req.headers["x-timestamp"] || req.headers["bpi-timestamp"];

    const endpoint = req.headers["endpoint-url"];

    const authorization =
      req.headers["authorization"] || req.headers["bpi-authorization"];

    const accessToken = authorization?.replace("Bearer ", "");

    const bodyString = req.rawBody; // 🔥 WAJIB PAKAI INI

    const stringToSign =
      `${req.method}:${endpoint}:${bodyString}:${accessToken}:${timestamp}`;

    console.log("===== SIGN DEBUG =====");
    console.log("STRING TO SIGN:", stringToSign);
    console.log("CLIENT_SECRET:", process.env.CLIENT_SECRET);

    const localSignature = crypto
      .createHmac("sha256", process.env.CLIENT_SECRET)
      .update(stringToSign)
      .digest("base64");

    console.log("LOCAL SIGN:", localSignature);
    console.log("BSI SIGN :", signature);

    return localSignature === signature;

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return false;
  }
}

module.exports = async (req, res) => {
  try {
    console.log("===== PAYMENT HIT =====");
    console.log("HEADERS:", req.headers);
    console.log("RAW BODY:", req.rawBody);

    const isValid = verifySignature(req);

    console.log("SIGN VALID:", isValid);

    if (!isValid) {
      return res.status(401).json({
        responseCode: "4032500",
        responseMessage: "Invalid Signature"
      });
    }

    // =========================
    // ✅ PROCESS PAYMENT
    // =========================

    const virtualAccountNo = req.body.virtualAccountNo?.trim();
    const inquiryRequestId = req.body.inquiryRequestId;
    const paidAmount = req.body.paidAmount;

    // 🔥 NORMALISASI VA → ambil customerNo
    let cleanCustomerNo = virtualAccountNo;

    while (cleanCustomerNo.startsWith("1754")) {
      cleanCustomerNo = cleanCustomerNo.substring(4);
    }

    console.log("PAYMENT CUSTOMER:", cleanCustomerNo);

    const docRef = db.collection("transactions").doc(cleanCustomerNo);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.json({
        responseCode: "4042500",
        responseMessage: "Transaction Not Found"
      });
    }

    const data = doc.data();

    // 🔁 sudah bayar
    if (data.status === "PAID") {
      return res.json({
        responseCode: "2002500",
        responseMessage: "Already Paid"
      });
    }

    // ❌ validasi inquiry
    if (data.lastInquiryId !== inquiryRequestId) {
      return res.json({
        responseCode: "4002500",
        responseMessage: "Invalid Inquiry"
      });
    }

    // ❌ validasi nominal
    if (parseFloat(paidAmount.value) !== data.amount) {
      return res.json({
        responseCode: "4002500",
        responseMessage: "Invalid Amount"
      });
    }

    // 🔥 UPDATE FIRESTORE
    await docRef.update({
      status: "PAID",
      paidAt: new Date()
    });

    console.log("🔥 FIRESTORE UPDATED");

    return res.json({
      responseCode: "2002500",
      responseMessage: "Successful"
    });

  } catch (error) {
    console.error("PAYMENT ERROR:", error);

    return res.status(500).json({
      responseCode: "5002500",
      responseMessage: error.message
    });
  }
};
