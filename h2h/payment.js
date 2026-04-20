const db = require('./firebase');
const crypto = require("crypto");

function verifySignature(req) {
  try {
    const signature =
      req.headers["x-signature"] || req.headers["bpi-signature"];

    const timestamp =
      req.headers["x-timestamp"] || req.headers["bpi-timestamp"];

    const accessToken =
      req.headers["authorization"]?.replace("Bearer ", "") ||
      req.headers["bpi-authorization"]?.replace("Bearer ", "");

    const method = req.method.toUpperCase(); // POST
    const endpoint = "/payment";
    const body = req.rawBody;

    console.log("===== SIGN DEBUG =====");
    console.log("SIGNATURE:", signature);
    console.log("TIMESTAMP:", timestamp);
    console.log("TOKEN:", accessToken);
    console.log("BODY:", body);
    console.log("KEY LENGTH:", process.env.BSI_PUBLIC_KEY.length);
    console.log("CLIENT KEY:", clientKey);

    if (!signature || !timestamp || !accessToken || !body) {
      console.log("❌ Missing data for signature");
      return false;
    }

    const stringToSign =
      `${method}:${endpoint}:${body}:${accessToken}:${timestamp}`;

    console.log("STRING TO SIGN:", stringToSign);

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(stringToSign);
    verifier.end();

    const isValid = verifier.verify(
      process.env.BSI_PUBLIC_KEY,
      signature,
      "base64"
    );

    return isValid;

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

    // ✅ Ambil data dari request
    const virtualAccountNo = req.body.virtualAccountNo?.trim();
    const inquiryRequestId = req.body.paymentRequestId;
    const paidAmount = req.body.paidAmount;

    // 🔥 Bersihkan VA (hapus prefix 1754 berulang)
    let cleanCustomerNo = virtualAccountNo;

    while (cleanCustomerNo.startsWith("1754")) {
      cleanCustomerNo = cleanCustomerNo.substring(4);
    }

    console.log("PAYMENT CUSTOMER:", cleanCustomerNo);

    // ✅ Ambil data Firestore
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

    // ✅ Update Firestore
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
