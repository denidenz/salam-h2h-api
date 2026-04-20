const db = require('./firebase');

module.exports = async (req, res) => {
  try {
    const {
      customerNo,
      virtualAccountNo,
      amount,
      name
    } = req.body;

    if (!virtualAccountNo || !amount) {
      return res.json({
        success: false,
        message: "Invalid request"
      });
    }

    const invoiceId = Date.now().toString();

    await db.collection("transactions").doc(invoiceId).set({
      invoiceId,
      customerNo,
      virtualAccountNo,
      amount,
      name,
      status: "UNPAID",
      createdAt: new Date(),
      paidAt: null
    });

    return res.json({
      success: true,
      invoiceId,
      virtualAccountNo
    });

  } catch (err) {
    console.error("CREATE ERROR:", err);
    return res.json({ success: false, message: err.message });
  }
};
