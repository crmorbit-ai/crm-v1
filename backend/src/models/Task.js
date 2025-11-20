const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // Basic Information
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'Waiting on someone else', 'Deferred'],
    default: 'Not Started'
  },
  
  priority: {
    type: String,
    enum: ['High', 'Normal', 'Low'],
    default: 'Normal'
  },
  
  // Related To
  relatedTo: {
    type: String,
    enum: ['Lead', 'Account', 'Contact', 'Opportunity', 'Deal'],
    required: true
  },
  
  relatedToId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedTo',
    required: true
  },
  
  // Additional Information
  description: {
    type: String,
    trim: true
  },
  
  reminder: {
    enabled: {
      type: Boolean,
      default: false
    },
    date: Date
  },
  
  // Owner and Assignment
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  
  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  completedDate: {
    type: Date
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
taskSchema.index({ tenant: 1, isActive: 1 });
taskSchema.index({ owner: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ relatedToId: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ dueDate: 1 });

// Auto-set completed date when status changes to Completed
taskSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'Completed' && !this.completedDate) {
    this.completedDate = new Date();
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;