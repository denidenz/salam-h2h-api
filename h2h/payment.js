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

    if (localSignature !== signature) {
      return res.json({
        responseCode: "4012500",
        responseMessage: "Verifying Signature Failed"
      });
    }

    const paidAmount = req.body.paidAmount?.value || "10000.00";

    return res.json({
      responseCode: "2002500",
      responseMessage: "Successful",
      virtualAccountData: {
        partnerServiceId: partnerId?.padStart(8, " "),
        customerNo: req.body.customerNo,
        virtualAccountNo: partnerId?.padStart(8, " ") + req.body.customerNo,
        virtualAccountName: "TEST CUSTOMER",
        paymentRequestId: externalId,
        paidAmount: {
          value: paidAmount,
          currency: "IDR"
        },
        additionalInfo: [
          { label: "FAKULTAS", value: "TEST" },
          { label: "KAMPUS", value: "TEST" }
        ],
        billDetails: [
          { label: "FAKULTAS", value: "TEST" },
          { label: "KAMPUS", value: "TEST" }
        ]
      }
    });

  } catch (err) {
    return res.json({
      responseCode: "5002500",
      responseMessage: "General Error"
    });
  }
};
