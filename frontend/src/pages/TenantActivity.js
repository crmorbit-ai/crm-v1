import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, TrendingUp, Activity as ActivityIcon, RefreshCw } from 'lucide-react';

const TenantActivity = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tenants/${id}/activity?days=${days}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Fetch activity error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [id, days]);

  if (loading) {
    return (
      <div style={{padding:'40px',textAlign:'center'}}>
        <div style={{fontSize:'14px',color:'#6B7280'}}>Loading activity...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{padding:'40px',textAlign:'center'}}>
        <div style={{fontSize:'14px',color:'#EF4444'}}>Failed to load activity data</div>
      </div>
    );
  }

  const { tenant, loginStats, featureStats, recentLoginActivity, period } = data;

  return (
    <div style={{padding:'24px',maxWidth:'1400px',margin:'0 auto'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <button
            onClick={() => navigate('/saas/tenants')}
            style={{padding:'8px',borderRadius:'8px',border:'1px solid #E5E7EB',background:'white',cursor:'pointer'}}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827',margin:0}}>
              {tenant.name}
            </h1>
            <p style={{fontSize:'14px',color:'#6B7280',margin:0}}>{tenant.email}</p>
          </div>
        </div>
        <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            style={{padding:'8px 12px',borderRadius:'8px',border:'1px solid #E5E7EB',fontSize:'14px'}}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button
            onClick={fetchActivity}
            style={{padding:'8px 12px',borderRadius:'8px',background:'#3B82F6',color:'white',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px'}}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Login Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:'16px',marginBottom:'24px'}}>
        <div style={{background:'white',borderRadius:'12px',padding:'20px',border:'1px solid #E5E7EB'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
            <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'#DBEAFE',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Users size={20} style={{color:'#3B82F6'}} />
            </div>
            <div>
              <div style={{fontSize:'12px',color:'#6B7280'}}>Active Users</div>
              <div style={{fontSize:'24px',fontWeight:'700',color:'#111827'}}>{loginStats.activeUsers}</div>
            </div>
          </div>
        </div>
        <div style={{background:'white',borderRadius:'12px',padding:'20px',border:'1px solid #E5E7EB'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
            <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'#D1FAE5',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <TrendingUp size={20} style={{color:'#10B981'}} />
            </div>
            <div>
              <div style={{fontSize:'12px',color:'#6B7280'}}>Total Logins</div>
              <div style={{fontSize:'24px',fontWeight:'700',color:'#111827'}}>{loginStats.totalLogins}</div>
            </div>
          </div>
        </div>
        <div style={{background:'white',borderRadius:'12px',padding:'20px',border:'1px solid #E5E7EB'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
            <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'#FEE2E2',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <ActivityIcon size={20} style={{color:'#EF4444'}} />
            </div>
            <div>
              <div style={{fontSize:'12px',color:'#6B7280'}}>Total Logouts</div>
              <div style={{fontSize:'24px',fontWeight:'700',color:'#111827'}}>{loginStats.totalLogouts}</div>
            </div>
          </div>
        </div>
        <div style={{background:'white',borderRadius:'12px',padding:'20px',border:'1px solid #E5E7EB'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
            <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'#E0E7FF',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Calendar size={20} style={{color:'#6366F1'}} />
            </div>
            <div>
              <div style={{fontSize:'12px',color:'#6B7280'}}>Last Login</div>
              <div style={{fontSize:'14px',fontWeight:'600',color:'#111827'}}>
                {loginStats.lastLogin ? new Date(loginStats.lastLogin).toLocaleDateString('en-IN', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : 'Never'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Usage Stats */}
      <div style={{background:'white',borderRadius:'12px',padding:'24px',border:'1px solid #E5E7EB',marginBottom:'24px'}}>
        <h2 style={{fontSize:'18px',fontWeight:'700',color:'#111827',marginBottom:'20px'}}>Feature Usage (Last {days} days)</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:'20px'}}>

          {/* Leads */}
          <div style={{padding:'16px',background:'#F9FAFB',borderRadius:'10px'}}>
            <div style={{fontSize:'14px',fontWeight:'600',color:'#374151',marginBottom:'12px'}}>📊 Leads</div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                <span style={{color:'#6B7280'}}>Total Leads</span>
                <span style={{fontWeight:'600',color:'#111827'}}>{featureStats.leads.total}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                <span style={{color:'#6B7280'}}>Created</span>
                <span style={{fontWeight:'600',color:'#10B981'}}>{featureStats.leads.created}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                <span style={{color:'#6B7280'}}>Updated</span>
                <span style={{fontWeight:'600',color:'#3B82F6'}}>{featureStats.leads.updated}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                <span style={{color:'#6B7280'}}>Converted</span>
                <span style={{fontWeight:'600',color:'#8B5CF6'}}>{featureStats.leads.converted} total</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                <span style={{color:'#6B7280'}}>Converted (Period)</span>
                <span style={{fontWeight:'600',color:'#F59E0B'}}>{featureStats.leads.convertedInPeriod}</span>
              </div>
            </div>
          </div>

          {/* Accounts */}
          <div style={{padding:'16px',background:'#F9FAFB',borderRadius:'10px'}}>
            <div style={{fontSize:'14px',fontWeight:'600',color:'#374151',marginBottom:'12px'}}>🏢 Accounts</div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                <span style={{color:'#6B7280'}}>Total Accounts</span>
                <span style={{fontWeight:'600',color:'#111827'}}>{featureStats.accounts.total}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                <span style={{color:'#6B7280'}}>Created</span>
                <span style={{fontWeight:'600',color:'#10B981'}}>{featureStats.accounts.created}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                <span style={{color:'#6B7280'}}>Updated</span>
                <span style={{fontWeight:'600',color:'#3B82F6'}}>{featureStats.accounts.updated}</span>
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div style={{padding:'16px',background:'#F9FAFB',borderRadius:'10px'}}>
            <div style={{fontSize:'14px',fontWeight:'600',color:'#374151',marginBottom:'12px'}}>👥 Contacts</div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                <span style={{color:'#6B7280'}}>Total Contacts</span>
                <span style={{fontWeight:'600',color:'#111827'}}>{featureStats.contacts.total}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                <span style={{color:'#6B7280'}}>Created</span>
                <span style={{fontWeight:'600',color:'#10B981'}}>{featureStats.contacts.created}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                <span style={{color:'#6B7280'}}>Updated</span>
                <span style={{fontWeight:'600',color:'#3B82F6'}}>{featureStats.contacts.updated}</span>
              </div>
            </div>
          </div>

          {/* Opportunities */}
          <div style={{padding:'16px',background:'#F9FAFB',borderRadius:'10px'}}>
            <div style={{fontSize:'14px',fontWeight:'600',color:'#374151',marginBottom:'12px'}}>💼 Opportunities</div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                <span style={{color:'#6B7280'}}>Total Deals</span>
                <span style={{fontWeight:'600',color:'#111827'}}>{featureStats.opportunities.total}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                <span style={{color:'#6B7280'}}>Created</span>
                <span style={{fontWeight:'600',color:'#10B981'}}>{featureStats.opportunities.created}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                <span style={{color:'#6B7280'}}>Updated</span>
                <span style={{fontWeight:'600',color:'#3B82F6'}}>{featureStats.opportunities.updated}</span>
              </div>
            </div>
          </div>

          {/* Other Activities */}
          <div style={{padding:'16px',background:'#F9FAFB',borderRadius:'10px'}}>
            <div style={{fontSize:'14px',fontWeight:'600',color:'#374151',marginBottom:'12px'}}>📋 Other Activities</div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                <span style={{color:'#6B7280'}}>Tasks Created</span>
                <span style={{fontWeight:'600',color:'#111827'}}>{featureStats.tasks.created}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                <span style={{color:'#6B7280'}}>Meetings Created</span>
                <span style={{fontWeight:'600',color:'#111827'}}>{featureStats.meetings.created}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
                <span style={{color:'#6B7280'}}>Calls Logged</span>
                <span style={{fontWeight:'600',color:'#111827'}}>{featureStats.calls.created}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Recent Login Activity */}
      <div style={{background:'white',borderRadius:'12px',padding:'24px',border:'1px solid #E5E7EB'}}>
        <h2 style={{fontSize:'18px',fontWeight:'700',color:'#111827',marginBottom:'16px'}}>Recent Login/Logout Activity</h2>
        {recentLoginActivity.length === 0 ? (
          <div style={{padding:'40px',textAlign:'center',color:'#9CA3AF'}}>No activity in this period</div>
        ) : (
          <div style={{maxHeight:'400px',overflowY:'auto'}}>
            {recentLoginActivity.map((activity, idx) => (
              <div
                key={idx}
                style={{
                  display:'flex',
                  justifyContent:'space-between',
                  alignItems:'center',
                  padding:'12px',
                  borderBottom: idx < recentLoginActivity.length - 1 ? '1px solid #F3F4F6' : 'none'
                }}
              >
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  <div
                    style={{
                      width:'8px',
                      height:'8px',
                      borderRadius:'50%',
                      background: activity.action === 'login.success' ? '#10B981' : '#EF4444'
                    }}
                  />
                  <div>
                    <div style={{fontSize:'14px',fontWeight:'500',color:'#111827'}}>
                      {activity.user?.firstName} {activity.user?.lastName}
                    </div>
                    <div style={{fontSize:'12px',color:'#6B7280'}}>{activity.user?.email}</div>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{
                    fontSize:'12px',
                    fontWeight:'600',
                    color: activity.action === 'login.success' ? '#10B981' : '#EF4444',
                    marginBottom:'2px'
                  }}>
                    {activity.action === 'login.success' ? '✓ Login' : '⊗ Logout'}
                  </div>
                  <div style={{fontSize:'12px',color:'#9CA3AF'}}>
                    {new Date(activity.createdAt).toLocaleString('en-IN', {
                      month:'short',
                      day:'numeric',
                      hour:'2-digit',
                      minute:'2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantActivity;
