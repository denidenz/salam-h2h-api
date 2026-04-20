const db = require('./firebase');
const { verifySignature } = require('../helper');

module.exports = async (req, res) => {
  try {
    console.log("PAYMENT BODY:", req.body);

    // ✅ ambil header dulu (WAJIB di atas)
    const signature = req.headers["x-signature"];
    const clientKey = req.headers["x-client-key"];
    const timestamp = req.headers["x-timestamp"];

    if (!signature || !clientKey || !timestamp) {
      return res.status(400).json({
        responseCode: "4002500",
        responseMessage: "Missing Header"
      });
    }

    // 🔐 verify signature
    const isValid = verifySignature({
      clientKey,
      timestamp,
      signature,
      publicKey: process.env.BSI_PUBLIC_KEY,
      body: req.body
    });

    console.log("SIGN VALID:", isValid);

    if (!isValid) {
      return res.status(401).json({
        responseCode: "4032500",
        responseMessage: "Invalid Signature"
      });
    }

    // ✅ baru ambil body
    const virtualAccountNo = req.body.virtualAccountNo?.trim();
    const inquiryRequestId = req.body.inquiryRequestId;
    const paidAmount = req.body.paidAmount;

    // 🔥 normalize VA
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

    if (data.status === "PAID") {
      return res.json({
        responseCode: "2002500",
        responseMessage: "Already Paid"
      });
    }

    if (data.lastInquiryId !== inquiryRequestId) {
      return res.json({
        responseCode: "4002500",
        responseMessage: "Invalid Inquiry"
      });
    }

    if (parseFloat(paidAmount.value) !== data.amount) {
      return res.json({
        responseCode: "4002500",
        responseMessage: "Invalid Amount"
      });
    }

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

    return res.status(500).json({
      responseCode: "5002500",
      responseMessage: error.message
    });
  }
};
