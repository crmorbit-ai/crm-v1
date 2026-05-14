// import api from '../services/api';

// // Open Razorpay checkout for subscription plan upgrade
// export const openSubscriptionCheckout = async ({ planId, billingCycle, userEmail, userName, userPhone, onSuccess, onFailure }) => {
//   try {
//     // 1. Create order on backend
//     const orderRes = await api.post('/subscriptions/create-order', { planId, billingCycle });
//     const { orderId, amount, currency, keyId, planName } = orderRes.data;

//     // 2. Open Razorpay checkout
//     const options = {
//       key: keyId,
//       amount,
//       currency,
//       name: 'Unified CRM',
//       description: `${planName} Plan — ${billingCycle === 'yearly' ? 'Annual' : 'Monthly'} Billing`,
//       image: `${window.location.origin}/logo.png`,
//       order_id: orderId,
//       prefill: { name: userName || '', email: userEmail || '', contact: userPhone || '' },
//       theme: { color: '#1EB980', backdrop_color: 'rgba(10,20,40,0.75)' },
//       modal: { backdropclose: false, escape: true, animation: true },
//       notes: { plan: planName, billing_cycle: billingCycle },
//       handler: async (response) => {
//         try {
//           // 3. Verify payment on backend
//           await api.post('/subscriptions/verify-payment', {
//             razorpay_order_id: response.razorpay_order_id,
//             razorpay_payment_id: response.razorpay_payment_id,
//             razorpay_signature: response.razorpay_signature,
//             planId,
//             billingCycle,
//           });
//           onSuccess && onSuccess();
//         } catch (err) {
//           onFailure && onFailure(err?.message || 'Payment verification failed');
//         }
//       },
//       modal: {
//         ondismiss: () => { onFailure && onFailure('Payment cancelled'); }
//       },
//     };

//     const rzp = new window.Razorpay(options);
//     rzp.on('payment.failed', (resp) => { onFailure && onFailure(resp.error?.description || 'Payment failed'); });
//     rzp.open();
//   } catch (err) {
//     onFailure && onFailure(err?.message || 'Failed to initiate payment');
//   }
// };

// // Generate payment link for invoice
// export const generateInvoicePaymentLink = async (invoiceId) => {
//   const res = await api.post(`/invoices/${invoiceId}/payment-link`);
//   return res.data;
// };
