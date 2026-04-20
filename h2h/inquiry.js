const db = require('./firebase');

module.exports = async (req, res) => {
  try {
    const {
      partnerServiceId,
      customerNo,
      virtualAccountNo,
      inquiryRequestId
    } = req.body;

    // 🔍 ambil transaksi berdasarkan VA
    const snapshot = await db
      .collection("transactions")
      .where("virtualAccountNo", "==", virtualAccountNo)
      .where("status", "==", "UNPAID")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({
        responseCode: "4042400",
        responseMessage: "Bill Not Found"
      });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return res.json({
      responseCode: "2002400",
      responseMessage: "Successful",
      virtualAccountData: {
        partnerServiceId,
        customerNo,
        virtualAccountNo,
        virtualAccountName: data.name || "CUSTOMER",
        inquiryRequestId,
        totalAmount: {
          value: data.amount.toFixed(2),
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
