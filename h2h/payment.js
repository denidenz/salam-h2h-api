const db = require("./firebase");
const { verifySignature } = require("./helper");

module.exports = async (req, res) => {
  try {
    console.log("===== PAYMENT HIT =====");
    console.log("HEADERS:", req.headers);
    console.log("RAW BODY:", JSON.stringify(req.body));
    console.log("RAW LENGTH:", body.length);
console.log("RAW EXACT:", JSON.stringify(body));

    // 🔐 VALIDASI SIGNATURE
    const isValid = verifySignature(req);

    if (!isValid) {
      return res.status(401).json({
        responseCode: "4032500",
        responseMessage: "Invalid Signature",
      });
    }

    // ambil data body
    const {
      virtualAccountNo,
      paymentRequestId,
      paidAmount,
    } = req.body;

    // ✅ bersihkan VA (hapus prefix 1754 berulang)
    let cleanCustomerNo = virtualAccountNo?.trim();

    while (cleanCustomerNo.startsWith("1754")) {
      cleanCustomerNo = cleanCustomerNo.substring(4);
    }

    console.log("PAYMENT CUSTOMER:", cleanCustomerNo);

    // 🔍 ambil data dari Firestore
    const docRef = db.collection("transactions").doc(cleanCustomerNo);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.json({
        responseCode: "4042500",
        responseMessage: "Transaction Not Found",
      });
    }

    const data = doc.data();

    // ✅ sudah dibayar
    if (data.status === "PAID") {
      return res.json({
        responseCode: "2002500",
        responseMessage: "Already Paid",
      });
    }

    // ❌ validasi inquiry ID
    if (data.lastInquiryId !== paymentRequestId) {
      return res.json({
        responseCode: "4002500",
        responseMessage: "Invalid Inquiry",
      });
    }

    // ❌ validasi amount
    if (parseFloat(paidAmount.value) !== data.amount) {
      return res.json({
        responseCode: "4002500",
        responseMessage: "Invalid Amount",
      });
    }

    // ✅ update status
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
