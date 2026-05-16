import api from '../services/api';

// Load Razorpay SDK dynamically — call this in useEffect of the payment component
export const loadRazorpaySDK = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// Open Razorpay checkout for subscription plan upgrade
export const openSubscriptionCheckout = async ({ planId, billingCycle, userEmail, userName, userPhone, onSuccess, onFailure }) => {
  try {
    // 1. Load SDK if not already loaded
    const loaded = await loadRazorpaySDK();
    if (!loaded || !window.Razorpay) {
      onFailure && onFailure('Payment gateway not available. Try again later.');
      return;
    }

    // 2. Create order on backend
    const orderRes = await api.post('/subscriptions/create-order', { planId, billingCycle });
    const { orderId, amount, currency, keyId, planName } = orderRes.data;

    // 3. Open Razorpay checkout modal
    const options = {
      key: keyId,
      amount,
      currency,
      name: 'Unified CRM',
      description: `${planName} Plan — ${billingCycle === 'yearly' ? 'Annual' : 'Monthly'} Billing`,
      image: `${window.location.origin}/logo.png`,
      order_id: orderId,
      prefill: { name: userName || '', email: userEmail || '', contact: userPhone || '' },
      theme: { color: '#1EB980', backdrop_color: 'rgba(10,20,40,0.75)' },
      modal: { backdropclose: false, escape: true, animation: true, ondismiss: () => { onFailure && onFailure('Payment cancelled'); } },
      notes: { plan: planName, billing_cycle: billingCycle },
      handler: async (response) => {
        try {
          // 4. Verify payment signature on backend
          await api.post('/subscriptions/verify-payment', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            planId,
            billingCycle,
          });
          onSuccess && onSuccess();
        } catch (err) {
          onFailure && onFailure(err?.response?.data?.message || err?.message || 'Payment verification failed');
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (resp) => { onFailure && onFailure(resp.error?.description || 'Payment failed'); });
    rzp.open();
  } catch (err) {
    onFailure && onFailure(err?.response?.data?.message || err?.message || 'Failed to initiate payment');
  }
};

// Generate payment link for invoice
export const generateInvoicePaymentLink = async (invoiceId) => {
  const res = await api.post(`/invoices/${invoiceId}/payment-link`);
  return res.data;
};

// Process refund for a payment
export const refundPayment = async (paymentId, amount, notes = {}) => {
  const res = await api.post('/subscriptions/refund', { paymentId, amount, notes });
  return res.data;
};
