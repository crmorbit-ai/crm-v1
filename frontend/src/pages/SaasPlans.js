import React, { useState, useEffect } from 'react';
import { getAllPlans, updatePlan } from '../services/subscriptionService';
import SaasLayout from '../components/layout/SaasLayout';

const PLAN_COLORS = {
  Free:         { g: 'linear-gradient(135deg,#475569,#64748b)', c: '#64748b', light: '#f1f5f9' },
  Basic:        { g: 'linear-gradient(135deg,#2563eb,#3b82f6)', c: '#3b82f6', light: '#eff6ff' },
  Professional: { g: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', c: '#8b5cf6', light: '#f5f3ff' },
  Enterprise:   { g: 'linear-gradient(135deg,#b45309,#f59e0b)', c: '#f59e0b', light: '#fffbeb' },
};

const FEATURE_LABELS = {
  leadManagement:    { label: 'Lead Management',    group: 'Core' },
  contactManagement: { label: 'Contact Management', group: 'Core' },
  dealTracking:      { label: 'Deal Tracking',      group: 'Core' },
  taskManagement:    { label: 'Task Management',    group: 'Core' },
  emailIntegration:  { label: 'Email Integration',  group: 'Advanced' },
  customFields:      { label: 'Custom Fields',      group: 'Advanced' },
  crossOrgHierarchy: { label: 'Cross-Org Hierarchy',   group: 'Premium' },
  salesMonetization: { label: 'Sales Monetization',    group: 'Premium' },
};

const LIMIT_LABELS = {
  users:        'Max Users',
  leads:        'Max Leads',
  contacts:     'Max Contacts',
  deals:        'Max Deals',
  storage:      'Storage (MB)',
  emailsPerDay: 'Emails / Day',
};

const GROUP_COLORS = { Core: '#10b981', Advanced: '#6366f1', Premium: '#f59e0b' };

/* ── Toggle switch ── */
const Toggle = ({ checked, onChange, disabled }) => (
  <div
    onClick={() => !disabled && onChange(!checked)}
    style={{
      width: 40, height: 22, borderRadius: 11, cursor: disabled ? 'not-allowed' : 'pointer',
      background: checked ? '#10b981' : '#e2e8f0', transition: 'all 0.2s', position: 'relative',
      flexShrink: 0, opacity: disabled ? 0.5 : 1,
    }}
  >
    <div style={{
      position: 'absolute', top: 3, left: checked ? 21 : 3,
      width: 16, height: 16, borderRadius: '50%', background: '#fff',
      boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s',
    }} />
  </div>
);

const SaasPlans = () => {
  const [plans, setPlans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(null); // planId being saved
  const [drafts, setDrafts]       = useState({});   // { planId: { features: {}, limits: {} } }
  const [toast, setToast]         = useState({ msg: '', ok: true });
  const [activePlan, setActivePlan] = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: '', ok: true }), 3000);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getAllPlans();
        const list = res.data || res.plans || res || [];
        setPlans(list);
        if (list.length) setActivePlan(list[0]._id);
        // Init drafts
        const d = {};
        list.forEach(p => {
          d[p._id] = {
            features: { ...p.features },
            limits: { ...p.limits },
          };
        });
        setDrafts(d);
      } catch (e) {
        showToast('Failed to load plans', false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setFeature = (planId, key, val) => {
    setDrafts(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        features: { ...prev[planId].features, [key]: val },
      },
    }));
  };

  const setLimit = (planId, key, val) => {
    setDrafts(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        limits: { ...prev[planId].limits, [key]: Number(val) },
      },
    }));
  };

  const savePlan = async (planId) => {
    try {
      setSaving(planId);
      await updatePlan(planId, {
        features: drafts[planId].features,
        limits: drafts[planId].limits,
      });
      // Update local plans state
      setPlans(prev => prev.map(p =>
        p._id === planId
          ? { ...p, features: drafts[planId].features, limits: drafts[planId].limits }
          : p
      ));
      showToast('Plan saved successfully');
    } catch (e) {
      showToast(e?.message || 'Save failed', false);
    } finally {
      setSaving(null);
    }
  };

  const currentPlan = plans.find(p => p._id === activePlan);
  const draft = activePlan ? drafts[activePlan] : null;

  const featuresByGroup = Object.entries(FEATURE_LABELS).reduce((acc, [key, val]) => {
    if (!acc[val.group]) acc[val.group] = [];
    acc[val.group].push({ key, ...val });
    return acc;
  }, {});

  if (loading) return (
    <SaasLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 14 }}>
        <div style={{ width: 44, height: 44, border: '4px solid #e0e7ff', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Loading plans...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </SaasLayout>
  );

  return (
    <SaasLayout>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fade { from { opacity:0;transform:translateY(8px) } to { opacity:1;transform:translateY(0) } }
        .spFade { animation: fade 0.25s ease; }
        .spPlanTab:hover { opacity: 0.85 !important; transform: translateY(-1px) !important; }
        .spRow:hover { background: #f8fafc !important; }
      `}</style>

      {/* Toast */}
      {toast.msg && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 9999,
          padding: '12px 20px', borderRadius: 12,
          background: toast.ok ? '#dcfce7' : '#fee2e2',
          color: toast.ok ? '#166534' : '#991b1b',
          fontWeight: 700, fontSize: 13,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        }}>
          {toast.ok ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#0f0c29 0%,#1a1654 40%,#0d1b4b 100%)',
        borderRadius: 20, marginBottom: 20, padding: '20px 24px',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(79,70,229,0.3)',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -30, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.3) 0%,transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 5 }}>SAAS Admin</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
            Subscription <span style={{ background: 'linear-gradient(90deg,#a78bfa,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Plans</span>
          </h2>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
            Configure features and limits for each subscription plan
          </div>
        </div>
      </div>

      {/* Plan tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {plans.map(p => {
          const pc = PLAN_COLORS[p.name] || PLAN_COLORS.Free;
          const isActive = activePlan === p._id;
          return (
            <button
              key={p._id}
              className="spPlanTab"
              onClick={() => setActivePlan(p._id)}
              style={{
                padding: '10px 22px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: isActive ? pc.g : '#fff',
                color: isActive ? '#fff' : pc.c,
                fontWeight: 800, fontSize: 13,
                boxShadow: isActive ? `0 4px 16px ${pc.c}44` : '0 2px 8px rgba(0,0,0,0.06)',
                border: isActive ? 'none' : `2px solid ${pc.c}33`,
                transition: 'all 0.2s',
              }}
            >
              {p.displayName || p.name}
              {p.isPopular && <span style={{ marginLeft: 6, fontSize: 9, background: '#fff3', padding: '2px 6px', borderRadius: 8 }}>⭐ Popular</span>}
            </button>
          );
        })}
      </div>

      {currentPlan && draft && (
        <div className="spFade" style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* LEFT: Features */}
          <div style={{ flex: '1 1 420px', background: '#fff', borderRadius: 18, border: '1.5px solid #e8edf5', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            {/* Plan header */}
            <div style={{
              background: PLAN_COLORS[currentPlan.name]?.g || '#6366f1',
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{currentPlan.displayName || currentPlan.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{currentPlan.description}</div>
              </div>
              <button
                onClick={() => savePlan(currentPlan._id)}
                disabled={!!saving}
                style={{
                  padding: '9px 20px', borderRadius: 12, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                  background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 800, fontSize: 12,
                  backdropFilter: 'blur(4px)', transition: 'all 0.2s',
                }}
              >
                {saving === currentPlan._id ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            </div>

            {/* Features by group */}
            <div style={{ padding: '16px 20px' }}>
              {Object.entries(featuresByGroup).map(([group, items]) => (
                <div key={group} style={{ marginBottom: 20 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 800, color: GROUP_COLORS[group] || '#64748b',
                    textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <div style={{ width: 20, height: 2, background: GROUP_COLORS[group], borderRadius: 2 }} />
                    {group} Features
                  </div>

                  {items.map(({ key, label }) => {
                    const val = draft.features[key] ?? false;
                    return (
                      <div
                        key={key}
                        className="spRow"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 12px', borderRadius: 10, marginBottom: 4,
                          background: val ? '#f0fdf4' : '#fafafa',
                          border: `1px solid ${val ? '#bbf7d0' : '#f1f5f9'}`,
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13 }}>{val ? '✅' : '⬜'}</span>
                          <span style={{ fontSize: 13, fontWeight: val ? 700 : 500, color: val ? '#166534' : '#64748b' }}>
                            {label}
                          </span>
                          {key === 'crossOrgHierarchy' && (
                            <span style={{ fontSize: 9, background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', padding: '1px 6px', borderRadius: 8, fontWeight: 800 }}>
                              NEW
                            </span>
                          )}
                        </div>
                        <Toggle
                          checked={val}
                          onChange={v => setFeature(currentPlan._id, key, v)}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Limits */}
          <div style={{ width: 280, flexShrink: 0, background: '#fff', borderRadius: 18, border: '1.5px solid #e8edf5', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Plan Limits</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>-1 = Unlimited</div>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(LIMIT_LABELS).map(([key, label]) => (
                <div key={key}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>{label}</div>
                  <input
                    type="number"
                    value={draft.limits[key] ?? ''}
                    onChange={e => setLimit(currentPlan._id, key, e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 10,
                      border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 700,
                      color: '#0f172a', outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              ))}
            </div>

            {/* Plan comparison quick view */}
            <div style={{ margin: '0 18px 18px', padding: '12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e8edf5' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>All Plans — Feature Count</div>
              {plans.map(p => {
                const d = drafts[p._id];
                const count = d ? Object.values(d.features).filter(Boolean).length : 0;
                const total = Object.keys(FEATURE_LABELS).length;
                const pc = PLAN_COLORS[p.name] || PLAN_COLORS.Free;
                return (
                  <div key={p._id} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>{p.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: pc.c }}>{count}/{total}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 4, background: '#e8edf5', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(count / total) * 100}%`, background: pc.g, borderRadius: 4, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </SaasLayout>
  );
};

export default SaasPlans;
