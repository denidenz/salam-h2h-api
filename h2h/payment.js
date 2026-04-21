const db = require("./firebase");
const { verifySignature } = require("./helper");

function clean(value) {
  return (value || "").toString().trim();
}

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

    // 🔥 SIMULASI (OPTIONAL - OFF DI PROD)
    if (process.env.SIMULATE_DB_DOWN === "true") {
      return res.status(500).json({
        responseCode: "5002500",
        responseMessage: "General Error",
      });
    }

    // 🔥 CLEAN INPUT
    const virtualAccountNo = clean(req.body.virtualAccountNo);
    const paymentRequestId = clean(req.body.paymentRequestId);
    const partnerServiceId = clean(req.body.partnerServiceId);
    const paidAmount = req.body.paidAmount;

    console.log("VA CLEAN:", virtualAccountNo);

    // ❌ VALIDASI FIELD
    if (!virtualAccountNo || !paymentRequestId || !paidAmount?.value) {
      return res.status(400).json({
        responseCode: "4002502",
        responseMessage: "Field is not exists",
      });
    }

    // ❌ VALIDASI PARTNER
    if (partnerServiceId !== "1754") {
      return res.status(404).json({
        responseCode: "4042511",
        responseMessage: "Invalid data",
      });
    }

    // ❌ VALIDASI FORMAT VA
    if (!/^\d+$/.test(virtualAccountNo) || virtualAccountNo.length < 8) {
      return res.status(404).json({
        responseCode: "4042519",
        responseMessage: "Invalid Bill number format",
      });
    }

    // 🔧 NORMALISASI VA
    let customerNo = virtualAccountNo;

    while (customerNo.startsWith("1754")) {
      customerNo = customerNo.substring(4);
    }

    customerNo = customerNo.trim();

    console.log("CUSTOMER:", customerNo);

    // 🔍 FIRESTORE
    const docRef = db.collection("transactions").doc(customerNo);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        responseCode: "4042512",
        responseMessage: "Bill not found",
      });
    }

    const data = doc.data();

    if (data.status === "PAID") {
      return res.status(404).json({
        responseCode: "4042514",
        responseMessage: "Bill already paid",
      });
    }

    // ❌ VALIDASI INQUIRY
    if (data.lastInquiryId !== paymentRequestId) {
      return res.status(404).json({
        responseCode: "4042511",
        responseMessage: "Invalid data",
      });
    }

    // ❌ VALIDASI AMOUNT
    const paid = Number(paidAmount.value || 0);
    const amount = Number(data.amount || 0);

    if (paid !== amount) {
      return res.status(404).json({
        responseCode: "4042513",
        responseMessage: "Payment Amount not valid",
      });
    }

    // ✅ SUCCESS
    await docRef.update({
      status: "PAID",
      paidAt: new Date(),
      paymentRequestId,
    });

    console.log("PAYMENT SUCCESS:", customerNo);

    return res.status(200).json({
      responseCode: "2002500",
      responseMessage: "Successful",
    });

  } catch (error) {
    console.error("PAYMENT ERROR:", error);

    return res.status(500).json({
      responseCode: "5002500",
      responseMessage: "General Error",
    });
  }
};
