import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { leadService } from '../services/leadService';
import { productItemService } from '../services/productItemService';
import { productCategoryService } from '../services/productCategoryService';
import { verificationService, debounce } from '../services/verificationService';
import fieldDefinitionService from '../services/fieldDefinitionService';
import { groupService } from '../services/groupService';
import { useAuth } from '../context/AuthContext';
import TooltipButton from '../components/common/TooltipButton';
import DynamicField from '../components/DynamicField';
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
} from 'lucide-react';

const Leads = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [leads, setLeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('table');

  const [emailVerification, setEmailVerification] = useState({ status: 'pending', message: '', isValid: null });
  const [phoneVerification, setPhoneVerification] = useState({ status: 'pending', message: '', isValid: null });

  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '', leadStatus: '', leadSource: '', rating: '', assignedGroup: '', unassigned: false });

  const [groups, setGroups] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showAssignGroupForm, setShowAssignGroupForm] = useState(false);
  const [selectedGroupForAssignment, setSelectedGroupForAssignment] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [displayColumns, setDisplayColumns] = useState([]);

  const [stats, setStats] = useState({ total: 0, new: 0, qualified: 0, contacted: 0 });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkUploadForm, setShowBulkUploadForm] = useState(false);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [showCreateCategoryForm, setShowCreateCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

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
  }, [pagination.page, filters]);

  const loadProducts = async () => {
    try {
      const response = await productItemService.getAllProducts({ isActive: 'true' }, 1, 1000);
      if (response?.success && response.data) setProducts(response.data.products || []);
    } catch (err) { console.error('Load products error:', err); }
  };

  const loadCategories = async () => {
    try {
      const response = await productCategoryService.getAllCategories({ isActive: 'true' }, 1, 100);
      if (response?.success && response.data) setCategories(response.data.categories || []);
    } catch (err) { console.error('Load categories error:', err); }
  };

  const loadGroups = async () => {
    try {
      const data = await groupService.getGroups();
      setGroups(Array.isArray(data) ? data : data?.groups || []);
    } catch (err) { console.error('Load groups error:', err); }
  };

  const loadCustomFields = async () => {
    try {
      const response = await fieldDefinitionService.getFieldDefinitions('Lead', false);
      if (response && Array.isArray(response)) {
        const createFields = response.filter(field => field.isActive && field.showInCreate).sort((a, b) => a.displayOrder - b.displayOrder);
        setFieldDefinitions(createFields);
      }
    } catch (err) { console.error('Load field definitions error:', err); }
  };

  const extractColumns = (leadsData) => {
    if (!leadsData?.length) return [];
    const allKeys = new Set();
    const excludeKeys = ['_id', '__v', 'tenant', 'createdBy', 'lastModifiedBy', 'createdAt', 'updatedAt', 'isActive', 'isConverted', 'convertedDate', 'convertedAccount', 'convertedContact', 'convertedOpportunity', 'emailVerified', 'emailVerificationStatus', 'emailVerificationDetails', 'phoneVerified', 'phoneVerificationStatus', 'phoneVerificationDetails', 'emailOptOut', 'doNotCall', 'assignedGroup', 'assignedMembers', 'assignmentChain', 'dataCenterCandidateId', 'product', 'productDetails', 'owner'];

    leadsData.forEach(lead => {
      Object.keys(lead).forEach(key => {
        if (!excludeKeys.includes(key) && lead[key] != null && lead[key] !== '') allKeys.add(key);
      });
    });

    const columnsArray = Array.from(allKeys);
    const statusIndex = columnsArray.indexOf('leadStatus');
    if (statusIndex > -1) {
      columnsArray.splice(statusIndex, 1);
      columnsArray.push('leadStatus');
    }
    return columnsArray;
  };

  const getFieldValue = (lead, fieldName) => lead[fieldName] ?? null;

  const formatFieldValue = (value) => {
    if (value == null || value === '') return '-';
    if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return value.toString();
  };

  const formatFieldName = (fieldName) => fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();

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

        const newColumns = extractColumns(leadsData);
        if (newColumns.length > 0) setDisplayColumns([...new Set([...displayColumns, ...newColumns])]);

        setStats({
          total: response.data.pagination?.total || 0,
          new: leadsData.filter(l => l.leadStatus === 'New').length,
          qualified: leadsData.filter(l => l.leadStatus === 'Qualified').length,
          contacted: leadsData.filter(l => l.leadStatus === 'Contacted').length
        });
      } else {
        setError(response?.message || 'Failed to load leads');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load leads');
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
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
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
        product: formData.product,
        productDetails: formData.productDetails,
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined
      };

      await leadService.createLead(leadData);
      setSuccess('Lead created successfully!');
      setShowCreateForm(false);
      resetForm();
      loadLeads();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to create lead'); }
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
    } catch (err) { setError(err.response?.data?.message || 'Failed to create product'); }
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
    } catch (err) { setError(err.response?.data?.message || 'Failed to create category'); }
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
    } catch (err) { setError('Failed to load group members'); }
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
    } catch (err) { setError(err.response?.data?.message || 'Failed to assign leads'); }
  };

  const resetForm = () => {
    setFormData({ product: '', productDetails: { quantity: 1, requirements: '', estimatedBudget: '', priority: '', notes: '' } });
    setEmailVerification({ status: 'pending', message: '', isValid: null });
    setPhoneVerification({ status: 'pending', message: '', isValid: null });
    setFieldValues({});
    setFieldErrors({});
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

  const handleLeadClick = (leadId) => navigate(`/leads/${leadId}`);

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

  return (
    <DashboardLayout title="Leads">
      {success && <Alert variant="success" className="mb-4"><AlertDescription>{success}</AlertDescription></Alert>}
      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="stat-card">
          <div className="stat-icon"><Target className="h-5 w-5" /></div>
          <div>
            <p className="stat-value">{stats.total}</p>
            <p className="stat-label">Total Leads</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'}}><Target className="h-5 w-5" /></div>
          <div>
            <p className="stat-value text-blue-600">{stats.new}</p>
            <p className="stat-label">New Leads</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'}}><Target className="h-5 w-5" /></div>
          <div>
            <p className="stat-value text-green-600">{stats.qualified}</p>
            <p className="stat-label">Qualified</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)'}}><Target className="h-5 w-5" /></div>
          <div>
            <p className="stat-value text-purple-600">{stats.contacted}</p>
            <p className="stat-label">Contacted</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="crm-card mb-6">
        <div className="p-4">
          <div className="mb-4">
            <Input
              placeholder="Search leads..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <select className="crm-form-select" value={filters.leadStatus} onChange={(e) => handleFilterChange('leadStatus', e.target.value)}>
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Unqualified">Unqualified</option>
              <option value="Lost">Lost</option>
            </select>
            <select className="crm-form-select" value={filters.leadSource} onChange={(e) => handleFilterChange('leadSource', e.target.value)}>
              <option value="">All Sources</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Campaign">Campaign</option>
              <option value="Cold Call">Cold Call</option>
              <option value="Social Media">Social Media</option>
            </select>
            <select className="crm-form-select" value={filters.rating} onChange={(e) => handleFilterChange('rating', e.target.value)}>
              <option value="">All Ratings</option>
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Cold">Cold</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className={`crm-btn crm-btn-sm ${viewMode === 'table' ? 'crm-btn-primary' : 'crm-btn-outline'}`} onClick={() => setViewMode('table')}>Table</button>
              <button className={`crm-btn crm-btn-sm ${viewMode === 'grid' ? 'crm-btn-primary' : 'crm-btn-outline'}`} onClick={() => setViewMode('grid')}>Grid</button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginLeft: 'auto' }}>
              {selectedLeads.length > 0 && (
                <button className="crm-btn crm-btn-secondary" onClick={() => { closeAllForms(); setShowAssignGroupForm(true); }}>
                  Assign {selectedLeads.length} to Group
                </button>
              )}
              {canImportLeads && <button className="crm-btn crm-btn-outline" onClick={() => { closeAllForms(); setShowBulkUploadForm(true); }}>Bulk Upload</button>}
              {canCreateLead && <button className="crm-btn crm-btn-primary" onClick={() => { closeAllForms(); resetForm(); setShowCreateForm(true); }}>+ New Lead</button>}
            </div>
          </div>
        </div>
      </div>

      {/* Inline Create Lead Form - Compact */}
      {showCreateForm && (
        <div className="crm-card" style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e3c72' }}>Create New Lead</h3>
            <button onClick={() => { setShowCreateForm(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b', padding: '2px 6px' }}>✕</button>
          </div>
          <div style={{ padding: '10px' }}>
            <form onSubmit={handleCreateLead}>
              {(() => {
                const groupedFields = groupFieldsBySection(fieldDefinitions);
                const sectionOrder = ['Basic Information', 'Business Information', 'Communication Preferences', 'Social Media', 'Address', 'Additional Information', 'Lead Details', 'Lead Classification'];

                return sectionOrder.map(sectionName => {
                  const sectionFields = groupedFields[sectionName];
                  if (!sectionFields?.length) return null;

                  return (
                    <div key={sectionName} style={{ marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#374151', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{sectionName}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                        {sectionName === 'Basic Information' && (
                          <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: '#374151', marginBottom: '2px' }}>Lead Owner</label>
                            <input type="text" value={`${user?.firstName} ${user?.lastName}`} disabled style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#f9fafb', color: '#6b7280' }} />
                          </div>
                        )}
                        {sectionFields.map((field) => (
                          <div key={field._id} style={field.fieldType === 'textarea' ? { gridColumn: 'span 2' } : {}}>
                            {renderDynamicField(field)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}

              <div style={{ marginBottom: '8px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#374151', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product Information</h4>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, maxWidth: '200px' }}>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: '#374151', marginBottom: '2px' }}>Product (Optional)</label>
                    <select name="product" className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={formData.product} onChange={handleChange}>
                      <option value="">-None-</option>
                      {products.map(product => (
                        <option key={product._id} value={product._id}>{product.articleNumber} - {product.name}</option>
                      ))}
                    </select>
                  </div>
                  {canManageProducts && (
                    <button type="button" className="crm-btn crm-btn-outline crm-btn-sm" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => { setShowCreateForm(false); setShowAddProductForm(true); }}>
                      + Add Product
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                <button type="button" className="crm-btn crm-btn-outline crm-btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => { setShowCreateForm(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="crm-btn crm-btn-primary crm-btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }}>Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Add Product Form - Compact */}
      {showAddProductForm && (
        <div className="crm-card" style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e3c72' }}>Add New Product</h3>
            <button onClick={() => { setShowAddProductForm(false); setShowCreateForm(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b', padding: '2px 6px' }}>✕</button>
          </div>
          <form onSubmit={handleCreateProductFromLead}>
            <div style={{ padding: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
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

      {/* Lead List */}
      <div className="crm-card">
        <div className="crm-card-header">
          <h2 className="crm-card-title flex items-center gap-2">
            <Target className="h-5 w-5" />
            {viewMode === 'grid' ? 'Lead Cards' : 'Lead List'} ({pagination.total})
          </h2>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : leads.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>T</div>
              <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e3c72', marginBottom: '8px' }}>No leads found</p>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>Create your first lead to get started!</p>
              {canCreateLead && <button className="crm-btn crm-btn-primary" onClick={() => { resetForm(); setShowCreateForm(true); }}>+ Create First Lead</button>}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leads.map((lead) => (
                <div key={lead._id} className="grid-card" onClick={() => handleLeadClick(lead._id)}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="avatar">
                      {lead.firstName?.[0]}{lead.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-gray-800 text-lg truncate">{lead.firstName} {lead.lastName}</h3>
                      <p className="text-sm text-gray-500 font-semibold truncate">{lead.jobTitle} {lead.company && `at ${lead.company}`}</p>
                    </div>
                    {canDeleteLead && (
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => handleDeleteLead(e, lead._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2 mb-4">
                    <Badge variant={getStatusBadgeVariant(lead.leadStatus)}>{lead.leadStatus || 'New'}</Badge>
                    {lead.rating && <Badge variant="outline">{lead.rating}</Badge>}
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-500" /><span className="truncate">{lead.email}</span></div>
                    {lead.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-green-500" /><span>{lead.phone}</span></div>}
                    {lead.leadSource && <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-purple-500" /><span>{lead.leadSource}</span></div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLeads.length === leads.length && leads.length > 0}
                      onCheckedChange={(checked) => setSelectedLeads(checked ? leads.map(l => l._id) : [])}
                    />
                  </TableHead>
                  {displayColumns.map((column) => (
                    <TableHead key={column}>{formatFieldName(column)}</TableHead>
                  ))}
                  {canDeleteLead && <TableHead className="w-16">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleLeadClick(lead._id)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedLeads.includes(lead._id)}
                        onCheckedChange={(checked) => {
                          setSelectedLeads(checked ? [...selectedLeads, lead._id] : selectedLeads.filter(id => id !== lead._id));
                        }}
                      />
                    </TableCell>
                    {displayColumns.map((column) => (
                      <TableCell key={column}>
                        {column === 'leadStatus' ? (
                          <Badge variant={getStatusBadgeVariant(lead.leadStatus)}>{lead.leadStatus || 'New'}</Badge>
                        ) : (
                          <span className="truncate max-w-[200px] block">{formatFieldValue(getFieldValue(lead, column))}</span>
                        )}
                      </TableCell>
                    ))}
                    {canDeleteLead && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => handleDeleteLead(e, lead._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1}>
                <ChevronLeft className="h-4 w-4 mr-1" />Previous
              </Button>
              <span className="text-sm font-bold text-gray-700">Page {pagination.page} of {pagination.pages}</span>
              <Button variant="outline" onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.pages}>
                Next<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Leads;
