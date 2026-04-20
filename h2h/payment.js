const db = require('./firebase');
const { verifySignature } = require('../helper');

module.exports = async (req, res) => {
  try {
    console.log("PAYMENT BODY:", req.body);

    const signature = req.headers["x-signature"];
    const clientKey = req.headers["x-client-key"];
    const timestamp = req.headers["x-timestamp"];

    // 🔐 VERIFY SIGNATURE
    const isValid = verifySignature({
      clientKey,
      timestamp,
      signature,
      publicKey: process.env.BSI_PUBLIC_KEY
    });

    console.log("SIGN VALID:", isValid);

    if (!isValid) {
      return res.status(401).json({
        responseCode: "4032500",
        responseMessage: "Invalid Signature"
      });
    }

    const virtualAccountNo = req.body.virtualAccountNo?.trim();
    const inquiryRequestId = req.body.inquiryRequestId;
    const paidAmount = req.body.paidAmount;

    // 🔥 NORMALISASI VA
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

    return res.json({
      responseCode: "5002500",
      responseMessage: error.message
    });
  }
};
