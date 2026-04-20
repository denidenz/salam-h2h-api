const db = require("./firebase");
const { verifySignature } = require("./helper");

module.exports = async (req, res) => {
  try {
    console.log("===== PAYMENT HIT =====");
    console.log("HEADERS:", req.headers);

    // 🔥 WAJIB pakai rawBody untuk signature
    const body = req.rawBody;

    console.log("RAW BODY:", body);
    console.log("RAW LENGTH:", body.length);

    // 🔐 VALIDASI SIGNATURE
    const isValid = verifySignature(req);

    console.log("SIGN VALID:", isValid);

    if (!isValid) {
      return res.status(401).json({
        responseCode: "4032500",
        responseMessage: "Invalid Signature",
      });
    }

    // ambil data body (parsed JSON)
    const {
      virtualAccountNo,
      paymentRequestId,
      paidAmount,
    } = req.body;

    // ✅ bersihkan VA
    let cleanCustomerNo = virtualAccountNo?.trim();

    while (cleanCustomerNo.startsWith("1754")) {
      cleanCustomerNo = cleanCustomerNo.substring(4);
    }

    console.log("PAYMENT CUSTOMER:", cleanCustomerNo);

    // 🔍 ambil data Firestore
    const docRef = db.collection("transactions").doc(cleanCustomerNo);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.json({
        responseCode: "4042500",
        responseMessage: "Transaction Not Found",
      });
    }

    const data = doc.data();

    if (data.status === "PAID") {
      return res.json({
        responseCode: "2002500",
        responseMessage: "Already Paid",
      });
    }

    if (data.lastInquiryId !== paymentRequestId) {
      return res.json({
        responseCode: "4002500",
        responseMessage: "Invalid Inquiry",
      });
    }

    if (parseFloat(paidAmount.value) !== data.amount) {
      return res.json({
        responseCode: "4002500",
        responseMessage: "Invalid Amount",
      });
    }

    // ✅ update
    await docRef.update({
      status: "PAID",
      paidAt: new Date(),
    });

    return res.json({
      responseCode: "2002500",
      responseMessage: "Successful",
    });

  } catch (error) {
    console.error("PAYMENT ERROR:", error);

    return res.status(500).json({
      responseCode: "5002500",
      responseMessage: error.message,
    });
  }
};
