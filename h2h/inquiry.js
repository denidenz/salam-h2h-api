const db = require('./firebase');

function getExpiredTime() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  return date.toISOString().replace('Z', '+07:00');
}

module.exports = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);

    const virtualAccountNo = req.body.virtualAccountNo?.trim();
    const partnerServiceId = req.body.partnerServiceId?.trim();
    const inquiryRequestId = req.body.inquiryRequestId;

    console.log("VA DARI BSI:", virtualAccountNo);

    // 🔥 NORMALISASI VA
    let cleanCustomerNo = virtualAccountNo;

    while (cleanCustomerNo.startsWith("1754")) {
      cleanCustomerNo = cleanCustomerNo.substring(4);
    }

    console.log("FIXED CUSTOMER:", cleanCustomerNo);

    const docRef = db.collection("transactions").doc(cleanCustomerNo);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.json({
        responseCode: "2002404",
        responseMessage: "Bill Not Found"
      });
    }

    const data = doc.data();

    if (data.status !== "UNPAID") {
      return res.json({
        responseCode: "2002404",
        responseMessage: "Bill Not Found"
      });
    }

    // simpan inquiry ID
    await docRef.update({
      lastInquiryId: inquiryRequestId
    });

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

        expiredDateTime: getExpiredTime(),

        billDetails: [
          {
            billCode: "01",
            billNo: inquiryRequestId,
            billName: "Pembayaran",
            billAmount: {
              value: data.amount.toFixed(2),
              currency: "IDR"
            }
          }
        ],

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
