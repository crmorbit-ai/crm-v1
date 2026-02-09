import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Hook to detect screen size
const useWindowSize = () => {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    ...size,
    isMobile: size.width < 768,
    isTablet: size.width >= 768 && size.width < 1024,
    isDesktop: size.width >= 1024
  };
};

const SaasLayout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { isMobile, isTablet } = useWindowSize();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: '/saas/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/saas/tenants', label: 'Tenants', icon: '🏢' },
    { path: '/saas/subscriptions', label: 'Subscriptions', icon: '💳' },
    { path: '/saas/billings', label: 'Billings', icon: '💰' },
    { path: '/saas/resellers', label: 'Resellers', icon: '🤝' },
    { path: '/saas/admins', label: 'Admins', icon: '👥' },
    { path: '/support-admin', label: 'Support', icon: '🎧' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        padding: isMobile ? '10px 12px' : '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #475569',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isMobile && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
          <h1 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '700', color: '#fff', margin: 0 }}>
            {title || 'SAAS Admin'}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
          {!isMobile && (
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              {user?.firstName} {user?.lastName}
            </span>
          )}
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: '1px solid #475569',
              color: '#94a3b8',
              padding: isMobile ? '4px 8px' : '5px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMobile && menuOpen && (
        <div style={{
          position: 'fixed',
          top: '45px',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 99
        }} onClick={() => setMenuOpen(false)}>
          <nav style={{
            background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }} onClick={e => e.stopPropagation()}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 16px',
                  fontSize: '14px',
                  fontWeight: isActive(item.path) ? '600' : '500',
                  color: isActive(item.path) ? '#3b82f6' : '#64748b',
                  textDecoration: 'none',
                  background: isActive(item.path) ? '#eff6ff' : 'transparent',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Desktop/Tablet Navigation */}
      {!isMobile && (
        <nav style={{
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 20px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          <div style={{ display: 'flex', gap: '2px', minWidth: 'max-content' }}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  padding: isTablet ? '10px 12px' : '10px 14px',
                  fontSize: '12px',
                  fontWeight: isActive(item.path) ? '600' : '500',
                  color: isActive(item.path) ? '#3b82f6' : '#64748b',
                  textDecoration: 'none',
                  borderBottom: isActive(item.path) ? '2px solid #3b82f6' : '2px solid transparent',
                  whiteSpace: 'nowrap'
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Content */}
      <main style={{ padding: isMobile ? '12px' : '16px 20px' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

// Export useWindowSize for child components
export { useWindowSize };

// Stat Card matching tenant dashboard (cyan-white gradient)
export const StatCard = ({ icon, value, label }) => {
  const { isMobile } = useWindowSize();

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
      borderRadius: '8px',
      padding: isMobile ? '12px' : '14px 16px',
      border: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '10px' : '12px',
      transition: 'all 0.2s',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      e.currentTarget.style.borderColor = '#3b82f6';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.borderColor = '#e2e8f0';
    }}
    >
      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#3b82f6' }} />
      <div style={{
        width: isMobile ? '36px' : '42px',
        height: isMobile ? '36px' : '42px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isMobile ? '16px' : '18px',
        color: '#fff',
        boxShadow: '0 2px 8px rgba(74, 144, 226, 0.3)',
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#1e293b', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      </div>
    </div>
  );
};

// Compact Card
export const Card = ({ title, children, action, noPadding, style: customStyle }) => {
  const { isMobile } = useWindowSize();

  return (
    <div style={{
      background: '#fff',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      ...customStyle
    }}>
      {title && (
        <div style={{
          padding: isMobile ? '10px 12px' : '10px 14px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <h3 style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{title}</h3>
          {action}
        </div>
      )}
      <div style={{ padding: noPadding ? 0 : (isMobile ? '12px' : '14px') }}>
        {children}
      </div>
    </div>
  );
};

// Badge
export const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: { bg: '#f1f5f9', color: '#475569' },
    success: { bg: '#dcfce7', color: '#166534' },
    warning: { bg: '#fef3c7', color: '#92400e' },
    danger: { bg: '#fee2e2', color: '#991b1b' },
    info: { bg: '#dbeafe', color: '#1e40af' },
    purple: { bg: '#f3e8ff', color: '#7c3aed' }
  };
  const style = variants[variant] || variants.default;

  return (
    <span style={{
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: '600',
      textTransform: 'uppercase',
      background: style.bg,
      color: style.color,
      whiteSpace: 'nowrap'
    }}>
      {children}
    </span>
  );
};

// Compact Button
export const Button = ({ children, variant = 'primary', size = 'default', onClick, disabled, style: customStyle }) => {
  const variants = {
    primary: { bg: '#3b82f6', color: '#fff', hoverBg: '#2563eb' },
    secondary: { bg: '#f1f5f9', color: '#475569', hoverBg: '#e2e8f0' },
    danger: { bg: '#ef4444', color: '#fff', hoverBg: '#dc2626' },
    success: { bg: '#10b981', color: '#fff', hoverBg: '#059669' },
    ghost: { bg: 'transparent', color: '#64748b', hoverBg: '#f1f5f9' }
  };
  const sizes = {
    small: { padding: '4px 8px', fontSize: '11px' },
    default: { padding: '6px 12px', fontSize: '12px' }
  };
  const v = variants[variant];
  const s = sizes[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...s,
        background: v.bg,
        color: v.color,
        border: 'none',
        borderRadius: '4px',
        fontWeight: '500',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
        ...customStyle
      }}
      onMouseEnter={(e) => { if (!disabled) e.target.style.background = v.hoverBg; }}
      onMouseLeave={(e) => { if (!disabled) e.target.style.background = v.bg; }}
    >
      {children}
    </button>
  );
};

// Compact Table
export const Table = ({ columns, data, loading, emptyMessage, onRowClick, selectedId }) => {
  const { isMobile } = useWindowSize();

  if (loading) {
    return <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>Loading...</div>;
  }
  if (!data || data.length === 0) {
    return <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>{emptyMessage || 'No data'}</div>;
  }

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '500px' : 'auto' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            {columns.map((col, idx) => (
              <th key={idx} style={{
                padding: isMobile ? '8px 10px' : '8px 12px',
                textAlign: col.align || 'left',
                fontSize: '10px',
                fontWeight: '600',
                color: '#64748b',
                textTransform: 'uppercase',
                background: '#f8fafc',
                whiteSpace: 'nowrap'
              }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={row._id || rowIdx}
              onClick={() => onRowClick && onRowClick(row)}
              style={{
                borderBottom: '1px solid #f1f5f9',
                cursor: onRowClick ? 'pointer' : 'default',
                background: selectedId === row._id ? '#eff6ff' : 'transparent',
                borderLeft: selectedId === row._id ? '3px solid #3b82f6' : '3px solid transparent'
              }}
              onMouseEnter={(e) => { if (selectedId !== row._id) e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={(e) => { if (selectedId !== row._id) e.currentTarget.style.background = 'transparent'; }}
            >
              {columns.map((col, colIdx) => (
                <td key={colIdx} style={{
                  padding: isMobile ? '10px' : '10px 12px',
                  fontSize: '12px',
                  color: '#334155',
                  textAlign: col.align || 'left'
                }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Input
export const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: '12px' }}>
    {label && <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#475569', marginBottom: '4px' }}>{label}</label>}
    <input {...props} style={{
      width: '100%',
      padding: '6px 10px',
      border: '1px solid #e2e8f0',
      borderRadius: '4px',
      fontSize: '12px',
      outline: 'none',
      boxSizing: 'border-box',
      ...props.style
    }} />
  </div>
);

// Select
export const Select = ({ label, options, ...props }) => (
  <div style={{ marginBottom: '12px' }}>
    {label && <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#475569', marginBottom: '4px' }}>{label}</label>}
    <select {...props} style={{
      width: '100%',
      padding: '6px 10px',
      border: '1px solid #e2e8f0',
      borderRadius: '4px',
      fontSize: '12px',
      background: '#fff',
      boxSizing: 'border-box',
      ...props.style
    }}>
      {options.map((opt, idx) => <option key={idx} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

// Modal - responsive
export const Modal = ({ title, children, onClose, show }) => {
  const { isMobile } = useWindowSize();

  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      padding: isMobile ? '12px' : '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '8px',
        width: '100%',
        maxWidth: isMobile ? '100%' : '400px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: '#fff'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: '#1e293b' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>
        <div style={{ padding: '16px' }}>{children}</div>
      </div>
    </div>
  );
};

// Detail Panel for split view - responsive (becomes modal on mobile)
export const DetailPanel = ({ title, onClose, children }) => {
  const { isMobile } = useWindowSize();

  if (isMobile) {
    // Render as full-screen modal on mobile
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#fff',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: '#1e293b' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#64748b', padding: '6px 12px', borderRadius: '4px' }}
          >
            ✕ Close
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          {children}
        </div>
      </div>
    );
  }

  // Desktop split view
  return (
    <div style={{
      flex: '0 0 45%',
      background: '#fff',
      borderLeft: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#f8fafc'
      }}>
        <h3 style={{ fontSize: '13px', fontWeight: '600', margin: 0, color: '#1e293b' }}>{title}</h3>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', padding: '0 4px' }}
        >
          ×
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {children}
      </div>
    </div>
  );
};

// Info Row for details
export const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', gap: '12px' }}>
    <span style={{ fontSize: '11px', color: '#64748b', flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: '11px', fontWeight: '600', color: '#1e293b', textAlign: 'right', wordBreak: 'break-word' }}>{value || 'N/A'}</span>
  </div>
);

// Responsive Grid helper
export const ResponsiveGrid = ({ children, cols = { mobile: 1, tablet: 2, desktop: 4 }, gap = '12px' }) => {
  const { isMobile, isTablet } = useWindowSize();
  const columns = isMobile ? cols.mobile : isTablet ? cols.tablet : cols.desktop;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap
    }}>
      {children}
    </div>
  );
};

export default SaasLayout;
