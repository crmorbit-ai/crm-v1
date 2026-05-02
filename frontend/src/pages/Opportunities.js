import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';
import '../styles/crm.css';

const STAGE_OPTIONS = [
  'Qualification', 'Needs Analysis', 'Value Proposition',
  'Identify Decision Makers', 'Proposal/Price Quote',
  'Negotiation/Review', 'Closed Won', 'Closed Lost'
];

const emptyForm = {
  opportunityName: '',
  account: '',
  stage: 'Qualification',
  amount: '',
  accountManager: '',
  closeDate: '',
  contract: null
};

const Opportunities = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasPermission } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);
  const [highlightedStage, setHighlightedStage] = useState(searchParams.get('stage') || '');
  const stageRefs = useRef({});

  // Deal form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const fileInputRef = useRef(null);

  // Preview state
  const [previewModal, setPreviewModal] = useState(null); // { blobUrl, fileName, fileType }
  const [previewLoading, setPreviewLoading] = useState(false);

  const stages = [
    { name: 'Qualification', color: '#3B82F6', percentage: 10 },
    { name: 'Needs Analysis', color: '#8B5CF6', percentage: 20 },
    { name: 'Value Proposition', color: '#10B981', percentage: 40 },
    { name: 'Identify Decision Makers', color: '#F59E0B', percentage: 60 },
    { name: 'Proposal/Price Quote', color: '#EF4444', percentage: 75 },
    { name: 'Negotiation/Review', color: '#EC4899', percentage: 90 },
    { name: 'Closed Won', color: '#059669', percentage: 100 },
    { name: 'Closed Lost', color: '#DC2626', percentage: 0 }
  ];

  useEffect(() => {
    loadOpportunities();
    loadAccounts();
    loadUsers();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/accounts?limit=200`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) setAccounts(data.data.accounts || []);
    } catch (err) { console.error(err); }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users?limit=200`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) setUsers(data.data.users || data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'contract') {
      setFormData(prev => ({ ...prev, contract: files[0] || null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.opportunityName || !formData.account || !formData.closeDate) {
      setFormError('Deal name, company, and close date are required.');
      return;
    }
    setFormSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('opportunityName', formData.opportunityName);
      fd.append('account', formData.account);
      fd.append('stage', formData.stage);
      fd.append('amount', formData.amount || '0');
      fd.append('closeDate', formData.closeDate);
      if (formData.accountManager) fd.append('accountManager', formData.accountManager);
      if (formData.contract) fd.append('contract', formData.contract);

      const res = await fetch(`${API_URL}/opportunities`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: fd
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setFormData(emptyForm);
        loadOpportunities();
      } else {
        setFormError(data.message || 'Failed to create deal');
      }
    } catch (err) {
      setFormError('Server error. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Scroll to highlighted stage when page loads
  useEffect(() => {
    if (highlightedStage && !loading && stageRefs.current[highlightedStage]) {
      setTimeout(() => {
        stageRefs.current[highlightedStage]?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }, 300);
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedStage(''), 3000);
    }
  }, [highlightedStage, loading]);

  const loadOpportunities = async () => {
    try {
      const response = await fetch(`${API_URL}/opportunities?limit=100`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) setOpportunities(data.data.opportunities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateOpportunityStage = async (oppId, newStage) => {
    try {
      await fetch(`${API_URL}/opportunities/${oppId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stage: newStage })
      });
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleDownloadContract = async (oppId, fileName) => {
    try {
      const response = await fetch(`${API_URL}/opportunities/${oppId}/download-contract`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName || 'contract';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Contract download failed. Please try again.');
    }
  };

  const handlePreviewContract = async (oppId, fileName, fileType) => {
    setPreviewLoading(true);
    try {
      const response = await fetch(`${API_URL}/opportunities/${oppId}/download-contract`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to load');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      setPreviewModal({ blobUrl, fileName: fileName || 'contract', fileType: fileType || '' });
    } catch (err) {
      alert('Failed to load preview. Please try downloading the file.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewModal?.blobUrl) window.URL.revokeObjectURL(previewModal.blobUrl);
    setPreviewModal(null);
  };

  const handleDragStart = (e, opp) => {
    setDraggedItem(opp);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.stage === targetStage) {
      setDraggedItem(null);
      return;
    }

    setOpportunities(prev =>
      prev.map(opp =>
        opp._id === draggedItem._id ? { ...opp, stage: targetStage } : opp
      )
    );

    await updateOpportunityStage(draggedItem._id, targetStage);
    setDraggedItem(null);
  };

  const getOpportunitiesByStage = (stageName) => {
    return opportunities.filter(opp => opp.stage === stageName);
  };

  const getTotalByStage = (stageName) => {
    return getOpportunitiesByStage(stageName).reduce((sum, opp) => sum + (opp.amount || 0), 0);
  };

  const totalDeals = opportunities.length;
  const totalValue = opportunities.reduce((s, o) => s + (o.amount || 0), 0);
  const wonDeals = opportunities.filter(o => o.stage === 'Closed Won').length;
  const activeDeals = opportunities.filter(o => !['Closed Won','Closed Lost'].includes(o.stage)).length;

  const oppResponsiveCss = `
    @media (max-width: 768px) {
      .opp-stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
      .opp-header { flex-direction: column !important; align-items: flex-start !important; }
      .opp-header button { width: 100%; justify-content: center; }
      .opp-form-modal { width: calc(100vw - 32px) !important; max-width: 100% !important; padding: 18px !important; }
      .opp-kanban-wrap { gap: 10px !important; padding-bottom: 12px !important; }
      .opp-kanban-col { min-width: 240px !important; max-width: 240px !important; }
    }
    @media (max-width: 480px) {
      .opp-stats-grid { grid-template-columns: 1fr 1fr !important; gap: 6px !important; }
      .opp-kanban-col { min-width: 220px !important; max-width: 220px !important; }
    }
  `;

  return (
    <DashboardLayout title="Deal Pipeline">
      <style>{oppResponsiveCss}</style>

      {/* ── Page Header ── */}
      <div className="opp-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
        <div>
          <h1 style={{margin:0,fontSize:'22px',fontWeight:'700',color:'#0f172a',letterSpacing:'-0.3px'}}>Deal Pipeline</h1>
          <p style={{margin:'3px 0 0',fontSize:'13px',color:'#94a3b8'}}>Drag & drop deals across stages to update progress</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormError(''); setFormData(emptyForm); }}
          style={{
            background:'linear-gradient(135deg,#2563EB,#1d4ed8)',
            color:'white',border:'none',padding:'9px 20px',
            borderRadius:'8px',fontWeight:'600',fontSize:'13px',cursor:'pointer',
            display:'inline-flex',alignItems:'center',gap:'7px',
            boxShadow:'0 4px 14px rgba(37,99,235,0.35)',
            transition:'all 0.2s'
          }}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 6px 20px rgba(37,99,235,0.45)';}}
          onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 14px rgba(37,99,235,0.35)';}}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Deal
        </button>
      </div>

      {/* ── Stats Bar ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'22px'}}>
        {[
          { label:'Total Deals', value: totalDeals, icon:'M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10m6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v14', color:'#2563EB', bg:'#EFF6FF', isMoney:false },
          { label:'Pipeline Value', value:`₹${totalValue.toLocaleString('en-IN')}`, icon:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', color:'#059669', bg:'#ECFDF5', isMoney:true },
          { label:'Active Deals', value: activeDeals, icon:'M13 10V3L4 14h7v7l9-11h-7z', color:'#7C3AED', bg:'#F5F3FF', isMoney:false },
          { label:'Won Deals', value: wonDeals, icon:'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', color:'#D97706', bg:'#FFFBEB', isMoney:false },
        ].map(stat => (
          <div key={stat.label} style={{background:'white',borderRadius:'12px',padding:'14px 16px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #F1F5F9',display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{width:'38px',height:'38px',borderRadius:'10px',background:stat.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stat.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={stat.icon}/>
              </svg>
            </div>
            <div>
              <p style={{margin:0,fontSize:'18px',fontWeight:'700',color:'#0f172a',lineHeight:1.2}}>{stat.value}</p>
              <p style={{margin:0,fontSize:'11px',color:'#94a3b8',marginTop:'2px'}}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Deal Form Modal */}
      {showForm && (
        <div style={{
          position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:1000,
          display:'flex',alignItems:'center',justifyContent:'center'
        }}>
          <div style={{
            background:'white',borderRadius:'10px',padding:'28px',width:'480px',
            maxHeight:'90vh',overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,0.18)'
          }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{margin:0,fontSize:'18px',fontWeight:'700',color:'#111827'}}>New Deal</h2>
              <button onClick={() => setShowForm(false)} style={{background:'none',border:'none',fontSize:'20px',cursor:'pointer',color:'#6B7280'}}>×</button>
            </div>

            {formError && (
              <div style={{background:'#FEF2F2',border:'1px solid #FECACA',color:'#DC2626',padding:'8px 12px',borderRadius:'6px',marginBottom:'14px',fontSize:'13px'}}>
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              {/* Deal Name */}
              <div style={{marginBottom:'14px'}}>
                <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'4px'}}>
                  Deal Name <span style={{color:'red'}}>*</span>
                </label>
                <input
                  type="text" name="opportunityName" value={formData.opportunityName}
                  onChange={handleFormChange} placeholder="Enter deal name"
                  style={{width:'100%',padding:'8px 10px',border:'1px solid #D1D5DB',borderRadius:'6px',fontSize:'13px',boxSizing:'border-box'}}
                />
              </div>

              {/* Company (Account) */}
              <div style={{marginBottom:'14px'}}>
                <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'4px'}}>
                  Company <span style={{color:'red'}}>*</span>
                </label>
                <select
                  name="account" value={formData.account} onChange={handleFormChange}
                  style={{width:'100%',padding:'8px 10px',border:'1px solid #D1D5DB',borderRadius:'6px',fontSize:'13px',boxSizing:'border-box'}}
                >
                  <option value="">Select company</option>
                  {accounts.map(acc => (
                    <option key={acc._id} value={acc._id}>{acc.accountName}</option>
                  ))}
                </select>
              </div>

              {/* Deal Stage */}
              <div style={{marginBottom:'14px'}}>
                <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'4px'}}>Deal Stage</label>
                <select
                  name="stage" value={formData.stage} onChange={handleFormChange}
                  style={{width:'100%',padding:'8px 10px',border:'1px solid #D1D5DB',borderRadius:'6px',fontSize:'13px',boxSizing:'border-box'}}
                >
                  {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Amount */}
              <div style={{marginBottom:'14px'}}>
                <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'4px'}}>Amount (₹)</label>
                <input
                  type="number" name="amount" value={formData.amount} onChange={handleFormChange}
                  placeholder="0" min="0"
                  style={{width:'100%',padding:'8px 10px',border:'1px solid #D1D5DB',borderRadius:'6px',fontSize:'13px',boxSizing:'border-box'}}
                />
              </div>

              {/* Account Manager */}
              <div style={{marginBottom:'14px'}}>
                <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'4px'}}>Account Manager</label>
                <select
                  name="accountManager" value={formData.accountManager} onChange={handleFormChange}
                  style={{width:'100%',padding:'8px 10px',border:'1px solid #D1D5DB',borderRadius:'6px',fontSize:'13px',boxSizing:'border-box'}}
                >
                  <option value="">Select account manager</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </div>

              {/* Close Date */}
              <div style={{marginBottom:'14px'}}>
                <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'4px'}}>
                  Close Date <span style={{color:'red'}}>*</span>
                </label>
                <input
                  type="date" name="closeDate" value={formData.closeDate} onChange={handleFormChange}
                  style={{width:'100%',padding:'8px 10px',border:'1px solid #D1D5DB',borderRadius:'6px',fontSize:'13px',boxSizing:'border-box'}}
                />
              </div>

              {/* Contract Document */}
              <div style={{marginBottom:'20px'}}>
                <label style={{display:'block',fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'4px'}}>Contract Document</label>
                <input
                  ref={fileInputRef} type="file" name="contract"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFormChange}
                  style={{width:'100%',padding:'6px',border:'1px solid #D1D5DB',borderRadius:'6px',fontSize:'12px',boxSizing:'border-box'}}
                />
                <p style={{fontSize:'11px',color:'#9CA3AF',marginTop:'4px'}}>PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                {formData.contract && (
                  <p style={{fontSize:'12px',color:'#059669',marginTop:'2px'}}>📄 {formData.contract.name}</p>
                )}
              </div>

              <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
                <button
                  type="button" onClick={() => setShowForm(false)}
                  style={{padding:'8px 18px',border:'1px solid #D1D5DB',borderRadius:'6px',background:'white',fontSize:'13px',cursor:'pointer'}}
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={formSubmitting}
                  style={{padding:'8px 18px',background:'#2563EB',color:'white',border:'none',borderRadius:'6px',fontWeight:'600',fontSize:'13px',cursor:'pointer',opacity:formSubmitting?0.7:1}}
                >
                  {formSubmitting ? 'Creating...' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Loading Overlay */}
      {previewLoading && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'white',borderRadius:'10px',padding:'30px 40px',textAlign:'center'}}>
            <div style={{fontSize:'28px',marginBottom:'10px'}}>📄</div>
            <p style={{margin:0,color:'#374151',fontWeight:'600'}}>Loading preview...</p>
          </div>
        </div>
      )}

      {/* Contract Preview Modal */}
      {previewModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <div style={{background:'white',borderRadius:'10px',width:'100%',maxWidth:'900px',height:'90vh',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
            {/* Modal Header */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 18px',borderBottom:'1px solid #E5E7EB'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <div style={{width:'32px',height:'32px',background:'#EFF6FF',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div>
                  <p style={{margin:0,fontWeight:'600',fontSize:'13px',color:'#111827'}}>{previewModal.fileName}</p>
                  <p style={{margin:0,fontSize:'11px',color:'#9CA3AF'}}>Contract Document</p>
                </div>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <a href={previewModal.blobUrl} download={previewModal.fileName}
                  style={{padding:'6px 14px',background:'#2563EB',color:'white',borderRadius:'6px',fontSize:'12px',fontWeight:'600',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'5px'}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download
                </a>
                <button onClick={closePreview}
                  style={{padding:'6px 12px',background:'#F3F4F6',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'13px',color:'#374151',display:'inline-flex',alignItems:'center',gap:'5px'}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Close
                </button>
              </div>
            </div>
            {/* Preview Content */}
            <div style={{flex:1,overflow:'hidden'}}>
              {previewModal.fileType === 'application/pdf' || previewModal.fileName?.endsWith('.pdf') ? (
                <iframe
                  src={previewModal.blobUrl}
                  title="Contract Preview"
                  style={{width:'100%',height:'100%',border:'none'}}
                />
              ) : previewModal.fileType?.startsWith('image/') ? (
                <div style={{width:'100%',height:'100%',overflow:'auto',display:'flex',alignItems:'center',justifyContent:'center',background:'#F9FAFB'}}>
                  <img src={previewModal.blobUrl} alt="Contract" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}} />
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:'16px',color:'#6B7280'}}>
                  <span style={{fontSize:'48px'}}>📎</span>
                  <p style={{margin:0,fontWeight:'600'}}>{previewModal.fileName}</p>
                  <p style={{margin:0,fontSize:'13px'}}>This file type cannot be previewed. Please download it.</p>
                  <a href={previewModal.blobUrl} download={previewModal.fileName}
                    style={{padding:'8px 20px',background:'#2563EB',color:'white',borderRadius:'6px',fontSize:'13px',fontWeight:'600',textDecoration:'none'}}>
                    ⬇ Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'400px',gap:'14px'}}>
          <div style={{width:'40px',height:'40px',border:'3px solid #E2E8F0',borderTopColor:'#2563EB',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
          <p style={{margin:0,color:'#94a3b8',fontSize:'13px'}}>Loading pipeline...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <div style={{display:'flex',gap:'14px',overflowX:'auto',paddingBottom:'16px',minHeight:'65vh',alignItems:'flex-start'}}>
          {stages.map(stage => {
            const stageOpps = getOpportunitiesByStage(stage.name);
            const total = getTotalByStage(stage.name);
            const isHighlighted = highlightedStage === stage.name;
            const isWon = stage.name === 'Closed Won';
            const isLost = stage.name === 'Closed Lost';

            return (
              <div
                key={stage.name}
                ref={(el) => stageRefs.current[stage.name] = el}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.name)}
                style={{
                  minWidth:'272px', maxWidth:'272px',
                  background: isHighlighted ? '#EFF6FF' : '#F8FAFC',
                  borderRadius:'14px',
                  display:'flex', flexDirection:'column',
                  border: isHighlighted ? `2px solid ${stage.color}` : '1px solid #E2E8F0',
                  boxShadow: isHighlighted ? `0 0 0 4px ${stage.color}22` : '0 1px 3px rgba(0,0,0,0.04)',
                  transition:'all 0.25s ease',
                  overflow:'hidden'
                }}
              >
                {/* Column Header */}
                <div style={{
                  padding:'13px 14px 10px',
                  borderBottom:'1px solid #E2E8F0',
                  background:'white',
                  borderTop:`3px solid ${stage.color}`,
                  borderRadius:'14px 14px 0 0'
                }}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                      <div style={{width:'8px',height:'8px',borderRadius:'50%',background:stage.color,flexShrink:0}}/>
                      <h3 style={{fontSize:'12px',fontWeight:'700',color:'#0f172a',margin:0,letterSpacing:'0.1px'}}>
                        {stage.name}
                      </h3>
                    </div>
                    <span style={{
                      fontSize:'11px',fontWeight:'700',color:'white',
                      background:stage.color,
                      padding:'2px 8px',borderRadius:'20px',
                      minWidth:'22px',textAlign:'center'
                    }}>
                      {stageOpps.length}
                    </span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:'12px',fontWeight:'600',color: isWon ? '#059669' : isLost ? '#DC2626' : '#374151'}}>
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                    <span style={{fontSize:'10px',color:'#94a3b8'}}>{stage.percentage}% prob.</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{height:'3px',background:'#F1F5F9',borderRadius:'2px',overflow:'hidden',marginTop:'8px'}}>
                    <div style={{height:'100%',width:`${stage.percentage}%`,background:stage.color,borderRadius:'2px',transition:'width 0.5s ease'}}/>
                  </div>
                </div>

                {/* Cards */}
                <div style={{display:'flex',flexDirection:'column',gap:'8px',padding:'10px',flex:1,overflowY:'auto',maxHeight:'62vh'}}>
                  {stageOpps.length === 0 ? (
                    <div style={{
                      padding:'28px 16px',textAlign:'center',
                      border:'2px dashed #E2E8F0',borderRadius:'10px',
                      background:'white',margin:'2px 0'
                    }}>
                      <div style={{fontSize:'22px',marginBottom:'6px',opacity:0.4}}>📋</div>
                      <p style={{margin:0,fontSize:'11px',color:'#CBD5E1',fontWeight:'500'}}>No deals here</p>
                      <p style={{margin:'3px 0 0',fontSize:'10px',color:'#E2E8F0'}}>Drop a card or create new</p>
                    </div>
                  ) : (
                    stageOpps.map(opp => (
                      <div
                        key={opp._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, opp)}
                        style={{
                          background:'white',
                          borderRadius:'10px',
                          padding:'12px',
                          cursor:'grab',
                          border:'1px solid #E2E8F0',
                          borderLeft:`3px solid ${stage.color}`,
                          transition:'all 0.18s ease',
                          position:'relative'
                        }}
                        onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)';e.currentTarget.style.transform='translateY(-1px)';}}
                        onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none';}}
                      >
                        {/* Deal ID */}
                        {opp.dealId && (
                          <span style={{fontSize:'9px',color:'#CBD5E1',fontFamily:'monospace',fontWeight:'600',letterSpacing:'0.5px',display:'block',marginBottom:'5px'}}>
                            {opp.dealId}
                          </span>
                        )}

                        {/* Deal Name */}
                        <h4 style={{fontSize:'13px',fontWeight:'700',margin:'0 0 8px',color:'#0f172a',lineHeight:'1.35',paddingRight:'4px'}}>
                          {opp.opportunityName}
                        </h4>

                        {/* Amount */}
                        <div style={{
                          display:'inline-flex',alignItems:'center',gap:'4px',
                          background: isWon ? '#ECFDF5' : isLost ? '#FEF2F2' : '#F0FDF4',
                          borderRadius:'6px',padding:'4px 8px',marginBottom:'10px'
                        }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isLost?'#DC2626':'#059669'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                          </svg>
                          <span style={{fontSize:'13px',fontWeight:'700',color: isLost ? '#DC2626' : '#059669'}}>
                            ₹{(opp.amount||0).toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Company */}
                        {opp.account && (
                          <div style={{display:'flex',alignItems:'center',gap:'5px',marginBottom:'5px'}}>
                            <div style={{width:'16px',height:'16px',borderRadius:'4px',background:'#EFF6FF',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                              </svg>
                            </div>
                            <span style={{fontSize:'11px',color:'#475569',fontWeight:'500',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                              {opp.account.accountName}
                            </span>
                          </div>
                        )}

                        {/* Account Manager */}
                        {opp.accountManager && (
                          <div style={{display:'flex',alignItems:'center',gap:'5px',marginBottom:'5px'}}>
                            <div style={{width:'16px',height:'16px',borderRadius:'50%',background:'#7C3AED',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                              <span style={{fontSize:'8px',color:'white',fontWeight:'700'}}>
                                {opp.accountManager.firstName?.charAt(0)}
                              </span>
                            </div>
                            <span style={{fontSize:'11px',color:'#475569',fontWeight:'500'}}>
                              {opp.accountManager.firstName} {opp.accountManager.lastName}
                            </span>
                          </div>
                        )}

                        {/* Contract Buttons */}
                        {opp.contract?.url && (
                          <div style={{display:'flex',gap:'4px',marginBottom:'8px',marginTop:'4px'}}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePreviewContract(opp._id, opp.contract.fileName, opp.contract.fileType); }}
                              style={{
                                flex:1,background:'#EFF6FF',border:'1px solid #BFDBFE',color:'#2563EB',
                                padding:'4px 6px',borderRadius:'6px',cursor:'pointer',
                                fontSize:'10px',fontWeight:'600',
                                display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'3px',transition:'all 0.15s'
                              }}
                              onMouseEnter={e=>e.currentTarget.style.background='#DBEAFE'}
                              onMouseLeave={e=>e.currentTarget.style.background='#EFF6FF'}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                              </svg>
                              Preview
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDownloadContract(opp._id, opp.contract.fileName); }}
                              style={{
                                flex:1,background:'white',border:'1px solid #E2E8F0',color:'#64748B',
                                padding:'4px 6px',borderRadius:'6px',cursor:'pointer',
                                fontSize:'10px',fontWeight:'600',
                                display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'3px',transition:'all 0.15s'
                              }}
                              onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
                              onMouseLeave={e=>e.currentTarget.style.background='white'}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                              Download
                            </button>
                          </div>
                        )}

                        {/* Footer */}
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'8px',borderTop:'1px solid #F1F5F9',marginTop:'2px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            <span style={{fontSize:'10px',color:'#94a3b8',fontWeight:'500'}}>
                              {opp.closeDate ? new Date(opp.closeDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'}) : 'No date'}
                            </span>
                          </div>
                          {opp.owner && (
                            <div style={{
                              width:'22px',height:'22px',borderRadius:'50%',
                              background:`hsl(${(opp.owner.firstName?.charCodeAt(0)||0)*137 % 360},55%,55%)`,
                              display:'flex',alignItems:'center',justifyContent:'center',
                              fontSize:'9px',fontWeight:'700',color:'white',
                              title:`${opp.owner.firstName} ${opp.owner.lastName}`,
                              flexShrink:0
                            }}>
                              {opp.owner.firstName?.charAt(0)}{opp.owner.lastName?.charAt(0)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Opportunities;