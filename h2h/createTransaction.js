const db = require('./firebase');

module.exports = async (req, res) => {
  try {
    const {
      customerNo,
      name,
      amount
    } = req.body;

    // 🔍 VALIDASI INPUT
    if (!customerNo || !amount) {
      return res.json({
        success: false,
        message: "customerNo & amount wajib"
      });
    }

    // 🔥 FORMAT VA (1754 + customerNo)
    const partnerServiceId = "1754";
    const virtualAccountNo = `${partnerServiceId}${customerNo}`;

    // 🔥 CEK apakah sudah ada transaksi aktif
    const docRef = db.collection("transactions").doc(customerNo);
    const doc = await docRef.get();

    if (doc.exists) {
      const existing = doc.data();

      // ❗ kalau masih unpaid, jangan overwrite (hindari duplikasi)
      if (existing.status === "UNPAID") {
        return res.json({
          success: true,
          message: "Transaksi sudah ada",
          invoiceId: existing.invoiceId,
          virtualAccountNo: existing.virtualAccountNo
        });
      }
    }

    // 🔥 BUAT INVOICE BARU
    const invoiceId = Date.now().toString();

    await docRef.set({
      invoiceId,
      customerNo,
      name: name || "CUSTOMER",
      virtualAccountNo,
      amount: parseFloat(amount),
      status: "UNPAID",
      createdAt: new Date(),
      paidAt: null
    });

    return res.json({
      success: true,
      message: "Transaksi berhasil dibuat",
      invoiceId,
      virtualAccountNo
    });

  } catch (error) {
    console.error("CREATE TRANSACTION ERROR:", error);

    return res.json({
      success: false,
      message: error.message
    });
  }
};
