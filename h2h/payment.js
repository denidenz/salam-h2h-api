const db = require("./firebase");
const { verifySignature } = require("./helper");

// helper bersihin input (ANTI SPASI BSI)
function clean(value) {
  return (value || "").toString().trim();
}

module.exports = async (req, res) => {
  try {
    console.log("===== PAYMENT HIT =====");

    // 🔥 SIMULASI DB DOWN (UNTUK TEST)
    if (process.env.SIMULATE_DB_DOWN === "true") {
      console.log("⚠️ SIMULATE DB DOWN");

      return res.status(500).json({
        responseCode: "5002500",
        responseMessage: "General Error",
      });
    }

    // 🔐 VALIDASI SIGNATURE
    const isValid = verifySignature(req);

    if (!isValid) {
      return res.status(401).json({
        responseCode: "4012500",
        responseMessage: "Unauthorized Access",
      });
    }

    // 🔥 CLEAN INPUT
    const virtualAccountNo = clean(req.body.virtualAccountNo);
    const paymentRequestId = clean(req.body.paymentRequestId);
    const paidAmount = req.body.paidAmount;

    console.log("VA CLEAN:", virtualAccountNo);

    // ❌ VALIDASI FIELD
    if (!virtualAccountNo || !paymentRequestId || !paidAmount?.value) {
      return res.status(400).json({
        responseCode: "4002502",
        responseMessage: "Field is not exists",
      });
    }

    // ❌ VALIDASI FORMAT VA
    if (!/^\d+$/.test(virtualAccountNo)) {
      return res.status(404).json({
        responseCode: "4042519",
        responseMessage: "Invalid Bill number format",
      });
    }

    // 🔧 NORMALISASI VA → customerNo
    let customerNo = virtualAccountNo;

    while (customerNo.startsWith("1754")) {
      customerNo = customerNo.substring(4);
    }

    customerNo = customerNo.trim();

    console.log("CUSTOMER:", customerNo);

    // 🔍 AMBIL DATA FIRESTORE
    const docRef = db.collection("transactions").doc(customerNo);
    const doc = await docRef.get();

    // ❌ BILL NOT FOUND
    if (!doc.exists) {
      return res.status(404).json({
        responseCode: "4042512",
        responseMessage: "Bill not found",
      });
    }

    const data = doc.data();

    // ❌ SUDAH DIBAYAR
    if (data.status === "PAID") {
      return res.status(404).json({
        responseCode: "4042514",
        responseMessage: "Bill already paid",
      });
    }

    // ❌ INVALID AMOUNT
    if (Number(paidAmount.value) !== Number(data.amount)) {
      console.log("EXPECTED:", data.amount);
      console.log("PAID:", paidAmount.value);

      return res.status(404).json({
        responseCode: "4042513",
        responseMessage: "Payment Amount not valid",
      });
    }

    // ✅ SUCCESS → UPDATE DB
    await docRef.update({
      status: "PAID",
      paidAt: new Date(),
      paymentRequestId, // simpan untuk audit
    });

    console.log("PAYMENT SUCCESS:", customerNo);

    return res.status(200).json({
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
