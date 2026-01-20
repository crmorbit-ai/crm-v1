import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import '../../styles/crm.css';

const DashboardLayout = ({ children, title, actionButton }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Auto-close sidebar when switching to desktop
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = () => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="crm-layout">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={handleOverlayClick}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      <div className="crm-main">
        <Header
          title={title}
          actionButton={actionButton}
          onMenuClick={toggleSidebar}
          isMobile={isMobile}
        />
        <div className="crm-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
