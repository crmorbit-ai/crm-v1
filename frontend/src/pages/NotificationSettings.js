import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import notificationService from '../services/notificationService';

const NOTIF_ITEMS = [
  { key: 'taskNotifications',          icon: '📋', label: 'Task Notifications',           desc: 'Alerts when a task is assigned, completed or overdue' },
  { key: 'leadNotifications',          icon: '🧲', label: 'Lead Notifications',           desc: 'When a lead is created, assigned or status changes' },
  { key: 'opportunityNotifications',   icon: '💼', label: 'Opportunity Notifications',    desc: 'When stage changes or deal is won/lost' },
  { key: 'contactNotifications',       icon: '👤', label: 'Contact Notifications',        desc: 'When a new contact is added' },
  { key: 'accountNotifications',       icon: '🏢', label: 'Account Notifications',        desc: 'When a new account is added' },
  { key: 'supportTicketNotifications', icon: '🎫', label: 'Support Ticket Notifications', desc: 'New ticket created or status updated' },
  { key: 'meetingReminders',           icon: '📅', label: 'Meeting Reminders',            desc: 'Reminder before a scheduled meeting' },
  { key: 'invoiceNotifications',       icon: '💰', label: 'Invoice Notifications',        desc: 'When an invoice is overdue or created' },
  { key: 'emailNotifications',         icon: '📧', label: 'Email Notifications',          desc: 'Also send email along with in-app notification' },
];

