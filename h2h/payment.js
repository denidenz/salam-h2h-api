const db = require("./firebase");
const { verifySignature } = require("./helper");

module.exports = async (req, res) => {
  try {
    console.log("===== PAYMENT HIT =====");

    // 🔐 VALIDASI SIGNATURE
    const isValid = verifySignature(req);

    if (!isValid) {
      return res.status(401).json({
        responseCode: "4012500",
        responseMessage: "Unauthorized Access",
      });
    }

    const {
      virtualAccountNo,
      paymentRequestId,
      paidAmount,
    } = req.body;

    // 🔧 bersihkan VA
    let customerNo = virtualAccountNo?.trim();

    while (customerNo.startsWith("1754")) {
      customerNo = customerNo.substring(4);
    }

    console.log("CUSTOMER:", customerNo);

    // 🔍 ambil data
    const docRef = db.collection("transactions").doc(customerNo);
    const doc = await docRef.get();

    // ❌ BILL NOT FOUND
    if (!doc.exists) {
      return res.json({
        responseCode: "4042512",
        responseMessage: "Bill not found",
      });
    }

    const data = doc.data();

    // ❌ SUDAH DIBAYAR
    if (data.status === "PAID") {
      return res.json({
        responseCode: "4042514",
        responseMessage: "Bill already paid",
      });
    }

    // ❌ INVALID INQUIRY (pakai INVALID DATA)
    if (
      process.env.IS_SANDBOX !== "true" &&
      data.lastInquiryId !== paymentRequestId
    ) {
      return res.json({
        responseCode: "4042511",
        responseMessage: "Invalid data",
      });
    }

    // ❌ INVALID AMOUNT
    if (parseFloat(paidAmount.value) !== data.amount) {
      return res.json({
        responseCode: "4042513",
        responseMessage: "Payment Amount not valid",
      });
    }

    // ✅ SUCCESS
    await docRef.update({
      status: "PAID",
      paidAt: new Date(),
    });

    return res.json({
      responseCode: "2002500",
      responseMessage: "Success",
    });

  } catch (error) {
    console.error("PAYMENT ERROR:", error);

    return res.status(500).json({
      responseCode: "5002500",
      responseMessage: "General Error",
    });
  }
};
