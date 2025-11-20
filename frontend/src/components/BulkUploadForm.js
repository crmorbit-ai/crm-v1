import React, { useState } from 'react';
import '../styles/crm.css';
import { API_URL } from '../config/api.config';

const BulkUploadForm = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${API_URL}/leads/download-template`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'leads_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download template');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Please upload Excel (.xlsx, .xls) or CSV file');
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    
    setFile(selectedFile);
    setError('');
    setResult(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/leads/bulk-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        if (data.data.successCount > 0) {
          onSuccess();
        }
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Download Template */}
      <div style={{ marginBottom: '24px', padding: '16px', background: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ margin: 0, marginBottom: '4px', fontSize: '14px', fontWeight: '600', color: '#1E40AF' }}>
              📥 Need a template?
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#1E40AF' }}>
              Download our Excel template to see the correct format
            </p>
          </div>
          <button
            className="crm-btn crm-btn-sm crm-btn-primary"
            onClick={handleDownloadTemplate}
          >
            Download Template
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: dragActive ? '2px dashed #3B82F6' : '2px dashed #D1D5DB',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          background: dragActive ? '#EFF6FF' : '#F9FAFB',
          cursor: 'pointer',
          marginBottom: '20px',
          transition: 'all 0.2s'
        }}
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="file-upload"
        />
        <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
          {file ? (
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                {file.name}
              </p>
              <p style={{ fontSize: '12px', color: '#6B7280' }}>
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                Drag & drop your file here
              </p>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
                or click to browse
              </p>
              <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
                Supports: Excel (.xlsx, .xls) and CSV files (Max 5MB)
              </p>
            </div>
          )}
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ padding: '12px', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ padding: '16px', background: '#DCFCE7', borderRadius: '8px', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, marginBottom: '8px', fontSize: '15px', fontWeight: '600', color: '#166534' }}>
              ✅ Upload Complete!
            </h4>
            <div style={{ fontSize: '13px', color: '#166534' }}>
              <p style={{ margin: '4px 0' }}>Total Rows: <strong>{result.totalRows}</strong></p>
              <p style={{ margin: '4px 0' }}>Successfully Uploaded: <strong>{result.successCount}</strong></p>
              <p style={{ margin: '4px 0' }}>Failed: <strong>{result.errorCount}</strong></p>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div style={{ padding: '16px', background: '#FEF2F2', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              <h4 style={{ margin: 0, marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#991B1B' }}>
                Errors:
              </h4>
              {result.errors.map((err, idx) => (
                <div key={idx} style={{ fontSize: '12px', color: '#991B1B', marginBottom: '4px' }}>
                  Row {err.row}: {err.error} {err.email && `(${err.email})`}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
        <button
          className="crm-btn crm-btn-secondary"
          onClick={onClose}
          disabled={uploading}
        >
          {result ? 'Close' : 'Cancel'}
        </button>
        {!result && (
          <button
            className="crm-btn crm-btn-primary"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        )}
      </div>
    </div>
  );
};

export default BulkUploadForm;