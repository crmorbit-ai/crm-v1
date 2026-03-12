import React, { useState, useEffect } from 'react';
import { Country, State, City } from 'country-state-city';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { contactService } from '../services/contactService';
import { accountService } from '../services/accountService';
import { taskService } from '../services/taskService';
import { noteService } from '../services/noteService';
import fieldDefinitionService from '../services/fieldDefinitionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DynamicField from '../components/DynamicField';
import { Mail, Phone, Building2, Briefcase, X, Edit, Trash2, FileText, CheckCircle2, Calendar, Star, User, Settings, List, LayoutGrid } from 'lucide-react';
import ManageFieldsPanel from '../components/ManageFieldsPanel';
import '../styles/crm.css';

const DEFAULT_CONTACT_FIELDS = [
  { fieldName: 'firstName', label: 'Customer Name', fieldType: 'text', section: 'Basic Information', isRequired: true, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 1 },
  { fieldName: 'lastName', label: 'Last Name', fieldType: 'text', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 2 },
  { fieldName: 'email', label: 'Email', fieldType: 'email', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 3 },
  { fieldName: 'phone', label: 'Phone', fieldType: 'phone', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 4 },
  { fieldName: 'mobile', label: 'Mobile', fieldType: 'phone', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 5 },
  { fieldName: 'title', label: 'Job Title', fieldType: 'text', section: 'Professional Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 10 },
  { fieldName: 'department', label: 'Department', fieldType: 'dropdown', section: 'Professional Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 11, options: [{ label: 'Sales', value: 'Sales' }, { label: 'Marketing', value: 'Marketing' }, { label: 'Finance', value: 'Finance' }, { label: 'Operations', value: 'Operations' }, { label: 'IT', value: 'IT' }, { label: 'Other', value: 'Other' }] },
  { fieldName: 'mailingCity', label: 'City', fieldType: 'dropdown', section: 'Mailing Address', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 20 },
  { fieldName: 'mailingState', label: 'State', fieldType: 'dropdown', section: 'Mailing Address', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 21 },
  { fieldName: 'mailingCountry', label: 'Country', fieldType: 'dropdown', section: 'Mailing Address', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 22 },
  { fieldName: 'description', label: 'Description', fieldType: 'textarea', section: 'Additional Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 30 },
];
const CONT_DISABLED_KEY = 'crm_cont_std_disabled';
const getContDisabled = () => { try { return JSON.parse(localStorage.getItem(CONT_DISABLED_KEY) || '[]'); } catch { return []; } };
const CONTACT_SECTIONS = ['Basic Information', 'Professional Information', 'Mailing Address', 'Additional Information'];


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

const CONTACT_WIZARD_STEPS = [
  { label: 'Basic Info',    icon: '👤', desc: 'Name, email & phone',       sections: ['Basic Information'] },
  { label: 'Professional',  icon: '💼', desc: 'Title, department & account', sections: ['Professional Information'], includeAccount: true },
  { label: 'Address',       icon: '📍', desc: 'Mailing address',            sections: ['Mailing Address'] },
  { label: 'Additional',    icon: '📋', desc: 'Notes & preferences',         sections: ['Additional Information'] },
];

const Contacts = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('table');

  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '', account: '', title: '', isPrimary: '', hasAccount: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [selectedCountryIso, setSelectedCountryIso] = useState('');
  const [selectedStateIso, setSelectedStateIso] = useState('');

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', mobile: '', account: '', title: '', department: '',
    isPrimary: false, doNotCall: false, emailOptOut: false, mailingStreet: '', mailingCity: '', mailingState: '',
    mailingCountry: '', mailingZipCode: '', description: ''
  });

  const [fieldDefinitions, setFieldDefinitions] = useState(
    () => DEFAULT_CONTACT_FIELDS.filter(f => !getContDisabled().includes(f.fieldName)).map(f => ({ ...f, isActive: true, _isStd: true })).sort((a, b) => a.displayOrder - b.displayOrder)
  );
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [stats, setStats] = useState({ total: 0, primary: 0, withAccount: 0, recent: 0 });

  // Manage Fields
  const [showManageFields, setShowManageFields] = useState(false);
  const [customFieldDefs, setCustomFieldDefs] = useState([]);
  const [disabledStdFields, setDisabledStdFieldsState] = useState(getContDisabled);
  const [togglingField, setTogglingField] = useState(null);


  // Split View Panel State
  const [detailPanelWidth, setDetailPanelWidth] = useState(42);
  const [detailExpanded, setDetailExpanded] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [selectedContactData, setSelectedContactData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailActiveTab, setDetailActiveTab] = useState('overview');

  // Detail Panel Data
  const [detailTasks, setDetailTasks] = useState([]);
  const [detailNotes, setDetailNotes] = useState([]);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState([]);

  // Detail Panel Forms
  const [showDetailEditForm, setShowDetailEditForm] = useState(false);
  const [showDetailDeleteConfirm, setShowDetailDeleteConfirm] = useState(false);
  const [showDetailTaskForm, setShowDetailTaskForm] = useState(false);
  const [showDetailNoteForm, setShowDetailNoteForm] = useState(false);

  // Detail Panel Form Data
  const [detailEditData, setDetailEditData] = useState({});
  const [detailTaskData, setDetailTaskData] = useState({ subject: '', dueDate: '', status: 'Not Started', priority: 'Normal', description: '' });
  const [detailNoteData, setDetailNoteData] = useState({ title: '', content: '' });


  useEffect(() => {
    loadContacts();
    loadAccounts();
    loadCustomFields();
  }, [pagination.page, filters.search, filters.account, filters.title, filters.isPrimary, filters.hasAccount]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await contactService.getContacts({ page: pagination.page, limit: pagination.limit, ...filters });
      if (response.success && response.data) {
        const contactsData = response.data.contacts || [];
        setContacts(contactsData);
        setPagination(prev => ({ ...prev, total: response.data.pagination?.total || 0, pages: response.data.pagination?.pages || 0 }));
        const primary = contactsData.filter(c => c.isPrimary).length;
        const withAccount = contactsData.filter(c => c.account).length;
        setStats({ total: response.data.pagination?.total || 0, primary, withAccount, recent: contactsData.length });
      }
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError(err.response?.data?.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await accountService.getAccounts({ limit: 100 });
      if (response.success && response.data) setAccounts(response.data.accounts || []);
    } catch (err) { console.error('Load accounts error:', err); }
  };

  const buildContFields = (disabled, customs) => [
    ...DEFAULT_CONTACT_FIELDS.filter(f => !disabled.includes(f.fieldName)).map(f => ({ ...f, isActive: true, _isStd: true })),
    ...customs.filter(f => f.isActive && f.showInCreate),
  ].sort((a, b) => a.displayOrder - b.displayOrder);

  const allFieldDefs = [
    ...DEFAULT_CONTACT_FIELDS.map(f => ({ ...f, isActive: !disabledStdFields.includes(f.fieldName), _isStd: true })),
    ...customFieldDefs,
  ].sort((a, b) => a.displayOrder - b.displayOrder);

  const loadCustomFields = async () => {
    try {
      const response = await fieldDefinitionService.getFieldDefinitions('Contact', true);
      const customs = (Array.isArray(response) ? response : []).filter(f => !f.isStandardField);
      setCustomFieldDefs(customs);
      setFieldDefinitions(buildContFields(disabledStdFields, customs));
    } catch (err) { console.error('Load field definitions error:', err); }
  };

  const handleToggleField = async (field) => {
    setTogglingField(field.fieldName);
    if (field._isStd) {
      const newDisabled = disabledStdFields.includes(field.fieldName)
        ? disabledStdFields.filter(n => n !== field.fieldName)
        : [...disabledStdFields, field.fieldName];
      localStorage.setItem(CONT_DISABLED_KEY, JSON.stringify(newDisabled));
      setDisabledStdFieldsState(newDisabled);
      setFieldDefinitions(buildContFields(newDisabled, customFieldDefs));
    } else {
      try {
        await fieldDefinitionService.toggleFieldStatus(field._id, !field.isActive);
        const updated = customFieldDefs.map(f => f._id === field._id ? { ...f, isActive: !f.isActive } : f);
        setCustomFieldDefs(updated);
        setFieldDefinitions(buildContFields(disabledStdFields, updated));
      } catch (err) { console.error('Toggle error:', err); }
    }
    setTogglingField(null);
  };

  const handleAddCustomField = async (fieldData) => {
    const created = await fieldDefinitionService.createFieldDefinition({ entityType: 'Contact', isStandardField: false, showInCreate: true, showInEdit: true, showInDetail: true, ...fieldData });
    const updated = [...customFieldDefs, { ...created, isActive: true }].sort((a, b) => a.displayOrder - b.displayOrder);
    setCustomFieldDefs(updated);
    setFieldDefinitions(buildContFields(disabledStdFields, updated));
  };

  const handleDeleteCustomField = async (field) => {
    try {
      await fieldDefinitionService.permanentDeleteFieldDefinition(field._id);
      const updated = customFieldDefs.filter(f => f._id !== field._id);
      setCustomFieldDefs(updated);
      setFieldDefinitions(buildContFields(disabledStdFields, updated));
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
    if (field.fieldName === 'mailingCountry') {
      return (
        <LocCountrySelect
          value={fieldValues['mailingCountry'] || ''}
          onChange={(c) => { handleFieldChange('mailingCountry', c.name); setSelectedCountryIso(c.isoCode); handleFieldChange('mailingState', ''); handleFieldChange('mailingCity', ''); setSelectedStateIso(''); }}
        />
      );
    }
    if (field.fieldName === 'mailingState') {
      return (
        <LocStateSelect
          value={fieldValues['mailingState'] || ''}
          countryIso={selectedCountryIso}
          onChange={(name, iso) => { handleFieldChange('mailingState', name); setSelectedStateIso(iso); handleFieldChange('mailingCity', ''); }}
        />
      );
    }
    if (field.fieldName === 'mailingCity') {
      return (
        <LocCitySelect
          value={fieldValues['mailingCity'] || ''}
          countryIso={selectedCountryIso}
          stateIso={selectedStateIso}
          onChange={(name) => handleFieldChange('mailingCity', name)}
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

  const handleCreateContact = async (e) => {
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
      const contactData = { ...formData, ...standardFields, customFields: Object.keys(customFields).length > 0 ? customFields : undefined };
      await contactService.createContact(contactData);
      setSuccess('Contact created successfully!');
      setShowCreateForm(false);
      setWizardStep(0);
      resetForm();
      loadContacts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.response?.data?.message || 'Failed to create contact'); }
    finally { setCreating(false); }
  };

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', phone: '', mobile: '', account: '', title: '', department: '', isPrimary: false, doNotCall: false, emailOptOut: false, mailingStreet: '', mailingCity: '', mailingState: '', mailingCountry: '', mailingZipCode: '', description: '' });
    setFieldValues({});
    setFieldErrors({});
    setSelectedCountryIso('');
    setSelectedStateIso('');
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatsFilter = (filterType) => {
    if (filterType === 'all') {
      setFilters(prev => ({ ...prev, isPrimary: '', hasAccount: '' }));
    } else if (filterType === 'primary') {
      setFilters(prev => ({ ...prev, isPrimary: 'true', hasAccount: '' }));
    } else if (filterType === 'withAccount') {
      setFilters(prev => ({ ...prev, isPrimary: '', hasAccount: 'true' }));
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // === Split View Functions ===
  const loadContactDetails = async (contactId) => {
    setSelectedContactId(contactId);
    setLoadingDetail(true);
    setDetailActiveTab('overview');
    closeDetailForms();

    try {
      const response = await contactService.getContact(contactId);
      if (response?.success) {
        setSelectedContactData(response.data);
        loadDetailTasks(contactId);
        loadDetailNotes(contactId);
        loadDetailCustomFields();
      }
    } catch (err) { console.error('Error loading contact details:', err); }
    finally { setLoadingDetail(false); }
  };

  const handleContactClick = (contactId) => {
    if (selectedContactId === contactId) return;
    loadContactDetails(contactId);
  };

  const loadDetailTasks = async (contactId) => {
    try {
      const response = await taskService.getTasks({ relatedTo: 'Contact', relatedToId: contactId, limit: 100 });
      if (response?.success) setDetailTasks(response.data.tasks || []);
    } catch (err) { console.error('Load tasks error:', err); }
  };

  const loadDetailNotes = async (contactId) => {
    try {
      const response = await noteService.getNotes({ relatedTo: 'Contact', relatedToId: contactId, limit: 100 });
      if (response?.success) setDetailNotes(response.data?.notes || []);
    } catch (err) { console.error('Load notes error:', err); }
  };

  const loadDetailCustomFields = async () => {
    try {
      const response = await fieldDefinitionService.getFieldDefinitions('Contact', false);
      if (response && Array.isArray(response)) {
        const activeFields = response.filter(field => field.isActive && field.showInDetail).sort((a, b) => a.displayOrder - b.displayOrder);
        setCustomFieldDefinitions(activeFields);
      }
    } catch (err) { console.error('Load custom fields error:', err); }
  };

  const closeDetailForms = () => {
    setShowDetailEditForm(false);
    setShowDetailDeleteConfirm(false);
    setShowDetailTaskForm(false);
    setShowDetailNoteForm(false);
  };

  const handleDividerDrag = (e) => {
    e.preventDefault();
    const container = document.getElementById('contacts-split-container');
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
    setSelectedContactId(null);
    setSelectedContactData(null);
    setDetailTasks([]);
    setDetailNotes([]);
    closeDetailForms();
  };

  // Detail Panel Handlers
  const handleDetailCreateTask = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await taskService.createTask({ ...detailTaskData, relatedTo: 'Contact', relatedToId: selectedContactId });
      setSuccess('Task created successfully!');
      setShowDetailTaskForm(false);
      setDetailTaskData({ subject: '', dueDate: '', status: 'Not Started', priority: 'Normal', description: '' });
      loadDetailTasks(selectedContactId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.message || 'Failed to create task'); }
  };

  const handleDetailCreateNote = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await noteService.createNote({ ...detailNoteData, relatedTo: 'Contact', relatedToId: selectedContactId });
      setSuccess('Note created successfully!');
      setShowDetailNoteForm(false);
      setDetailNoteData({ title: '', content: '' });
      loadDetailNotes(selectedContactId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.message || 'Failed to create note'); }
  };

  const openDetailEditForm = () => {
    if (!selectedContactData) return;
    setDetailEditData({
      firstName: selectedContactData.firstName || '',
      lastName: selectedContactData.lastName || '',
      email: selectedContactData.email || '',
      phone: selectedContactData.phone || '',
      mobile: selectedContactData.mobile || '',
      title: selectedContactData.title || '',
      department: selectedContactData.department || '',
      description: selectedContactData.description || ''
    });
    closeDetailForms();
    setShowDetailEditForm(true);
  };

  const handleDetailUpdateContact = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await contactService.updateContact(selectedContactId, detailEditData);
      setSuccess('Contact updated successfully!');
      setShowDetailEditForm(false);
      const response = await contactService.getContact(selectedContactId);
      if (response?.success) setSelectedContactData(response.data);
      loadContacts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.message || 'Failed to update contact'); }
  };

  const handleDetailEditChange = (e) => {
    const { name, value } = e.target;
    setDetailEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailDeleteContact = async () => {
    try {
      setError('');
      await contactService.deleteContact(selectedContactId);
      setSuccess('Contact deleted successfully!');
      closeSidePanel();
      loadContacts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.message || 'Failed to delete contact'); }
  };

  const canCreateContact = hasPermission('contact_management', 'create');
  const canUpdateContact = hasPermission('contact_management', 'update');
  const canDeleteContact = hasPermission('contact_management', 'delete');

  return (
    <DashboardLayout title="Contacts">

      {success && <div style={{ padding: '16px 20px', background: '#DCFCE7', color: '#166534', borderRadius: '12px', marginBottom: '24px', border: '2px solid #86EFAC', fontWeight: '600' }}>{success}</div>}
      {error && <div style={{ padding: '16px 20px', background: '#FEE2E2', color: '#991B1B', borderRadius: '12px', marginBottom: '24px', border: '2px solid #FCA5A5', fontWeight: '600' }}>{error}</div>}

      {/* ── WIZARD OVERLAY ── */}

      {/* Stats - Fixed outside split container */}
      <div className="stats-grid">
            <div
              className="stat-card"
              onClick={() => handleStatsFilter('all')}
              style={{
                cursor: 'pointer',
                border: filters.isPrimary === '' && filters.hasAccount === '' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
                background: filters.isPrimary === '' && filters.hasAccount === '' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
                boxShadow: filters.isPrimary === '' && filters.hasAccount === '' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div className="stat-label">Total Contacts</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div
              className="stat-card"
              onClick={() => handleStatsFilter('primary')}
              style={{
                cursor: 'pointer',
                border: filters.isPrimary === 'true' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
                background: filters.isPrimary === 'true' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
                boxShadow: filters.isPrimary === 'true' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div className="stat-label">Primary Contacts</div>
              <div className="stat-value">{stats.primary}</div>
            </div>
            <div
              className="stat-card"
              onClick={() => handleStatsFilter('withAccount')}
              style={{
                cursor: 'pointer',
                border: filters.hasAccount === 'true' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
                background: filters.hasAccount === 'true' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
                boxShadow: filters.hasAccount === 'true' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div className="stat-label">With Account</div>
              <div className="stat-value">{stats.withAccount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">This Page</div>
              <div className="stat-value">{stats.recent}</div>
            </div>
          </div>

      {/* Split Container */}
      <div id="contacts-split-container" style={{ display: 'flex', height: 'calc(100vh - 280px)', overflow: 'hidden', position: 'relative' }}>

        {/* LEFT: Detail Panel */}
        {/* ── LEFT: Create Form (inline) ── */}
        {showCreateForm && (
          <div style={{ flex: `0 0 ${detailPanelWidth}%`, background: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3c72 100%)', flexShrink: 0 }}>
              <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>👤</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>New Contact</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>Step {wizardStep + 1} of {CONTACT_WIZARD_STEPS.length}</div>
                  </div>
                </div>
                <button onClick={() => { setShowCreateForm(false); resetForm(); setWizardStep(0); }}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '7px', padding: '5px 9px', color: 'white', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ display: 'flex', padding: '8px 10px 0' }}>
                {CONTACT_WIZARD_STEPS.map((step, idx) => {
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
                <div style={{ height: '100%', background: 'linear-gradient(90deg,#3b82f6,#6366f1)', borderRadius: '99px', width: `${(wizardStep / CONTACT_WIZARD_STEPS.length) * 100}%`, transition: 'width 0.35s ease' }} />
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
                <div style={{ marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                  <h4 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{CONTACT_WIZARD_STEPS[wizardStep]?.icon} {CONTACT_WIZARD_STEPS[wizardStep]?.label}</h4>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{CONTACT_WIZARD_STEPS[wizardStep]?.desc}</p>
                </div>
                {(() => {
                  const step = CONTACT_WIZARD_STEPS[wizardStep];
                  const grouped = groupFieldsBySection(fieldDefinitions);
                  return (
                    <div>
                      {step.includeAccount && (
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>🏢 Account</label>
                          <select name="account" className="crm-form-select" style={{ padding: '9px 12px', fontSize: '13px', width: '100%', borderRadius: '8px' }} value={formData.account} onChange={handleChange}>
                            <option value="">— Select Account —</option>
                            {accounts.map(a => <option key={a._id} value={a._id}>{a.accountName}</option>)}
                          </select>
                        </div>
                      )}
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
                  {CONTACT_WIZARD_STEPS.map((_, idx) => (
                    <div key={idx} style={{ width: idx === wizardStep ? '16px' : '5px', height: '5px', borderRadius: '99px', background: idx < wizardStep ? '#10b981' : idx === wizardStep ? '#3b82f6' : '#e2e8f0', transition: 'all 0.25s' }} />
                  ))}
                </div>
                {wizardStep < CONTACT_WIZARD_STEPS.length - 1 ? (
                  <button type="button" onClick={() => setWizardStep(s => s + 1)}
                    style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#1e3c72 0%,#3b82f6 100%)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(30,60,114,0.25)' }}>
                    Next →
                  </button>
                ) : (
                  <button type="button" onClick={handleCreateContact} disabled={creating}
                    style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: creating ? '#94a3b8' : 'linear-gradient(135deg,#059669 0%,#10b981 100%)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: creating ? 'not-allowed' : 'pointer', boxShadow: creating ? 'none' : '0 2px 8px rgba(16,185,129,0.25)' }}>
                    {creating ? 'Saving...' : '✓ Save Contact'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedContactId && !showCreateForm && (
          <div style={detailExpanded ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' } : { flex: `0 0 ${detailPanelWidth}%`, background: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {/* Panel Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h3 style={{ margin: 0, color: '#1e3c72', fontSize: '15px', fontWeight: '600' }}>Contact Details</h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setDetailExpanded(v => !v)} style={{ background: 'rgba(30,60,114,0.08)', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', color: '#1e3c72' }}>{detailExpanded ? '↙ Collapse' : '↗ Expand'}</button>
                <button onClick={closeSidePanel} style={{ background: 'rgba(30,60,114,0.1)', border: 'none', borderRadius: '6px', padding: '4px', color: '#1e3c72', cursor: 'pointer' }}><X className="h-5 w-5" /></button>
              </div>
            </div>
            {/* Panel Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingDetail ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}><div className="spinner"></div></div>
              ) : selectedContactData ? (
                <div>
                  {/* Contact Header */}
                  <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3c72', fontSize: '20px', fontWeight: 'bold' }}>
                        {selectedContactData.firstName?.charAt(0) || ''}{selectedContactData.lastName?.charAt(0) || ''}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0', color: '#1e3c72' }}>{selectedContactData.firstName} {selectedContactData.lastName}</h2>
                        <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>{selectedContactData.title || 'No title'} {selectedContactData.account && `at ${selectedContactData.account.accountName}`}</p>
                        {selectedContactData.isPrimary && <span style={{ display: 'inline-block', marginTop: '6px', padding: '2px 8px', background: '#DCFCE7', color: '#166534', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>Primary Contact</span>}
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {canUpdateContact && <button className="crm-btn crm-btn-primary crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={openDetailEditForm}><Edit className="h-3 w-3 mr-1" />Edit</button>}
                      {canDeleteContact && <button className="crm-btn crm-btn-danger crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => { closeDetailForms(); setShowDetailDeleteConfirm(true); }}>Delete</button>}
                      {selectedContactData.phone && <button className="crm-btn crm-btn-outline crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => window.location.href = `tel:${selectedContactData.phone}`}><Phone className="h-3 w-3 mr-1" />Call</button>}
                    </div>
                  </div>

                  {/* Inline Edit Form */}
                  {showDetailEditForm && (
                    <div style={{ margin: '12px', padding: '12px', background: '#F0F9FF', borderRadius: '8px', border: '1px solid #93C5FD' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1E40AF' }}>Edit Contact</h5>
                        <button onClick={() => setShowDetailEditForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b' }}>✕</button>
                      </div>
                      <form onSubmit={handleDetailUpdateContact}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Customer Name *</label><input type="text" name="firstName" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.firstName || ''} onChange={handleDetailEditChange} required /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Last Name</label><input type="text" name="lastName" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.lastName || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Email</label><input type="email" name="email" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.email || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Phone</label><input type="tel" name="phone" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.phone || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Title</label><input type="text" name="title" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.title || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Department</label><input type="text" name="department" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.department || ''} onChange={handleDetailEditChange} /></div>
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
                      <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#991B1B' }}>Delete <strong>{selectedContactData.firstName} {selectedContactData.lastName}</strong>?</p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button className="crm-btn crm-btn-secondary crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => setShowDetailDeleteConfirm(false)}>Cancel</button>
                        <button className="crm-btn crm-btn-danger crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={handleDetailDeleteContact}>Delete</button>
                      </div>
                    </div>
                  )}

                  {/* Tabs */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <button onClick={() => setDetailActiveTab('overview')} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '600', border: 'none', background: detailActiveTab === 'overview' ? 'white' : 'transparent', borderBottom: detailActiveTab === 'overview' ? '2px solid #1e3c72' : '2px solid transparent', color: detailActiveTab === 'overview' ? '#1e3c72' : '#64748b', cursor: 'pointer' }}>Overview</button>
                    <button onClick={() => setDetailActiveTab('activities')} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '600', border: 'none', background: detailActiveTab === 'activities' ? 'white' : 'transparent', borderBottom: detailActiveTab === 'activities' ? '2px solid #1e3c72' : '2px solid transparent', color: detailActiveTab === 'activities' ? '#1e3c72' : '#64748b', cursor: 'pointer' }}>Tasks ({detailTasks.length})</button>
                    <button onClick={() => setDetailActiveTab('notes')} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '600', border: 'none', background: detailActiveTab === 'notes' ? 'white' : 'transparent', borderBottom: detailActiveTab === 'notes' ? '2px solid #1e3c72' : '2px solid transparent', color: detailActiveTab === 'notes' ? '#1e3c72' : '#64748b', cursor: 'pointer' }}>Notes ({detailNotes.length})</button>
                  </div>

                  {/* Tab Content */}
                  <div style={{ padding: '16px' }}>
                    {detailActiveTab === 'overview' && (
                      <div>
                        {/* Account Link */}
                        {selectedContactData.account && (
                          <div style={{ marginBottom: '12px', padding: '10px', background: '#F0F9FF', borderRadius: '8px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Building2 className="h-4 w-4" style={{ color: '#1E40AF' }} />
                            <div>
                              <p style={{ fontSize: '9px', color: '#1E40AF', margin: 0, fontWeight: '600', textTransform: 'uppercase' }}>Account</p>
                              <p style={{ fontSize: '13px', fontWeight: '600', margin: 0, color: '#1e3c72' }}>{selectedContactData.account.accountName}</p>
                            </div>
                          </div>
                        )}
                        {(() => {
                          const SYSTEM_KEYS = new Set(['_id', '__v', 'tenant', 'createdBy', 'lastModifiedBy', 'updatedAt', 'createdAt', 'isActive', 'emailOptOut', 'doNotCall', 'customFields', 'account', 'relatedData', 'isPrimary']);
                          const fmtKey = (fn) => fn.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
                          const fieldMap = {};
                          DEFAULT_CONTACT_FIELDS.forEach(f => { fieldMap[f.fieldName] = { label: f.label, section: f.section, fieldType: f.fieldType }; });
                          customFieldDefs.forEach(f => { fieldMap[f.fieldName] = { label: f.label, section: f.section, fieldType: f.fieldType }; });
                          const grouped = {};
                          Object.keys(selectedContactData).forEach(key => {
                            if (SYSTEM_KEYS.has(key)) return;
                            const val = selectedContactData[key];
                            if (val === null || val === undefined || val === '') return;
                            if (typeof val === 'object' && !Array.isArray(val)) return;
                            const def = fieldMap[key];
                            const section = def?.section || 'Additional Information';
                            if (!grouped[section]) grouped[section] = [];
                            grouped[section].push({ key, label: def?.label || fmtKey(key), fieldType: def?.fieldType || 'text', value: val });
                          });
                          if (selectedContactData.customFields && typeof selectedContactData.customFields === 'object') {
                            Object.keys(selectedContactData.customFields).forEach(key => {
                              const val = selectedContactData.customFields[key];
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
                          const sectionOrder = ['Basic Information', 'Professional Information', 'Mailing Address', 'Additional Information', ...Object.keys(grouped).filter(s => !['Basic Information', 'Professional Information', 'Mailing Address', 'Additional Information'].includes(s))];
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
                                    const isPhone = fieldType === 'phone' || key === 'phone' || key === 'mobile';
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
                        {/* Related Deals/Opportunities */}
                        {selectedContactData.relatedData?.opportunities && (
                          <div style={{ marginTop: '16px' }}>
                            <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Deals ({selectedContactData.relatedData.opportunities.total || 0})</h4>
                            {selectedContactData.relatedData.opportunities.data?.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {selectedContactData.relatedData.opportunities.data.map(opp => (
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
                        )}
                      </div>
                    )}

                    {detailActiveTab === 'activities' && (
                      <div>
                        <button className="crm-btn crm-btn-sm crm-btn-primary" style={{ fontSize: '11px', padding: '4px 10px', marginBottom: '12px' }} onClick={() => { closeDetailForms(); setShowDetailTaskForm(true); }}>+ Add Task</button>
                        {showDetailTaskForm && (
                          <div style={{ marginBottom: '12px', padding: '10px', background: '#F0FDF4', borderRadius: '6px', border: '1px solid #86EFAC' }}>
                            <form onSubmit={handleDetailCreateTask}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                                <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: '10px', fontWeight: '600' }}>Subject *</label><input type="text" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailTaskData.subject} onChange={(e) => setDetailTaskData({ ...detailTaskData, subject: e.target.value })} required /></div>
                                <div><label style={{ fontSize: '10px', fontWeight: '600' }}>Due Date *</label><input type="date" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailTaskData.dueDate} onChange={(e) => setDetailTaskData({ ...detailTaskData, dueDate: e.target.value })} required /></div>
                                <div><label style={{ fontSize: '10px', fontWeight: '600' }}>Priority</label><select className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailTaskData.priority} onChange={(e) => setDetailTaskData({ ...detailTaskData, priority: e.target.value })}><option value="High">High</option><option value="Normal">Normal</option><option value="Low">Low</option></select></div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={() => setShowDetailTaskForm(false)}>Cancel</button>
                                <button type="submit" className="crm-btn crm-btn-success crm-btn-sm" style={{ fontSize: '10px', padding: '3px 8px' }}>Create</button>
                              </div>
                            </form>
                          </div>
                        )}
                        {detailTasks.length === 0 ? (
                          <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '20px', background: '#f9fafb', borderRadius: '6px' }}>No tasks found</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {detailTasks.map(task => (
                              <div key={task._id} style={{ padding: '10px', background: task.status === 'Completed' ? '#f9fafb' : '#F0FDF4', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                  <CheckCircle2 className={`h-3 w-3 ${task.status === 'Completed' ? 'text-gray-400' : 'text-green-600'}`} />
                                  <span style={{ fontSize: '10px', background: task.priority === 'High' ? '#FEE2E2' : '#E0E7FF', color: task.priority === 'High' ? '#991B1B' : '#3730A3', padding: '1px 6px', borderRadius: '4px' }}>{task.priority}</span>
                                  {task.status === 'Completed' && <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '4px' }}>Done</span>}
                                </div>
                                <p style={{ fontSize: '12px', fontWeight: '600', margin: '0 0 4px 0' }}>{task.subject}</p>
                                <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {detailActiveTab === 'notes' && (
                      <div>
                        <button className="crm-btn crm-btn-sm crm-btn-primary" style={{ fontSize: '11px', padding: '4px 10px', marginBottom: '12px' }} onClick={() => { closeDetailForms(); setShowDetailNoteForm(true); }}>+ Add Note</button>
                        {showDetailNoteForm && (
                          <div style={{ marginBottom: '12px', padding: '10px', background: '#FDF4FF', borderRadius: '6px', border: '1px solid #E879F9' }}>
                            <form onSubmit={handleDetailCreateNote}>
                              <div style={{ marginBottom: '8px' }}><label style={{ fontSize: '10px', fontWeight: '600' }}>Title *</label><input type="text" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailNoteData.title} onChange={(e) => setDetailNoteData({ ...detailNoteData, title: e.target.value })} required /></div>
                              <div style={{ marginBottom: '8px' }}><label style={{ fontSize: '10px', fontWeight: '600' }}>Content *</label><textarea className="crm-form-textarea" rows="3" style={{ width: '100%', padding: '4px 6px', fontSize: '11px' }} value={detailNoteData.content} onChange={(e) => setDetailNoteData({ ...detailNoteData, content: e.target.value })} required /></div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={() => setShowDetailNoteForm(false)}>Cancel</button>
                                <button type="submit" className="crm-btn crm-btn-primary crm-btn-sm" style={{ fontSize: '10px', padding: '3px 8px', background: '#A855F7' }}>Add Note</button>
                              </div>
                            </form>
                          </div>
                        )}
                        {detailNotes.length === 0 ? (
                          <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '20px', background: '#f9fafb', borderRadius: '6px' }}>No notes found</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {detailNotes.map(note => (
                              <div key={note._id} style={{ padding: '12px', background: '#FDF4FF', borderRadius: '8px', border: '1px solid #F5D0FE' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}><FileText className="h-4 w-4 text-purple-600" /><span style={{ fontSize: '13px', fontWeight: '600', color: '#86198F' }}>{note.title}</span></div>
                                <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.5', margin: '0 0 8px 0' }}>{note.content}</p>
                                <p style={{ fontSize: '10px', color: '#9CA3AF', margin: 0 }}>{new Date(note.createdAt).toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Failed to load contact details</div>
              )}
            </div>
          </div>
        )}

        {/* Drag Divider */}
        {(selectedContactId || showCreateForm) && !detailExpanded && (
          <div onMouseDown={handleDividerDrag} style={{ width: '6px', cursor: 'col-resize', background: 'transparent', flexShrink: 0, position: 'relative', zIndex: 1, userSelect: 'none' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '4px', height: '40px', borderRadius: '2px', background: '#cbd5e1' }} />
          </div>
        )}

        {/* RIGHT: Filters + List */}
        <div style={{ flex: (selectedContactId || showCreateForm) && !detailExpanded ? `0 0 ${100 - detailPanelWidth}%` : '1 1 100%', minWidth: 0, overflow: 'auto', padding: '0 0 20px 0' }}>
          {/* Filters */}
          <div className="crm-card" style={{ marginBottom: '24px' }}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <input type="text" name="search" placeholder="Search contacts..." className="crm-form-input" value={filters.search} onChange={handleFilterChange} />
                <select name="account" className="crm-form-select" value={filters.account} onChange={handleFilterChange}>
                  <option value="">All Accounts</option>
                  {accounts.map(account => <option key={account._id} value={account._id}>{account.accountName}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                {hasPermission('field_management', 'read') && (
                  <button onClick={() => { closeAllForms(); setShowManageFields(v => !v); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                    <Settings style={{ width: '14px', height: '14px' }} /> Manage Fields
                  </button>
                )}
                {canCreateContact && <button className="crm-btn crm-btn-primary" onClick={() => { closeAllForms(); setSelectedContactId(null); setSelectedContactData(null); setDetailExpanded(false); resetForm(); setShowCreateForm(true); }}>+ New Contact</button>}
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
              entityLabel="Contact"
              sections={CONTACT_SECTIONS}
            />
          )}

          {/* Contact List */}
          <div className="crm-card">
            <div className="crm-card-header">
              <h2 className="crm-card-title">{viewMode === 'grid' ? 'Contact Cards' : 'Contact List'} ({pagination.total})</h2>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
            ) : contacts.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e3c72' }}>No contacts found</p>
                {canCreateContact && <button className="crm-btn crm-btn-primary" onClick={() => { resetForm(); setShowCreateForm(true); }}>+ Create First Contact</button>}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {contacts.map((contact) => (
                      <div key={contact._id} onClick={() => handleContactClick(contact._id)}
                        style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', cursor: 'pointer', border: selectedContactId === contact._id ? '2px solid #1e3c72' : '2px solid #e5e7eb', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#1e3c72' }}>
                            {contact.firstName?.[0]}{contact.lastName?.[0]}
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e3c72' }}>{contact.firstName} {contact.lastName}</h3>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{contact.title || 'No title'}</p>
                          </div>
                        </div>
                        {contact.isPrimary && <span style={{ display: 'inline-block', padding: '2px 8px', background: '#DCFCE7', color: '#166534', borderRadius: '4px', fontSize: '10px', fontWeight: '600', marginBottom: '8px' }}>Primary</span>}
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          <div>{contact.email}</div>
                          {contact.account && <div style={{ marginTop: '4px' }}>{contact.account.accountName}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Name</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Account</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Email</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map((contact) => (
                          <tr key={contact._id} onClick={() => handleContactClick(contact._id)}
                            style={{ cursor: 'pointer', borderBottom: '1px solid #e5e7eb', background: selectedContactId === contact._id ? '#EFF6FF' : 'white' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#1e3c72' }}>
                                  {contact.firstName?.[0]}{contact.lastName?.[0]}
                                </div>
                                <div>
                                  <div style={{ fontWeight: '600', color: '#1e3c72', fontSize: '14px' }}>{contact.firstName} {contact.lastName}{contact.isPrimary && ' ⭐'}</div>
                                  <div style={{ fontSize: '12px', color: '#64748b' }}>{contact.title || '-'}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{contact.account?.accountName || '-'}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{contact.email || '-'}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>{contact.phone || contact.mobile || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

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

export default Contacts;
