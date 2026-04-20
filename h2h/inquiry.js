const db = require('./firebase');

module.exports = async (req, res) => {
  try {
    const {
      partnerServiceId,
      customerNo,
      virtualAccountNo,
      inquiryRequestId
    } = req.body;

    console.log("VA DARI BSI:", virtualAccountNo);

    // 🔥 NORMALISASI VA
    let cleanCustomerNo = virtualAccountNo.toString().trim();

    while (cleanCustomerNo.startsWith("1754")) {
      cleanCustomerNo = cleanCustomerNo.substring(4);
    }

    console.log("FIXED CUSTOMER:", cleanCustomerNo);
    console.log("FIRESTORE DOC ID:", cleanCustomerNo);

    // 🔍 CARI TRANSAKSI
    const docRef = db.collection("transactions").doc(cleanCustomerNo);
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
        customerNo: cleanCustomerNo,
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
