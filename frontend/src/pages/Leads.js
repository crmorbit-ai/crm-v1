import React, { useState, useEffect, useCallback, useRef } from 'react';
import templateService from '../services/templateService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Country, State, City } from 'country-state-city';

import { leadService } from '../services/leadService';
import { accountService } from '../services/accountService';
import { taskService } from '../services/taskService';
import { noteService } from '../services/noteService';
import { productItemService } from '../services/productItemService';
import { productCategoryService } from '../services/productCategoryService';
import { verificationService, debounce } from '../services/verificationService';
import fieldDefinitionService from '../services/fieldDefinitionService';
import { groupService } from '../services/groupService';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';
import TooltipButton from '../components/common/TooltipButton';
import DynamicField from '../components/DynamicField';
import ManageFieldsPanel from '../components/ManageFieldsPanel';
import BulkUploadForm from '../components/BulkUploadForm';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Target,
  Plus,
  Upload,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  Globe,
  Users,
  Trash2,
  X,
  Building2,
  Briefcase,
  Calendar,
  Star,
  ArrowRight,
  Edit,
  ExternalLink,
  FileText,
  MessageSquare,
  PhoneCall,
  Clock,
  MapPin,
  Settings,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

// Standard lead fields — hardcoded, no seed needed
const DEFAULT_LEAD_FIELDS = [
  { fieldName: 'customerName', label: 'Customer Name', fieldType: 'text', section: 'Basic Information', isRequired: true, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 1 },
  { fieldName: 'customerType', label: 'Customer Type', fieldType: 'dropdown', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 2, options: [{ label: 'Customer', value: 'Customer' }, { label: 'Prospect', value: 'Prospect' }, { label: 'Partner', value: 'Partner' }, { label: 'Reseller', value: 'Reseller' }, { label: 'Other', value: 'Other' }] },
  { fieldName: 'email', label: 'Personal Email', fieldType: 'email', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 3 },
  { fieldName: 'companyEmail', label: 'Company Email', fieldType: 'email', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 3.5 },
  { fieldName: 'phone', label: 'Phone', fieldType: 'phone', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 4 },
  { fieldName: 'alternatePhone', label: 'Alternate Phone', fieldType: 'phone', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 5 },
  { fieldName: 'company', label: 'Company', fieldType: 'text', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 6 },
  { fieldName: 'jobTitle', label: 'Job Title', fieldType: 'text', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 7 },
  { fieldName: 'website', label: 'Website', fieldType: 'url', section: 'Basic Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 8 },
  { fieldName: 'leadStatus', label: 'Lead Status', fieldType: 'dropdown', section: 'Lead Details', isRequired: true, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 10, options: [{ label: 'New', value: 'New' }, { label: 'Contacted', value: 'Contacted' }, { label: 'Qualified', value: 'Qualified' }, { label: 'Unqualified', value: 'Unqualified' }, { label: 'Lost', value: 'Lost' }, { label: 'Converted', value: 'Converted' }] },
  { fieldName: 'leadSource', label: 'Lead Source', fieldType: 'dropdown', section: 'Lead Details', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 11, options: [{ label: 'Website', value: 'Website' }, { label: 'Social Media', value: 'Social Media' }, { label: 'Referral', value: 'Referral' }, { label: 'Campaign', value: 'Campaign' }, { label: 'Cold Call', value: 'Cold Call' }, { label: 'Other', value: 'Other' }] },
  { fieldName: 'leadType', label: 'Lead Type', fieldType: 'dropdown', section: 'Lead Details', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 12, options: [{ label: 'Inbound', value: 'Inbound' }, { label: 'Outbound', value: 'Outbound' }] },
  { fieldName: 'qualificationStatus', label: 'Qualification Status', fieldType: 'dropdown', section: 'Lead Details', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 13, options: [{ label: 'Unqualified', value: 'Unqualified' }, { label: 'In Progress', value: 'In Progress' }, { label: 'Qualified', value: 'Qualified' }] },
  { fieldName: 'priority', label: 'Priority', fieldType: 'dropdown', section: 'Lead Details', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 14, options: [{ label: 'Low', value: 'Low' }, { label: 'Medium', value: 'Medium' }, { label: 'High', value: 'High' }] },
  { fieldName: 'campaign', label: 'Campaign', fieldType: 'text', section: 'Lead Details', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 15 },
  { fieldName: 'estimatedDealValue', label: 'Estimated Deal Value', fieldType: 'currency', section: 'Lead Details', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 16 },
  { fieldName: 'expectedCloseDate', label: 'Expected Close Date', fieldType: 'date', section: 'Lead Details', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 17 },
  { fieldName: 'industry', label: 'Industry', fieldType: 'dropdown', section: 'Business Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 20, options: [{ label: 'Agriculture', value: 'Agriculture' }, { label: 'Automotive', value: 'Automotive' }, { label: 'Banking & Finance', value: 'Banking & Finance' }, { label: 'Construction', value: 'Construction' }, { label: 'Consulting', value: 'Consulting' }, { label: 'Education', value: 'Education' }, { label: 'Energy & Power', value: 'Energy & Power' }, { label: 'Food & Beverage', value: 'Food & Beverage' }, { label: 'Government', value: 'Government' }, { label: 'Healthcare', value: 'Healthcare' }, { label: 'Hospitality', value: 'Hospitality' }, { label: 'IT & Technology', value: 'IT & Technology' }, { label: 'Insurance', value: 'Insurance' }, { label: 'Logistics & Transport', value: 'Logistics & Transport' }, { label: 'Manufacturing', value: 'Manufacturing' }, { label: 'Media & Entertainment', value: 'Media & Entertainment' }, { label: 'Pharma & Life Sciences', value: 'Pharma & Life Sciences' }, { label: 'Real Estate', value: 'Real Estate' }, { label: 'Retail', value: 'Retail' }, { label: 'Telecom', value: 'Telecom' }, { label: 'Textile & Apparel', value: 'Textile & Apparel' }, { label: 'Other', value: 'Other' }] },
  { fieldName: 'region', label: 'Region', fieldType: 'text', section: 'Business Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 21 },
  { fieldName: 'numberOfEmployees', label: 'No. of Employees', fieldType: 'number', section: 'Business Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 22 },
  { fieldName: 'annualRevenue', label: 'Annual Revenue', fieldType: 'currency', section: 'Business Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 23 },
  { fieldName: 'country', label: 'Country', fieldType: 'dropdown', section: 'Address', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 30 },
  { fieldName: 'state', label: 'State', fieldType: 'dropdown', section: 'Address', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 31 },
  { fieldName: 'city', label: 'City', fieldType: 'dropdown', section: 'Address', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 32 },
  { fieldName: 'description', label: 'Description', fieldType: 'textarea', section: 'Requirements', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 1 },
  { fieldName: 'requirements', label: 'Requirements', fieldType: 'textarea', section: 'Requirements', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 2 },
  { fieldName: 'competitor', label: 'Competitor', fieldType: 'text', section: 'Additional Information', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 42 },
  // Social Media
  { fieldName: 'linkedIn', label: 'LinkedIn', fieldType: 'url', section: 'Social Media', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 50, placeholder: 'https://linkedin.com/in/username' },
  { fieldName: 'twitter', label: 'Twitter / X', fieldType: 'text', section: 'Social Media', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 51, placeholder: '@username' },
  { fieldName: 'facebook', label: 'Facebook', fieldType: 'url', section: 'Social Media', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 52, placeholder: 'https://facebook.com/username' },
  { fieldName: 'instagram', label: 'Instagram', fieldType: 'text', section: 'Social Media', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 53, placeholder: '@username' },
  { fieldName: 'whatsApp', label: 'WhatsApp', fieldType: 'phone', section: 'Social Media', isRequired: false, isStandardField: true, showInCreate: true, showInEdit: true, showInDetail: true, displayOrder: 54 },
];

const STD_DISABLED_KEY = 'crm_lead_std_disabled';
const getDisabledStdFields = () => { try { return JSON.parse(localStorage.getItem(STD_DISABLED_KEY) || '[]'); } catch { return []; } };
const setDisabledStdFields = (arr) => localStorage.setItem(STD_DISABLED_KEY, JSON.stringify(arr));
const LEAD_SECTIONS = ['Requirements', 'Lead Details', 'Basic Information', 'Business Information', 'Address', 'Additional Information', 'Social Media'];

const WIZARD_STEPS = [
  { label: 'Requirements', icon: '📝', desc: 'Describe what the lead needs', sections: ['Requirements'] },
  { label: 'Lead Details',  icon: '🎯', desc: 'Status, source & priority',   sections: ['Lead Details'] },
  { label: 'Basic Info',    icon: '👤', desc: 'Contact & company details',    sections: ['Basic Information'], includeOwner: true, includeCustomer: true },
  { label: 'Business',      icon: '🏢', desc: 'Industry & revenue info',      sections: ['Business Information'] },
  { label: 'Address',       icon: '📍', desc: 'Location details',             sections: ['Address'] },
  { label: 'Social Media',  icon: '🔗', desc: 'Online presence & handles',    sections: ['Social Media'] },
  { label: 'Additional',    icon: '📋', desc: 'Notes & product',             sections: ['Additional Information', 'Communication Preferences', 'Lead Classification'], includeProduct: true },
];

// --- Continent mapping for country grouping ---
const OCEANIA_CODES = new Set(['AU','FJ','KI','MH','FM','NR','NZ','PW','PG','WS','SB','TO','TV','VU','CK','NU','TK','WF','PF','NC','GU','MP','AS','UM','PN']);
const getContinent = (country) => {
  if (OCEANIA_CODES.has(country.isoCode)) return 'Oceania';
  const tz = (country.timezones && country.timezones[0] && country.timezones[0].zoneName) || '';
  const prefix = tz.split('/')[0];
  const map = { Africa:'Africa', America:'Americas', Asia:'Asia', Atlantic:'Europe', Europe:'Europe', Indian:'Asia', Pacific:'Oceania', Arctic:'Europe', Australia:'Oceania' };
  return map[prefix] || 'Other';
};
const CONTINENT_ORDER = ['Asia', 'Europe', 'Americas', 'Africa', 'Oceania', 'Other'];

// Build grouped countries once (module level for performance)
const ALL_COUNTRIES = Country.getAllCountries();
const GROUPED_COUNTRIES = (() => {
  const g = {};
  ALL_COUNTRIES.forEach(c => {
    const cont = getContinent(c);
    if (!g[cont]) g[cont] = [];
    g[cont].push(c);
  });
  return g;
})();

const CONTINENT_ICONS = { Asia:'🌏', Europe:'🌍', Americas:'🌎', Africa:'🌍', Oceania:'🌏', Other:'🌐' };

// Custom Country Dropdown — accordion style (continent → countries)
const CountryCascadeSelect = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const [expandedCont, setExpandedCont] = React.useState(null);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Auto-expand continent of selected country when opening
  React.useEffect(() => {
    if (open && value) {
      const cont = getContinent(ALL_COUNTRIES.find(c => c.name === value) || {});
      setExpandedCont(cont);
    }
    if (!open) setExpandedCont(null);
  }, [open, value]);

  const selectedCountry = ALL_COUNTRIES.find(c => c.name === value);

  const handleSelect = (country) => {
    onChange(country);
    setOpen(false);
  };

  const triggerStyle = {
    width: '100%', padding: '8px 10px', fontSize: '13px',
    border: '1px solid #e2e8f0', borderRadius: '6px',
    background: '#fff', textAlign: 'left', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '7px', outline: 'none',
    color: value ? '#1e293b' : '#94a3b8',
    boxSizing: 'border-box',
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ display:'block', fontSize:'11px', fontWeight:'700', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.4px', color:'#475569' }}>Country</label>

      {/* Trigger — same compact height as state/city selects */}
      <button type="button" onClick={() => setOpen(o => !o)} style={triggerStyle}>
        {selectedCountry
          ? <><span style={{ fontSize:'15px', lineHeight:1 }}>{selectedCountry.flag}</span><span style={{ flex:1, fontSize:'13px' }}>{selectedCountry.name}</span></>
          : <span style={{ flex:1 }}>-- Select Country --</span>
        }
        <span style={{ color:'#94a3b8', fontSize:'10px', marginLeft:'auto' }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:9999, background:'#fff', border:'1px solid #e2e8f0', borderRadius:'7px', boxShadow:'0 6px 20px rgba(0,0,0,0.13)', marginTop:'3px', overflow:'hidden', width:'100%' }}>
          <div style={{ maxHeight:'280px', overflowY:'auto' }}>
            {CONTINENT_ORDER.map(cont => {
              const countries = GROUPED_COUNTRIES[cont];
              if (!countries?.length) return null;
              const isExpanded = expandedCont === cont;
              return (
                <div key={cont}>
                  {/* Continent header row */}
                  <div
                    onMouseDown={(e) => { e.preventDefault(); setExpandedCont(isExpanded ? null : cont); }}
                    style={{ padding:'7px 10px', cursor:'pointer', display:'flex', alignItems:'center', gap:'7px', background: isExpanded ? '#eff6ff' : '#f8fafc', borderBottom:'1px solid #f1f5f9', userSelect:'none' }}
                  >
                    <span style={{ fontSize:'14px' }}>{CONTINENT_ICONS[cont]}</span>
                    <span style={{ flex:1, fontSize:'12px', fontWeight:'700', color: isExpanded ? '#1d4ed8' : '#374151', letterSpacing:'0.2px' }}>{cont}</span>
                    <span style={{ fontSize:'10px', color:'#94a3b8', marginRight:'2px' }}>{countries.length}</span>
                    <span style={{ fontSize:'10px', color: isExpanded ? '#3b82f6' : '#94a3b8' }}>{isExpanded ? '▼' : '▶'}</span>
                  </div>

                  {/* Countries under this continent */}
                  {isExpanded && countries.map(c => (
                    <div
                      key={c.isoCode}
                      onMouseDown={() => handleSelect(c)}
                      style={{ padding:'6px 10px 6px 28px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', background: value === c.name ? '#dbeafe' : '#fff', color: value === c.name ? '#1d4ed8' : '#1e293b', fontWeight: value === c.name ? '600' : '400', borderBottom:'1px solid #f8fafc' }}
                      onMouseEnter={e => { if (value !== c.name) e.currentTarget.style.background = '#f0f9ff'; }}
                      onMouseLeave={e => { if (value !== c.name) e.currentTarget.style.background = '#fff'; }}
                    >
                      <span style={{ fontSize:'14px', lineHeight:1 }}>{c.flag}</span>
                      <span>{c.name}</span>
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

// State custom dropdown — same style/size as country
const StateCascadeSelect = ({ value, countryIso, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const states = countryIso ? State.getStatesOfCountry(countryIso) : [];

  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const triggerStyle = {
    width:'100%', padding:'8px 10px', fontSize:'13px',
    border:'1px solid #e2e8f0', borderRadius:'6px',
    background: !countryIso ? '#f9fafb' : '#fff',
    textAlign:'left', cursor: !countryIso ? 'not-allowed' : 'pointer',
    display:'flex', alignItems:'center', gap:'7px', outline:'none',
    color: value ? '#1e293b' : '#94a3b8', boxSizing:'border-box',
  };

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
              <div
                key={s.isoCode}
                onMouseDown={() => { onChange(s.name, s.isoCode); setOpen(false); }}
                style={{ padding:'7px 12px', cursor:'pointer', display:'flex', alignItems:'center', fontSize:'12px', background: value === s.name ? '#dbeafe' : '#fff', color: value === s.name ? '#1d4ed8' : '#1e293b', fontWeight: value === s.name ? '600' : '400', borderBottom:'1px solid #f8fafc' }}
                onMouseEnter={e => { if (value !== s.name) e.currentTarget.style.background = '#f0f9ff'; }}
                onMouseLeave={e => { if (value !== s.name) e.currentTarget.style.background = '#fff'; }}
              >
                {s.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// City custom dropdown — same style/size as country
const CityCascadeSelect = ({ value, countryIso, stateIso, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const cities = (countryIso && stateIso) ? City.getCitiesOfState(countryIso, stateIso) : [];

  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const triggerStyle = {
    width:'100%', padding:'8px 10px', fontSize:'13px',
    border:'1px solid #e2e8f0', borderRadius:'6px',
    background: !stateIso ? '#f9fafb' : '#fff',
    textAlign:'left', cursor: !stateIso ? 'not-allowed' : 'pointer',
    display:'flex', alignItems:'center', gap:'7px', outline:'none',
    color: value ? '#1e293b' : '#94a3b8', boxSizing:'border-box',
  };

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
              <div
                key={idx}
                onMouseDown={() => { onChange(c.name); setOpen(false); }}
                style={{ padding:'7px 12px', cursor:'pointer', display:'flex', alignItems:'center', fontSize:'12px', background: value === c.name ? '#dbeafe' : '#fff', color: value === c.name ? '#1d4ed8' : '#1e293b', fontWeight: value === c.name ? '600' : '400', borderBottom:'1px solid #f8fafc' }}
                onMouseEnter={e => { if (value !== c.name) e.currentTarget.style.background = '#f0f9ff'; }}
                onMouseLeave={e => { if (value !== c.name) e.currentTarget.style.background = '#fff'; }}
              >
                {c.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Rich Text Editor for Description / Requirements ──────────────────────────
const RichTextEditor = ({ fieldName, value, onChange, label, isRequired, placeholder }) => {
  const editorRef = React.useRef(null);
  const isFocused = React.useRef(false);
  const [fmts, setFmts] = React.useState({ bold: false, italic: false, underline: false });

  // Per-field visual theme
  const theme = fieldName === 'requirements'
    ? { icon: '✅', iconBg: '#fef3c7', toolbarBg: '#fffbeb', border: '#fcd34d', activeBg: '#fde68a', activeColor: '#b45309', editorBg: '#fffdf7', labelColor: '#b45309', sepColor: '#fde68a' }
    : { icon: '📝', iconBg: '#dbeafe', toolbarBg: '#eff6ff', border: '#bfdbfe', activeBg: '#dbeafe', activeColor: '#1d4ed8', editorBg: '#fafcff', labelColor: '#1d4ed8', sepColor: '#bfdbfe' };

  React.useEffect(() => {
    if (editorRef.current && !isFocused.current) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (cmd) => {
    editorRef.current.focus();
    document.execCommand(cmd, false, null);
    setTimeout(refresh, 0);
    onChange(fieldName, editorRef.current.innerHTML);
  };

  const refresh = () => setFmts({
    bold: document.queryCommandState('bold'),
    italic: document.queryCommandState('italic'),
    underline: document.queryCommandState('underline'),
  });

  const tb = (active) => ({
    background: active ? theme.activeBg : 'transparent',
    border: 'none', borderRadius: '4px', padding: '3px 8px',
    cursor: 'pointer', fontSize: '13px', fontWeight: '700',
    color: active ? theme.activeColor : '#475569', lineHeight: '1.3',
    transition: 'all 0.15s', userSelect: 'none',
  });

  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px', color: theme.labelColor }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', background: theme.iconBg, fontSize: '10px' }}>{theme.icon}</span>
        {label}{isRequired && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
      </label>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '1px', padding: '4px 6px', background: theme.toolbarBg, border: `1.5px solid ${theme.border}`, borderBottom: `1px solid ${theme.sepColor}`, borderRadius: '8px 8px 0 0', alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" onMouseDown={e => { e.preventDefault(); exec('bold'); }} style={{ ...tb(fmts.bold), fontWeight: '900' }} title="Bold">B</button>
        <button type="button" onMouseDown={e => { e.preventDefault(); exec('italic'); }} style={{ ...tb(fmts.italic), fontStyle: 'italic' }} title="Italic">I</button>
        <button type="button" onMouseDown={e => { e.preventDefault(); exec('underline'); }} style={{ ...tb(fmts.underline), textDecoration: 'underline' }} title="Underline">U</button>
        <div style={{ width: '1px', height: '16px', background: theme.sepColor, margin: '0 4px' }} />
        <button type="button" onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }} style={tb(false)} title="Bullet List">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
        </button>
        <button type="button" onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }} style={tb(false)} title="Numbered List">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
        </button>
        <div style={{ width: '1px', height: '16px', background: theme.sepColor, margin: '0 4px' }} />
        <button type="button" onMouseDown={e => { e.preventDefault(); exec('removeFormat'); }} style={{ ...tb(false), fontSize: '11px', textDecoration: 'line-through', opacity: 0.7 }} title="Clear Formatting">Tx</button>
      </div>
      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => { isFocused.current = true; refresh(); }}
        onBlur={() => { isFocused.current = false; }}
        onInput={() => { onChange(fieldName, editorRef.current.innerHTML); refresh(); }}
        onKeyUp={refresh}
        onMouseUp={refresh}
        data-ph={placeholder}
        style={{ minHeight: '130px', padding: '10px 12px', border: `1.5px solid ${theme.border}`, borderTop: 'none', borderRadius: '0 0 8px 8px', fontSize: '13px', outline: 'none', lineHeight: '1.6', color: '#374151', background: theme.editorBg, overflowY: 'auto' }}
      />
    </div>
  );
};

const DEFAULT_COL_WIDTH = {
  customerName: 200, description: 220, customerType: 130, requirements: 200,
  email: 180, companyEmail: 180, phone: 140, alternatePhone: 140,
  company: 160, jobTitle: 150, website: 160, leadSource: 130, leadType: 120,
  qualificationStatus: 150, priority: 100, campaign: 140, estimatedDealValue: 160,
  expectedCloseDate: 150, industry: 140, region: 120, numberOfEmployees: 150,
  annualRevenue: 140, country: 120, state: 110, city: 110, competitor: 140,
  linkedIn: 150, twitter: 130, facebook: 140, instagram: 130, whatsApp: 130,
  leadStatus: 130,
};

const Leads = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, hasPermission } = useAuth();
  const [leads, setLeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState('table');

  const [emailVerification, setEmailVerification] = useState({ status: 'pending', message: '', isValid: null });
  const [phoneVerification, setPhoneVerification] = useState({ status: 'pending', message: '', isValid: null });

  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '', leadStatus: searchParams.get('status') || '', leadSource: '', rating: '', assignedGroup: '', unassigned: false });

  const [groups, setGroups] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showAssignGroupForm, setShowAssignGroupForm] = useState(false);
  const [selectedGroupForAssignment, setSelectedGroupForAssignment] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [displayColumns, setDisplayColumns] = useState([]);
  const [leadTemplates, setLeadTemplates] = useState([]);
  const [taskTemplates, setTaskTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Column resize
  const [colWidths, setColWidths] = useState({});
  const tableRef = useRef(null);

  const startResize = useCallback((e, colKey) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const th = e.currentTarget.closest('th');
    const startWidth = th.getBoundingClientRect().width;
    const colIndex = Array.from(th.parentElement.children).indexOf(th);

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const applyWidth = (w) => {
      if (!tableRef.current) return;
      // Update col
      const col = tableRef.current.querySelector(`col[data-col="${colKey}"]`);
      if (col) col.style.width = w + 'px';
      // Update th
      th.style.width = w + 'px';
      // Update every td in this column directly
      tableRef.current.querySelectorAll('tbody tr').forEach(row => {
        const td = row.children[colIndex];
        if (td) td.style.width = w + 'px';
      });
    };

    const onMouseMove = (e) => {
      applyWidth(Math.max(80, startWidth + (e.clientX - startX)));
    };

    const onMouseUp = (e) => {
      const finalWidth = Math.max(80, startWidth + (e.clientX - startX));
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // Clean up inline styles — React state will take over
      th.style.width = '';
      tableRef.current?.querySelectorAll('tbody tr').forEach(row => {
        const td = row.children[colIndex];
        if (td) td.style.width = '';
      });
      setColWidths(prev => ({ ...prev, [colKey]: finalWidth }));
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  const [stats, setStats] = useState({ total: 0, new: 0, qualified: 0, contacted: 0 });


  // Side Panel State
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [selectedLeadData, setSelectedLeadData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailActiveTab, setDetailActiveTab] = useState('overview');

  // Detail Panel - Related Data
  const [detailTasks, setDetailTasks] = useState([]);
  const [detailMeetings, setDetailMeetings] = useState([]);
  const [detailCalls, setDetailCalls] = useState([]);
  const [detailNotes, setDetailNotes] = useState([]);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState([]);

  // Detail Panel Forms
  const [showDetailEditForm, setShowDetailEditForm] = useState(false);
  const [showDetailDeleteConfirm, setShowDetailDeleteConfirm] = useState(false);
  const [showDetailConvertForm, setShowDetailConvertForm] = useState(false);
  const [showDetailTaskForm, setShowDetailTaskForm] = useState(false);
  const [showDetailMeetingForm, setShowDetailMeetingForm] = useState(false);
  const [showDetailCallForm, setShowDetailCallForm] = useState(false);
  const [showDetailNoteForm, setShowDetailNoteForm] = useState(false);

  // Detail Panel Form Data
  const [detailEditData, setDetailEditData] = useState({});
  const [detailTaskData, setDetailTaskData] = useState({ subject: '', dueDate: '', status: 'Not Started', priority: 'Normal', description: '' });
  const [detailMeetingData, setDetailMeetingData] = useState({ title: '', from: '', to: '', location: '', meetingType: 'Online', description: '' });
  const [detailCallData, setDetailCallData] = useState({ subject: '', callStartTime: '', callDuration: '', callType: 'Outbound', callPurpose: 'Follow-up', callResult: 'Completed', description: '' });
  const [detailNoteData, setDetailNoteData] = useState({ title: '', content: '' });
  const getDefaultCloseDate = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; };
  const [detailConversionData, setDetailConversionData] = useState({ createAccount: true, createContact: true, createOpportunity: false, accountName: '', opportunityName: '', opportunityAmount: '', closeDate: getDefaultCloseDate() });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);

  // Detail panel layout
  const [detailPanelWidth, setDetailPanelWidth] = useState(42); // % of container
  const [detailExpanded, setDetailExpanded] = useState(false);
  const [showBulkUploadForm, setShowBulkUploadForm] = useState(false);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [showCreateCategoryForm, setShowCreateCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  // Cascading country/state/city ISO codes for create form
  const [selectedCountryIso, setSelectedCountryIso] = useState('');
  const [selectedStateIso, setSelectedStateIso] = useState('');

  // Manage Fields Panel
  const [showManageFields, setShowManageFields] = useState(false);
  const [customFieldDefs, setCustomFieldDefs] = useState([]); // DB custom fields only
  const [disabledStdFields, setDisabledStdFieldsState] = useState(getDisabledStdFields);
  const [togglingField, setTogglingField] = useState(null);
  const [showAddFieldForm, setShowAddFieldForm] = useState(false);
  const [savingField, setSavingField] = useState(false);
  const [newFieldForm, setNewFieldForm] = useState({
    label: '', fieldType: 'text', section: 'Additional Information', isRequired: false, afterField: '__end__'
  });

  const [formData, setFormData] = useState({
    product: '',
    productDetails: { quantity: 1, requirements: '', estimatedBudget: '', priority: '', notes: '' }
  });

  const [productFormData, setProductFormData] = useState({
    name: '', articleNumber: '', category: '', price: '', stock: '', description: '', imageUrl: ''
  });

  useEffect(() => {
    loadLeads();
    loadProducts();
    loadCategories();
    loadCustomFields();
    loadGroups();
    loadCustomers();
    templateService.getTemplates('lead').then(r => setLeadTemplates(r?.data || [])).catch(() => {});
    templateService.getTemplates('task').then(r => setTaskTemplates(r?.data || [])).catch(() => {});
  }, [pagination.page, filters]);

  // Sync filter with URL params when navigating from another page
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && statusParam !== filters.leadStatus) {
      setFilters(prev => ({ ...prev, leadStatus: statusParam }));
    }
  }, [searchParams]);

  const loadProducts = async () => {
    try {
      const response = await productItemService.getAllProducts({ isActive: 'true' }, 1, 1000);
      if (response?.success && response.data) setProducts(response.data.products || []);
    } catch (err) { console.error('Load products error:', err); }
  };

  const loadCustomers = async () => {
    try {
      const response = await accountService.getAccounts({ accountType: 'Customer', isActive: 'true', limit: 1000, page: 1 });
      if (response?.success && response.data) setCustomers(response.data.accounts || []);
    } catch (err) { console.error('Load customers error:', err); }
  };

  const loadCategories = async () => {
    try {
      const response = await productCategoryService.getAllCategories({ isActive: 'true' }, 1, 100);
      if (response?.success && response.data) setCategories(response.data.categories || []);
    } catch (err) { console.error('Load categories error:', err); }
  };

  const loadGroups = async () => {
    if (!hasPermission('group_management', 'read')) return;
    try {
      const data = await groupService.getGroups();
      setGroups(Array.isArray(data) ? data : data?.groups || []);
    } catch (err) { console.error('Load groups error:', err); }
  };

  // Build the merged field list for the create form (enabled std + active custom)
  const buildFieldDefinitions = (disabled, customDefs) => {
    const stdFields = DEFAULT_LEAD_FIELDS
      .filter(f => !disabled.includes(f.fieldName))
      .map(f => ({ ...f, isActive: true, _isStd: true }));
    const custFields = customDefs.filter(f => f.isActive && f.showInCreate);
    return [...stdFields, ...custFields].sort((a, b) => a.displayOrder - b.displayOrder);
  };

  // All fields for Manage Fields panel (std with toggle state + all custom)
  const allFieldDefs = [
    ...DEFAULT_LEAD_FIELDS.map(f => ({ ...f, isActive: !disabledStdFields.includes(f.fieldName), _isStd: true })),
    ...customFieldDefs,
  ].sort((a, b) => a.displayOrder - b.displayOrder);

  const loadCustomFields = async () => {
    try {
      const response = await fieldDefinitionService.getFieldDefinitions('Lead', true);
      const customs = (Array.isArray(response) ? response : []).filter(f => !f.isStandardField);
      setCustomFieldDefs(customs);
      setFieldDefinitions(buildFieldDefinitions(disabledStdFields, customs));
    } catch (err) { console.error('Load field definitions error:', err); }
  };

  const handleToggleField = async (field) => {
    setTogglingField(field.fieldName);
    if (field._isStd) {
      // Standard field — toggle in localStorage only, no API call
      const newDisabled = disabledStdFields.includes(field.fieldName)
        ? disabledStdFields.filter(n => n !== field.fieldName)
        : [...disabledStdFields, field.fieldName];
      setDisabledStdFields(newDisabled);
      setDisabledStdFieldsState(newDisabled);
      setFieldDefinitions(buildFieldDefinitions(newDisabled, customFieldDefs));
    } else {
      // Custom DB field — call API
      try {
        await fieldDefinitionService.toggleFieldStatus(field._id, !field.isActive);
        const updated = customFieldDefs.map(f => f._id === field._id ? { ...f, isActive: !f.isActive } : f);
        setCustomFieldDefs(updated);
        setFieldDefinitions(buildFieldDefinitions(disabledStdFields, updated));
      } catch (err) { console.error('Toggle field error:', err); }
    }
    setTogglingField(null);
  };

  const handleAddCustomField = async (e) => {
    e.preventDefault();
    if (!newFieldForm.label.trim()) return;
    setSavingField(true);
    try {
      const fieldName = newFieldForm.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      // Calculate displayOrder based on "after which field"
      let displayOrder = 1000;
      if (newFieldForm.afterField && newFieldForm.afterField !== '__end__') {
        const afterF = allFieldDefs.find(f => (f._id || f.fieldName) === newFieldForm.afterField);
        if (afterF) displayOrder = afterF.displayOrder + 0.5;
      } else {
        // End of selected section: find max displayOrder in that section
        const sectionFields = allFieldDefs.filter(f => f.section === newFieldForm.section);
        displayOrder = sectionFields.length > 0 ? Math.max(...sectionFields.map(f => f.displayOrder)) + 1 : 1000;
      }
      const created = await fieldDefinitionService.createFieldDefinition({
        entityType: 'Lead',
        fieldName,
        label: newFieldForm.label.trim(),
        fieldType: newFieldForm.fieldType,
        section: newFieldForm.section,
        isRequired: newFieldForm.isRequired,
        isStandardField: false,
        showInCreate: true,
        showInEdit: true,
        showInDetail: true,
        displayOrder,
      });
      const newCustom = { ...created, isActive: true };
      const updated = [...customFieldDefs, newCustom].sort((a, b) => a.displayOrder - b.displayOrder);
      setCustomFieldDefs(updated);
      setFieldDefinitions(buildFieldDefinitions(disabledStdFields, updated));
      setNewFieldForm({ label: '', fieldType: 'text', section: 'Additional Information', isRequired: false, afterField: '__end__' });
      setShowAddFieldForm(false);
    } catch (err) { console.error('Create field error:', err); }
    setSavingField(false);
  };

  const handleAddCustomFieldFromPanel = async (fieldData) => {
    const created = await fieldDefinitionService.createFieldDefinition({
      entityType: 'Lead', isStandardField: false, showInCreate: true, showInEdit: true, showInDetail: true, ...fieldData,
    });
    const updated = [...customFieldDefs, { ...created, isActive: true }].sort((a, b) => a.displayOrder - b.displayOrder);
    setCustomFieldDefs(updated);
    setFieldDefinitions(buildFieldDefinitions(disabledStdFields, updated));
  };

  const handleDeleteCustomField = async (field) => {
    try {
      await fieldDefinitionService.permanentDeleteFieldDefinition(field._id);
      const updated = customFieldDefs.filter(f => f._id !== field._id);
      setCustomFieldDefs(updated);
      setFieldDefinitions(buildFieldDefinitions(disabledStdFields, updated));
    } catch (err) {
      console.error('Delete field error:', err);
      alert(err.message || 'Failed to delete field');
    }
  };

  const getMaskedValue = (fieldName, value) => value;

  // Derive displayColumns from allFieldDefs order whenever leads or field defs change
  useEffect(() => {
    const excludeSet = new Set([
      '_id', '__v', 'tenant', 'createdBy', 'lastModifiedBy', 'createdAt', 'updatedAt',
      'isActive', 'isConverted', 'convertedDate', 'convertedAccount', 'convertedContact',
      'convertedOpportunity', 'emailVerified', 'emailVerificationStatus', 'emailVerificationDetails',
      'phoneVerified', 'phoneVerificationStatus', 'phoneVerificationDetails',
      'emailOptOut', 'doNotCall', 'assignedGroup', 'assignedMembers', 'assignmentChain',
      'dataCenterCandidateId', 'product', 'productDetails', 'owner', 'customFields',
      'tags', 'leadNumber', 'source', 'rating', 'customer',
    ]);

    // Build ordered columns: standard fields (active) + custom fields (active), sorted by displayOrder
    const orderedFields = [
      ...DEFAULT_LEAD_FIELDS
        .filter(f => !disabledStdFields.includes(f.fieldName))
        .map(f => ({ ...f, _isStd: true })),
      ...customFieldDefs.filter(f => f.isActive),
    ].sort((a, b) => a.displayOrder - b.displayOrder);

    const orderedCols = orderedFields.map(f => f.fieldName);
    const orderedSet = new Set(orderedCols);

    // Also pick up any extra keys from actual lead data (e.g. from DataCenter import)
    const extraCols = [];
    leads.forEach(lead => {
      Object.keys(lead).forEach(key => {
        if (!excludeSet.has(key) && !orderedSet.has(key)) { orderedSet.add(key); extraCols.push(key); }
      });
      // Also expand nested customFields (for leads created before this fix)
      if (lead.customFields && typeof lead.customFields === 'object') {
        Object.keys(lead.customFields).forEach(key => {
          if (!orderedSet.has(key)) { orderedSet.add(key); extraCols.push(key); }
        });
      }
    });

    const finalCols = [...orderedCols, ...extraCols].filter(col => !excludeSet.has(col));
    // Move leadStatus to end
    const statusIdx = finalCols.indexOf('leadStatus');
    if (statusIdx > -1) { finalCols.splice(statusIdx, 1); finalCols.push('leadStatus'); }
    setDisplayColumns(finalCols);
  }, [leads, customFieldDefs, disabledStdFields]);

  const extractColumns = (leadsData) => {
    if (!leadsData?.length) return [];
    const allKeys = new Set();
    const excludeKeys = ['_id', '__v', 'tenant', 'createdBy', 'lastModifiedBy', 'createdAt', 'updatedAt', 'isActive', 'isConverted', 'convertedDate', 'convertedAccount', 'convertedContact', 'convertedOpportunity', 'emailVerified', 'emailVerificationStatus', 'emailVerificationDetails', 'phoneVerified', 'phoneVerificationStatus', 'phoneVerificationDetails', 'emailOptOut', 'doNotCall', 'assignedGroup', 'assignedMembers', 'assignmentChain', 'dataCenterCandidateId', 'product', 'productDetails', 'owner', 'customFields', 'tags', 'leadNumber', 'source', 'rating'];

    leadsData.forEach(lead => {
      Object.keys(lead).forEach(key => {
        if (!excludeKeys.includes(key) && lead[key] != null && lead[key] !== '') allKeys.add(key);
      });
      // Expand individual custom field keys so they show as normal columns
      if (lead.customFields && typeof lead.customFields === 'object') {
        Object.keys(lead.customFields).forEach(key => {
          if (lead.customFields[key] != null && lead.customFields[key] !== '') allKeys.add(key);
        });
      }
    });

    const columnsArray = Array.from(allKeys);
    const statusIndex = columnsArray.indexOf('leadStatus');
    if (statusIndex > -1) {
      columnsArray.splice(statusIndex, 1);
      columnsArray.push('leadStatus');
    }
    return columnsArray;
  };

  // Check top-level first, then fall back to customFields sub-object
  const getFieldValue = (lead, fieldName) => {
    if (lead[fieldName] !== undefined) return lead[fieldName] ?? null;
    if (lead.customFields && lead.customFields[fieldName] !== undefined) return lead.customFields[fieldName] ?? null;
    return null;
  };

  const formatFieldValue = (value) => {
    if (value == null || value === '') return '-';
    if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return '-';
    return value.toString();
  };

  // Use custom field label if available, otherwise convert camelCase
  const formatFieldName = (fieldName) => {
    const customDef = customFieldDefs.find(f => f.fieldName === fieldName);
    if (customDef) return customDef.label;
    return fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
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
    if (fieldName === 'email') debouncedEmailVerify(value);
    else if (fieldName === 'phone') debouncedPhoneVerify(value);
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await leadService.getLeads({ page: pagination.page, limit: pagination.limit, ...filters });

      if (response?.success && response.data) {
        const leadsData = response.data.leads || [];
        setLeads(leadsData);
        setPagination(prev => ({ ...prev, total: response.data.pagination?.total || 0, pages: response.data.pagination?.pages || 0 }));

        // displayColumns is now derived via useEffect watching leads + field defs

        setStats({
          total: response.data.pagination?.total || 0,
          new: leadsData.filter(l => l.leadStatus === 'New').length,
          qualified: leadsData.filter(l => l.leadStatus === 'Qualified').length,
          contacted: leadsData.filter(l => l.leadStatus === 'Contacted').length
        });
      }
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (email) => {
    if (!email || email.length < 5) { setEmailVerification({ status: 'pending', message: '', isValid: null }); return; }
    setEmailVerification({ status: 'verifying', message: 'Verifying...', isValid: null });
    try {
      const result = await verificationService.verifyEmail(email);
      if (result.success && result.data) {
        const { isValid, status, message } = result.data;
        setEmailVerification({ status: isValid ? 'valid' : status === 'unknown' ? 'unknown' : 'invalid', message: message || '', isValid });
      } else {
        setEmailVerification({ status: 'unknown', message: 'Unable to verify', isValid: null });
      }
    } catch (err) { setEmailVerification({ status: 'unknown', message: 'Verification failed', isValid: null }); }
  };

  const verifyPhone = async (phone) => {
    if (!phone || phone.length < 10) { setPhoneVerification({ status: 'pending', message: '', isValid: null }); return; }
    setPhoneVerification({ status: 'verifying', message: 'Verifying...', isValid: null });
    try {
      const result = await verificationService.verifyPhone(phone);
      if (result.success && result.data) {
        const { isValid, status, message } = result.data;
        setPhoneVerification({ status: isValid ? 'valid' : status === 'unknown' ? 'unknown' : 'invalid', message: message || '', isValid });
      } else {
        setPhoneVerification({ status: 'unknown', message: 'Unable to verify', isValid: null });
      }
    } catch (err) { setPhoneVerification({ status: 'unknown', message: 'Verification failed', isValid: null }); }
  };

  const debouncedEmailVerify = useCallback(debounce((email) => verifyEmail(email), 2000), []);
  const debouncedPhoneVerify = useCallback(debounce((phone) => verifyPhone(phone), 2000), []);

  const closeAllForms = () => {
    setShowCreateForm(false);
    setShowBulkUploadForm(false);
    setShowAddProductForm(false);
    setShowCreateCategoryForm(false);
    setShowAssignGroupForm(false);
    setShowManageFields(false);
    setShowAddFieldForm(false);
  };

  // Template quick-create — skip wizard, submit directly
  const handleTemplateCreate = async () => {
    if (creating) return;
    const requiredEmpty = fieldDefinitions.filter(f => {
      if (!f.isRequired) return false;
      const val = fieldValues[f.fieldName];
      return val === undefined || val === null || String(val).trim() === '';
    });
    if (requiredEmpty.length > 0) {
      const errors = {};
      requiredEmpty.forEach(f => { errors[f.fieldName] = `${f.label} is required`; });
      setFieldErrors(errors);
      return;
    }
    setCreating(true);
    try {
      setError('');
      const standardFields = {};
      const customFields = {};
      fieldDefinitions.forEach(field => {
        const value = fieldValues[field.fieldName];
        if (value != null && value !== '') {
          if (field.isStandardField) standardFields[field.fieldName] = value;
          else customFields[field.fieldName] = value;
        }
      });
      const leadData = {
        ...standardFields,
        ...customFields,
        ...(formData.customer ? { customer: formData.customer } : {}),
        product: formData.product,
        productDetails: formData.productDetails,
      };
      await leadService.createLead(leadData);
      setSuccess('Lead created successfully!');
      setShowCreateForm(false);
      resetForm();
      loadLeads();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError(err.message || err.response?.data?.message || 'Failed to create lead');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (wizardStep !== WIZARD_STEPS.length - 1) return; // only submit on last step
    if (creating) return;
    setCreating(true);
    try {
      setError('');
      const standardFields = {};
      const customFields = {};

      fieldDefinitions.forEach(field => {
        const value = fieldValues[field.fieldName];
        if (value != null && value !== '') {
          if (field.isStandardField) standardFields[field.fieldName] = value;
          else customFields[field.fieldName] = value;
        }
      });

      const leadData = {
        ...standardFields,
        ...customFields,  // spread at top level — Lead schema is strict:false
        ...(formData.customer ? { customer: formData.customer } : {}),
        product: formData.product,
        productDetails: formData.productDetails,
      };

      await leadService.createLead(leadData);
      setSuccess('Lead created successfully!');
      setShowCreateForm(false);
      resetForm();
      loadLeads();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError(err.message || err.response?.data?.message || 'Failed to create lead');
    } finally {
      setCreating(false);
    }
  };

  // Validate required fields in current wizard step
  const validateCurrentStep = () => {
    const step = WIZARD_STEPS[wizardStep];
    const groupedFields = groupFieldsBySection(fieldDefinitions);
    const errors = {};
    let hasError = false;
    step.sections.forEach(sectionName => {
      (groupedFields[sectionName] || []).forEach(field => {
        if (field.isRequired) {
          const val = fieldValues[field.fieldName];
          if (val === undefined || val === null || String(val).trim() === '') {
            errors[field.fieldName] = `${field.label} is required`;
            hasError = true;
          }
        }
      });
    });
    if (hasError) setFieldErrors(prev => ({ ...prev, ...errors }));
    return !hasError;
  };

  // Returns true if current step has at least one required field
  const currentStepHasRequired = () => {
    const step = WIZARD_STEPS[wizardStep];
    const groupedFields = groupFieldsBySection(fieldDefinitions);
    return step.sections.some(sectionName =>
      (groupedFields[sectionName] || []).some(f => f.isRequired)
    );
  };

  const handleCreateProductFromLead = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await productItemService.createProduct(productFormData);
      if (response?.success && response.data) {
        setSuccess('Product created successfully!');
        setFormData(prev => ({ ...prev, product: response.data._id }));
        setShowAddProductForm(false);
        resetProductForm();
        setShowCreateForm(true);
        await loadProducts();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.response?.data?.message || 'Failed to create product'); }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) { setError('Category name is required'); return; }
    try {
      await productCategoryService.createCategory({ name: newCategoryName, isActive: true });
      setSuccess('Category created successfully!');
      setNewCategoryName('');
      setShowCreateCategoryForm(false);
      setShowAddProductForm(true);
      await loadCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.response?.data?.message || 'Failed to create category'); }
  };

  const handleGroupSelection = async (groupId) => {
    try {
      setError('');
      setSelectedGroupForAssignment(groupId);
      const groupData = await groupService.getGroup(groupId);
      if (groupData?.members) {
        setGroupMembers(groupData.members);
        setSelectedMembers(groupData.members.map(m => m._id));
      }
    } catch (err) { if (err?.isPermissionDenied) return; setError('Failed to load group members'); }
  };

  const handleBulkAssignToGroup = async () => {
    try {
      setError('');
      if (!selectedGroupForAssignment) { setError('Please select a group'); return; }
      if (selectedMembers.length === 0) { setError('Please select at least one member'); return; }

      const response = await leadService.assignLeadsToGroup(selectedLeads, selectedGroupForAssignment, selectedMembers);
      if (response?.success) {
        setSuccess(`${selectedLeads.length} leads assigned successfully!`);
        setSelectedLeads([]);
        setShowAssignGroupForm(false);
        setSelectedGroupForAssignment(null);
        setGroupMembers([]);
        setSelectedMembers([]);
        await loadLeads();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.response?.data?.message || 'Failed to assign leads'); }
  };

  const resetForm = () => {
    setFormData({ customer: '', product: '', productDetails: { quantity: 1, requirements: '', estimatedBudget: '', priority: '', notes: '' } });
    setEmailVerification({ status: 'pending', message: '', isValid: null });
    setPhoneVerification({ status: 'pending', message: '', isValid: null });
    setFieldValues({});
    setFieldErrors({});
    setSelectedTemplate(null);
    setSelectedCountryIso('');
    setSelectedStateIso('');
  };

  const resetProductForm = () => {
    setProductFormData({ name: '', articleNumber: '', category: '', price: '', stock: '', description: '', imageUrl: '' });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('productDetails.')) {
      const fieldName = name.split('.')[1];
      setFormData(prev => ({ ...prev, productDetails: { ...prev.productDetails, [fieldName]: value } }));
      return;
    }
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (name === 'email') debouncedEmailVerify(newValue);
    if (name === 'phone') debouncedPhoneVerify(newValue);
  };

  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Load lead details in side panel (after PIN verification)
  const loadLeadDetails = async (leadId) => {
    setSelectedLeadId(leadId);
    setLoadingDetail(true);
    setDetailActiveTab('overview');
    closeDetailForms();

    try {
      const response = await leadService.getLead(leadId);
      if (response?.success) {
        setSelectedLeadData(response.data);
        setDetailConversionData(prev => ({
          ...prev,
          accountName: response.data.company || response.data.customerName || '',
          opportunityName: `${response.data.company || response.data.customerName || ''} - Opportunity`
        }));
        // Load related data
        loadDetailTasks(leadId);
        loadDetailMeetings(leadId);
        loadDetailCalls(leadId);
        loadDetailNotes(leadId);
        loadDetailCustomFields();
      }
    } catch (err) {
      console.error('Error loading lead details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleLeadClick = (leadId) => {
    if (selectedLeadId === leadId) return;
    loadLeadDetails(leadId);
  };

  const loadDetailTasks = async (leadId) => {
    try {
      const response = await taskService.getTasks({ relatedTo: 'Lead', relatedToId: leadId, limit: 100 });
      if (response?.success) setDetailTasks(response.data.tasks || []);
    } catch (err) { console.error('Load tasks error:', err); }
  };

  const loadDetailMeetings = async (leadId) => {
    try {
      const response = await fetch(`${API_URL}/meetings?relatedTo=Lead&relatedToId=${leadId}&limit=100`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) setDetailMeetings(data.data.meetings || []);
    } catch (err) { console.error('Load meetings error:', err); }
  };

  const loadDetailCalls = async (leadId) => {
    try {
      const response = await fetch(`${API_URL}/calls?relatedTo=Lead&relatedToId=${leadId}&limit=100`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) setDetailCalls(data.data.calls || []);
    } catch (err) { console.error('Load calls error:', err); }
  };

  const loadDetailNotes = async (leadId) => {
    try {
      const response = await noteService.getNotes({ relatedTo: 'Lead', relatedToId: leadId, limit: 100 });
      if (response?.success) setDetailNotes(response.data?.notes || []);
    } catch (err) { console.error('Load notes error:', err); }
  };

  const loadDetailCustomFields = async () => {
    try {
      const response = await fieldDefinitionService.getFieldDefinitions('Lead', false);
      if (response && Array.isArray(response)) {
        const activeFields = response.filter(field => field.isActive && field.showInDetail).sort((a, b) => a.displayOrder - b.displayOrder);
        setCustomFieldDefinitions(activeFields);
      }
    } catch (err) { console.error('Load custom fields error:', err); }
  };

  const closeDetailForms = () => {
    setShowDetailEditForm(false);
    setShowDetailDeleteConfirm(false);
    setShowDetailConvertForm(false);
    setShowDetailTaskForm(false);
    setShowDetailMeetingForm(false);
    setShowDetailCallForm(false);
    setShowDetailNoteForm(false);
  };

  const handleDividerDrag = (e) => {
    e.preventDefault();
    const container = document.getElementById('leads-split-container');
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
    setSelectedLeadId(null);
    setSelectedLeadData(null);
    setDetailTasks([]);
    setDetailMeetings([]);
    setDetailCalls([]);
    setDetailNotes([]);
    setDetailExpanded(false);
    closeDetailForms();
  };

  // Detail Panel - Create Task
  const handleDetailCreateTask = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await taskService.createTask({ ...detailTaskData, relatedTo: 'Lead', relatedToId: selectedLeadId });
      setSuccess('Task created successfully!');
      setShowDetailTaskForm(false);
      setDetailTaskData({ subject: '', dueDate: '', status: 'Not Started', priority: 'Normal', description: '' });
      loadDetailTasks(selectedLeadId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.message || 'Failed to create task'); }
  };

  // Detail Panel - Create Meeting
  const handleDetailCreateMeeting = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await fetch(`${API_URL}/meetings`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...detailMeetingData, relatedTo: 'Lead', relatedToId: selectedLeadId })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Meeting created successfully!');
        setShowDetailMeetingForm(false);
        setDetailMeetingData({ title: '', from: '', to: '', location: '', meetingType: 'Online', description: '' });
        loadDetailMeetings(selectedLeadId);
        setTimeout(() => setSuccess(''), 3000);
      } else { setError(data.message || 'Failed to create meeting'); }
    } catch (err) { if (err?.isPermissionDenied) return; setError('Failed to create meeting'); }
  };

  // Detail Panel - Create Call
  const handleDetailCreateCall = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await fetch(`${API_URL}/calls`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...detailCallData, relatedTo: 'Lead', relatedToId: selectedLeadId })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Call logged successfully!');
        setShowDetailCallForm(false);
        setDetailCallData({ subject: '', callStartTime: '', callDuration: '', callType: 'Outbound', callPurpose: 'Follow-up', callResult: 'Completed', description: '' });
        loadDetailCalls(selectedLeadId);
        setTimeout(() => setSuccess(''), 3000);
      } else { setError(data.message || 'Failed to log call'); }
    } catch (err) { if (err?.isPermissionDenied) return; setError('Failed to log call'); }
  };

  // Detail Panel - Create Note
  const handleDetailCreateNote = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await noteService.createNote({ ...detailNoteData, relatedTo: 'Lead', relatedToId: selectedLeadId });
      setSuccess('Note created successfully!');
      setShowDetailNoteForm(false);
      setDetailNoteData({ title: '', content: '' });
      loadDetailNotes(selectedLeadId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.message || 'Failed to create note'); }
  };

  // Detail Panel - Edit Lead
  const openDetailEditForm = () => {
    if (!selectedLeadData) return;
    setDetailEditData({
      customerName: selectedLeadData.customerName || '',
      email: selectedLeadData.email,
      phone: selectedLeadData.phone || '',
      company: selectedLeadData.company || '',
      jobTitle: selectedLeadData.jobTitle || '',
      leadSource: selectedLeadData.leadSource,
      leadStatus: selectedLeadData.leadStatus,
      rating: selectedLeadData.rating,
      industry: selectedLeadData.industry || '',
      website: selectedLeadData.website || '',
      description: selectedLeadData.description || '',
      customer: selectedLeadData.customer?._id || '',
      product: selectedLeadData.product?._id || '',
      productDetails: {
        quantity: selectedLeadData.productDetails?.quantity || 1,
        requirements: selectedLeadData.productDetails?.requirements || '',
        estimatedBudget: selectedLeadData.productDetails?.estimatedBudget || '',
        priority: selectedLeadData.productDetails?.priority || '',
        notes: selectedLeadData.productDetails?.notes || ''
      }
    });
    closeDetailForms();
    setShowDetailEditForm(true);
  };

  const handleDetailUpdateLead = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await leadService.updateLead(selectedLeadId, detailEditData);
      setSuccess('Lead updated successfully!');
      setShowDetailEditForm(false);
      const response = await leadService.getLead(selectedLeadId);
      if (response?.success) setSelectedLeadData(response.data);
      loadLeads();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.message || 'Failed to update lead'); }
  };

  const handleDetailEditChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('productDetails.')) {
      const fieldName = name.split('.')[1];
      setDetailEditData(prev => ({ ...prev, productDetails: { ...prev.productDetails, [fieldName]: value } }));
      return;
    }
    setDetailEditData(prev => ({ ...prev, [name]: value }));
  };

  // Detail Panel - Delete Lead
  const handleDetailDeleteLead = async () => {
    try {
      setError('');
      await leadService.deleteLead(selectedLeadId);
      setSuccess('Lead deleted successfully!');
      closeSidePanel();
      loadLeads();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.message || 'Failed to delete lead'); }
  };

  // Detail Panel - Convert Lead
  const handleDetailConversionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDetailConversionData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleDetailConvertLead = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const lead = selectedLeadData;
      const payload = {
        createAccount: detailConversionData.createAccount,
        createContact: detailConversionData.createContact,
        createOpportunity: detailConversionData.createOpportunity,
        accountData: detailConversionData.createAccount ? {
          accountName: lead.customerName || lead.currentCompany || lead.company || '',
          accountType: lead.customerType || 'Customer',
          industry: lead.industry || '',
          website: lead.website || lead.sourceWebsite || '',
          phone: lead.phone || '',
          email: lead.email || '',
          annualRevenue: lead.annualRevenue || '',
          numberOfEmployees: lead.numberOfEmployees || '',
          description: lead.description || '',
          billingAddress: {
            city: lead.city || lead.location || '',
            state: lead.state || '',
            country: lead.country || ''
          }
        } : {},
        contactData: detailConversionData.createContact ? {
          firstName: lead.customerName || lead.currentCompany || lead.company || '',
          lastName: '',
          email: lead.email || '',
          phone: lead.phone || '',
          mobile: lead.alternatePhone || '',
          title: lead.jobTitle || lead.currentDesignation || '',
          description: lead.description || ''
        } : {},
        opportunityData: detailConversionData.createOpportunity ? {
          opportunityName: `${lead.customerName || lead.company || ''} - Opportunity`,
          amount: lead.estimatedDealValue || 0,
          closeDate: detailConversionData.closeDate || (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })(),
          stage: 'Qualification',
          probability: 50,
          type: 'New Business',
          leadSource: lead.leadSource || lead.source || ''
        } : {}
      };
      const response = await leadService.convertLead(selectedLeadId, payload);
      if (response.success) {
        setSuccess('Lead converted successfully!');
        setShowDetailConvertForm(false);
        closeSidePanel();
        loadLeads();
      } else { setError(response.message || 'Failed to convert lead'); }
    } catch (err) { if (err?.isPermissionDenied) return; setError(err.message || 'Failed to convert lead'); }
  };

  const canUpdateLead = hasPermission('lead_management', 'update');
  const canConvertLead = hasPermission('lead_management', 'convert');

  const canCreateLead = hasPermission('lead_management', 'create');
  const canImportLeads = hasPermission('lead_management', 'import');
  const canManageProducts = hasPermission('product_management', 'create');
  const canDeleteLead = hasPermission('lead_management', 'delete');

  const handleDeleteLead = async (e, leadId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }
    try {
      setError('');
      await leadService.deleteLead(leadId);
      setSuccess('Lead deleted successfully!');
      loadLeads();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err?.isPermissionDenied) return;
      setError(err.response?.data?.message || 'Failed to delete lead');
    }
  };

  const getStatusBadgeVariant = (status) => {
    const variants = { 'New': 'info', 'Contacted': 'secondary', 'Qualified': 'success', 'Unqualified': 'destructive', 'Lost': 'destructive', 'Converted': 'success' };
    return variants[status] || 'secondary';
  };

  const VerificationIcon = ({ status }) => {
    if (status === 'pending') return null;
    if (status === 'verifying') return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    if (status === 'valid') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'invalid') return <XCircle className="h-4 w-4 text-red-500" />;
    if (status === 'unknown') return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return null;
  };

  const renderDynamicField = (field) => {
    const isEmail = field.fieldName === 'email';
    const isPhone = field.fieldName === 'phone';

    // Country cascading dropdown — custom component with flag + continent grouping
    if (field.fieldName === 'country') {
      return (
        <CountryCascadeSelect
          value={fieldValues['country'] || ''}
          onChange={(countryObj) => {
            handleFieldChange('country', countryObj.name);
            setSelectedCountryIso(countryObj.isoCode);
            // Reset state and city when country changes
            handleFieldChange('state', '');
            handleFieldChange('city', '');
            setSelectedStateIso('');
          }}
        />
      );
    }

    // State cascading dropdown — custom, same style as country
    if (field.fieldName === 'state') {
      return (
        <StateCascadeSelect
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

    // City cascading dropdown — custom, same style as country
    if (field.fieldName === 'city') {
      return (
        <CityCascadeSelect
          value={fieldValues['city'] || ''}
          countryIso={selectedCountryIso}
          stateIso={selectedStateIso}
          onChange={(cityName) => handleFieldChange('city', cityName)}
        />
      );
    }

    // Rich-text editor for Description and Requirements
    if (field.fieldName === 'description' || field.fieldName === 'requirements') {
      return (
        <RichTextEditor
          fieldName={field.fieldName}
          value={fieldValues[field.fieldName] || ''}
          onChange={handleFieldChange}
          label={field.label}
          isRequired={field.isRequired}
          placeholder={`Enter ${field.label.toLowerCase()}...`}
        />
      );
    }

    return (
      <div className="relative">
        <DynamicField
          fieldDefinition={field}
          value={fieldValues[field.fieldName] || ''}
          onChange={handleFieldChange}
          error={fieldErrors[field.fieldName]}
        />
        {isEmail && <div className="absolute right-3 top-1/2 -translate-y-1/2"><VerificationIcon status={emailVerification.status} /></div>}
        {isPhone && <div className="absolute right-3 top-1/2 -translate-y-1/2"><VerificationIcon status={phoneVerification.status} /></div>}
      </div>
    );
  };

  // Status color palettes used across table + grid
  const SC = {
    'New':         { bg: 'linear-gradient(135deg,#312e81,#6366f1)', pill:'#ede9fe', pillTxt:'#5b21b6', dot:'#6366f1' },
    'Contacted':   { bg: 'linear-gradient(135deg,#4c1d95,#8b5cf6)', pill:'#f3e8ff', pillTxt:'#7c3aed', dot:'#8b5cf6' },
    'Qualified':   { bg: 'linear-gradient(135deg,#064e3b,#10b981)', pill:'#d1fae5', pillTxt:'#065f46', dot:'#10b981' },
    'Unqualified': { bg: 'linear-gradient(135deg,#7f1d1d,#ef4444)', pill:'#fee2e2', pillTxt:'#991b1b', dot:'#ef4444' },
    'Lost':        { bg: 'linear-gradient(135deg,#374151,#6b7280)', pill:'#f1f5f9', pillTxt:'#475569', dot:'#6b7280' },
    'Converted':   { bg: 'linear-gradient(135deg,#065f46,#059669)', pill:'#d1fae5', pillTxt:'#065f46', dot:'#059669' },
  };
  const getSC = (status) => SC[status] || { bg:'linear-gradient(135deg,#1e3c72,#3b82f6)', pill:'#dbeafe', pillTxt:'#1e40af', dot:'#3b82f6' };

  return (
    <DashboardLayout title="Leads">

      {success && <Alert variant="success" className="mb-4"><AlertDescription>{success}</AlertDescription></Alert>}
      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      {/* Stats - Clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div
          className="stat-card"
          onClick={() => handleFilterChange('leadStatus', '')}
          style={{
            cursor: 'pointer',
            border: filters.leadStatus === '' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
            background: filters.leadStatus === '' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
            boxShadow: filters.leadStatus === '' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <div className="stat-icon"><Target className="h-5 w-5" /></div>
          <div>
            <p className="stat-value">{stats.total}</p>
            <p className="stat-label">Total Leads</p>
          </div>
        </div>
        <div
          className="stat-card"
          onClick={() => handleFilterChange('leadStatus', 'New')}
          style={{
            cursor: 'pointer',
            border: filters.leadStatus === 'New' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
            background: filters.leadStatus === 'New' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
            boxShadow: filters.leadStatus === 'New' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <div className="stat-icon" style={{background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'}}><Target className="h-5 w-5" /></div>
          <div>
            <p className="stat-value text-blue-600">{stats.new}</p>
            <p className="stat-label">New Leads</p>
          </div>
        </div>
        <div
          className="stat-card"
          onClick={() => handleFilterChange('leadStatus', 'Qualified')}
          style={{
            cursor: 'pointer',
            border: filters.leadStatus === 'Qualified' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
            background: filters.leadStatus === 'Qualified' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
            boxShadow: filters.leadStatus === 'Qualified' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <div className="stat-icon" style={{background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'}}><Target className="h-5 w-5" /></div>
          <div>
            <p className="stat-value text-green-600">{stats.qualified}</p>
            <p className="stat-label">Qualified</p>
          </div>
        </div>
        <div
          className="stat-card"
          onClick={() => handleFilterChange('leadStatus', 'Contacted')}
          style={{
            cursor: 'pointer',
            border: filters.leadStatus === 'Contacted' ? '2px solid #14b8a6' : '1px solid #e2e8f0',
            background: filters.leadStatus === 'Contacted' ? 'linear-gradient(135deg, rgb(120 245 240) 0%, rgb(200 255 252) 100%)' : 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
            boxShadow: filters.leadStatus === 'Contacted' ? '0 4px 12px rgba(20, 184, 166, 0.3)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <div className="stat-icon" style={{background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)'}}><Target className="h-5 w-5" /></div>
          <div>
            <p className="stat-value text-purple-600">{stats.contacted}</p>
            <p className="stat-label">Contacted</p>
          </div>
        </div>
      </div>

      {/* Split View Container */}
      <div id="leads-split-container" style={{ display: 'flex', gap: '0', height: 'calc(100vh - 280px)', overflow: 'hidden', position: 'relative' }}>

        {/* ── LEFT: Create Form (inline) ── */}
        {showCreateForm && (
          <div style={{ flex: `0 0 ${detailPanelWidth}%`, background: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {/* Gradient header with step tabs */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3c72 100%)', flexShrink: 0 }}>
              {/* Title row */}
              <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>🎯</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>New Lead</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>{selectedTemplate ? '⚡ Template Mode — Quick Create' : `Step ${wizardStep + 1} of ${WIZARD_STEPS.length}`}</div>
                  </div>
                </div>
                <button onClick={() => { setShowCreateForm(false); resetForm(); setWizardStep(0); }}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '7px', padding: '5px 9px', color: 'white', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}>✕</button>
              </div>
              {/* Step tabs — hidden in template mode */}
              {!selectedTemplate && (
                <>
                  <div style={{ display: 'flex', padding: '8px 10px 0' }}>
                    {WIZARD_STEPS.map((step, idx) => {
                      const isDone = idx < wizardStep;
                      const isActive = idx === wizardStep;
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
                    <div style={{ height: '100%', background: 'linear-gradient(90deg,#3b82f6,#6366f1)', borderRadius: '99px', width: `${(wizardStep / WIZARD_STEPS.length) * 100}%`, transition: 'width 0.35s ease' }} />
                  </div>
                </>
              )}
            </div>

            {/* Form body */}
            <form onSubmit={handleCreateLead} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

                {/* Template Selector — shown only on step 0 */}
                {wizardStep === 0 && leadTemplates.length > 0 && (
                  <div style={{ marginBottom: '14px', padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                      ⚡ Quick Start — Apply Template
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {leadTemplates.map(t => (
                        <button key={t._id} type="button"
                          onClick={() => {
                            setSelectedTemplate(t._id);
                            // Pre-fill fieldValues with template defaultValues
                            setFieldValues(prev => ({ ...prev, ...t.defaultValues }));
                            templateService.useTemplate(t._id).catch(() => {});
                          }}
                          style={{
                            padding: '5px 11px', borderRadius: '99px', border: `2px solid ${selectedTemplate === t._id ? t.color : '#e2e8f0'}`,
                            background: selectedTemplate === t._id ? t.color + '18' : '#fff',
                            color: selectedTemplate === t._id ? t.color : '#64748b',
                            fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s',
                            display: 'flex', alignItems: 'center', gap: '4px'
                          }}>
                          {t.icon} {t.name}
                          {selectedTemplate === t._id && <span style={{ marginLeft: '2px' }}>✓</span>}
                        </button>
                      ))}
                      {selectedTemplate && (
                        <button type="button" onClick={() => { setSelectedTemplate(null); setFieldValues({}); }}
                          style={{ padding: '5px 10px', borderRadius: '99px', border: '1px solid #fecaca', background: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                          ✕ Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {selectedTemplate ? (() => {
                  // ── TEMPLATE QUICK-CREATE MODE (Zoho-style) ──
                  const appliedTemplate = leadTemplates.find(t => t._id === selectedTemplate);
                  const prefilledKeys = Object.keys(appliedTemplate?.defaultValues || {}).filter(k => appliedTemplate.defaultValues[k] !== '' && appliedTemplate.defaultValues[k] != null);
                  const requiredEmptyFields = fieldDefinitions.filter(f => {
                    if (!f.isRequired) return false;
                    const val = fieldValues[f.fieldName];
                    return val === undefined || val === null || String(val).trim() === '';
                  });
                  return (
                    <div>
                      {/* Template applied banner */}
                      <div style={{ marginBottom: '16px', padding: '10px 13px', background: `${appliedTemplate?.color || '#6366f1'}12`, border: `1.5px solid ${appliedTemplate?.color || '#6366f1'}40`, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontSize: '22px' }}>{appliedTemplate?.icon || '📋'}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: appliedTemplate?.color || '#6366f1' }}>{appliedTemplate?.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>{prefilledKeys.length} field{prefilledKeys.length !== 1 ? 's' : ''} pre-filled automatically</div>
                        </div>
                      </div>

                      {/* Only required empty fields */}
                      {requiredEmptyFields.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '10px', fontWeight: '700', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                            Required fields to fill
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {requiredEmptyFields.map(field => (
                              <div key={field._id || field.fieldName}>
                                {renderDynamicField(field)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pre-filled values preview */}
                      {prefilledKeys.length > 0 && (
                        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                            📋 Pre-filled by template
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {prefilledKeys.map(key => {
                              const fieldDef = fieldDefinitions.find(f => f.fieldName === key);
                              return (
                                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#fff', borderRadius: '7px', border: '1px solid #e2e8f0' }}>
                                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{fieldDef?.label || key}</span>
                                  <span style={{ fontSize: '11px', color: '#0f172a', fontWeight: '700', padding: '2px 8px', background: `${appliedTemplate?.color || '#6366f1'}12`, borderRadius: '99px', color: appliedTemplate?.color || '#6366f1' }}>
                                    {String(appliedTemplate.defaultValues[key])}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <>
                    {/* Current step header */}
                    <div style={{ marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                      <h4 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{WIZARD_STEPS[wizardStep].icon} {WIZARD_STEPS[wizardStep].label}</h4>
                      <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{WIZARD_STEPS[wizardStep].desc}</p>
                    </div>
                    {(() => {
                      const step = WIZARD_STEPS[wizardStep];
                      const groupedFields = groupFieldsBySection(fieldDefinitions);
                      return (
                        <div>
                          {step.sections.map(sectionName => {
                            const sectionFields = groupedFields[sectionName];
                            const hasOwner = step.includeOwner && sectionName === 'Basic Information';
                            if (!sectionFields?.length && !hasOwner) return null;
                            return (
                              <div key={sectionName}>
                                {step.sections.length > 1 && sectionFields?.length > 0 && (
                                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px', paddingBottom: '4px', borderBottom: '1px solid #f1f5f9' }}>{sectionName}</div>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
                                  {hasOwner && (
                                    <div>
                                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Lead Owner</label>
                                      <input type="text" value={`${user?.firstName || ''} ${user?.lastName || ''}`} disabled
                                        style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', color: '#94a3b8', boxSizing: 'border-box' }} />
                                    </div>
                                  )}
                                  {sectionFields?.map((field) => (
                                    <div key={field._id || field.fieldName}>
                                      {renderDynamicField(field)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                          {step.includeCustomer && (
                            <div style={{ marginTop: '4px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>🔗 Link to Customer (Optional)</label>
                              <select name="customer" className="crm-form-select" style={{ padding: '9px 12px', fontSize: '13px', width: '100%', borderRadius: '8px' }} value={formData.customer} onChange={handleChange}>
                                <option value="">— None —</option>
                                {customers.map(c => (
                                  <option key={c._id} value={c._id}>{c.accountName}{c.phone ? ` | ${c.phone}` : ''}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          {step.includeProduct && (
                            <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>📦 Product (Optional)</label>
                              <select name="product" className="crm-form-select" style={{ padding: '9px 12px', fontSize: '13px', width: '100%', borderRadius: '8px' }} value={formData.product} onChange={handleChange}>
                                <option value="">— None —</option>
                                {products.map(product => (
                                  <option key={product._id} value={product._id}>{product.articleNumber} - {product.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>

              {/* Footer nav */}
              <div style={{ padding: '11px 14px', borderTop: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <button type="button"
                  onClick={() => { if (selectedTemplate) { setSelectedTemplate(null); setFieldValues({}); } else if (wizardStep > 0) { setWizardStep(s => s - 1); } else { setShowCreateForm(false); resetForm(); setWizardStep(0); } }}
                  style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  {selectedTemplate ? '← Change Template' : wizardStep === 0 ? 'Cancel' : '← Back'}
                </button>
                {selectedTemplate ? (
                  <button type="button" onClick={handleTemplateCreate} disabled={creating}
                    style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', background: creating ? '#94a3b8' : 'linear-gradient(135deg,#059669 0%,#10b981 100%)', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: creating ? 'not-allowed' : 'pointer', boxShadow: creating ? 'none' : '0 2px 8px rgba(16,185,129,0.3)' }}>
                    {creating ? 'Creating...' : '⚡ Create Lead'}
                  </button>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {WIZARD_STEPS.map((_, idx) => (
                        <div key={idx} style={{ width: idx === wizardStep ? '16px' : '5px', height: '5px', borderRadius: '99px', background: idx < wizardStep ? '#10b981' : idx === wizardStep ? '#3b82f6' : '#e2e8f0', transition: 'all 0.25s' }} />
                      ))}
                    </div>
                    {wizardStep < WIZARD_STEPS.length - 1 ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {!currentStepHasRequired() && (
                          <button type="button" onClick={() => { setFieldErrors({}); setWizardStep(s => s + 1); }}
                            style={{ padding: '7px 11px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#94a3b8', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Skip</button>
                        )}
                        <button type="button" onClick={() => { if (validateCurrentStep()) { setFieldErrors({}); setWizardStep(s => s + 1); } }}
                          style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#1e3c72 0%,#3b82f6 100%)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(30,60,114,0.25)' }}>
                          Next →
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={handleCreateLead} disabled={creating}
                        style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', background: creating ? '#94a3b8' : 'linear-gradient(135deg,#059669 0%,#10b981 100%)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: creating ? 'not-allowed' : 'pointer', boxShadow: creating ? 'none' : '0 2px 8px rgba(16,185,129,0.25)' }}>
                        {creating ? 'Saving...' : '✓ Save Lead'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ── LEFT: Detail Panel ── */}
        {selectedLeadId && !showCreateForm && (
          <div style={detailExpanded ? {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'white', zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden'
          } : {
            flex: `0 0 ${detailPanelWidth}%`, background: 'white', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0
          }}>
            {/* Panel Header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: detailExpanded ? 'linear-gradient(135deg,#1e3c72,#2a69ac)' : 'linear-gradient(135deg,#fafbff,#f1f5f9)', flexShrink: 0 }}>
              <h3 style={{ margin: 0, color: detailExpanded ? 'white' : '#1e3c72', fontSize: '14px', fontWeight: '700' }}>Lead Details</h3>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {/* Expand / Collapse toggle */}
                <button onClick={() => setDetailExpanded(v => !v)}
                  title={detailExpanded ? 'Collapse' : 'Expand to full page'}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ede9fe'; e.currentTarget.style.color = '#5b21b6'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = detailExpanded ? 'rgba(255,255,255,0.2)' : '#f1f5f9'; e.currentTarget.style.color = detailExpanded ? 'white' : '#64748b'; }}
                  style={{ background: detailExpanded ? 'rgba(255,255,255,0.2)' : '#f1f5f9', border: 'none', borderRadius: '7px', padding: '5px 7px', color: detailExpanded ? 'white' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>
                  {detailExpanded
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                  }
                </button>
                {/* Close */}
                <button onClick={closeSidePanel}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = detailExpanded ? 'rgba(255,255,255,0.2)' : '#f1f5f9'; e.currentTarget.style.color = detailExpanded ? 'white' : '#64748b'; }}
                  style={{ background: detailExpanded ? 'rgba(255,255,255,0.2)' : '#f1f5f9', border: 'none', borderRadius: '7px', padding: '5px 7px', color: detailExpanded ? 'white' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {/* Panel Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingDetail ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : selectedLeadData ? (
                <div>
                  {/* Lead Header Card */}
                  <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3c72', fontSize: '20px', fontWeight: 'bold' }}>
                        {selectedLeadData.customerName?.charAt(0) || '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0', color: '#1e3c72' }}>
                          {selectedLeadData.customerName}
                        </h2>
                        {selectedLeadData.jobTitle && (
                          <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
                            {selectedLeadData.jobTitle} {selectedLeadData.company && `at ${selectedLeadData.company}`}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                          <Badge variant={getStatusBadgeVariant(selectedLeadData.leadStatus)}>{selectedLeadData.leadStatus || 'New'}</Badge>
                          {selectedLeadData.rating && <Badge variant="outline"><Star className="h-3 w-3 mr-1" />{selectedLeadData.rating}</Badge>}
                          {selectedLeadData.isConverted && <Badge variant="success">Converted</Badge>}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {canUpdateLead && <button className="crm-btn crm-btn-primary crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={openDetailEditForm}><Edit className="h-3 w-3 mr-1" />Edit</button>}
                      {!selectedLeadData.isConverted && canConvertLead && <button className="crm-btn crm-btn-success crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => { closeDetailForms(); setShowDetailConvertForm(true); }}>Convert</button>}
                      {canDeleteLead && <button className="crm-btn crm-btn-danger crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => { closeDetailForms(); setShowDetailDeleteConfirm(true); }}>Delete</button>}
                      {selectedLeadData.phone && <button className="crm-btn crm-btn-outline crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => window.location.href = `tel:${selectedLeadData.phone}`}><Phone className="h-3 w-3 mr-1" />Call</button>}
                    </div>
                  </div>

                  {/* Inline Edit Form */}
                  {showDetailEditForm && (
                    <div style={{ margin: '12px', padding: '12px', background: '#F0F9FF', borderRadius: '8px', border: '1px solid #93C5FD' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1E40AF' }}>Edit Lead</h5>
                        <button onClick={() => setShowDetailEditForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b' }}>✕</button>
                      </div>
                      <form onSubmit={handleDetailUpdateLead}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                          <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Customer Name *</label><input type="text" name="customerName" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px', width: '100%' }} value={detailEditData.customerName || ''} onChange={handleDetailEditChange} required /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Email</label><input type="email" name="email" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.email || ''} onChange={handleDetailEditChange} required /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Phone</label><input type="tel" name="phone" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.phone || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Company</label><input type="text" name="company" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.company || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Job Title</label><input type="text" name="jobTitle" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.jobTitle || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Status</label><select name="leadStatus" className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.leadStatus || 'New'} onChange={handleDetailEditChange}><option value="New">New</option><option value="Contacted">Contacted</option><option value="Qualified">Qualified</option><option value="Unqualified">Unqualified</option><option value="Lost">Lost</option></select></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Rating</label><select name="rating" className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.rating || 'Warm'} onChange={handleDetailEditChange}><option value="Hot">Hot</option><option value="Warm">Warm</option><option value="Cold">Cold</option></select></div>
                          <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Linked Customer</label><select name="customer" className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px', width: '100%' }} value={detailEditData.customer || ''} onChange={handleDetailEditChange}><option value="">— None —</option>{customers.map(c => (<option key={c._id} value={c._id}>{c.accountName}{c.phone ? ` | ${c.phone}` : ''}</option>))}</select></div>
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
                      <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#991B1B' }}>Are you sure you want to delete <strong>{selectedLeadData.customerName}</strong>?</p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button className="crm-btn crm-btn-secondary crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => setShowDetailDeleteConfirm(false)}>Cancel</button>
                        <button className="crm-btn crm-btn-danger crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={handleDetailDeleteLead}>Delete</button>
                      </div>
                    </div>
                  )}

                  {/* Inline Convert Form */}
                  {showDetailConvertForm && (
                    <div style={{ margin: '12px', padding: '12px', background: '#DCFCE7', borderRadius: '8px', border: '1px solid #86EFAC' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#166534' }}>Convert Lead</h5>
                        <button onClick={() => setShowDetailConvertForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b' }}>✕</button>
                      </div>
                      <form onSubmit={handleDetailConvertLead}>
                        {/* Preview what will be created */}
                        <div style={{ background: '#f0fdf4', borderRadius: '6px', padding: '8px 10px', marginBottom: '10px', fontSize: '11px', color: '#166534' }}>
                          <strong>Customer:</strong> {selectedLeadData.customerName || selectedLeadData.company || '—'} &nbsp;|&nbsp;
                          <strong>Phone:</strong> {selectedLeadData.phone || '—'} &nbsp;|&nbsp;
                          <strong>Email:</strong> {selectedLeadData.email || '—'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px', background: detailConversionData.createAccount ? '#dbeafe' : '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                            <input type="checkbox" name="createAccount" checked={detailConversionData.createAccount} onChange={handleDetailConversionChange} />
                            <div><div style={{ fontWeight: '600' }}>Account</div><div style={{ fontSize: '10px', color: '#64748b' }}>{selectedLeadData.customerName || '—'}</div></div>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px', background: detailConversionData.createContact ? '#dbeafe' : '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                            <input type="checkbox" name="createContact" checked={detailConversionData.createContact} onChange={handleDetailConversionChange} />
                            <div><div style={{ fontWeight: '600' }}>Contact</div><div style={{ fontSize: '10px', color: '#64748b' }}>{selectedLeadData.email || '—'}</div></div>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px', background: detailConversionData.createOpportunity ? '#dbeafe' : '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>
                            <input type="checkbox" name="createOpportunity" checked={detailConversionData.createOpportunity} onChange={handleDetailConversionChange} />
                            <div><div style={{ fontWeight: '600' }}>Opportunity</div><div style={{ fontSize: '10px', color: '#64748b' }}>₹{selectedLeadData.estimatedDealValue || '0'}</div></div>
                          </label>
                        </div>
                        {detailConversionData.createOpportunity && (
                          <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Close Date</label>
                            <input
                              type="date"
                              name="closeDate"
                              value={detailConversionData.closeDate}
                              onChange={handleDetailConversionChange}
                              className="crm-form-input"
                              style={{ padding: '6px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                            />
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => setShowDetailConvertForm(false)}>Cancel</button>
                          <button type="submit" className="crm-btn crm-btn-success crm-btn-sm" style={{ fontSize: '12px', padding: '6px 16px', fontWeight: '600' }}>Convert Now</button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Tabs */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <button onClick={() => setDetailActiveTab('overview')} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '600', border: 'none', background: detailActiveTab === 'overview' ? 'white' : 'transparent', borderBottom: detailActiveTab === 'overview' ? '2px solid #1e3c72' : '2px solid transparent', color: detailActiveTab === 'overview' ? '#1e3c72' : '#64748b', cursor: 'pointer' }}>Overview</button>
                    <button onClick={() => setDetailActiveTab('activities')} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '600', border: 'none', background: detailActiveTab === 'activities' ? 'white' : 'transparent', borderBottom: detailActiveTab === 'activities' ? '2px solid #1e3c72' : '2px solid transparent', color: detailActiveTab === 'activities' ? '#1e3c72' : '#64748b', cursor: 'pointer' }}>Activities</button>
                    <button onClick={() => setDetailActiveTab('notes')} style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: '600', border: 'none', background: detailActiveTab === 'notes' ? 'white' : 'transparent', borderBottom: detailActiveTab === 'notes' ? '2px solid #1e3c72' : '2px solid transparent', color: detailActiveTab === 'notes' ? '#1e3c72' : '#64748b', cursor: 'pointer' }}>Notes ({detailNotes.length})</button>
                  </div>

                  {/* Tab Content */}
                  <div style={{ padding: '16px' }}>
                    {/* Overview Tab */}
                    {detailActiveTab === 'overview' && (
                      <div>
                        {(() => {
                          // Keys to NEVER show in detail panel
                          const SYSTEM_KEYS = new Set(['_id', '__v', 'tenant', 'createdBy', 'lastModifiedBy', 'updatedAt', 'isActive', 'isConverted', 'convertedDate', 'convertedAccount', 'convertedContact', 'convertedOpportunity', 'emailVerified', 'emailVerificationStatus', 'emailVerificationDetails', 'phoneVerified', 'phoneVerificationStatus', 'phoneVerificationDetails', 'emailOptOut', 'doNotCall', 'assignedGroup', 'assignedMembers', 'assignmentChain', 'dataCenterCandidateId', 'productDetails', 'owner', 'customFields', 'tags', 'leadNumber', 'source']);

                          // Build a field map: fieldName → { label, section, fieldType, displayOrder }
                          const fieldMap = {};
                          DEFAULT_LEAD_FIELDS.forEach(f => { fieldMap[f.fieldName] = { label: f.label, section: f.section, fieldType: f.fieldType, displayOrder: f.displayOrder }; });
                          customFieldDefs.forEach(f => { fieldMap[f.fieldName] = { label: f.label, section: f.section, fieldType: f.fieldType, displayOrder: f.displayOrder }; });

                          // Collect all keys from lead that have a value
                          const grouped = {};
                          const addToGrouped = (key, val) => {
                            const def = fieldMap[key];
                            const section = def?.section || 'Additional Information';
                            if (!grouped[section]) grouped[section] = [];
                            // avoid duplicates
                            if (!grouped[section].some(f => f.key === key)) {
                              grouped[section].push({ key, label: def?.label || formatFieldName(key), fieldType: def?.fieldType || 'text', value: val, displayOrder: def?.displayOrder ?? 999 });
                            }
                          };

                          Object.keys(selectedLeadData).forEach(key => {
                            if (SYSTEM_KEYS.has(key)) return;
                            const val = selectedLeadData[key];
                            if (val === null || val === undefined || val === '') return;
                            if (typeof val === 'object' && !Array.isArray(val)) return;
                            addToGrouped(key, val);
                          });

                          // Also expand nested customFields (for leads created before the top-level fix)
                          if (selectedLeadData.customFields && typeof selectedLeadData.customFields === 'object') {
                            Object.keys(selectedLeadData.customFields).forEach(key => {
                              if (SYSTEM_KEYS.has(key)) return;
                              const val = selectedLeadData.customFields[key];
                              if (val === null || val === undefined || val === '') return;
                              if (typeof val === 'object' && !Array.isArray(val)) return;
                              addToGrouped(key, val);
                            });
                          }

                          // Sort fields within each section by displayOrder
                          Object.keys(grouped).forEach(sec => {
                            grouped[sec].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
                          });

                          // Section render order
                          const sectionOrder = ['Basic Information', 'Lead Details', 'Business Information', 'Address', 'Additional Information', ...Object.keys(grouped).filter(s => !['Basic Information','Lead Details','Business Information','Address','Additional Information'].includes(s))];

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
                                          : fieldType === 'textarea'
                                          ? <div style={{ fontSize: '12px', fontWeight: '500', margin: 0, color: '#1e293b', wordBreak: 'break-word', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: display || '-' }} />
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

                        {/* Customer Info */}
                        {selectedLeadData.customer && (
                          <div style={{ marginBottom: '14px', padding: '10px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
                            <h4 style={{ fontSize: '10px', fontWeight: '700', color: '#15803d', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Linked Customer</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div style={{ background: '#fff', padding: '6px 8px', borderRadius: '5px' }}><p style={{ fontSize: '9px', color: '#15803d', marginBottom: '2px', fontWeight: '600' }}>CUSTOMER NAME</p><p style={{ fontSize: '12px', fontWeight: '600', margin: 0 }}>{selectedLeadData.customer.accountName || selectedLeadData.customer}</p></div>
                              {selectedLeadData.customer.phone && <div style={{ background: '#fff', padding: '6px 8px', borderRadius: '5px' }}><p style={{ fontSize: '9px', color: '#15803d', marginBottom: '2px', fontWeight: '600' }}>PHONE</p><p style={{ fontSize: '12px', fontWeight: '600', margin: 0 }}>{selectedLeadData.customer.phone}</p></div>}
                              {selectedLeadData.customer.email && <div style={{ background: '#fff', padding: '6px 8px', borderRadius: '5px' }}><p style={{ fontSize: '9px', color: '#15803d', marginBottom: '2px', fontWeight: '600' }}>EMAIL</p><p style={{ fontSize: '12px', fontWeight: '600', margin: 0 }}>{selectedLeadData.customer.email}</p></div>}
                              {selectedLeadData.customer.industry && <div style={{ background: '#fff', padding: '6px 8px', borderRadius: '5px' }}><p style={{ fontSize: '9px', color: '#15803d', marginBottom: '2px', fontWeight: '600' }}>INDUSTRY</p><p style={{ fontSize: '12px', fontWeight: '600', margin: 0 }}>{selectedLeadData.customer.industry}</p></div>}
                            </div>
                          </div>
                        )}

                        {/* Product Info */}
                        {selectedLeadData.product && (
                          <div style={{ marginBottom: '14px', padding: '10px', background: '#F0F9FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                            <h4 style={{ fontSize: '10px', fontWeight: '700', color: '#1E40AF', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div style={{ background: '#fff', padding: '6px 8px', borderRadius: '5px' }}><p style={{ fontSize: '9px', color: '#1E40AF', marginBottom: '2px', fontWeight: '600' }}>PRODUCT</p><p style={{ fontSize: '12px', fontWeight: '600', margin: 0 }}>{selectedLeadData.product.name}</p></div>
                              <div style={{ background: '#fff', padding: '6px 8px', borderRadius: '5px' }}><p style={{ fontSize: '9px', color: '#1E40AF', marginBottom: '2px', fontWeight: '600' }}>ARTICLE #</p><p style={{ fontSize: '12px', fontWeight: '600', margin: 0 }}>{selectedLeadData.product.articleNumber}</p></div>
                              {selectedLeadData.productDetails?.quantity && <div style={{ background: '#fff', padding: '6px 8px', borderRadius: '5px' }}><p style={{ fontSize: '9px', color: '#1E40AF', marginBottom: '2px', fontWeight: '600' }}>QTY</p><p style={{ fontSize: '12px', fontWeight: '600', margin: 0 }}>{selectedLeadData.productDetails.quantity}</p></div>}
                              {selectedLeadData.productDetails?.estimatedBudget && <div style={{ background: '#fff', padding: '6px 8px', borderRadius: '5px' }}><p style={{ fontSize: '9px', color: '#1E40AF', marginBottom: '2px', fontWeight: '600' }}>BUDGET</p><p style={{ fontSize: '12px', fontWeight: '600', margin: 0, color: '#059669' }}>₹{Number(selectedLeadData.productDetails.estimatedBudget).toLocaleString()}</p></div>}
                            </div>
                          </div>
                        )}

                        {/* Audit Info — only for TENANT_ADMIN and above */}
                        {(user?.userType === 'TENANT_ADMIN' || user?.userType === 'SAAS_OWNER' || user?.userType === 'SAAS_ADMIN') && (
                          <div style={{ marginBottom: '14px', padding: '10px', background: '#fefce8', borderRadius: '8px', border: '1px solid #fde68a' }}>
                            <h4 style={{ fontSize: '10px', fontWeight: '700', color: '#92400e', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Audit Information</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div style={{ background: '#fff', padding: '6px 8px', borderRadius: '5px' }}>
                                <p style={{ fontSize: '9px', color: '#92400e', marginBottom: '2px', fontWeight: '600' }}>ADDED BY</p>
                                <p style={{ fontSize: '12px', fontWeight: '600', margin: 0 }}>
                                  {selectedLeadData.createdBy
                                    ? `${selectedLeadData.createdBy.firstName} ${selectedLeadData.createdBy.lastName}`
                                    : '-'}
                                </p>
                              </div>
                              <div style={{ background: '#fff', padding: '6px 8px', borderRadius: '5px' }}>
                                <p style={{ fontSize: '9px', color: '#92400e', marginBottom: '2px', fontWeight: '600' }}>ADDED ON</p>
                                <p style={{ fontSize: '12px', fontWeight: '600', margin: 0 }}>
                                  {selectedLeadData.createdAt ? new Date(selectedLeadData.createdAt).toLocaleDateString() : '-'}
                                </p>
                              </div>
                              {selectedLeadData.createdBy?.email && (
                                <div style={{ background: '#fff', padding: '6px 8px', borderRadius: '5px', gridColumn: 'span 2' }}>
                                  <p style={{ fontSize: '9px', color: '#92400e', marginBottom: '2px', fontWeight: '600' }}>EMAIL</p>
                                  <p style={{ fontSize: '12px', fontWeight: '600', margin: 0, color: '#3B82F6' }}>{selectedLeadData.createdBy.email}</p>
                                </div>
                              )}
                              {selectedLeadData.source === 'Data Center' && (
                                <div style={{ background: '#EEF2FF', padding: '6px 8px', borderRadius: '5px', gridColumn: 'span 2' }}>
                                  <p style={{ fontSize: '9px', color: '#4338CA', marginBottom: '2px', fontWeight: '600' }}>SOURCE</p>
                                  <p style={{ fontSize: '12px', fontWeight: '700', margin: 0, color: '#4F46E5' }}>Data Center</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Activities Tab */}
                    {detailActiveTab === 'activities' && (
                      <div>
                        {/* Add Activity Buttons */}
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                          <button className="crm-btn crm-btn-sm crm-btn-primary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => { closeDetailForms(); setShowDetailTaskForm(true); }}>+ Task</button>
                          <button className="crm-btn crm-btn-sm crm-btn-primary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => { closeDetailForms(); setShowDetailMeetingForm(true); }}>+ Meeting</button>
                          <button className="crm-btn crm-btn-sm crm-btn-primary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => { closeDetailForms(); setShowDetailCallForm(true); }}>+ Call</button>
                        </div>

                        {/* Task Form */}
                        {showDetailTaskForm && (
                          <div style={{ marginBottom: '12px', padding: '10px', background: '#F0FDF4', borderRadius: '6px', border: '1px solid #86EFAC' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <h5 style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#166534' }}>Create Task</h5>
                              <button onClick={() => setShowDetailTaskForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748b' }}>✕</button>
                            </div>
                            {/* Task Templates */}
                            {taskTemplates.length > 0 && (
                              <div style={{ marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {taskTemplates.map(t => (
                                  <button key={t._id} type="button"
                                    onClick={() => {
                                      const dv = t.defaultValues || {};
                                      const dueDate = t.dueDateOffset
                                        ? new Date(Date.now() + t.dueDateOffset * 86400000).toISOString().split('T')[0]
                                        : detailTaskData.dueDate;
                                      setDetailTaskData(prev => ({ ...prev, ...dv, dueDate }));
                                      templateService.useTemplate(t._id).catch(() => {});
                                    }}
                                    style={{ padding: '3px 9px', borderRadius: '99px', border: `1.5px solid ${t.color}`, background: t.color + '15', color: t.color, fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                                    {t.icon} {t.name}
                                  </button>
                                ))}
                              </div>
                            )}
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

                        {/* Meeting Form */}
                        {showDetailMeetingForm && (
                          <div style={{ marginBottom: '12px', padding: '10px', background: '#EFF6FF', borderRadius: '6px', border: '1px solid #93C5FD' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <h5 style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#1E40AF' }}>Create Meeting</h5>
                              <button onClick={() => setShowDetailMeetingForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748b' }}>✕</button>
                            </div>
                            <form onSubmit={handleDetailCreateMeeting}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                                <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: '10px', fontWeight: '600' }}>Title *</label><input type="text" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailMeetingData.title} onChange={(e) => setDetailMeetingData({ ...detailMeetingData, title: e.target.value })} required /></div>
                                <div><label style={{ fontSize: '10px', fontWeight: '600' }}>From *</label><input type="datetime-local" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailMeetingData.from} onChange={(e) => setDetailMeetingData({ ...detailMeetingData, from: e.target.value })} required /></div>
                                <div><label style={{ fontSize: '10px', fontWeight: '600' }}>To *</label><input type="datetime-local" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailMeetingData.to} onChange={(e) => setDetailMeetingData({ ...detailMeetingData, to: e.target.value })} required /></div>
                                <div><label style={{ fontSize: '10px', fontWeight: '600' }}>Location</label><input type="text" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailMeetingData.location} onChange={(e) => setDetailMeetingData({ ...detailMeetingData, location: e.target.value })} /></div>
                                <div><label style={{ fontSize: '10px', fontWeight: '600' }}>Type</label><select className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailMeetingData.meetingType} onChange={(e) => setDetailMeetingData({ ...detailMeetingData, meetingType: e.target.value })}><option value="Online">Online</option><option value="In-Person">In-Person</option></select></div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={() => setShowDetailMeetingForm(false)}>Cancel</button>
                                <button type="submit" className="crm-btn crm-btn-primary crm-btn-sm" style={{ fontSize: '10px', padding: '3px 8px' }}>Create</button>
                              </div>
                            </form>
                          </div>
                        )}

                        {/* Call Form */}
                        {showDetailCallForm && (
                          <div style={{ marginBottom: '12px', padding: '10px', background: '#FEF3C7', borderRadius: '6px', border: '1px solid #FCD34D' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <h5 style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#92400E' }}>Log Call</h5>
                              <button onClick={() => setShowDetailCallForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748b' }}>✕</button>
                            </div>
                            <form onSubmit={handleDetailCreateCall}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                                <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: '10px', fontWeight: '600' }}>Subject *</label><input type="text" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailCallData.subject} onChange={(e) => setDetailCallData({ ...detailCallData, subject: e.target.value })} required /></div>
                                <div><label style={{ fontSize: '10px', fontWeight: '600' }}>Call Time *</label><input type="datetime-local" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailCallData.callStartTime} onChange={(e) => setDetailCallData({ ...detailCallData, callStartTime: e.target.value })} required /></div>
                                <div><label style={{ fontSize: '10px', fontWeight: '600' }}>Duration (min)</label><input type="number" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailCallData.callDuration} onChange={(e) => setDetailCallData({ ...detailCallData, callDuration: e.target.value })} min="0" /></div>
                                <div><label style={{ fontSize: '10px', fontWeight: '600' }}>Type</label><select className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailCallData.callType} onChange={(e) => setDetailCallData({ ...detailCallData, callType: e.target.value })}><option value="Outbound">Outbound</option><option value="Inbound">Inbound</option><option value="Missed">Missed</option></select></div>
                                <div><label style={{ fontSize: '10px', fontWeight: '600' }}>Result</label><select className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailCallData.callResult} onChange={(e) => setDetailCallData({ ...detailCallData, callResult: e.target.value })}><option value="Interested">Interested</option><option value="Not Interested">Not Interested</option><option value="No Answer">No Answer</option><option value="Call Back Later">Callback</option><option value="Completed">Completed</option></select></div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={() => setShowDetailCallForm(false)}>Cancel</button>
                                <button type="submit" className="crm-btn crm-btn-warning crm-btn-sm" style={{ fontSize: '10px', padding: '3px 8px', background: '#F59E0B', color: 'white' }}>Log Call</button>
                              </div>
                            </form>
                          </div>
                        )}

                        {/* Open Activities */}
                        <div style={{ marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Open Activities ({detailTasks.filter(t => t.status !== 'Completed').length + detailMeetings.filter(m => m.status === 'Scheduled').length})</h4>
                          {detailTasks.filter(t => t.status !== 'Completed').length === 0 && detailMeetings.filter(m => m.status === 'Scheduled').length === 0 && detailCalls.filter(c => c.callResult !== 'Completed').length === 0 ? (
                            <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '6px' }}>No open activities</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {detailTasks.filter(t => t.status !== 'Completed').map(task => (
                                <div key={task._id} style={{ padding: '10px', background: '#F0FDF4', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#166534' }}>Task</span>
                                    <span style={{ fontSize: '10px', background: task.priority === 'High' ? '#FEE2E2' : '#E0E7FF', color: task.priority === 'High' ? '#991B1B' : '#3730A3', padding: '1px 6px', borderRadius: '4px' }}>{task.priority}</span>
                                  </div>
                                  <p style={{ fontSize: '12px', fontWeight: '600', margin: '0 0 4px 0' }}>{task.subject}</p>
                                  <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                                </div>
                              ))}
                              {detailMeetings.filter(m => m.status === 'Scheduled').map(meeting => (
                                <div key={meeting._id} style={{ padding: '10px', background: '#EFF6FF', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <Calendar className="h-3 w-3 text-blue-600" />
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#1E40AF' }}>Meeting</span>
                                  </div>
                                  <p style={{ fontSize: '12px', fontWeight: '600', margin: '0 0 4px 0' }}>{meeting.title}</p>
                                  <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>{new Date(meeting.from).toLocaleString()}</p>
                                </div>
                              ))}
                              {detailCalls.filter(c => c.callResult !== 'Completed').map(call => (
                                <div key={call._id} style={{ padding: '10px', background: '#FEF3C7', borderRadius: '6px', border: '1px solid #FCD34D' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <PhoneCall className="h-3 w-3 text-yellow-600" />
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#92400E' }}>Call</span>
                                    <span style={{ fontSize: '10px', background: '#FEE2E2', color: '#991B1B', padding: '1px 6px', borderRadius: '4px' }}>{call.callResult}</span>
                                  </div>
                                  <p style={{ fontSize: '12px', fontWeight: '600', margin: '0 0 4px 0' }}>{call.subject}</p>
                                  <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>{new Date(call.callStartTime).toLocaleString()}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Closed Activities */}
                        <div>
                          <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Closed Activities ({detailTasks.filter(t => t.status === 'Completed').length + detailMeetings.filter(m => m.status === 'Completed').length})</h4>
                          {detailTasks.filter(t => t.status === 'Completed').length === 0 && detailMeetings.filter(m => m.status === 'Completed').length === 0 ? (
                            <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '6px' }}>No closed activities</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {detailTasks.filter(t => t.status === 'Completed').map(task => (
                                <div key={task._id} style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <CheckCircle2 className="h-3 w-3 text-gray-500" />
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Task</span>
                                    <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '4px' }}>Completed</span>
                                  </div>
                                  <p style={{ fontSize: '12px', fontWeight: '600', margin: 0, color: '#64748b' }}>{task.subject}</p>
                                </div>
                              ))}
                              {detailMeetings.filter(m => m.status === 'Completed').map(meeting => (
                                <div key={meeting._id} style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <Calendar className="h-3 w-3 text-gray-500" />
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Meeting</span>
                                    <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '4px' }}>Completed</span>
                                  </div>
                                  <p style={{ fontSize: '12px', fontWeight: '600', margin: 0, color: '#64748b' }}>{meeting.title}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes Tab */}
                    {detailActiveTab === 'notes' && (
                      <div>
                        <button className="crm-btn crm-btn-sm crm-btn-primary" style={{ fontSize: '11px', padding: '4px 10px', marginBottom: '12px' }} onClick={() => { closeDetailForms(); setShowDetailNoteForm(true); }}>+ Add Note</button>

                        {/* Note Form */}
                        {showDetailNoteForm && (
                          <div style={{ marginBottom: '12px', padding: '10px', background: '#FDF4FF', borderRadius: '6px', border: '1px solid #E879F9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <h5 style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#86198F' }}>Add Note</h5>
                              <button onClick={() => setShowDetailNoteForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748b' }}>✕</button>
                            </div>
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

                        {/* Notes List */}
                        {detailNotes.length === 0 ? (
                          <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '20px', background: '#f9fafb', borderRadius: '6px' }}>No notes found</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {detailNotes.map(note => (
                              <div key={note._id} style={{ padding: '12px', background: '#FDF4FF', borderRadius: '8px', border: '1px solid #F5D0FE' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                  <FileText className="h-4 w-4 text-purple-600" />
                                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#86198F' }}>{note.title}</span>
                                </div>
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
                <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Failed to load lead details</div>
              )}
            </div>
          </div>
        )}

        {/* ── DRAG DIVIDER ── */}
        {(selectedLeadId || showCreateForm) && !detailExpanded && (
          <div onMouseDown={handleDividerDrag}
            title="Drag to resize"
            style={{ width: '6px', flexShrink: 0, background: '#e2e8f0', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', position: 'relative', zIndex: 10 }}
            onMouseEnter={e => e.currentTarget.style.background = '#a5b4fc'}
            onMouseLeave={e => e.currentTarget.style.background = '#e2e8f0'}>
            <div style={{ width: '2px', height: '40px', borderRadius: '99px', background: 'rgba(0,0,0,0.15)' }} />
          </div>
        )}

        {/* ── RIGHT: Lead List ── */}
        <div style={{
          flex: (selectedLeadId || showCreateForm) && !detailExpanded ? `0 0 ${100 - detailPanelWidth}%` : '1 1 100%',
          minWidth: 0,
          overflow: 'auto'
        }}>


      {/* ── FILTER BAR ── */}
      <div style={{ background:'white', borderRadius:'14px', padding:'12px 16px', marginBottom:'16px', border:'1.5px solid #e2e8f0', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', display:'flex', flexWrap:'wrap', gap:'10px', alignItems:'center' }}>
        {/* Action buttons — LEFT */}
        {hasPermission('field_management', 'read') && (
          <button onClick={() => { closeAllForms(); setShowAddFieldForm(false); setShowManageFields(v => !v); }}
            style={{ display:'flex', alignItems:'center', gap:'6px', background:'linear-gradient(135deg,#4A90E2 0%,#2c5364 100%)', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 16px', fontWeight:'600', cursor:'pointer', fontSize:'13px' }}>
            <Settings className="h-4 w-4" /> Manage Fields
          </button>
        )}
        <button className="crm-btn crm-btn-primary" onClick={() => {
          if (!canCreateLead) { setError('Access Restricted: You do not have permission to create leads.'); return; }
          closeAllForms(); setSelectedLeadId(null); setSelectedLeadData(null); setDetailExpanded(false); resetForm(); setWizardStep(0); setShowCreateForm(true);
        }}>
          + New Lead
        </button>
        {/* Search */}
        <div style={{ position:'relative', flex:'1', minWidth:'200px', maxWidth:'280px' }}>
          <span style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', fontSize:'13px', pointerEvents:'none', color:'#94a3b8' }}>🔍</span>
          <input type="text" placeholder="Search leads..." value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            onFocus={e => { e.target.style.borderColor='#6366f1'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.12)'; }}
            onBlur={e => { e.target.style.borderColor='#e2e8f0'; e.target.style.background='#f8fafc'; e.target.style.boxShadow='none'; }}
            style={{ width:'100%', padding:'9px 12px 9px 34px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', background:'#f8fafc', outline:'none', boxSizing:'border-box', transition:'all 0.2s', color:'#374151' }} />
        </div>
        {/* Status */}
        <select value={filters.leadStatus} onChange={(e) => handleFilterChange('leadStatus', e.target.value)}
          style={{ padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', background:'#f8fafc', cursor:'pointer', fontWeight:'500', color:'#374151', outline:'none' }}>
          <option value="">All Status</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Unqualified">Unqualified</option>
          <option value="Lost">Lost</option>
        </select>
        {/* Source */}
        <select value={filters.leadSource} onChange={(e) => handleFilterChange('leadSource', e.target.value)}
          style={{ padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', background:'#f8fafc', cursor:'pointer', fontWeight:'500', color:'#374151', outline:'none' }}>
          <option value="">All Sources</option>
          <option value="Website">Website</option>
          <option value="Referral">Referral</option>
          <option value="Campaign">Campaign</option>
          <option value="Cold Call">Cold Call</option>
          <option value="Social Media">Social Media</option>
        </select>
        {/* Rating */}
        <select value={filters.rating} onChange={(e) => handleFilterChange('rating', e.target.value)}
          style={{ padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', background:'#f8fafc', cursor:'pointer', fontWeight:'500', color:'#374151', outline:'none' }}>
          <option value="">All Ratings</option>
          <option value="Hot">🔥 Hot</option>
          <option value="Warm">🌤 Warm</option>
          <option value="Cold">❄️ Cold</option>
        </select>
        <div style={{ flex:1 }} />
        {/* View toggle */}
        <div style={{ display:'flex', background:'#f1f5f9', borderRadius:'10px', padding:'3px', border:'1.5px solid #e2e8f0' }}>
          {[['table', <List className="h-3.5 w-3.5" />, 'List'], ['grid', <LayoutGrid className="h-3.5 w-3.5" />, 'Grid']].map(([mode, icon, lbl]) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 13px', borderRadius:'8px', border:'none', fontSize:'12px', fontWeight:'600', cursor:'pointer', transition:'all 0.18s', background: viewMode === mode ? 'white' : 'transparent', color: viewMode === mode ? '#0f172a' : '#94a3b8', boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
              {icon} {lbl}
            </button>
          ))}
        </div>
        {/* Bulk assign */}
        {selectedLeads.length > 0 && (
          <button onClick={() => { closeAllForms(); setShowAssignGroupForm(true); }}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 14px', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', fontSize:'13px', fontWeight:'600', cursor:'pointer', boxShadow:'0 2px 8px rgba(245,158,11,0.3)' }}>
            <Users className="h-4 w-4" /> Assign {selectedLeads.length}
          </button>
        )}
        {/* Bulk Upload */}
        {canImportLeads && (
          <button className="crm-btn crm-btn-outline" onClick={() => { closeAllForms(); setShowBulkUploadForm(true); }}>
            <Upload className="h-4 w-4 mr-1" /> Bulk Upload
          </button>
        )}
      </div>
      {/* Inline Add Product Form - Compact */}
      {showAddProductForm && (
        <div className="crm-card" style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e3c72' }}>Add New Product</h3>
            <button onClick={() => { setShowAddProductForm(false); setShowCreateForm(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b', padding: '2px 6px' }}>✕</button>
          </div>
          <form onSubmit={handleCreateProductFromLead}>
            <div style={{ padding: '10px' }}>
              <div className="resp-grid-6">
                <div>
                  <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: '#374151' }}>Product Name *</label>
                  <input type="text" name="name" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={productFormData.name} onChange={handleProductFormChange} required placeholder="CRM Software" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: '#374151' }}>Article Number *</label>
                  <input type="text" name="articleNumber" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={productFormData.articleNumber} onChange={handleProductFormChange} required placeholder="CRM-001" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: '#374151' }}>Category *</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <select name="category" className="crm-form-select" style={{ flex: 1, padding: '4px 6px', fontSize: '11px' }} value={productFormData.category} onChange={handleProductFormChange} required>
                      <option value="">Select</option>
                      {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                    </select>
                    <button type="button" className="crm-btn crm-btn-outline crm-btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => { setShowAddProductForm(false); setShowCreateCategoryForm(true); }}>+</button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: '#374151' }}>Price *</label>
                  <input type="number" name="price" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={productFormData.price} onChange={handleProductFormChange} required min="0" step="0.01" placeholder="0.00" />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', padding: '6px 10px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => { setShowAddProductForm(false); setShowCreateForm(true); }}>Cancel</button>
              <button type="submit" className="crm-btn crm-btn-primary crm-btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }}>Create & Select</button>
            </div>
          </form>
        </div>
      )}

      {/* Inline Create Category Form - Compact */}
      {showCreateCategoryForm && (
        <div className="crm-card" style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e3c72' }}>Create New Category</h3>
            <button onClick={() => { setShowCreateCategoryForm(false); setShowAddProductForm(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b', padding: '2px 6px' }}>✕</button>
          </div>
          <form onSubmit={handleCreateCategory}>
            <div style={{ padding: '10px' }}>
              <div style={{ maxWidth: '250px' }}>
                <label style={{ display: 'block', marginBottom: '2px', fontSize: '10px', fontWeight: '600', color: '#374151' }}>Category Name *</label>
                <input type="text" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} required placeholder="Software, Hardware" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', padding: '6px 10px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => { setShowCreateCategoryForm(false); setShowAddProductForm(true); }}>Cancel</button>
              <button type="submit" className="crm-btn crm-btn-primary crm-btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }}>Create</button>
            </div>
          </form>
        </div>
      )}

      {/* Inline Bulk Upload Form - Compact */}
      {showBulkUploadForm && (
        <div className="crm-card" style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e3c72' }}>Bulk Upload Leads</h3>
            <button onClick={() => setShowBulkUploadForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b', padding: '2px 6px' }}>✕</button>
          </div>
          <div style={{ padding: '10px' }}>
            <BulkUploadForm onClose={() => setShowBulkUploadForm(false)} onSuccess={loadLeads} />
          </div>
        </div>
      )}

      {/* Inline Assign Group Form - Compact */}
      {showAssignGroupForm && (
        <div className="crm-card" style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e3c72' }}>Assign Leads to Group</h3>
            <button onClick={() => { setShowAssignGroupForm(false); setSelectedGroupForAssignment(null); setGroupMembers([]); setSelectedMembers([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b', padding: '2px 6px' }}>✕</button>
          </div>
          <div style={{ padding: '10px' }}>
            <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '8px' }}>Assigning {selectedLeads.length} selected lead{selectedLeads.length > 1 ? 's' : ''}</p>

            {!selectedGroupForAssignment ? (
              <div>
                <h4 style={{ fontSize: '11px', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Step 1: Select Group</h4>
                <div className="resp-grid-4" style={{gap:'6px'}}>
                  {groups.map((group) => (
                    <button key={group._id} className="crm-btn crm-btn-outline crm-btn-sm" style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '6px 8px', fontSize: '11px' }} onClick={() => handleGroupSelection(group._id)}>
                      {group.name}
                      {group.category && <Badge variant="secondary" className="ml-1" style={{ fontSize: '9px' }}>{group.category}</Badge>}
                    </button>
                  ))}
                </div>
                {groups.length === 0 && <p style={{ textAlign: 'center', color: '#6B7280', padding: '12px', fontSize: '11px' }}>No groups available.</p>}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Step 2: Select Members</h4>
                  <button className="crm-btn crm-btn-sm crm-btn-outline" style={{ padding: '3px 8px', fontSize: '10px' }} onClick={() => { setSelectedGroupForAssignment(null); setGroupMembers([]); setSelectedMembers([]); }}>
                    ← Back
                  </button>
                </div>

                {groupMembers.length > 0 ? (
                  <>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                      <button className="crm-btn crm-btn-sm crm-btn-outline" style={{ padding: '3px 8px', fontSize: '10px' }} onClick={() => setSelectedMembers(groupMembers.map(m => m._id))}>Select All</button>
                      <button className="crm-btn crm-btn-sm crm-btn-outline" style={{ padding: '3px 8px', fontSize: '10px' }} onClick={() => setSelectedMembers([])}>Deselect All</button>
                    </div>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px' }}>
                      {groupMembers.map((member) => (
                        <label key={member._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', border: selectedMembers.includes(member._id) ? '1px solid #3B82F6' : '1px solid transparent', background: selectedMembers.includes(member._id) ? '#EFF6FF' : 'transparent', marginBottom: '4px' }}>
                          <Checkbox checked={selectedMembers.includes(member._id)} onCheckedChange={(checked) => {
                            setSelectedMembers(checked ? [...selectedMembers, member._id] : selectedMembers.filter(id => id !== member._id));
                          }} />
                          <div>
                            <p style={{ fontWeight: '500', fontSize: '11px', margin: 0 }}>{member.firstName} {member.lastName}</p>
                            <p style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>{member.email}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                      <span style={{ fontSize: '11px', color: '#6B7280' }}>{selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected</span>
                      <button className="crm-btn crm-btn-primary crm-btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={handleBulkAssignToGroup} disabled={selectedMembers.length === 0}>Assign</button>
                    </div>
                  </>
                ) : (
                  <p style={{ textAlign: 'center', color: '#6B7280', padding: '20px', fontSize: '11px' }}>No members in this group.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manage Fields Panel */}
      {showManageFields && (
        <ManageFieldsPanel
          allFieldDefs={allFieldDefs}
          togglingField={togglingField}
          onToggle={handleToggleField}
          onClose={() => { setShowManageFields(false); setShowAddFieldForm(false); }}
          onAdd={handleAddCustomFieldFromPanel}
          onDelete={handleDeleteCustomField}
          canAdd={hasPermission('field_management', 'create')}
          canToggle={hasPermission('field_management', 'update')}
          canDelete={hasPermission('field_management', 'delete')}
          entityLabel="Lead"
          sections={LEAD_SECTIONS}
        />
      )}

      {/* ── LEAD LIST ── */}
      <div style={{ background:'white', borderRadius:'16px', border:'1.5px solid #e2e8f0', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden' }}>
        {/* Card header */}
        <div style={{ padding:'14px 20px', borderBottom:'1.5px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', background:'linear-gradient(135deg,#fafbff,#f8fafc)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'9px', background:'linear-gradient(135deg,#1e3c72,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Target className="h-4 w-4" style={{ color:'#fff' }} />
            </div>
            <span style={{ fontSize:'14px', fontWeight:'700', color:'#0f172a' }}>{viewMode === 'grid' ? 'Lead Cards' : 'Lead List'}</span>
            <span style={{ fontSize:'12px', fontWeight:'700', background:'#ede9fe', color:'#5b21b6', padding:'2px 9px', borderRadius:'99px' }}>{pagination.total}</span>
          </div>
          {selectedLeads.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'5px 12px', background:'#eff6ff', borderRadius:'8px', border:'1px solid #93c5fd' }}>
              <span style={{ fontSize:'12px', fontWeight:'700', color:'#1e40af' }}>{selectedLeads.length} selected</span>
              <button onClick={() => { closeAllForms(); setShowAssignGroupForm(true); }}
                style={{ padding:'4px 10px', borderRadius:'6px', border:'none', background:'#3b82f6', color:'#fff', fontSize:'11px', fontWeight:'600', cursor:'pointer' }}>
                Assign to Group
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'70px' }}>
            <Loader2 className="h-8 w-8 animate-spin" style={{ color:'#6366f1' }} />
          </div>
        ) : leads.length === 0 ? (
          <div style={{ textAlign:'center', padding:'70px 20px' }}>
            <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'linear-gradient(135deg,#ede9fe,#dbeafe)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 4px 20px rgba(99,102,241,0.15)' }}>
              <Target className="h-9 w-9" style={{ color:'#6366f1' }} />
            </div>
            <p style={{ fontSize:'18px', fontWeight:'700', color:'#0f172a', marginBottom:'8px' }}>No leads found</p>
            <p style={{ color:'#94a3b8', marginBottom:'24px', fontSize:'14px' }}>Create your first lead to start managing your pipeline!</p>
            <button onClick={() => {
                if (!canCreateLead) { setError('Access Restricted: You do not have permission to create leads.'); return; }
                resetForm(); setWizardStep(0); setShowCreateForm(true);
              }}
              style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 24px', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#1e3c72,#3b82f6)', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer', boxShadow:'0 4px 16px rgba(59,130,246,0.35)' }}>
              <Plus className="h-4 w-4" /> Create First Lead
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── GRID VIEW ── */
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px, 1fr))', gap:'16px', padding:'20px' }}>
            {leads.map((lead) => {
              const sc = getSC(lead.leadStatus);
              const isSelected = selectedLeadId === lead._id;
              return (
                <div key={lead._id} onClick={() => handleLeadClick(lead._id)}
                  onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.12)'; } }}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)'; } }}
                  style={{ background: isSelected ? '#fafbff' : 'white', borderRadius:'14px', border: isSelected ? '2px solid #6366f1' : '1.5px solid #e5e7eb', boxShadow: isSelected ? '0 6px 24px rgba(99,102,241,0.18)' : '0 2px 12px rgba(0,0,0,0.06)', cursor:'pointer', overflow:'hidden', transition:'all 0.22s', position:'relative' }}>
                  {/* Status bar */}
                  <div style={{ height:'4px', background: sc.bg }} />
                  <div style={{ padding:'16px' }}>
                    {/* Top: avatar + name + status + delete */}
                    <div style={{ display:'flex', alignItems:'flex-start', gap:'11px', marginBottom:'12px' }}>
                      <div style={{ width:'42px', height:'42px', borderRadius:'11px', background: sc.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:'800', color:'#fff', flexShrink:0, boxShadow:'0 3px 10px rgba(0,0,0,0.15)' }}>
                        {(lead.customerName?.[0] || '?').toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <h3 style={{ margin:'0 0 2px', fontSize:'14px', fontWeight:'800', color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.customerName}</h3>
                        <p style={{ margin:0, fontSize:'11px', color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {[lead.jobTitle, lead.company].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'4px', flexShrink:0 }}>
                        <span style={{ fontSize:'10px', fontWeight:'700', background: sc.pill, color: sc.pillTxt, padding:'3px 8px', borderRadius:'99px', whiteSpace:'nowrap' }}>{lead.leadStatus || 'New'}</span>
                        {canDeleteLead && (
                          <button onClick={(e) => handleDeleteLead(e, lead._id)}
                            onMouseEnter={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.background='#fee2e2'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity='0.5'; e.currentTarget.style.background='transparent'; }}
                            style={{ background:'transparent', border:'none', cursor:'pointer', color:'#ef4444', padding:'3px', borderRadius:'5px', display:'flex', alignItems:'center', opacity:0.5, transition:'all 0.15s' }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Contact info */}
                    <div style={{ display:'flex', flexDirection:'column', gap:'5px', marginBottom:'12px' }}>
                      {lead.email && (
                        <div style={{ display:'flex', alignItems:'center', gap:'7px', fontSize:'12px', color:'#475569' }}>
                          <Mail className="h-3 w-3" style={{ color:'#3b82f6', flexShrink:0 }} />
                          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.email}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div style={{ display:'flex', alignItems:'center', gap:'7px', fontSize:'12px', color:'#475569' }}>
                          <Phone className="h-3 w-3" style={{ color:'#10b981', flexShrink:0 }} />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {lead.leadSource && (
                        <div style={{ display:'flex', alignItems:'center', gap:'7px', fontSize:'12px', color:'#475569' }}>
                          <Globe className="h-3 w-3" style={{ color:'#8b5cf6', flexShrink:0 }} />
                          <span>{lead.leadSource}</span>
                        </div>
                      )}
                    </div>
                    {/* Footer */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'10px', borderTop:'1px solid #f1f5f9' }}>
                      {lead.estimatedDealValue
                        ? <span style={{ fontSize:'13px', fontWeight:'800', color:'#0f172a' }}>${Number(lead.estimatedDealValue).toLocaleString()}</span>
                        : <span style={{ fontSize:'12px', color:'#cbd5e1' }}>No deal value</span>}
                      {lead.expectedCloseDate && (
                        <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#94a3b8' }}>
                          <Calendar className="h-3 w-3" />
                          {new Date(lead.expectedCloseDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── TABLE VIEW ── */
          <div style={{ overflowX:'auto' }}>
            <table ref={tableRef} style={{ borderCollapse:'collapse', fontSize:'13px', tableLayout:'fixed', width:'max-content', minWidth:'100%' }}>
              <colgroup>
                <col style={{ width:'44px' }} />
                <col data-col="__num__" style={{ width: colWidths['__num__'] || 60 }} />
                {displayColumns.map(col => (
                  <col key={col} data-col={col} style={{ width: colWidths[col] || DEFAULT_COL_WIDTH[col] || 150 }} />
                ))}
                {canDeleteLead && <col style={{ width:'52px' }} />}
              </colgroup>
              <thead>
                <tr style={{ background:'linear-gradient(135deg,#f8fafc,#f1f5f9)', borderBottom:'2px solid #e2e8f0' }}>
                  <th style={{ padding:'8px 12px', position:'relative' }}>
                    <Checkbox checked={selectedLeads.length === leads.length && leads.length > 0} onCheckedChange={(checked) => setSelectedLeads(checked ? leads.map(l => l._id) : [])} />
                  </th>
                  <th style={{ padding:'8px 6px 8px 12px', textAlign:'left', fontSize:'10px', fontWeight:'800', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', position:'relative', userSelect:'none' }}>
                    #
                    <span onMouseDown={e => startResize(e, '__num__')}
                      style={{ position:'absolute', right:0, top:'20%', bottom:'20%', width:'3px', cursor:'col-resize', zIndex:2, background:'#cbd5e1', borderRadius:'2px', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='#6366f1'}
                      onMouseLeave={e => e.currentTarget.style.background='#cbd5e1'} />
                  </th>
                  {displayColumns.map((col) => (
                    <th key={col} style={{ padding:'8px 6px 8px 12px', textAlign:'left', fontSize:'10px', fontWeight:'800', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', position:'relative', userSelect:'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {formatFieldName(col)}
                      <span onMouseDown={e => startResize(e, col)}
                        style={{ position:'absolute', right:0, top:'20%', bottom:'20%', width:'3px', cursor:'col-resize', zIndex:2, background:'#cbd5e1', borderRadius:'2px', transition:'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background='#6366f1'}
                        onMouseLeave={e => e.currentTarget.style.background='#cbd5e1'} />
                    </th>
                  ))}
                  {canDeleteLead && <th style={{ padding:'8px 12px' }} />}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const sc = getSC(lead.leadStatus);
                  const isSelected = selectedLeadId === lead._id;
                  return (
                    <tr key={lead._id} onClick={() => handleLeadClick(lead._id)}
                      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background='#f8fafc'; } }}
                      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background='white'; } }}
                      style={{ cursor:'pointer', background: isSelected ? '#fafbff' : 'white', borderBottom:'1px solid #f1f5f9', borderLeft: isSelected ? '3px solid #6366f1' : '3px solid transparent', transition:'all 0.15s' }}>
                      <td style={{ padding:'7px 12px', whiteSpace:'nowrap', overflow:'hidden' }} onClick={e => e.stopPropagation()}>
                        <Checkbox checked={selectedLeads.includes(lead._id)} onCheckedChange={(checked) => setSelectedLeads(checked ? [...selectedLeads, lead._id] : selectedLeads.filter(id => id !== lead._id))} />
                      </td>
                      <td style={{ padding:'7px 12px', whiteSpace:'nowrap', overflow:'hidden' }}>
                        <span style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', background:'#f1f5f9', padding:'2px 6px', borderRadius:'4px' }}>{lead.leadNumber || '—'}</span>
                      </td>
                      {displayColumns.map((col) => (
                        <td key={col} style={{ padding:'7px 12px', whiteSpace:'nowrap' }}>
                          {col === 'customerName' ? (
                            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                              <div style={{ width:'28px', height:'28px', borderRadius:'7px', background: sc.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'800', color:'#fff', flexShrink:0 }}>
                                {String(getFieldValue(lead, 'customerName') || '?')[0].toUpperCase()}
                              </div>
                              <div style={{ minWidth:0 }}>
                                <div style={{ fontSize:'12px', fontWeight:'700', color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{getFieldValue(lead, 'customerName') || '—'}</div>
                                {lead.company && <div style={{ fontSize:'10px', color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.company}</div>}
                              </div>
                            </div>
                          ) : col === 'leadStatus' ? (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'2px 8px', borderRadius:'99px', fontSize:'10px', fontWeight:'700', background: sc.pill, color: sc.pillTxt }}>
                              <span style={{ width:'5px', height:'5px', borderRadius:'50%', background: sc.dot, flexShrink:0 }} />{lead.leadStatus || 'New'}
                            </span>
                          ) : col === 'priority' ? (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'2px 8px', borderRadius:'99px', fontSize:'10px', fontWeight:'700',
                              background: lead.priority === 'High' ? '#fee2e2' : lead.priority === 'Medium' ? '#fef3c7' : '#f0fdf4',
                              color: lead.priority === 'High' ? '#991b1b' : lead.priority === 'Medium' ? '#92400e' : '#166534' }}>
                              {lead.priority === 'High' ? '🔴' : lead.priority === 'Medium' ? '🟡' : '🟢'} {lead.priority || '—'}
                            </span>
                          ) : (
                            <div style={{ fontSize:'12px', color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'100%' }}>
                              {getMaskedValue(col, getFieldValue(lead, col)) || <span style={{ color:'#cbd5e1' }}>—</span>}
                            </div>
                          )}
                        </td>
                      ))}
                      {canDeleteLead && (
                        <td style={{ padding:'7px 12px', whiteSpace:'nowrap', overflow:'hidden' }} onClick={e => e.stopPropagation()}>
                          <button onClick={(e) => handleDeleteLead(e, lead._id)}
                            onMouseEnter={e => { e.currentTarget.style.background='#ef4444'; e.currentTarget.style.color='#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='#fee2e2'; e.currentTarget.style.color='#ef4444'; }}
                            style={{ background:'#fee2e2', border:'none', borderRadius:'6px', padding:'4px 6px', cursor:'pointer', color:'#ef4444', display:'flex', alignItems:'center', transition:'all 0.15s' }}>
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PAGINATION ── */}
        {pagination.pages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderTop:'1.5px solid #f1f5f9', background:'#fafbff' }}>
            <span style={{ fontSize:'13px', color:'#64748b', fontWeight:'600' }}>
              Page <strong style={{ color:'#0f172a' }}>{pagination.page}</strong> of {pagination.pages} &nbsp;·&nbsp; {pagination.total} leads
            </span>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1}
                onMouseEnter={e => { if (pagination.page !== 1) { e.currentTarget.style.background='#1e3c72'; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='#1e3c72'; } }}
                onMouseLeave={e => { e.currentTarget.style.background='white'; e.currentTarget.style.color= pagination.page === 1 ? '#cbd5e1' : '#374151'; e.currentTarget.style.borderColor='#e2e8f0'; }}
                style={{ display:'flex', alignItems:'center', gap:'4px', padding:'7px 15px', borderRadius:'9px', border:'1.5px solid #e2e8f0', background:'white', color: pagination.page === 1 ? '#cbd5e1' : '#374151', fontSize:'13px', fontWeight:'600', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer', transition:'all 0.15s' }}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.pages}
                onMouseEnter={e => { if (pagination.page !== pagination.pages) { e.currentTarget.style.background='#1e3c72'; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='#1e3c72'; } }}
                onMouseLeave={e => { e.currentTarget.style.background='white'; e.currentTarget.style.color= pagination.page === pagination.pages ? '#cbd5e1' : '#374151'; e.currentTarget.style.borderColor='#e2e8f0'; }}
                style={{ display:'flex', alignItems:'center', gap:'4px', padding:'7px 15px', borderRadius:'9px', border:'1.5px solid #e2e8f0', background:'white', color: pagination.page === pagination.pages ? '#cbd5e1' : '#374151', fontSize:'13px', fontWeight:'600', cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer', transition:'all 0.15s' }}>
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

        </div>
        {/* End Left Side */}

      </div>
      {/* End Split View Container */}

    </DashboardLayout>
  );
};

export default Leads;
