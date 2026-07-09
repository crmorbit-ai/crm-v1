import React, { useState, useEffect } from 'react';
import couponService from '../services/couponService';
import { Gift, Check, X, Zap } from 'lucide-react';

const ApplyCoupon = () => {
  const [couponCode, setCouponCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLicenseInfo();
  }, []);

  const loadLicenseInfo = async () => {
    try {
      const response = await couponService.getMyLicense();
      console.log('💳 ApplyCoupon - License response:', response);
      // Handle both response.data.X or response.X
      const data = response?.data || response;
      console.log('💳 License data:', data);
      setLicenseInfo(data);
    } catch (err) {
      console.error('License check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    try {
      setApplying(true);
      setError('');
      setSuccess('');

      const response = await couponService.applyCoupon(couponCode.toUpperCase());
      setSuccess('🎉 Lifetime license activated! Your account now has unlimited access with no expiry date.');
      setCouponCode('');

      // Reload license info
      setTimeout(() => {
        loadLicenseInfo();
        // Reload page to update subscription status
        window.location.reload();
      }, 2000);
    } catch (err) {
      // ✅ Debug: Log complete error
      console.error('🔍 Apply coupon error - Full object:', err);
      console.error('🔍 Response:', err.response);
      console.error('🔍 Response data:', err.response?.data);
      console.error('🔍 Response message:', err.response?.data?.message);

      // ✅ Show specific backend error message or helpful fallback
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          'Unable to apply coupon. Please check the code and try again.';
      setError(errorMessage);
      console.error('📢 Final error shown to user:', errorMessage);

      // ✅ Auto-dismiss error after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading...</div>;
  }

  // If already has lifetime license
  if (licenseInfo?.hasLifetimeLicense) {
    const activatedDate = new Date(licenseInfo.license.activatedAt);
    const formattedDate = activatedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }); // DD/MM/YYYY format

    return (
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        borderRadius: '16px',
        padding: '32px',
        color: 'white',
        marginBottom: '30px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', fontSize: '200px', opacity: 0.08 }}>
          <Gift />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.25)', padding: '14px', borderRadius: '14px' }}>
              <Gift size={36} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px' }}>Premium Access Activated</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '15px', opacity: 0.95 }}>You have unlimited access to all features with no expiry date</p>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '14px',
            padding: '24px',
            marginTop: '20px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', opacity: 0.85, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Coupon Code</div>
                <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '1px' }}>
                  {licenseInfo.license.couponCode}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', opacity: 0.85, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Activated On</div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>
                  {formattedDate}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', opacity: 0.85, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Status</div>
                <div style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={22} /> UNLIMITED
                </div>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '20px',
            fontSize: '13px',
            opacity: 0.95,
            lineHeight: '1.8',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {['No expiry date', 'Unlimited users', 'Unlimited storage', 'All features', 'Enterprise access'].map(item => (
              <span key={item} style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                ✓ {item}
              </span>
            ))}
          </div>

          <div style={{
            marginTop: '20px',
            padding: '18px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            fontSize: '13px',
            lineHeight: '1.8',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} /> Your Benefits:
            </div>
            <div style={{ paddingLeft: '26px', fontSize: '12px', opacity: 0.95 }}>
              • Full access to all Enterprise features<br />
              • No plan limits - add unlimited users, leads, contacts, deals<br />
              • Priority support from our team<br />
              • No recurring charges - yours forever!<br />
              • All future updates included
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Apply coupon form
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      padding: '32px',
      marginBottom: '30px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '10px', color: '#0284c7' }}>
          <Gift size={24} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Have a Premium Access Coupon?</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Unlock unlimited features with no expiry date</p>
        </div>
      </div>

      {success && (
        <div style={{
          padding: '14px 16px',
          background: '#dcfce7',
          color: '#166534',
          borderRadius: '10px',
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Check size={18} />
          {success}
        </div>
      )}

      {error && (
        <div style={{
          padding: '14px 16px',
          background: '#fee2e2',
          color: '#991b1b',
          borderRadius: '10px',
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <X size={18} />
            {error}
          </div>
          <button
            onClick={() => setError('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              lineHeight: 1
            }}
            title="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleApply} style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="Enter coupon code (e.g., LIC-XXXXX)"
          disabled={applying}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '2px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#6366f1'}
          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
        />
        <button
          type="submit"
          disabled={applying || !couponCode.trim()}
          style={{
            padding: '12px 32px',
            background: applying || !couponCode.trim() ? '#cbd5e1' : '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: applying || !couponCode.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {applying ? 'Applying...' : 'Apply Coupon'}
        </button>
      </form>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#f8fafc',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#64748b',
        lineHeight: '1.6'
      }}>
        <strong style={{ color: '#475569' }}>What you get:</strong><br />
        • Lifetime unlimited access (no expiry date)<br />
        • Unlimited users and storage<br />
        • All premium features included<br />
        • No recurring charges
      </div>
    </div>
  );
};

export default ApplyCoupon;
