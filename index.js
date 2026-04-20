const express = require('express');
const app = express();

app.use(express.json());

const createTransaction = require('./h2h/createTransaction');

app.post('/create-transaction', createTransaction);

const payment = require('./h2h/payment');

app.post('/payment', payment);

const inquiry = require('./h2h/inquiry');

app.post('/inquiry', inquiry);

app.get('/', (req, res) => {
  res.send('H2H RUNNING 🚀');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
