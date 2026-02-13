import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api.config';

const PinVerification = ({
  isOpen,
  onClose,
  onVerified,
  resourceType,
  resourceId,
  resourceName
}) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPinSet, setIsPinSet] = useState(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const inputRefs = useRef([]);
  const newPinRefs = useRef([]);
  const confirmPinRefs = useRef([]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (isOpen) {
      checkPinStatus();
      setPin(['', '', '', '']);
      setError('');
    }
  }, [isOpen]);

  const checkPinStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/viewing-pin/status`, { headers: getAuthHeader() });
      setIsPinSet(res.data?.data?.isViewingPinSet || false);
      if (!res.data?.data?.isViewingPinSet) {
        setIsSettingPin(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePinChange = (index, value, pinArray, setPinArray, refs) => {
    if (!/^\d*$/.test(value)) return;

    const newPinArray = [...pinArray];
    newPinArray[index] = value.slice(-1);
    setPinArray(newPinArray);

    // Auto-focus next input
    if (value && index < 3) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e, refs) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleSetPin = async () => {
    const pinValue = newPin.join('');
    const confirmValue = confirmPin.join('');

    if (pinValue.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    if (pinValue !== confirmValue) {
      setError('PINs do not match');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/viewing-pin/set`, { pin: pinValue }, { headers: getAuthHeader() });
      setIsPinSet(true);
      setIsSettingPin(false);
      setNewPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async () => {
    const pinValue = pin.join('');

    if (pinValue.length < 4) {
      setError('Enter your PIN');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/viewing-pin/verify`, { pin: pinValue }, { headers: getAuthHeader() });

      // Log access
      if (resourceType && resourceId) {
        await axios.post(`${API_URL}/viewing-pin/log-access`, {
          resourceType,
          resourceId,
          resourceName: resourceName || '',
          action: 'viewed'
        }, { headers: getAuthHeader() });
      }

      onVerified();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid PIN');
      setPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.lockIcon}>
            {isSettingPin ? '🔐' : '🔒'}
          </div>
          <h3 style={styles.title}>
            {isSettingPin ? 'Set Your Viewing PIN' : 'Enter Viewing PIN'}
          </h3>
          <p style={styles.subtitle}>
            {isSettingPin
              ? 'Create a 4 digit PIN to securely access data'
              : 'Enter your PIN to view this record'
            }
          </p>
        </div>

        {error && (
          <div style={styles.error}>{error}</div>
        )}

        {/* Set PIN Form */}
        {isSettingPin ? (
          <div style={styles.pinSection}>
            <label style={styles.label}>Create PIN</label>
            <div style={styles.pinInputs}>
              {newPin.map((digit, index) => (
                <input
                  key={`new-${index}`}
                  ref={el => newPinRefs.current[index] = el}
                  type="password"
                  value={digit}
                  onChange={e => handlePinChange(index, e.target.value, newPin, setNewPin, newPinRefs)}
                  onKeyDown={e => handleKeyDown(index, e, newPinRefs)}
                  style={styles.pinInput}
                  maxLength={1}
                  inputMode="numeric"
                />
              ))}
            </div>

            <label style={{ ...styles.label, marginTop: '16px' }}>Confirm PIN</label>
            <div style={styles.pinInputs}>
              {confirmPin.map((digit, index) => (
                <input
                  key={`confirm-${index}`}
                  ref={el => confirmPinRefs.current[index] = el}
                  type="password"
                  value={digit}
                  onChange={e => handlePinChange(index, e.target.value, confirmPin, setConfirmPin, confirmPinRefs)}
                  onKeyDown={e => handleKeyDown(index, e, confirmPinRefs)}
                  style={styles.pinInput}
                  maxLength={1}
                  inputMode="numeric"
                />
              ))}
            </div>

            <button onClick={handleSetPin} style={styles.submitBtn} disabled={loading}>
              {loading ? 'Setting...' : 'Set PIN'}
            </button>
          </div>
        ) : (
          /* Verify PIN Form */
          <div style={styles.pinSection}>
            <div style={styles.pinInputs}>
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="password"
                  value={digit}
                  onChange={e => handlePinChange(index, e.target.value, pin, setPin, inputRefs)}
                  onKeyDown={e => handleKeyDown(index, e, inputRefs)}
                  style={styles.pinInput}
                  maxLength={1}
                  inputMode="numeric"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <button onClick={handleVerifyPin} style={styles.submitBtn} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify PIN'}
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    padding: '28px',
    width: '100%',
    maxWidth: '360px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px'
  },
  lockIcon: {
    fontSize: '40px',
    marginBottom: '12px'
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 6px 0'
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    marginBottom: '16px',
    textAlign: 'center'
  },
  pinSection: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    marginBottom: '8px',
    textTransform: 'uppercase'
  },
  pinInputs: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center'
  },
  pinInput: {
    width: '42px',
    height: '48px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '20px',
    fontWeight: '700',
    textAlign: 'center',
    outline: 'none',
    transition: 'border-color 0.2s',
    caretColor: '#6366f1'
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '20px'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '16px'
  },
  cancelBtn: {
    padding: '8px 16px',
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer'
  }
};

export default PinVerification;
