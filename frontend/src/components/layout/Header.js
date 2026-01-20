import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/crm.css';

const Header = ({ title, actionButton, onMenuClick, isMobile }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getInitials = () => {
    if (!user) return '??';
    const firstInitial = user.firstName ? user.firstName[0] : '';
    const lastInitial = user.lastName ? user.lastName[0] : '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  const handleNavigation = (path) => {
    setShowUserMenu(false);
    navigate(path);
  };

  return (
    <header className="crm-header">
      <div className="header-left">
        {/* Hamburger Menu Button for Mobile */}
        {isMobile && (
          <button
            className="hamburger-btn"
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}
        <h1 className="header-title">{title}</h1>
      </div>

      <div className="header-right">
        {/* Action Button (optional) */}
        {actionButton && <div className="header-action-wrapper">{actionButton}</div>}

        {/* User Menu */}
        <div className="user-menu">
          <div
            className="user-menu-trigger"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">{getInitials()}</div>
            {!isMobile && (
              <div className="user-info">
                <span className="user-name">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="user-role">{user?.userType?.replace(/_/g, ' ')}</span>
              </div>
            )}
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>▼</span>
          </div>

          {showUserMenu && (
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999
                }}
                onClick={() => setShowUserMenu(false)}
              />
              <div className="user-menu-dropdown">
                {/* Show user info in dropdown on mobile */}
                {isMobile && (
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #E5E7EB',
                    marginBottom: '8px'
                  }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {user?.userType?.replace(/_/g, ' ')}
                    </div>
                  </div>
                )}
                <div
                  className="user-menu-item"
                  onClick={() => handleNavigation('/profile')}
                >
                  <span>👤</span>
                  My Profile
                </div>
                <div
                  className="user-menu-item"
                  onClick={() => handleNavigation('/change-password')}
                >
                  <span>🔐</span>
                  Change Password
                </div>
                <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #E5E7EB' }} />
                <div
                  className="user-menu-item"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  style={{ color: '#E74C3C' }}
                >
                  <span>🚪</span>
                  Logout
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
