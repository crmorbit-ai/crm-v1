/**
 * Available features and their allowed actions in the CRM system
 */
const AVAILABLE_FEATURES = {
  // User Management
  user_management: {
    actions: ['create', 'read', 'update', 'delete', 'manage'],
    description: 'Manage users, assign roles, control user access'
  },

  // Role Management
  role_management: {
    actions: ['create', 'read', 'update', 'delete', 'manage'],
    description: 'Create and manage custom roles and permissions'
  },

  // Group Management
  group_management: {
    actions: ['create', 'read', 'update', 'delete', 'manage'],
    description: 'Organize users into groups and assign group roles'
  },

  // CRM - Lead Management
  lead_management: {
    actions: ['create', 'read', 'update', 'delete', 'convert', 'import', 'export', 'manage'],
    description: 'Manage leads, convert to accounts/contacts, bulk operations'
  },

  // CRM - Account Management
  account_management: {
    actions: ['create', 'read', 'update', 'delete', 'export', 'manage'],
    description: 'Manage customer accounts and organizations'
  },

  // CRM - Contact Management
  contact_management: {
    actions: ['create', 'read', 'update', 'delete', 'export', 'manage'],
    description: 'Manage contacts at accounts'
  },

  // CRM - Activity Management
  activity_management: {
    actions: ['create', 'read', 'update', 'delete', 'manage'],
    description: 'Create and track tasks, calls, emails, and meetings'
  },

  // Reports and Analytics
  report_management: {
    actions: ['read', 'create', 'export', 'manage'],
    description: 'View and create reports, export data'
  },

  // Data Center (Customer Database)
  data_center: {
    actions: ['create', 'read', 'update', 'delete', 'export', 'move_to_leads', 'manage'],
    description: 'Manage customer database, import/export data, move to leads'
  }
};

/**
 * Permission action descriptions
 */
const PERMISSION_ACTIONS = {
  create: 'Can create new records',
  read: 'Can view and list records',
  update: 'Can edit existing records',
  delete: 'Can remove records',
  manage: 'Full access including all actions above',
  convert: 'Can convert leads to accounts/contacts',
  import: 'Can bulk import data',
  export: 'Can export data to CSV/Excel'
};

/**
 * User type hierarchy (higher number = more privileges)
 */
const USER_TYPE_HIERARCHY = {
  SAAS_OWNER: 100,
  SAAS_ADMIN: 90,
  TENANT_ADMIN: 50,
  TENANT_MANAGER: 30,
  TENANT_USER: 10
};

/**
 * Lead statuses
 */
const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Qualified',
  'Unqualified',
  'Lost',
  'Converted'
];

/**
 * Lead sources
 */
const LEAD_SOURCES = [
  'Website',
  'Referral',
  'Campaign',
  'Cold Call',
  'Trade Show',
  'Partner',
  'Social Media',
  'Bulk Upload',
  'Other'
];

/**
 * Rating options
 */
const RATINGS = ['Hot', 'Warm', 'Cold'];

/**
 * Account types
 */
const ACCOUNT_TYPES = [
  'Customer',
  'Prospect',
  'Partner',
  'Vendor',
  'Competitor',
  'Other'
];

/**
 * Activity types
 */
const ACTIVITY_TYPES = [
  'task',
  'call',
  'email',
  'meeting'
];

/**
 * Activity statuses
 */
const ACTIVITY_STATUSES = [
  'Not Started',
  'In Progress',
  'Completed',
  'Deferred',
  'Canceled'
];

/**
 * Priority levels
 */
const PRIORITIES = ['High', 'Medium', 'Low'];

module.exports = {
  AVAILABLE_FEATURES,
  PERMISSION_ACTIONS,
  USER_TYPE_HIERARCHY,
  LEAD_STATUSES,
  LEAD_SOURCES,
  RATINGS,
  ACCOUNT_TYPES,
  ACTIVITY_TYPES,
  ACTIVITY_STATUSES,
  PRIORITIES
};
