const db = require('./firebase');

module.exports = async (req, res) => {
  try {
    const {
      partnerServiceId,
      customerNo,
      virtualAccountNo,
      inquiryRequestId
    } = req.body;

    console.log("REQ BODY:", req.body);
    console.log("VA DARI BSI:", virtualAccountNo);

    // 🔥 NORMALISASI VA (ANTI DOUBLE PREFIX)
    let cleanCustomerNo = virtualAccountNo.toString().trim();

    while (cleanCustomerNo.startsWith("1754")) {
      cleanCustomerNo = cleanCustomerNo.substring(4);
    }

    console.log("FIXED CUSTOMER:", cleanCustomerNo);

    // 🔍 AMBIL DATA DARI FIRESTORE
    const docRef = db.collection("transactions").doc(cleanCustomerNo);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.json({
        responseCode: "4042400",
        responseMessage: "Bill Not Found"
      });
    }

    const data = doc.data();
    const virtualAccountNo = req.body.virtualAccountNo.trim();
    const partnerServiceId = req.body.partnerServiceId.trim();

    // ❌ hanya boleh UNPAID
    if (data.status !== "UNPAID") {
      return res.json({
        responseCode: "4042400",
        responseMessage: "Bill Not Found"
      });
    }

    // 🔥 SIMPAN inquiryRequestId (penting untuk payment)
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

        // 🔥 WAJIB biar tidak RC81
        expiredDateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),

        // 🔥 WAJIB di beberapa SIT
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
