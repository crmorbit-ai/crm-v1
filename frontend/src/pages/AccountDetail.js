import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accountService } from '../services/accountService';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/crm.css';

const AccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAccount();
  }, [id]);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const response = await accountService.getAccount(id);
      if (response.success) setAccount(response.data);
    } catch (err) {
      console.error('Load account error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardLayout title="Loading..."><div style={{padding:'40px',textAlign:'center'}}>Loading...</div></DashboardLayout>;
  if (!account) return <DashboardLayout title="Not Found"><div style={{padding:'20px'}}>Account not found</div></DashboardLayout>;

  const { relatedData = {} } = account;
  const contacts = relatedData.contacts?.data || [];
  const opportunities = relatedData.opportunities?.data || [];
  const tasks = relatedData.tasks?.data || [];

  return (
    <DashboardLayout title={account.accountName}>
      <div className="crm-card" style={{marginBottom:'20px'}}>
        <div style={{padding:'24px'}}>
          <div style={{display:'flex',gap:'12px',marginBottom:'16px'}}>
            <button className="crm-btn crm-btn-secondary" onClick={()=>navigate('/accounts')}>← Back</button>
            <button className="crm-btn crm-btn-primary">✏️ Edit</button>
            <button className="crm-btn crm-btn-danger">🗑️ Delete</button>
          </div>
          
          <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
            <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'24px',fontWeight:'bold'}}>
              {account.accountName.charAt(0)}
            </div>
            <div>
              <h1 style={{fontSize:'28px',fontWeight:'700',margin:0}}>{account.accountName}</h1>
              <p style={{color:'#666',margin:'4px 0'}}>{account.accountType} • {account.industry}</p>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginTop:'24px',paddingTop:'24px',borderTop:'1px solid #E5E7EB'}}>
            <div><p style={{fontSize:'12px',color:'#666'}}>Phone</p><p style={{fontWeight:'500'}}>{account.phone || '-'}</p></div>
            <div><p style={{fontSize:'12px',color:'#666'}}>Email</p><p style={{fontWeight:'500'}}>{account.email || '-'}</p></div>
            <div><p style={{fontSize:'12px',color:'#666'}}>Website</p><p style={{fontWeight:'500'}}>{account.website || '-'}</p></div>
            <div><p style={{fontSize:'12px',color:'#666'}}>Annual Revenue</p><p style={{fontWeight:'500'}}>{account.annualRevenue ? `Rs. ${account.annualRevenue.toLocaleString()}` : '-'}</p></div>
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
                  <h4 style={{fontSize:'14px',fontWeight:'600',marginBottom:'12px'}}>Account Information</h4>
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Account Name</label><p style={{fontWeight:'500'}}>{account.accountName}</p></div>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Account Type</label><p style={{fontWeight:'500'}}>{account.accountType}</p></div>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Industry</label><p style={{fontWeight:'500'}}>{account.industry || '-'}</p></div>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Employees</label><p style={{fontWeight:'500'}}>{account.numberOfEmployees || '-'}</p></div>
                  </div>
                </div>
                <div>
                  <h4 style={{fontSize:'14px',fontWeight:'600',marginBottom:'12px'}}>Address Information</h4>
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Billing Address</label><p style={{fontWeight:'500'}}>{account.billingAddress?.street || '-'}</p></div>
                    <div><label style={{fontSize:'12px',color:'#666'}}>City</label><p style={{fontWeight:'500'}}>{account.billingAddress?.city || '-'}</p></div>
                    <div><label style={{fontSize:'12px',color:'#666'}}>State</label><p style={{fontWeight:'500'}}>{account.billingAddress?.state || '-'}</p></div>
                  </div>
                </div>
              </div>

              <div style={{marginTop:'32px'}}>
                <h4 style={{fontSize:'16px',fontWeight:'600',marginBottom:'16px'}}>Related Lists</h4>
                
                {/* CONTACTS */}
                <div style={{marginBottom:'24px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
                    <h5 style={{fontSize:'14px',fontWeight:'600'}}>Contacts ({relatedData.contacts?.total || 0})</h5>
                    <button className="crm-btn crm-btn-sm crm-btn-primary">+ New Contact</button>
                  </div>
                  {contacts.length > 0 ? (
                    <div style={{border:'1px solid #E5E7EB',borderRadius:'8px',overflow:'hidden'}}>
                      <table className="crm-table" style={{margin:0}}>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Title</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contacts.map(c => (
                            <tr key={c._id} onClick={()=>navigate(`/contacts/${c._id}`)} style={{cursor:'pointer'}}>
                              <td style={{fontWeight:'500',color:'#3B82F6'}}>{c.firstName} {c.lastName}</td>
                              <td>{c.email || '-'}</td>
                              <td>{c.phone || '-'}</td>
                              <td>{c.jobTitle || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{border:'1px solid #E5E7EB',borderRadius:'8px',padding:'20px',textAlign:'center',color:'#666'}}>No contacts found</div>
                  )}
                </div>

                {/* DEALS/OPPORTUNITIES */}
                <div style={{marginBottom:'24px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
                    <h5 style={{fontSize:'14px',fontWeight:'600'}}>Deals ({relatedData.opportunities?.total || 0})</h5>
                    <button className="crm-btn crm-btn-sm crm-btn-primary">+ New Deal</button>
                  </div>
                  {opportunities.length > 0 ? (
                    <div style={{border:'1px solid #E5E7EB',borderRadius:'8px',overflow:'hidden'}}>
                      <table className="crm-table" style={{margin:0}}>
                        <thead>
                          <tr>
                            <th>Deal Name</th>
                            <th>Amount</th>
                            <th>Stage</th>
                            <th>Close Date</th>
                          </tr>
                        </thead>
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

                {/* TASKS */}
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
                    <h5 style={{fontSize:'14px',fontWeight:'600'}}>Open Activities ({relatedData.tasks?.total || 0})</h5>
                    <button className="crm-btn crm-btn-sm crm-btn-primary">+ New Task</button>
                  </div>
                  {tasks.length > 0 ? (
                    <div style={{border:'1px solid #E5E7EB',borderRadius:'8px',overflow:'hidden'}}>
                      <table className="crm-table" style={{margin:0}}>
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Priority</th>
                          </tr>
                        </thead>
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
                    <div style={{border:'1px solid #E5E7EB',borderRadius:'8px',padding:'20px',textAlign:'center',color:'#666'}}>No activities found</div>
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

export default AccountDetail;