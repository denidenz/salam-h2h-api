const db = require('./firebase');

module.exports = async (req, res) => {
  try {
    console.log("BODY:", req.body); // debug

    const {
      partnerServiceId,
      customerNo,
      virtualAccountNo,
      inquiryRequestId
    } = req.body;

    // 🔥 VALIDASI WAJIB
    if (!virtualAccountNo || !inquiryRequestId) {
      return res.json({
        responseCode: "4002400",
        responseMessage: "Invalid Request"
      });
    }

    const amount = 20000;

    // 🔥 SIMPAN KE FIREBASE
    await db.collection("transactions").doc(inquiryRequestId).set({
      invoiceId: inquiryRequestId,
      customerNo,
      virtualAccountNo,
      amount,
      status: "UNPAID",
      createdAt: new Date(),
      paidAt: null
    });

    return res.json({
      responseCode: "2002400",
      responseMessage: "Successful",
      virtualAccountData: {
        partnerServiceId: partnerServiceId, // ❌ jangan pakai spasi
        customerNo,
        virtualAccountNo: virtualAccountNo, // ❌ jangan pakai spasi
        virtualAccountName: "TEST CUSTOMER",
        inquiryRequestId,
        totalAmount: {
          value: amount.toFixed(2),
          currency: "IDR"
        },
        additionalInfo: {}
      }
    });

  } catch (error) {
    console.error("INQUIRY ERROR:", error);

    return res.json({
      responseCode: "5002400",
      responseMessage: error.message
    });
  }
};
