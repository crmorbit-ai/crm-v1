import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, TrendingUp, Users, Search, RefreshCw, Eye, Download } from 'lucide-react';
import SaasLayout from '../components/layout/SaasLayout';

const SaasActivityMonitor = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [days, setDays] = useState(30);
  const [overallActivity, setOverallActivity] = useState([]);
  const [loadingOverall, setLoadingOverall] = useState(false);
  const [overviewDays, setOverviewDays] = useState(7);
  const [expandedStat, setExpandedStat] = useState(null);

  const fetchTenantsActivity = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tenants?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setTenants(result.data.tenants || []);
      }
    } catch (error) {
      console.error('Fetch tenants error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverallActivity = async () => {
    setLoadingOverall(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/saas-admins/overall-activity?days=${overviewDays}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setOverallActivity(result.data || []);
      }
    } catch (error) {
      console.error('Fetch overall activity error:', error);
    } finally {
      setLoadingOverall(false);
    }
  };

  useEffect(() => {
    fetchTenantsActivity();
    fetchOverallActivity();
  }, []);

  useEffect(() => {
    fetchOverallActivity();
  }, [overviewDays]);

  const fetchTenantActivity = async (tenantId) => {
    setLoadingActivity(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tenants/${tenantId}/activity?days=${days}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setActivityData(result.data);
      }
    } catch (error) {
      console.error('Fetch activity error:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleTenantClick = (tenant) => {
    setSelectedTenant(tenant);
    fetchTenantActivity(tenant._id);
  };

  useEffect(() => {
    if (selectedTenant) {
      fetchTenantActivity(selectedTenant._id);
    }
  }, [days]);

  const filteredTenants = tenants.filter(t =>
    t.organizationName?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.organizationId?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (tenant) => {
    if (!tenant.isActive) return '#EF4444';
    if (tenant.isSuspended) return '#F59E0B';
    return '#10B981';
  };

  const getStatusText = (tenant) => {
    if (!tenant.isActive) return 'Inactive';
    if (tenant.isSuspended) return 'Suspended';
    return 'Active';
  };

  const downloadActivityReport = () => {
    if (!overallActivity.summary) return;

    // Prepare CSV data
    const csvRows = [];

    // Header
    csvRows.push(['ACTIVITY REPORT']);
    csvRows.push(['Period: Last ' + overviewDays + ' days']);
    csvRows.push(['Generated: ' + new Date().toLocaleString()]);
    csvRows.push([]);

    // Summary section
    csvRows.push(['=== OVERALL SUMMARY ===']);
    csvRows.push(['Metric', 'Value']);
    csvRows.push(['Active Tenants (with activity)', overallActivity.summary.activeTenants]);
    csvRows.push(['Total Logins', overallActivity.summary.totalLogins]);
    csvRows.push(['Total Actions Performed', overallActivity.summary.totalActions]);
    csvRows.push(['Average Actions per Tenant', overallActivity.summary.avgActionsPerTenant]);
    csvRows.push([]);
    csvRows.push([]);

    // Detailed Per-tenant breakdown
    csvRows.push(['=== DETAILED TENANT ACTIVITY ===']);
    csvRows.push([]);

    if (overallActivity.tenantBreakdown && overallActivity.tenantBreakdown.length > 0) {
      overallActivity.tenantBreakdown.forEach((tenant, index) => {
        csvRows.push([`TENANT ${index + 1}: ${tenant.organizationName || 'N/A'}`]);
        csvRows.push(['Organization ID', tenant.organizationId || 'N/A']);
        csvRows.push(['Email', tenant.email || 'N/A']);
        csvRows.push(['Status', tenant.isActive ? 'Active' : 'Inactive']);
        csvRows.push([]);

        // Login Activity
        csvRows.push(['LOGIN ACTIVITY']);
        csvRows.push(['Total Logins', tenant.loginCount || 0]);
        csvRows.push(['Total Logouts', tenant.logoutCount || 0]);
        csvRows.push([]);

        // Feature Usage
        csvRows.push(['FEATURE USAGE']);
        csvRows.push(['Total Actions', tenant.totalActions || 0]);
        csvRows.push(['Leads Created', tenant.leadsCreated || 0]);
        csvRows.push(['Leads Converted', tenant.leadsConverted || 0]);
        csvRows.push(['Accounts Created', tenant.accountsCreated || 0]);
        csvRows.push(['Contacts Created', tenant.contactsCreated || 0]);
        csvRows.push(['Opportunities Created', tenant.opportunitiesCreated || 0]);
        csvRows.push([]);

        // Action Breakdown (if available)
        if (tenant.actionBreakdown && tenant.actionBreakdown.length > 0) {
          csvRows.push(['ACTION BREAKDOWN']);
          csvRows.push(['Action Type', 'Count']);
          tenant.actionBreakdown.forEach(action => {
            csvRows.push([action.action || 'Unknown', action.count || 0]);
          });
          csvRows.push([]);
        }

        csvRows.push(['---']);
        csvRows.push([]);
      });
    }

    csvRows.push([]);
    csvRows.push(['=== QUICK SUMMARY TABLE ===']);
    csvRows.push(['Organization', 'Org ID', 'Email', 'Logins', 'Logouts', 'Total Actions', 'Leads Created', 'Leads Converted', 'Accounts', 'Contacts', 'Opportunities']);

    if (overallActivity.tenantBreakdown && overallActivity.tenantBreakdown.length > 0) {
      overallActivity.tenantBreakdown.forEach(tenant => {
        csvRows.push([
          tenant.organizationName || 'N/A',
          tenant.organizationId || 'N/A',
          tenant.email || 'N/A',
          tenant.loginCount || 0,
          tenant.logoutCount || 0,
          tenant.totalActions || 0,
          tenant.leadsCreated || 0,
          tenant.leadsConverted || 0,
          tenant.accountsCreated || 0,
          tenant.contactsCreated || 0,
          tenant.opportunitiesCreated || 0
        ]);
      });
    }

    // Convert to CSV string
    const csvContent = csvRows.map(row =>
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return '"' + cellStr.replace(/"/g, '""') + '"';
        }
        return cellStr;
      }).join(',')
    ).join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `activity-report-${overviewDays}days-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SaasLayout title="Activity Monitor">
      <div style={{padding:'24px'}}>

        {/* Header Section - Compact & Dark */}
        <div style={{background:'linear-gradient(135deg, #1e293b 0%, #334155 100%)',borderRadius:'12px',padding:'18px 24px',marginBottom:'20px',boxShadow:'0 4px 12px rgba(0,0,0,0.15)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'linear-gradient(135deg,#6366F1,#8B5CF6)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(99,102,241,0.3)'}}>
                <Activity size={20} style={{color:'white'}} />
              </div>
              <div>
                <h1 style={{fontSize:'20px',fontWeight:'700',color:'#ffffff',margin:0,letterSpacing:'-0.5px'}}>Activity Monitor</h1>
                <p style={{fontSize:'13px',color:'#cbd5e1',margin:0}}>Track all tenant activities and usage</p>
              </div>
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <button
                onClick={downloadActivityReport}
                disabled={!overallActivity.summary}
                style={{padding:'8px 14px',borderRadius:'8px',background:overallActivity.summary?'rgba(16,185,129,0.9)':'rgba(107,114,128,0.5)',color:'white',border:'none',cursor:overallActivity.summary?'pointer':'not-allowed',display:'flex',alignItems:'center',gap:'6px',fontSize:'13px',fontWeight:'600',transition:'all 0.2s',boxShadow:overallActivity.summary?'0 2px 8px rgba(16,185,129,0.3)':'none'}}
                onMouseEnter={(e) => overallActivity.summary && (e.currentTarget.style.background='rgba(16,185,129,1)')}
                onMouseLeave={(e) => overallActivity.summary && (e.currentTarget.style.background='rgba(16,185,129,0.9)')}
              >
                <Download size={14} /> Download Report
              </button>
              <button
                onClick={fetchTenantsActivity}
                style={{padding:'8px 14px',borderRadius:'8px',background:'rgba(59,130,246,0.9)',color:'white',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',fontSize:'13px',fontWeight:'600',transition:'all 0.2s',boxShadow:'0 2px 8px rgba(59,130,246,0.3)'}}
                onMouseEnter={(e) => e.currentTarget.style.background='rgba(59,130,246,1)'}
                onMouseLeave={(e) => e.currentTarget.style.background='rgba(59,130,246,0.9)'}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Activity Overview Section with Stats - Compact */}
        <div style={{background:'white',borderRadius:'12px',padding:'20px',marginBottom:'18px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
            <h2 style={{fontSize:'16px',fontWeight:'700',color:'#0f172a',margin:0,letterSpacing:'-0.3px'}}>
              Activity Overview (Last {overviewDays} days)
            </h2>
            <select
              value={overviewDays}
              onChange={(e) => setOverviewDays(e.target.value)}
              style={{padding:'6px 10px',borderRadius:'6px',border:'1px solid #e2e8f0',fontSize:'12px',fontWeight:'500',color:'#475569'}}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          {loadingOverall ? (
            <div style={{padding:'40px',textAlign:'center',color:'#9CA3AF'}}>Loading activity summary...</div>
          ) : overallActivity.summary ? (
            <>
            {/* Stats Cards - Tenant Page Style */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'16px',marginBottom:'0'}}>

              {/* Active Tenants */}
              <div
                onClick={() => setExpandedStat(expandedStat === 'tenants' ? null : 'tenants')}
                style={{
                  background: expandedStat==='tenants' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  border: expandedStat==='tenants' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
                  cursor:'pointer',
                  transition:'all 0.2s',
                  position:'relative',
                  overflow:'hidden',
                  boxShadow: expandedStat==='tenants' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none'
                }}
                onMouseEnter={(e)=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';if(!expandedStat || expandedStat!=='tenants') e.currentTarget.style.borderColor='#14b8a6';}}
                onMouseLeave={(e)=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=expandedStat==='tenants'?'0 4px 12px rgba(20, 184, 166, 0.3)':'none';if(!expandedStat || expandedStat!=='tenants') e.currentTarget.style.borderColor='#e2e8f0';}}
              >
                <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:'#3b82f6'}}/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:'22px',fontWeight:'700',color:'#1e293b',lineHeight:1.1}}>{overallActivity.summary.activeTenants}</div>
                  <div style={{fontSize:'11px',color:'#64748b',fontWeight:'500',textTransform:'uppercase',marginTop:'4px'}}>Active Tenants</div>
                  <div style={{fontSize:'10px',color:'#94a3b8',marginTop:'2px'}}>of {overallActivity.summary.totalTenants} total</div>
                </div>
              </div>

              {/* Total Logins */}
              <div
                onClick={() => setExpandedStat(expandedStat === 'logins' ? null : 'logins')}
                style={{
                  background: expandedStat==='logins' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  border: expandedStat==='logins' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
                  cursor:'pointer',
                  transition:'all 0.2s',
                  position:'relative',
                  overflow:'hidden',
                  boxShadow: expandedStat==='logins' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none'
                }}
                onMouseEnter={(e)=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';if(!expandedStat || expandedStat!=='logins') e.currentTarget.style.borderColor='#14b8a6';}}
                onMouseLeave={(e)=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=expandedStat==='logins'?'0 4px 12px rgba(20, 184, 166, 0.3)':'none';if(!expandedStat || expandedStat!=='logins') e.currentTarget.style.borderColor='#e2e8f0';}}
              >
                <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:'#10b981'}}/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:'22px',fontWeight:'700',color:'#1e293b',lineHeight:1.1}}>{overallActivity.summary.totalLogins}</div>
                  <div style={{fontSize:'11px',color:'#64748b',fontWeight:'500',textTransform:'uppercase',marginTop:'4px'}}>Total Logins</div>
                </div>
              </div>

              {/* Total Actions */}
              <div
                onClick={() => setExpandedStat(expandedStat === 'actions' ? null : 'actions')}
                style={{
                  background: expandedStat==='actions' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  border: expandedStat==='actions' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
                  cursor:'pointer',
                  transition:'all 0.2s',
                  position:'relative',
                  overflow:'hidden',
                  boxShadow: expandedStat==='actions' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none'
                }}
                onMouseEnter={(e)=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';if(!expandedStat || expandedStat!=='actions') e.currentTarget.style.borderColor='#14b8a6';}}
                onMouseLeave={(e)=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=expandedStat==='actions'?'0 4px 12px rgba(20, 184, 166, 0.3)':'none';if(!expandedStat || expandedStat!=='actions') e.currentTarget.style.borderColor='#e2e8f0';}}
              >
                <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:'#8b5cf6'}}/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:'22px',fontWeight:'700',color:'#1e293b',lineHeight:1.1}}>{overallActivity.summary.totalActions}</div>
                  <div style={{fontSize:'11px',color:'#64748b',fontWeight:'500',textTransform:'uppercase',marginTop:'4px'}}>Total Actions</div>
                </div>
              </div>

              {/* Avg Actions */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  border: '1px solid #e2e8f0',
                  position:'relative',
                  overflow:'hidden'
                }}
              >
                <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:'#f97316'}}/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:'22px',fontWeight:'700',color:'#1e293b',lineHeight:1.1}}>{overallActivity.summary.avgActionsPerTenant}</div>
                  <div style={{fontSize:'11px',color:'#64748b',fontWeight:'500',textTransform:'uppercase',marginTop:'4px'}}>Avg Actions</div>
                  <div style={{fontSize:'10px',color:'#94a3b8',marginTop:'2px'}}>per tenant</div>
                </div>
              </div>

            </div>
            </>
          ) : null}
        </div>

        {/* Search Bar Section - Compact */}
        <div style={{background:'white',borderRadius:'10px',padding:'16px',marginBottom:'18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{position:'relative'}}>
            <Search size={18} style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'#94a3b8'}} />
            <input
              type="text"
              placeholder="Search by organization name, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{width:'100%',padding:'10px 12px 10px 38px',borderRadius:'8px',border:'1px solid #e2e8f0',fontSize:'13px',color:'#1e293b',transition:'border 0.2s'}}
              onFocus={(e) => e.target.style.borderColor='#3b82f6'}
              onBlur={(e) => e.target.style.borderColor='#e2e8f0'}
            />
          </div>
        </div>

        {/* Two Column Layout - Detail Panel (Left) + Content (Right) */}
        <div style={{display:'flex',gap:'24px'}}>
          {/* STATS WILL BE REMOVED FROM HERE AFTER COPYING TO TOP */}
          {/* Activity Detail Panel - Left Side (Conditionally Rendered) */}
          {selectedTenant && (
          <div style={{flex:'0 0 480px',background:'white',borderRadius:'16px',boxShadow:'0 4px 12px rgba(0,0,0,0.1)',overflow:'hidden',display:'flex',flexDirection:'column',maxHeight:'calc(100vh - 112px)',position:'sticky',top:'24px'}}>
            {/* Header */}
            <div style={{background:'linear-gradient(135deg,#0F172A,#1E293B)',padding:'20px',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px',flex:1,minWidth:0}}>
                  <div style={{width:'40px',height:'40px',borderRadius:'8px',background:'linear-gradient(135deg,#6366F1,#8B5CF6)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'18px',fontWeight:'700',flexShrink:0}}>
                    {selectedTenant.organizationName?.charAt(0)?.toUpperCase() || 'T'}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'16px',fontWeight:'700',color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selectedTenant.organizationName}</div>
                    <div style={{fontSize:'12px',color:'rgba(255,255,255,0.7)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selectedTenant.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => {setSelectedTenant(null);setActivityData(null);}}
                  style={{width:'32px',height:'32px',borderRadius:'8px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'white',cursor:'pointer',fontSize:'18px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}
                >×</button>
              </div>
              <select
                value={days}
                onChange={(e) => setDays(e.target.value)}
                style={{width:'100%',padding:'8px 12px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.1)',color:'white',fontSize:'13px'}}
              >
                <option value="7" style={{background:'#1E293B',color:'white'}}>Last 7 days</option>
                <option value="30" style={{background:'#1E293B',color:'white'}}>Last 30 days</option>
                <option value="90" style={{background:'#1E293B',color:'white'}}>Last 90 days</option>
              </select>
            </div>

            {/* Content */}
            <div style={{flex:1,overflowY:'auto',padding:'16px'}}>
              {loadingActivity ? (
                <div style={{padding:'40px',textAlign:'center',color:'#9CA3AF'}}>Loading activity...</div>
              ) : activityData ? (
                <>
                  {/* Login Stats */}
                  <div style={{marginBottom:'20px'}}>
                    <div style={{fontSize:'12px',fontWeight:'700',color:'#6B7280',textTransform:'uppercase',marginBottom:'12px'}}>Login Stats</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                      <div style={{background:'#F9FAFB',borderRadius:'8px',padding:'12px'}}>
                        <div style={{fontSize:'10px',color:'#6B7280',marginBottom:'4px'}}>Total Logins</div>
                        <div style={{fontSize:'20px',fontWeight:'700',color:'#10B981'}}>{activityData.loginStats.totalLogins}</div>
                      </div>
                      <div style={{background:'#F9FAFB',borderRadius:'8px',padding:'12px'}}>
                        <div style={{fontSize:'10px',color:'#6B7280',marginBottom:'4px'}}>Active Users</div>
                        <div style={{fontSize:'20px',fontWeight:'700',color:'#3B82F6'}}>{activityData.loginStats.activeUsers}</div>
                      </div>
                    </div>
                  </div>

                  {/* Feature Stats */}
                  <div style={{marginBottom:'20px'}}>
                    <div style={{fontSize:'12px',fontWeight:'700',color:'#6B7280',textTransform:'uppercase',marginBottom:'12px'}}>Feature Usage</div>
                    <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                      <div style={{background:'#F9FAFB',borderRadius:'8px',padding:'10px'}}>
                        <div style={{fontSize:'11px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>📊 Leads</div>
                        <div style={{display:'flex',flexDirection:'column',gap:'4px',fontSize:'11px'}}>
                          <div style={{display:'flex',justifyContent:'space-between'}}>
                            <span style={{color:'#6B7280'}}>Total Leads:</span>
                            <span style={{fontWeight:'600'}}>{activityData.featureStats.leads.total}</span>
                          </div>
                          <div style={{display:'flex',justifyContent:'space-between'}}>
                            <span style={{color:'#6B7280'}}>Converted (All Time):</span>
                            <span style={{fontWeight:'600',color:'#8B5CF6'}}>{activityData.featureStats.leads.convertedTotal}</span>
                          </div>
                          <div style={{height:'1px',background:'#E5E7EB',margin:'4px 0'}}></div>
                          <div style={{fontSize:'10px',color:'#9CA3AF',fontWeight:'600',textTransform:'uppercase'}}>Last {days} days:</div>
                          <div style={{display:'flex',justifyContent:'space-between'}}>
                            <span style={{color:'#6B7280'}}>Created:</span>
                            <span style={{fontWeight:'600',color:'#10B981'}}>{activityData.featureStats.leads.created}</span>
                          </div>
                          <div style={{display:'flex',justifyContent:'space-between'}}>
                            <span style={{color:'#6B7280'}}>Updated:</span>
                            <span style={{fontWeight:'600',color:'#3B82F6'}}>{activityData.featureStats.leads.updated}</span>
                          </div>
                          <div style={{display:'flex',justifyContent:'space-between'}}>
                            <span style={{color:'#6B7280'}}>Converted:</span>
                            <span style={{fontWeight:'600',color:'#F59E0B'}}>{activityData.featureStats.leads.convertedInPeriod}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{background:'#F9FAFB',borderRadius:'8px',padding:'10px'}}>
                        <div style={{fontSize:'11px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>🏢 Accounts</div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',fontSize:'11px'}}>
                          <div><span style={{color:'#6B7280'}}>Total:</span> <span style={{fontWeight:'600'}}>{activityData.featureStats.accounts.total}</span></div>
                          <div><span style={{color:'#6B7280'}}>Created:</span> <span style={{fontWeight:'600',color:'#10B981'}}>{activityData.featureStats.accounts.created}</span></div>
                        </div>
                      </div>

                      <div style={{background:'#F9FAFB',borderRadius:'8px',padding:'10px'}}>
                        <div style={{fontSize:'11px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>👥 Contacts</div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',fontSize:'11px'}}>
                          <div><span style={{color:'#6B7280'}}>Total:</span> <span style={{fontWeight:'600'}}>{activityData.featureStats.contacts.total}</span></div>
                          <div><span style={{color:'#6B7280'}}>Created:</span> <span style={{fontWeight:'600',color:'#10B981'}}>{activityData.featureStats.contacts.created}</span></div>
                        </div>
                      </div>

                      <div style={{background:'#F9FAFB',borderRadius:'8px',padding:'10px'}}>
                        <div style={{fontSize:'11px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>💼 Opportunities</div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',fontSize:'11px'}}>
                          <div><span style={{color:'#6B7280'}}>Total:</span> <span style={{fontWeight:'600'}}>{activityData.featureStats.opportunities.total}</span></div>
                          <div><span style={{color:'#6B7280'}}>Created:</span> <span style={{fontWeight:'600',color:'#10B981'}}>{activityData.featureStats.opportunities.created}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Login Activity */}
                  <div>
                    <div style={{fontSize:'12px',fontWeight:'700',color:'#6B7280',textTransform:'uppercase',marginBottom:'12px'}}>Recent Activity</div>
                    <div style={{display:'flex',flexDirection:'column',gap:'6px',maxHeight:'300px',overflowY:'auto'}}>
                      {activityData.recentLoginActivity.slice(0,15).map((activity, idx) => (
                        <div key={idx} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px',background:'#F9FAFB',borderRadius:'6px',fontSize:'11px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',flex:1,minWidth:0}}>
                            <div style={{width:'6px',height:'6px',borderRadius:'50%',background:activity.action==='login.success'?'#10B981':'#EF4444',flexShrink:0}}/>
                            <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                              <span style={{fontWeight:'600',color:'#111827'}}>{activity.user?.firstName} {activity.user?.lastName}</span>
                            </div>
                          </div>
                          <div style={{fontSize:'10px',color:'#9CA3AF',flexShrink:0,marginLeft:'8px'}}>
                            {new Date(activity.createdAt).toLocaleString('en-IN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{padding:'40px',textAlign:'center',color:'#9CA3AF'}}>Select a tenant to view activity</div>
              )}
            </div>
          </div>
        )}

        {/* Main Content - Right Side (Most Active Organizations) */}
        <div style={{flex:1,minWidth:0}}>
          {loadingOverall ? (
            <div style={{padding:'40px',textAlign:'center',color:'#9CA3AF'}}>Loading...</div>
          ) : overallActivity.summary ? (
            <>
            {/* Expanded Details */}
            {expandedStat && (
              <div style={{background:'#F9FAFB',borderRadius:'12px',padding:'20px',marginBottom:'24px',border:'2px solid #E5E7EB'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
                  <h3 style={{fontSize:'16px',fontWeight:'700',color:'#111827',margin:0}}>
                    {expandedStat === 'tenants' && '👥 Active Tenants Details'}
                    {expandedStat === 'logins' && '🔐 Login Breakdown by Tenant'}
                    {expandedStat === 'actions' && '⚡ Actions Breakdown by Tenant'}
                  </h3>
                  <button
                    onClick={() => setExpandedStat(null)}
                    style={{background:'white',border:'1px solid #E5E7EB',borderRadius:'6px',padding:'6px 12px',cursor:'pointer',fontSize:'12px',fontWeight:'600',color:'#6B7280'}}
                  >
                    ✕ Close
                  </button>
                </div>
                <div style={{maxHeight:'400px',overflowY:'auto'}}>
                  {expandedStat === 'tenants' && (overallActivity.tenantBreakdown || overallActivity.tenants || []).map((t, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        const tenantObj = {
                          _id: t._id,
                          organizationName: t.organizationName || t.name,
                          organizationId: t.organizationId,
                          email: t.email,
                          isActive: t.isActive,
                          isSuspended: t.isSuspended
                        };
                        handleTenantClick(tenantObj);
                      }}
                      style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px',background:'white',borderRadius:'8px',marginBottom:'8px',cursor:'pointer',border:'1px solid #E5E7EB'}}
                      onMouseEnter={(e)=>{e.currentTarget.style.background='#F0F9FF';e.currentTarget.style.borderColor='#3B82F6';}}
                      onMouseLeave={(e)=>{e.currentTarget.style.background='white';e.currentTarget.style.borderColor='#E5E7EB';}}
                    >
                      <div style={{display:'flex',alignItems:'center',gap:'12px',flex:1}}>
                        <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'linear-gradient(135deg,#3B82F6,#8B5CF6)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:'700'}}>
                          {(t.organizationName || t.name)?.charAt(0)?.toUpperCase()}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:'13px',fontWeight:'600',color:'#111827'}}>{t.organizationName || t.name}</div>
                          <div style={{fontSize:'11px',color:'#6B7280'}}>{t.loginCount || t.logins || 0} logins · {t.totalActions || 0} actions</div>
                        </div>
                      </div>
                      <Eye size={16} style={{color:'#9CA3AF'}} />
                    </div>
                  ))}
                  {expandedStat === 'logins' && (overallActivity.tenantBreakdown || overallActivity.tenants || []).sort((a,b)=>(b.loginCount||b.logins||0)-(a.loginCount||a.logins||0)).map((t, idx) => (
                    <div key={idx} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',background:'white',borderRadius:'8px',marginBottom:'6px',border:'1px solid #E5E7EB'}}>
                      <div style={{fontSize:'13px',color:'#111827',flex:1}}>{t.organizationName || t.name}</div>
                      <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                        <div style={{fontSize:'12px',color:'#6B7280'}}>{t.loginCount || t.logins || 0} logins</div>
                        <div style={{width:`${Math.min(((t.loginCount||t.logins||0)/overallActivity.summary.totalLogins)*300, 120)}px`,height:'6px',background:'#10B981',borderRadius:'3px'}}></div>
                      </div>
                    </div>
                  ))}
                  {expandedStat === 'actions' && (overallActivity.tenantBreakdown || overallActivity.tenants || []).sort((a,b)=>(b.totalActions||0)-(a.totalActions||0)).map((t, idx) => (
                    <div key={idx} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',background:'white',borderRadius:'8px',marginBottom:'6px',border:'1px solid #E5E7EB'}}>
                      <div style={{fontSize:'13px',color:'#111827',flex:1}}>{t.organizationName || t.name}</div>
                      <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                        <div style={{fontSize:'12px',color:'#6B7280'}}>{t.totalActions || 0} actions</div>
                        <div style={{width:`${Math.min(((t.totalActions||0)/overallActivity.summary.totalActions)*300, 120)}px`,height:'6px',background:'#6366F1',borderRadius:'3px'}}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most Active Tenants */}
            <div>
              <h3 style={{fontSize:'14px',fontWeight:'700',color:'#374151',marginBottom:'12px'}}>Most Active Organizations</h3>
              <div style={{display:'grid',gap:'10px'}}>
                {(overallActivity.tenantBreakdown || overallActivity.tenants || []).slice(0, 8).map((tenant, idx) => (
                  <div
                    key={tenant._id}
                    onClick={() => {
                      // Create tenant object from breakdown data
                      const tenantObj = {
                        _id: tenant._id,
                        organizationName: tenant.organizationName,
                        organizationId: tenant.organizationId,
                        email: tenant.email,
                        isActive: tenant.isActive,
                        isSuspended: tenant.isSuspended
                      };
                      handleTenantClick(tenantObj);
                    }}
                    style={{
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'space-between',
                      padding:'12px 16px',
                      background:'#F9FAFB',
                      borderRadius:'10px',
                      cursor:'pointer',
                      transition:'all 0.2s',
                      border:'1px solid #E5E7EB'
                    }}
                    onMouseEnter={(e) => {e.currentTarget.style.background='#F0F9FF';e.currentTarget.style.borderColor='#3B82F6';}}
                    onMouseLeave={(e) => {e.currentTarget.style.background='#F9FAFB';e.currentTarget.style.borderColor='#E5E7EB';}}
                  >
                    <div style={{display:'flex',alignItems:'center',gap:'12px',flex:1,minWidth:0}}>
                      <div style={{
                        width:'32px',
                        height:'32px',
                        borderRadius:'8px',
                        background:`linear-gradient(135deg,${['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444'][idx%5]},${['#2563EB','#7C3AED','#059669','#D97706','#DC2626'][idx%5]})`,
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        color:'white',
                        fontSize:'14px',
                        fontWeight:'700',
                        flexShrink:0
                      }}>
                        {(tenant.organizationName || tenant.name)?.charAt(0)?.toUpperCase() || 'T'}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:'13px',fontWeight:'600',color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tenant.organizationName || tenant.name}</div>
                        <div style={{fontSize:'11px',color:'#6B7280'}}>
                          {tenant.loginCount || tenant.logins || 0} logins · {tenant.totalActions || 0} actions
                        </div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:'8px',alignItems:'center',flexShrink:0}}>
                      {(tenant.leadsCreated || tenant.actions?.['lead.created'] || 0) > 0 && (
                        <span style={{fontSize:'10px',padding:'3px 8px',borderRadius:'6px',background:'#DBEAFE',color:'#1E40AF',fontWeight:'600'}}>
                          📊 {tenant.leadsCreated || tenant.actions?.['lead.created']}
                        </span>
                      )}
                      {(tenant.accountsCreated || tenant.actions?.['account.created'] || 0) > 0 && (
                        <span style={{fontSize:'10px',padding:'3px 8px',borderRadius:'6px',background:'#D1FAE5',color:'#065F46',fontWeight:'600'}}>
                          🏢 {tenant.accountsCreated || tenant.actions?.['account.created']}
                        </span>
                      )}
                      <Eye size={16} style={{color:'#9CA3AF'}} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={{padding:'40px',textAlign:'center',color:'#9CA3AF'}}>No activity data available</div>
        )}
        </div> {/* End Main Content */}
        </div> {/* End Two Column Layout */}
      </div> {/* End Main Container */}
    </SaasLayout>
  );
};

export default SaasActivityMonitor;
