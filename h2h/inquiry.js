const db = require('./firebase');

module.exports = async (req, res) => {
  try {
    const {
      partnerServiceId,
      customerNo,
      virtualAccountNo,
      inquiryRequestId
    } = req.body;

    // 🔥 ambil customerNo dari VA
    const extractedCustomerNo = virtualAccountNo.substring(4);

    const docRef = db.collection("transactions").doc(extractedCustomerNo);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.json({
        responseCode: "4042400",
        responseMessage: "Bill Not Found"
      });
    }

    const data = doc.data();

    if (data.status !== "UNPAID") {
      return res.json({
        responseCode: "4042400",
        responseMessage: "Bill Not Found"
      });
    }

    return res.json({
      responseCode: "2002400",
      responseMessage: "Successful",
      virtualAccountData: {
        partnerServiceId,
        customerNo: extractedCustomerNo,
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
