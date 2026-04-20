const express = require("express");
const app = express();

app.use(express.json());

const auth = require("./routes/auth");
const inquiry = require("./routes/inquiry");
const payment = require("./routes/payment");

app.post("/auth.php", auth);
app.post("/inquiry.php", inquiry);
app.post("/payment.php", payment);

app.get("/", (req, res) => {
  res.send("H2H API RUNNING 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("RUNNING ON PORT " + PORT));
