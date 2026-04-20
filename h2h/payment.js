const db = require('./firebase');
const { verifySignature } = require('../helper');

module.exports = async (req, res) => {
  try {
    console.log("===== PAYMENT HIT =====");

    // 🔍 DEBUG
    console.log("ALL HEADERS FULL:", JSON.stringify(req.headers, null, 2));
    console.log("PAYMENT BODY:", JSON.stringify(req.body, null, 2));

    // 🔥 NORMALIZE HEADER
    const headers = {};
    Object.keys(req.headers).forEach(key => {
      headers[key.toLowerCase()] = req.headers[key];
    });

    // 🔥 SUPPORT BSI (BPI HEADER)
    const signature =
      headers["x-signature"] ||
      headers["bpi-signature"];

    const clientKey =
      headers["x-client-key"] ||
      headers["bpi-partner-id"];

    const timestamp =
      headers["x-timestamp"] ||
      headers["bpi-timestamp"];

    console.log("PARSED HEADERS:", {
      signature,
      clientKey,
      timestamp
    });

    // ❌ VALIDASI HEADER
    if (!signature || !clientKey || !timestamp) {
      console.log("❌ HEADER TIDAK LENGKAP");

      return res.json({
        responseCode: "4002500",
        responseMessage: "Missing Header"
      });
    }

    // 🔐 VERIFY SIGNATURE (FORMAT BSI)
    const isValid = verifySignature({
      clientKey,
      timestamp,
      signature,
      publicKey: process.env.BSI_PUBLIC_KEY
    });

    console.log("SIGN VALID:", isValid);

    if (!isValid) {
      return res.json({
        responseCode: "4032500",
        responseMessage: "Invalid Signature"
      });
    }

    // 🔥 AMBIL BODY
    const virtualAccountNo = req.body.virtualAccountNo?.trim();
    const inquiryRequestId = req.body.inquiryRequestId;
    const paidAmount = req.body.paidAmount;

    // 🔥 NORMALISASI VA
    let cleanCustomerNo = virtualAccountNo;

    while (cleanCustomerNo.startsWith("1754")) {
      cleanCustomerNo = cleanCustomerNo.substring(4);
    }

    console.log("CUSTOMER AFTER NORMALIZE:", cleanCustomerNo);

    // 🔍 AMBIL DATA FIRESTORE
    const docRef = db.collection("transactions").doc(cleanCustomerNo);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.json({
        responseCode: "4042500",
        responseMessage: "Transaction Not Found"
      });
    }

    const data = doc.data();

    // 🔁 SUDAH BAYAR
    if (data.status === "PAID") {
      return res.json({
        responseCode: "2002500",
        responseMessage: "Already Paid"
      });
    }

    // ❌ VALIDASI INQUIRY
    if (data.lastInquiryId !== inquiryRequestId) {
      return res.json({
        responseCode: "4002500",
        responseMessage: "Invalid Inquiry"
      });
    }

    // ❌ VALIDASI NOMINAL
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

    console.log("✅ PAYMENT SUCCESS");

    return res.json({
      responseCode: "2002500",
      responseMessage: "Successful"
    });

  } catch (error) {
    console.error("PAYMENT ERROR:", error);

    return res.json({
      responseCode: "5002500",
      responseMessage: error.message
    });
  }
};
