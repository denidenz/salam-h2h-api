const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.paymentNotify = async (req, res) => {
  try {
    const { virtualAccountNo, paymentStatus } = req.body;

    console.log("CALLBACK MASUK:", req.body);

    const db = admin.database();
    const snapshot = await db.ref("tagihan").once("value");

    let foundKey = null;
    let foundData = null;

    snapshot.forEach((child) => {
      const data = child.val();

      if (
        String(data.virtualAccountNo).trim() ===
        String(virtualAccountNo).trim()
      ) {
        foundKey = child.key;
        foundData = data;
      }
    });

    // ===============================
    // JIKA DATA TIDAK ADA
    // ===============================
    if (!foundKey) {
      return res.status(404).json({
        responseCode: "4042500",
        responseMessage: "Data tidak ditemukan",
      });
    }

    // ===============================
    // IDEMPOTENT (ANTI DOUBLE CALLBACK)
    // ===============================
    if (foundData.status === "PAID") {
      return res.status(200).json({
        responseCode: "2002500",
        responseMessage: "Already Paid",
      });
    }

    // ===============================
    // UPDATE STATUS
    // ===============================
    await db.ref(`tagihan/${foundKey}`).update({
      status: paymentStatus === "SUCCESS" ? "PAID" : "FAILED",
      paidAt: Date.now(),
    });

    console.log("✅ STATUS UPDATED:", foundKey);

    return res.status(200).json({
      responseCode: "2002500",
      responseMessage: "Success",
    });
  } catch (err) {
    console.error("ERROR:", err);

    return res.status(500).json({
      responseCode: "5002500",
      responseMessage: "General Error",
    });
  }
};