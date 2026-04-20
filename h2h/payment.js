const db = require('./firebase');
const { verifySignature } = require('../helper');

module.exports = async (req, res) => {
  try {
    const signature = req.headers["x-signature"];
    const clientKey = req.headers["x-client-key"];
    const timestamp = req.headers["x-timestamp"];

    const isProduction = true;

    if (isProduction) {
      const isValid = verifySignature({
        clientKey,
        timestamp,
        signature,
        publicKey: process.env.BSI_PUBLIC_KEY
      });

      if (!isValid) {
        return res.json({
          responseCode: "4032500",
          responseMessage: "Invalid Signature"
        });
      }
    }

    const {
      virtualAccountNo,
      paidAmount
    } = req.body;

    // 🔥 ambil customerNo dari VA
    const extractedCustomerNo = virtualAccountNo.substring(4);

    const docRef = db.collection("transactions").doc(extractedCustomerNo);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.json({
        responseCode: "4042500",
        responseMessage: "Transaction Not Found"
      });
    }

    const data = doc.data();

    // 🔁 double payment
    if (data.status === "PAID") {
      return res.json({
        responseCode: "2002500",
        responseMessage: "Already Paid"
      });
    }

    // 💰 validasi nominal
    if (parseFloat(paidAmount.value) !== data.amount) {
      return res.json({
        responseCode: "4002500",
        responseMessage: "Invalid Amount"
      });
    }

    // 🔥 update firestore
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
