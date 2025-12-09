import React, { useEffect } from 'react';
import Portal from './Portal';
import '../../styles/modal.css';

const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="modal-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          isolation: 'isolate'
        }}
      >
        <div
          className={`modal-content modal-${size}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            zIndex: 1000000
          }}
        >
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="modal-close" onClick={onClose}>
              &times;
            </button>
          </div>
          <div className="modal-body">
            {children}
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default Modal;
