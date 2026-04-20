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

    // ❌ BILL NOT FOUND
    if (!doc.exists) {
      return res.json({
        responseCode: "4042512",
        responseMessage: "Bill not found"
      });
    }

    const data = doc.data();

    // ❌ SUDAH TIDAK BISA DIBAYAR
    if (data.status !== "UNPAID") {
      return res.json({
        responseCode: "4042511",
        responseMessage: "Invalid data"
      });
    }

    // simpan inquiry ID
    await docRef.update({
      lastInquiryId: inquiryRequestId
    });

    // ✅ SUCCESS
    return res.json({
      responseCode: "2002400",
      responseMessage: "Success",
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
      responseCode: "5002500",
      responseMessage: "General Error"
    });
  }
};
