const express = require("express");
const inquiry = require("./h2h/inquiry");

const app = express();

app.use(express.json());

// test root
app.get("/", (req, res) => {
  res.send("API H2H RUNNING");
});

///
app.get("/ip", async (req, res) => {
  const axios = require("axios");
  const response = await axios.get("https://api.ipify.org?format=json");
  res.json(response.data);
});

//
app.get('/api/health', (req, res) => {
  res.json({
    status: "ok",
    service: "H2H BSI",
    time: new Date()
  });
});
//
app.get('/inquiry', (req, res) => {
  res.json({
    message: "Inquiry endpoint ready"
  });
});

// endpoint inquiry
app.post("/inquiry", inquiry);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
