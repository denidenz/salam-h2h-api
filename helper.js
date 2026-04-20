const crypto = require("crypto");

function verifySignature(req) {
  try {
    const signature = req.headers["x-signature"];
    const timestamp = req.headers["x-timestamp"];
    const endpoint = req.headers["endpoint-url"];
    const authorization = req.headers["authorization"];

    const accessToken = authorization?.replace("Bearer ", "");

    const bodyString = JSON.stringify(req.body);

    const stringToSign = `${req.method}:${endpoint}:${bodyString}:${accessToken}:${timestamp}`;

    console.log("STRING TO SIGN:", stringToSign);

    const localSignature = crypto
      .createHmac("sha256", process.env.CLIENT_SECRET)
      .update(stringToSign)
      .digest("base64");

    console.log("LOCAL SIGN:", localSignature);
    console.log("BSI SIGN :", signature);

    return localSignature === signature;

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return false;
  }
}