const DEFAULT_PREFS = {
  taskNotifications: true, leadNotifications: true, opportunityNotifications: true,
  supportTicketNotifications: true, meetingReminders: true, contactNotifications: true,
  accountNotifications: true, invoiceNotifications: true, emailNotifications: false,
};

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null); // which key is currently saving
  const [toastKey, setToastKey] = useState(null);   // which key just got confirmed
  const toastTimer = useRef(null);

  useEffect(() => {
    notificationService.getPreferences()
      .then(res => {
        const data = res?.data?.data ?? res?.data;
        if (data && typeof data === 'object') setPrefs(prev => ({ ...prev, ...data }));
      })
      .catch(err => console.error('loadNotifPrefs:', err))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key) => {
    const newVal = !prefs[key];
    setPrefs(prev => ({ ...prev, [key]: newVal }));
    setSavingKey(key);
    try {
      const updated = { ...prefs, [key]: newVal };
      await notificationService.updatePreferences(updated);
      setToastKey(key);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToastKey(null), 2000);
    } catch {
      // revert on failure
      setPrefs(prev => ({ ...prev, [key]: !newVal }));
    } finally {
      setSavingKey(null);
    }
  };

  const enabledCount = Object.values(prefs).filter(Boolean).length;
  const totalCount = NOTIF_ITEMS.length;

  return (
    <DashboardLayout title="Notification Settings">
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .notif-row { transition: background 0.15s; }
        .notif-row:hover { background: #fafbff; }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ background:'linear-gradient(135deg, rgb(18,80,227) 0%, rgb(88,102,125) 50%, rgb(0,0,0) 100%)', borderRadius:'16px', padding:'24px 28px', marginBottom:'24px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'180px', height:'180px', borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-20px', left:'40%', width:'120px', height:'120px', borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'16px', position:'relative' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>🔔</div>
              <h2 style={{ margin:0, fontSize:'20px', fontWeight:'800', color:'#fff', letterSpacing:'-0.3px' }}>Notification Settings</h2>
            </div>
            <p style={{ margin:0, fontSize:'13px', color:'rgba(255,255,255,0.55)' }}>
              Toggle any switch — changes save instantly
            </p>
          </div>

          {/* Live progress bar stat */}
          <div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'14px', padding:'14px 20px', minWidth:'180px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'8px' }}>
              <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.6)', fontWeight:'600' }}>Active</span>
              <span style={{ fontSize:'18px', fontWeight:'800', color:'#fff' }}>{enabledCount}<span style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', fontWeight:'400' }}>/{totalCount}</span></span>
            </div>
            <div style={{ height:'6px', borderRadius:'99px', background:'rgba(255,255,255,0.15)', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:'99px', background:'linear-gradient(90deg,#a5b4fc,#818cf8)', width:`${(enabledCount/totalCount)*100}%`, transition:'width 0.3s ease' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Card ── */}
      <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e5e7eb', overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', maxWidth:'700px' }}>

        {/* Card header */}
        <div style={{ padding:'16px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:'14px', fontWeight:'700', color:'#0f172a' }}>Preferences</div>
            <div style={{ fontSize:'12px', color:'#94a3b8', marginTop:'1px' }}>Changes are saved automatically</div>
          </div>
          <div style={{ display:'flex', gap:'6px' }}>
            <button
              onClick={() => {
                const all = {}; NOTIF_ITEMS.forEach(i => { all[i.key] = true; });
                const updated = { ...prefs, ...all };
                setPrefs(updated);
                notificationService.updatePreferences(updated).catch(() => {});
              }}
              style={{ padding:'5px 11px', fontSize:'11px', fontWeight:'700', borderRadius:'6px', border:'1px solid #e2e8f0', background:'#f8fafc', color:'#374151', cursor:'pointer', letterSpacing:'0.2px' }}>
              All On
            </button>
            <button
              onClick={() => {
                const none = {}; NOTIF_ITEMS.forEach(i => { none[i.key] = false; });
                const updated = { ...prefs, ...none };
                setPrefs(updated);
                notificationService.updatePreferences(updated).catch(() => {});
              }}
              style={{ padding:'5px 11px', fontSize:'11px', fontWeight:'700', borderRadius:'6px', border:'1px solid #e2e8f0', background:'#f8fafc', color:'#374151', cursor:'pointer', letterSpacing:'0.2px' }}>
              All Off
            </button>
          </div>
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding:'48px', textAlign:'center' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'50%', border:'3px solid #6366f1', borderTopColor:'transparent', margin:'0 auto 12px', animation:'spin 0.8s linear infinite' }} />
            <div style={{ fontSize:'13px', color:'#94a3b8' }}>Loading preferences...</div>
          </div>
        ) : (
          NOTIF_ITEMS.map((item, i) => {
            const isOn = prefs[item.key];
            const isSaving = savingKey === item.key;
            const justSaved = toastKey === item.key;
            return (
              <div key={item.key} className="notif-row"
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'15px 24px', borderBottom: i < NOTIF_ITEMS.length - 1 ? '1px solid #f8fafc' : 'none', cursor:'pointer', animation:`fadeInUp 0.15s ease ${i * 0.03}s both` }}
                onClick={() => !isSaving && toggle(item.key)}>

                {/* Left: icon + text */}
                <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                  <div style={{ width:'42px', height:'42px', borderRadius:'11px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'19px', transition:'all 0.2s',
                    background: isOn ? '#ede9fe' : '#f1f5f9' }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize:'14px', fontWeight:'600', color: isOn ? '#0f172a' : '#94a3b8', transition:'color 0.2s' }}>{item.label}</div>
                    <div style={{ fontSize:'12px', color:'#cbd5e1', marginTop:'2px' }}>{item.desc}</div>
                  </div>
                </div>

                {/* Right: status text + toggle */}
                <div style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
                  <span style={{ fontSize:'11px', fontWeight:'600', letterSpacing:'0.3px', minWidth:'40px', textAlign:'right', transition:'color 0.2s',
                    color: isSaving ? '#94a3b8' : justSaved ? '#16a34a' : isOn ? '#6366f1' : '#cbd5e1' }}>
                    {isSaving ? '...' : justSaved ? '✓' : isOn ? 'ON' : 'OFF'}
                  </span>
                  {/* Toggle pill */}
                  <div style={{ width:'48px', height:'26px', borderRadius:'999px', position:'relative', flexShrink:0, transition:'background 0.25s',
                    background: isSaving ? '#a5b4fc' : isOn ? '#6366f1' : '#e2e8f0',
                    boxShadow: isOn && !isSaving ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                    cursor: isSaving ? 'wait' : 'pointer' }}>
                    <span style={{ position:'absolute', top:'3px', width:'20px', height:'20px', borderRadius:'50%', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,0.2)', transition:'left 0.25s cubic-bezier(0.4,0,0.2,1)',
                      left: isOn ? '25px' : '3px',
                      animation: isSaving ? 'pulse 0.6s infinite' : 'none' }} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
