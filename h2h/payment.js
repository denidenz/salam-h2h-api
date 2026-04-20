const db = require('./firebase');
const { verifySignature } = require('../helper');

module.exports = async (req, res) => {
  try {
    const signature = req.headers["x-signature"];
    const clientKey = req.headers["x-client-key"];
    const timestamp = req.headers["x-timestamp"];

    console.log("PAYMENT BODY:", req.body);

    // 🔐 VERIFY SIGNATURE
    const isProduction = true;

    if (isProduction) {
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
    }

    const {
      virtualAccountNo,
      inquiryRequestId,
      paidAmount
    } = req.body;


    const virtualAccountNo = req.body.virtualAccountNo.trim();
    const partnerServiceId = req.body.partnerServiceId.trim();

    // 🔥 NORMALISASI VA
    let cleanCustomerNo = virtualAccountNo.toString().trim();

    while (cleanCustomerNo.startsWith("1754")) {
      cleanCustomerNo = cleanCustomerNo.substring(4);
    }

    console.log("PAYMENT CUSTOMER:", cleanCustomerNo);

    // 🔍 AMBIL DATA
    const docRef = db.collection("transactions").doc(cleanCustomerNo);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.json({
        responseCode: "4042500",
        responseMessage: "Transaction Not Found"
      });
    }

    const data = doc.data();

    // 🔁 CEK SUDAH BAYAR
    if (data.status === "PAID") {
      return res.json({
        responseCode: "2002500",
        responseMessage: "Already Paid"
      });
    }

    // ❌ VALIDASI INQUIRY ID (WAJIB)
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
