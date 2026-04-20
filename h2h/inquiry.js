const db = require('./firebase')

module.exports = async (req, res) => {
  try {
    const {
      partnerServiceId,
      customerNo,
      virtualAccountNo,
      inquiryRequestId
    } = req.body;

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
        partnerServiceId: ` ${partnerServiceId}`,
        customerNo,
        virtualAccountNo: ` ${virtualAccountNo}`,
        virtualAccountName: "TEST CUSTOMER",
        inquiryRequestId,
        totalAmount: {
          value: amount.toFixed(2),
          currency: "IDR"
        },
        additionalInfo: {}
      }
    });

  } catch (err) {
    console.error(err);
    return res.json({
      responseCode: "5002400",
      responseMessage: "Inquiry Error"
    });
  }
};
