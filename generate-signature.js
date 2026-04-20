const crypto = require("crypto");
const fs = require("fs");

// 🔑 PRIVATE KEY (punya kamu, BUKAN dari BSI)
const privateKey = fs.readFileSync("./private_key.pem", "utf8");

// 📌 DATA
const clientKey = "SALAM212411";
const timestamp = "2026-04-20T11:15:00+07:00";

const data = `${clientKey}${timestamp}`;

// 🔐 SIGN
const signer = crypto.createSign("RSA-SHA256");
signer.update(data);
signer.end();

const signature = signer.sign(privateKey, "base64");

console.log("SIGNATURE:");
console.log(signature);
