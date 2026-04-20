const express = require('express')
const app = express()

app.use(express.json())

// ✅ FIX PATH
const auth = require('./h2h/auth')
const inquiry = require('./h2h/inquiry')
const payment = require('./h2h/payment')

// ROUTES
app.post('/auth.php', auth)
app.post('/inquiry.php', inquiry)
app.post('/payment.php', payment)

app.listen(3000, () => {
  console.log('H2H RUNNING 🚀')
})
