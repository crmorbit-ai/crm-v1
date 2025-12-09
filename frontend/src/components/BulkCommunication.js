import React, { useState } from 'react';
import productService from '../services/productService';
import EmailCompose from './EmailCompose';
import WhatsAppCompose from './WhatsAppCompose';
import SMSCompose from './SMSCompose';

const BulkCommunication = ({
  selectedCandidates,
  candidates,
  onSuccess,
  myProducts,
  loadMyProducts
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);

  // Get selected candidates' details
  const getSelectedCandidatesDetails = () => {
    return candidates.filter(c => selectedCandidates.includes(c._id));
  };

  // Check if user has enough credits
  const hasEnoughCredits = (productType, required) => {
    const product = myProducts.find(p => p.product?.type === productType);
    return product && product.remainingCredits >= required;
  };

  // Get product by type
  const getProduct = (productType) => {
    return myProducts.find(p => p.product?.type === productType);
  };

  // Handle bulk email
  const handleBulkEmail = async () => {
    const required = selectedCandidates.length;

    if (!hasEnoughCredits('email', required)) {
      const product = getProduct('email');
      const remaining = product?.remainingCredits || 0;
      alert(`❌ Insufficient credits!\n\nRequired: ${required} emails\nYou have: ${remaining} credits\n\nPlease purchase Email credits from Product page.`);
      return;
    }

    setShowEmailModal(true);
  };

  const handleEmailSuccess = async () => {
    const emailProduct = getProduct('email');

    // Use credits
    await productService.useProductCredits(
      emailProduct.product._id,
      selectedCandidates.length,
      true
    );

    // Refresh products and notify parent
    loadMyProducts();
    onSuccess();
  };

  // Handle bulk WhatsApp
  const handleBulkWhatsApp = async () => {
    const required = selectedCandidates.length;

    if (!hasEnoughCredits('whatsapp', required)) {
      const product = getProduct('whatsapp');
      const remaining = product?.remainingCredits || 0;
      alert(`❌ Insufficient credits!\n\nRequired: ${required} messages\nYou have: ${remaining} credits\n\nPlease purchase WhatsApp credits from Product page.`);
      return;
    }

    setShowWhatsAppModal(true);
  };

  const handleWhatsAppSuccess = async () => {
    const whatsappProduct = getProduct('whatsapp');

    // Use credits
    await productService.useProductCredits(
      whatsappProduct.product._id,
      selectedCandidates.length,
      true
    );

    // Refresh products and notify parent
    loadMyProducts();
    onSuccess();
  };

  // Handle bulk SMS
  const handleBulkSMS = async () => {
    const required = selectedCandidates.length;

    if (!hasEnoughCredits('sms', required)) {
      const product = getProduct('sms');
      const remaining = product?.remainingCredits || 0;
      alert(`❌ Insufficient credits!\n\nRequired: ${required} SMS\nYou have: ${remaining} credits\n\nPlease purchase SMS credits from Product page.`);
      return;
    }

    setShowSMSModal(true);
  };

  const handleSMSSuccess = async () => {
    const smsProduct = getProduct('sms');

    // Use credits
    await productService.useProductCredits(
      smsProduct.product._id,
      selectedCandidates.length,
      true
    );

    // Refresh products and notify parent
    loadMyProducts();
    onSuccess();
  };

  if (selectedCandidates.length === 0) return null;

  const emailProduct = getProduct('email');
  const whatsappProduct = getProduct('whatsapp');
  const smsProduct = getProduct('sms');

  return (
    <>
      {/* Bulk Communication Buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          className="crm-btn crm-btn-sm"
          onClick={handleBulkEmail}
          style={{ background: '#3b82f6', borderColor: '#3b82f6', color: 'white' }}
          title={emailProduct ? `${emailProduct.remainingCredits} credits remaining` : 'Purchase Email credits first'}
        >
          📧 Bulk Email ({selectedCandidates.length})
          {emailProduct && <span style={{ fontSize: '10px', marginLeft: '4px' }}>({emailProduct.remainingCredits})</span>}
        </button>

        <button
          className="crm-btn crm-btn-sm"
          onClick={handleBulkWhatsApp}
          style={{ background: '#25d366', borderColor: '#25d366', color: 'white' }}
          title={whatsappProduct ? `${whatsappProduct.remainingCredits} credits remaining` : 'Purchase WhatsApp credits first'}
        >
          💬 Bulk WhatsApp ({selectedCandidates.length})
          {whatsappProduct && <span style={{ fontSize: '10px', marginLeft: '4px' }}>({whatsappProduct.remainingCredits})</span>}
        </button>

        <button
          className="crm-btn crm-btn-sm"
          onClick={handleBulkSMS}
          style={{ background: '#f59e0b', borderColor: '#f59e0b', color: 'white' }}
          title={smsProduct ? `${smsProduct.remainingCredits} credits remaining` : 'Purchase SMS credits first'}
        >
          📱 Bulk SMS ({selectedCandidates.length})
          {smsProduct && <span style={{ fontSize: '10px', marginLeft: '4px' }}>({smsProduct.remainingCredits})</span>}
        </button>
      </div>

      {/* Email Component */}
      <EmailCompose
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        recipients={getSelectedCandidatesDetails()}
        onSuccess={handleEmailSuccess}
        remainingCredits={emailProduct?.remainingCredits || 0}
      />

      {/* WhatsApp Component */}
      <WhatsAppCompose
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        recipients={getSelectedCandidatesDetails()}
        onSuccess={handleWhatsAppSuccess}
        remainingCredits={whatsappProduct?.remainingCredits || 0}
      />

      {/* SMS Component */}
      <SMSCompose
        isOpen={showSMSModal}
        onClose={() => setShowSMSModal(false)}
        recipients={getSelectedCandidatesDetails()}
        onSuccess={handleSMSSuccess}
        remainingCredits={smsProduct?.remainingCredits || 0}
      />
    </>
  );
};

export default BulkCommunication;
