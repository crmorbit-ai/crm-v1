import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import '../../styles/crm.css';

const DashboardLayout = ({ children, title, actionButton }) => {
  return (
    <div className="crm-layout">
      <Sidebar />
      <div className="crm-main">
        <Header title={title} actionButton={actionButton} />
        <div className="crm-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
