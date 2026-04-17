// ================= IMPORT =================
const functions = require("firebase-functions");

// 🔹 H2H MODULES
const inquiry = require("./h2h/inquiry");
const payment = require("./h2h/payment");

// ================= EXPORT ENDPOINT =================

// ✅ INQUIRY (FlutterFlow → Firebase → BSI)
exports.inquiry = functions.https.onRequest(inquiry.inquiry);

// ✅ PAYMENT CALLBACK (BSI → Firebase)
exports.paymentNotify = functions.https.onRequest(payment.paymentNotify);