import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PinVerification from '../components/common/PinVerification';
import { leadService } from '../services/leadService';
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
} from 'lucide-react';

const Leads = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [filters, setFilters] = useState({ search: '', leadStatus: searchParams.get('status') || '', leadSource: '', rating: '', assignedGroup: '', unassigned: false });

  const [groups, setGroups] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showAssignGroupForm, setShowAssignGroupForm] = useState(false);
  const [selectedGroupForAssignment, setSelectedGroupForAssignment] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [displayColumns, setDisplayColumns] = useState([]);

  const [stats, setStats] = useState({ total: 0, new: 0, qualified: 0, contacted: 0 });

  // PIN Verification State
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingLeadId, setPendingLeadId] = useState(null);

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
  const [detailConversionData, setDetailConversionData] = useState({ createAccount: true, createContact: true, createOpportunity: false, accountName: '', opportunityName: '', opportunityAmount: '', closeDate: '' });

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

  // Masking functions for sensitive data (when PIN not verified)
  const maskEmail = (email) => {
    if (!email || isPinVerified) return email;
    const [name, domain] = email.split('@');
    if (!name || !domain) return '***@***.***';
    return name[0] + '***@' + domain[0] + '***.' + domain.split('.').pop();
  };

  const maskPhone = (phone) => {
    if (!phone || isPinVerified) return phone;
    return phone.slice(0, 2) + '******' + phone.slice(-2);
  };

  const maskName = (name) => {
    if (!name || isPinVerified) return name;
    return name[0] + '***';
  };

  // Check if field should be masked
  const sensitiveFields = ['email', 'phone', 'firstName', 'lastName', 'mobile', 'company'];

  const getMaskedValue = (fieldName, value) => {
    if (isPinVerified || !value) return value;
    if (fieldName === 'email') return maskEmail(value);
    if (fieldName === 'phone' || fieldName === 'mobile') return maskPhone(value);
    if (fieldName === 'firstName' || fieldName === 'lastName') return maskName(value);
    if (fieldName === 'company') return maskName(value);
    return value;
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
          accountName: response.data.company || `${response.data.firstName} ${response.data.lastName}`,
          opportunityName: `${response.data.company || response.data.firstName + ' ' + response.data.lastName} - Opportunity`
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

  // Handle lead click - check PIN first
  const handleLeadClick = (leadId) => {
    if (selectedLeadId === leadId) return;

    if (!isPinVerified) {
      // Need PIN verification first
      setPendingLeadId(leadId);
      setShowPinModal(true);
      return;
    }

    // Already verified, load directly
    loadLeadDetails(leadId);
  };

  // Handle PIN verification success
  const handlePinVerified = () => {
    setIsPinVerified(true);
    setShowPinModal(false);
    if (pendingLeadId) {
      loadLeadDetails(pendingLeadId);
      setPendingLeadId(null);
    }
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

  const closeSidePanel = () => {
    setSelectedLeadId(null);
    setSelectedLeadData(null);
    setDetailTasks([]);
    setDetailMeetings([]);
    setDetailCalls([]);
    setDetailNotes([]);
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
    } catch (err) { setError(err.message || 'Failed to create task'); }
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
    } catch (err) { setError('Failed to create meeting'); }
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
    } catch (err) { setError('Failed to log call'); }
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
    } catch (err) { setError(err.message || 'Failed to create note'); }
  };

  // Detail Panel - Edit Lead
  const openDetailEditForm = () => {
    if (!selectedLeadData) return;
    setDetailEditData({
      firstName: selectedLeadData.firstName,
      lastName: selectedLeadData.lastName,
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
    } catch (err) { setError(err.message || 'Failed to update lead'); }
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
    } catch (err) { setError(err.message || 'Failed to delete lead'); }
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
      const payload = {
        createAccount: detailConversionData.createAccount,
        createContact: detailConversionData.createContact,
        createOpportunity: detailConversionData.createOpportunity,
        accountData: detailConversionData.createAccount ? {
          accountName: detailConversionData.accountName,
          accountType: 'Customer',
          industry: selectedLeadData.industry,
          website: selectedLeadData.website,
          phone: selectedLeadData.phone,
          email: selectedLeadData.email
        } : {},
        contactData: detailConversionData.createContact ? {
          firstName: selectedLeadData.firstName,
          lastName: selectedLeadData.lastName,
          email: selectedLeadData.email,
          phone: selectedLeadData.phone,
          jobTitle: selectedLeadData.jobTitle
        } : {},
        opportunityData: detailConversionData.createOpportunity ? {
          opportunityName: detailConversionData.opportunityName,
          amount: parseFloat(detailConversionData.opportunityAmount),
          closeDate: detailConversionData.closeDate,
          stage: 'Qualification',
          probability: 50,
          type: 'New Business',
          leadSource: selectedLeadData.leadSource
        } : {}
      };
      const response = await leadService.convertLead(selectedLeadId, payload);
      if (response.success) {
        setSuccess('Lead converted successfully!');
        setShowDetailConvertForm(false);
        closeSidePanel();
        loadLeads();
      } else { setError(response.message || 'Failed to convert lead'); }
    } catch (err) { setError(err.message || 'Failed to convert lead'); }
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
      {/* PIN Verification Modal */}
      <PinVerification
        isOpen={showPinModal}
        onClose={() => { setShowPinModal(false); setPendingLeadId(null); }}
        onVerified={handlePinVerified}
        resourceType="lead"
        resourceId={pendingLeadId}
        resourceName="Lead"
      />

      {success && <Alert variant="success" className="mb-4"><AlertDescription>{success}</AlertDescription></Alert>}
      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      {/* Split View Container */}
      <div style={{ display: 'flex', gap: '0', height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
        {/* Left Side - Lead List */}
        <div style={{
          flex: selectedLeadId ? '0 0 55%' : '1 1 100%',
          minWidth: 0,
          overflow: 'auto'
        }}>

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
                <div
                  key={lead._id}
                  className={`grid-card ${selectedLeadId === lead._id ? 'ring-2 ring-purple-500 bg-purple-50' : ''}`}
                  onClick={() => handleLeadClick(lead._id)}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="avatar">
                      {lead.firstName?.[0]}{lead.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-gray-800 text-lg truncate">{getMaskedValue('firstName', lead.firstName)} {getMaskedValue('lastName', lead.lastName)}</h3>
                      <p className="text-sm text-gray-500 font-semibold truncate">{lead.jobTitle} {lead.company && `at ${getMaskedValue('company', lead.company)}`}</p>
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
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-500" /><span className="truncate">{getMaskedValue('email', lead.email)}</span></div>
                    {lead.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-green-500" /><span>{getMaskedValue('phone', lead.phone)}</span></div>}
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
                  <TableRow
                    key={lead._id}
                    className={`cursor-pointer hover:bg-muted/50 ${selectedLeadId === lead._id ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''}`}
                    onClick={() => handleLeadClick(lead._id)}
                  >
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
                          <span className="truncate max-w-[200px] block">
                            {sensitiveFields.includes(column)
                              ? getMaskedValue(column, getFieldValue(lead, column)) || '-'
                              : formatFieldValue(getFieldValue(lead, column))
                            }
                          </span>
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

        </div>
        {/* End Left Side */}

        {/* Right Side - Lead Detail Panel */}
        {selectedLeadId && (
          <div style={{ flex: '0 0 45%', background: 'white', borderLeft: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Panel Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#1e3c72', fontSize: '15px', fontWeight: '600' }}>Lead Details</h3>
              <button onClick={closeSidePanel} style={{ background: 'rgba(30,60,114,0.1)', border: 'none', borderRadius: '6px', padding: '4px', color: '#1e3c72', cursor: 'pointer' }}>
                <X className="h-5 w-5" />
              </button>
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
                        {selectedLeadData.firstName?.charAt(0) || ''}{selectedLeadData.lastName?.charAt(0) || ''}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0', color: '#1e3c72' }}>
                          {selectedLeadData.firstName} {selectedLeadData.lastName}
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
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>First Name *</label><input type="text" name="firstName" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.firstName || ''} onChange={handleDetailEditChange} required /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Last Name *</label><input type="text" name="lastName" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.lastName || ''} onChange={handleDetailEditChange} required /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Email *</label><input type="email" name="email" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.email || ''} onChange={handleDetailEditChange} required /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Phone</label><input type="tel" name="phone" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.phone || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Company</label><input type="text" name="company" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.company || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Job Title</label><input type="text" name="jobTitle" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.jobTitle || ''} onChange={handleDetailEditChange} /></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Status</label><select name="leadStatus" className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.leadStatus || 'New'} onChange={handleDetailEditChange}><option value="New">New</option><option value="Contacted">Contacted</option><option value="Qualified">Qualified</option><option value="Unqualified">Unqualified</option><option value="Lost">Lost</option></select></div>
                          <div><label style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>Rating</label><select name="rating" className="crm-form-select" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailEditData.rating || 'Warm'} onChange={handleDetailEditChange}><option value="Hot">Hot</option><option value="Warm">Warm</option><option value="Cold">Cold</option></select></div>
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
                      <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#991B1B' }}>Are you sure you want to delete <strong>{selectedLeadData.firstName} {selectedLeadData.lastName}</strong>?</p>
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}><input type="checkbox" name="createAccount" checked={detailConversionData.createAccount} onChange={handleDetailConversionChange} /><span>Create Account</span></label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}><input type="checkbox" name="createContact" checked={detailConversionData.createContact} onChange={handleDetailConversionChange} /><span>Create Contact</span></label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}><input type="checkbox" name="createOpportunity" checked={detailConversionData.createOpportunity} onChange={handleDetailConversionChange} disabled={!detailConversionData.createAccount} /><span>Create Opportunity</span></label>
                        </div>
                        {detailConversionData.createAccount && (
                          <div style={{ marginBottom: '8px' }}><label style={{ fontSize: '10px', fontWeight: '600' }}>Account Name *</label><input type="text" name="accountName" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailConversionData.accountName} onChange={handleDetailConversionChange} required /></div>
                        )}
                        {detailConversionData.createOpportunity && detailConversionData.createAccount && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                            <div><label style={{ fontSize: '10px', fontWeight: '600' }}>Opportunity Name *</label><input type="text" name="opportunityName" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailConversionData.opportunityName} onChange={handleDetailConversionChange} required /></div>
                            <div><label style={{ fontSize: '10px', fontWeight: '600' }}>Amount *</label><input type="number" name="opportunityAmount" className="crm-form-input" style={{ padding: '4px 6px', fontSize: '11px' }} value={detailConversionData.opportunityAmount} onChange={handleDetailConversionChange} required /></div>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button type="button" className="crm-btn crm-btn-secondary crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => setShowDetailConvertForm(false)}>Cancel</button>
                          <button type="submit" className="crm-btn crm-btn-success crm-btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }}>Convert</button>
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
                        {/* Contact Info */}
                        <div style={{ marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Contact Information</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {selectedLeadData.email && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><Mail className="h-4 w-4 text-blue-500" /><a href={`mailto:${selectedLeadData.email}`} style={{ color: '#3B82F6' }}>{selectedLeadData.email}</a></div>}
                            {selectedLeadData.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><Phone className="h-4 w-4 text-green-500" /><a href={`tel:${selectedLeadData.phone}`} style={{ color: '#059669' }}>{selectedLeadData.phone}</a></div>}
                            {selectedLeadData.website && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><Globe className="h-4 w-4 text-purple-500" /><a href={selectedLeadData.website} target="_blank" rel="noopener noreferrer" style={{ color: '#7C3AED' }}>{selectedLeadData.website}</a></div>}
                          </div>
                        </div>

                        {/* Company Info */}
                        {(selectedLeadData.company || selectedLeadData.industry) && (
                          <div style={{ marginBottom: '16px' }}>
                            <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Company Information</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {selectedLeadData.company && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><Building2 className="h-4 w-4 text-gray-500" />{selectedLeadData.company}</div>}
                              {selectedLeadData.industry && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><Briefcase className="h-4 w-4 text-gray-500" />{selectedLeadData.industry}</div>}
                            </div>
                          </div>
                        )}

                        {/* Lead Details */}
                        <div style={{ marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Lead Details</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                            <div><p style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px' }}>Source</p><p style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>{selectedLeadData.leadSource || '-'}</p></div>
                            <div><p style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px' }}>Rating</p><p style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>{selectedLeadData.rating || '-'}</p></div>
                            <div><p style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px' }}>Created</p><p style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>{selectedLeadData.createdAt ? new Date(selectedLeadData.createdAt).toLocaleDateString() : '-'}</p></div>
                            <div><p style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px' }}>Status</p><p style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>{selectedLeadData.leadStatus || 'New'}</p></div>
                          </div>
                        </div>

                        {/* Product Info */}
                        {selectedLeadData.product && (
                          <div style={{ marginBottom: '16px', padding: '12px', background: '#F0F9FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                            <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#1E40AF', marginBottom: '10px', textTransform: 'uppercase' }}>Product Information</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div><p style={{ fontSize: '10px', color: '#1E40AF', marginBottom: '2px' }}>Product</p><p style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>{selectedLeadData.product.name}</p></div>
                              <div><p style={{ fontSize: '10px', color: '#1E40AF', marginBottom: '2px' }}>Article #</p><p style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>{selectedLeadData.product.articleNumber}</p></div>
                              {selectedLeadData.productDetails?.quantity && <div><p style={{ fontSize: '10px', color: '#1E40AF', marginBottom: '2px' }}>Quantity</p><p style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>{selectedLeadData.productDetails.quantity}</p></div>}
                              {selectedLeadData.productDetails?.estimatedBudget && <div><p style={{ fontSize: '10px', color: '#1E40AF', marginBottom: '2px' }}>Budget</p><p style={{ fontSize: '13px', fontWeight: '600', margin: 0, color: '#059669' }}>₹{Number(selectedLeadData.productDetails.estimatedBudget).toLocaleString()}</p></div>}
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        {selectedLeadData.description && (
                          <div style={{ marginBottom: '16px' }}>
                            <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Description</h4>
                            <p style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5', margin: 0, background: '#f9fafb', padding: '10px', borderRadius: '6px' }}>{selectedLeadData.description}</p>
                          </div>
                        )}

                        {/* Custom Fields */}
                        {customFieldDefinitions.length > 0 && selectedLeadData.customFields && Object.keys(selectedLeadData.customFields).length > 0 && (() => {
                          const groupedFields = {};
                          customFieldDefinitions.forEach(field => {
                            const section = field.section || 'Additional Information';
                            if (!groupedFields[section]) groupedFields[section] = [];
                            groupedFields[section].push(field);
                          });

                          return Object.keys(groupedFields).map(sectionName => {
                            const fieldsWithValues = groupedFields[sectionName].filter(field => selectedLeadData.customFields[field.fieldName]);
                            if (fieldsWithValues.length === 0) return null;

                            return (
                              <div key={sectionName} style={{ marginBottom: '16px' }}>
                                <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#1e3c72', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ width: '3px', height: '12px', background: 'linear-gradient(135deg, rgb(153, 255, 251) 0%, rgb(255, 255, 255) 100%)', borderRadius: '2px' }}></span>
                                  {sectionName}
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f9fafb', padding: '10px', borderRadius: '6px' }}>
                                  {fieldsWithValues.map(field => {
                                    let value = selectedLeadData.customFields[field.fieldName];
                                    if (field.fieldType === 'currency') value = `₹${Number(value).toLocaleString()}`;
                                    else if (field.fieldType === 'date') value = new Date(value).toLocaleDateString();
                                    else if (field.fieldType === 'checkbox') value = value ? 'Yes' : 'No';
                                    return (
                                      <div key={field._id}>
                                        <p style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px' }}>{field.label}</p>
                                        <p style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>{value}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          });
                        })()}
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
        {/* End Right Side */}

      </div>
      {/* End Split View Container */}

    </DashboardLayout>
  );
};

export default Leads;
