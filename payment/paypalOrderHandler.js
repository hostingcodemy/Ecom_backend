
// =====================================on test==========================================

import paypal from '@paypal/checkout-server-sdk';
import { client } from './paypalClient.js';

export const createdOrder=async (payableAmount) => {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'INR', // check if support INR
          value: payableAmount  // payble amount
        }
      }]
    });
  
    try {
      const order = await client.execute(request);
      return({ id: order.result.id });
    } catch (err) {
      console.error(err);
      return('Error creating order');
    }
  };

  // createdOrder(10);

export const captureOrder=async (req, res) => {
    const orderId = req.body.orderID;
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
  
    try {
      const capture = await client.execute(request);
      res.json({ capture });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error capturing order');
    }
  }