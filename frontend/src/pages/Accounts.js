import React, { useState, useEffect } from 'react';
import { Country, State, City } from 'country-state-city';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { accountService } from '../services/accountService';
import fieldDefinitionService from '../services/fieldDefinitionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DynamicField from '../components/DynamicField';
import { Phone, Globe, Building2, X, Edit, Users, DollarSign, MapPin, Briefcase, Settings, List, LayoutGrid } from 'lucide-react';
import ManageFieldsPanel from '../components/ManageFieldsPanel';
import '../styles/crm.css';

const DEFAULT_ACCOUNT_FIELDS = [
  { fieldName: 'accountName', label: 'Customer Name', fieldType: 'text', section: 'Basic Information', isRequired: true, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 1 },
  { fieldName: 'accountType', label: 'Customer Type', fieldType: 'dropdown', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 2, options: [{ label: 'Customer', value: 'Customer' }, { label: 'Prospect', value: 'Prospect' }, { label: 'Partner', value: 'Partner' }, { label: 'Reseller', value: 'Reseller' }, { label: 'Vendor', value: 'Vendor' }, { label: 'Other', value: 'Other' }] },
  { fieldName: 'contactPerson', label: 'Contact Person', fieldType: 'text', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 3 },
  { fieldName: 'email', label: 'Email', fieldType: 'email', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 4 },
  { fieldName: 'phone', label: 'Phone', fieldType: 'phone', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 5 },
  { fieldName: 'website', label: 'Website', fieldType: 'url', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 6 },
  { fieldName: 'industry', label: 'Industry', fieldType: 'dropdown', section: 'Business Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 10, options: [{ label: 'Agriculture', value: 'Agriculture' }, { label: 'Automotive', value: 'Automotive' }, { label: 'Banking & Finance', value: 'Banking & Finance' }, { label: 'Construction', value: 'Construction' }, { label: 'Consulting', value: 'Consulting' }, { label: 'Education', value: 'Education' }, { label: 'Energy & Power', value: 'Energy & Power' }, { label: 'Food & Beverage', value: 'Food & Beverage' }, { label: 'Government', value: 'Government' }, { label: 'Healthcare', value: 'Healthcare' }, { label: 'Hospitality', value: 'Hospitality' }, { label: 'IT & Technology', value: 'IT & Technology' }, { label: 'Insurance', value: 'Insurance' }, { label: 'Logistics & Transport', value: 'Logistics & Transport' }, { label: 'Manufacturing', value: 'Manufacturing' }, { label: 'Media & Entertainment', value: 'Media & Entertainment' }, { label: 'Pharma & Life Sciences', value: 'Pharma & Life Sciences' }, { label: 'Real Estate', value: 'Real Estate' }, { label: 'Retail', value: 'Retail' }, { label: 'Telecom', value: 'Telecom' }, { label: 'Textile & Apparel', value: 'Textile & Apparel' }, { label: 'Other', value: 'Other' }] },
  { fieldName: 'annualRevenue', label: 'Annual Revenue', fieldType: 'currency', section: 'Business Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 11 },
  { fieldName: 'numberOfEmployees', label: 'No. of Employees', fieldType: 'number', section: 'Business Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 12 },
  { fieldName: 'leadSource', label: 'Lead Source', fieldType: 'dropdown', section: 'Business Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 13, options: [{ label: 'Website', value: 'Website' }, { label: 'Social Media', value: 'Social Media' }, { label: 'Referral', value: 'Referral' }, { label: 'Campaign', value: 'Campaign' }, { label: 'Cold Call', value: 'Cold Call' }, { label: 'Other', value: 'Other' }] },
  { fieldName: 'billingStreet', label: 'Street', fieldType: 'text', section: 'Billing Address', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 20 },
  { fieldName: 'billingCity', label: 'City', fieldType: 'dropdown', section: 'Billing Address', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 21 },
  { fieldName: 'billingState', label: 'State', fieldType: 'dropdown', section: 'Billing Address', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 22 },
  { fieldName: 'billingCountry', label: 'Country', fieldType: 'dropdown', section: 'Billing Address', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 23 },
  { fieldName: 'description', label: 'Description', fieldType: 'textarea', section: 'Additional Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 30 },
  { fieldName: 'gstNumber', label: 'GST Number', fieldType: 'text', section: 'Additional Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 31 },
];
const ACCT_DISABLED_KEY = 'crm_acct_std_disabled';
const getAcctDisabled = () => { try { return JSON.parse(localStorage.getItem(ACCT_DISABLED_KEY) || '[]'); } catch { return []; } };
const ACCOUNT_SECTIONS = ['Basic Information', 'Business Information', 'Billing Address', 'Additional Information'];


// --- Country/State/City cascade helpers ---
const LOC_OCEANIA_CODES = new Set(['AU','FJ','KI','MH','FM','NR','NZ','PW','PG','WS','SB','TO','TV','VU','CK','NU','TK','WF','PF','NC','GU','MP','AS','UM','PN']);
const locGetContinent = (country) => {
  if (LOC_OCEANIA_CODES.has(country.isoCode)) return 'Oceania';
  const tz = (country.timezones && country.timezones[0] && country.timezones[0].zoneName) || '';
  const prefix = tz.split('/')[0];
  const map = { Africa:'Africa', America:'Americas', Asia:'Asia', Atlantic:'Europe', Europe:'Europe', Indian:'Asia', Pacific:'Oceania', Arctic:'Europe', Australia:'Oceania' };
  return map[prefix] || 'Other';
};
const LOC_CONTINENT_ORDER = ['Asia', 'Europe', 'Americas', 'Africa', 'Oceania', 'Other'];
const LOC_ALL_COUNTRIES = Country.getAllCountries();
const LOC_GROUPED_COUNTRIES = (() => {
  const g = {};
  LOC_ALL_COUNTRIES.forEach(c => { const cont = locGetContinent(c); if (!g[cont]) g[cont] = []; g[cont].push(c); });
  return g;
})();
const LOC_CONTINENT_ICONS = { Asia:'🌏', Europe:'🌍', Americas:'🌎', Africa:'🌍', Oceania:'🌏', Other:'🌐' };

const LocCountrySelect = ({ value, onChange }) => {
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
    if (open && value) { const c = LOC_ALL_COUNTRIES.find(c => c.name === value); if (c) setExpandedCont(locGetContinent(c)); }
    if (!open) setExpandedCont(null);
  }, [open, value]);
  const sel = LOC_ALL_COUNTRIES.find(c => c.name === value);
  const triggerStyle = { width:'100%', padding:'8px 10px', fontSize:'13px', border:'1px solid #e2e8f0', borderRadius:'6px', background:'#fff', textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:'7px', outline:'none', color: value ? '#1e293b' : '#94a3b8', boxSizing:'border-box' };
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <label style={{ display:'block', fontSize:'11px', fontWeight:'700', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.4px', color:'#475569' }}>Country</label>
      <button type="button" onClick={() => setOpen(o => !o)} style={triggerStyle}>
        {sel ? <><span style={{ fontSize:'15px', lineHeight:1 }}>{sel.flag}</span><span style={{ flex:1, fontSize:'13px' }}>{sel.name}</span></> : <span style={{ flex:1 }}>-- Select Country --</span>}
        <span style={{ color:'#94a3b8', fontSize:'10px', marginLeft:'auto' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:9999, background:'#fff', border:'1px solid #e2e8f0', borderRadius:'7px', boxShadow:'0 6px 20px rgba(0,0,0,0.13)', marginTop:'3px', overflow:'hidden' }}>
          <div style={{ maxHeight:'280px', overflowY:'auto' }}>
            {LOC_CONTINENT_ORDER.map(cont => {
              const countries = LOC_GROUPED_COUNTRIES[cont];
              if (!countries?.length) return null;
              const isExp = expandedCont === cont;
              return (
                <div key={cont}>
                  <div onMouseDown={(e) => { e.preventDefault(); setExpandedCont(isExp ? null : cont); }}
                    style={{ padding:'7px 10px', cursor:'pointer', display:'flex', alignItems:'center', gap:'7px', background: isExp ? '#eff6ff' : '#f8fafc', borderBottom:'1px solid #f1f5f9', userSelect:'none' }}>
                    <span style={{ fontSize:'14px' }}>{LOC_CONTINENT_ICONS[cont]}</span>
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

const LocStateSelect = ({ value, countryIso, onChange }) => {
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

const LocCitySelect = ({ value, countryIso, stateIso, onChange }) => {
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

const ACCOUNT_WIZARD_STEPS = [
  { label: 'Basic Info',  icon: '🏢', desc: 'Name, type & contact',    sections: ['Basic Information'] },
  { label: 'Business',    icon: '💼', desc: 'Industry & revenue info',  sections: ['Business Information'] },
  { label: 'Address',     icon: '📍', desc: 'Billing address',          sections: ['Billing Address'] },
  { label: 'Additional',  icon: '📋', desc: 'Description & GST',        sections: ['Additional Information'] },
];

const Accounts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasPermission } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('table');

  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '', accountType: searchParams.get('type') || '', industry: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    accountName: '', accountType: 'Customer', industry: '', phone: '', website: '', fax: '',
    annualRevenue: '', numberOfEmployees: '', billingStreet: '', billingCity: '', billingState: '',
    billingCountry: '', billingZipCode: '', shippingStreet: '', shippingCity: '', shippingState: '',
    shippingCountry: '', shippingZipCode: '', description: ''
  });

  const [fieldDefinitions, setFieldDefinitions] = useState(
    () => DEFAULT_ACCOUNT_FIELDS.filter(f => !getAcctDisabled().includes(f.fieldName)).map(f => ({ ...f, isActive: true, _isStd: true })).sort((a, b) => a.displayOrder - b.displayOrder)
  );
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [stats, setStats] = useState({ total: 0, customers: 0, prospects: 0, partners: 0 });

  // Manage Fields
  const [showManageFields, setShowManageFields] = useState(false);
  const [customFieldDefs, setCustomFieldDefs] = useState([]);
  const [disabledStdFields, setDisabledStdFieldsState] = useState(getAcctDisabled);
  const [togglingField, setTogglingField] = useState(null);

  const [wizardStep, setWizardStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [selectedCountryIso, setSelectedCountryIso] = useState('');
  const [selectedStateIso, setSelectedStateIso] = useState('');
  const [detailPanelWidth, setDetailPanelWidth] = useState(42);
  const [detailExpanded, setDetailExpanded] = useState(false);

  // Split View Panel State
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [selectedAccountData, setSelectedAccountData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailActiveTab, setDetailActiveTab] = useState('overview');
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState([]);


  // Detail Panel Forms
  const [showDetailEditForm, setShowDetailEditForm] = useState(false);
  const [showDetailDeleteConfirm, setShowDetailDeleteConfirm] = useState(false);
  const [detailEditData, setDetailEditData] = useState({});

  useEffect(() => {
    loadAccounts();
    loadCustomFields();
  }, [pagination.page, filters.search, filters.accountType, filters.industry]);

  // Sync filter with URL params when navigating from another page
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam && typeParam !== filters.accountType) {
      setFilters(prev => ({ ...prev, accountType: typeParam }));
    }
  }, [searchParams]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await accountService.getAccounts({ page: pagination.page, limit: pagination.limit, ...filters });
      if (response.success && response.data) {
        const accountsData = response.data.accounts || [];
        setAccounts(accountsData);
        setPagination(prev => ({ ...prev, total: response.data.pagination?.total || 0, pages: response.data.pagination?.pages || 0 }));
        const customers = accountsData.filter(a => a.accountType === 'Customer').length;
        const prospects = accountsData.filter(a => a.accountType === 'Prospect').length;
        const partners = accountsData.filter(a => a.accountType === 'Partner').length;
        setStats({ total: response.data.pagination?.total || 0, customers, prospects, partners });
      }
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError(err.response?.data?.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const buildAcctFields = (disabled, customs) => [
    ...DEFAULT_ACCOUNT_FIELDS.filter(f => !disabled.includes(f.fieldName)).map(f => ({ ...f, isActive: true, _isStd: true })),
    ...customs.filter(f => f.isActive && f.showInCreate),
  ].sort((a, b) => a.displayOrder - b.displayOrder);

  const allFieldDefs = [
    ...DEFAULT_ACCOUNT_FIELDS.map(f => ({ ...f, isActive: !disabledStdFields.includes(f.fieldName), _isStd: true })),
    ...customFieldDefs,
  ].sort((a, b) => a.displayOrder - b.displayOrder);

  const loadCustomFields = async () => {
    try {
      const response = await fieldDefinitionService.getFieldDefinitions('Account', true);
      const customs = (Array.isArray(response) ? response : []).filter(f => !f.isStandardField);
      setCustomFieldDefs(customs);
      setFieldDefinitions(buildAcctFields(disabledStdFields, customs));
    } catch (err) { console.error('Load field definitions error:', err); }
  };

  const handleToggleField = async (field) => {
    setTogglingField(field.fieldName);
    if (field._isStd) {
      const newDisabled = disabledStdFields.includes(field.fieldName)
        ? disabledStdFields.filter(n => n !== field.fieldName)
        : [...disabledStdFields, field.fieldName];
      localStorage.setItem(ACCT_DISABLED_KEY, JSON.stringify(newDisabled));
      setDisabledStdFieldsState(newDisabled);
      setFieldDefinitions(buildAcctFields(newDisabled, customFieldDefs));
    } else {
      try {
        await fieldDefinitionService.toggleFieldStatus(field._id, !field.isActive);
        const updated = customFieldDefs.map(f => f._id === field._id ? { ...f, isActive: !f.isActive } : f);
        setCustomFieldDefs(updated);
        setFieldDefinitions(buildAcctFields(disabledStdFields, updated));
      } catch (err) { console.error('Toggle error:', err); }
    }
    setTogglingField(null);
  };

  const handleAddCustomField = async (fieldData) => {
    const created = await fieldDefinitionService.createFieldDefinition({ entityType: 'Account', isStandardField: false, showInCreate: true, showInEdit: true, showInDetail: true, ...fieldData });
    const updated = [...customFieldDefs, { ...created, isActive: true }].sort((a, b) => a.displayOrder - b.displayOrder);
    setCustomFieldDefs(updated);
    setFieldDefinitions(buildAcctFields(disabledStdFields, updated));
  };

  const handleDeleteCustomField = async (field) => {
    try {
      await fieldDefinitionService.permanentDeleteFieldDefinition(field._id);
      const updated = customFieldDefs.filter(f => f._id !== field._id);
      setCustomFieldDefs(updated);
      setFieldDefinitions(buildAcctFields(disabledStdFields, updated));
    } catch (err) {
      console.error('Delete field error:', err);
      alert(err.message || 'Failed to delete field');
    }
  };

  const groupFieldsBySection = (fields) => {
    const grouped = {};
    fields.forEach(field => {
      const section = field.section || 'Additional Information';
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push(field);
    });
    return grouped;
  };

  const handleFieldChange = (fieldName, value) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }));
    setFieldErrors(prev => ({ ...prev, [fieldName]: null }));
  };

  const renderDynamicField = (field) => {
    if (field.fieldName === 'billingCountry') {
      return (
        <LocCountrySelect
          value={fieldValues['billingCountry'] || ''}
          onChange={(c) => { handleFieldChange('billingCountry', c.name); setSelectedCountryIso(c.isoCode); handleFieldChange('billingState', ''); handleFieldChange('billingCity', ''); setSelectedStateIso(''); }}
        />
      );
    }
    if (field.fieldName === 'billingState') {
      return (
        <LocStateSelect
          value={fieldValues['billingState'] || ''}
          countryIso={selectedCountryIso}
          onChange={(name, iso) => { handleFieldChange('billingState', name); setSelectedStateIso(iso); handleFieldChange('billingCity', ''); }}
        />
      );
    }
    if (field.fieldName === 'billingCity') {
      return (
        <LocCitySelect
          value={fieldValues['billingCity'] || ''}
          countryIso={selectedCountryIso}
          stateIso={selectedStateIso}
          onChange={(name) => handleFieldChange('billingCity', name)}
        />
      );
    }
    return (
      <DynamicField fieldDefinition={field} value={fieldValues[field.fieldName] || ''} onChange={handleFieldChange} error={fieldErrors[field.fieldName]} />
    );
  };

  const closeAllForms = () => {
    setShowCreateForm(false);
    setShowManageFields(false);
  };

  const handleCreateAccount = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      setError('');
      const standardFields = {};
      const customFields = {};
      fieldDefinitions.forEach(field => {
        const value = fieldValues[field.fieldName];
        if (value !== undefined && value !== null && value !== '') {
          if (field.isStandardField) standardFields[field.fieldName] = value;
          else customFields[field.fieldName] = value;
        }
      });
      // Transform flat billing fields → nested billingAddress object (backend expects nested)
      const billingAddress = {};
      const billingFieldMap = { billingStreet: 'street', billingCity: 'city', billingState: 'state', billingCountry: 'country', billingZipCode: 'zipCode' };
      Object.entries(billingFieldMap).forEach(([flatKey, nestedKey]) => {
        if (standardFields[flatKey]) { billingAddress[nestedKey] = standardFields[flatKey]; delete standardFields[flatKey]; }
      });
      if (Object.keys(billingAddress).length > 0) standardFields.billingAddress = billingAddress;

      const accountData = { ...standardFields, customFields: Object.keys(customFields).length > 0 ? customFields : undefined };
      await accountService.createAccount(accountData);
      setSuccess('Account created successfully!');
      setShowCreateForm(false);
      setWizardStep(0);
      resetForm();
      loadAccounts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.response?.data?.message || 'Failed to create account'); }
    finally { setCreating(false); }
  };

  const resetForm = () => {
    setFormData({ accountName: '', accountType: 'Customer', industry: '', phone: '', website: '', fax: '', annualRevenue: '', numberOfEmployees: '', billingStreet: '', billingCity: '', billingState: '', billingCountry: '', billingZipCode: '', shippingStreet: '', shippingCity: '', shippingState: '', shippingCountry: '', shippingZipCode: '', description: '' });
    setFieldValues({});
    setFieldErrors({});
    setSelectedCountryIso('');
    setSelectedStateIso('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle stats click filter
  const handleStatsFilter = (type) => {
    setFilters(prev => ({ ...prev, accountType: type }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // === Split View Functions ===
  const loadAccountDetails = async (accountId) => {
    setSelectedAccountId(accountId);
    setLoadingDetail(true);
    setDetailActiveTab('overview');
    closeDetailForms();

    try {
      const response = await accountService.getAccount(accountId);
      if (response?.success) {
        setSelectedAccountData(response.data);
        loadDetailCustomFields();
      }
    } catch (err) { console.error('Error loading account details:', err); }
    finally { setLoadingDetail(false); }
  };

  const handleAccountClick = (accountId) => {
    if (selectedAccountId === accountId) return;
    loadAccountDetails(accountId);
  };

  const loadDetailCustomFields = async () => {
    try {
      const response = await fieldDefinitionService.getFieldDefinitions('Account', false);
      if (response && Array.isArray(response)) {
        const activeFields = response.filter(field => field.isActive && field.showInDetail).sort((a, b) => a.displayOrder - b.displayOrder);
        setCustomFieldDefinitions(activeFields);
      }
    } catch (err) { console.error('Load custom fields error:', err); }
  };

  const closeDetailForms = () => {
    setShowDetailEditForm(false);
    setShowDetailDeleteConfirm(false);
  };

  const handleDividerDrag = (e) => {
    e.preventDefault();
    const container = document.getElementById('accounts-split-container');
    if (!container) return;
    const startX = e.clientX;
    const startWidth = detailPanelWidth;
    const containerW = container.getBoundingClientRect().width;
    const onMove = (mv) => {
      const delta = ((mv.clientX - startX) / containerW) * 100;
      setDetailPanelWidth(Math.max(25, Math.min(65, startWidth + delta)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const closeSidePanel = () => {
    setDetailExpanded(false);
    setSelectedAccountId(null);
    setSelectedAccountData(null);
    closeDetailForms();
  };

  const openDetailEditForm = () => {
    if (!selectedAccountData) return;
    setDetailEditData({
      accountName: selectedAccountData.accountName || '',
      accountType: selectedAccountData.accountType || 'Customer',
      contactPerson: selectedAccountData.contactPerson || '',
      industry: selectedAccountData.industry || '',
      phone: selectedAccountData.phone || '',
      website: selectedAccountData.website || '',
      email: selectedAccountData.email || '',
      annualRevenue: selectedAccountData.annualRevenue || '',
      numberOfEmployees: selectedAccountData.numberOfEmployees || '',
      leadSource: selectedAccountData.leadSource || '',
      gstNumber: selectedAccountData.gstNumber || '',
      description: selectedAccountData.description || ''
    });
    closeDetailForms();
    setShowDetailEditForm(true);
  };

  const handleDetailUpdateAccount = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await accountService.updateAccount(selectedAccountId, detailEditData);
      setSuccess('Account updated successfully!');
      setShowDetailEditForm(false);
      const response = await accountService.getAccount(selectedAccountId);
      if (response?.success) setSelectedAccountData(response.data);
      loadAccounts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.message || 'Failed to update account'); }
  };

  const handleDetailEditChange = (e) => {
    const { name, value } = e.target;
    setDetailEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailDeleteAccount = async () => {
    try {
      setError('');
      await accountService.deleteAccount(selectedAccountId);
      setSuccess('Account deleted successfully!');
      closeSidePanel();
      loadAccounts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.message || 'Failed to delete account'); }
  };

  const canCreateAccount = hasPermission('account_management', 'create');
  const canUpdateAccount = hasPermission('account_management', 'update');
  const canDeleteAccount = hasPermission('account_management', 'delete');

  const getAccountTypeIcon = (type) => {
    const icons = { 'Customer': 'C', 'Prospect': 'P', 'Partner': 'Pr', 'Vendor': 'V', 'Competitor': 'Co' };
    return icons[type] || 'A';
  };

  return (
    <DashboardLayout title="Accounts">

      {success && <div style={{ padding: '16px 20px', background: '#DCFCE7', color: '#166534', borderRadius: '12px', marginBottom: '24px', border: '2px solid #86EFAC', fontWeight: '600' }}>{success}</div>}
      {error && <div style={{ padding: '16px 20px', background: '#FEE2E2', color: '#991B1B', borderRadius: '12px', marginBottom: '24px', border: '2px solid #FCA5A5', fontWeight: '600' }}>{error}</div>}


      {/* ── WIZARD OVERLAY ── */}

          <div className="stats-grid">
            <div
              className="stat-card"
              onClick={() => handleStatsFilter('')}
              style={{
                cursor: 'pointer',
                border: filters.accountType === '' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
                background: filters.accountType === '' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
                boxShadow: filters.accountType === '' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div className="stat-label">Total Accounts</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div
              className="stat-card"
              onClick={() => handleStatsFilter('Customer')}
              style={{
                cursor: 'pointer',
                border: filters.accountType === 'Customer' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
                background: filters.accountType === 'Customer' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
                boxShadow: filters.accountType === 'Customer' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div className="stat-label">Customers</div>
              <div className="stat-value">{stats.customers}</div>
            </div>
            <div
              className="stat-card"
              onClick={() => handleStatsFilter('Prospect')}
              style={{
                cursor: 'pointer',
                border: filters.accountType === 'Prospect' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
                background: filters.accountType === 'Prospect' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
                boxShadow: filters.accountType === 'Prospect' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div className="stat-label">Prospects</div>
              <div className="stat-value">{stats.prospects}</div>
            </div>
            <div
              className="stat-card"
              onClick={() => handleStatsFilter('Partner')}
              style={{
                cursor: 'pointer',
                border: filters.accountType === 'Partner' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
                background: filters.accountType === 'Partner' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
                boxShadow: filters.accountType === 'Partner' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div className="stat-label">Partners</div>
              <div className="stat-value">{stats.partners}</div>
            </div>
          </div>

      {/* Split Container */}
      <div id="accounts-split-container" style={{ display: 'flex', height: 'calc(100vh - 280px)', overflow: 'hidden', position: 'relative' }}>

        {/* LEFT: Detail Panel */}
        {/* ── LEFT: Create Form (inline) ── */}
        {showCreateForm && (
          <div style={{ flex: `0 0 ${detailPanelWidth}%`, background: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3c72 100%)', flexShrink: 0 }}>
              <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>🏢</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>New Account</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>Step {wizardStep + 1} of {ACCOUNT_WIZARD_STEPS.length}</div>
                  </div>
                </div>
                <button onClick={() => { setShowCreateForm(false); resetForm(); setWizardStep(0); }}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '7px', padding: '5px 9px', color: 'white', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ display: 'flex', padding: '8px 10px 0' }}>
                {ACCOUNT_WIZARD_STEPS.map((step, idx) => {
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
                <div style={{ height: '100%', background: 'linear-gradient(90deg,#3b82f6,#6366f1)', borderRadius: '99px', width: `${(wizardStep / ACCOUNT_WIZARD_STEPS.length) * 100}%`, transition: 'width 0.35s ease' }} />
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
                <div style={{ marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                  <h4 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{ACCOUNT_WIZARD_STEPS[wizardStep]?.icon} {ACCOUNT_WIZARD_STEPS[wizardStep]?.label}</h4>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{ACCOUNT_WIZARD_STEPS[wizardStep]?.desc}</p>
                </div>
                {(() => {
                  const step = ACCOUNT_WIZARD_STEPS[wizardStep];
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
              <div style={{ padding: '11px 14px', borderTop: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <button type="button" onClick={() => { if (wizardStep > 0) { setWizardStep(s => s - 1); } else { setShowCreateForm(false); resetForm(); setWizardStep(0); } }}
                  style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  {wizardStep === 0 ? 'Cancel' : '← Back'}
                </button>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {ACCOUNT_WIZARD_STEPS.map((_, idx) => (
                    <div key={idx} style={{ width: idx === wizardStep ? '16px' : '5px', height: '5px', borderRadius: '99px', background: idx < wizardStep ? '#10b981' : idx === wizardStep ? '#3b82f6' : '#e2e8f0', transition: 'all 0.25s' }} />
                  ))}
                </div>
                {wizardStep < ACCOUNT_WIZARD_STEPS.length - 1 ? (
                  <button type="button" onClick={() => setWizardStep(s => s + 1)}
                    style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#1e3c72 0%,#3b82f6 100%)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(30,60,114,0.25)' }}>
                    Next →
                  </button>
                ) : (
                  <button type="button" onClick={handleCreateAccount} disabled={creating}
                    style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: creating ? '#94a3b8' : 'linear-gradient(135deg,#059669 0%,#10b981 100%)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: creating ? 'not-allowed' : 'pointer', boxShadow: creating ? 'none' : '0 2px 8px rgba(16,185,129,0.25)' }}>
                    {creating ? 'Saving...' : '✓ Save Account'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedAccountId && !showCreateForm && (
          <div style={detailExpanded ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' } : { flex: `0 0 ${detailPanelWidth}%`, background: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {/* Panel Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h3 style={{ margin: 0, color: '#1e3c72', fontSize: '15px', fontWeight: '600' }}>Account Details</h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setDetailExpanded(v => !v)} style={{ background: 'rgba(30,60,114,0.08)', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', color: '#1e3c72' }}>{detailExpanded ? '↙ Collapse' : '↗ Expand'}</button>
                <button onClick={closeSidePanel} style={{ background: 'rgba(30,60,114,0.1)', border: 'none', borderRadius: '6px', padding: '4px', color: '#1e3c72', cursor: 'pointer' }}><X className="h-5 w-5" /></button>
              </div>
            </div>
            {/* Panel Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingDetail ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}><div className="spinner"></div></div>
              ) : selectedAccountData ? (
                <div>
                  {/* Account Header */}
                  <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3c72', fontSize: '20px', fontWeight: 'bold' }}>
                        {getAccountTypeIcon(selectedAccountData.accountType)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0', color: '#1e3c72' }}>{selectedAccountData.accountName}</h2>
                        <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>{selectedAccountData.accountNumber ? `#${String(selectedAccountData.accountNumber).padStart(5, '0')}` : ''}</p>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                          <span style={{ padding: '2px 8px', background: '#E0E7FF', color: '#3730A3', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>{selectedAccountData.accountType}</span>
                          {selectedAccountData.industry && <span style={{ padding: '2px 8px', background: '#f1f5f9', color: '#475569', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>{selectedAccountData.industry}</span>}
                        </div>
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {canUpdateAccount && <button className="crm-btn crm-btn-primary crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={openDetailEditForm}><Edit className="h-3 w-3 mr-1" />Edit</button>}
                      {canDeleteAccount && <button className="crm-btn crm-btn-danger crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => { closeDetailForms(); setShowDetailDeleteConfirm(true); }}>Delete</button>}
                      {selectedAccountData.phone && <button className="crm-btn crm-btn-outline crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => window.location.href = `tel:${selectedAccountData.phone}`}><Phone className="h-3 w-3 mr-1" />Call</button>}
                    </div>
                  </div>

                  {/* Inline Edit Form */}
                  {showDetailEditForm && (
                    <div style={{ margin: '12px', padding: '12px', background: '#F0F9FF', borderRadius: '8px', border: '1px solid #93C5FD' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1E40AF' }}>Edit Account</h5>
                        <button onClick={() => setShowDetailEditForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b' }}>✕</button>
                      </div>
                      <form onSubmit={handleDetailUpdateAccount}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Customer Name *</label><input type="text" name="accountName" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.accountName || ''} onChange={handleDetailEditChange} required /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Customer Type</label><select name="accountType" className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.accountType || 'Customer'} onChange={handleDetailEditChange}><option value="Customer">Customer</option><option value="Prospect">Prospect</option><option value="Partner">Partner</option><option value="Reseller">Reseller</option><option value="Vendor">Vendor</option><option value="Other">Other</option></select></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Contact Person</label><input type="text" name="contactPerson" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.contactPerson || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Email</label><input type="email" name="email" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.email || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Phone</label><input type="tel" name="phone" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.phone || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Website</label><input type="url" name="website" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.website || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Industry</label><select name="industry" className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.industry || ''} onChange={handleDetailEditChange}><option value="">Select</option><option value="Agriculture">Agriculture</option><option value="Automotive">Automotive</option><option value="Banking & Finance">Banking &amp; Finance</option><option value="Construction">Construction</option><option value="Consulting">Consulting</option><option value="Education">Education</option><option value="Energy & Power">Energy &amp; Power</option><option value="Food & Beverage">Food &amp; Beverage</option><option value="Government">Government</option><option value="Healthcare">Healthcare</option><option value="Hospitality">Hospitality</option><option value="IT & Technology">IT &amp; Technology</option><option value="Insurance">Insurance</option><option value="Logistics & Transport">Logistics &amp; Transport</option><option value="Manufacturing">Manufacturing</option><option value="Media & Entertainment">Media &amp; Entertainment</option><option value="Pharma & Life Sciences">Pharma &amp; Life Sciences</option><option value="Real Estate">Real Estate</option><option value="Retail">Retail</option><option value="Telecom">Telecom</option><option value="Textile & Apparel">Textile &amp; Apparel</option><option value="Other">Other</option></select></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Employees</label><input type="number" name="numberOfEmployees" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.numberOfEmployees || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Annual Revenue</label><input type="number" name="annualRevenue" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.annualRevenue || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Lead Source</label><select name="leadSource" className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.leadSource || ''} onChange={handleDetailEditChange}><option value="">Select</option><option value="Website">Website</option><option value="Social Media">Social Media</option><option value="Referral">Referral</option><option value="Campaign">Campaign</option><option value="Cold Call">Cold Call</option><option value="Other">Other</option></select></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>GST Number</label><input type="text" name="gstNumber" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.gstNumber || ''} onChange={handleDetailEditChange} /></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => setShowDetailEditForm(false)}>Cancel</button>
                          <button type="submit" className="crm-btn crm-btn-primary crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }}>Update</button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Inline Delete Confirm */}
                  {showDetailDeleteConfirm && (
                    <div style={{ margin: '12px', padding: '12px', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FCA5A5' }}>
                      <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#991B1B' }}>Delete <strong>{selectedAccountData.accountName}</strong>?</p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button className="crm-btn crm-btn-secondary crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => setShowDetailDeleteConfirm(false)}>Cancel</button>
                        <button className="crm-btn crm-btn-danger crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={handleDetailDeleteAccount}>Delete</button>
                      </div>
                    </div>
                  )}

                  {/* Tabs */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <button onClick={() => setDetailActiveTab('overview')} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '600', border: 'none', background: detailActiveTab === 'overview' ? 'white' : 'transparent', borderBottom: detailActiveTab === 'overview' ? '2px solid #1e3c72' : '2px solid transparent', color: detailActiveTab === 'overview' ? '#1e3c72' : '#64748b', cursor: 'pointer' }}>Overview</button>
                    <button onClick={() => setDetailActiveTab('related')} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '600', border: 'none', background: detailActiveTab === 'related' ? 'white' : 'transparent', borderBottom: detailActiveTab === 'related' ? '2px solid #1e3c72' : '2px solid transparent', color: detailActiveTab === 'related' ? '#1e3c72' : '#64748b', cursor: 'pointer' }}>Related</button>
                  </div>

                  {/* Tab Content */}
                  <div style={{ padding: '16px' }}>
                    {detailActiveTab === 'overview' && (
                      <div>
                        {(() => {
                          const SYSTEM_KEYS = new Set(['_id', '__v', 'tenant', 'createdBy', 'lastModifiedBy', 'updatedAt', 'createdAt', 'isActive', 'owner', 'customFields', 'billingAddress', 'shippingAddress', 'relatedData', 'parentAccount', 'rating', 'SICCode', 'tickerSymbol', 'ownership', 'fax']);
                          const fmtKey = (fn) => fn.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
                          const fieldMap = {};
                          DEFAULT_ACCOUNT_FIELDS.forEach(f => { fieldMap[f.fieldName] = { label: f.label, section: f.section, fieldType: f.fieldType }; });
                          fieldMap['annualRevenue'] = { label: 'Annual Revenue', section: 'Business Information', fieldType: 'currency' };
                          fieldMap['numberOfEmployees'] = { label: 'Employees', section: 'Business Information', fieldType: 'text' };
                          customFieldDefs.forEach(f => { fieldMap[f.fieldName] = { label: f.label, section: f.section, fieldType: f.fieldType }; });
                          const grouped = {};
                          Object.keys(selectedAccountData).forEach(key => {
                            if (SYSTEM_KEYS.has(key)) return;
                            const val = selectedAccountData[key];
                            if (val === null || val === undefined || val === '') return;
                            if (typeof val === 'object' && !Array.isArray(val)) return;
                            const def = fieldMap[key];
                            const section = def?.section || 'Additional Information';
                            if (!grouped[section]) grouped[section] = [];
                            grouped[section].push({ key, label: def?.label || fmtKey(key), fieldType: def?.fieldType || 'text', value: val });
                          });
                          if (selectedAccountData.customFields && typeof selectedAccountData.customFields === 'object') {
                            Object.keys(selectedAccountData.customFields).forEach(key => {
                              const val = selectedAccountData.customFields[key];
                              if (val === null || val === undefined || val === '') return;
                              if (typeof val === 'object' && !Array.isArray(val)) return;
                              const def = fieldMap[key];
                              const section = def?.section || 'Additional Information';
                              if (!grouped[section]) grouped[section] = [];
                              if (!grouped[section].find(f => f.key === key)) {
                                grouped[section].push({ key, label: def?.label || fmtKey(key), fieldType: def?.fieldType || 'text', value: val });
                              }
                            });
                          }
                          const sectionOrder = ['Basic Information', 'Business Information', 'Additional Information', ...Object.keys(grouped).filter(s => !['Basic Information', 'Business Information', 'Additional Information'].includes(s))];
                          return sectionOrder.map(section => {
                            const fields = grouped[section];
                            if (!fields || fields.length === 0) return null;
                            return (
                              <div key={section} style={{ marginBottom: '14px' }}>
                                <h4 style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                                  {section}
                                  <span style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                  {fields.map(({ key, label, fieldType, value }) => {
                                    let display = value;
                                    if (fieldType === 'currency') display = `₹${Number(value).toLocaleString()}`;
                                    else if (fieldType === 'date') { try { display = new Date(value).toLocaleDateString(); } catch(e) { display = value; } }
                                    else if (fieldType === 'checkbox') display = value ? 'Yes' : 'No';
                                    else if (Array.isArray(value)) display = value.join(', ');
                                    else display = value?.toString() || '-';
                                    const isEmail = fieldType === 'email' || key === 'email';
                                    const isPhone = fieldType === 'phone' || key === 'phone';
                                    const isUrl = fieldType === 'url' || key === 'website';
                                    return (
                                      <div key={key} style={{ background: '#f9fafb', padding: '8px 10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                                        <p style={{ fontSize: '9px', color: '#9CA3AF', marginBottom: '3px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</p>
                                        {isEmail ? <a href={`mailto:${display}`} style={{ fontSize: '12px', fontWeight: '500', color: '#3B82F6', wordBreak: 'break-all' }}>{display}</a>
                                          : isPhone ? <a href={`tel:${display}`} style={{ fontSize: '12px', fontWeight: '500', color: '#059669' }}>{display}</a>
                                          : isUrl ? <a href={display} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontWeight: '500', color: '#7C3AED', wordBreak: 'break-all' }}>{display}</a>
                                          : <p style={{ fontSize: '12px', fontWeight: '500', margin: 0, color: '#1e293b', wordBreak: 'break-word' }}>{display}</p>
                                        }
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          });
                        })()}
                        {/* Billing Address (nested object - rendered separately) */}
                        {selectedAccountData.billingAddress && (selectedAccountData.billingAddress.street || selectedAccountData.billingAddress.city) && (
                          <div style={{ marginBottom: '14px' }}>
                            <h4 style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                              Billing Address
                              <span style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                            </h4>
                            <div style={{ background: '#f9fafb', padding: '10px', borderRadius: '6px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#374151' }}>
                              <MapPin className="h-4 w-4 text-gray-500" style={{ marginTop: '2px', flexShrink: 0 }} />
                              <div>
                                {selectedAccountData.billingAddress.street && <div>{selectedAccountData.billingAddress.street}</div>}
                                <div>{[selectedAccountData.billingAddress.city, selectedAccountData.billingAddress.state, selectedAccountData.billingAddress.zipCode].filter(Boolean).join(', ')}</div>
                                {selectedAccountData.billingAddress.country && <div>{selectedAccountData.billingAddress.country}</div>}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {detailActiveTab === 'related' && (
                      <div>
                        {/* Related Contacts */}
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Contacts ({selectedAccountData.relatedData?.contacts?.total || 0})</h4>
                          {selectedAccountData.relatedData?.contacts?.data?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {selectedAccountData.relatedData.contacts.data.slice(0, 5).map(contact => (
                                <div key={contact._id} style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => navigate(`/contacts/${contact._id}`)}>
                                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e3c72' }}>{contact.firstName} {contact.lastName}</div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>{contact.email}</div>
                                  {contact.jobTitle && <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{contact.jobTitle}</div>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '6px' }}>No contacts found</p>
                          )}
                        </div>

                        {/* Related Opportunities */}
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Deals ({selectedAccountData.relatedData?.opportunities?.total || 0})</h4>
                          {selectedAccountData.relatedData?.opportunities?.data?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {selectedAccountData.relatedData.opportunities.data.slice(0, 5).map(opp => (
                                <div key={opp._id} style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => navigate(`/opportunities/${opp._id}`)}>
                                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e3c72' }}>{opp.opportunityName}</div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>Rs. {opp.amount?.toLocaleString() || '0'}</span>
                                    <span style={{ fontSize: '10px', padding: '1px 6px', background: '#E0E7FF', color: '#3730A3', borderRadius: '4px' }}>{opp.stage}</span>
                                  </div>
                                  <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '4px' }}>Close: {new Date(opp.closeDate).toLocaleDateString()}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '6px' }}>No deals found</p>
                          )}
                        </div>

                        {/* Related Tasks (Open Activities) */}
                        <div>
                          <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Open Activities ({selectedAccountData.relatedData?.tasks?.total || 0})</h4>
                          {selectedAccountData.relatedData?.tasks?.data?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {selectedAccountData.relatedData.tasks.data.slice(0, 5).map(task => (
                                <div key={task._id} style={{ padding: '10px', background: task.status === 'Completed' ? '#f9fafb' : '#F0FDF4', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '10px', background: task.priority === 'High' ? '#FEE2E2' : '#E0E7FF', color: task.priority === 'High' ? '#991B1B' : '#3730A3', padding: '1px 6px', borderRadius: '4px' }}>{task.priority}</span>
                                    <span style={{ fontSize: '10px', background: task.status === 'Completed' ? '#DCFCE7' : '#FEF3C7', color: task.status === 'Completed' ? '#166534' : '#92400E', padding: '1px 6px', borderRadius: '4px' }}>{task.status}</span>
                                  </div>
                                  <div style={{ fontWeight: '600', fontSize: '12px', color: '#1e3c72' }}>{task.subject}</div>
                                  <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '4px' }}>Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '6px' }}>No activities found</p>
                          )}
                        </div>

                        {/* Custom Fields grouped by section */}
                        {customFieldDefinitions.length > 0 && selectedAccountData.customFields && Object.keys(selectedAccountData.customFields).length > 0 && (() => {
                          const groupedFields = groupFieldsBySection(customFieldDefinitions.filter(f => !f.isStandardField));
                          const sections = Object.keys(groupedFields);

                          const renderFieldValue = (field, value) => {
                            if (!value) return null;
                            let displayValue = value;

                            if (field.fieldType === 'currency') {
                              displayValue = `₹${Number(value).toLocaleString()}`;
                            } else if (field.fieldType === 'percentage') {
                              displayValue = `${value}%`;
                            } else if (field.fieldType === 'date') {
                              displayValue = new Date(value).toLocaleDateString();
                            } else if (field.fieldType === 'datetime') {
                              displayValue = new Date(value).toLocaleString();
                            } else if (field.fieldType === 'checkbox') {
                              displayValue = value ? 'Yes' : 'No';
                            } else if (field.fieldType === 'multi_select' && Array.isArray(value)) {
                              const selectedOptions = field.options?.filter(opt => value.includes(opt.value)) || [];
                              displayValue = selectedOptions.map(opt => opt.label).join(', ');
                            } else if (['dropdown', 'radio'].includes(field.fieldType)) {
                              const selectedOption = field.options?.find(opt => opt.value === value);
                              displayValue = selectedOption ? selectedOption.label : value;
                            }

                            return (
                              <div key={field._id}>
                                <p style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px' }}>{field.label}</p>
                                <p style={{ fontSize: '13px', fontWeight: '500', color: '#111827', margin: 0 }}>{displayValue || 'Not provided'}</p>
                              </div>
                            );
                          };

                          return sections.map(sectionName => {
                            const fieldsWithValues = groupedFields[sectionName].filter(field => selectedAccountData.customFields[field.fieldName]);
                            if (fieldsWithValues.length === 0) return null;

                            return (
                              <div key={sectionName} style={{ marginTop: '20px' }}>
                                <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ width: '3px', height: '12px', background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)', borderRadius: '2px' }}></span>
                                  {sectionName}
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                                  {fieldsWithValues.map((field) => renderFieldValue(field, selectedAccountData.customFields[field.fieldName]))}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Failed to load account details</div>
              )}
            </div>
          </div>
        )}

        {/* Drag Divider */}
        {(selectedAccountId || showCreateForm) && !detailExpanded && (
          <div onMouseDown={handleDividerDrag} style={{ width: '6px', cursor: 'col-resize', background: 'transparent', flexShrink: 0, position: 'relative', zIndex: 1, userSelect: 'none' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '4px', height: '40px', borderRadius: '2px', background: '#cbd5e1' }} />
          </div>
        )}

        {/* RIGHT: Filters + List */}
        <div style={{ flex: (selectedAccountId || showCreateForm) && !detailExpanded ? `0 0 ${100 - detailPanelWidth}%` : '1 1 100%', minWidth: 0, overflow: 'auto', padding: '0 0 20px 0' }}>
          {/* Filters */}
          <div className="crm-card" style={{ marginBottom: '24px' }}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <input type="text" name="search" placeholder="Search accounts..." className="crm-form-input" value={filters.search} onChange={handleFilterChange} />
                <select name="accountType" className="crm-form-select" value={filters.accountType} onChange={handleFilterChange}>
                  <option value="">All Types</option>
                  <option value="Customer">Customer</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Partner">Partner</option>
                  <option value="Vendor">Vendor</option>
                </select>
                <select name="industry" className="crm-form-select" value={filters.industry} onChange={handleFilterChange}>
                  <option value="">All Industries</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Automotive">Automotive</option>
                  <option value="Banking & Finance">Banking &amp; Finance</option>
                  <option value="Construction">Construction</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Education">Education</option>
                  <option value="Energy & Power">Energy &amp; Power</option>
                  <option value="Food & Beverage">Food &amp; Beverage</option>
                  <option value="Government">Government</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Hospitality">Hospitality</option>
                  <option value="IT & Technology">IT &amp; Technology</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Logistics & Transport">Logistics &amp; Transport</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Media & Entertainment">Media &amp; Entertainment</option>
                  <option value="Pharma & Life Sciences">Pharma &amp; Life Sciences</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Retail">Retail</option>
                  <option value="Telecom">Telecom</option>
                  <option value="Textile & Apparel">Textile &amp; Apparel</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                {hasPermission('field_management', 'read') && (
                  <button onClick={() => { closeAllForms(); setShowManageFields(v => !v); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                    <Settings style={{ width: '14px', height: '14px' }} /> Manage Fields
                  </button>
                )}
                {canCreateAccount && <button className="crm-btn crm-btn-primary" onClick={() => { closeAllForms(); setSelectedAccountId(null); setSelectedAccountData(null); setDetailExpanded(false); resetForm(); setShowCreateForm(true); }}>+ New Account</button>}
                <div style={{ marginLeft: 'auto', display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px', border: '1.5px solid #e2e8f0' }}>
                  {[['table', <List className="h-3.5 w-3.5" />, 'List'], ['grid', <LayoutGrid className="h-3.5 w-3.5" />, 'Grid']].map(([mode, icon, lbl]) => (
                    <button key={mode} onClick={() => setViewMode(mode)}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 13px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.18s', background: viewMode === mode ? 'white' : 'transparent', color: viewMode === mode ? '#0f172a' : '#94a3b8', boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                      {icon} {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Manage Fields Panel */}
          {showManageFields && (
            <ManageFieldsPanel
              allFieldDefs={allFieldDefs}
              togglingField={togglingField}
              onToggle={handleToggleField}
              onClose={() => setShowManageFields(false)}
              onAdd={handleAddCustomField}
              onDelete={handleDeleteCustomField}
              canAdd={hasPermission('field_management', 'create')}
              canToggle={hasPermission('field_management', 'update')}
              canDelete={hasPermission('field_management', 'delete')}
              entityLabel="Account"
              sections={ACCOUNT_SECTIONS}
            />
          )}
          {/* Account List */}
          <div className="crm-card">
            <div className="crm-card-header">
              <h2 className="crm-card-title">{viewMode === 'grid' ? 'Account Cards' : 'Account List'} ({pagination.total})</h2>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
            ) : accounts.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e3c72' }}>No accounts found</p>
                {canCreateAccount && <button className="crm-btn crm-btn-primary" onClick={() => { resetForm(); setShowCreateForm(true); }}>+ Create First Account</button>}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {accounts.map((account) => (
                      <div key={account._id} onClick={() => handleAccountClick(account._id)}
                        style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', cursor: 'pointer', border: selectedAccountId === account._id ? '2px solid #1e3c72' : '2px solid #e5e7eb', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#1e3c72' }}>
                            {getAccountTypeIcon(account.accountType)}
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e3c72' }}>{account.accountName}</h3>
                            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{account.accountNumber ? `#${String(account.accountNumber).padStart(5, '0')}` : ''}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <span style={{ padding: '2px 8px', background: '#E0E7FF', color: '#3730A3', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>{account.accountType}</span>
                          {account.industry && <span style={{ padding: '2px 8px', background: '#f1f5f9', color: '#475569', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>{account.industry}</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {account.phone && <div>{account.phone}</div>}
                          {account.website && <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.website}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (() => {
                  /* ── Type cell colors (entire cell bg) ── */
                  const TYPE_CELL = {
                    Customer:  { bg:'#dbeafe', color:'#1e3a8a', fw:700 },
                    Prospect:  { bg:'#ffedd5', color:'#9a3412', fw:700 },
                    Partner:   { bg:'#dcfce7', color:'#14532d', fw:700 },
                    Reseller:  { bg:'#ede9fe', color:'#4c1d95', fw:700 },
                    Vendor:    { bg:'#fee2e2', color:'#991b1b', fw:700 },
                    Other:     { bg:'#f1f5f9', color:'#334155', fw:600 },
                  };
                  /* ── Industry cell colors ── */
                  const IND_CELL = {
                    'IT & Technology':       { bg:'#e0f2fe', color:'#0c4a6e' },
                    'Healthcare':            { bg:'#dcfce7', color:'#14532d' },
                    'Banking & Finance':     { bg:'#dbeafe', color:'#1e3a8a' },
                    'Education':             { bg:'#fef9c3', color:'#713f12' },
                    'Manufacturing':         { bg:'#ffedd5', color:'#9a3412' },
                    'Retail':                { bg:'#fce7f3', color:'#831843' },
                    'Real Estate':           { bg:'#ede9fe', color:'#4c1d95' },
                    'Consulting':            { bg:'#cffafe', color:'#164e63' },
                    'Telecom':               { bg:'#d1fae5', color:'#065f46' },
                    'Logistics & Transport': { bg:'#fee2e2', color:'#991b1b' },
                  };

                  const AVCOLORS = ['#0073ea','#e2445c','#00c875','#ff642e','#a25ddc','#037f4c','#f2a640','#0086c0'];
                  const avatarBg = name => AVCOLORS[(name?.charCodeAt(0)||0) % AVCOLORS.length];

                  const ACCT_COL_MAP = {
                    accountName: { label:'Customer Name', width:230,
                      render: a => {
                        const name = a.accountName || '—';
                        const ini  = name[0]?.toUpperCase() || '?';
                        return (
                          <div style={{display:'flex',alignItems:'center',gap:8,overflow:'hidden'}}>
                            <div style={{width:26,height:26,borderRadius:6,background:avatarBg(name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div>
                            <div style={{minWidth:0,overflow:'hidden'}}>
                              <div style={{fontWeight:700,color:'#1e3c72',fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</div>
                              {a.accountNumber && <div style={{fontSize:10,color:'#94a3b8'}}>#{String(a.accountNumber).padStart(5,'0')}</div>}
                            </div>
                          </div>
                        );
                      }, cellBg: () => null,
                    },
                    accountType: { label:'Type', width:120,
                      render: a => a.accountType || '',
                      cellBg: a => a.accountType ? (TYPE_CELL[a.accountType]||TYPE_CELL.Other) : null,
                    },
                    contactPerson: { label:'Contact Person', width:150, render: a => a.contactPerson||'', cellBg:()=>null },
                    email:   { label:'Email',   width:185,
                      render: a => a.email
                        ? <a href={`mailto:${a.email}`} onClick={e=>e.stopPropagation()} style={{color:'#2563eb',textDecoration:'none',fontSize:13}}>{a.email}</a>
                        : '', cellBg:()=>null
                    },
                    phone:   { label:'Phone',   width:130, render: a => a.phone  ||'', cellBg:()=>null },
                    website: { label:'Website', width:160,
                      render: a => a.website
                        ? <a href={a.website} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{color:'#0073ea',textDecoration:'none',fontSize:13}}>{a.website.replace(/^https?:\/\//,'')}</a>
                        : '', cellBg:()=>null
                    },
                    industry: { label:'Industry', width:150,
                      render: a => a.industry||'',
                      cellBg: a => a.industry ? (IND_CELL[a.industry]||null) : null,
                    },
                    annualRevenue:     { label:'Annual Revenue', width:140, render: a => a.annualRevenue ? `₹${Number(a.annualRevenue).toLocaleString('en-IN')}` : '', cellBg:()=>null },
                    numberOfEmployees: { label:'Employees',      width:100, render: a => a.numberOfEmployees||'', cellBg:()=>null },
                    leadSource:        { label:'Lead Source',    width:120, render: a => a.leadSource||'', cellBg:()=>null },
                    billingCity:       { label:'City',           width:110, render: a => a.billingAddress?.city||'', cellBg:()=>null },
                    billingState:      { label:'State',          width:110, render: a => a.billingAddress?.state||'', cellBg:()=>null },
                    billingCountry:    { label:'Country',        width:120, render: a => a.billingAddress?.country||'', cellBg:()=>null },
                    gstNumber:         { label:'GST Number',     width:140, render: a => a.gstNumber||'', cellBg:()=>null },
                    description:       { label:'Description',    width:200, render: a => a.description||'', cellBg:()=>null },
                  };

                  const activeCols = allFieldDefs
                    .filter(f => f.isActive && ACCT_COL_MAP[f.fieldName])
                    .sort((a,b) => a.displayOrder - b.displayOrder)
                    .map(f => ({ key:f.fieldName, ...ACCT_COL_MAP[f.fieldName] }));
                  const totalW = 36 + activeCols.reduce((s,c) => s+c.width, 0);

                  return (
                    <div style={{ overflowX:'auto', overflowY:'auto', maxHeight:'60vh' }}>
                      <style>{`
                        .xl-th { position:sticky; top:0; z-index:2; background:#f0f2f5; border:1px solid #c8cdd5; padding:8px 12px; font-size:11px; font-weight:700; color:#374151; text-align:left; white-space:nowrap; user-select:none; letter-spacing:.4px; text-transform:uppercase; }
                        .xl-td { border:1px solid #e2e6eb; padding:6px 12px; font-size:13px; color:#374151; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; height:40px; vertical-align:middle; }
                        .xl-row { cursor:pointer; }
                        .xl-row:hover .xl-td { background:#f0f7ff !important; }
                        .xl-row.xl-sel .xl-td { background:#dbeafe !important; }
                        .xl-num { position:sticky; left:0; z-index:1; background:#f0f2f5 !important; border:1px solid #c8cdd5; padding:6px 8px; font-size:11px; color:#94a3b8; text-align:center; width:36px; min-width:36px; font-weight:600; }
                      `}</style>
                      <table style={{ borderCollapse:'collapse', tableLayout:'fixed', width:totalW }}>
                        <colgroup>
                          <col style={{width:36}}/>
                          {activeCols.map(c => <col key={c.key} style={{width:c.width}}/>)}
                        </colgroup>
                        <thead>
                          <tr>
                            <th className="xl-th xl-num">#</th>
                            {activeCols.map(c => <th key={c.key} className="xl-th">{c.label}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {accounts.map((account, i) => {
                            const isSel = selectedAccountId === account._id;
                            return (
                              <tr key={account._id}
                                className={`xl-row${isSel?' xl-sel':''}`}
                                style={{background: isSel?'#dbeafe': i%2===0?'#fff':'#f8fafc'}}
                                onClick={() => handleAccountClick(account._id)}>
                                <td className="xl-td xl-num">{(pagination.page-1)*pagination.limit+i+1}</td>
                                {activeCols.map(c => {
                                  const cb = c.cellBg ? c.cellBg(account) : null;
                                  return (
                                    <td key={c.key} className="xl-td"
                                      style={{
                                        ...(cb && !isSel ? { background:cb.bg, color:cb.color, fontWeight:cb.fw||600, textAlign:'center' } : {}),
                                      }}>
                                      {c.render(account)}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {pagination.pages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid #e5e7eb' }}>
                    <button className="crm-btn crm-btn-secondary crm-btn-sm" onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1}>← Previous</button>
                    <span style={{ fontWeight: '600', color: '#1e3c72', fontSize: '13px' }}>Page {pagination.page} of {pagination.pages}</span>
                    <button className="crm-btn crm-btn-secondary crm-btn-sm" onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.pages}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Accounts;
