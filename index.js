const express = require("express");
const auth = require("./h2h/auth");
const inquiry = require("./h2h/inquiry");
const payment = require("./h2h/payment");

const app = express();
app.use(express.json());

// debug log
app.use((req, res, next) => {
  console.log("HIT:", req.method, req.url);
  next();
});

app.post("/auth.php", auth);
app.post("/inquiry.php", inquiry);
app.post("/payment.php", payment);

app.listen(process.env.PORT || 3000, () => {
  console.log("H2H RUNNING");
});
