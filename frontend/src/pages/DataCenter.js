import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Country, State, City } from 'country-state-city';

import dataCenterService from '../services/dataCenterService';
import productService from '../services/productService';
import BulkCommunication from '../components/BulkCommunication';
import DynamicField from '../components/DynamicField';
import fieldDefinitionService from '../services/fieldDefinitionService';
import { Settings, List, LayoutGrid } from 'lucide-react';
import ManageFieldsPanel from '../components/ManageFieldsPanel';
import '../styles/crm.css';

// --- Country/State/City cascade helpers ---
const DC_OCEANIA_CODES = new Set(['AU','FJ','KI','MH','FM','NR','NZ','PW','PG','WS','SB','TO','TV','VU','CK','NU','TK','WF','PF','NC','GU','MP','AS','UM','PN']);
const dcGetContinent = (country) => {
  if (DC_OCEANIA_CODES.has(country.isoCode)) return 'Oceania';
  const tz = (country.timezones && country.timezones[0] && country.timezones[0].zoneName) || '';
  const prefix = tz.split('/')[0];
  const map = { Africa:'Africa', America:'Americas', Asia:'Asia', Atlantic:'Europe', Europe:'Europe', Indian:'Asia', Pacific:'Oceania', Arctic:'Europe', Australia:'Oceania' };
  return map[prefix] || 'Other';
};
const DC_CONTINENT_ORDER = ['Asia', 'Europe', 'Americas', 'Africa', 'Oceania', 'Other'];
const DC_ALL_COUNTRIES = Country.getAllCountries();
const DC_GROUPED_COUNTRIES = (() => {
  const g = {};
  DC_ALL_COUNTRIES.forEach(c => { const cont = dcGetContinent(c); if (!g[cont]) g[cont] = []; g[cont].push(c); });
  return g;
})();
const DC_CONTINENT_ICONS = { Asia:'🌏', Europe:'🌍', Americas:'🌎', Africa:'🌍', Oceania:'🌏', Other:'🌐' };

