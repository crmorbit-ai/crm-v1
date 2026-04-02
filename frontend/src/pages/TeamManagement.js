import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { roleService } from '../services/roleService';
import { groupService } from '../services/groupService';
import DashboardLayout from '../components/layout/DashboardLayout';

const FEATURES = [
  { slug: 'user_management',           name: 'Users',                 category: 'Access' },
  { slug: 'role_management',           name: 'Roles',                 category: 'Access' },
  { slug: 'group_management',          name: 'Groups',                category: 'Access' },
  { slug: 'lead_management',           name: 'Leads',                 category: 'CRM' },
  { slug: 'contact_management',        name: 'Contacts',              category: 'CRM' },
  { slug: 'account_management',        name: 'Accounts',              category: 'CRM' },
  { slug: 'opportunity_management',    name: 'Opportunities',         category: 'CRM' },
  { slug: 'data_center',               name: 'Customers',             category: 'CRM' },
  { slug: 'quotation_management',      name: 'Quotations',            category: 'Sales' },
  { slug: 'invoice_management',        name: 'Invoices',              category: 'Sales' },
  { slug: 'purchase_order_management', name: 'Purchase Orders',       category: 'Sales' },
  { slug: 'rfi_management',            name: 'RFI',                   category: 'Sales' },
  { slug: 'product_management',        name: 'Products',              category: 'Product' },
  { slug: 'task_management',           name: 'Tasks',                 category: 'Tasks' },
  { slug: 'meeting_management',        name: 'Meetings',              category: 'Tasks' },
  { slug: 'call_management',           name: 'Calls',                 category: 'Tasks' },
  { slug: 'email_management',          name: 'Emails',                category: 'Tasks' },
  { slug: 'subscription_management',   name: 'Subscription & Billing',category: 'Account' },
  { slug: 'field_management',          name: 'Manage Fields',         category: 'Customization' },
  { slug: 'audit_logs',                name: 'Audit Logs',            category: 'Data' },
];
const ACTIONS = ['create', 'read', 'update', 'delete', 'manage', 'import', 'export'];

const AVATAR_COLORS = [
  ['#7c3aed','#a78bfa'],['#2563eb','#60a5fa'],['#059669','#34d399'],
  ['#dc2626','#f87171'],['#d97706','#fbbf24'],['#db2777','#f472b6'],
  ['#0891b2','#38bdf8'],['#7c3aed','#ec4899'],
];
const avGrad = n => { const i = (n?.charCodeAt(0)||0) % AVATAR_COLORS.length; return `linear-gradient(135deg,${AVATAR_COLORS[i][0]},${AVATAR_COLORS[i][1]})`; };

const TYPE_CFG = {
  TENANT_ADMIN:   { label:'Admin',   c:'#92400e', bg:'#fffbeb', b:'#fcd34d', dot:'#f59e0b' },
  TENANT_MANAGER: { label:'Manager', c:'#5b21b6', bg:'#f5f3ff', b:'#c4b5fd', dot:'#8b5cf6' },
  TENANT_USER:    { label:'User',    c:'#1e40af', bg:'#eff6ff', b:'#bfdbfe', dot:'#3b82f6' },
};

const SVG_EYE_ON  = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const SVG_EYE_OFF = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const SVG_COPY = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const SVG_CHECK = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

