
// =====================================on test==========================================

import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_PUBLIC_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
  });

  app.post('/payment/create-order', async (req, res) => {
    try {
      const options = {
        amount: req.body.amount * 100,  // Amount should be in paise (smallest unit of INR)
        currency: 'INR',
        receipt: 'receipt#1',
        payment_capture: 1
      };
  
      razorpay.orders.create(options, (err, order) => {
        if (err) {
          return res.status(500).json({ error: err });
        }
        res.json(order);
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Route to verify the payment
  app.post('/payment/verify-payment', (req, res) => {
    const { payment_id, order_id, signature } = req.body;
  
    const crypto = require('crypto');
    const body = `${order_id}|${payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)  // Use your Razorpay secret key here
      .update(body)
      .digest('hex');
  
    if (generated_signature === signature) {
      // Payment is verified
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Payment verification failed' });
    }
  });