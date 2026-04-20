const db = require('./firebase'); // ✅ BENAR
const { verifySignature } = require('../helper');

module.exports = async (req, res) => {
  try {
    // 🔐 HEADER
    const signature = req.headers["x-signature"];
    const clientKey = req.headers["x-client-key"];
    const timestamp = req.headers["x-timestamp"];

    // 🔐 VERIFY SIGNATURE (aktifkan saat SIT)
    const isProduction = true;

    let isValid = true;

    if (isProduction) {
      isValid = verifySignature({
        clientKey,
        timestamp,
        signature,
        publicKey: process.env.BSI_PUBLIC_KEY
      });
    }

    if (!isValid) {
      return res.json({
        responseCode: "4032500",
        responseMessage: "Invalid Signature"
      });
    }

    // 🔥 BODY
    const {
      virtualAccountNo,
      inquiryRequestId,
      paidAmount
    } = req.body;

    // 🔍 CEK TRANSAKSI
    const docRef = db.collection("transactions").doc(inquiryRequestId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.json({
        responseCode: "4042500",
        responseMessage: "Transaction Not Found"
      });
    }

    const data = doc.data();

    // 🔁 IDEMPOTENT (hindari double payment)
    if (data.status === "PAID") {
      return res.json({
        responseCode: "2002500",
        responseMessage: "Already Paid"
      });
    }

    // 💰 VALIDASI AMOUNT (optional tapi disarankan)
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
