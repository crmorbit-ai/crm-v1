import React, { useState, useEffect } from 'react';
import SaasLayout from '../components/layout/SaasLayout';
import couponService from '../services/couponService';
import { tenantService } from '../services/tenantService';
import { Plus, Trash2, Ban, Copy, Check, User, Calendar, Crown, BarChart3 } from 'lucide-react';

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    notes: '',
    expiresAt: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [tenantDetails, setTenantDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      console.log('Calling getAllCoupons...');
      const response = await couponService.getAllCoupons();
      console.log('Full response:', response);
      console.log('Response.data:', response?.data);

      // Handle response structure
      if (response && response.data && response.data.coupons) {
        setCoupons(response.data.coupons);
      } else if (response && response.coupons) {
        setCoupons(response.coupons);
      } else {
        setCoupons([]);
      }
    } catch (err) {
      console.error('Load coupons error:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      setError(err.response?.data?.message || err.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const loadTenantDetails = async (tenantId) => {
    try {
      setLoadingDetails(true);
      const details = await tenantService.getTenant(tenantId);
      setTenantDetails(details);
    } catch (err) {
      console.error('Load tenant details error:', err);
      setError('Failed to load tenant details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await couponService.createCoupon(formData);
      console.log('Create response:', response);

      // Handle response structure: response.data contains the coupon object
      const couponCode = response.data?.code || response.code || 'Unknown';
      setSuccess(`✅ Coupon created: ${couponCode}`);
      setTimeout(() => setSuccess(''), 3000);
      setShowCreateForm(false);
      setFormData({ code: '', description: '', notes: '', expiresAt: '' });
      loadCoupons();
    } catch (err) {
      console.error('Create coupon error:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create coupon';
      setError(errorMsg);
      setTimeout(() => setError(''), 5000); // Auto-clear after 5 seconds
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await couponService.deleteCoupon(couponId);
      setSuccess('✅ Coupon deleted');
      setTimeout(() => setSuccess(''), 3000);
      loadCoupons();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'used': return '#6366f1';
      case 'revoked': return '#ef4444';
      case 'expired': return '#64748b';
      default: return '#64748b';
    }
  };

  return (
    <SaasLayout title="Premium Access Coupons">
      {/* Title Only */}
      <div style={{ padding: '30px 30px 20px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#1e293b' }}>Premium Access Coupons</h1>
            <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '14px' }}>Generate and manage premium access coupons for tenants</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              padding: '12px 24px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#4f46e5'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#6366f1'}
          >
            <Plus size={18} />
            Generate Coupon
          </button>
        </div>
      </div>

      {/* Stats - Tenant Page Style */}
      <div style={{ padding: '0 30px 10px 30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[
            { k: 'total', label: 'Total Coupons', val: coupons.length, grad: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' },
            { k: 'active', label: 'Active', val: coupons.filter(c => c.status === 'active').length, grad: 'linear-gradient(135deg, #10b981 0%, #16a34a 50%, #84cc16 100%)' },
            { k: 'used', label: 'Used', val: coupons.filter(c => c.status === 'used').length, grad: 'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #fb923c 100%)' },
            { k: 'revoked', label: 'Revoked', val: coupons.filter(c => c.status === 'revoked').length, grad: 'linear-gradient(135deg, #ec4899 0%, #dc2626 50%, #9f1239 100%)' }
          ].map(s => (
            <div key={s.k} style={{
              background: s.grad,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              borderRadius: '10px',
              padding: '12px 16px',
              cursor: 'default',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
            }}
            >
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: '4px', textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)' }}>
                {s.val}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.85)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages & Form Below Stats */}
      <div style={{ padding: '0 30px 20px 30px' }}>
        {/* Success Message */}
        {success && (
          <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>
            ✅ {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>
            ❌ {error}
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Generate New Coupon</h3>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                    Coupon Code (leave empty for auto-generate)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="LIC-XXXXX (optional)"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                    Expires At (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Lifetime unlimited access license"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  Internal Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Internal notes about this coupon..."
                  rows={2}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={{ padding: '10px 20px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#4f46e5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#6366f1'}
                >
                  Generate Coupon
                </button>
                <button type="button" onClick={() => setShowCreateForm(false)} style={{ padding: '10px 20px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#cbd5e1'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#e2e8f0'}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Table & Detail Panel Container */}
      <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 400px)', padding: '0 30px 30px 30px' }}>

        {/* Left: Coupons Table */}
        <div style={{
          flex: showTenantModal ? '0 0 60%' : '1',
          overflowY: 'auto'
        }}>
          {/* Coupons Table */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Coupon Code</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Used By</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Used At</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Created</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No coupons generated yet</td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{coupon.code}</span>
                        <button
                          onClick={() => copyToClipboard(coupon.code)}
                          style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6366f1' }}
                          title="Copy code"
                        >
                          {copiedCode === coupon.code ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 10px', background: `${getStatusColor(coupon.status)}20`, color: getStatusColor(coupon.status), borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                        {coupon.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                      {coupon.usedBy ? (
                        <div>
                          <div
                            onClick={() => {
                              setSelectedTenant(coupon.usedBy);
                              setShowTenantModal(true);
                              loadTenantDetails(coupon.usedBy._id);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '8px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f1f5f9';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#10b981',
                              animation: 'pulse 2s infinite'
                            }} />
                            <div>
                              <div style={{ fontWeight: 600, color: '#1e293b' }}>
                                {coupon.usedBy.organizationName || coupon.usedBy.companyName || coupon.usedBy.email || 'Unknown Tenant'}
                              </div>
                              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{coupon.usedBy.email || '—'}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: '12px', fontStyle: 'italic' }}>Not used yet</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                      {coupon.usedAt ? new Date(coupon.usedAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                      {new Date(coupon.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {coupon.status === 'active' && (
                          <button
                            onClick={() => handleDelete(coupon._id)}
                            style={{ padding: '6px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Right: Tenant Detail Panel */}
        {showTenantModal && selectedTenant && (
          <div style={{
            flex: '0 0 38%',
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflowY: 'auto',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}>
            {/* Header */}
            <div style={{
              padding: '24px 28px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px 16px 0 0',
              color: 'white'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Tenant Details</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
                  Premium Access License Information
                </p>
              </div>
              <button
                onClick={() => setShowTenantModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '24px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
              >×</button>
            </div>

            {/* Content */}
            <div style={{ padding: '28px' }}>
              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <div style={{ fontSize: '14px' }}>Loading tenant details...</div>
                </div>
              ) : tenantDetails ? (
                <>
                  {/* Organization Info */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Organization Profile
                    </h3>
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
                        {tenantDetails.organizationName || tenantDetails.companyName || 'N/A'}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px' }}>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Email</div>
                          <div style={{ color: '#1e293b', fontWeight: 600 }}>📧 {tenantDetails.email || '—'}</div>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Created</div>
                          <div style={{ color: '#1e293b', fontWeight: 600 }}>📅 {new Date(tenantDetails.createdAt).toLocaleDateString('en-GB')}</div>
                        </div>
                        {tenantDetails.contactPhone && (
                          <div>
                            <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Phone</div>
                            <div style={{ color: '#1e293b', fontWeight: 600 }}>📞 {tenantDetails.contactPhone}</div>
                          </div>
                        )}
                        {tenantDetails.website && (
                          <div>
                            <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Website</div>
                            <div style={{ color: '#1e293b', fontWeight: 600 }}>🌐 {tenantDetails.website}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Admin User */}
                  {tenantDetails.adminUser && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <User size={14} style={{ display: 'inline', marginRight: '6px' }} />
                        Primary Admin
                      </h3>
                      <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e40af', marginBottom: '4px' }}>
                          {tenantDetails.adminUser.firstName} {tenantDetails.adminUser.lastName}
                        </div>
                        <div style={{ fontSize: '13px', color: '#3b82f6' }}>
                          {tenantDetails.adminUser.email}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Usage Stats */}
                  {tenantDetails.stats && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <BarChart3 size={14} style={{ display: 'inline', marginRight: '6px' }} />
                        Usage Statistics
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        {[
                          { label: 'Users', value: tenantDetails.stats.users, color: '#3b82f6', icon: '👥' },
                          { label: 'Leads', value: tenantDetails.stats.leads, color: '#10b981', icon: '🎯' },
                          { label: 'Contacts', value: tenantDetails.stats.contacts, color: '#f59e0b', icon: '👤' },
                          { label: 'Accounts', value: tenantDetails.stats.accounts, color: '#8b5cf6', icon: '🏢' }
                        ].map(stat => (
                          <div key={stat.label} style={{
                            background: '#fff',
                            padding: '14px',
                            borderRadius: '10px',
                            border: '1px solid #e5e7eb',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '20px', marginBottom: '4px' }}>{stat.icon}</div>
                            <div style={{ fontSize: '22px', fontWeight: 800, color: stat.color, marginBottom: '2px' }}>
                              {stat.value}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
                              {stat.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* License Status */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <Crown size={14} style={{ display: 'inline', marginRight: '6px' }} />
                      Premium License
                    </h3>

                    {tenantDetails?.subscription?.lifetimeLicense?.enabled ? (
                      // Active Premium
                      <div style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        color: 'white'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px'
                          }}>👑</div>
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 700 }}>Premium Access Active</div>
                            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>Unlimited features • No expiry</div>
                          </div>
                        </div>
                        {tenantDetails?.subscription?.lifetimeLicense && (
                          <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '12px', borderRadius: '8px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ opacity: 0.9 }}>Coupon Code:</span>
                              <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{tenantDetails?.subscription?.lifetimeLicense?.couponCode}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ opacity: 0.9 }}>Activated:</span>
                              <span style={{ fontWeight: 700 }}>{tenantDetails?.subscription?.lifetimeLicense?.activatedAt && new Date(tenantDetails.subscription.lifetimeLicense.activatedAt).toLocaleDateString('en-GB')}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      // No Premium - Show Re-enable Option
                      <div style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        color: 'white'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px'
                          }}>⚠️</div>
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 700 }}>No Premium Access</div>
                            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>Currently on trial plan</div>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Re-enable premium access for ${tenantDetails.organizationName || tenantDetails.email}?`)) {
                              try {
                                console.log('🔄 Re-enabling for tenant:', tenantDetails._id);
                                const response = await couponService.reEnableLicense(tenantDetails._id);
                                console.log('✅ Re-enable response:', response);
                                setSuccess('Premium access re-enabled successfully!');
                                loadTenantDetails(tenantDetails._id);
                                loadCoupons();
                                setTimeout(() => setSuccess(''), 3000);
                              } catch (err) {
                                console.error('❌ Re-enable error:', err);
                                console.error('Error response:', err.response);
                                const errorMsg = err.response?.data?.message || err.message || 'Failed to re-enable';
                                setError(errorMsg);
                                alert(`Error: ${errorMsg}\n\nCheck console for details.`);
                                setTimeout(() => setError(''), 5000);
                              }
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '10px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            marginTop: '8px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                        >
                          ↻ Re-enable Premium Access
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '14px' }}>No details available</div>
                </div>
              )}

              {/* Revoke Actions - Only if premium is active */}
              {tenantDetails?.subscription?.lifetimeLicense?.enabled && (
                <div style={{
                  padding: '20px',
                  background: '#fef2f2',
                  borderRadius: '12px',
                  border: '1px solid #fecaca'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Ban size={18} color="#dc2626" />
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#991b1b' }}>
                      Revoke Access
                    </h3>
                  </div>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#7f1d1d', lineHeight: '1.6' }}>
                    Revoking will remove premium access and restore trial period (7 days grace if expired). Tenant can login normally.
                  </p>
                  <button
                  onClick={async () => {
                    const tenantName = tenantDetails?.organizationName || tenantDetails?.companyName || tenantDetails?.email || 'this tenant';
                    if (window.confirm(`Are you sure you want to revoke premium access for ${tenantName}?\n\nThis action will:\n• Remove unlimited access\n• Revert to trial/expired status\n• Cannot be undone`)) {
                      try {
                        await couponService.revokeLicense(tenantDetails._id);
                        setSuccess('Premium access revoked successfully');
                        setShowTenantModal(false);
                        setTenantDetails(null);
                        loadCoupons();

                        // Auto-dismiss success message
                        setTimeout(() => setSuccess(''), 3000);
                      } catch (err) {
                        setError(err.response?.data?.message || 'Failed to revoke license');
                        setTimeout(() => setError(''), 5000);
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#b91c1c'}
                  onMouseLeave={(e) => e.target.style.background = '#dc2626'}
                >
                  <Ban size={16} />
                  Revoke Premium Access
                </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </SaasLayout>
  );
};

export default CouponManagement;
