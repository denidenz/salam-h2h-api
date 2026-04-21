const db = require("./firebase");
const { verifySignature } = require("./helper");

// helper bersihin input (ANTI BUG BSI)
function clean(value) {
  return (value || "").toString().trim();
}

function formatDate(date) {
  return new Date(date).toISOString().replace("Z", "+07:00");
}

function getExpiredTime() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  return formatDate(date);
}

module.exports = async (req, res) => {
  try {
    console.log("===== INQUIRY HIT =====");

    // 🔐 VALIDASI SIGNATURE (WAJIB PALING ATAS)
    const isValid = verifySignature(req);

    if (!isValid) {
      return res.status(401).json({
        responseCode: "4012400",
        responseMessage: "Unauthorized Access",
      });
    }

    console.log("REQ BODY:", req.body);

    // 🔥 CLEAN INPUT
    const virtualAccountNo = clean(req.body.virtualAccountNo);
    const partnerServiceId = clean(req.body.partnerServiceId);
    const inquiryRequestId = clean(req.body.inquiryRequestId);

    console.log("VA CLEAN:", virtualAccountNo);

    // ❌ VALIDASI FIELD
    if (!virtualAccountNo || !partnerServiceId || !inquiryRequestId) {
      return res.status(400).json({
        responseCode: "4002402",
        responseMessage: "Field is not exists",
      });
    }

    // ❌ VALIDASI PARTNER
    if (partnerServiceId !== "1754") {
      return res.status(404).json({
        responseCode: "4042411",
        responseMessage: "Invalid data",
      });
    }

    // ❌ VALIDASI FORMAT VA
    if (!/^\d+$/.test(virtualAccountNo) || virtualAccountNo.length < 8) {
      return res.status(404).json({
        responseCode: "4042419",
        responseMessage: "Invalid Bill number format",
      });
    }

    // 🔧 NORMALISASI VA → ambil customerNo
    let cleanCustomerNo = virtualAccountNo;

    while (cleanCustomerNo.startsWith("1754")) {
      cleanCustomerNo = cleanCustomerNo.substring(4);
    }

    cleanCustomerNo = cleanCustomerNo.trim();

    console.log("FINAL CUSTOMER:", cleanCustomerNo);

    // 🔍 AMBIL DATA FIRESTORE
    const docRef = db.collection("transactions").doc(cleanCustomerNo);
    const doc = await docRef.get();

    // ❌ BILL NOT FOUND
    if (!doc.exists) {
      return res.status(404).json({
        responseCode: "4042412",
        responseMessage: "Bill not found",
      });
    }

    const data = doc.data();

    // ❌ SUDAH DIBAYAR
    if (data.status === "PAID") {
      return res.status(404).json({
        responseCode: "4042414",
        responseMessage: "Bill already paid",
      });
    }

    // ❌ EXPIRED
    if (data.expiredAt && new Date() > new Date(data.expiredAt)) {
      return res.status(404).json({
        responseCode: "4042420",
        responseMessage: "Bill Expired",
      });
    }

    // ❌ INVALID DATA
    if (data.status !== "UNPAID") {
      return res.status(404).json({
        responseCode: "4042411",
        responseMessage: "Invalid data",
      });
    }

    // ✅ SIMPAN inquiry ID
    await docRef.update({
      lastInquiryId: inquiryRequestId,
    });

    const amount = Number(data.amount || 0);

    // ✅ SUCCESS
    return res.status(200).json({
      responseCode: "2002400",
      responseMessage: "Successful",
      virtualAccountData: {
        partnerServiceId,
        customerNo: cleanCustomerNo,
        virtualAccountNo,
        virtualAccountName: (data.name || "CUSTOMER").toUpperCase(),
        inquiryRequestId,

        totalAmount: {
          value: amount.toFixed(2),
          currency: "IDR",
        },

        expiredDateTime: data.expiredAt
          ? formatDate(data.expiredAt)
          : getExpiredTime(),

        billDetails: [
          {
            billCode: "01",
            billNo: inquiryRequestId,
            billName: "Pembayaran",
            billAmount: {
              value: amount.toFixed(2),
              currency: "IDR",
            },
          },
        ],

        additionalInfo: {},
      },
    });

  } catch (error) {
    console.error("INQUIRY ERROR:", error);

    return res.status(500).json({
      responseCode: "5002400",
      responseMessage: "General Error",
    });
  }
};
