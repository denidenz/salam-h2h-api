const express = require('express');
const app = express();

app.use(express.json());

const inquiry = require('./h2h/inquiry');
const payment = require('./h2h/payment');
const createTransaction = require('./h2h/createTransaction');

app.post('/create-transaction', createTransaction);
app.post('/inquiry', inquiry);
app.post('/payment', payment);

app.get('/', (req, res) => {
  res.send('H2H RUNNING 🚀');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
