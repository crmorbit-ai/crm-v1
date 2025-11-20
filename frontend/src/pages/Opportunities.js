import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';
import '../styles/crm.css';

const Opportunities = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);

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
  }, []);

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

  return (
    <DashboardLayout title="Opportunities - Kanban View">
      {loading ? (
        <div style={{padding:'40px',textAlign:'center'}}>Loading...</div>
      ) : (
        <div style={{display:'flex',gap:'12px',overflowX:'auto',padding:'20px 0',minHeight:'75vh'}}>
          {stages.map(stage => {
            const stageOpps = getOpportunitiesByStage(stage.name);
            const total = getTotalByStage(stage.name);

            return (
              <div
                key={stage.name}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.name)}
                style={{
                  minWidth:'280px',
                  maxWidth:'280px',
                  background:'#F9FAFB',
                  borderRadius:'8px',
                  padding:'12px',
                  display:'flex',
                  flexDirection:'column'
                }}
              >
                <div style={{marginBottom:'12px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                    <h3 style={{fontSize:'13px',fontWeight:'600',color:'#111827',margin:0}}>
                      {stage.name}
                    </h3>
                    <span style={{
                      fontSize:'11px',
                      fontWeight:'700',
                      color:'white',
                      background:stage.color,
                      padding:'2px 6px',
                      borderRadius:'10px'
                    }}>
                      {stage.percentage}%
                    </span>
                  </div>

                  <div style={{fontSize:'12px',color:'#6B7280',marginBottom:'8px'}}>
                    Rs. {total.toLocaleString()}
                  </div>

                  <div style={{height:'4px',background:'#E5E7EB',borderRadius:'2px',overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${stage.percentage}%`,background:stage.color}}></div>
                  </div>
                </div>

                <div style={{display:'flex',flexDirection:'column',gap:'8px',flex:1,overflowY:'auto'}}>
                  {stageOpps.length === 0 ? (
                    <div style={{
                      padding:'20px',
                      textAlign:'center',
                      color:'#9CA3AF',
                      fontSize:'12px',
                      border:'2px dashed #E5E7EB',
                      borderRadius:'6px',
                      background:'white'
                    }}>
                      No deals
                    </div>
                  ) : (
                    stageOpps.map(opp => (
                      <div
                        key={opp._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, opp)}
                        style={{
                          background:'white',
                          borderRadius:'6px',
                          padding:'10px',
                          cursor:'grab',
                          border:'1px solid #E5E7EB',
                          transition:'all 0.2s'
                        }}
                        onMouseEnter={(e)=>{
                          e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e)=>{
                          e.currentTarget.style.boxShadow='none';
                        }}
                      >
                        <h4 style={{fontSize:'13px',fontWeight:'600',marginBottom:'6px',color:'#111827',lineHeight:'1.3'}}>
                          {opp.opportunityName}
                        </h4>

                        <p style={{fontSize:'16px',fontWeight:'700',color:'#059669',marginBottom:'8px'}}>
                          Rs. {opp.amount?.toLocaleString() || '0'}
                        </p>

                        {opp.account && (
                          <div style={{fontSize:'11px',color:'#6B7280',marginBottom:'4px'}}>
                            🏢 {opp.account.accountName}
                          </div>
                        )}

                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'6px',borderTop:'1px solid #F3F4F6'}}>
                          <span style={{fontSize:'10px',color:'#9CA3AF'}}>
                            {new Date(opp.closeDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}
                          </span>
                          {opp.owner && (
                            <span style={{fontSize:'10px',color:'white',background:'#6B7280',padding:'2px 5px',borderRadius:'8px'}}>
                              {opp.owner.firstName?.charAt(0)}{opp.owner.lastName?.charAt(0)}
                            </span>
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