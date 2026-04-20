const crypto = require("crypto");
const db = require('./firebase')

module.exports = async (req, res) => {
  try {
    const signature = req.headers["x-signature"];
    const clientKey = req.headers["x-client-key"];
    const timestamp = req.headers["x-timestamp"];

    const data = `${clientKey}|${timestamp}`;

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(data);

    const isValid = verifier.verify(
      process.env.BSI_PUBLIC_KEY,
      signature,
      "base64"
    );

    console.log("PAYMENT VALID:", isValid);

    if (!isValid) {
      return res.json({
        responseCode: "4032500",
        responseMessage: "Invalid Signature"
      });
    }

    const { inquiryRequestId } = req.body;

    // 🔥 UPDATE FIREBASE
    await db.collection("transactions")
      .doc(inquiryRequestId)
      .update({
        status: "PAID",
        paidAt: new Date()
      });

    return res.json({
      responseCode: "2002500",
      responseMessage: "Payment Success"
    });

  } catch (err) {
    console.error(err);
    return res.json({
      responseCode: "5002500",
      responseMessage: "Payment Error"
    });
  }
};
