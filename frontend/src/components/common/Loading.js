import React from 'react';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="loading">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '10px', color: '#666' }}>{message}</p>
      </div>
    </div>
  );
};

export default Loading;
