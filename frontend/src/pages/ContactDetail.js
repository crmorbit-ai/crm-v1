import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contactService } from '../services/contactService';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/crm.css';

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadContact();
  }, [id]);

  const loadContact = async () => {
    try {
      setLoading(true);
      const response = await contactService.getContact(id);
      if (response.success) setContact(response.data);
    } catch (err) {
      console.error('Load contact error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardLayout title="Loading..."><div style={{padding:'40px',textAlign:'center'}}>Loading...</div></DashboardLayout>;
  if (!contact) return <DashboardLayout title="Not Found"><div style={{padding:'20px'}}>Contact not found</div></DashboardLayout>;

  const { relatedData = {} } = contact;
  const opportunities = relatedData.opportunities?.data || [];
  const tasks = relatedData.tasks?.data || [];

  return (
    <DashboardLayout title={`${contact.firstName} ${contact.lastName}`}>
      <div className="crm-card" style={{marginBottom:'20px'}}>
        <div style={{padding:'24px'}}>
          <div style={{display:'flex',gap:'12px',marginBottom:'16px'}}>
            <button className="crm-btn crm-btn-secondary" onClick={()=>navigate('/contacts')}>← Back</button>
            <button className="crm-btn crm-btn-primary">✏️ Edit</button>
            <button className="crm-btn crm-btn-danger">🗑️ Delete</button>
            <button className="crm-btn crm-btn-success">✉ Send Email</button>
          </div>
          
          <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
            <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'24px',fontWeight:'bold'}}>
              {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
            </div>
            <div>
              <h1 style={{fontSize:'28px',fontWeight:'700',margin:0}}>{contact.firstName} {contact.lastName}</h1>
              <p style={{color:'#666',margin:'4px 0'}}>{contact.jobTitle || 'Contact'} {contact.account && `at ${contact.account.accountName}`}</p>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginTop:'24px',paddingTop:'24px',borderTop:'1px solid #E5E7EB'}}>
            <div><p style={{fontSize:'12px',color:'#666'}}>Email</p><p style={{fontWeight:'500'}}>{contact.email}</p></div>
            <div><p style={{fontSize:'12px',color:'#666'}}>Phone</p><p style={{fontWeight:'500'}}>{contact.phone || '-'}</p></div>
            <div><p style={{fontSize:'12px',color:'#666'}}>Mobile</p><p style={{fontWeight:'500'}}>{contact.mobile || '-'}</p></div>
            <div><p style={{fontSize:'12px',color:'#666'}}>Department</p><p style={{fontWeight:'500'}}>{contact.department || '-'}</p></div>
          </div>
        </div>
      </div>

      <div className="crm-card">
        <div className="crm-tabs">
          <button className={`crm-tab ${activeTab==='overview'?'active':''}`} onClick={()=>setActiveTab('overview')}>Overview</button>
          <button className={`crm-tab ${activeTab==='timeline'?'active':''}`} onClick={()=>setActiveTab('timeline')}>Timeline</button>
        </div>

        <div style={{padding:'24px'}}>
          {activeTab === 'overview' && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
                <div>
                  <h4 style={{fontSize:'14px',fontWeight:'600',marginBottom:'12px'}}>Contact Information</h4>
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Full Name</label><p style={{fontWeight:'500'}}>{contact.firstName} {contact.lastName}</p></div>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Email</label><p style={{fontWeight:'500'}}>{contact.email}</p></div>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Phone</label><p style={{fontWeight:'500'}}>{contact.phone || '-'}</p></div>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Mobile</label><p style={{fontWeight:'500'}}>{contact.mobile || '-'}</p></div>
                  </div>
                </div>
                <div>
                  <h4 style={{fontSize:'14px',fontWeight:'600',marginBottom:'12px'}}>Additional Information</h4>
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Job Title</label><p style={{fontWeight:'500'}}>{contact.jobTitle || '-'}</p></div>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Department</label><p style={{fontWeight:'500'}}>{contact.department || '-'}</p></div>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Account</label><p style={{fontWeight:'500',color:'#3B82F6',cursor:'pointer'}} onClick={()=>contact.account && navigate(`/accounts/${contact.account._id}`)}>{contact.account?.accountName || '-'}</p></div>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Lead Source</label><p style={{fontWeight:'500'}}>{contact.leadSource || '-'}</p></div>
                  </div>
                </div>
              </div>

              <div style={{marginTop:'32px'}}>
                <h4 style={{fontSize:'16px',fontWeight:'600',marginBottom:'16px'}}>Related Lists</h4>
                
                <div style={{marginBottom:'24px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
                    <h5 style={{fontSize:'14px',fontWeight:'600'}}>Deals ({relatedData.opportunities?.total || 0})</h5>
                    <button className="crm-btn crm-btn-sm crm-btn-primary">+ New Deal</button>
                  </div>
                  {opportunities.length > 0 ? (
                    <div style={{border:'1px solid #E5E7EB',borderRadius:'8px',overflow:'hidden'}}>
                      <table className="crm-table" style={{margin:0}}>
                        <thead><tr><th>Deal Name</th><th>Amount</th><th>Stage</th><th>Close Date</th></tr></thead>
                        <tbody>
                          {opportunities.map(o => (
                            <tr key={o._id} onClick={()=>navigate(`/opportunities/${o._id}`)} style={{cursor:'pointer'}}>
                              <td style={{fontWeight:'500',color:'#3B82F6'}}>{o.opportunityName}</td>
                              <td style={{color:'#059669',fontWeight:'600'}}>Rs. {o.amount?.toLocaleString() || '0'}</td>
                              <td><span className="status-badge">{o.stage}</span></td>
                              <td>{new Date(o.closeDate).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{border:'1px solid #E5E7EB',borderRadius:'8px',padding:'20px',textAlign:'center',color:'#666'}}>No deals found</div>
                  )}
                </div>

                <div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
                    <h5 style={{fontSize:'14px',fontWeight:'600'}}>Tasks ({relatedData.tasks?.total || 0})</h5>
                    <button className="crm-btn crm-btn-sm crm-btn-primary">+ New Task</button>
                  </div>
                  {tasks.length > 0 ? (
                    <div style={{border:'1px solid #E5E7EB',borderRadius:'8px',overflow:'hidden'}}>
                      <table className="crm-table" style={{margin:0}}>
                        <thead><tr><th>Subject</th><th>Due Date</th><th>Status</th><th>Priority</th></tr></thead>
                        <tbody>
                          {tasks.map(t => (
                            <tr key={t._id}>
                              <td style={{fontWeight:'500'}}>{t.subject}</td>
                              <td>{new Date(t.dueDate).toLocaleDateString()}</td>
                              <td><span className="status-badge">{t.status}</span></td>
                              <td><span className="rating-badge">{t.priority}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{border:'1px solid #E5E7EB',borderRadius:'8px',padding:'20px',textAlign:'center',color:'#666'}}>No tasks found</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div style={{padding:'40px',textAlign:'center',color:'#666'}}>Timeline coming soon...</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ContactDetail;