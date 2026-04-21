const express = require('express');
const app = express();

// ✅ HANYA INI (JANGAN DUPLIKAT)
app.use(
  require("body-parser").json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
// 🔥 ROUTES
const auth = require('./h2h/auth');
const inquiry = require('./h2h/inquiry');
const payment = require('./h2h/payment');
const createTransaction = require('./h2h/createTransaction');

app.post('/create-transaction', createTransaction);
app.post('/auth', auth);
app.post('/inquiry', inquiry);
app.post('/payment', payment);

app.get('/', (req, res) => {
  res.send('H2H RUNNING 🚀');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
