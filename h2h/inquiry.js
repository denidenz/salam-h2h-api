const { isTokenValid } = require("../tokenStore");

module.exports = async (req, res) => {
  try {
    const auth = req.headers["authorization"];
    const token = auth?.split(" ")[1];

    console.log("INQUIRY TOKEN:", token);

    if (!isTokenValid(token)) {
      return res.json({
        responseCode: "4012401",
        responseMessage: "Token Invalid"
      });
    }

    const body = req.body;

    console.log("INQUIRY BODY:", body);

    // 🔥 RESPONSE DINAMIS (SIT)
    return res.json({
      responseCode: "2002400",
      responseMessage: "Successful",
      virtualAccountData: {
        partnerServiceId: body.partnerServiceId,
        customerNo: body.customerNo,
        virtualAccountNo: body.virtualAccountNo,
        virtualAccountName: "TEST CUSTOMER",
        inquiryRequestId: req.headers["x-external-id"],
        totalAmount: {
          value: "20000.00",
          currency: "IDR"
        },
        additionalInfo: {}
      }
    });

  } catch (err) {
    console.error("INQUIRY ERROR:", err);

    return res.json({
      responseCode: "5002400",
      responseMessage: "General Error"
    });
  }
};
