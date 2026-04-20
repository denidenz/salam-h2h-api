const db = require('./firebase');

module.exports = async (req, res) => {
  try {
    let { customerNo, name, amount } = req.body;

    // 🔍 VALIDASI INPUT
    if (!customerNo || !amount) {
      return res.json({
        success: false,
        message: "customerNo & amount wajib"
      });
    }

    // 🔥 NORMALISASI customerNo (ANTI DOUBLE PREFIX)
    customerNo = customerNo.toString().trim();

    if (customerNo.startsWith("1754")) {
      customerNo = customerNo.substring(4);
    }

    // 🔥 VALIDASI NUMERIC
    if (!/^[0-9]+$/.test(customerNo)) {
      return res.json({
        success: false,
        message: "customerNo harus angka"
      });
    }

    // 🔥 FORMAT VA (SELALU AMAN)
    const partnerServiceId = "1754";
    const virtualAccountNo = `${partnerServiceId}${customerNo}`;

    console.log("CREATE VA:", virtualAccountNo);

    // 🔥 CEK TRANSAKSI AKTIF
    const docRef = db.collection("transactions").doc(customerNo);
    const doc = await docRef.get();

    if (doc.exists) {
      const existing = doc.data();

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
