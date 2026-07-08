import React, { useState, useEffect } from 'react';
import couponService from '../services/couponService';
import { Gift, Crown, Zap } from 'lucide-react';

const LifetimeLicenseBadge = () => {
  const [hasLicense, setHasLicense] = useState(false);
  const [loading, setLoading] = useState(true);
  const [licenseInfo, setLicenseInfo] = useState(null);

  useEffect(() => {
    console.log('🎯 LifetimeLicenseBadge component mounted');
    checkLicense();
  }, []);

  const checkLicense = async () => {
    try {
      const response = await couponService.getMyLicense();
      console.log('🎟️ License Check Response:', response);

      // Handle both response structures: response.data.X or response.X
      const hasLifetime = response?.data?.hasLifetimeLicense || response?.hasLifetimeLicense;
      const licenseData = response?.data?.license || response?.license;

      console.log('🔍 Checking license:', { hasLifetime, licenseData });

      if (hasLifetime) {
        console.log('✅ Lifetime License Found!');
        setHasLicense(true);
        setLicenseInfo(licenseData);
      } else {
        console.log('❌ No Lifetime License');
      }
    } catch (err) {
      console.error('License check error:', err);
    } finally {
      setLoading(false);
    }
  };

  console.log('🎯 Badge Render Check - Loading:', loading, '| Has License:', hasLicense);

  // Show loading indicator
  if (loading) {
    console.log('⏳ Still loading...');
    return (
      <div style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 999,
        background: '#f3f4f6',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '11px',
        color: '#6b7280'
      }}>
        Checking license...
      </div>
    );
  }

  if (!hasLicense) {
    console.log('❌ No license, hiding badge');
    return null;
  }

  console.log('✅ Rendering badge with license:', licenseInfo);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 700,
        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onClick={() => window.location.href = '/subscription'}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
      }}
      title={`Premium Access - Activated: ${new Date(licenseInfo.activatedAt).toLocaleDateString()}`}
    >
      <Crown size={16} style={{ animation: 'pulse 2s infinite' }} />
      <span>PREMIUM</span>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default LifetimeLicenseBadge;