const Label   = ({children}) => <div style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.7px',marginBottom:6}}>{children}</div>;
const Inp     = ({style={}, ...p}) => <input {...p} className="xInp" style={{width:'100%',padding:'10px 13px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:14,color:'#0f172a',background:'#fff',outline:'none',boxSizing:'border-box',...style}} />;
const PriBtn  = ({children,style={}, ...p}) => <button {...p} className="xPriBtn" style={{width:'100%',padding:'12px',border:'none',borderRadius:11,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,boxShadow:'0 4px 14px rgba(79,70,229,0.35)',transition:'all 0.2s',marginTop:8,...style}}>{children}</button>;
const CopyBtn = ({fkey, val, copied, onCopy, style={}}) => (
  <button type="button" title="Copy" onClick={()=>onCopy(fkey, val)}
    style={{position:'absolute',right:7,top:'50%',transform:'translateY(-50%)',
      background:copied===fkey?'#dcfce7':'#f8fafc',border:`1px solid ${copied===fkey?'#86efac':'#cbd5e1'}`,
      borderRadius:5,cursor:'pointer',color:copied===fkey?'#16a34a':'#475569',
      width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',
      transition:'all 0.15s',flexShrink:0,...style}}>
    {copied===fkey?SVG_CHECK:SVG_COPY}
  </button>
);
const CopyBtnInline = ({fkey, val, copied, onCopy}) => (
  <button type="button" title="Copy" onClick={()=>onCopy(fkey, val)}
    style={{background:copied===fkey?'#dcfce7':'#f8fafc',border:`1px solid ${copied===fkey?'#86efac':'#cbd5e1'}`,
      borderRadius:5,cursor:'pointer',color:copied===fkey?'#16a34a':'#475569',
      width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',
      transition:'all 0.15s',flexShrink:0}}>
    {copied===fkey?SVG_CHECK:SVG_COPY}
  </button>
);

const TeamManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab]     = useState('users');
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [users, setUsers]             = useState([]);
  const [roles, setRoles]             = useState([]);
  const [groups, setGroups]           = useState([]);
  const [showPanel, setShowPanel]     = useState(false);
  const [panelMode, setPanelMode]     = useState('user');
  const [editingItem, setEditingItem] = useState(null);
  const [showRoleDD, setShowRoleDD]   = useState(false);
  const [showGroupDD, setShowGroupDD] = useState(false);
  const [userStep, setUserStep]       = useState(1);
  const [subStep, setSubStep]         = useState(null);
  const [qRole, setQRole]   = useState({ name:'', description:'', permissions:[], forUserTypes:['TENANT_USER','TENANT_MANAGER'] });
  const [qGroup, setQGroup] = useState({ name:'', description:'' });
  const [userForm, setUserForm] = useState({ firstName:'', lastName:'', email:'', personalEmail:'', officeEmail:'', password:'', userType:'TENANT_USER', phone:'', alternatePhone:'', loginName:'', department:'', subDepartment:'', reportingManager:'', viewingPin:'', roles:[], groups:[] });
  const [copied, setCopied] = useState('');
  const copyVal = (key, val) => { if(!val) return; navigator.clipboard.writeText(val).then(()=>{ setCopied(key); setTimeout(()=>setCopied(''),1500); }); };
  const [bulkModal, setBulkModal]     = useState(false);
  const [bulkRows, setBulkRows]       = useState([]);
  const [bulkError, setBulkError]     = useState('');
  const [bulkResult, setBulkResult]   = useState(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [reportTab, setReportTab]       = useState('activity');
  const [showPwd, setShowPwd] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [roleForm, setRoleForm]   = useState({ name:'', description:'', permissions:[], forUserTypes:['TENANT_USER','TENANT_MANAGER'] });
  const [groupForm, setGroupForm] = useState({ name:'', description:'', members:[] });
  const [submitting, setSubmitting] = useState(false);
  const [resetModal, setResetModal] = useState({ open:false, userId:null, userName:'' });
  const [resetForm, setResetForm]   = useState({ newPassword:'', confirmPassword:'' });
  const [showRPwd, setShowRPwd]     = useState(false);
  const [search, setSearch]           = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [panelWidth, setPanelWidth]   = useState(380);
  const [dragging, setDragging]       = useState(false);
  const [dragStartX, setDragStartX]   = useState(0);
  const [dragStartW, setDragStartW]   = useState(380);

  useEffect(() => {
    if (!dragging) return;
    const onMove = e => setPanelWidth(Math.max(280, Math.min(560, dragStartW + e.clientX - dragStartX)));
    const onUp   = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, dragStartX, dragStartW]);

  const startDrag = e => { e.preventDefault(); setDragging(true); setDragStartX(e.clientX); setDragStartW(panelWidth); };

  const ALL = FEATURES.map(f=>f.slug);
  const UP  = ALL.map(f=>({ feature:f, actions:['read'] }));
  const MP  = ALL.map(f=>({ feature:f, actions:['create','read','update'] }));
  const AP  = ALL.map(f=>({ feature:f, actions:['create','read','update','delete','manage'] }));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ur,rr,gr] = await Promise.all([
        userService.getUsers({limit:100}),
        roleService.getRoles({limit:100}),
        groupService.getGroups({limit:100}),
      ]);
      setUsers(ur.users||[]);
      const cr = (rr.roles||[]).filter(r=>r.roleType!=='system');
      const fg = gr.groups||[];
      const eU=cr.find(r=>r.name==='User'), eM=cr.find(r=>r.name==='Manager'), eA=cr.find(r=>r.name==='Admin');
      const up = (ex,d) => ex ? roleService.updateRole(ex._id,{permissions:d.permissions,forUserTypes:d.forUserTypes,level:d.level}).catch(()=>{}) : roleService.createRole(d).catch(()=>{});
      await Promise.all([
        up(eU,{name:'User',slug:'user',description:'Read-only',permissions:UP,forUserTypes:['TENANT_USER'],level:10}),
        up(eM,{name:'Manager',slug:'manager',description:'Create/read/update',permissions:MP,forUserTypes:['TENANT_USER','TENANT_MANAGER'],level:50}),
        up(eA,{name:'Admin',slug:'admin',description:'Full access',permissions:AP,forUserTypes:['TENANT_USER','TENANT_MANAGER'],level:100}),
        !fg.some(g=>g.name==='Monitoring Group') && groupService.createGroup({name:'Monitoring Group',slug:'monitoring-group',description:'Default monitoring group',members:[]}).catch(()=>{}),
      ]);
      const [rr2,gr2] = await Promise.all([roleService.getRoles({limit:100}),groupService.getGroups({limit:100})]);
      setRoles((rr2.roles||[]).filter(r=>r.roleType!=='system'));
      setGroups(gr2.groups||[]);
    } catch(e) { if(e?.isPermissionDenied) return; setError('Failed to load data'); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{ loadData(); },[loadData]);

  const showMsg = (m,err=false) => { err?setError(m):setSuccess(m); setTimeout(()=>{setError('');setSuccess('');},3000); };
  const closePanel = () => { setShowPanel(false);setEditingItem(null);setShowRoleDD(false);setShowGroupDD(false);setSubmitting(false);setUserStep(1);setSubStep(null); };

  const openUserPanel = (u=null) => {
    setPanelMode('user'); setEditingItem(u); setUserStep(1); setSubStep(null);
    setShowRoleDD(false); setShowGroupDD(false); setShowPwd(false); setShowPin(false);
    const ug = u ? groups.filter(g=>g.members?.some(m=>(m._id||m)===u._id)).map(g=>g._id) : [];
    setUserForm(u
      ? {firstName:u.firstName,lastName:u.lastName,email:u.email,personalEmail:u.personalEmail||'',officeEmail:u.officeEmail||'',password:'',userType:u.userType,phone:u.phone||'',alternatePhone:u.alternatePhone||'',loginName:u.loginName||'',department:u.department||'',subDepartment:u.subDepartment||'',reportingManager:u.reportingManager?._id||u.reportingManager||'',viewingPin:'',roles:u.roles?.map(r=>r._id)||[],groups:ug}
      : {firstName:'',lastName:'',email:'',personalEmail:'',officeEmail:'',password:'',userType:'TENANT_USER',phone:'',alternatePhone:'',loginName:'',department:'',subDepartment:'',reportingManager:'',viewingPin:'',roles:[],groups:[]});
    setShowPanel(true);
  };
  const openRolePanel  = (r=null) => { setPanelMode('role');  setEditingItem(r); setRoleForm(r?{name:r.name,description:r.description||'',permissions:r.permissions||[],forUserTypes:r.forUserTypes||['TENANT_USER','TENANT_MANAGER']}:{name:'',description:'',permissions:[],forUserTypes:['TENANT_USER','TENANT_MANAGER']}); setShowPanel(true); };
  const openGroupPanel = (g=null) => { setPanelMode('group'); setEditingItem(g); setGroupForm(g?{name:g.name,description:g.description||'',members:g.members?.map(m=>m._id)||[]}:{name:'',description:'',members:[]}); setShowPanel(true); };

  const handleUserSubmit = async e => {
    e.preventDefault(); if(submitting) return; setSubmitting(true);
    try {
      let uid;
      if(editingItem){ await userService.updateUser(editingItem._id,userForm); uid=editingItem._id; showMsg('User updated!'); }
      else { const r=await userService.createUser({...userForm,tenant:user.tenant?._id}); uid=r.user?._id||r._id; showMsg('User created!'); }
      if(uid) await userService.assignGroups(uid,userForm.groups);
      closePanel(); loadData();
    } catch(e){ if(e?.isPermissionDenied) return; showMsg(e.message||'Error',true); }
    finally { setSubmitting(false); }
  };
  const handleDeleteUser  = async u => { if(!window.confirm(`Delete ${u.firstName}?`)) return; try{ await userService.deleteUser(u._id);  showMsg('Deleted!'); loadData(); }catch(e){ if(e?.isPermissionDenied)return; showMsg(e.message,true); } };
  const handleDeleteRole  = async r => { if(!window.confirm(`Delete "${r.name}"?`)) return; try{ await roleService.deleteRole(r._id);   showMsg('Deleted!'); loadData(); }catch(e){ if(e?.isPermissionDenied)return; showMsg(e.message,true); } };
  const handleDeleteGroup = async g => { if(!window.confirm(`Delete "${g.name}"?`)) return; try{ await groupService.deleteGroup(g._id); showMsg('Deleted!'); loadData(); }catch(e){ if(e?.isPermissionDenied)return; showMsg(e.message,true); } };

  const toggleActive = async (u) => {
    const action = u.isActive ? 'deactivate' : 'activate';
    if(!window.confirm(`${u.isActive?'Deactivate':'Activate'} user "${u.firstName} ${u.lastName}"?`)) return;
    try {
      await userService.updateUser(u._id, { isActive: !u.isActive });
      showMsg(`User ${action}d successfully`);
      loadData();
      if(selectedUser?._id === u._id) setSelectedUser(p => ({...p, isActive: !u.isActive}));
    } catch(e) { if(e?.isPermissionDenied) return; showMsg(e.message||'Failed', true); }
  };

  const openResetModal = u => { setResetModal({open:true,userId:u._id,userName:`${u.firstName} ${u.lastName}`}); setResetForm({newPassword:'',confirmPassword:''}); setShowRPwd(false); };
  const handleReset = async e => {
    e.preventDefault();
    if(resetForm.newPassword.length<4){ showMsg('Min 4 characters',true); return; }
    if(resetForm.newPassword!==resetForm.confirmPassword){ showMsg('Passwords do not match',true); return; }
    try{ setSubmitting(true); await userService.resetUserPassword(resetModal.userId,resetForm.newPassword); showMsg(`Password reset for ${resetModal.userName}`); setResetModal({open:false,userId:null,userName:''}); }
    catch(e){ if(e?.isPermissionDenied)return; showMsg(e.message||'Failed',true); }
    finally{ setSubmitting(false); }
  };

  const handleRoleSubmit = async e => {
    e.preventDefault();
    try{ const d={...roleForm,slug:roleForm.name.toLowerCase().replace(/\s+/g,'_'),forUserTypes:roleForm.forUserTypes||['TENANT_USER','TENANT_MANAGER']}; editingItem?await roleService.updateRole(editingItem._id,d):await roleService.createRole(d); showMsg(editingItem?'Role updated!':'Role created!'); closePanel(); loadData(); }
    catch(e){ if(e?.isPermissionDenied)return; showMsg(e.message,true); }
  };
  const handleGroupSubmit = async e => {
    e.preventDefault();
    try{ const d={...groupForm,slug:groupForm.name.toLowerCase().replace(/\s+/g,'_')}; editingItem?await groupService.updateGroup(editingItem._id,d):await groupService.createGroup(d); showMsg(editingItem?'Group updated!':'Group created!'); closePanel(); loadData(); }
    catch(e){ if(e?.isPermissionDenied)return; showMsg(e.message,true); }
  };

  const togglePerm = (form,setForm) => (feature,action) => {
    setForm(p=>{ const ps=[...p.permissions],i=ps.findIndex(x=>x.feature===feature);
      if(i===-1) ps.push({feature,actions:[action]});
      else{ const a=[...ps[i].actions],ai=a.indexOf(action); if(ai===-1)a.push(action);else a.splice(ai,1); if(!a.length)ps.splice(i,1);else ps[i]={...ps[i],actions:a}; }
      return{...p,permissions:ps};
    });
  };
  const hasPerm  = (f,a) => roleForm.permissions.find(p=>p.feature===f)?.actions?.includes(a)||false;
  const hasQPerm = (f,a) => qRole.permissions.find(p=>p.feature===f)?.actions?.includes(a)||false;

  const handleQRole = async e => {
    e.preventDefault();
    try{ const d={...qRole,slug:qRole.name.toLowerCase().replace(/\s+/g,'_')}; const r=await roleService.createRole(d); const id=r.role?._id||r._id; await loadData(); if(id)setUserForm(p=>({...p,roles:[...p.roles,id]})); setSubStep(null); setQRole({name:'',description:'',permissions:[],forUserTypes:['TENANT_USER','TENANT_MANAGER']}); showMsg('Role created!'); }
    catch(e){ if(e?.isPermissionDenied)return; showMsg(e.message||'Error',true); }
  };
  const handleQGroup = async e => {
    e.preventDefault();
    try{ const d={...qGroup,slug:qGroup.name.toLowerCase().replace(/\s+/g,'_')}; const r=await groupService.createGroup(d); const id=r.group?._id||r._id; await loadData(); if(id)setUserForm(p=>({...p,groups:[...p.groups,id]})); setSubStep(null); setQGroup({name:'',description:''}); showMsg('Group created!'); }
    catch(e){ if(e?.isPermissionDenied)return; showMsg(e.message||'Error',true); }
  };
  const handleNext = () => {
    if(!userForm.firstName.trim()||!userForm.lastName.trim()||!userForm.email.trim()){ showMsg('Fill required fields',true); return; }
    if(!editingItem&&userForm.password.length<4){ showMsg('Min 4 characters',true); return; }
    setUserStep(2);
  };

  /* ─ copy helper (state lives here, passed as props to outside components) ─ */

  const PermTable = ({hasP,toggleP}) => (
    <div style={{border:'1.5px solid #e2e8f0',borderRadius:10,overflow:'hidden',maxHeight:260,overflowY:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
        <thead><tr style={{background:'#f8fafc',position:'sticky',top:0}}>
          <th style={{textAlign:'left',padding:'7px 10px',fontWeight:700,color:'#64748b',fontSize:10,textTransform:'uppercase',borderBottom:'1px solid #e2e8f0'}}>Module</th>
          {ACTIONS.map(a=><th key={a} title={a} style={{padding:'7px 4px',fontWeight:700,color:'#64748b',fontSize:10,borderBottom:'1px solid #e2e8f0'}}>{a[0].toUpperCase()}</th>)}
        </tr></thead>
        <tbody>
          {['Access','CRM','Sales','Product','Tasks','Account','Customization','Data'].map(cat=>(
            <React.Fragment key={cat}>
              <tr><td colSpan={ACTIONS.length+1} style={{padding:'5px 10px',background:'#f1f5f9',fontWeight:800,fontSize:9,color:'#475569',textTransform:'uppercase',letterSpacing:'0.7px'}}>{cat}</td></tr>
              {FEATURES.filter(f=>f.category===cat).map(f=>(
                <tr key={f.slug} style={{borderTop:'1px solid #f8fafc'}}>
                  <td style={{padding:'5px 10px 5px 18px',fontWeight:500,color:'#374151'}}>{f.name}</td>
                  {ACTIONS.map(a=><td key={a} style={{padding:'4px 4px',textAlign:'center'}}><input type="checkbox" style={{cursor:'pointer',width:13,height:13,accentColor:'#4f46e5'}} checked={hasP(f.slug,a)} onChange={()=>toggleP(f.slug,a)} /></td>)}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );

  /* ─── inline dropdown helper ────────────────────────────────── */
  const DDSelect = ({value,onChange,items,placeholder,open,onToggle,tagBg,tagColor,tagBorder}) => (
    <div style={{position:'relative'}}>
      <button type="button" onClick={onToggle} style={{width:'100%',padding:'8px 11px',border:'1.5px solid #e2e8f0',borderRadius:9,fontSize:13,background:'#fff',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',color:value.length?'#0f172a':'#94a3b8',textAlign:'left'}}>
        <span>{value.length?`${value.length} selected`:placeholder}</span><span style={{color:'#94a3b8',fontSize:11}}>▾</span>
      </button>
      {open&&<div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:'#fff',border:'1.5px solid #e2e8f0',borderRadius:12,boxShadow:'0 10px 30px rgba(0,0,0,0.12)',zIndex:400,maxHeight:170,overflowY:'auto'}}>
        {items.length===0?<div style={{padding:14,fontSize:12,color:'#94a3b8',textAlign:'center'}}>None yet</div>
          :items.map(it=><label key={it.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 14px',cursor:'pointer',fontSize:13,borderBottom:'1px solid #f8fafc',background:value.includes(it.id)?'#f5f3ff':'#fff',fontWeight:value.includes(it.id)?700:400,color:value.includes(it.id)?'#4f46e5':'#0f172a'}}>
            <input type="checkbox" style={{accentColor:'#4f46e5'}} checked={value.includes(it.id)} onChange={()=>onChange(value.includes(it.id)?value.filter(i=>i!==it.id):[...value,it.id])} />{it.name}</label>)}
      </div>}
      {value.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:6}}>
        {value.map(id=>{const it=items.find(i=>i.id===id);return it?<span key={id} style={{padding:'2px 9px',background:tagBg,color:tagColor,border:`1px solid ${tagBorder}`,borderRadius:20,fontSize:11,fontWeight:600,display:'inline-flex',alignItems:'center',gap:4}}>{it.name}<button type="button" style={{background:'none',border:'none',cursor:'pointer',color:'inherit',padding:0,fontSize:14,opacity:.7,lineHeight:1}} onClick={()=>onChange(value.filter(i=>i!==id))}>×</button></span>:null;})}
      </div>}
    </div>
  );

  const roleItems  = roles.map(r=>({id:r._id,name:r.name}));
  const groupItems = groups.map(g=>({id:g._id,name:g.name}));

  return (
    <DashboardLayout>
      <style>{`
        .xInp:focus        { border-color:#4f46e5 !important; box-shadow:0 0 0 3px rgba(79,70,229,0.12) !important; }
        .xInp:disabled     { background:#f8fafc !important; color:#94a3b8 !important; }
        .xPriBtn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 7px 22px rgba(79,70,229,0.42) !important; }
        .xPriBtn:disabled  { opacity:0.65; cursor:not-allowed; }

        .xRow              { transition:background 0.12s; }
        .xRow:hover        { background:#f8f7ff !important; }
        .xRow:hover button { opacity:1; }

        .xStat             { cursor:pointer; transition:all 0.2s; }
        .xStat:hover       { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.09) !important; }
        .xStat.xActive     { transform:translateY(-1px); }

        .xTabBtn           { cursor:pointer; transition:all 0.18s; }
        .xTabBtn.xActive   { background:rgba(255,255,255,0.18) !important; color:#fff !important; border-color:rgba(255,255,255,0.3) !important; }
        .xTabBtn:hover:not(.xActive) { background:rgba(255,255,255,0.1) !important; }

        .xActBtn:hover     { filter:brightness(0.9); transform:translateY(-1px); }
        [onmousedown] { user-select:none; }
        .xClose:hover      { background:#f1f5f9 !important; }
        .xTypeCard:hover   { border-color:#4f46e5 !important; }

        .xScroll::-webkit-scrollbar       { width:3px; }
        .xScroll::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:3px; }

        @keyframes xPulse   { 0%,100%{box-shadow:0 0 4px rgba(34,197,94,0.6)} 50%{box-shadow:0 0 10px rgba(34,197,94,1)} }
        @keyframes xFadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes xModalIn { from{opacity:0;transform:scale(0.95)}     to{opacity:1;transform:scale(1)}     }
        @keyframes xToastIn { from{opacity:0;transform:translateX(14px)} to{opacity:1;transform:translateX(0)} }
        .xFadeUp  { animation:xFadeUp  0.2s ease; }
        .xModalIn { animation:xModalIn 0.2s ease; }
        .xToastIn { animation:xToastIn 0.2s ease; }

        /* ── RESPONSIVE ── */
        @media (max-width:900px){
          .xHeroTabs   { flex-wrap:wrap !important; gap:4px !important; }
          .xStatsRow   { grid-template-columns:repeat(2,1fr) !important; }
          .xActBtns    { flex-wrap:wrap !important; }
          .xContentRow { flex-direction:column !important; align-items:stretch !important; }
          .xPanel      { width:100% !important; max-width:100% !important; }
          .xTableWrap  { overflow-x:auto; }
          .xRptStats   { grid-template-columns:repeat(2,1fr) !important; }
          .xRptLayout  { flex-direction:column !important; }
          .xRptSidebar { width:100% !important; flex-direction:row !important; flex-wrap:nowrap !important; overflow-x:auto; padding:8px 12px !important; gap:4px !important; border-right:none !important; border-bottom:1px solid rgba(255,255,255,0.1); }
          .xRptSidebar > div:first-child { display:none !important; }
          .xRptSidebar > div:last-child  { display:none !important; }
          .xRptSideBtn { flex-direction:column !important; padding:8px 12px !important; min-width:80px; border-left:none !important; border-bottom:3px solid transparent; }
          .xRptSideBtn.xRptActive { border-left:none !important; border-bottom:3px solid #10b981 !important; background:rgba(255,255,255,0.12) !important; }
          .xRptSideBtnDesc { display:none !important; }
          .xDeptGrid   { grid-template-columns:1fr !important; }
          .xSumStrip   { grid-template-columns:1fr !important; }
          .xRptSumCards { grid-template-columns:repeat(2,1fr) !important; }
          .xBulkGrid   { grid-template-columns:1fr !important; }
        }
        @media (max-width:540px){
          .xStatsRow   { grid-template-columns:1fr !important; }
          .xRptStats   { grid-template-columns:repeat(2,1fr) !important; }
          .xRptSumCards { grid-template-columns:1fr !important; }
          .xDeptGrid   { grid-template-columns:1fr !important; }
          .xHeroTitle  { font-size:17px !important; }
          .xHeroSub    { display:none !important; }
        }
      `}</style>

      {/* ── toast ──────────────────────────────────────────── */}
      {(success||error)&&(
        <div className="xToastIn" style={{position:'fixed',top:18,right:22,zIndex:9999,padding:'11px 16px',borderRadius:12,background:success?'#f0fdf4':'#fff1f2',border:`1px solid ${success?'#86efac':'#fca5a5'}`,color:success?'#15803d':'#be123c',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:8,boxShadow:'0 6px 24px rgba(0,0,0,0.1)',maxWidth:320}}>
          <span style={{fontSize:16}}>{success?'✓':'⚠'}</span>{success||error}
        </div>
      )}

      {/* ════════════════════════════════════════════
          HERO — dark gradient card (title + tabs only)
      ════════════════════════════════════════════ */}
      <div style={{
        background:'linear-gradient(135deg,#0f0c29 0%,#1e1b4b 40%,#0d1b4b 100%)',
        borderRadius:16, marginBottom:12, overflow:'hidden',
        boxShadow:'0 4px 6px rgba(0,0,0,0.04),0 20px 48px rgba(79,70,229,0.28)',
        position:'relative',
      }}>
        <div style={{position:'absolute',top:-70,right:-40,width:260,height:260,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.38) 0%,transparent 68%)',pointerEvents:'none'}} />
        <div style={{position:'absolute',bottom:-40,left:'30%',width:180,height:180,borderRadius:'50%',background:'radial-gradient(circle,rgba(6,182,212,0.22) 0%,transparent 68%)',pointerEvents:'none'}} />
        <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)',backgroundSize:'26px 26px',pointerEvents:'none'}} />

        <div style={{padding:'14px 20px 0',position:'relative',zIndex:1}}>
          <div className="xHeroSub" style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.38)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:5}}>Organisation / Team</div>
          <h2 className="xHeroTitle" style={{margin:0,fontSize:21,fontWeight:900,color:'#fff',letterSpacing:'-0.3px',lineHeight:1.15}}>
            <>Team <span style={{background:'linear-gradient(90deg,#a78bfa,#67e8f9)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Management</span></>
          </h2>
        </div>

        {/* tab pills */}
        <div className="xHeroTabs" style={{padding:'10px 20px 14px',position:'relative',zIndex:1,display:'flex',gap:6}}>
          {[{k:'users',l:'Members',c:users.length},{k:'roles',l:'Roles',c:roles.length},{k:'groups',l:'Groups',c:groups.length},{k:'reports',l:'📊 Reports',c:''}].map(t=>(
            <button key={t.k} className={`xTabBtn${activeTab===t.k?' xActive':''}`} onClick={()=>setActiveTab(t.k)}
              style={{padding:'7px 16px',borderRadius:9,border:'1px solid rgba(255,255,255,0.13)',background:'transparent',color:'rgba(255,255,255,0.55)',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:7}}>
              {t.l}
              <span style={{background:'rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.8)',padding:'1px 7px',borderRadius:8,fontSize:10,fontWeight:800}}>{t.c}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          STATS ROW — each card has its own dark glass bg
      ════════════════════════════════════════════ */}
      {activeTab!=='reports'&&<div className="xStatsRow" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:12}}>
        {[
          {k:'users',  ico:'👥', label:'Team Members', val:users.length,  bg:'linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%)', numColor:'#4338ca', labelColor:'#6366f1', iconBg:'linear-gradient(135deg,#818cf8,#6366f1)', border:'#c7d2fe'},
          {k:'roles',  ico:'🛡️', label:'Custom Roles', val:roles.length,  bg:'linear-gradient(135deg,#ecfeff 0%,#cffafe 100%)', numColor:'#0e7490', labelColor:'#06b6d4', iconBg:'linear-gradient(135deg,#22d3ee,#06b6d4)', border:'#a5f3fc'},
          {k:'groups', ico:'📂', label:'User Groups',  val:groups.length, bg:'linear-gradient(135deg,#fdf4ff 0%,#fae8ff 100%)', numColor:'#7e22ce', labelColor:'#a855f7', iconBg:'linear-gradient(135deg,#c084fc,#a855f7)', border:'#e9d5ff'},
        ].map(s=>(
          <div key={s.k} className={`xStat${activeTab===s.k?' xActive':''}`} onClick={()=>setActiveTab(s.k)}
            style={{background:s.bg,border:`1.5px solid ${activeTab===s.k?s.border:'transparent'}`,borderRadius:14,padding:'14px 16px',position:'relative',overflow:'hidden',boxShadow:activeTab===s.k?'0 4px 18px rgba(0,0,0,0.08)':'0 1px 4px rgba(0,0,0,0.04)',transition:'all 0.2s'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:40,height:40,borderRadius:11,background:s.iconBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,flexShrink:0,boxShadow:'0 3px 8px rgba(0,0,0,0.12)'}}>{s.ico}</div>
              <div>
                <div style={{fontSize:26,fontWeight:900,color:s.numColor,lineHeight:1}}>{s.val}</div>
                <div style={{fontSize:11,color:s.labelColor,fontWeight:700,marginTop:3}}>{s.label}</div>
              </div>
            </div>
            {activeTab===s.k&&<div style={{position:'absolute',bottom:0,left:0,right:0,height:2.5,background:s.iconBg}} />}
          </div>
        ))}
      </div>}

      {/* ADD BUTTON — left aligned below stats */}
      {activeTab!=='reports'&&<div className="xActBtns" style={{marginBottom:12,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        <button
          onClick={()=>activeTab==='users'?openUserPanel():activeTab==='roles'?openRolePanel():openGroupPanel()}
          style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)',color:'#fff',border:'none',padding:'8px 18px',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8,boxShadow:'0 4px 18px rgba(79,70,229,0.38)',transition:'all 0.2s'}}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 8px 26px rgba(79,70,229,0.5)';}}
          onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 4px 18px rgba(79,70,229,0.38)';}}
        >
          <span style={{width:22,height:22,background:'rgba(255,255,255,0.2)',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,fontWeight:300,lineHeight:1}}>+</span>
          Add {activeTab==='users'?'Member':activeTab==='roles'?'Role':'Group'}
        </button>
        {activeTab==='users'&&(
          <button onClick={()=>{setBulkModal(true);setBulkRows([]);setBulkError('');setBulkResult(null);}}
            style={{background:'#fff',color:'#374151',border:'1.5px solid #e2e8f0',padding:'8px 16px',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:7,transition:'all 0.2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#6366f1';e.currentTarget.style.color='#4f46e5';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.color='#374151';}}>
            <span style={{fontSize:15}}>📥</span> Bulk Import
          </button>
        )}
      </div>}

      {/* ════════════════════════════════════════════
          CONTENT — form (optional) + table
      ════════════════════════════════════════════ */}
      {activeTab!=='reports'&&<div className="xContentRow" style={{display:'flex',gap:18,alignItems:'flex-start'}}>

        {/* ─── INLINE USER FORM ────────────────────────────── */}
        {showPanel&&panelMode==='user'&&(
          <div className="xFadeUp xPanel" style={{width:panelWidth,flexShrink:0,background:'#fff',borderRadius:18,border:'1px solid #e8edf5',boxShadow:'0 4px 6px rgba(0,0,0,0.04),0 16px 40px rgba(79,70,229,0.13)',overflow:'hidden',position:'relative'}}>
            {/* drag handle */}
            <div onMouseDown={startDrag} style={{position:'absolute',right:0,top:0,bottom:0,width:5,cursor:'col-resize',zIndex:20,background:'transparent'}} title="Drag to resize" />
            {/* header */}
            <div style={{background:'linear-gradient(135deg,#0f0c29 0%,#1e1b4b 50%,#312e81 100%)',padding:'14px 18px 12px',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:-40,right:-20,width:140,height:140,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.4) 0%,transparent 70%)',pointerEvents:'none'}} />
              <div style={{position:'absolute',bottom:-30,left:'20%',width:100,height:100,borderRadius:'50%',background:'radial-gradient(circle,rgba(6,182,212,0.25) 0%,transparent 70%)',pointerEvents:'none'}} />
              <button className="xClose" onClick={closePanel} style={{position:'absolute',top:14,right:14,width:26,height:26,borderRadius:7,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.18)',cursor:'pointer',color:'#fff',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s',flexShrink:0,zIndex:2}}>×</button>
              <div style={{position:'relative',zIndex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:32,height:32,borderRadius:9,background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>
                    {editingItem?'✏️':'👤'}
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:800,color:'#fff',lineHeight:1.2}}>{editingItem?'Edit Member':'Add Team Member'}</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,0.45)',marginTop:2}}>
                      {subStep==='create-role'?'Creating new role':subStep==='create-group'?'Creating new group':`Step ${userStep} of 2 · ${userStep===1?'Basic Info':'Roles & Access'}`}
                    </div>
                  </div>
                </div>
              </div>
              {/* step progress bar */}
              {!editingItem&&!subStep&&(
                <div style={{marginTop:14,position:'relative',zIndex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:0}}>
                    {[{n:1,l:'Info'},{n:2,l:'Access'}].map((s,i)=>(
                      <React.Fragment key={s.n}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:24,height:24,borderRadius:'50%',background:userStep>=s.n?'linear-gradient(135deg,#a78bfa,#67e8f9)':'rgba(255,255,255,0.15)',border:userStep>=s.n?'none':'1px solid rgba(255,255,255,0.2)',color:userStep>=s.n?'#1e1b4b':'rgba(255,255,255,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,boxShadow:userStep>=s.n?'0 2px 8px rgba(167,139,250,0.5)':'none',transition:'all 0.3s',flexShrink:0}}>{s.n}</div>
                          <span style={{fontSize:10,fontWeight:700,color:userStep>=s.n?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.35)',letterSpacing:'0.4px'}}>{s.l}</span>
                        </div>
                        {i===0&&<div style={{flex:1,height:2,margin:'0 10px',borderRadius:2,background:userStep>=2?'linear-gradient(90deg,#a78bfa,#67e8f9)':'rgba(255,255,255,0.12)',transition:'background 0.4s'}} />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="xScroll" style={{padding:'16px 18px',maxHeight:'calc(100vh - 260px)',overflowY:'auto'}}>

              {/* ── STEP 1 ──────────────────────────────────── */}
              {userStep===1&&(
                <>
                  {/* user type visual cards */}
                  <div style={{marginBottom:14}}>
                    <Label>User Type</Label>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                      {[
                        {v:'TENANT_USER',   e:'👤',n:'User',   d:'Role-based', sel:{borderColor:'#3b82f6',bg:'#eff6ff',c:'#1d4ed8'}},
                        {v:'TENANT_MANAGER',e:'📊',n:'Manager',d:'Team lead',  sel:{borderColor:'#8b5cf6',bg:'#f5f3ff',c:'#6d28d9'}},
                        {v:'TENANT_ADMIN',  e:'⚡',n:'Admin',  d:'Full access',sel:{borderColor:'#f59e0b',bg:'#fffbeb',c:'#92400e'}},
                      ].map(o=>(
                        <div key={o.v} className="xTypeCard" onClick={()=>setUserForm({...userForm,userType:o.v,roles:[]})}
                          style={{padding:'10px 6px',borderRadius:10,cursor:'pointer',border:`1.5px solid ${userForm.userType===o.v?o.sel.borderColor:'#e2e8f0'}`,background:userForm.userType===o.v?o.sel.bg:'#fafbff',textAlign:'center',transition:'all 0.15s',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                          <span style={{fontSize:20}}>{o.e}</span>
                          <span style={{fontSize:11,fontWeight:800,color:userForm.userType===o.v?o.sel.c:'#475569'}}>{o.n}</span>
                          <span style={{fontSize:9,color:'#94a3b8'}}>{o.d}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Row 1: First Name + Last Name */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                    <div>
                      <Label>First Name *</Label>
                      <Inp value={userForm.firstName} onChange={e=>{const f=e.target.value;setUserForm(p=>({...p,firstName:f,loginName:(f+(p.lastName?'.'+p.lastName:'')).toLowerCase().replace(/\s+/g,'')}));}} placeholder="John" />
                    </div>
                    <div>
                      <Label>Last Name *</Label>
                      <Inp value={userForm.lastName} onChange={e=>{const l=e.target.value;setUserForm(p=>({...p,lastName:l,loginName:((p.firstName?p.firstName+'.':'')+l).toLowerCase().replace(/\s+/g,'')}));}} placeholder="Doe" />
                    </div>
                  </div>

                  {/* Row 2: Login Name + Password */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                    <div>
                      <Label>Login Name{userForm.loginName&&users.some(u=>u.loginName===userForm.loginName&&u._id!==editingItem?._id)&&<span style={{textTransform:'none',fontWeight:400,color:'#ef4444',marginLeft:6}}>— taken</span>}</Label>
                      <div style={{position:'relative'}}>
                        <Inp style={{paddingRight:34,...(userForm.loginName&&users.some(u=>u.loginName===userForm.loginName&&u._id!==editingItem?._id)?{borderColor:'#ef4444'}:{})}} value={userForm.loginName} onChange={e=>setUserForm({...userForm,loginName:e.target.value.toLowerCase().replace(/\s+/g,'')})} placeholder="john.doe" />
                        <CopyBtn fkey="loginName" val={userForm.loginName} copied={copied} onCopy={copyVal} />
                      </div>
                    </div>
                    <div>
                      <Label>Password {editingItem?<span style={{textTransform:'none',fontWeight:400,color:'#94a3b8'}}>— leave blank</span>:'*'}</Label>
                      <div style={{position:'relative'}}>
                        <Inp type={showPwd?'text':'password'} style={{paddingRight:56}} value={userForm.password} onChange={e=>setUserForm({...userForm,password:e.target.value})} placeholder="Min. 4 chars" />
                        <div style={{position:'absolute',right:7,top:'50%',transform:'translateY(-50%)',display:'flex',gap:4,alignItems:'center'}}>
                          <CopyBtnInline fkey="password" val={userForm.password} copied={copied} onCopy={copyVal} />
                          <button type="button" onClick={()=>setShowPwd(p=>!p)} style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8',padding:0,display:'flex'}}>{showPwd?SVG_EYE_OFF:SVG_EYE_ON}</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Login Email (used for login) */}
                  <div style={{marginBottom:10}}>
                    <Label>Email * <span style={{textTransform:'none',fontWeight:400,color:'#94a3b8',letterSpacing:0}}>— used for login</span></Label>
                    <div style={{position:'relative'}}>
                      <Inp type="email" style={{paddingRight:70}} value={userForm.email} onChange={e=>setUserForm({...userForm,email:e.target.value})} placeholder="john@example.com" disabled={!!editingItem} />
                      <CopyBtn fkey="email" val={userForm.email} copied={copied} onCopy={copyVal} />
                    </div>
                  </div>

                  {/* Row 4: Personal Email + Office Email */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                    <div>
                      <Label>Personal Email</Label>
                      <div style={{position:'relative'}}>
                        <Inp type="email" style={{paddingRight:70}} value={userForm.personalEmail} onChange={e=>setUserForm({...userForm,personalEmail:e.target.value})} placeholder="john@gmail.com" />
                        <CopyBtn fkey="personalEmail" val={userForm.personalEmail} copied={copied} onCopy={copyVal} />
                      </div>
                    </div>
                    <div>
                      <Label>Work Email</Label>
                      <div style={{position:'relative'}}>
                        <Inp type="email" style={{paddingRight:70}} value={userForm.officeEmail} onChange={e=>setUserForm({...userForm,officeEmail:e.target.value})} placeholder="john@company.com" />
                        <CopyBtn fkey="officeEmail" val={userForm.officeEmail} copied={copied} onCopy={copyVal} />
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Department + Sub Department */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                    <div>
                      <Label>Department</Label>
                      <select className="xInp" style={{width:'100%',padding:'8px 28px 8px 11px',border:'1.5px solid #e2e8f0',borderRadius:9,fontSize:13,color:userForm.department?'#0f172a':'#94a3b8',background:'#fff',outline:'none',boxSizing:'border-box',appearance:'none',backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",backgroundRepeat:'no-repeat',backgroundPosition:'right 10px center'}}
                        value={userForm.department} onChange={e=>setUserForm({...userForm,department:e.target.value,subDepartment:''})}>
                        <option value="">— Select —</option>
                        {['Sales','Marketing','Finance','Operations','Human Resources','IT','Customer Support','Product','Legal','Administration','Others'].map(d=><option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Sub Department</Label>
                      <Inp value={userForm.subDepartment} onChange={e=>setUserForm({...userForm,subDepartment:e.target.value})} placeholder="e.g. Inside Sales" />
                    </div>
                  </div>

                  {/* Row 5: Phone + Alternate Phone */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                    <div>
                      <Label>Phone</Label>
                      <Inp value={userForm.phone} onChange={e=>setUserForm({...userForm,phone:e.target.value})} placeholder="+91 00000 00000" />
                    </div>
                    <div>
                      <Label>Alternate Phone</Label>
                      <Inp value={userForm.alternatePhone} onChange={e=>setUserForm({...userForm,alternatePhone:e.target.value})} placeholder="+91 00000 00000" />
                    </div>
                  </div>

                  {/* Row 6: Reporting Manager + Created By */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                    <div>
                      <Label>Reporting Manager</Label>
                      <Inp value={userForm.reportingManager} onChange={e=>setUserForm({...userForm,reportingManager:e.target.value})} placeholder="Enter manager name" />
                    </div>
                    <div>
                      <Label>Created By</Label>
                      {editingItem ? (
                        <div style={{padding:'8px 12px',border:'1.5px solid #f1f5f9',borderRadius:10,background:'#f8fafc',minHeight:42,display:'flex',alignItems:'center',gap:8}}>
                          {(() => {
                            const creator = editingItem.addedBy;
                            const name = creator ? `${creator.firstName||''} ${creator.lastName||''}`.trim() : user?.firstName ? `${user.firstName} ${user.lastName}`.trim() : '—';
                            const initial = name[0]?.toUpperCase() || '?';
                            const dt = editingItem.createdAt ? new Date(editingItem.createdAt) : null;
                            const dateStr = dt ? `${dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})} ${dt.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}` : '';
                            return <>
                              <span style={{width:24,height:24,borderRadius:'50%',background:avGrad(initial),display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'#fff',flexShrink:0}}>{initial}</span>
                              <div style={{minWidth:0}}>
                                <div style={{fontSize:12,fontWeight:700,color:'#0f172a',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{name}</div>
                                {dateStr&&<div style={{fontSize:10,color:'#94a3b8',marginTop:1}}>{dateStr}</div>}
                              </div>
                            </>;
                          })()}
                        </div>
                      ) : (
                        <div style={{padding:'8px 12px',border:'1.5px solid #f1f5f9',borderRadius:10,background:'#f8fafc',minHeight:42,display:'flex',alignItems:'center',gap:8}}>
                          <span style={{width:24,height:24,borderRadius:'50%',background:avGrad(user?.firstName||'?'),display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'#fff',flexShrink:0}}>{(user?.firstName||'?')[0].toUpperCase()}</span>
                          <div>
                            <div style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>{user?.firstName} {user?.lastName}</div>
                            <div style={{fontSize:10,color:'#94a3b8'}}>{new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})} {new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 7: Viewing PIN */}
                  <div style={{marginBottom:14}}>
                    <Label>Viewing PIN (4 digits){editingItem&&<span style={{textTransform:'none',fontWeight:400,color:'#94a3b8',marginLeft:6}}>leave blank to keep</span>}</Label>
                    <div style={{position:'relative'}}>
                      <Inp type={showPin?'text':'password'} style={{paddingRight:34,letterSpacing:showPin?'normal':'6px'}} value={userForm.viewingPin}
                        onChange={e=>setUserForm({...userForm,viewingPin:e.target.value.replace(/\D/g,'').slice(0,4)})} placeholder="4-digit PIN" maxLength={4} />
                      <button type="button" onClick={()=>setShowPin(p=>!p)} style={{position:'absolute',right:9,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94a3b8',padding:0,display:'flex'}}>{showPin?SVG_EYE_OFF:SVG_EYE_ON}</button>
                    </div>
                    {userForm.viewingPin&&userForm.viewingPin.length<4&&<span style={{fontSize:10,color:'#f59e0b',marginTop:3,display:'block'}}>Exactly 4 digits required</span>}
                  </div>

                  {!editingItem&&(userForm.userType==='TENANT_ADMIN'
                    ?<PriBtn disabled={submitting} onClick={handleUserSubmit}>{submitting?'Creating...':'Create Admin User'}</PriBtn>
                    :<PriBtn onClick={handleNext}>Next — Roles &amp; Groups →</PriBtn>
                  )}
                  {editingItem&&<div style={{display:'flex',gap:8,marginTop:6}}>
                    <button type="button" onClick={()=>setUserStep(2)} style={{flex:1,padding:'10px 0',border:'1.5px solid #e2e8f0',borderRadius:10,background:'#f8fafc',color:'#64748b',fontSize:13,fontWeight:700,cursor:'pointer'}}>Roles →</button>
                    <PriBtn disabled={submitting} onClick={handleUserSubmit} style={{flex:1,marginTop:0}}>{submitting?'Saving...':'Save Changes'}</PriBtn>
                  </div>}
                </>
              )}

              {/* ── STEP 2 ──────────────────────────────────── */}
              {userStep===2&&(
                <>
                  {subStep==='create-role'&&(
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                        <button style={{padding:'4px 11px',border:'1.5px solid #e2e8f0',borderRadius:7,background:'#f8fafc',color:'#64748b',fontSize:11,fontWeight:700,cursor:'pointer'}} onClick={()=>{setSubStep(null);setQRole({name:'',description:'',permissions:[],forUserTypes:['TENANT_USER','TENANT_MANAGER']});}}>← Back</button>
                        <div><div style={{fontSize:13,fontWeight:800,color:'#0f172a'}}>Create New Role</div><div style={{fontSize:11,color:'#94a3b8'}}>Auto-selected after creation</div></div>
                      </div>
                      <form onSubmit={handleQRole}>
                        <div style={{marginBottom:12}}><Label>Role Name *</Label><Inp value={qRole.name} onChange={e=>setQRole({...qRole,name:e.target.value})} required placeholder="e.g. Sales Manager" /></div>
                        <div style={{marginBottom:12}}><Label>Description</Label><Inp value={qRole.description} onChange={e=>setQRole({...qRole,description:e.target.value})} placeholder="Brief description" /></div>
                        <div style={{marginBottom:12}}><Label>For User Types</Label>
                          <div style={{display:'flex',gap:8}}>
                            {[{v:'TENANT_USER',l:'User'},{v:'TENANT_MANAGER',l:'Manager'}].map(ut=>(
                              <label key={ut.v} style={{padding:'6px 14px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',border:`1.5px solid ${qRole.forUserTypes?.includes(ut.v)?'#4f46e5':'#e2e8f0'}`,background:qRole.forUserTypes?.includes(ut.v)?'#eef2ff':'#fff',color:qRole.forUserTypes?.includes(ut.v)?'#4338ca':'#64748b',transition:'all 0.15s'}}>
                                <input type="checkbox" style={{display:'none'}} checked={qRole.forUserTypes?.includes(ut.v)} onChange={()=>{const t=qRole.forUserTypes||[];setQRole({...qRole,forUserTypes:t.includes(ut.v)?t.filter(x=>x!==ut.v):[...t,ut.v]});}} />{ut.l}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div style={{marginBottom:12}}><Label>Permissions</Label><PermTable hasP={hasQPerm} toggleP={togglePerm(qRole,setQRole)} /></div>
                        <PriBtn type="submit">Create Role</PriBtn>
                      </form>
                    </div>
                  )}

                  {subStep==='create-group'&&(
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                        <button style={{padding:'4px 11px',border:'1.5px solid #e2e8f0',borderRadius:7,background:'#f8fafc',color:'#64748b',fontSize:11,fontWeight:700,cursor:'pointer'}} onClick={()=>{setSubStep(null);setQGroup({name:'',description:''});}}>← Back</button>
                        <div><div style={{fontSize:13,fontWeight:800,color:'#0f172a'}}>Create New Group</div><div style={{fontSize:11,color:'#94a3b8'}}>Auto-selected after creation</div></div>
                      </div>
                      <form onSubmit={handleQGroup}>
                        <div style={{marginBottom:12}}><Label>Group Name *</Label><Inp value={qGroup.name} onChange={e=>setQGroup({...qGroup,name:e.target.value})} required placeholder="e.g. Sales Team" /></div>
                        <div style={{marginBottom:12}}><Label>Description</Label><Inp value={qGroup.description} onChange={e=>setQGroup({...qGroup,description:e.target.value})} placeholder="Brief description" /></div>
                        <PriBtn type="submit">Create Group</PriBtn>
                      </form>
                    </div>
                  )}

                  {!subStep&&(
                    <>
                      <div style={{marginBottom:14}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                          <Label>Assign Roles</Label>
                          <button style={{background:'none',border:'none',color:'#4f46e5',fontSize:11,fontWeight:700,cursor:'pointer',padding:0}} onClick={()=>{setQRole({name:'',description:'',permissions:[],forUserTypes:['TENANT_USER','TENANT_MANAGER']});setSubStep('create-role');}}>+ New</button>
                        </div>
                        <DDSelect value={userForm.roles} onChange={v=>setUserForm({...userForm,roles:v})} items={roleItems} placeholder="Select roles..." open={showRoleDD} onToggle={()=>{setShowRoleDD(p=>!p);setShowGroupDD(false);}} tagBg="#ede9fe" tagColor="#5b21b6" tagBorder="#c4b5fd" />
                      </div>
                      <div style={{marginBottom:14}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                          <Label>Groups <span style={{textTransform:'none',fontWeight:400,color:'#94a3b8'}}>— optional</span></Label>
                          <button style={{background:'none',border:'none',color:'#4f46e5',fontSize:11,fontWeight:700,cursor:'pointer',padding:0}} onClick={()=>{setQGroup({name:'',description:''});setSubStep('create-group');}}>+ New</button>
                        </div>
                        <DDSelect value={userForm.groups} onChange={v=>setUserForm({...userForm,groups:v})} items={groupItems} placeholder="Select groups..." open={showGroupDD} onToggle={()=>{setShowGroupDD(p=>!p);setShowRoleDD(false);}} tagBg="#dcfce7" tagColor="#15803d" tagBorder="#86efac" />
                      </div>
                      <div style={{display:'flex',gap:8,marginTop:4}}>
                        <button onClick={()=>setUserStep(1)} style={{padding:'10px 16px',border:'1.5px solid #e2e8f0',borderRadius:10,background:'#f8fafc',color:'#64748b',fontSize:13,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>← Back</button>
                        <PriBtn disabled={submitting} onClick={handleUserSubmit} style={{flex:1,marginTop:0}}>
                          {submitting?(editingItem?'Saving...':'Creating...'):(editingItem?'Save Changes':'Create User')}
                        </PriBtn>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── ROLE / GROUP PANEL (left, same flex row as table) ── */}
        {showPanel&&panelMode!=='user'&&(
          <div className="xFadeUp xPanel" style={{width:panelWidth,flexShrink:0,background:'#fff',borderRadius:18,border:'1px solid #e8edf5',boxShadow:'0 4px 6px rgba(0,0,0,0.04),0 16px 40px rgba(79,70,229,0.13)',display:'flex',flexDirection:'column',maxHeight:'calc(100vh - 160px)',overflow:'hidden',position:'relative'}}>
            {/* drag handle */}
            <div onMouseDown={startDrag} style={{position:'absolute',right:0,top:0,bottom:0,width:5,cursor:'col-resize',zIndex:20}} />
            <div style={{background:'linear-gradient(135deg,#4f46e5 0%,#6d28d9 60%,#7c3aed 100%)',padding:'13px 18px 11px',position:'relative',overflow:'hidden',flexShrink:0}}>
              <div style={{position:'absolute',top:-30,right:-20,width:120,height:120,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,255,255,0.15) 0%,transparent 70%)',pointerEvents:'none'}} />
              <button className="xClose" onClick={closePanel} style={{position:'absolute',top:12,right:14,width:26,height:26,borderRadius:7,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.18)',cursor:'pointer',color:'#fff',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}>×</button>
              <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:32,height:32,borderRadius:9,background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>{panelMode==='role'?'🛡️':'📂'}</div>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:'#fff',lineHeight:1.2}}>{editingItem?'Edit':'New'} {panelMode==='role'?'Role':'Group'}</div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.42)',marginTop:2}}>{panelMode==='role'?'Set module permissions':'Add members to group'}</div>
                </div>
              </div>
            </div>
            <div className="xScroll" style={{padding:'14px 18px',overflowY:'auto',flex:1}}>
              {panelMode==='role'&&(
                <form onSubmit={handleRoleSubmit}>
                  <div style={{marginBottom:12}}><Label>Role Name *</Label><Inp value={roleForm.name} onChange={e=>setRoleForm({...roleForm,name:e.target.value})} required placeholder="e.g. Sales Manager" /></div>
                  <div style={{marginBottom:12}}><Label>Description</Label><Inp value={roleForm.description} onChange={e=>setRoleForm({...roleForm,description:e.target.value})} placeholder="Brief description" /></div>
                  <div style={{marginBottom:12}}><Label>For User Types</Label>
                    <div style={{display:'flex',gap:8}}>
                      {[{v:'TENANT_USER',l:'User'},{v:'TENANT_MANAGER',l:'Manager'}].map(ut=>(
                        <label key={ut.v} style={{padding:'6px 14px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',border:`1.5px solid ${roleForm.forUserTypes?.includes(ut.v)?'#4f46e5':'#e2e8f0'}`,background:roleForm.forUserTypes?.includes(ut.v)?'#eef2ff':'#fff',color:roleForm.forUserTypes?.includes(ut.v)?'#4338ca':'#64748b',transition:'all 0.15s'}}>
                          <input type="checkbox" style={{display:'none'}} checked={roleForm.forUserTypes?.includes(ut.v)} onChange={()=>{const t=roleForm.forUserTypes||[];setRoleForm({...roleForm,forUserTypes:t.includes(ut.v)?t.filter(x=>x!==ut.v):[...t,ut.v]});}} />{ut.l}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{marginBottom:12}}><Label>Permissions</Label><PermTable hasP={hasPerm} toggleP={togglePerm(roleForm,setRoleForm)} /></div>
                  <PriBtn type="submit">{editingItem?'Update':'Create'} Role</PriBtn>
                </form>
              )}
              {panelMode==='group'&&(
                <form onSubmit={handleGroupSubmit}>
                  <div style={{marginBottom:12}}><Label>Group Name *</Label><Inp value={groupForm.name} onChange={e=>setGroupForm({...groupForm,name:e.target.value})} required placeholder="e.g. Sales Team" /></div>
                  <div style={{marginBottom:12}}><Label>Description</Label><Inp value={groupForm.description} onChange={e=>setGroupForm({...groupForm,description:e.target.value})} placeholder="Brief description" /></div>
                  <div style={{marginBottom:12}}><Label>Members</Label>
                    <div style={{display:'flex',flexWrap:'wrap',gap:6,padding:10,border:'1.5px solid #e2e8f0',borderRadius:9,background:'#fafbff',maxHeight:110,overflowY:'auto'}}>
                      {users.map(u=>(
                        <label key={u._id} style={{padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',background:groupForm.members.includes(u._id)?'#dcfce7':'#fff',border:`1.5px solid ${groupForm.members.includes(u._id)?'#16a34a':'#e2e8f0'}`,color:groupForm.members.includes(u._id)?'#15803d':'#64748b',transition:'all 0.15s'}}>
                          <input type="checkbox" style={{display:'none'}} checked={groupForm.members.includes(u._id)} onChange={()=>{const n=groupForm.members.includes(u._id)?groupForm.members.filter(i=>i!==u._id):[...groupForm.members,u._id];setGroupForm({...groupForm,members:n});}} />
                          {u.firstName} {u.lastName}
                        </label>
                      ))}
                    </div>
                  </div>
                  <PriBtn type="submit">{editingItem?'Update':'Create'} Group</PriBtn>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ─── USER DETAIL PANEL (left, on row click) ────────── */}
        {selectedUser&&!showPanel&&(()=>{
          const su=selectedUser;
          const tc=TYPE_CFG[su.userType]||TYPE_CFG.TENANT_USER;
          const userGroups=groups.filter(g=>g.members?.some(m=>(m._id||m)===su._id));
          return(
            <div className="xFadeUp xPanel" style={{width:panelWidth,flexShrink:0,background:'#fff',borderRadius:18,border:'1px solid #e8edf5',boxShadow:'0 4px 6px rgba(0,0,0,0.04),0 16px 40px rgba(79,70,229,0.12)',overflow:'hidden',display:'flex',flexDirection:'column',position:'relative'}}>
              {/* drag handle */}
              <div onMouseDown={startDrag} style={{position:'absolute',right:0,top:0,bottom:0,width:5,cursor:'col-resize',zIndex:20}} />
              {/* header */}
              <div style={{background:'linear-gradient(135deg,#0f0c29 0%,#1e1b4b 50%,#312e81 100%)',padding:'14px 18px 12px',position:'relative',overflow:'hidden',flexShrink:0}}>
                <div style={{position:'absolute',top:-40,right:-20,width:130,height:130,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.45) 0%,transparent 70%)',pointerEvents:'none'}} />
                <button onClick={()=>setSelectedUser(null)} style={{position:'absolute',top:12,right:14,width:26,height:26,borderRadius:7,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.18)',cursor:'pointer',color:'#fff',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}>×</button>
                <div style={{position:'relative',zIndex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:40,height:40,borderRadius:11,background:avGrad(su.firstName),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:15,flexShrink:0,boxShadow:'0 3px 10px rgba(0,0,0,0.25)'}}>{su.firstName?.[0]}{su.lastName?.[0]}</div>
                    <div>
                      <div style={{fontSize:14,fontWeight:800,color:'#fff',lineHeight:1.2}}>{su.firstName} {su.lastName}</div>
                      <div style={{fontSize:10,color:'rgba(255,255,255,0.45)',marginTop:2}}>{su.email}</div>
                      <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:700,color:'#fff',background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.18)',marginTop:4}}>
                        <span style={{width:4,height:4,borderRadius:'50%',background:tc.dot,flexShrink:0}} />{tc.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* details body */}
              <div className="xScroll" style={{padding:'12px 14px',overflowY:'auto',flex:1}}>

                {/* Section helper */}
                {(()=>{
                  const SLabel = ({children}) => <div style={{fontSize:9,fontWeight:800,color:'#6366f1',textTransform:'uppercase',letterSpacing:'1px',margin:'12px 0 6px',paddingBottom:4,borderBottom:'1.5px solid #e0e7ff'}}>{children}</div>;
                  const DRow = ({ico,label,val}) => val&&val!=='—'?(
                    <div style={{display:'flex',alignItems:'flex-start',gap:8,padding:'6px 0',borderBottom:'1px solid #f8fafc'}}>
                      <span style={{fontSize:13,flexShrink:0,marginTop:1,width:18,textAlign:'center'}}>{ico}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:1}}>{label}</div>
                        <div style={{fontSize:12,fontWeight:600,color:'#0f172a',wordBreak:'break-all'}}>{val}</div>
                      </div>
                    </div>
                  ):null;

                  return <>
                    <SLabel>Account Info</SLabel>
                    <DRow ico="📋" label="Login Name"    val={su.loginName||'—'} />
                    <DRow ico="✉️" label="Login Email"   val={su.email||'—'} />
                    <DRow ico="📧" label="Personal Email" val={su.personalEmail||'—'} />
                    <DRow ico="🏢" label="Work Email"    val={su.officeEmail||'—'} />

                    <SLabel>Contact</SLabel>
                    <DRow ico="📞" label="Phone"          val={su.phone||'—'} />
                    <DRow ico="📱" label="Alternate Phone" val={su.alternatePhone||'—'} />

                    <SLabel>Organisation</SLabel>
                    <DRow ico="🏛️" label="Department"     val={su.department||'—'} />
                    <DRow ico="📂" label="Sub Department"  val={su.subDepartment||'—'} />
                    <DRow ico="👔" label="Reporting Manager" val={su.reportingManager||'—'} />

                    {su.roles?.length>0&&(
                      <div style={{marginTop:10}}>
                        <SLabel>Roles</SLabel>
                        <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                          {su.roles.map(r=><span key={r._id} style={{fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:20,background:'linear-gradient(135deg,#f5f3ff,#ede9fe)',color:'#6d28d9',border:'1px solid #ddd6fe'}}>{r.name}</span>)}
                        </div>
                      </div>
                    )}

                    {userGroups.length>0&&(
                      <div style={{marginTop:10}}>
                        <SLabel>Groups</SLabel>
                        <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                          {userGroups.map(g=><span key={g._id} style={{fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:20,background:'#ecfdf5',color:'#065f46',border:'1px solid #6ee7b7'}}>{g.name}</span>)}
                        </div>
                      </div>
                    )}
                  </>;
                })()}

                <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:7}}>
                  <div style={{display:'flex',gap:7}}>
                    <button onClick={()=>{setSelectedUser(null);openUserPanel(su);}} style={{flex:1,padding:'8px 0',border:'none',borderRadius:9,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>✏️ Edit</button>
                    {su._id!==user._id&&<button onClick={()=>{setSelectedUser(null);openResetModal(su);}} style={{flex:1,padding:'8px 0',border:'1.5px solid #e2e8f0',borderRadius:9,background:'#fff',color:'#64748b',fontSize:12,fontWeight:700,cursor:'pointer'}}>🔑 Reset Pwd</button>}
                  </div>
                  {su._id!==user._id&&(
                    <button onClick={()=>toggleActive(su)} style={{
                      width:'100%',padding:'8px 0',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',
                      border:`1.5px solid ${su.isActive?'#fde68a':'#bbf7d0'}`,
                      background:su.isActive?'#fffbeb':'#f0fdf4',
                      color:su.isActive?'#b45309':'#15803d',
                      display:'flex',alignItems:'center',justifyContent:'center',gap:6
                    }}>
                      {su.isActive ? '⏸ Deactivate User' : '▶ Activate User'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ════════════════════════════════════════════
            TABLE CARD — premium compact rows
        ════════════════════════════════════════════ */}
        <div className="xTableWrap" style={{flex:1,minWidth:0,background:'#fff',borderRadius:18,border:'1px solid #e8edf5',boxShadow:'0 2px 4px rgba(0,0,0,0.04),0 10px 32px rgba(79,70,229,0.07)',overflow:'hidden'}}>
          {/* table card header */}
          <div style={{padding:'10px 14px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <div style={{flex:1,minWidth:160}}>
              <div style={{fontSize:14,fontWeight:800,color:'#0f172a'}}>
                {activeTab==='users'?'Team Members':activeTab==='roles'?'Permission Roles':'User Groups'}
              </div>
              <div style={{fontSize:11,color:'#94a3b8',marginTop:1}}>
                {activeTab==='users'?users.length:activeTab==='roles'?roles.length:groups.length} total records
              </div>
            </div>
            {/* search */}
            <div style={{position:'relative',minWidth:200}}>
              <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'#94a3b8',pointerEvents:'none'}}>🔍</span>
              <input className="xInp" value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${activeTab}…`}
                style={{width:'100%',padding:'7px 11px 7px 30px',border:'1.5px solid #e2e8f0',borderRadius:9,fontSize:12,color:'#0f172a',background:'#f8fafc',outline:'none',boxSizing:'border-box'}} />
            </div>
          </div>

          <div style={{overflowX:'auto'}}>
            {loading?(
              <div style={{textAlign:'center',padding:'48px 20px',color:'#94a3b8',fontSize:13}}>Loading...</div>
            ):(activeTab==='users'?(
              /* ── USERS — premium table ── */
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#f8fafc'}}>
                    <th style={TH}>Member</th>
                    <th style={TH}>Type</th>
                    <th style={TH}>Roles</th>
                    <th style={TH}>Status</th>
                    <th style={{...TH,textAlign:'right'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                {users.filter(u=>!search||`${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())).map((u,idx)=>{
                  const tc=TYPE_CFG[u.userType]||TYPE_CFG.TENANT_USER;
                  const isSelected=selectedUser?._id===u._id;
                  return(
                    <tr key={u._id} className="xRow" onClick={()=>setSelectedUser(isSelected?null:u)}
                      style={{borderBottom:'1px solid #f1f5f9',cursor:'pointer',background:isSelected?'#f5f3ff':'',transition:'all 0.15s',position:'relative'}}>

                      {/* member cell */}
                      <td style={{...TD,paddingLeft:isSelected?16:20}}>
                        {isSelected&&<div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:'linear-gradient(180deg,#6366f1,#a78bfa)'}} />}
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          <div style={{position:'relative',flexShrink:0}}>
                            <div style={{width:34,height:34,borderRadius:10,background:avGrad(u.firstName),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:13,boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>{u.firstName?.[0]}{u.lastName?.[0]}</div>
                            <div style={{position:'absolute',bottom:-1,right:-1,width:9,height:9,borderRadius:'50%',background:u.isActive?'#22c55e':'#f43f5e',border:'2px solid #fff',boxShadow:u.isActive?'0 0 4px rgba(34,197,94,0.7)':'none'}} />
                          </div>
                          <div>
                            <div style={{fontSize:13,fontWeight:700,color:'#0f172a',lineHeight:1.2}}>{u.firstName} {u.lastName}</div>
                            <div style={{fontSize:11,color:'#94a3b8',marginTop:1}}>{u.email}</div>
                            {u.department&&<span style={{fontSize:9,fontWeight:700,color:'#7c3aed',background:'#f5f3ff',padding:'1px 6px',borderRadius:5,marginTop:2,display:'inline-block'}}>{u.department}</span>}
                          </div>
                        </div>
                      </td>

                      {/* type */}
                      <td style={TD}>
                        <div style={{display:'inline-flex',flexDirection:'column',alignItems:'flex-start',gap:2}}>
                          <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:700,color:tc.c,background:tc.bg,border:`1.5px solid ${tc.b}`}}>
                            <span style={{width:6,height:6,borderRadius:'50%',background:tc.dot,flexShrink:0}} />{tc.label}
                          </span>
                        </div>
                      </td>

                      {/* roles */}
                      <td style={TD}>
                        {u.roles?.length>0
                          ?<div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                            {u.roles.map(r=><span key={r._id} style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:6,background:'#eef2ff',color:'#4338ca',border:'1px solid #c7d2fe'}}>{r.name}</span>)}
                           </div>
                          :<span style={{fontSize:12,color:'#cbd5e1'}}>—</span>}
                      </td>

                      {/* status */}
                      <td style={TD}>
                        <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:700,background:u.isActive?'#f0fdf4':'#fff1f2',color:u.isActive?'#16a34a':'#be123c',border:`1px solid ${u.isActive?'#86efac':'#fca5a5'}`}}>
                          <span style={{width:6,height:6,borderRadius:'50%',background:u.isActive?'#22c55e':'#f43f5e',flexShrink:0,boxShadow:u.isActive?'0 0 5px rgba(34,197,94,0.8)':'none'}} />
                          {u.isActive?'Active':'Inactive'}
                        </span>
                      </td>

                      {/* actions */}
                      <td style={{...TD,textAlign:'right'}}>
                        <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                          <button onClick={e=>{e.stopPropagation();openUserPanel(u);}} title="Edit"
                            style={{height:26,padding:'0 10px',borderRadius:7,border:'1px solid #e0e7ff',background:'#eef2ff',color:'#4f46e5',cursor:'pointer',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',gap:4,transition:'all 0.15s',whiteSpace:'nowrap'}}>
                            ✏️ Edit
                          </button>
                          {u._id!==user._id&&<button onClick={e=>{e.stopPropagation();toggleActive(u);}} title={u.isActive?'Deactivate':'Activate'}
                            style={{height:26,padding:'0 9px',borderRadius:7,border:`1px solid ${u.isActive?'#fde68a':'#bbf7d0'}`,background:u.isActive?'#fffbeb':'#f0fdf4',color:u.isActive?'#b45309':'#15803d',cursor:'pointer',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',gap:4,transition:'all 0.15s',whiteSpace:'nowrap'}}>
                            {u.isActive?'⏸ Deactivate':'▶ Activate'}
                          </button>}
                          {u._id!==user._id&&<button onClick={e=>{e.stopPropagation();openResetModal(u);}} title="Reset password"
                            style={{height:26,width:26,borderRadius:7,border:'1px solid #fef3c7',background:'#fffbeb',color:'#d97706',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,transition:'all 0.15s'}}>🔑</button>}
                          {u._id!==user._id&&<button onClick={e=>{e.stopPropagation();handleDeleteUser(u);}} title="Delete"
                            style={{height:26,width:26,borderRadius:7,border:'1px solid #ffe4e6',background:'#fff1f2',color:'#e11d48',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,transition:'all 0.15s'}}>🗑️</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            ):(
              <table style={{width:'100%',borderCollapse:'collapse',minWidth:540}}>
                <thead>
                  <tr>
                    {activeTab==='roles'&&<>
                      <th style={TH}>Role</th>
                      <th style={TH}>Description</th>
                      <th style={TH}>Rules</th>
                      <th style={{...TH,textAlign:'right',paddingRight:18}}>Actions</th>
                    </>}
                    {activeTab==='groups'&&<>
                      <th style={TH}>Group</th>
                      <th style={TH}>Description</th>
                      <th style={TH}>Members</th>
                      <th style={{...TH,textAlign:'right',paddingRight:18}}>Actions</th>
                    </>}
                  </tr>
                </thead>
                <tbody>

                  {/* ── ROLES ──────────────────────────────── */}
                  {activeTab==='roles'&&roles.map(r=>(
                    <tr key={r._id} className="xRow" style={{borderBottom:'1px solid #f8fafc'}}>
                      <td style={TD}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>🛡️</div>
                          <div>
                            <div style={{fontSize:13,fontWeight:700,color:'#0f172a'}}>{r.name}</div>
                            <div style={{fontSize:11,color:'#94a3b8',marginTop:1}}>{r.forUserTypes?.map(t=>TYPE_CFG[t]?.label||t).join(' · ')}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{...TD,color:'#64748b',fontSize:12}}>{r.description||'—'}</td>
                      <td style={TD}><span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:20,background:'#f5f3ff',color:'#6d28d9',border:'1px solid #ddd6fe'}}>{r.permissions?.length||0} rules</span></td>
                      <td style={{...TD,textAlign:'right'}}>
                        <div className="xActs" style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
                          <button className="xActBtn" onClick={()=>openRolePanel(r)} style={{width:30,height:30,borderRadius:8,border:'none',background:'#eff6ff',color:'#2563eb',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s',fontSize:13}}>✏️</button>
                          {r.roleType!=='system'&&<button className="xActBtn" onClick={()=>handleDeleteRole(r)} style={{width:30,height:30,borderRadius:8,border:'none',background:'#fff1f2',color:'#e11d48',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s',fontSize:13}}>🗑️</button>}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* ── GROUPS ─────────────────────────────── */}
                  {activeTab==='groups'&&groups.map(g=>(
                    <tr key={g._id} className="xRow" style={{borderBottom:'1px solid #f8fafc'}}>
                      <td style={TD}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#0891b2,#38bdf8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>📂</div>
                          <div style={{fontSize:13,fontWeight:700,color:'#0f172a'}}>{g.name}</div>
                        </div>
                      </td>
                      <td style={{...TD,color:'#64748b',fontSize:12}}>{g.description||'—'}</td>
                      <td style={TD}><span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:20,background:'#ecfdf5',color:'#065f46',border:'1px solid #6ee7b7'}}>{g.members?.length||0} members</span></td>
                      <td style={{...TD,textAlign:'right'}}>
                        <div className="xActs" style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
                          <button className="xActBtn" onClick={()=>openGroupPanel(g)} style={{width:30,height:30,borderRadius:8,border:'none',background:'#eff6ff',color:'#2563eb',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s',fontSize:13}}>✏️</button>
                          <button className="xActBtn" onClick={()=>handleDeleteGroup(g)} style={{width:30,height:30,borderRadius:8,border:'none',background:'#fff1f2',color:'#e11d48',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s',fontSize:13}}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
            ))}
          </div>

          {!loading&&((activeTab==='users'&&!users.length)||(activeTab==='roles'&&!roles.length)||(activeTab==='groups'&&!groups.length))&&(
            <div style={{textAlign:'center',padding:'52px 20px'}}>
              <div style={{fontSize:44,opacity:.18,marginBottom:10}}>{activeTab==='users'?'👥':activeTab==='roles'?'🛡️':'📂'}</div>
              <div style={{fontSize:13,fontWeight:700,color:'#334155',marginBottom:4}}>No {activeTab} yet</div>
              <div style={{fontSize:12,color:'#94a3b8'}}>Click "+ Add" above to get started</div>
            </div>
          )}
        </div>

      </div>}

      {/* ════════════════════════════════════════════
          RESET PASSWORD MODAL
      ════════════════════════════════════════════ */}
      {resetModal.open&&(
        <div style={{position:'fixed',inset:0,background:'rgba(7,4,20,0.7)',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div className="xModalIn" style={{background:'#fff',borderRadius:20,width:'100%',maxWidth:420,boxShadow:'0 30px 80px rgba(0,0,0,0.28)',overflow:'hidden'}}>
            <div style={{padding:'12px 18px',background:'linear-gradient(135deg,#0f0c29,#1e1b4b,#0d1b4b)',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:-30,right:-20,width:100,height:100,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,0.4) 0%,transparent 70%)',pointerEvents:'none'}} />
              <button onClick={()=>setResetModal({open:false,userId:null,userName:''})} style={{position:'absolute',top:10,right:12,width:24,height:24,borderRadius:6,background:'rgba(255,255,255,.12)',border:'1px solid rgba(255,255,255,.18)',color:'#fff',fontSize:15,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}>×</button>
              <div style={{display:'flex',alignItems:'center',gap:10,position:'relative',zIndex:1}}>
                <div style={{width:32,height:32,borderRadius:9,background:'rgba(124,58,237,.25)',border:'1px solid rgba(124,58,237,.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>🔑</div>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:'#fff',lineHeight:1.2}}>Reset Password</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.45)',marginTop:1}}>for <strong style={{color:'#a78bfa'}}>{resetModal.userName}</strong></div>
                </div>
              </div>
            </div>
            <div style={{padding:'22px 24px'}}>
              <form onSubmit={handleReset}>
                <div style={{marginBottom:14}}>
                  <Label>New Password</Label>
                  <div style={{position:'relative'}}>
                    <Inp type={showRPwd?'text':'password'} style={{paddingRight:34}} value={resetForm.newPassword} onChange={e=>setResetForm({...resetForm,newPassword:e.target.value})} placeholder="Minimum 4 characters" required />
                    <button type="button" onClick={()=>setShowRPwd(v=>!v)} style={{position:'absolute',right:9,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94a3b8',padding:0,display:'flex'}}>{showRPwd?SVG_EYE_OFF:SVG_EYE_ON}</button>
                  </div>
                </div>
                <div style={{marginBottom:20}}>
                  <Label>Confirm Password</Label>
                  <Inp type={showRPwd?'text':'password'} style={resetForm.confirmPassword&&resetForm.newPassword!==resetForm.confirmPassword?{borderColor:'#ef4444'}:{}} value={resetForm.confirmPassword} onChange={e=>setResetForm({...resetForm,confirmPassword:e.target.value})} placeholder="Re-enter password" required />
                  {resetForm.confirmPassword&&resetForm.newPassword!==resetForm.confirmPassword&&<span style={{fontSize:10,color:'#ef4444',marginTop:3,display:'block'}}>Passwords do not match</span>}
                </div>
                <div style={{display:'flex',gap:10}}>
                  <button type="button" onClick={()=>setResetModal({open:false,userId:null,userName:''})} style={{flex:1,padding:'10px 0',border:'1.5px solid #e2e8f0',borderRadius:10,background:'#f8fafc',color:'#64748b',fontSize:13,fontWeight:700,cursor:'pointer'}}>Cancel</button>
                  <PriBtn type="submit" disabled={submitting} style={{flex:1,marginTop:0}}>{submitting?'Resetting...':'Reset Password'}</PriBtn>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ REPORTS PAGE (full tab) ══════════ */}
      {activeTab==='reports'&&(()=>{
        const now   = new Date();
        const month = now.getMonth();
        const year  = now.getFullYear();

        // ── helpers ──
        const daysSince = d => d ? Math.floor((Date.now()-new Date(d))/86400000) : null;
        const fmtDate   = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
        const fmtDT     = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})+' '+new Date(d).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '—';

        // ── report data ──
        const activityData = [...users].sort((a,b)=>{ const da=a.lastLogin?new Date(a.lastLogin):0,db=b.lastLogin?new Date(b.lastLogin):0; return db-da; });
        const newUsersData = users.filter(u=>{ const d=new Date(u.createdAt); return d.getMonth()===month&&d.getFullYear()===year; });
        const deptMap      = {};
        users.forEach(u=>{ const d=u.department||'Unassigned'; if(!deptMap[d])deptMap[d]={total:0,active:0,inactive:0}; deptMap[d].total++; u.isActive?deptMap[d].active++:deptMap[d].inactive++; });
        const deptData     = Object.entries(deptMap).sort((a,b)=>b[1].total-a[1].total);
        const roleMap      = {};
        users.forEach(u=>{ (u.roles||[]).forEach(r=>{ const n=r.name||r; if(!roleMap[n])roleMap[n]=0; roleMap[n]++; }); if(!u.roles||u.roles.length===0){ if(!roleMap['No Role'])roleMap['No Role']=0; roleMap['No Role']++; } });
        const roleData     = Object.entries(roleMap).sort((a,b)=>b[1]-a[1]);

        // ── CSV export ──
        const exportCSV = (rows, cols, filename) => {
          const header = cols.map(c=>c.label).join(',');
          const body   = rows.map(r=>cols.map(c=>{ const v=c.val(r); return `"${String(v||'').replace(/"/g,'""')}"`; }).join(',')).join('\n');
          const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(header+'\n'+body); a.download=filename+'.csv'; a.click();
        };

        const TH2 = {padding:'9px 14px',fontSize:10,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.7px',textAlign:'left',whiteSpace:'nowrap',borderBottom:'1px solid #f1f5f9',background:'#f8fafc'};
        const TD2 = {padding:'9px 14px',fontSize:12,color:'#374151',borderBottom:'1px solid #f8fafc',verticalAlign:'middle'};

        const activeUsers   = users.filter(u=>u.isActive).length;
        const inactiveUsers = users.length - activeUsers;
        const newThisMonth  = users.filter(u=>{ const d=new Date(u.createdAt); return d.getMonth()===month&&d.getFullYear()===year; }).length;
        const STAT_CARDS = [
          {ico:'👥',label:'Total Members',  val:users.length,  tab:'list',     bg:'linear-gradient(180deg,#6366f1,#8b5cf6)', ibg:'#eef2ff', nc:'#4338ca', bc:'#6366f1', lbc:'#e0e7ff', sh:'rgba(99,102,241,0.22)'},
          {ico:'✅',label:'Active Users',    val:activeUsers,   tab:'activity', bg:'linear-gradient(180deg,#10b981,#34d399)', ibg:'#ecfdf5', nc:'#065f46', bc:'#10b981', lbc:'#bbf7d0', sh:'rgba(16,185,129,0.22)'},
          {ico:'⏸',label:'Inactive Users',  val:inactiveUsers, tab:'activity', bg:'linear-gradient(180deg,#f43f5e,#fb7185)', ibg:'#fff1f2', nc:'#be123c', bc:'#f43f5e', lbc:'#fecdd3', sh:'rgba(244,63,94,0.22)'},
          {ico:'✨',label:'New This Month',  val:newThisMonth,  tab:'new',      bg:'linear-gradient(180deg,#f59e0b,#fbbf24)', ibg:'#fffbeb', nc:'#92400e', bc:'#f59e0b', lbc:'#fde68a', sh:'rgba(245,158,11,0.22)'},
        ];

        const SIDEBAR_ITEMS = [
          {k:'activity',ico:'🕐',l:'User Activity',   desc:'Login history'},
          {k:'list',    ico:'📋',l:'User List',        desc:'All users detail'},
          {k:'dept',    ico:'🏛️',l:'Department-wise',  desc:'Dept breakdown'},
          {k:'role',    ico:'🎭',l:'Role-wise',         desc:'Role distribution'},
          {k:'new',     ico:'✨',l:'New Users',         desc:'Joined this month'},
        ];

        return(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>

            {/* ── Summary stat cards ── */}
            <div className="xRptStats" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
              {STAT_CARDS.map(s=>(
                <div key={s.label} onClick={()=>setReportTab(s.tab)}
                  style={{background:'#fff',borderRadius:12,padding:'10px 14px',border:`1.5px solid ${reportTab===s.tab?s.bc:s.lbc}`,boxShadow:reportTab===s.tab?`0 4px 16px ${s.sh}`:'0 1px 4px rgba(0,0,0,0.06)',cursor:'pointer',transition:'all 0.18s',display:'flex',alignItems:'center',gap:12,position:'relative',overflow:'hidden'}}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow=`0 6px 18px ${s.sh}`;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=reportTab===s.tab?`0 4px 16px ${s.sh}`:'0 1px 4px rgba(0,0,0,0.06)';}}>
                  <div style={{position:'absolute',top:0,left:0,bottom:0,width:3,background:s.bg,borderRadius:'12px 0 0 12px'}} />
                  <div style={{width:36,height:36,borderRadius:10,background:s.ibg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{s.ico}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:22,fontWeight:900,color:s.nc,lineHeight:1}}>{s.val}</div>
                    <div style={{fontSize:10,fontWeight:700,color:'#64748b',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.label}</div>
                  </div>
                  {reportTab===s.tab&&<div style={{width:7,height:7,borderRadius:'50%',background:s.bc,flexShrink:0,boxShadow:`0 0 6px ${s.bc}`}} />}
                </div>
              ))}
            </div>

            {/* ── Main layout: sidebar + content ── */}
            <div className="xRptLayout" style={{display:'flex',gap:0,background:'#fff',borderRadius:18,border:'1px solid #e8edf5',overflow:'hidden',boxShadow:'0 4px 6px rgba(0,0,0,0.04),0 12px 30px rgba(79,70,229,0.08)',minHeight:500}}>

              {/* Sidebar */}
              <div className="xRptSidebar" style={{width:210,flexShrink:0,background:'linear-gradient(180deg,#0f0c29 0%,#1e1b4b 60%,#0d1b4b 100%)',padding:'20px 0',display:'flex',flexDirection:'column',gap:2}}>
                <div style={{padding:'0 16px 14px',borderBottom:'1px solid rgba(255,255,255,0.07)',marginBottom:6}}>
                  <div style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.35)',letterSpacing:'2px',textTransform:'uppercase'}}>Report Type</div>
                </div>
                {SIDEBAR_ITEMS.map(item=>{
                  const active = reportTab===item.k;
                  return(
                    <button key={item.k} onClick={()=>setReportTab(item.k)}
                      className={`xRptSideBtn${active?' xRptActive':''}`}
                      style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',background:active?'rgba(255,255,255,0.1)':'transparent',border:'none',cursor:'pointer',textAlign:'left',transition:'all 0.15s',position:'relative',borderLeft:active?'3px solid #10b981':'3px solid transparent',marginLeft:0}}>
                      <div style={{width:32,height:32,borderRadius:9,background:active?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0,transition:'all 0.15s'}}>{item.ico}</div>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:active?'#fff':'rgba(255,255,255,0.55)',transition:'color 0.15s'}}>{item.l}</div>
                        <div className="xRptSideBtnDesc" style={{fontSize:10,color:'rgba(255,255,255,0.28)',marginTop:1}}>{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
                <div style={{flex:1}} />
                <div style={{padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
                  <div style={{fontSize:9,color:'rgba(255,255,255,0.25)',textAlign:'center'}}>{now.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div>
                </div>
              </div>

              {/* Content panel */}
              <div className="xScroll" style={{flex:1,overflowY:'auto',padding:20}}>

                {/* Content header */}
                {(()=>{
                  const meta = {
                    activity:{ title:'User Activity Report',    sub:'Login history & inactivity overview',     ico:'🕐', c:'#4338ca' },
                    list:    { title:'Complete User List',       sub:'All user details across the team',         ico:'📋', c:'#0e7490' },
                    dept:    { title:'Department-wise Breakdown',sub:'User distribution by department',          ico:'🏛️', c:'#7e22ce' },
                    role:    { title:'Role-wise Distribution',   sub:'Users grouped by assigned roles',          ico:'🎭', c:'#b45309' },
                    new:     { title:`New Users — ${now.toLocaleDateString('en-IN',{month:'long',year:'numeric'})}`, sub:'Members who joined this month', ico:'✨', c:'#065f46' },
                  };
                  const m = meta[reportTab];
                  return(
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18,paddingBottom:16,borderBottom:'1.5px solid #f1f5f9'}}>
                      <div style={{width:42,height:42,borderRadius:12,background:`linear-gradient(135deg,${m.c}22,${m.c}44)`,border:`1.5px solid ${m.c}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{m.ico}</div>
                      <div>
                        <div style={{fontSize:16,fontWeight:800,color:'#0f172a',lineHeight:1.2}}>{m.title}</div>
                        <div style={{fontSize:11,color:'#64748b',marginTop:3}}>{m.sub}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── 1. USER ACTIVITY ── */}
                {reportTab==='activity'&&(
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                      <div style={{fontSize:13,fontWeight:700,color:'#0f172a'}}>Login Activity — All Users</div>
                      <button onClick={()=>exportCSV(activityData,[
                        {label:'Name',         val:u=>`${u.firstName} ${u.lastName}`},
                        {label:'Email',        val:u=>u.email},
                        {label:'Role',         val:u=>u.userType},
                        {label:'Department',   val:u=>u.department||'—'},
                        {label:'Status',       val:u=>u.isActive?'Active':'Inactive'},
                        {label:'Last Login',   val:u=>fmtDT(u.lastLogin)},
                        {label:'Inactive Days',val:u=>{ const d=daysSince(u.lastLogin); return d===null?'Never logged in':d+' days'; }},
                        {label:'Joined',       val:u=>fmtDate(u.createdAt)},
                      ],'user_activity_report')} style={{padding:'6px 14px',background:'#ecfdf5',border:'1px solid #6ee7b7',borderRadius:7,fontSize:11,fontWeight:700,color:'#059669',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>⬇ Export CSV</button>
                    </div>
                    <div style={{border:'1px solid #e2e8f0',borderRadius:10,overflow:'auto'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',minWidth:860}}>
                        <thead><tr>{['#','Name','Department','Status','Last Login','Inactive Since','Created By','Joined'].map(h=><th key={h} style={TH2}>{h}</th>)}</tr></thead>
                        <tbody>{activityData.map((u,i)=>{
                          const ds=daysSince(u.lastLogin);
                          const urgent=ds===null||ds>30;
                          return(
                            <tr key={u._id} style={{background:i%2?'#f8fafc':'#fff'}}>
                              <td style={{...TD2,color:'#94a3b8',width:28}}>{i+1}</td>
                              <td style={TD2}>
                                <div style={{display:'flex',alignItems:'center',gap:8}}>
                                  <div style={{width:30,height:30,borderRadius:8,background:avGrad(u.firstName),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:11,flexShrink:0}}>{u.firstName?.[0]}{u.lastName?.[0]}</div>
                                  <div>
                                    <div style={{fontWeight:700,color:'#0f172a',fontSize:12}}>{u.firstName} {u.lastName}</div>
                                    <div style={{fontSize:10,color:'#94a3b8'}}>{u.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={TD2}>{u.department||<span style={{color:'#cbd5e1'}}>—</span>}</td>
                              <td style={TD2}><span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:u.isActive?'#f0fdf4':'#fff1f2',color:u.isActive?'#16a34a':'#dc2626',border:`1px solid ${u.isActive?'#86efac':'#fca5a5'}`}}>{u.isActive?'Active':'Inactive'}</span></td>
                              <td style={TD2}>
                                {u.lastLogin
                                  ? <div>
                                      <div style={{fontSize:11,color:'#374151'}}>{fmtDT(u.lastLogin)}</div>
                                    </div>
                                  : <span style={{color:'#f59e0b',fontWeight:600,fontSize:11}}>Never</span>}
                              </td>
                              <td style={TD2}><span style={{fontWeight:600,color:urgent?'#dc2626':'#16a34a',fontSize:11}}>{ds===null?'Never logged in':ds===0?'Today':ds+' days ago'}</span></td>
                              <td style={TD2}>
                                {u.addedBy
                                  ? <div style={{display:'flex',alignItems:'center',gap:6}}>
                                      <div style={{width:24,height:24,borderRadius:'50%',background:avGrad(u.addedBy.firstName||'?'),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:9,flexShrink:0}}>{(u.addedBy.firstName||'?')[0].toUpperCase()}</div>
                                      <span style={{fontSize:11,fontWeight:600,color:'#374151'}}>{u.addedBy.firstName} {u.addedBy.lastName}</span>
                                    </div>
                                  : <span style={{color:'#cbd5e1',fontSize:11}}>—</span>}
                              </td>
                              <td style={TD2}>{fmtDate(u.createdAt)}</td>
                            </tr>
                          );
                        })}</tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── 2. USER LIST ── */}
                {reportTab==='list'&&(
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                      <div style={{fontSize:13,fontWeight:700,color:'#0f172a'}}>Complete User List</div>
                      <button onClick={()=>exportCSV(users,[
                        {label:'First Name',      val:u=>u.firstName},
                        {label:'Last Name',       val:u=>u.lastName},
                        {label:'Login Email',     val:u=>u.email},
                        {label:'Personal Email',  val:u=>u.personalEmail||''},
                        {label:'Work Email',      val:u=>u.officeEmail||''},
                        {label:'Phone',           val:u=>u.phone||''},
                        {label:'Alternate Phone', val:u=>u.alternatePhone||''},
                        {label:'Role',            val:u=>u.userType},
                        {label:'Department',      val:u=>u.department||''},
                        {label:'Sub Department',  val:u=>u.subDepartment||''},
                        {label:'Reporting Manager',val:u=>u.reportingManager||''},
                        {label:'Status',          val:u=>u.isActive?'Active':'Inactive'},
                        {label:'Login Name',      val:u=>u.loginName||''},
                        {label:'Last Login',      val:u=>fmtDT(u.lastLogin)},
                        {label:'Created By',      val:u=>u.addedBy?`${u.addedBy.firstName} ${u.addedBy.lastName}`:''},
                        {label:'Joined',          val:u=>fmtDate(u.createdAt)},
                      ],'user_list_report')} style={{padding:'6px 14px',background:'#ecfdf5',border:'1px solid #6ee7b7',borderRadius:7,fontSize:11,fontWeight:700,color:'#059669',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>⬇ Export CSV</button>
                    </div>
                    <div style={{border:'1px solid #e2e8f0',borderRadius:10,overflow:'auto'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',minWidth:900}}>
                        <thead><tr>{['#','Name','Role','Department','Phone','Status','Last Login','Created By','Joined'].map(h=><th key={h} style={TH2}>{h}</th>)}</tr></thead>
                        <tbody>{users.map((u,i)=>{
                          const ds = u.lastLogin ? Math.floor((Date.now()-new Date(u.lastLogin))/86400000) : null;
                          return(
                          <tr key={u._id} style={{background:i%2?'#f8fafc':'#fff'}}>
                            <td style={{...TD2,color:'#94a3b8',width:28}}>{i+1}</td>
                            <td style={TD2}>
                              <div style={{display:'flex',alignItems:'center',gap:8}}>
                                <div style={{width:30,height:30,borderRadius:8,background:avGrad(u.firstName),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:11,flexShrink:0}}>{u.firstName?.[0]}{u.lastName?.[0]}</div>
                                <div>
                                  <div style={{fontWeight:700,color:'#0f172a',fontSize:12}}>{u.firstName} {u.lastName}</div>
                                  <div style={{fontSize:10,color:'#94a3b8'}}>{u.email}</div>
                                  {u.loginName&&<div style={{fontSize:9,color:'#c4b5fd'}}>@{u.loginName}</div>}
                                </div>
                              </div>
                            </td>
                            <td style={TD2}><span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:6,background:'#eef2ff',color:'#4338ca'}}>{u.userType?.replace('TENANT_','')}</span></td>
                            <td style={TD2}>
                              <div style={{fontSize:12,color:'#374151'}}>{u.department||<span style={{color:'#cbd5e1'}}>—</span>}</div>
                              {u.subDepartment&&<div style={{fontSize:10,color:'#94a3b8'}}>{u.subDepartment}</div>}
                            </td>
                            <td style={TD2}>
                              <div style={{fontSize:11}}>{u.phone||<span style={{color:'#cbd5e1'}}>—</span>}</div>
                              {u.alternatePhone&&<div style={{fontSize:10,color:'#94a3b8'}}>{u.alternatePhone}</div>}
                            </td>
                            <td style={TD2}><span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:u.isActive?'#f0fdf4':'#fff1f2',color:u.isActive?'#16a34a':'#dc2626'}}>{u.isActive?'Active':'Inactive'}</span></td>
                            <td style={TD2}>
                              {u.lastLogin
                                ? <div>
                                    <div style={{fontSize:11,color:'#374151'}}>{fmtDate(u.lastLogin)}</div>
                                    <div style={{fontSize:10,color:ds>30?'#dc2626':'#16a34a',fontWeight:600}}>{ds===0?'Today':ds+' days ago'}</div>
                                  </div>
                                : <span style={{fontSize:10,fontWeight:600,color:'#f59e0b'}}>Never</span>}
                            </td>
                            <td style={TD2}>
                              {u.addedBy
                                ? <div style={{display:'flex',alignItems:'center',gap:6}}>
                                    <div style={{width:24,height:24,borderRadius:'50%',background:avGrad(u.addedBy.firstName||'?'),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:9,flexShrink:0}}>{(u.addedBy.firstName||'?')[0].toUpperCase()}</div>
                                    <div>
                                      <div style={{fontSize:11,fontWeight:600,color:'#374151'}}>{u.addedBy.firstName} {u.addedBy.lastName}</div>
                                      <div style={{fontSize:9,color:'#94a3b8'}}>{fmtDate(u.createdAt)}</div>
                                    </div>
                                  </div>
                                : <span style={{color:'#cbd5e1',fontSize:11}}>—</span>}
                            </td>
                            <td style={TD2}><div style={{fontSize:11}}>{fmtDate(u.createdAt)}</div></td>
                          </tr>
                          );
                        })}</tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── 3. DEPARTMENT-WISE ── */}
                {reportTab==='dept'&&(()=>{
                  const DCOLS = [
                    ['#6366f1','#818cf8','#eef2ff'],['#0ea5e9','#38bdf8','#e0f2fe'],
                    ['#10b981','#34d399','#ecfdf5'],['#f59e0b','#fbbf24','#fffbeb'],
                    ['#ec4899','#f472b6','#fdf2f8'],['#8b5cf6','#a78bfa','#f5f3ff'],
                    ['#14b8a6','#2dd4bf','#f0fdfa'],['#ef4444','#f87171','#fff1f2'],
                  ];
                  // build enhanced map with user list
                  const deptEx = {};
                  users.forEach(u=>{ const d=u.department||'Unassigned'; if(!deptEx[d])deptEx[d]={total:0,active:0,inactive:0,list:[]}; deptEx[d].total++; u.isActive?deptEx[d].active++:deptEx[d].inactive++; deptEx[d].list.push(u); });
                  const deptRows = Object.entries(deptEx).sort((a,b)=>b[1].total-a[1].total);
                  const bestActive = deptRows.reduce((a,b)=>((b[1].active/b[1].total)>(a[1].active/a[1].total)?b:a), deptRows[0]||['—',{active:0,total:1}]);

                  return(
                    <div>
                      {/* Export button */}
                      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
                        <button onClick={()=>exportCSV(deptRows.map(([d,v])=>({dept:d,...v})),[
                          {label:'Department',val:r=>r.dept},{label:'Total',val:r=>r.total},
                          {label:'Active',val:r=>r.active},{label:'Inactive',val:r=>r.inactive},
                          {label:'Active %',val:r=>Math.round((r.active/r.total)*100)+'%'},
                        ],'department_report')} style={{padding:'7px 16px',background:'#ecfdf5',border:'1px solid #6ee7b7',borderRadius:8,fontSize:11,fontWeight:700,color:'#059669',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
                          ⬇ Export CSV
                        </button>
                      </div>

                      {/* Summary strip */}
                      <div className="xSumStrip" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
                        {[
                          {ico:'🏛️',label:'Departments',   val:deptRows.length,        sub:'across the team',          c:'#6366f1',bg:'linear-gradient(135deg,#eef2ff,#e0e7ff)'},
                          {ico:'🏆',label:'Most Staffed',  val:deptRows[0]?.[0]||'—',  sub:`${deptRows[0]?.[1].total||0} members`,  c:'#0e7490',bg:'linear-gradient(135deg,#ecfeff,#cffafe)'},
                          {ico:'✅',label:'Best Active Rate',val:bestActive[0],          sub:`${Math.round((bestActive[1].active/bestActive[1].total)*100)}% active`, c:'#15803d',bg:'linear-gradient(135deg,#f0fdf4,#dcfce7)'},
                        ].map(s=>(
                          <div key={s.label} style={{background:s.bg,borderRadius:12,padding:'14px 16px',border:'1px solid rgba(0,0,0,0.04)'}}>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              <div style={{width:36,height:36,borderRadius:10,background:`${s.c}22`,border:`1.5px solid ${s.c}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0}}>{s.ico}</div>
                              <div>
                                <div style={{fontSize:15,fontWeight:900,color:s.c,lineHeight:1.1}}>{s.val}</div>
                                <div style={{fontSize:10,color:'#64748b',fontWeight:600,marginTop:2}}>{s.label}</div>
                                <div style={{fontSize:9,color:'#94a3b8',marginTop:1}}>{s.sub}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Department list cards */}
                      <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
                        {deptRows.map(([dept,v],i)=>{
                          const [c1,c2]=DCOLS[i%DCOLS.length];
                          const pct=Math.round((v.active/v.total)*100);
                          const pctColor=pct>=70?'#16a34a':pct>=40?'#d97706':'#dc2626';
                          return(
                            <div key={dept} style={{background:'#fff',borderRadius:11,border:'1px solid #e8edf5',display:'flex',alignItems:'center',gap:14,padding:'11px 16px',boxShadow:'0 1px 4px rgba(0,0,0,0.04)',transition:'box-shadow 0.15s'}}
                              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 14px rgba(0,0,0,0.09)'}
                              onMouseLeave={e=>e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'}>

                              {/* rank badge */}
                              <div style={{width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${c1},${c2})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,fontWeight:900,flexShrink:0}}>{i+1}</div>

                              {/* dept name + avatars */}
                              <div style={{minWidth:140,flexShrink:0}}>
                                <div style={{fontSize:13,fontWeight:800,color:'#0f172a',lineHeight:1.2}}>{dept}</div>
                                <div style={{display:'flex',alignItems:'center',marginTop:4}}>
                                  {v.list.slice(0,5).map((u,j)=>(
                                    <div key={u._id} title={`${u.firstName} ${u.lastName}`}
                                      style={{width:20,height:20,borderRadius:'50%',background:avGrad(u.firstName),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:8,border:'1.5px solid #fff',marginLeft:j>0?-5:0,flexShrink:0}}>
                                      {u.firstName?.[0]}{u.lastName?.[0]}
                                    </div>
                                  ))}
                                  {v.list.length>5&&<div style={{width:20,height:20,borderRadius:'50%',background:'#f1f5f9',border:'1.5px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,fontWeight:800,color:'#64748b',marginLeft:-5}}>+{v.list.length-5}</div>}
                                  <span style={{fontSize:10,color:'#94a3b8',marginLeft:6}}>{v.total} member{v.total!==1?'s':''}</span>
                                </div>
                              </div>

                              {/* bar — flex:1 */}
                              <div style={{flex:1,minWidth:80}}>
                                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                                  <span style={{fontSize:10,color:'#64748b'}}>Active rate</span>
                                  <span style={{fontSize:10,fontWeight:800,color:pctColor}}>{pct}%</span>
                                </div>
                                <div style={{height:6,borderRadius:3,background:'#fee2e2',overflow:'hidden'}}>
                                  <div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${c1},${c2})`,borderRadius:3,transition:'width 0.5s'}} />
                                </div>
                              </div>

                              {/* stats pills */}
                              <div style={{display:'flex',gap:6,flexShrink:0}}>
                                <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:20,background:'#f0fdf4',border:'1px solid #bbf7d0',fontSize:11,fontWeight:700,color:'#16a34a'}}>
                                  <span style={{width:6,height:6,borderRadius:'50%',background:'#16a34a',flexShrink:0}} />{v.active}
                                </span>
                                <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:20,background:'#fff1f2',border:'1px solid #fecdd3',fontSize:11,fontWeight:700,color:'#dc2626'}}>
                                  <span style={{width:6,height:6,borderRadius:'50%',background:'#dc2626',flexShrink:0}} />{v.inactive}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Compact comparison table */}
                      <div style={{border:'1px solid #e2e8f0',borderRadius:12,overflow:'hidden'}}>
                        <div style={{padding:'12px 16px',background:'linear-gradient(135deg,#f8fafc,#f1f5f9)',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontSize:13}}>📊</span>
                          <span style={{fontSize:12,fontWeight:800,color:'#0f172a'}}>Comparison Table</span>
                          <span style={{fontSize:10,color:'#64748b',marginLeft:4}}>sorted by headcount</span>
                        </div>
                        <table style={{width:'100%',borderCollapse:'collapse'}}>
                          <thead><tr>{['Rank','Department','Total','Active','Inactive','Active Rate'].map(h=><th key={h} style={TH2}>{h}</th>)}</tr></thead>
                          <tbody>{deptRows.map(([dept,v],i)=>{
                            const [c1,c2]=DCOLS[i%DCOLS.length];
                            const pct=Math.round((v.active/v.total)*100);
                            return(
                              <tr key={dept} style={{background:i%2?'#f8fafc':'#fff',transition:'background 0.15s'}}
                                onMouseEnter={e=>e.currentTarget.style.background='#f0f4ff'}
                                onMouseLeave={e=>e.currentTarget.style.background=i%2?'#f8fafc':'#fff'}>
                                <td style={{...TD2,width:40}}>
                                  <div style={{width:24,height:24,borderRadius:7,background:`linear-gradient(135deg,${c1},${c2})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:10,fontWeight:900}}>{i+1}</div>
                                </td>
                                <td style={{...TD2,fontWeight:700,color:'#0f172a'}}>
                                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                                    <div style={{width:8,height:8,borderRadius:'50%',background:`linear-gradient(135deg,${c1},${c2})`,flexShrink:0}} />
                                    {dept}
                                  </div>
                                </td>
                                <td style={{...TD2,fontWeight:800,color:c1,fontSize:14}}>{v.total}</td>
                                <td style={TD2}><span style={{padding:'2px 10px',borderRadius:20,background:'#f0fdf4',color:'#16a34a',fontSize:11,fontWeight:700,border:'1px solid #bbf7d0'}}>{v.active}</span></td>
                                <td style={TD2}><span style={{padding:'2px 10px',borderRadius:20,background:'#fff1f2',color:'#dc2626',fontSize:11,fontWeight:700,border:'1px solid #fecdd3'}}>{v.inactive}</span></td>
                                <td style={{...TD2,minWidth:160}}>
                                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                                    <div style={{flex:1,height:7,borderRadius:4,background:'#f1f5f9',overflow:'hidden'}}>
                                      <div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${c1},${c2})`,borderRadius:4}} />
                                    </div>
                                    <span style={{fontSize:11,fontWeight:800,color:pct>=70?'#16a34a':pct>=40?'#d97706':'#dc2626',minWidth:34,textAlign:'right'}}>{pct}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}</tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* ── 4. ROLE-WISE ── */}
                {reportTab==='role'&&(
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                      <div style={{fontSize:13,fontWeight:700,color:'#0f172a'}}>Role-wise User Count</div>
                      <button onClick={()=>exportCSV(roleData.map(([r,c])=>({role:r,count:c})),[
                        {label:'Role',  val:r=>r.role},
                        {label:'Users', val:r=>r.count},
                      ],'role_report')} style={{padding:'6px 14px',background:'#ecfdf5',border:'1px solid #6ee7b7',borderRadius:7,fontSize:11,fontWeight:700,color:'#059669',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>⬇ Export CSV</button>
                    </div>
                    <div className="xRptSumCards" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10,marginBottom:16}}>
                      {roleData.map(([role,count],i)=>{
                        const grads=['linear-gradient(135deg,#6366f1,#8b5cf6)','linear-gradient(135deg,#0ea5e9,#6366f1)','linear-gradient(135deg,#10b981,#0ea5e9)','linear-gradient(135deg,#f59e0b,#ef4444)','linear-gradient(135deg,#ec4899,#8b5cf6)'];
                        return(
                          <div key={role} style={{background:grads[i%grads.length],borderRadius:10,padding:'14px 16px',color:'#fff'}}>
                            <div style={{fontSize:26,fontWeight:900,lineHeight:1}}>{count}</div>
                            <div style={{fontSize:11,fontWeight:700,marginTop:4,opacity:0.85}}>{role}</div>
                            <div style={{fontSize:10,opacity:0.6,marginTop:2}}>{Math.round((count/users.length)*100)}% of users</div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{border:'1px solid #e2e8f0',borderRadius:10,overflow:'hidden'}}>
                      <table style={{width:'100%',borderCollapse:'collapse'}}>
                        <thead><tr>{['Role','Users','% of Total','Bar'].map(h=><th key={h} style={TH2}>{h}</th>)}</tr></thead>
                        <tbody>{roleData.map(([role,count],i)=>(
                          <tr key={role} style={{background:i%2?'#f8fafc':'#fff'}}>
                            <td style={{...TD2,fontWeight:700}}>{role}</td>
                            <td style={{...TD2,fontWeight:700,color:'#6366f1'}}>{count}</td>
                            <td style={TD2}>{Math.round((count/users.length)*100)}%</td>
                            <td style={{...TD2,minWidth:160}}><div style={{height:6,borderRadius:3,background:'#f1f5f9'}}><div style={{height:'100%',width:`${Math.round((count/users.length)*100)}%`,background:'linear-gradient(90deg,#6366f1,#8b5cf6)',borderRadius:3}} /></div></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── 5. NEW USERS THIS MONTH ── */}
                {reportTab==='new'&&(
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:'#0f172a'}}>New Users — {now.toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</div>
                        <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{newUsersData.length} users joined this month</div>
                      </div>
                      <button onClick={()=>exportCSV(newUsersData,[
                        {label:'Name',       val:u=>`${u.firstName} ${u.lastName}`},
                        {label:'Email',      val:u=>u.email},
                        {label:'Role',       val:u=>u.userType},
                        {label:'Department', val:u=>u.department||''},
                        {label:'Status',     val:u=>u.isActive?'Active':'Inactive'},
                        {label:'Created By', val:u=>u.addedBy?`${u.addedBy.firstName} ${u.addedBy.lastName}`:''},
                        {label:'Joined',     val:u=>fmtDT(u.createdAt)},
                      ],'new_users_report')} style={{padding:'6px 14px',background:'#ecfdf5',border:'1px solid #6ee7b7',borderRadius:7,fontSize:11,fontWeight:700,color:'#059669',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>⬇ Export CSV</button>
                    </div>
                    {newUsersData.length===0?(
                      <div style={{textAlign:'center',padding:'48px 20px',color:'#94a3b8',fontSize:13}}>No new users this month</div>
                    ):(
                      <div style={{border:'1px solid #e2e8f0',borderRadius:10,overflow:'hidden'}}>
                        <table style={{width:'100%',borderCollapse:'collapse'}}>
                          <thead><tr>{['#','Name','Email','Role','Department','Created By','Joined On'].map(h=><th key={h} style={TH2}>{h}</th>)}</tr></thead>
                          <tbody>{newUsersData.map((u,i)=>(
                            <tr key={u._id} style={{background:i%2?'#f8fafc':'#fff'}}>
                              <td style={{...TD2,color:'#94a3b8',width:32}}>{i+1}</td>
                              <td style={TD2}>
                                <div style={{display:'flex',alignItems:'center',gap:8}}>
                                  <div style={{width:28,height:28,borderRadius:8,background:avGrad(u.firstName),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:11,flexShrink:0}}>{u.firstName?.[0]}{u.lastName?.[0]}</div>
                                  <div style={{fontWeight:700,color:'#0f172a'}}>{u.firstName} {u.lastName}</div>
                                </div>
                              </td>
                              <td style={{...TD2,fontSize:11}}>{u.email}</td>
                              <td style={TD2}><span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:6,background:'#eef2ff',color:'#4338ca'}}>{u.userType?.replace('TENANT_','')}</span></td>
                              <td style={TD2}>{u.department||<span style={{color:'#cbd5e1'}}>—</span>}</td>
                              <td style={TD2}>
                                {u.addedBy
                                  ? <div style={{display:'flex',alignItems:'center',gap:5}}>
                                      <span style={{width:20,height:20,borderRadius:'50%',background:avGrad(u.addedBy.firstName||'?'),display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'#fff'}}>{(u.addedBy.firstName||'?')[0].toUpperCase()}</span>
                                      <span style={{fontSize:11,fontWeight:600}}>{u.addedBy.firstName} {u.addedBy.lastName}</span>
                                    </div>
                                  : <span style={{color:'#94a3b8'}}>—</span>
                                }
                              </td>
                              <td style={TD2}>{fmtDT(u.createdAt)}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════ BULK IMPORT MODAL ══════════ */}
      {bulkModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.65)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16,backdropFilter:'blur(3px)'}}>
          <div style={{background:'#fff',borderRadius:14,overflow:'hidden',width:'100%',maxWidth:780,maxHeight:'90vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 60px rgba(0,0,0,0.25)'}}>

            {/* Header */}
            <div style={{background:'linear-gradient(135deg,#0f0c29,#1e1b4b,#0d1b4b)',padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:38,height:38,borderRadius:10,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>📥</div>
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:'#fff'}}>Bulk Import Users</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:1}}>
                    Upload CSV · Max 100 users · Created by: <span style={{color:'#a5b4fc',fontWeight:700}}>{user?.firstName} {user?.lastName}</span> · {new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})} {new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                  </div>
                </div>
              </div>
              <button onClick={()=>setBulkModal(false)} style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:7,color:'#fff',width:28,height:28,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
            </div>

            <div style={{padding:20,overflowY:'auto',flex:1}}>
              {!bulkResult ? (
                <>
                  {/* Step 1: Download template + upload */}
                  <div className="xBulkGrid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                    <div style={{background:'#f8fafc',border:'1.5px dashed #c7d2fe',borderRadius:10,padding:'14px 16px'}}>
                      <div style={{fontSize:12,fontWeight:700,color:'#1e293b',marginBottom:4}}>Step 1 — Download Template</div>
                      <div style={{fontSize:11,color:'#64748b',marginBottom:10}}>Fill the CSV with user data. Required: firstName, lastName, email, password.</div>
                      <button onClick={()=>{
                        const csv = 'firstName,lastName,email,password,userType,phone,loginName,department\nJohn,Doe,john@example.com,pass1234,TENANT_USER,+91 9000000001,john.doe,Sales\nJane,Smith,jane@example.com,pass1234,TENANT_MANAGER,+91 9000000002,jane.smith,Marketing';
                        const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
                        a.download = 'users_template.csv'; a.click();
                      }} style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)',color:'#fff',border:'none',borderRadius:8,padding:'8px 14px',fontSize:12,fontWeight:700,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6}}>
                        ⬇ Download Template
                      </button>
                    </div>
                    <div style={{background:'#f8fafc',border:'1.5px dashed #c7d2fe',borderRadius:10,padding:'14px 16px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,cursor:'pointer',position:'relative'}}
                      onClick={()=>document.getElementById('csvFileInput').click()}>
                      <div style={{fontSize:28}}>📂</div>
                      <div style={{fontSize:12,fontWeight:700,color:'#1e293b'}}>Click to Upload CSV</div>
                      <div style={{fontSize:11,color:'#94a3b8'}}>.csv files only</div>
                      <input id="csvFileInput" type="file" accept=".csv" style={{display:'none'}} onChange={e=>{
                        const file = e.target.files[0]; if(!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => {
                          setBulkError(''); setBulkRows([]);
                          const lines = ev.target.result.split('\n').map(l=>l.trim()).filter(Boolean);
                          if(lines.length < 2){ setBulkError('CSV must have header + at least 1 data row'); return; }
                          const headers = lines[0].split(',').map(h=>h.trim().toLowerCase());
                          const required = ['firstname','lastname','email','password'];
                          const missing = required.filter(r=>!headers.includes(r));
                          if(missing.length){ setBulkError(`Missing columns: ${missing.join(', ')}`); return; }
                          const rows = lines.slice(1).map((line,i)=>{
                            const vals = line.split(',').map(v=>v.trim());
                            const obj = {};
                            headers.forEach((h,idx)=>{ obj[h]=vals[idx]||''; });
                            return {
                              _idx: i+1,
                              firstName: obj.firstname||'', lastName: obj.lastname||'',
                              email: obj.email||'', password: obj.password||'',
                              userType: obj.usertype||'TENANT_USER',
                              phone: obj.phone||'', loginName: obj.loginname||'',
                              department: obj.department||'',
                              _error: (!obj.firstname||!obj.lastname||!obj.email||!obj.password)?'Missing required fields':''
                            };
                          });
                          if(rows.length>100){ setBulkError('Max 100 users per import'); return; }
                          setBulkRows(rows);
                        };
                        reader.readAsText(file);
                        e.target.value='';
                      }} />
                    </div>
                  </div>

                  {bulkError&&<div style={{background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:8,padding:'9px 14px',fontSize:12,color:'#dc2626',fontWeight:600,marginBottom:12}}>⚠ {bulkError}</div>}

                  {/* Preview table */}
                  {bulkRows.length>0&&(
                    <>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                        <div style={{fontSize:12,fontWeight:700,color:'#1e293b'}}>{bulkRows.length} users ready · {bulkRows.filter(r=>r._error).length} with errors</div>
                        <button onClick={()=>setBulkRows([])} style={{fontSize:11,color:'#ef4444',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>Clear</button>
                      </div>
                      <div style={{border:'1px solid #e2e8f0',borderRadius:10,overflow:'hidden',maxHeight:280,overflowY:'auto'}}>
                        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                          <thead>
                            <tr style={{background:'#1e293b'}}>
                              {['#','First Name','Last Name','Email','Password','Role','Phone','Dept','Status'].map(h=>(
                                <th key={h} style={{padding:'7px 10px',color:'#94a3b8',fontWeight:700,fontSize:10,textTransform:'uppercase',textAlign:'left',whiteSpace:'nowrap'}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {bulkRows.map((r,i)=>(
                              <tr key={i} style={{background:r._error?'#fff5f5':i%2?'#f8fafc':'#fff',borderBottom:'1px solid #f1f5f9'}}>
                                <td style={{padding:'6px 10px',color:'#94a3b8',fontWeight:600}}>{r._idx}</td>
                                <td style={{padding:'6px 10px',fontWeight:600,color:r.firstName?'#0f172a':'#ef4444'}}>{r.firstName||'—'}</td>
                                <td style={{padding:'6px 10px',color:r.lastName?'#0f172a':'#ef4444'}}>{r.lastName||'—'}</td>
                                <td style={{padding:'6px 10px',color:r.email?'#0f172a':'#ef4444'}}>{r.email||'—'}</td>
                                <td style={{padding:'6px 10px',color:'#94a3b8'}}>{'•'.repeat(Math.min(r.password?.length||0,8))}</td>
                                <td style={{padding:'6px 10px'}}><span style={{fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:20,background:r.userType==='TENANT_ADMIN'?'#fffbeb':r.userType==='TENANT_MANAGER'?'#f5f3ff':'#eff6ff',color:r.userType==='TENANT_ADMIN'?'#92400e':r.userType==='TENANT_MANAGER'?'#5b21b6':'#1e40af'}}>{r.userType?.replace('TENANT_','')}</span></td>
                                <td style={{padding:'6px 10px',color:'#475569'}}>{r.phone||'—'}</td>
                                <td style={{padding:'6px 10px',color:'#475569'}}>{r.department||'—'}</td>
                                <td style={{padding:'6px 10px'}}>{r._error?<span style={{color:'#ef4444',fontSize:10,fontWeight:700}}>⚠ Error</span>:<span style={{color:'#16a34a',fontSize:10,fontWeight:700}}>✓ Ready</span>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{display:'flex',gap:8,marginTop:14,justifyContent:'flex-end'}}>
                        <button onClick={()=>setBulkModal(false)} style={{padding:'9px 18px',border:'1.5px solid #e2e8f0',borderRadius:9,background:'#f8fafc',color:'#374151',fontSize:13,fontWeight:700,cursor:'pointer'}}>Cancel</button>
                        <button disabled={bulkSubmitting||bulkRows.filter(r=>!r._error).length===0} onClick={async()=>{
                          const valid = bulkRows.filter(r=>!r._error);
                          if(!valid.length) return;
                          setBulkSubmitting(true);
                          try {
                            const res = await userService.bulkCreateUsers(valid.map(({_idx,_error,...rest})=>rest));
                            setBulkResult(res); loadData();
                          } catch(e){ setBulkError(e.response?.data?.message||'Import failed'); }
                          finally { setBulkSubmitting(false); }
                        }} style={{padding:'9px 22px',border:'none',borderRadius:9,background:bulkSubmitting?'#94a3b8':'linear-gradient(135deg,#4f46e5,#7c3aed)',color:'#fff',fontSize:13,fontWeight:700,cursor:bulkSubmitting?'not-allowed':'pointer',display:'flex',alignItems:'center',gap:7}}>
                          {bulkSubmitting?'Importing...':'Import '+bulkRows.filter(r=>!r._error).length+' Users'}
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                /* Results screen */
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:40,marginBottom:12}}>{bulkResult.results?.filter(r=>r.status==='failed').length===0?'🎉':'⚠️'}</div>
                  <div style={{fontSize:16,fontWeight:800,color:'#0f172a',marginBottom:4}}>{bulkResult.message}</div>
                  <div style={{fontSize:12,color:'#64748b',marginBottom:16}}>Import complete</div>
                  <div style={{border:'1px solid #e2e8f0',borderRadius:10,overflow:'hidden',maxHeight:280,overflowY:'auto',textAlign:'left',marginBottom:16}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead><tr style={{background:'#1e293b'}}>
                        {['Row','Email','Status','Created By','Note'].map(h=><th key={h} style={{padding:'7px 12px',fontWeight:700,color:'#94a3b8',fontSize:10,textTransform:'uppercase',borderBottom:'1px solid #334155',textAlign:'left',whiteSpace:'nowrap'}}>{h}</th>)}
                      </tr></thead>
                      <tbody>{bulkResult.results?.map((r,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid #f8fafc',background:r.status==='failed'?'#fff5f5':i%2?'#f8fafc':'#fff'}}>
                          <td style={{padding:'6px 12px',color:'#94a3b8'}}>{r.row}</td>
                          <td style={{padding:'6px 12px',color:'#0f172a',fontWeight:500}}>{r.email}</td>
                          <td style={{padding:'6px 12px'}}><span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:r.status==='created'?'#dcfce7':'#fee2e2',color:r.status==='created'?'#15803d':'#dc2626'}}>{r.status==='created'?'✓ Created':'✗ Failed'}</span></td>
                          <td style={{padding:'6px 12px'}}>
                            {r.status==='created'
                              ? <div style={{display:'flex',alignItems:'center',gap:5}}>
                                  <span style={{width:20,height:20,borderRadius:'50%',background:avGrad(user?.firstName||'?'),display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'#fff',flexShrink:0}}>{(user?.firstName||'?')[0].toUpperCase()}</span>
                                  <div>
                                    <div style={{fontSize:11,fontWeight:600,color:'#0f172a',lineHeight:1.2}}>{user?.firstName} {user?.lastName}</div>
                                    <div style={{fontSize:9,color:'#94a3b8'}}>{new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div>
                                  </div>
                                </div>
                              : <span style={{color:'#94a3b8',fontSize:11}}>—</span>
                            }
                          </td>
                          <td style={{padding:'6px 12px',fontSize:11,color:'#64748b'}}>{r.error||'—'}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <button onClick={()=>setBulkModal(false)} style={{padding:'10px 28px',border:'none',borderRadius:9,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Done</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const TH = { padding:'8px 14px', fontSize:10, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.8px', borderBottom:'1px solid #f1f5f9', textAlign:'left', whiteSpace:'nowrap', background:'#f8fafc' };
const TD = { padding:'9px 14px', fontSize:13, color:'#334155', verticalAlign:'middle' };

export default TeamManagement;
