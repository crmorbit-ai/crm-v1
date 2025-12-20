import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contactService } from '../services/contactService';
import fieldDefinitionService from '../services/fieldDefinitionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import '../styles/crm.css';

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState([]);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form data
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadContact();
    loadFieldDefinitions();
  }, [id]);

  const loadContact = async () => {
    try {
      setLoading(true);
      const response = await contactService.getContact(id);
      if (response.success) setContact(response.data);
    } catch (err) {
      console.error('Load contact error:', err);
      setError(err.message || 'Failed to load contact');
    } finally {
      setLoading(false);
    }
  };

  const loadFieldDefinitions = async () => {
    try {
      const response = await fieldDefinitionService.getFieldDefinitions('Contact', false);
      if (response && Array.isArray(response)) {
        const detailFields = response
          .filter(field => field.isActive && field.showInDetail && !field.isStandardField)
          .sort((a, b) => a.displayOrder - b.displayOrder);
        setCustomFieldDefinitions(detailFields);
      }
    } catch (error) {
      console.error('Load field definitions error:', error);
    }
  };

  // Group fields by section
  const groupFieldsBySection = (fields) => {
    const grouped = {};
    fields.forEach(field => {
      const section = field.section || 'Additional Information';
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(field);
    });
    return grouped;
  };

  const openEditModal = () => {
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      mobile: contact.mobile || '',
      jobTitle: contact.jobTitle || '',
      department: contact.department || '',
      leadSource: contact.leadSource || '',
      description: contact.description || ''
    });
    setShowEditModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    try {
      setError('');
      // Clean up formData - remove empty strings for enum fields
      const cleanedData = { ...formData };
      if (!cleanedData.department || cleanedData.department === '') {
        delete cleanedData.department;
      }
      if (!cleanedData.leadSource || cleanedData.leadSource === '') {
        delete cleanedData.leadSource;
      }

      await contactService.updateContact(contact._id, cleanedData);
      setSuccess('Contact updated successfully!');
      setShowEditModal(false);
      loadContact();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update contact');
    }
  };

  const handleDeleteContact = async () => {
    try {
      setError('');
      await contactService.deleteContact(contact._id);
      setSuccess('Contact deleted successfully!');
      setTimeout(() => {
        navigate('/contacts');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to delete contact');
    }
  };

  const canUpdateContact = hasPermission('contact_management', 'update');
  const canDeleteContact = hasPermission('contact_management', 'delete');

  if (loading) return <DashboardLayout title="Loading..."><div style={{padding:'40px',textAlign:'center'}}>Loading...</div></DashboardLayout>;
  if (!contact) return <DashboardLayout title="Not Found"><div style={{padding:'20px'}}>Contact not found</div></DashboardLayout>;

  const { relatedData = {} } = contact;
  const opportunities = relatedData.opportunities?.data || [];
  const tasks = relatedData.tasks?.data || [];

  return (
    <DashboardLayout title={`${contact.firstName} ${contact.lastName}`}>
      {success && (
        <div style={{ padding: '16px', background: '#DCFCE7', color: '#166534', borderRadius: '8px', marginBottom: '20px' }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ padding: '16px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div className="crm-card" style={{marginBottom:'20px'}}>
        <div style={{padding:'24px'}}>
          <div style={{display:'flex',gap:'12px',marginBottom:'16px'}}>
            <button className="crm-btn crm-btn-secondary" onClick={()=>navigate('/contacts')}>← Back</button>
            {canUpdateContact && (
              <button className="crm-btn crm-btn-primary" onClick={openEditModal}>✏️ Edit</button>
            )}
            {canDeleteContact && (
              <button className="crm-btn crm-btn-danger" onClick={() => setShowDeleteModal(true)}>🗑️ Delete</button>
            )}
            <button className="crm-btn crm-btn-success">✉ Send Email</button>
          </div>
          
          <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
            <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'24px',fontWeight:'bold'}}>
              {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
            </div>
            <div>
              <h1 style={{fontSize:'28px',fontWeight:'700',margin:0}}>{contact.firstName} {contact.lastName}</h1>
              <p style={{color:'#666',margin:'4px 0'}}>{contact.jobTitle || 'Contact'} {contact.account && `at ${contact.account.accountName}`}</p>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginTop:'24px',paddingTop:'24px',borderTop:'1px solid #E5E7EB'}}>
            <div><p style={{fontSize:'12px',color:'#666'}}>Email</p><p style={{fontWeight:'500'}}>{contact.email}</p></div>
            <div><p style={{fontSize:'12px',color:'#666'}}>Phone</p><p style={{fontWeight:'500'}}>{contact.phone || '-'}</p></div>
            <div><p style={{fontSize:'12px',color:'#666'}}>Mobile</p><p style={{fontWeight:'500'}}>{contact.mobile || '-'}</p></div>
            <div><p style={{fontSize:'12px',color:'#666'}}>Department</p><p style={{fontWeight:'500'}}>{contact.department || '-'}</p></div>
          </div>
        </div>
      </div>

      <div className="crm-card">
        <div className="crm-tabs">
          <button className={`crm-tab ${activeTab==='overview'?'active':''}`} onClick={()=>setActiveTab('overview')}>Overview</button>
          <button className={`crm-tab ${activeTab==='timeline'?'active':''}`} onClick={()=>setActiveTab('timeline')}>Timeline</button>
        </div>

        <div style={{padding:'24px'}}>
          {activeTab === 'overview' && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
                <div>
                  <h4 style={{fontSize:'14px',fontWeight:'600',marginBottom:'12px'}}>Contact Information</h4>
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Full Name</label><p style={{fontWeight:'500'}}>{contact.firstName} {contact.lastName}</p></div>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Email</label><p style={{fontWeight:'500'}}>{contact.email}</p></div>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Phone</label><p style={{fontWeight:'500'}}>{contact.phone || '-'}</p></div>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Mobile</label><p style={{fontWeight:'500'}}>{contact.mobile || '-'}</p></div>
                  </div>
                </div>
                <div>
                  <h4 style={{fontSize:'14px',fontWeight:'600',marginBottom:'12px'}}>Additional Information</h4>
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Job Title</label><p style={{fontWeight:'500'}}>{contact.jobTitle || '-'}</p></div>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Department</label><p style={{fontWeight:'500'}}>{contact.department || '-'}</p></div>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Account</label><p style={{fontWeight:'500',color:'#3B82F6',cursor:'pointer'}} onClick={()=>contact.account && navigate(`/accounts/${contact.account._id}`)}>{contact.account?.accountName || '-'}</p></div>
                    <div><label style={{fontSize:'12px',color:'#666'}}>Lead Source</label><p style={{fontWeight:'500'}}>{contact.leadSource || '-'}</p></div>
                  </div>
                </div>
              </div>

              <div style={{marginTop:'32px'}}>
                <h4 style={{fontSize:'16px',fontWeight:'600',marginBottom:'16px'}}>Related Lists</h4>
                
                <div style={{marginBottom:'24px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
                    <h5 style={{fontSize:'14px',fontWeight:'600'}}>Deals ({relatedData.opportunities?.total || 0})</h5>
                    <button className="crm-btn crm-btn-sm crm-btn-primary">+ New Deal</button>
                  </div>
                  {opportunities.length > 0 ? (
                    <div style={{border:'1px solid #E5E7EB',borderRadius:'8px',overflow:'hidden'}}>
                      <table className="crm-table" style={{margin:0}}>
                        <thead><tr><th>Deal Name</th><th>Amount</th><th>Stage</th><th>Close Date</th></tr></thead>
                        <tbody>
                          {opportunities.map(o => (
                            <tr key={o._id} onClick={()=>navigate(`/opportunities/${o._id}`)} style={{cursor:'pointer'}}>
                              <td style={{fontWeight:'500',color:'#3B82F6'}}>{o.opportunityName}</td>
                              <td style={{color:'#059669',fontWeight:'600'}}>Rs. {o.amount?.toLocaleString() || '0'}</td>
                              <td><span className="status-badge">{o.stage}</span></td>
                              <td>{new Date(o.closeDate).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{border:'1px solid #E5E7EB',borderRadius:'8px',padding:'20px',textAlign:'center',color:'#666'}}>No deals found</div>
                  )}
                </div>

                <div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
                    <h5 style={{fontSize:'14px',fontWeight:'600'}}>Tasks ({relatedData.tasks?.total || 0})</h5>
                    <button className="crm-btn crm-btn-sm crm-btn-primary">+ New Task</button>
                  </div>
                  {tasks.length > 0 ? (
                    <div style={{border:'1px solid #E5E7EB',borderRadius:'8px',overflow:'hidden'}}>
                      <table className="crm-table" style={{margin:0}}>
                        <thead><tr><th>Subject</th><th>Due Date</th><th>Status</th><th>Priority</th></tr></thead>
                        <tbody>
                          {tasks.map(t => (
                            <tr key={t._id}>
                              <td style={{fontWeight:'500'}}>{t.subject}</td>
                              <td>{new Date(t.dueDate).toLocaleDateString()}</td>
                              <td><span className="status-badge">{t.status}</span></td>
                              <td><span className="rating-badge">{t.priority}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{border:'1px solid #E5E7EB',borderRadius:'8px',padding:'20px',textAlign:'center',color:'#666'}}>No tasks found</div>
                  )}
                </div>
              </div>

              {/* Custom Fields Section - Grouped by Sections */}
              {customFieldDefinitions.length > 0 && contact.customFields && Object.keys(contact.customFields).length > 0 && (() => {
                const groupedFields = groupFieldsBySection(customFieldDefinitions);
                const sections = Object.keys(groupedFields);

                return sections.map(sectionName => (
                  <div key={sectionName} style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #E5E7EB' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>{sectionName}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      {groupedFields[sectionName].map((field) => {
                        const value = contact.customFields[field.fieldName];
                        if (!value) return null;

                        let displayValue = value;

                        // Format value based on field type
                        if (field.fieldType === 'currency') {
                          displayValue = `${Number(value).toLocaleString()}`;
                        } else if (field.fieldType === 'percentage') {
                          displayValue = `${value}%`;
                        } else if (field.fieldType === 'date') {
                          displayValue = new Date(value).toLocaleDateString();
                        } else if (field.fieldType === 'datetime') {
                          displayValue = new Date(value).toLocaleString();
                        } else if (field.fieldType === 'checkbox') {
                          displayValue = value ? 'Yes' : 'No';
                        } else if (field.fieldType === 'multi_select' && Array.isArray(value)) {
                          const selectedOptions = field.options.filter(opt => value.includes(opt.value));
                          displayValue = selectedOptions.map(opt => opt.label).join(', ');
                        } else if (['dropdown', 'radio'].includes(field.fieldType)) {
                          const selectedOption = field.options.find(opt => opt.value === value);
                          displayValue = selectedOption ? selectedOption.label : value;
                        }

                        return (
                          <div key={field._id}>
                            <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
                              {field.label}
                            </label>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                              {displayValue || 'Not provided'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div style={{padding:'40px',textAlign:'center',color:'#666'}}>Timeline coming soon...</div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Contact"
        size="large"
      >
        <form onSubmit={handleUpdateContact}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="crm-form-group">
              <label>First Name *</label>
              <input
                type="text"
                name="firstName"
                className="crm-form-input"
                value={formData.firstName || ''}
                onChange={handleChange}
                required
              />
            </div>
            <div className="crm-form-group">
              <label>Last Name *</label>
              <input
                type="text"
                name="lastName"
                className="crm-form-input"
                value={formData.lastName || ''}
                onChange={handleChange}
                required
              />
            </div>
            <div className="crm-form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                className="crm-form-input"
                value={formData.email || ''}
                onChange={handleChange}
                required
              />
            </div>
            <div className="crm-form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                className="crm-form-input"
                value={formData.phone || ''}
                onChange={handleChange}
              />
            </div>
            <div className="crm-form-group">
              <label>Mobile</label>
              <input
                type="tel"
                name="mobile"
                className="crm-form-input"
                value={formData.mobile || ''}
                onChange={handleChange}
              />
            </div>
            <div className="crm-form-group">
              <label>Job Title</label>
              <input
                type="text"
                name="jobTitle"
                className="crm-form-input"
                value={formData.jobTitle || ''}
                onChange={handleChange}
              />
            </div>
            <div className="crm-form-group">
              <label>Department</label>
              <select
                name="department"
                className="crm-form-select"
                value={formData.department || ''}
                onChange={handleChange}
              >
                <option value="">Select Department</option>
                <option value="Executive Management">Executive Management</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Human Resources">Human Resources</option>
                <option value="IT">IT</option>
                <option value="Customer Service">Customer Service</option>
                <option value="Legal">Legal</option>
                <option value="Research & Development">Research & Development</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="crm-form-group">
              <label>Lead Source</label>
              <select
                name="leadSource"
                className="crm-form-select"
                value={formData.leadSource || ''}
                onChange={handleChange}
              >
                <option value="">Select Lead Source</option>
                <option value="Advertisement">Advertisement</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Employee Referral">Employee Referral</option>
                <option value="External Referral">External Referral</option>
                <option value="Partner">Partner</option>
                <option value="Public Relations">Public Relations</option>
                <option value="Trade Show">Trade Show</option>
                <option value="Web Research">Web Research</option>
                <option value="Website">Website</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="crm-form-group" style={{ marginTop: '20px' }}>
            <label>Description</label>
            <textarea
              name="description"
              className="crm-form-textarea"
              rows="3"
              value={formData.description || ''}
              onChange={handleChange}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </button>
            <button type="submit" className="crm-btn crm-btn-primary">Update Contact</button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Contact"
        size="small"
      >
        <div>
          <p>Are you sure you want to delete this contact?</p>
          <p style={{ marginTop: '10px', fontWeight: '600' }}>
            {contact.firstName} {contact.lastName}
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            {contact.email}
          </p>
          <div className="modal-footer">
            <button className="crm-btn crm-btn-secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </button>
            <button className="crm-btn crm-btn-danger" onClick={handleDeleteContact}>
              Delete Contact
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default ContactDetail;