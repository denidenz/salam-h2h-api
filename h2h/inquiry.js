const { isTokenValid } = require("../tokenStore");
const { generateSignature, clean } = require("../helper");

module.exports = async (req, res) => {
  try {
    const signature = req.headers["x-signature"];
    const timestamp = req.headers["x-timestamp"];
    const endpoint = req.headers["endpoint-url"];
    const auth = req.headers["authorization"];

    const token = auth?.split(" ")[1];

    if (!isTokenValid(token)) {
      return res.json({
        responseCode: "4012401",
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
        responseCode: "4012400",
        responseMessage: "Verifying Signature Failed"
      });
    }

    // 🔥 CLEAN DATA (ANTI SPASI)
    const partnerId = clean(req.body.partnerServiceId);
    const customerNo = clean(req.body.customerNo);

    const va = `${partnerId}${customerNo}`;

    return res.json({
      responseCode: "2002400",
      responseMessage: "Successful",
      virtualAccountData: {
        partnerServiceId: partnerId,
        customerNo: customerNo,
        virtualAccountNo: va,
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
