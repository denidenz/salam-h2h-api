const { isTokenValid } = require("../tokenStore");
const { generateSignature } = require("../helper");

module.exports = async (req, res) => {
  try {
    const signature = req.headers["x-signature"];
    const timestamp = req.headers["x-timestamp"];
    const endpoint = req.headers["endpoint-url"];
    const auth = req.headers["authorization"];

    const token = auth?.split(" ")[1];

    if (!isTokenValid(token)) {
      return res.json({
        responseCode: "4012501",
        responseMessage: "Token Invalid"
      });
    }

    const localSignature = generateSignature(
      "POST",
      endpoint,
      req.body,
      token,
      timestamp,
      process.env.CLIENT_SECRET
    );

    console.log("LOCAL SIGN:", localSignature);
    console.log("BSI SIGN:", signature);

    if (localSignature !== signature) {
      return res.json({
        responseCode: "4012500",
        responseMessage: "Verifying Signature Failed"
      });
    }

    return res.json({
      responseCode: "2002500",
      responseMessage: "Successful",
      virtualAccountData: {
        partnerServiceId: req.body.partnerServiceId,
        customerNo: req.body.customerNo,
        virtualAccountNo: req.body.virtualAccountNo,
        virtualAccountName: "TEST CUSTOMER",
        paymentRequestId: req.headers["x-external-id"],
        paidAmount: req.body.paidAmount,
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
