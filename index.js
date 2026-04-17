const express = require("express");
const inquiry = require("./h2h/inquiry");

const app = express();

app.use(express.json());

// test root
app.get("/", (req, res) => {
  res.send("API H2H RUNNING");
});

// endpoint inquiry
app.post("/inquiry", inquiry);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
