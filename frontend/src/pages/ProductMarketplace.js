import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import productService from '../services/productService';
import api from '../services/api';
import '../styles/crm.css';

const ProductMarketplace = () => {
  const [products, setProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('marketplace'); // 'marketplace', 'my-products', 'usage'
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(0);

  // SMTP Configuration states
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    fromEmail: ''
  });
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [userSettings, setUserSettings] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, myProductsData, statsData, settingsData] = await Promise.all([
        productService.getAllProducts(),
        productService.getMyProducts(),
        productService.getUsageStats(),
        api.get('/user-settings').catch(() => null)
      ]);

      setProducts(productsData.data || []);
      setMyProducts(myProductsData.data || []);
      setStats(statsData.data);
      setUserSettings(settingsData); // api.get already returns response.data via interceptor
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load products data');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = (product) => {
    setSelectedProduct(product);
    setSelectedPackage(0);
    setShowPurchaseModal(true);
  };

  const handlePurchase = async () => {
    try {
      await productService.purchaseProduct(selectedProduct._id, selectedPackage);
      alert(`✅ Successfully purchased ${selectedProduct.packages[selectedPackage].credits} ${selectedProduct.pricing.unit}(s)!`);
      setShowPurchaseModal(false);
      loadData();
    } catch (error) {
      console.error('Error purchasing:', error);
      alert(error.response?.data?.message || 'Failed to purchase product');
    }
  };

  const handleConfigureSmtp = () => {
    // Pre-fill existing SMTP config if available
    if (userSettings?.emailConfig?.premiumSmtp?.isVerified) {
      setSmtpConfig({
        smtpHost: userSettings.emailConfig.premiumSmtp.smtpHost || '',
        smtpPort: userSettings.emailConfig.premiumSmtp.smtpPort || '587',
        smtpUser: userSettings.emailConfig.premiumSmtp.smtpUser || '',
        smtpPassword: '', // Never pre-fill password
        fromEmail: userSettings.emailConfig.premiumSmtp.fromEmail || ''
      });
    } else {
      setSmtpConfig({
        smtpHost: '',
        smtpPort: '587',
        smtpUser: '',
        smtpPassword: '',
        fromEmail: ''
      });
    }
    setShowSmtpModal(true);
  };

  const handleSmtpSubmit = async (e) => {
    e.preventDefault();

    if (!smtpConfig.smtpHost || !smtpConfig.smtpUser || !smtpConfig.smtpPassword || !smtpConfig.fromEmail) {
      alert('Please fill all SMTP fields');
      return;
    }

    try {
      setSmtpLoading(true);
      const response = await api.post('/user-settings/premium-smtp', smtpConfig);

      alert('✅ ' + response.message);
      setShowSmtpModal(false);
      loadData(); // Reload to get updated settings
    } catch (error) {
      console.error('SMTP configuration error:', error);
      alert(error.message || 'Failed to configure SMTP');
    } finally {
      setSmtpLoading(false);
    }
  };

  const hasEmailProduct = () => {
    return myProducts.some(up =>
      up.product.type === 'email' &&
      up.isActive &&
      up.remainingCredits > 0
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getProductIcon = (type) => {
    const icons = {
      email: '📧',
      whatsapp: '💬',
      sms: '📱',
      call: '📞',
    };
    return icons[type] || '📦';
  };

  const getUsagePercentage = (used, total) => {
    if (!total) return 0;
    return Math.min(100, (used / total) * 100);
  };

  if (loading) {
    return (
      <DashboardLayout title="Product Marketplace">
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '16px', color: '#64748b' }}>Loading products...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Product Marketplace">
      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '0'
      }}>
        {['marketplace', 'my-products', 'usage'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: selectedTab === tab ? '3px solid #4A90E2' : '3px solid transparent',
              color: selectedTab === tab ? '#4A90E2' : '#64748b',
              fontWeight: selectedTab === tab ? '700' : '500',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'capitalize'
            }}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Marketplace Tab */}
      {selectedTab === 'marketplace' && (
        <>
          <div style={{ marginBottom: '24px', padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', color: 'white' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800' }}>
              🛒 Communication Products
            </h2>
            <p style={{ margin: '0', fontSize: '15px', opacity: 0.9 }}>
              Purchase communication credits for bulk operations with DataCenter candidates
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {products.map((product) => (
              <div
                key={product._id}
                className="crm-card"
                style={{
                  border: '2px solid #e5e7eb',
                  transition: 'all 0.3s',
                }}
              >
                <div style={{ padding: '24px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '12px' }}>
                      {getProductIcon(product.type)}
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800', color: '#1e3c72' }}>
                      {product.displayName}
                    </h3>
                    <p style={{ margin: '0', color: '#64748b', fontSize: '14px' }}>
                      {product.description}
                    </p>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                      Price per {product.pricing.unit}
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: '#4A90E2' }}>
                      {formatCurrency(product.pricing.pricePerUnit)}
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e3c72', marginBottom: '12px' }}>
                      📦 Available Packages:
                    </div>
                    {product.packages.map((pkg, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '12px',
                          background: pkg.isPopular ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : '#f8fafc',
                          borderRadius: '8px',
                          marginBottom: '8px',
                          border: pkg.isPopular ? '2px solid #4A90E2' : '1px solid #e5e7eb',
                          position: 'relative'
                        }}
                      >
                        {pkg.isPopular && (
                          <div style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '12px',
                            background: '#4A90E2',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '800'
                          }}>
                            POPULAR
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: '700', color: '#1e3c72', fontSize: '16px' }}>
                              {pkg.credits.toLocaleString()} {product.pricing.unit}s
                            </div>
                            {pkg.discount > 0 && (
                              <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
                                🎉 {pkg.discount}% OFF
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#4A90E2' }}>
                              {formatCurrency(pkg.price)}
                            </div>
                            {pkg.discount > 0 && (
                              <div style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>
                                {formatCurrency(pkg.price / (1 - pkg.discount / 100))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className="crm-btn crm-btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: '700' }}
                    onClick={() => handleBuyNow(product)}
                  >
                    🛒 Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* My Products Tab */}
      {selectedTab === 'my-products' && (
        <>
          <div style={{
            marginBottom: '24px',
            padding: '20px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '12px',
            color: 'white'
          }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800' }}>
              💼 My Products
            </h2>
            <p style={{ margin: '0', fontSize: '15px', opacity: 0.9 }}>
              View your purchased products and remaining credits
            </p>
          </div>

          {myProducts.length === 0 ? (
            <div className="crm-card" style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#1e3c72' }}>
                No Products Purchased
              </h3>
              <p style={{ margin: '0 0 24px 0', color: '#64748b' }}>
                Browse the marketplace and purchase communication products
              </p>
              <button
                className="crm-btn crm-btn-primary"
                onClick={() => setSelectedTab('marketplace')}
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '24px'
            }}>
              {myProducts.map((up) => (
                <div key={up._id} className="crm-card">
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                      <div style={{ fontSize: '48px' }}>
                        {getProductIcon(up.product.type)}
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800', color: '#1e3c72' }}>
                          {up.product.displayName}
                        </h3>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                          {formatCurrency(up.product.pricing.pricePerUnit)} per {up.product.pricing.unit}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      padding: '16px',
                      borderRadius: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Total</div>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: '#4A90E2' }}>
                            {up.totalCredits.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Used</div>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444' }}>
                            {up.usedCredits.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Remaining</div>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>
                            {up.remainingCredits.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                          Usage
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#4A90E2' }}>
                          {getUsagePercentage(up.usedCredits, up.totalCredits).toFixed(1)}%
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        background: '#f1f5f9',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${getUsagePercentage(up.usedCredits, up.totalCredits)}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #4A90E2 0%, #2c5364 100%)',
                          transition: 'all 0.3s'
                        }}></div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e3c72', marginBottom: '8px' }}>
                        📊 Usage Stats:
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div>This Month: <strong>{up.usage.thisMonth.toLocaleString()}</strong></div>
                        <div>Last Month: <strong>{up.usage.lastMonth.toLocaleString()}</strong></div>
                        <div>Total: <strong>{up.usage.total.toLocaleString()}</strong></div>
                        {up.usage.lastUsedAt && (
                          <div>Last Used: <strong>{new Date(up.usage.lastUsedAt).toLocaleDateString()}</strong></div>
                        )}
                      </div>
                    </div>

                    <button
                      className="crm-btn crm-btn-primary"
                      style={{ width: '100%' }}
                      onClick={() => handleBuyNow(up.product)}
                    >
                      💳 Buy More Credits
                    </button>

                    {/* SMTP Configuration for Email Product */}
                    {up.product.type === 'email' && (
                      <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        borderRadius: '12px',
                        border: '2px solid #fcd34d'
                      }}>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>
                            📧 Premium SMTP Configuration
                          </div>
                          <div style={{ fontSize: '12px', color: '#92400e' }}>
                            {userSettings?.emailConfig?.premiumSmtp?.isVerified
                              ? '✅ Configured - Emails will be sent from your email'
                              : 'Configure your own SMTP to send emails from your email address'}
                          </div>
                        </div>

                        {userSettings?.emailConfig?.premiumSmtp?.isVerified && (
                          <div style={{
                            fontSize: '12px',
                            color: '#92400e',
                            marginBottom: '12px',
                            padding: '8px',
                            background: 'rgba(255, 255, 255, 0.5)',
                            borderRadius: '6px'
                          }}>
                            <div><strong>Host:</strong> {userSettings.emailConfig.premiumSmtp.smtpHost}</div>
                            <div><strong>From:</strong> {userSettings.emailConfig.premiumSmtp.fromEmail}</div>
                          </div>
                        )}

                        <button
                          className="crm-btn crm-btn-secondary"
                          style={{ width: '100%', fontSize: '13px' }}
                          onClick={handleConfigureSmtp}
                        >
                          ⚙️ {userSettings?.emailConfig?.premiumSmtp?.isVerified ? 'Update' : 'Configure'} SMTP
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Usage Tab */}
      {selectedTab === 'usage' && stats && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}>
            <div className="crm-card">
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>💰</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#4A90E2', marginBottom: '8px' }}>
                  {formatCurrency(stats.totalSpent)}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Total Spent</div>
              </div>
            </div>
            <div className="crm-card">
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#4A90E2', marginBottom: '8px' }}>
                  {stats.totalCreditsUsed.toLocaleString()}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Total Credits Used</div>
              </div>
            </div>
          </div>

          <div className="crm-card">
            <div className="crm-card-header">
              <h2 className="crm-card-title">Product Usage Details</h2>
            </div>
            <div style={{ padding: '24px' }}>
              {stats.products.map((p, index) => (
                <div
                  key={index}
                  style={{
                    padding: '20px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    border: '2px solid #e5e7eb'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '40px' }}>
                      {getProductIcon(p.product.type)}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#1e3c72' }}>
                        {p.product.displayName}
                      </h4>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        Total Spent: <strong>{formatCurrency(p.totalSpent)}</strong>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Used Credits</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#ef4444' }}>
                        {p.usedCredits.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Remaining</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
                        {p.remainingCredits.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>This Month</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#4A90E2' }}>
                        {p.thisMonth.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Last Month</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#94a3b8' }}>
                        {p.lastMonth.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedProduct && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowPurchaseModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '24px',
              borderBottom: '2px solid #f1f5f9',
              background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)'
            }}>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'white' }}>
                {getProductIcon(selectedProduct.type)} Purchase {selectedProduct.displayName}
              </h3>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '12px', color: '#1e3c72' }}>
                  Select Package:
                </label>
                {selectedProduct.packages.map((pkg, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedPackage(index)}
                    style={{
                      padding: '16px',
                      background: selectedPackage === index ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : '#f8fafc',
                      borderRadius: '12px',
                      marginBottom: '12px',
                      border: selectedPackage === index ? '3px solid #4A90E2' : '2px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      position: 'relative'
                    }}
                  >
                    {pkg.isPopular && (
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '12px',
                        background: '#10b981',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '800'
                      }}>
                        ⭐ POPULAR
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e3c72', marginBottom: '4px' }}>
                          {pkg.credits.toLocaleString()} {selectedProduct.pricing.unit}s
                        </div>
                        {pkg.discount > 0 && (
                          <div style={{ fontSize: '13px', color: '#10b981', fontWeight: '700' }}>
                            Save {pkg.discount}%
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#4A90E2' }}>
                          {formatCurrency(pkg.price)}
                        </div>
                        {pkg.discount > 0 && (
                          <div style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through' }}>
                            {formatCurrency(pkg.price / (1 - pkg.discount / 100))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                padding: '16px',
                background: '#fef3c7',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '2px solid #fcd34d'
              }}>
                <div style={{ fontSize: '13px', color: '#92400e', marginBottom: '8px', fontWeight: '600' }}>
                  ℹ️ Payment Information
                </div>
                <div style={{ fontSize: '12px', color: '#92400e' }}>
                  This is a demo purchase. In production, payment gateway will be integrated.
                </div>
              </div>
            </div>

            <div style={{
              padding: '24px',
              borderTop: '2px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                className="crm-btn crm-btn-secondary"
                onClick={() => setShowPurchaseModal(false)}
              >
                Cancel
              </button>
              <button
                className="crm-btn crm-btn-primary"
                onClick={handlePurchase}
                style={{ minWidth: '150px' }}
              >
                ✅ Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMTP Configuration Modal */}
      {showSmtpModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowSmtpModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '550px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '24px',
              borderBottom: '2px solid #f1f5f9',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'white' }}>
                📧 Configure Premium SMTP
              </h3>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>
                Send emails from your own email address
              </p>
            </div>

            <form onSubmit={handleSmtpSubmit} style={{ padding: '24px' }}>
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                background: '#dbeafe',
                borderRadius: '12px',
                border: '2px solid #3b82f6'
              }}>
                <div style={{ fontSize: '13px', color: '#1e40af', marginBottom: '8px', fontWeight: '600' }}>
                  ℹ️ SMTP Information
                </div>
                <div style={{ fontSize: '12px', color: '#1e40af' }}>
                  Your SMTP credentials will be encrypted and stored securely. We'll verify the connection before saving.
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#1e3c72', fontSize: '14px' }}>
                  SMTP Host *
                </label>
                <input
                  type="text"
                  className="crm-input"
                  placeholder="smtp.gmail.com"
                  value={smtpConfig.smtpHost}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, smtpHost: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#1e3c72', fontSize: '14px' }}>
                  SMTP Port *
                </label>
                <input
                  type="number"
                  className="crm-input"
                  placeholder="587"
                  value={smtpConfig.smtpPort}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, smtpPort: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#1e3c72', fontSize: '14px' }}>
                  SMTP Username *
                </label>
                <input
                  type="text"
                  className="crm-input"
                  placeholder="your-email@gmail.com"
                  value={smtpConfig.smtpUser}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, smtpUser: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#1e3c72', fontSize: '14px' }}>
                  SMTP Password / App Password *
                </label>
                <input
                  type="password"
                  className="crm-input"
                  placeholder="Your SMTP password or app password"
                  value={smtpConfig.smtpPassword}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, smtpPassword: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#1e3c72', fontSize: '14px' }}>
                  From Email Address *
                </label>
                <input
                  type="email"
                  className="crm-input"
                  placeholder="your-email@gmail.com"
                  value={smtpConfig.fromEmail}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })}
                  required
                />
              </div>

              <div style={{
                padding: '12px',
                background: '#fef3c7',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #fcd34d'
              }}>
                <div style={{ fontSize: '12px', color: '#92400e' }}>
                  <strong>💡 Tip:</strong> For Gmail, use App Password instead of your account password.
                  <a
                    href="https://support.google.com/accounts/answer/185833"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#2563eb', marginLeft: '4px' }}
                  >
                    Learn how
                  </a>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '2px solid #f1f5f9'
              }}>
                <button
                  type="button"
                  className="crm-btn crm-btn-secondary"
                  onClick={() => setShowSmtpModal(false)}
                  disabled={smtpLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="crm-btn crm-btn-primary"
                  disabled={smtpLoading}
                  style={{ minWidth: '180px' }}
                >
                  {smtpLoading ? '⏳ Verifying & Saving...' : '✅ Verify & Save SMTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ProductMarketplace;