const DCCountrySelect = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const [expandedCont, setExpandedCont] = React.useState(null);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  React.useEffect(() => {
    if (open && value) { const c = DC_ALL_COUNTRIES.find(c => c.name === value); if (c) setExpandedCont(dcGetContinent(c)); }
    if (!open) setExpandedCont(null);
  }, [open, value]);
  const sel = DC_ALL_COUNTRIES.find(c => c.name === value);
  const triggerStyle = { width:'100%', padding:'8px 10px', fontSize:'13px', border:'1px solid #e2e8f0', borderRadius:'6px', background:'#fff', textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:'7px', outline:'none', color: value ? '#1e293b' : '#94a3b8', boxSizing:'border-box' };
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <style>{`
  /* ── RESPONSIVE ────────────────── */
  @media(max-width:768px){
    .datacent-grid4,.datacent-grid3{grid-template-columns:repeat(2,1fr)!important;}
    .datacent-grid2{grid-template-columns:1fr!important;}
    .datacent-split{flex-direction:column!important; height:auto!important; overflow:visible!important;}
    .datacent-sidebar{width:100%!important;min-width:unset!important;max-width:unset!important;}
    .datacent-panel{width:100%!important;}
    .datacent-table{overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .datacent-form-row{grid-template-columns:1fr!important;}
    .datacent-hide{display:none!important;}
    #datacenter-split-container{flex-direction:column!important;height:auto!important;overflow:visible!important;}
    #datacenter-split-container > div{flex:1 1 100%!important;width:100%!important;max-height:none!important;border-right:none!important;border-bottom:1px solid #e0e0e0;}
    .dc-wizard-bottom{flex-wrap:nowrap!important;gap:8px!important;}
    .dc-wizard-bottom button{white-space:nowrap!important;}
    .dc-wizard-dots{display:none!important;}
    .dc-wizard-bottom .dc-save-btn{flex:1 1 auto!important;text-align:center!important;}
    .resp-grid-6{grid-template-columns:repeat(2,1fr)!important;}
    .dc-filter-grid{grid-template-columns:repeat(2,1fr)!important;}
    .dc-action-bar{flex-wrap:wrap!important;gap:6px!important;}
    .dc-divider{display:none!important;}
  }
  @media(max-width:480px){
    .datacent-grid4,.datacent-grid3,.datacent-grid2{grid-template-columns:1fr!important;}
    .resp-grid-6{grid-template-columns:1fr 1fr!important;}
    .dc-action-bar button{font-size:11px!important;padding:6px 8px!important;}
  }
`}</style>
      <label style={{ display:'block', fontSize:'11px', fontWeight:'700', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.4px', color:'#475569' }}>Country</label>
      <button type="button" onClick={() => setOpen(o => !o)} style={triggerStyle}>
        {sel ? <><span style={{ fontSize:'15px', lineHeight:1 }}>{sel.flag}</span><span style={{ flex:1, fontSize:'13px' }}>{sel.name}</span></> : <span style={{ flex:1 }}>-- Select Country --</span>}
        <span style={{ color:'#94a3b8', fontSize:'10px', marginLeft:'auto' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:9999, background:'#fff', border:'1px solid #e2e8f0', borderRadius:'7px', boxShadow:'0 6px 20px rgba(0,0,0,0.13)', marginTop:'3px', overflow:'hidden' }}>
          <div style={{ maxHeight:'280px', overflowY:'auto' }}>
            {DC_CONTINENT_ORDER.map(cont => {
              const countries = DC_GROUPED_COUNTRIES[cont];
              if (!countries?.length) return null;
              const isExp = expandedCont === cont;
              return (
                <div key={cont}>
                  <div onMouseDown={(e) => { e.preventDefault(); setExpandedCont(isExp ? null : cont); }}
                    style={{ padding:'7px 10px', cursor:'pointer', display:'flex', alignItems:'center', gap:'7px', background: isExp ? '#eff6ff' : '#f8fafc', borderBottom:'1px solid #f1f5f9', userSelect:'none' }}>
                    <span style={{ fontSize:'14px' }}>{DC_CONTINENT_ICONS[cont]}</span>
                    <span style={{ flex:1, fontSize:'12px', fontWeight:'700', color: isExp ? '#1d4ed8' : '#374151' }}>{cont}</span>
                    <span style={{ fontSize:'10px', color:'#94a3b8' }}>{countries.length}</span>
                    <span style={{ fontSize:'10px', color: isExp ? '#3b82f6' : '#94a3b8' }}>{isExp ? '▼' : '▶'}</span>
                  </div>
                  {isExp && countries.map(c => (
                    <div key={c.isoCode} onMouseDown={() => { onChange(c); setOpen(false); }}
                      style={{ padding:'6px 10px 6px 28px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', background: value === c.name ? '#dbeafe' : '#fff', color: value === c.name ? '#1d4ed8' : '#1e293b', fontWeight: value === c.name ? '600' : '400', borderBottom:'1px solid #f8fafc' }}
                      onMouseEnter={e => { if (value !== c.name) e.currentTarget.style.background = '#f0f9ff'; }}
                      onMouseLeave={e => { if (value !== c.name) e.currentTarget.style.background = '#fff'; }}>
                      <span style={{ fontSize:'14px', lineHeight:1 }}>{c.flag}</span><span>{c.name}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const DCStateSelect = ({ value, countryIso, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const states = countryIso ? State.getStatesOfCountry(countryIso) : [];
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const triggerStyle = { width:'100%', padding:'8px 10px', fontSize:'13px', border:'1px solid #e2e8f0', borderRadius:'6px', background: !countryIso ? '#f9fafb' : '#fff', textAlign:'left', cursor: !countryIso ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', gap:'7px', outline:'none', color: value ? '#1e293b' : '#94a3b8', boxSizing:'border-box' };
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <label style={{ display:'block', fontSize:'11px', fontWeight:'700', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.4px', color:'#475569' }}>State</label>
      <button type="button" disabled={!countryIso} onClick={() => countryIso && setOpen(o => !o)} style={triggerStyle}>
        <span style={{ flex:1 }}>{value || (countryIso ? '-- Select State --' : '-- Select Country First --')}</span>
        <span style={{ color:'#94a3b8', fontSize:'10px', marginLeft:'auto' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:9999, background:'#fff', border:'1px solid #e2e8f0', borderRadius:'7px', boxShadow:'0 6px 20px rgba(0,0,0,0.13)', marginTop:'3px', overflow:'hidden' }}>
          <div style={{ maxHeight:'280px', overflowY:'auto' }}>
            {states.map(s => (
              <div key={s.isoCode} onMouseDown={() => { onChange(s.name, s.isoCode); setOpen(false); }}
                style={{ padding:'7px 12px', cursor:'pointer', display:'flex', alignItems:'center', fontSize:'12px', background: value === s.name ? '#dbeafe' : '#fff', color: value === s.name ? '#1d4ed8' : '#1e293b', fontWeight: value === s.name ? '600' : '400', borderBottom:'1px solid #f8fafc' }}
                onMouseEnter={e => { if (value !== s.name) e.currentTarget.style.background = '#f0f9ff'; }}
                onMouseLeave={e => { if (value !== s.name) e.currentTarget.style.background = '#fff'; }}>
                {s.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DCCitySelect = ({ value, countryIso, stateIso, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const cities = (countryIso && stateIso) ? City.getCitiesOfState(countryIso, stateIso) : [];
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const triggerStyle = { width:'100%', padding:'8px 10px', fontSize:'13px', border:'1px solid #e2e8f0', borderRadius:'6px', background: !stateIso ? '#f9fafb' : '#fff', textAlign:'left', cursor: !stateIso ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', gap:'7px', outline:'none', color: value ? '#1e293b' : '#94a3b8', boxSizing:'border-box' };
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <label style={{ display:'block', fontSize:'11px', fontWeight:'700', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.4px', color:'#475569' }}>City</label>
      <button type="button" disabled={!stateIso} onClick={() => stateIso && setOpen(o => !o)} style={triggerStyle}>
        <span style={{ flex:1 }}>{value || (stateIso ? '-- Select City --' : '-- Select State First --')}</span>
        <span style={{ color:'#94a3b8', fontSize:'10px', marginLeft:'auto' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:9999, background:'#fff', border:'1px solid #e2e8f0', borderRadius:'7px', boxShadow:'0 6px 20px rgba(0,0,0,0.13)', marginTop:'3px', overflow:'hidden' }}>
          <div style={{ maxHeight:'280px', overflowY:'auto' }}>
            {cities.map((c, idx) => (
              <div key={idx} onMouseDown={() => { onChange(c.name); setOpen(false); }}
                style={{ padding:'7px 12px', cursor:'pointer', display:'flex', alignItems:'center', fontSize:'12px', background: value === c.name ? '#dbeafe' : '#fff', color: value === c.name ? '#1d4ed8' : '#1e293b', fontWeight: value === c.name ? '600' : '400', borderBottom:'1px solid #f8fafc' }}
                onMouseEnter={e => { if (value !== c.name) e.currentTarget.style.background = '#f0f9ff'; }}
                onMouseLeave={e => { if (value !== c.name) e.currentTarget.style.background = '#fff'; }}>
                {c.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DEFAULT_CUSTOMER_FIELDS = [
  { fieldName: 'customerName', label: 'Customer Name', fieldType: 'text', section: 'Basic Information', isRequired: true, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 1 },
  { fieldName: 'customerType', label: 'Customer Type', fieldType: 'dropdown', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 2, options: [{ label: 'Customer', value: 'Customer' }, { label: 'Prospect', value: 'Prospect' }, { label: 'Partner', value: 'Partner' }, { label: 'Reseller', value: 'Reseller' }, { label: 'Other', value: 'Other' }] },
  { fieldName: 'email', label: 'Email *', fieldType: 'email', section: 'Basic Information', isRequired: true, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 3, validations: { maxLength: 100 } },
  { fieldName: 'phone', label: 'Phone (Optional)', fieldType: 'phone', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 4 },
  { fieldName: 'gstin', label: 'GSTIN (Optional)', fieldType: 'text', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 5, validations: { maxLength: 15, pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/ }, placeholder: '29ABCDE1234F1Z5' },
  { fieldName: 'currentDesignation', label: 'Current Designation *', fieldType: 'dropdown', section: 'Professional Information', isRequired: true, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 10, options: [{ label: 'Software Engineer', value: 'Software Engineer' }, { label: 'Senior Software Engineer', value: 'Senior Software Engineer' }, { label: 'Lead Engineer', value: 'Lead Engineer' }, { label: 'Principal Engineer', value: 'Principal Engineer' }, { label: 'Engineering Manager', value: 'Engineering Manager' }, { label: 'Frontend Developer', value: 'Frontend Developer' }, { label: 'Backend Developer', value: 'Backend Developer' }, { label: 'Full Stack Developer', value: 'Full Stack Developer' }, { label: 'DevOps Engineer', value: 'DevOps Engineer' }, { label: 'Data Scientist', value: 'Data Scientist' }, { label: 'Data Analyst', value: 'Data Analyst' }, { label: 'Business Analyst', value: 'Business Analyst' }, { label: 'Product Manager', value: 'Product Manager' }, { label: 'Project Manager', value: 'Project Manager' }, { label: 'Scrum Master', value: 'Scrum Master' }, { label: 'QA Engineer', value: 'QA Engineer' }, { label: 'UI/UX Designer', value: 'UI/UX Designer' }, { label: 'Sales Executive', value: 'Sales Executive' }, { label: 'Sales Manager', value: 'Sales Manager' }, { label: 'Marketing Executive', value: 'Marketing Executive' }, { label: 'HR Executive', value: 'HR Executive' }, { label: 'HR Manager', value: 'HR Manager' }, { label: 'Recruiter', value: 'Recruiter' }, { label: 'Finance Analyst', value: 'Finance Analyst' }, { label: 'Accountant', value: 'Accountant' }, { label: 'Operations Executive', value: 'Operations Executive' }, { label: 'Team Lead', value: 'Team Lead' }, { label: 'Director', value: 'Director' }, { label: 'VP', value: 'VP' }, { label: 'CTO', value: 'CTO' }, { label: 'CEO', value: 'CEO' }, { label: 'Other', value: 'Other' }] },
  { fieldName: 'currentCompany', label: 'Current Company (Optional)', fieldType: 'text', section: 'Professional Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 11 },
  { fieldName: 'totalExperience', label: 'Total Experience (yrs) (Optional)', fieldType: 'number', section: 'Professional Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 12 },
  { fieldName: 'skills', label: 'Skills', fieldType: 'text', section: 'Skills & Experience', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 20 },
  { fieldName: 'country', label: 'Country', fieldType: 'dropdown', section: 'Location & Availability', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 30 },
  { fieldName: 'state', label: 'State', fieldType: 'dropdown', section: 'Location & Availability', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 31 },
  { fieldName: 'city', label: 'City', fieldType: 'dropdown', section: 'Location & Availability', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 32 },
  { fieldName: 'availability', label: 'Availability', fieldType: 'dropdown', section: 'Location & Availability', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 33, options: [{ label: 'Immediate', value: 'Immediate' }, { label: '15 Days', value: '15 Days' }, { label: '30 Days', value: '30 Days' }, { label: '45 Days', value: '45 Days' }, { label: '60 Days', value: '60 Days' }] },
  { fieldName: 'currentCTC', label: 'Current CTC', fieldType: 'number', section: 'Salary Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 40 },
  { fieldName: 'expectedCTC', label: 'Expected CTC', fieldType: 'number', section: 'Salary Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 41 },
  { fieldName: 'status', label: 'Status', fieldType: 'dropdown', section: 'Status', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 50, options: [{ label: 'Available', value: 'Available' }, { label: 'Not Available', value: 'Not Available' }, { label: 'Placed', value: 'Placed' }] },
  { fieldName: 'sourceWebsite', label: 'Source Website', fieldType: 'text', section: 'Source Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 60 },
];
const CUST_DISABLED_KEY = 'crm_cust_std_disabled';
const getCustDisabled = () => { try { return JSON.parse(localStorage.getItem(CUST_DISABLED_KEY) || '[]'); } catch { return []; } };
const CUSTOMER_SECTIONS = ['Basic Information', 'Professional Information', 'Skills & Experience', 'Location & Availability', 'Salary Information', 'Status', 'Source Information', 'Additional Information'];

const CUSTOMER_WIZARD_STEPS = [
  { label: 'Basic Info',     icon: '👤', desc: 'Name, type & contact',           sections: ['Basic Information'] },
  { label: 'Professional',   icon: '💼', desc: 'Designation, company & experience', sections: ['Professional Information'] },
  { label: 'Skills',         icon: '🛠️', desc: 'Skills & experience',              sections: ['Skills & Experience'] },
  { label: 'Location',       icon: '📍', desc: 'Location & availability',          sections: ['Location & Availability'] },
  { label: 'Salary & More',  icon: '💰', desc: 'CTC, status & source',            sections: ['Salary Information', 'Status', 'Source Information', 'Additional Information'] },
];

const DataCenter = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const fileInputRef = useRef(null);

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [selectAllPages, setSelectAllPages] = useState(false); // Select all across pages
  const [showFilters, setShowFilters] = useState(false);
  const [showMoveForm, setShowMoveForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  // Split View Panel State
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [selectedCandidateData, setSelectedCandidateData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDetailMoveForm, setShowDetailMoveForm] = useState(false);
  const [detailMoveForm, setDetailMoveForm] = useState({ leadStatus: 'New', leadSource: 'Customer', rating: 'Warm' });

  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [showBulkWhatsAppModal, setShowBulkWhatsAppModal] = useState(false);
  const [showBulkSMSModal, setShowBulkSMSModal] = useState(false);
  const [myProducts, setMyProducts] = useState([]);
  const [bulkEmailData, setBulkEmailData] = useState({ subject: '', message: '' });
  const [bulkWhatsAppData, setBulkWhatsAppData] = useState({ message: '' });
  const [bulkSMSData, setBulkSMSData] = useState({ message: '' });
  const [sendingBulk, setSendingBulk] = useState(false);

  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  const [filters, setFilters] = useState({
    search: '', skills: '', experience_min: '', experience_max: '', location: '',
    availability: '', lastActive: '', ctc_min: '', ctc_max: '', status: '', sourceWebsite: ''
  });
  const [searchError, setSearchError] = useState('');

  const [moveForm, setMoveForm] = useState({ leadStatus: 'New', leadSource: 'Customer', rating: 'Warm', assignTo: '' });

  const [stats, setStats] = useState({ total: 0, available: 0, immediate: 0, thisWeek: 0 });

  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [displayColumns, setDisplayColumns] = useState([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Manage Fields
  const [showManageFields, setShowManageFields] = useState(false);
  const [customFieldDefs, setCustomFieldDefs] = useState([]);
  const [disabledStdFields, setDisabledStdFieldsState] = useState(getCustDisabled);
  const [togglingField, setTogglingField] = useState(null);

  const [wizardStep, setWizardStep] = useState(0);

  // Compute active wizard steps based on field definitions
  const activeWizardSteps = useMemo(() => {
    const grouped = {};
    fieldDefinitions.forEach(field => {
      if (field.isActive && field.showInCreate !== false) {
        const section = field.section || 'Additional Information';
        if (!grouped[section]) grouped[section] = [];
        grouped[section].push(field);
      }
    });

    return CUSTOMER_WIZARD_STEPS.filter(step => {
      return step.sections.some(sectionName => {
        return grouped[sectionName] && grouped[sectionName].length > 0;
      });
    });
  }, [fieldDefinitions]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [selectedCountryIso, setSelectedCountryIso] = useState('');
  const [selectedStateIso, setSelectedStateIso] = useState('');
  const [detailPanelWidth, setDetailPanelWidth] = useState(42);
  const [detailExpanded, setDetailExpanded] = useState(false);


  const extractColumns = (candidatesData) => {
    if (!candidatesData || candidatesData.length === 0) return [];

    // Get active fields from field definitions
    const activeFields = fieldDefinitions
      .filter(f => f.isActive && f.showInCreate !== false)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(f => f.fieldName);

    // If no field definitions loaded yet, fall back to extracting from data
    if (activeFields.length === 0) {
      const allKeys = new Set();
      const excludeKeys = ['_id', '__v', 'tenant', 'importedBy', 'importedAt', 'createdAt', 'updatedAt', 'movedBy', 'movedToTenant', 'leadId', 'isActive', 'dataSource', 'customerNumber'];

      candidatesData.forEach(candidate => {
        Object.keys(candidate).forEach(key => {
          if (!excludeKeys.includes(key) && candidate[key] !== null && candidate[key] !== undefined && candidate[key] !== '') {
            allKeys.add(key);
          }
        });
      });

      const columnsArray = Array.from(allKeys);
      const statusIndex = columnsArray.indexOf('status');
      if (statusIndex > -1) {
        columnsArray.splice(statusIndex, 1);
        columnsArray.push('status');
      }
      return columnsArray;
    }

    // Return only active fields in correct order
    return activeFields;
  };

  const loadCandidates = async (overrideFilters) => {
    try {
      setLoading(true);
      const activeFilters = overrideFilters !== undefined ? overrideFilters : filters;
      const params = { page: pagination.page, limit: pagination.limit, ...activeFilters };
      const response = await dataCenterService.getCandidates(params);
      const candidatesData = response.data.candidates;
      setCandidates(candidatesData);
      setPagination(response.data.pagination);

      const newColumns = extractColumns(candidatesData);
      if (newColumns.length > 0) {
        const mergedColumns = [...new Set([...displayColumns, ...newColumns])];
        setDisplayColumns(mergedColumns);
      }

      const available = candidatesData.filter(c => c.status === 'Available').length;
      const immediate = candidatesData.filter(c => c.availability === 'Immediate').length;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const thisWeek = candidatesData.filter(c => new Date(c.lastActiveOn) >= weekAgo).length;

      setStats({ total: response.data.pagination.total, available, immediate, thisWeek });
    } catch (error) {
      if (error?.isPermissionDenied) return;
      console.error('Error loading candidates:', error);
      alert('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
    loadMyProducts();
    loadFieldDefinitions();
  }, [pagination.page, pagination.limit]);

  const buildCustFields = (disabled, customs) => [
    ...DEFAULT_CUSTOMER_FIELDS.filter(f => !disabled.includes(f.fieldName)).map(f => ({ ...f, isActive: true, _isStd: true })),
    ...customs.filter(f => f.isActive && f.showInCreate),
  ].sort((a, b) => a.displayOrder - b.displayOrder);

  const allFieldDefs = [
    ...DEFAULT_CUSTOMER_FIELDS.map(f => ({ ...f, isActive: !disabledStdFields.includes(f.fieldName), _isStd: true })),
    ...customFieldDefs,
  ].sort((a, b) => a.displayOrder - b.displayOrder);

  const loadFieldDefinitions = async () => {
    try {
      const response = await fieldDefinitionService.getFieldDefinitions('Candidate', true);
      const customs = (Array.isArray(response) ? response : []).filter(f => !f.isStandardField);
      setCustomFieldDefs(customs);
      setFieldDefinitions(buildCustFields(disabledStdFields, customs));
    } catch (error) {
      console.error('Load field definitions error:', error);
    }
  };

  const handleToggleField = async (field) => {
    setTogglingField(field.fieldName);
    if (field._isStd) {
      const newDisabled = disabledStdFields.includes(field.fieldName)
        ? disabledStdFields.filter(n => n !== field.fieldName)
        : [...disabledStdFields, field.fieldName];
      localStorage.setItem(CUST_DISABLED_KEY, JSON.stringify(newDisabled));
      setDisabledStdFieldsState(newDisabled);
      setFieldDefinitions(buildCustFields(newDisabled, customFieldDefs));
    } else {
      try {
        await fieldDefinitionService.toggleFieldStatus(field._id, !field.isActive);
        const updated = customFieldDefs.map(f => f._id === field._id ? { ...f, isActive: !f.isActive } : f);
        setCustomFieldDefs(updated);
        setFieldDefinitions(buildCustFields(disabledStdFields, updated));
      } catch (err) { console.error('Toggle error:', err); }
    }
    setTogglingField(null);
  };

  const handleAddCustomField = async (fieldData) => {
    const created = await fieldDefinitionService.createFieldDefinition({ entityType: 'Candidate', isStandardField: false, showInCreate: true, showInEdit: true, showInDetail: true, ...fieldData });
    const updated = [...customFieldDefs, { ...created, isActive: true }].sort((a, b) => a.displayOrder - b.displayOrder);
    setCustomFieldDefs(updated);
    setFieldDefinitions(buildCustFields(disabledStdFields, updated));
  };

  const groupFieldsBySection = (fields) => {
    const grouped = {};
    fields.forEach(field => {
      // Only include active fields that should be shown in create form
      if (field.isActive && field.showInCreate !== false) {
        const section = field.section || 'Additional Information';
        if (!grouped[section]) grouped[section] = [];
        grouped[section].push(field);
      }
    });
    return grouped;
  };

  const handleFieldChange = (fieldName, value) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }));
    setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
  };

  const renderDynamicField = (field) => {
    if (field.fieldName === 'country') {
      return (
        <DCCountrySelect
          value={fieldValues['country'] || ''}
          onChange={(countryObj) => {
            handleFieldChange('country', countryObj.name);
            setSelectedCountryIso(countryObj.isoCode);
            handleFieldChange('state', '');
            handleFieldChange('city', '');
            setSelectedStateIso('');
          }}
        />
      );
    }
    if (field.fieldName === 'state') {
      return (
        <DCStateSelect
          value={fieldValues['state'] || ''}
          countryIso={selectedCountryIso}
          onChange={(stateName, stateIso) => {
            handleFieldChange('state', stateName);
            setSelectedStateIso(stateIso);
            handleFieldChange('city', '');
          }}
        />
      );
    }
    if (field.fieldName === 'city') {
      return (
        <DCCitySelect
          value={fieldValues['city'] || ''}
          countryIso={selectedCountryIso}
          stateIso={selectedStateIso}
          onChange={(cityName) => handleFieldChange('city', cityName)}
        />
      );
    }
    return (
      <DynamicField fieldDefinition={field} value={fieldValues[field.fieldName] || ''} onChange={handleFieldChange} error={fieldErrors[field.fieldName]} />
    );
  };

  const loadMyProducts = async () => {
    try {
      const response = await productService.getMyProducts();
      setMyProducts(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleFilterChange = (e) => {
    const updated = { ...filters, [e.target.name]: e.target.value };
    setFilters(updated);
  };

  const applyFilters = () => {
    // BUG-135 & BUG-136: reject Search and Skills if only special chars (no letters/numbers)
    const textFields = [
      [filters.search, 'Search'],
      [filters.skills, 'Skills'],
    ];
    for (const [val, label] of textFields) {
      if (val && val.trim() && !/[a-zA-Z0-9]/.test(val)) {
        setSearchError(`${label}: Please provide valid alphanumeric keywords for your filters.`);
        return;
      }
    }
    setSearchError('');
    // BUG-132: skip API call if all filters are empty
    const hasActiveFilter = Object.values(filters).some(v => v !== '' && v !== null && v !== undefined);
    if (!hasActiveFilter) return;
    setPagination({ ...pagination, page: 1 });
    loadCandidates();
  };

  const clearFilters = () => {
    // BUG-134: pass empty filters directly so loadCandidates doesn't use stale state
    const emptyFilters = { search: '', skills: '', experience_min: '', experience_max: '', location: '', availability: '', lastActive: '', ctc_min: '', ctc_max: '', status: '', sourceWebsite: '' };
    setFilters(emptyFilters);
    setSearchError('');
    setPagination({ ...pagination, page: 1 });
    loadCandidates(emptyFilters);
  };

  const handleSelectCandidate = (candidateId) => {
    setSelectedCandidates(prev => prev.includes(candidateId) ? prev.filter(id => id !== candidateId) : [...prev, candidateId]);
  };

  const handleSelectAll = () => {
    const currentPageIds = candidates.map(c => c._id);
    const allCurrentSelected = currentPageIds.every(id => selectedCandidates.includes(id));

    if (allCurrentSelected) {
      setSelectedCandidates(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedCandidates(prev => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type)) { alert('Please upload CSV or Excel file only'); return; }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await dataCenterService.uploadFile(formData);
      alert(`Successfully uploaded!\nTotal: ${response.data.total}\nImported: ${response.data.imported}\nDuplicates: ${response.data.duplicates}\nFailed: ${response.data.failed}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadCandidates();
    } catch (error) {
      if (error?.isPermissionDenied) return;
      console.error('Upload error:', error);
      alert('Failed to upload file. Please check the format.');
    } finally {
      setUploading(false);
    }
  };

  const closeAllForms = () => {
    setShowMoveForm(false);
    setShowCreateForm(false);
    setShowManageFields(false);
  };

  const handleMoveToLeads = async () => {
    if (selectedCandidates.length === 0) { alert('Please select at least one customer'); return; }
    try {
      // If selectAllPages is true, fetch all customer IDs
      let candidateIds = selectedCandidates;
      if (selectAllPages) {
        const allResponse = await dataCenterService.getCandidates({ ...filters, limit: stats.total });
        if (allResponse?.data?.candidates) {
          candidateIds = allResponse.data.candidates.map(c => c._id);
        }
      }

      const data = { candidateIds, ...moveForm };
      const response = await dataCenterService.moveToLeads(data);
      const moved = response?.data?.success?.length || 0;
      const failed = response?.data?.failed?.length || 0;
      if (moved > 0) {
        alert(`Successfully moved ${moved} customer(s) to Leads.${failed > 0 ? ` ${failed} failed.` : ''}`);
      } else {
        alert(`Move failed. ${failed > 0 ? response.data.failed[0]?.reason : 'No customers were moved.'}`);
      }
      setSelectedCandidates([]);
      setSelectAllPages(false);
      loadCandidates();
    } catch (error) {
      if (error?.isPermissionDenied) return;
      console.error('Error moving to leads:', error);
      alert(error?.message || 'Failed to move customers to leads. Please try again.');
    }
  };

  const [deleteModal, setDeleteModal] = useState({ open: false, count: 0 });

  const handleDeleteCandidates = async () => {
    if (selectedCandidates.length === 0) { alert('Please select at least one candidate'); return; }
    const count = selectAllPages ? stats.total : selectedCandidates.length;
    setDeleteModal({ open: true, count });
  };

  const confirmDelete = async () => {
    try {
      // If selectAllPages is true, fetch all customer IDs
      let candidateIds = selectedCandidates;
      if (selectAllPages) {
        const allResponse = await dataCenterService.getCandidates({ ...filters, limit: stats.total });
        if (allResponse?.data?.candidates) {
          candidateIds = allResponse.data.candidates.map(c => c._id);
        }
      }

      const response = await dataCenterService.deleteCandidates(candidateIds);
      alert(`Successfully deleted ${response.data.deleted} customer(s)!`);
      setSelectedCandidates([]);
      setSelectAllPages(false);
      setSelectedCandidateId(null);
      setSelectedCandidateData(null);
      setDeleteModal({ open: false, count: 0 });
      loadCandidates();
    } catch (error) {
      if (error?.isPermissionDenied) return;
      console.error('Error deleting candidates:', error);
      alert('Failed to delete customers');
      setDeleteModal({ open: false, count: 0 });
    }
  };

  const handleExport = async () => {
    try {
      await loadCandidates();
      const candidateIds = selectedCandidates.length > 0 ? selectedCandidates : null;
      const blob = await dataCenterService.exportCandidates(candidateIds);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `candidates_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (error?.isPermissionDenied) return;
      console.error('Export error:', error);
      alert('Failed to export candidates');
    }
  };

  const handleCreateCandidate = async () => {
    if (creating) return;
    setCreating(true);
    setCreateError('');
    try {
      const candidateData = {};
      fieldDefinitions.forEach(field => {
        const value = fieldValues[field.fieldName];
        if (value !== undefined && value !== null && value !== '') {
          candidateData[field.fieldName] = value;
        }
      });

      await dataCenterService.createCandidate(candidateData);
      setFieldValues({});
      setFieldErrors({});
      setCreateError('');
      setShowCreateForm(false);
      setWizardStep(0);
      loadCandidates();
    } catch (error) {
      if (error?.isPermissionDenied) return;
      console.error('Create candidate error:', error);
      setCreateError(error.message || error.response?.data?.message || 'Failed to create customer. Please try again.');
    } finally { setCreating(false); }
  };

  const getAvailabilityColor = (availability) => {
    const colors = { 'Immediate': 'success', '15 Days': 'warning', '30 Days': 'warning', '45 Days': 'secondary', '60 Days': 'secondary' };
    return colors[availability] || 'secondary';
  };

  // === Split View Functions ===
  const loadCandidateDetails = async (candidateId) => {
    setSelectedCandidateId(candidateId);
    setLoadingDetail(true);
    setShowDetailMoveForm(false);

    try {
      const response = await dataCenterService.getCandidate(candidateId);
      setSelectedCandidateData(response.data);
    } catch (err) {
      console.error('Error loading candidate details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCandidateClick = (candidateId) => {
    if (selectedCandidateId === candidateId) return;
    loadCandidateDetails(candidateId);
  };

  const handleDividerDrag = (e) => {
    e.preventDefault();
    const container = document.getElementById('datacenter-split-container');
    if (!container) return;
    const startX = e.clientX ?? e.touches?.[0]?.clientX;
    const startWidth = detailPanelWidth;
    const containerW = container.getBoundingClientRect().width;
    const onMove = (mv) => {
      const clientX = mv.clientX ?? mv.touches?.[0]?.clientX;
      if (clientX === undefined) return;
      const delta = ((clientX - startX) / containerW) * 100;
      setDetailPanelWidth(Math.max(25, Math.min(70, startWidth + delta)));
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  const closeSidePanel = () => {
    setDetailExpanded(false);
    setSelectedCandidateId(null);
    setSelectedCandidateData(null);
    setShowDetailMoveForm(false);
  };

  const handleDetailMoveToLead = async () => {
    try {
      const data = { candidateIds: [selectedCandidateId], ...detailMoveForm };
      const response = await dataCenterService.moveToLeads(data);
      const moved = response?.data?.success?.length || 0;
      const failed = response?.data?.failed?.length || 0;
      const alreadyMoved = response?.data?.alreadyMoved?.length || 0;
      if (alreadyMoved > 0) {
        alert('This customer has already been moved to Leads.');
      } else if (moved > 0) {
        alert('Successfully moved to Leads.');
        setShowDetailMoveForm(false);
        closeSidePanel();
        loadCandidates();
      } else {
        alert(`Move failed: ${failed > 0 ? response.data.failed[0]?.reason : 'Unknown error.'}`);
      }
    } catch (error) {
      if (error?.isPermissionDenied) return;
      console.error('Error moving to lead:', error);
      alert(error?.message || 'Failed to move to leads. Please try again.');
    }
  };

  // Helper functions for detail panel
  const hasValue = (value) => {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return false;
    return true;
  };

  const isIdLikeValue = (value) => {
    if (!value || typeof value !== 'string') return false;
    if (/^[a-f0-9]{24}$/i.test(value)) return true;
    if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) return true;
    if (/^\d{10,}$/.test(value)) return true;
    return false;
  };

  const formatDetailValue = (key, value) => {
    if (!hasValue(value)) return null;
    if (Array.isArray(value)) return value.join(', ');
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('at')) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    if (key.toLowerCase().includes('ctc') || key.toLowerCase().includes('salary')) {
      const num = Number(value);
      if (!isNaN(num)) return `₹${num.toLocaleString('en-IN')}`;
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const excludeFields = ['_id', 'id', 'ID', '__v', 'tenant', 'importedBy', 'importedAt', 'createdAt', 'updatedAt', 'movedBy', 'movedToTenant', 'leadId', 'isActive', 'dataSource', 'customFields', 'tenantId', 'userId', 'candidateId', 'objectId', 'ObjectId'];

  const getDisplayFields = (candidate) => {
    if (!candidate) return [];
    const fields = [];
    Object.keys(candidate).forEach(key => {
      if (excludeFields.includes(key)) return;
      if (key.toLowerCase().includes('id') && key.toLowerCase() !== 'paid') return;
      const value = candidate[key];
      if (!hasValue(value)) return;
      if (typeof value === 'object' && !Array.isArray(value)) return;
      if (typeof value === 'string' && isIdLikeValue(value)) return;
      fields.push({ key, label: formatFieldName(key), value: formatDetailValue(key, value) });
    });
    return fields;
  };

  const getDetailName = (candidate) => {
    if (!candidate) return 'Customer';
    if (candidate.customerName) return candidate.customerName;
    const nameFields = ['name', 'Name', 'fullName', 'companyName', 'company', 'title'];
    for (const field of nameFields) {
      if (candidate[field] && String(candidate[field]).trim() && !isIdLikeValue(String(candidate[field]).trim())) {
        return String(candidate[field]).trim();
      }
    }
    if (candidate.email) return candidate.email;
    return 'Customer';
  };

  const getDetailInitials = (candidate) => {
    const name = getDetailName(candidate);
    if (!name || name === 'Customer') return 'CU';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const formatFieldName = (fieldName) => fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();

  const getFieldValue = (candidate, fieldName) => {
    if (candidate[fieldName] !== undefined && candidate[fieldName] !== null && candidate[fieldName] !== '') return candidate[fieldName];
    return null;
  };

  const formatFieldValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return value.toString();
  };

  return (
    <DashboardLayout title="Customer Database">
      {/* Tabs removed - inventory items moved to sidebar */}

      {/* ── WIZARD OVERLAY ── */}

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-value">{stats.total}</div><div className="stat-label">Total Customers</div><div className="stat-change">Complete database</div></div>
        <div className="stat-card"><div className="stat-value">{stats.available}</div><div className="stat-label">Available Now</div><div className="stat-change positive">Ready to hire</div></div>
        <div className="stat-card"><div className="stat-value">{stats.immediate}</div><div className="stat-label">Immediate Join</div><div className="stat-change positive">Can join immediately</div></div>
        <div className="stat-card"><div className="stat-value">{stats.thisWeek}</div><div className="stat-label">Active This Week</div><div className="stat-change">Recent activity</div></div>
      </div>

      {/* Action Buttons Section */}
      <div className="action-bar">
        <div className="action-bar-left">
          <button className="crm-btn crm-btn-primary crm-btn-sm" onClick={() => { setSelectedCandidateId(null); setSelectedCandidateData(null); setDetailExpanded(false); setShowCreateForm(true); }}>Add Customer</button>
          {hasPermission('field_management', 'read') && (
            <button onClick={() => setShowManageFields(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
              <Settings style={{ width: '13px', height: '13px' }} /> Manage Fields
            </button>
          )}
          <button className="crm-btn crm-btn-secondary crm-btn-sm" onClick={() => setShowFilters(v => !v)}>{showFilters ? 'Hide' : 'Show'} Filters</button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
          <button className="crm-btn crm-btn-secondary crm-btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload CSV'}</button>
          <button className="crm-btn crm-btn-secondary crm-btn-sm" onClick={handleExport}>Export {selectedCandidates.length > 0 ? `(${selectedCandidates.length})` : ''}</button>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px', border: '1.5px solid #e2e8f0' }}>
            {[['table', <List className="h-3.5 w-3.5" />, 'List'], ['grid', <LayoutGrid className="h-3.5 w-3.5" />, 'Grid']].map(([mode, icon, lbl]) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 13px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.18s', background: viewMode === mode ? 'white' : 'transparent', color: viewMode === mode ? '#0f172a' : '#94a3b8', boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                {icon} {lbl}
              </button>
            ))}
          </div>
        </div>

        {selectedCandidates.length > 0 && (
          <div className="bulk-actions-bar" style={{ background: selectAllPages ? 'linear-gradient(135deg, #dbeafe, #bfdbfe)' : undefined, border: selectAllPages ? '2px solid #3b82f6' : undefined, boxShadow: selectAllPages ? '0 4px 12px rgba(59,130,246,0.3)' : undefined, animation: selectAllPages ? 'pulse 1.5s ease-in-out infinite' : 'none' }}>
            <style>{`
              @keyframes pulse {
                0%, 100% { box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
                50% { box-shadow: 0 6px 20px rgba(59,130,246,0.5); }
              }
            `}</style>
            <span className="selection-count" style={{ whiteSpace: 'nowrap' }}>
              {selectAllPages ? `All ${stats.total} customers selected` : `${selectedCandidates.length} Selected`}
            </span>
            {!selectAllPages && selectedCandidates.length === candidates.length && stats.total > candidates.length && (
              <button onClick={() => setSelectAllPages(true)} className="crm-btn crm-btn-primary crm-btn-sm"
                style={{ padding:'5px 12px', background:'linear-gradient(135deg, #3b82f6, #2563eb)', color:'white', fontSize:'11px', fontWeight:'700', border:'none', boxShadow:'0 2px 8px rgba(59,130,246,0.4)', transition:'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.6)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.4)'; }}>
                ⚡ Select all {stats.total} customers
              </button>
            )}
            {selectAllPages && (
              <button onClick={() => { setSelectedCandidates(candidates.map(c => c._id)); setSelectAllPages(false); }} className="crm-btn crm-btn-sm"
                style={{ padding:'5px 12px', border:'1px solid #ef4444', background:'white', color:'#dc2626', fontSize:'11px', fontWeight:'700', transition:'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}>
                ✕ Clear selection
              </button>
            )}
            <BulkCommunication selectedCandidates={selectedCandidates} candidates={candidates} myProducts={myProducts} loadMyProducts={loadMyProducts} onSuccess={() => setSelectedCandidates([])} />
            <button className="crm-btn crm-btn-success crm-btn-sm" onClick={() => { if (selectedCandidates.length === 0) { alert('Please select at least one customer'); return; } if (window.confirm(`Move ${selectedCandidates.length} customer(s) to Leads?`)) { handleMoveToLeads(); } }}>Move to Leads</button>
            <button className="crm-btn crm-btn-danger crm-btn-sm" onClick={handleDeleteCandidates}>Delete</button>
            <button className="crm-btn crm-btn-sm crm-btn-secondary" onClick={() => { setSelectedCandidates([]); setSelectAllPages(false); }}>Clear</button>
          </div>
        )}
      </div>

      {/* Split Container */}
      <div id="datacenter-split-container" style={{ display: 'flex', height: 'calc(100vh - 280px)', overflow: 'hidden', position: 'relative' }}>

        {/* LEFT: Detail Panel */}
        {/* ── LEFT: Create Form (inline) ── */}
        {showCreateForm && (
          <div className="customer-create-form" style={{ flex: `0 0 ${detailPanelWidth}%`, background: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <style>{`
              @media (max-width: 768px) {
                .customer-create-form {
                  position: fixed !important;
                  top: 0 !important;
                  left: 0 !important;
                  right: 0 !important;
                  bottom: 0 !important;
                  z-index: 1000 !important;
                  flex: none !important;
                  border-right: none !important;
                }
              }
            `}</style>
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3c72 100%)', flexShrink: 0 }}>
              <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>👤</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>New Customer</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>Step {wizardStep + 1} of {activeWizardSteps.length}</div>
                  </div>
                </div>
                <button onClick={() => { setShowCreateForm(false); setFieldValues({}); setWizardStep(0); setSelectedCountryIso(''); setSelectedStateIso(''); }}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '7px', padding: '5px 9px', color: 'white', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ display: 'flex', padding: '8px 10px 0' }}>
                {activeWizardSteps.map((step, idx) => {
                  const isDone = idx < wizardStep; const isActive = idx === wizardStep;
                  return (
                    <div key={idx} onClick={() => isDone && setWizardStep(idx)}
                      style={{ flex: 1, textAlign: 'center', padding: '5px 2px', borderRadius: '6px 6px 0 0', cursor: isDone ? 'pointer' : 'default',
                        background: isActive ? 'rgba(59,130,246,0.22)' : isDone ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                        borderBottom: isActive ? '2px solid #3b82f6' : isDone ? '2px solid #10b981' : '2px solid transparent' }}>
                      <div style={{ fontSize: '12px', color: isActive ? '#93c5fd' : isDone ? '#6ee7b7' : 'rgba(255,255,255,0.25)', fontWeight: '700' }}>{isDone ? '✓' : step.icon}</div>
                      <div style={{ fontSize: '9px', color: isActive ? 'rgba(255,255,255,0.65)' : isDone ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>{step.label}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', margin: '0 10px 8px' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg,#3b82f6,#6366f1)', borderRadius: '99px', width: `${(wizardStep / activeWizardSteps.length) * 100}%`, transition: 'width 0.35s ease' }} />
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
                {createError && (
                  <div style={{ marginBottom: 12, padding: '10px 14px', background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>❌</span>
                    <span>{createError}</span>
                    <button type="button" onClick={() => setCreateError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 16, padding: 0, flexShrink: 0 }}>×</button>
                  </div>
                )}
                <div style={{ marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                  <h4 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{activeWizardSteps[wizardStep]?.icon} {activeWizardSteps[wizardStep]?.label}</h4>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{activeWizardSteps[wizardStep]?.desc}</p>
                </div>
                {(() => {
                  const step = activeWizardSteps[wizardStep];
                  const grouped = groupFieldsBySection(fieldDefinitions);
                  return (
                    <div>
                      {step.sections.map(sectionName => {
                        const fields = grouped[sectionName];
                        if (!fields?.length) return null;
                        return (
                          <div key={sectionName}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
                              {fields.map(field => (
                                <div key={field.fieldName}>{renderDynamicField(field)}</div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
              <div className="dc-wizard-bottom" style={{ padding: '11px 14px', borderTop: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <button type="button" onClick={() => { if (wizardStep > 0) { setWizardStep(s => s - 1); } else { setShowCreateForm(false); setFieldValues({}); setWizardStep(0); setSelectedCountryIso(''); setSelectedStateIso(''); } }}
                  style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {wizardStep === 0 ? 'Cancel' : '← Back'}
                </button>
                <div className="dc-wizard-dots" style={{ display: 'flex', gap: '4px' }}>
                  {activeWizardSteps.map((_, idx) => (
                    <div key={idx} style={{ width: idx === wizardStep ? '16px' : '5px', height: '5px', borderRadius: '99px', background: idx < wizardStep ? '#10b981' : idx === wizardStep ? '#3b82f6' : '#e2e8f0', transition: 'all 0.25s' }} />
                  ))}
                </div>
                {wizardStep < activeWizardSteps.length - 1 ? (
                  <button type="button" onClick={() => {
                    if (wizardStep === 0) {
                      const name = (fieldValues['customerName'] || '').trim();
                      if (!name) {
                        setFieldErrors(prev => ({ ...prev, customerName: 'Customer Name is required to build a database profile.' }));
                        return;
                      }
                      if (!/^[a-zA-Z\s.\-']+$/.test(name)) {
                        setFieldErrors(prev => ({ ...prev, customerName: 'Customer Name can only contain letters, spaces, dots, hyphens and apostrophes.' }));
                        return;
                      }
                      if (/^\s|\s$/.test(name)) {
                        setFieldErrors(prev => ({ ...prev, customerName: 'Customer Name cannot start or end with spaces.' }));
                        return;
                      }
                      if (/--/.test(name) || /\.\./.test(name)) {
                        setFieldErrors(prev => ({ ...prev, customerName: 'Customer Name cannot have consecutive special characters.' }));
                        return;
                      }
                      // Email — required + strict format
                      const emailVal = (fieldValues['email'] || '').trim();
                      if (!emailVal) {
                        setFieldErrors(prev => ({ ...prev, email: 'Email is required.' }));
                        return;
                      }
                      const strictEmailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+\-]*@[a-zA-Z0-9][a-zA-Z0-9.\-]*\.[a-zA-Z]{2,}$/;
                      if (!strictEmailRegex.test(emailVal) || /--/.test(emailVal) || /\.\./.test(emailVal)) {
                        setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address (e.g., name@example.com).' }));
                        return;
                      }
                      // Phone — optional but if filled must be valid
                      const phoneVal = (fieldValues['phone'] || '').trim();
                      if (phoneVal) {
                        const phoneDigits = phoneVal.replace(/[\s\-()]/g, '');
                        if (!/^\+?[0-9]{7,15}$/.test(phoneDigits)) {
                          setFieldErrors(prev => ({ ...prev, phone: 'Please enter a valid phone number (digits only, 7–15 numbers).' }));
                          return;
                        }
                        if (/[a-zA-Z]/.test(phoneVal)) {
                          setFieldErrors(prev => ({ ...prev, phone: 'Phone number cannot contain letters.' }));
                          return;
                        }
                        if (/[^0-9\+\-\s\(\)]/.test(phoneVal)) {
                          setFieldErrors(prev => ({ ...prev, phone: 'Phone number can only contain digits, +, -, spaces.' }));
                          return;
                        }
                        if (!/[1-9]/.test(phoneDigits)) {
                          setFieldErrors(prev => ({ ...prev, phone: 'Please enter a valid phone number (cannot be all zeros).' }));
                          return;
                        }
                      }
                      // BUG-126: Customer Type is required
                      if (!fieldValues['customerType']) {
                        setFieldErrors(prev => ({ ...prev, customerType: 'Please select a Customer Type before proceeding.' }));
                        return;
                      }
                    }
                    // BUG-130: Step 1 — Current Designation required
                    if (wizardStep === 1) {
                      if (!fieldValues['currentDesignation']) {
                        setFieldErrors(prev => ({ ...prev, currentDesignation: 'Please select a Current Designation to proceed.' }));
                        return;
                      }
                    }
                    setWizardStep(s => s + 1);
                  }}
                    className="dc-save-btn" style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#1e3c72 0%,#3b82f6 100%)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(30,60,114,0.25)', whiteSpace: 'nowrap' }}>
                    Next →
                  </button>
                ) : (
                  <button type="button" onClick={handleCreateCandidate} disabled={creating}
                    className="dc-save-btn" style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: creating ? '#94a3b8' : 'linear-gradient(135deg,#059669 0%,#10b981 100%)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: creating ? 'not-allowed' : 'pointer', boxShadow: creating ? 'none' : '0 2px 8px rgba(16,185,129,0.25)', whiteSpace: 'nowrap' }}>
                    {creating ? 'Saving...' : '✓ Save Customer'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedCandidateId && !showCreateForm && (
          <div className="customer-detail-panel" style={detailExpanded ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' } : { flex: `0 0 ${detailPanelWidth}%`, background: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <style>{`
              @media (max-width: 768px) {
                .customer-detail-panel {
                  position: fixed !important;
                  top: 0 !important;
                  left: 0 !important;
                  right: 0 !important;
                  bottom: 0 !important;
                  z-index: 1000 !important;
                  flex: none !important;
                }
              }
            `}</style>
            {/* Panel Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h3 style={{ margin: 0, color: '#1e3c72', fontSize: '15px', fontWeight: '600' }}>Customer Details</h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setDetailExpanded(v => !v)} style={{ background: 'rgba(30,60,114,0.08)', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', color: '#1e3c72' }}>{detailExpanded ? '↙ Collapse' : '↗ Expand'}</button>
                <button onClick={closeSidePanel} style={{ background: 'rgba(30,60,114,0.1)', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', color: '#1e3c72' }}>✕</button>
              </div>
            </div>
            {/* Panel Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingDetail ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                  <div className="spinner"></div>
                </div>
              ) : selectedCandidateData ? (
                <div>
                  {/* Candidate Header */}
                  <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
                        {getDetailInitials(selectedCandidateData)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#1e3c72', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>{getDetailName(selectedCandidateData)}</h2>
                          {selectedCandidateData.customerNumber && <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '5px' }}>{String(selectedCandidateData.customerNumber).padStart(5, '0')}</span>}
                        </div>
                        {selectedCandidateData.email && <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>{selectedCandidateData.email}</p>}
                        {selectedCandidateData.phone && <p style={{ color: '#666', fontSize: '12px', margin: '2px 0 0 0' }}>{selectedCandidateData.phone}</p>}
                      </div>
                    </div>
                    {/* Status Badge */}
                    {selectedCandidateData.status && (
                      <span style={{ display: 'inline-block', padding: '4px 10px', background: selectedCandidateData.status === 'Moved to Leads' ? '#DCFCE7' : '#E0E7FF', color: selectedCandidateData.status === 'Moved to Leads' ? '#166534' : '#3730A3', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>{selectedCandidateData.status}</span>
                    )}
                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button className="crm-btn crm-btn-success crm-btn-sm" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={() => setShowDetailMoveForm(true)} disabled={selectedCandidateData.status === 'Moved to Leads'}>Move to Leads</button>
                    </div>
                  </div>

                  {/* Move to Leads Form */}
                  {showDetailMoveForm && (
                    <div style={{ margin: '12px', padding: '12px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #86EFAC' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#166534' }}>Move to Leads</h5>
                        <button onClick={() => setShowDetailMoveForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b' }}>✕</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                        <div>
                          <label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Status</label>
                          <select className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailMoveForm.leadStatus} onChange={(e) => setDetailMoveForm({ ...detailMoveForm, leadStatus: e.target.value })}>
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified">Qualified</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Source</label>
                          <input type="text" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailMoveForm.leadSource} onChange={(e) => setDetailMoveForm({ ...detailMoveForm, leadSource: e.target.value })} />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Rating</label>
                          <select className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailMoveForm.rating} onChange={(e) => setDetailMoveForm({ ...detailMoveForm, rating: e.target.value })}>
                            <option value="Hot">Hot</option>
                            <option value="Warm">Warm</option>
                            <option value="Cold">Cold</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button className="crm-btn crm-btn-secondary crm-btn-sm" style={{ fontSize: '10px', padding: '4px 8px' }} onClick={() => setShowDetailMoveForm(false)}>Cancel</button>
                        <button className="crm-btn crm-btn-success crm-btn-sm" style={{ fontSize: '10px', padding: '4px 8px' }} onClick={handleDetailMoveToLead}>Confirm</button>
                      </div>
                    </div>
                  )}

                  {/* All Information */}
                  <div style={{ padding: '16px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase' }}>All Information</h4>
                    {(() => {
                      const displayFields = getDisplayFields(selectedCandidateData);
                      return displayFields.length === 0 ? (
                        <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '20px', background: '#f9fafb', borderRadius: '6px' }}>No data available</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {displayFields.map((field, index) => (
                            <div key={index} style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px' }}>
                              <p style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginBottom: '2px', textTransform: 'uppercase' }}>{field.label}</p>
                              <p style={{ fontSize: '13px', fontWeight: '500', color: '#1e3c72', margin: 0, wordBreak: 'break-word' }}>{field.value}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Audit Info — only for TENANT_ADMIN and above */}
                    {(user?.userType === 'TENANT_ADMIN' || user?.userType === 'SAAS_OWNER' || user?.userType === 'SAAS_ADMIN') && (
                      <div style={{ marginTop: '16px', padding: '10px', background: '#fefce8', borderRadius: '8px', border: '1px solid #fde68a' }}>
                        <h4 style={{ fontSize: '10px', fontWeight: '700', color: '#92400e', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Audit Information</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div style={{ background: '#fff', padding: '6px 8px', borderRadius: '5px' }}>
                            <p style={{ fontSize: '9px', color: '#92400e', marginBottom: '2px', fontWeight: '600' }}>IMPORTED BY</p>
                            <p style={{ fontSize: '12px', fontWeight: '600', margin: 0 }}>
                              {selectedCandidateData.importedBy
                                ? `${selectedCandidateData.importedBy.firstName} ${selectedCandidateData.importedBy.lastName}`
                                : '-'}
                            </p>
                          </div>
                          <div style={{ background: '#fff', padding: '6px 8px', borderRadius: '5px' }}>
                            <p style={{ fontSize: '9px', color: '#92400e', marginBottom: '2px', fontWeight: '600' }}>IMPORTED ON</p>
                            <p style={{ fontSize: '12px', fontWeight: '600', margin: 0 }}>
                              {selectedCandidateData.importedAt ? new Date(selectedCandidateData.importedAt).toLocaleDateString() : '-'}
                            </p>
                          </div>
                          {selectedCandidateData.importedBy?.email && (
                            <div style={{ background: '#fff', padding: '6px 8px', borderRadius: '5px', gridColumn: 'span 2' }}>
                              <p style={{ fontSize: '9px', color: '#92400e', marginBottom: '2px', fontWeight: '600' }}>EMAIL</p>
                              <p style={{ fontSize: '12px', fontWeight: '600', margin: 0, color: '#3B82F6' }}>{selectedCandidateData.importedBy.email}</p>
                            </div>
                          )}
                          {selectedCandidateData.movedBy && (
                            <div style={{ background: '#fff', padding: '6px 8px', borderRadius: '5px', gridColumn: 'span 2' }}>
                              <p style={{ fontSize: '9px', color: '#92400e', marginBottom: '2px', fontWeight: '600' }}>MOVED TO LEADS BY</p>
                              <p style={{ fontSize: '12px', fontWeight: '600', margin: 0 }}>
                                {selectedCandidateData.movedBy.firstName} {selectedCandidateData.movedBy.lastName}
                                <span style={{ fontSize: '11px', color: '#6B7280', marginLeft: '6px' }}>({selectedCandidateData.movedBy.email})</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Failed to load details</div>
              )}
            </div>
          </div>
        )}

        {/* Drag Divider */}
        {(selectedCandidateId || showCreateForm) && !detailExpanded && (
          <div className="dc-divider" onPointerDown={handleDividerDrag} style={{ width: '8px', cursor: 'col-resize', background: 'transparent', flexShrink: 0, position: 'relative', zIndex: 2, userSelect: 'none', touchAction: 'none' }}
            onMouseEnter={e => { e.currentTarget.querySelector('.dc-divider-handle').style.background = '#94a3b8'; e.currentTarget.querySelector('.dc-divider-handle').style.height = '60px'; }}
            onMouseLeave={e => { e.currentTarget.querySelector('.dc-divider-handle').style.background = '#cbd5e1'; e.currentTarget.querySelector('.dc-divider-handle').style.height = '40px'; }}>
            <div className="dc-divider-handle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '4px', height: '40px', borderRadius: '2px', background: '#cbd5e1', transition: 'all 0.15s' }} />
          </div>
        )}

        {/* RIGHT: Filters + List */}
        <div style={{ flex: (selectedCandidateId || showCreateForm) && !detailExpanded ? `0 0 ${100 - detailPanelWidth}%` : '1 1 100%', minWidth: 0, overflow: 'auto', padding: '0 0 20px 0' }}>
      {/* Manage Fields Panel */}
      {showManageFields && (
        <ManageFieldsPanel
          allFieldDefs={allFieldDefs}
          togglingField={togglingField}
          onToggle={handleToggleField}
          onClose={() => setShowManageFields(false)}
          onAdd={handleAddCustomField}
          canAdd={hasPermission('field_management', 'create')}
          canToggle={hasPermission('field_management', 'update')}
          entityLabel="Customer"
          sections={CUSTOMER_SECTIONS}
        />
      )}
      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-container" style={{ padding: '12px', marginBottom: '12px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '700', color: '#1e3c72' }}>Advanced Search Filters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }} className="dc-filter-grid">
            <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '2px', display: 'block', whiteSpace: 'nowrap' }}>Search</label><input type="text" name="search" placeholder="Search..." value={filters.search} onChange={handleFilterChange} className="crm-form-input" style={{ padding: '6px 8px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }} maxLength={100} /></div>
            <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '2px', display: 'block', whiteSpace: 'nowrap' }}>Skills</label><input type="text" name="skills" placeholder="Skills..." value={filters.skills} onChange={handleFilterChange} className="crm-form-input" style={{ padding: '6px 8px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }} maxLength={50} /></div>
            <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '2px', display: 'block', whiteSpace: 'nowrap' }}>Min Exp</label><input type="number" name="experience_min" placeholder="0" value={filters.experience_min} onChange={handleFilterChange} className="crm-form-input" style={{ padding: '6px 8px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }} min={0} max={30} /></div>
            <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '2px', display: 'block', whiteSpace: 'nowrap' }}>Max Exp</label><input type="number" name="experience_max" placeholder="10" value={filters.experience_max} onChange={handleFilterChange} className="crm-form-input" style={{ padding: '6px 8px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }} min={0} max={30} /></div>
            <div><label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '2px', display: 'block', whiteSpace: 'nowrap' }}>Location</label><input type="text" name="location" placeholder="Delhi..." value={filters.location} onChange={handleFilterChange} className="crm-form-input" style={{ padding: '6px 8px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }} maxLength={50} /></div>
          </div>
          {searchError && (
            <div style={{ marginTop: 8, padding: '6px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 11, color: '#dc2626', fontWeight: 500 }}>
              ❌ {searchError}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button className="crm-btn crm-btn-primary crm-btn-sm" onClick={applyFilters}>Apply</button>
            <button className="crm-btn crm-btn-secondary crm-btn-sm" onClick={clearFilters}>Clear</button>
          </div>
        </div>
      )}
      {/* Candidates Display */}
      <div className="crm-card">
        <div className="crm-card-header" style={{ padding: '10px 16px' }}>
          <h2 className="crm-card-title" style={{ fontSize: '14px' }}>{viewMode === 'grid' ? 'Customer Cards' : 'Customer List'} ({pagination.total})</h2>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div><p style={{ marginTop: '12px', color: '#64748b', fontSize: '13px' }}>Loading...</p></div>
        ) : candidates.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e3c72', marginBottom: '8px' }}>No candidates found</p>
            <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '13px' }}>Upload a CSV/Excel file to get started</p>
            <button className="crm-btn crm-btn-primary crm-btn-sm" onClick={() => fileInputRef.current?.click()}>Upload Candidates</button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {candidates.map(candidate => (
                  <div key={candidate._id} onClick={() => handleCandidateClick(candidate._id)} style={{ background: '#fff', borderRadius: '8px', padding: '12px', border: selectedCandidateId === candidate._id ? '2px solid #1e3c72' : selectedCandidates.includes(candidate._id) ? '2px solid #4A90E2' : '1px solid #e5e7eb', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input type="checkbox"
                        checked={selectAllPages || selectedCandidates.includes(candidate._id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (selectAllPages) {
                            setSelectAllPages(false);
                            setSelectedCandidates([candidate._id]);
                          } else {
                            handleSelectCandidate(candidate._id);
                          }
                        }}
                        style={{ width: '16px', height: '16px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1e3c72', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{candidate.customerName || getDetailName(candidate)}</h3>
                          {candidate.customerNumber && <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>{String(candidate.customerNumber).padStart(5, '0')}</span>}
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{candidate.currentDesignation || 'N/A'}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span className={`status-badge ${getAvailabilityColor(candidate.availability)}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{candidate.availability}</span>
                      <span className={`status-badge ${candidate.status === 'Available' ? 'success' : 'secondary'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{candidate.status}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {candidate.email && <div style={{ marginBottom: '2px' }}>{candidate.email}</div>}
                      {candidate.phone && <div style={{ marginBottom: '2px' }}>{candidate.phone}</div>}
                      <div>{candidate.totalExperience} yrs exp</div>
                    </div>
                    <button className="crm-btn crm-btn-primary crm-btn-sm" onClick={() => handleCandidateClick(candidate._id)} style={{ width: '100%', marginTop: '8px', fontSize: '11px', padding: '4px' }}>View Profile</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '80px', padding: '8px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          <input type="checkbox"
                            checked={selectAllPages || (candidates.length > 0 && candidates.every(c => selectedCandidates.includes(c._id)))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleSelectAll(e);
                                setSelectAllPages(false);
                              } else {
                                setSelectedCandidates([]);
                                setSelectAllPages(false);
                              }
                            }}
                            style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
                          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }} title="Select All Records">All</span>
                        </label>
                      </th>
                      <th style={{ padding: '8px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Customer ID</th>
                      {displayColumns.map((column) => (
                        <th key={column} style={{ padding: '8px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{formatFieldName(column)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map(candidate => (
                      <tr key={candidate._id} onClick={(e) => { if (e.target.type !== 'checkbox') handleCandidateClick(candidate._id); }} style={{ background: selectedCandidateId === candidate._id ? '#E0F2FE' : selectedCandidates.includes(candidate._id) ? '#EFF6FF' : '#fff', cursor: 'pointer', border: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px' }}>
                          <input type="checkbox"
                            checked={selectAllPages || selectedCandidates.includes(candidate._id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (selectAllPages) {
                                // If selectAllPages is on, turn it off and start fresh selection
                                setSelectAllPages(false);
                                setSelectedCandidates([candidate._id]);
                              } else {
                                handleSelectCandidate(candidate._id);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: '16px', height: '16px' }} />
                        </td>
                        <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', background: '#f1f5f9', padding: '2px 7px', borderRadius: '5px' }}>
                            {candidate.customerNumber ? String(candidate.customerNumber).padStart(5, '0') : '—'}
                          </span>
                        </td>
                        {displayColumns.map((column) => {
                          const value = formatFieldValue(getFieldValue(candidate, column));
                          return (
                            <td key={column} style={{ padding: '8px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: '#475569' }}>
                              {value}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
                <button className="crm-btn crm-btn-secondary crm-btn-sm" disabled={pagination.page === 1} onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setPagination({ ...pagination, page: pagination.page - 1 }); }}>← Prev</button>
                <span style={{ fontWeight: '600', color: '#1e3c72', fontSize: '12px' }}>Page {pagination.page} of {pagination.pages}</span>
                <button className="crm-btn crm-btn-secondary crm-btn-sm" disabled={pagination.page === pagination.pages} onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setPagination({ ...pagination, page: pagination.page + 1 }); }}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
        </div>

      </div>

      {deleteModal.open && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
          <div style={{background:'#fff',borderRadius:12,width:450,boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
            <div style={{padding:'20px 24px',borderBottom:'1px solid #e2e8f0'}}>
              <h3 style={{margin:0,fontSize:16,fontWeight:700,color:'#ef4444'}}>⚠️ Confirm Delete</h3>
            </div>
            <div style={{padding:24}}>
              <p style={{margin:0,fontSize:14,color:'#64748b'}}>
                Are you sure you want to delete <strong>{deleteModal.count} customer(s)</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div style={{padding:'16px 24px',display:'flex',gap:8,justifyContent:'flex-end',borderTop:'1px solid #e2e8f0'}}>
              <button onClick={()=>setDeleteModal({open:false,count:0})} style={{padding:'8px 16px',border:'1px solid #e2e8f0',borderRadius:8,background:'#fff',color:'#64748b',fontSize:14,fontWeight:600,cursor:'pointer'}}>Cancel</button>
              <button onClick={confirmDelete} style={{padding:'8px 16px',border:'none',borderRadius:8,background:'#ef4444',color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer'}}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default DataCenter;
