const db = require('./firebase');

function getExpiredTime() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  return date.toISOString().replace('Z', '+07:00');
}

module.exports = async (req, res) => {
  try {
    console.log("===== INQUIRY HIT =====");
    console.log("REQ BODY:", req.body);

    const {
      virtualAccountNo,
      partnerServiceId,
      inquiryRequestId
    } = req.body;

    // ❌ VALIDASI FIELD
    if (!virtualAccountNo || !partnerServiceId || !inquiryRequestId) {
      return res.status(400).json({
        responseCode: "4002402",
        responseMessage: "Field is not exists"
      });
    }

    // ❌ FORMAT VA (harus angka)
    if (!/^\d+$/.test(virtualAccountNo)) {
      return res.status(400).json({
        responseCode: "4042419",
        responseMessage: "Invalid Bill number format"
      });
    }

    // 🔥 NORMALISASI VA
    let cleanCustomerNo = virtualAccountNo;
    while (cleanCustomerNo.startsWith("1754")) {
      cleanCustomerNo = cleanCustomerNo.substring(4);
    }

    const docRef = db.collection("transactions").doc(cleanCustomerNo);
    const doc = await docRef.get();

    // ❌ NOT FOUND
    if (!doc.exists) {
      return res.status(404).json({
        responseCode: "4042412",
        responseMessage: "Bill not found"
      });
    }

    const data = doc.data();

    // ❌ SUDAH DIBAYAR
    if (data.status === "PAID") {
      return res.status(404).json({
        responseCode: "4042414",
        responseMessage: "Bill already paid"
      });
    }

    // ❌ EXPIRED (optional kalau mau pakai expiredAt)
    if (data.expiredAt && new Date() > new Date(data.expiredAt)) {
      return res.status(404).json({
        responseCode: "4042420",
        responseMessage: "Bill Expired"
      });
    }

    // ❌ INVALID DATA
    if (data.status !== "UNPAID") {
      return res.status(404).json({
        responseCode: "4042411",
        responseMessage: "Invalid data"
      });
    }

    // ✅ SIMPAN inquiry ID
    await docRef.update({
      lastInquiryId: inquiryRequestId
    });

    // ✅ SUCCESS
    return res.status(200).json({
      responseCode: "2002400",
      responseMessage: "Success",
      virtualAccountData: {
        partnerServiceId,
        customerNo: cleanCustomerNo,
        virtualAccountNo,
        virtualAccountName: (data.name || "CUSTOMER").toUpperCase(),
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

    return res.status(500).json({
      responseCode: "5002400",
      responseMessage: "General Error"
    });
  }
};
