const crypto = require("crypto");

function generateSignature(method, endpoint, body, token, timestamp, secret) {
  const bodyString = JSON.stringify(body);

  const hashedBody = crypto
    .createHash("sha256")
    .update(bodyString)
    .digest("hex");

  const stringToSign =
    `${method}:${endpoint}:${token}:${hashedBody}:${timestamp}`;

  return crypto
    .createHmac("sha512", secret)
    .update(stringToSign)
    .digest("base64");
}

module.exports = async (req, res) => {
  try {
    const headers = req.headers;

    const signature = headers["x-signature"];
    const partnerId = headers["x-partner-id"];
    const externalId = headers["x-external-id"];
    const timestamp = headers["x-timestamp"];
    const endpointUrl = headers["endpoint-url"];
    const auth = headers["authorization"];

    const token = auth?.split(" ")[1];

    const localSignature = generateSignature(
      "POST",
      endpointUrl,
      req.body,
      token,
      timestamp,
      process.env.CLIENT_SECRET
    );

    // if (localSignature !== signature) {
      // return res.json({
        // responseCode: "4012400",
        // responseMessage: "Verifying Signature Failed"
      // });
    // }

    // ✅ TOKEN VALID (sementara)
    if (token !== "TEST_TOKEN") {
      return res.json({
        responseCode: "4012401",
        responseMessage: "Token Invalid"
      });
    }

    const customerNo = req.body.customerNo;

    // ✅ RESPONSE PERSIS PHP
    return res.json({
  responseCode: "2002400",
  responseMessage: "Successful",
  virtualAccountData: {
    partnerServiceId: "1754",
    customerNo: "00002",
    virtualAccountNo: "17540002",
    virtualAccountName: "TEST CUSTOMER",
    inquiryRequestId: req.headers["x-external-id"],
    totalAmount: {
      value: "10000.00",
      currency: "IDR"
    },
    additionalInfo: {}
  }
});

  } catch (err) {
    console.error(err);

    return res.json({
      responseCode: "5002400",
      responseMessage: "General Error"
    });
  }
};
