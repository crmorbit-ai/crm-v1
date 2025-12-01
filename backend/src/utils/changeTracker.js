/**
 * Track changes between old and new values
 * @param {Object} oldData - Original document
 * @param {Object} newData - Updated data from request
 * @param {Array} fields - Fields to track
 * @returns {Object} - Changes object with old and new values
 */
const trackChanges = (oldData, newData, fields) => {
  const changes = {};
  
  fields.forEach(field => {
    if (newData[field] !== undefined) {
      const oldValue = oldData[field];
      const newValue = newData[field];
      
      // Convert to string for comparison
      if (String(oldValue) !== String(newValue)) {
        changes[field] = {
          old: oldValue || null,
          new: newValue || null
        };
      }
    }
  });
  
  return changes;
};

/**
 * Get record name for logging
 */
const getRecordName = (record, type) => {
  switch(type) {
    case 'Lead':
    case 'Contact':
      return `${record.firstName || ''} ${record.lastName || ''}`.trim();
    case 'Account':
      return record.accountName;
    case 'Opportunity':
      return record.opportunityName;
    default:
      return record._id.toString();
  }
};

module.exports = {
  trackChanges,
  getRecordName
};