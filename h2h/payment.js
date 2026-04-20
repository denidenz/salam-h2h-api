const { isTokenValid } = require("../tokenStore");

module.exports = async (req, res) => {
  try {
    const auth = req.headers["authorization"];
    const token = auth?.split(" ")[1];

    console.log("PAYMENT TOKEN:", token);

    if (!isTokenValid(token)) {
      return res.json({
        responseCode: "4012501",
        responseMessage: "Token Invalid"
      });
    }

    const body = req.body;

    console.log("PAYMENT BODY:", body);

    const paidAmount = body.paidAmount?.value || "0";

    // 🔥 VALIDASI NOMINAL (contoh)
    if (paidAmount !== "20000.00") {
      return res.json({
        responseCode: "4042513",
        responseMessage: "Payment Amount not valid"
      });
    }

    return res.json({
      responseCode: "2002500",
      responseMessage: "Successful",
      virtualAccountData: {
        partnerServiceId: body.partnerServiceId,
        customerNo: body.customerNo,
        virtualAccountNo: body.virtualAccountNo,
        virtualAccountName: "TEST CUSTOMER",
        paymentRequestId: req.headers["x-external-id"],
        paidAmount: {
          value: paidAmount,
          currency: "IDR"
        },
        additionalInfo: {},
        billDetails: []
      }
    });

  } catch (err) {
    console.error("PAYMENT ERROR:", err);

    return res.json({
      responseCode: "5002500",
      responseMessage: "General Error"
    });
  }
};
