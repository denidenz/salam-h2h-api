const express = require('express');
const app = express();

app.use(express.json());

// 🔥 ROUTES
const auth = require('./h2h/auth');
const inquiry = require('./h2h/inquiry');
const payment = require('./h2h/payment');

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
