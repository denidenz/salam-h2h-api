const db = require('./firebase');
const crypto = require("crypto");

function verifySignature({ clientKey, timestamp, signature, publicKey }) {
  try {
    const data = `${clientKey}${timestamp}`; // 🔥 TANPA PIPE

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(data);
    verifier.end();

    return verifier.verify(publicKey, signature, "base64");
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return false;
  }
}

module.exports = async (req, res) => {
  try {
    console.log("===== PAYMENT HIT =====");
    console.log("ALL HEADERS:", req.headers);
    console.log("BODY:", req.body);
    console.log("RAW BODY:", req.rawBody);

    // 🔥 FIX HEADER (BISA BPI / SNAP)
    const signature =
      req.headers["x-signature"] || req.headers["bpi-signature"];

    const clientKey =
      req.headers["x-client-key"] || req.headers["bpi-partner-id"];

    const timestamp =
      req.headers["x-timestamp"] || req.headers["bpi-timestamp"];

    console.log("PARSED HEADERS:", { signature, clientKey, timestamp });

    if (!signature || !clientKey || !timestamp) {
      return res.status(400).json({
        responseCode: "4002500",
        responseMessage: "Missing Header"
      });
    }

    const isValid = verifySignature(req);

    console.log("SIGN VALID:", isValid);

    if (!isValid) {
      return res.status(401).json({
        responseCode: "4032500",
        responseMessage: "Invalid Signature"
      });
    }

    // ✅ PROCESS PAYMENT
    const virtualAccountNo = req.body.virtualAccountNo?.trim();
    const inquiryRequestId = req.body.inquiryRequestId;
    const paidAmount = req.body.paidAmount;

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
