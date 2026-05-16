const Razorpay = require('razorpay');
const crypto = require('crypto');

const getRazorpayInstance = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order for subscription payment
const createSubscriptionOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  const rzp = getRazorpayInstance();
  const order = await rzp.orders.create({
    amount: Math.round(amount * 100), // paise mein
    currency,
    receipt: receipt || `sub_${Date.now()}`,
    notes,
  });
  return order;
};

// Create payment link for invoice
const createInvoicePaymentLink = async ({ amount, currency = 'INR', description, customerName, customerEmail, customerPhone, invoiceId, callbackUrl }) => {
  const rzp = getRazorpayInstance();
  const link = await rzp.paymentLink.create({
    amount: Math.round(amount * 100),
    currency,
    description,
    customer: {
      name: customerName || '',
      email: customerEmail || '',
      contact: customerPhone || '',
    },
    notify: { sms: !!customerPhone, email: !!customerEmail },
    reminder_enable: true,
    notes: { invoice_id: invoiceId },
    callback_url: callbackUrl || process.env.FRONTEND_URL,
    callback_method: 'get',
  });
  return link;
};

// Verify subscription payment signature
const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expected === signature;
};

// Fetch payment details from Razorpay
const fetchPayment = async (paymentId) => {
  const rzp = getRazorpayInstance();
  return await rzp.payments.fetch(paymentId);
};

// Create refund for a payment
const createRefund = async (paymentId, amount, notes = {}) => {
  const rzp = getRazorpayInstance();
  return await rzp.payments.refund(paymentId, {
    amount: Math.round(amount * 100), // paise mein
    notes,
  });
};

module.exports = { createSubscriptionOrder, createInvoicePaymentLink, verifyPaymentSignature, fetchPayment, createRefund };
