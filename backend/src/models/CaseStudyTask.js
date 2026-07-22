const mongoose = require('mongoose');

const caseStudyTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    topic: {
      type: String,
      required: true,
      trim: true
    },
    taskType: {
      type: String,
      enum: ['general', 'sales', 'follow_up', 'meeting', 'support', 'lead_nurture', 'deal_closure', 'customer_onboarding', 'product_demo', 'case_study', 'documentation', 'training'],
      default: 'general'
    },
    tags: [{
      type: String,
      trim: true
    }],
    reminderBefore: {
      type: Number // Minutes before deadline
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'review', 'on_hold', 'completed', 'cancelled'],
      default: 'todo'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    complexity: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'expert'],
      default: 'medium'
    },
    deadline: {
      type: Date
    },
    estimatedHours: {
      type: Number, // Estimated time in hours
      default: 0
    },
    progress: {
      type: Number, // 0-100
      default: 0,
      min: 0,
      max: 100
    },
    linkedCaseStudy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CaseStudy'
    },
    // Hold Reason
    holdReason: {
      type: String,
      trim: true
    },
    // Blocker Info
    blockers: [{
      description: String,
      resolvedAt: Date,
      addedAt: { type: Date, default: Date.now }
    }],
    // Time Tracking
    timeTracking: {
      totalTimeSpent: { type: Number, default: 0 }, // in seconds
      startedAt: Date,
      lastPausedAt: Date,
      timerRunning: { type: Boolean, default: false },
      sessions: [{
        startTime: Date,
        endTime: Date,
        duration: Number // in seconds
      }]
    },
    // Activity Log
    activityLog: [{
      action: {
        type: String,
        enum: ['created', 'assigned', 'started', 'paused', 'resumed', 'completed', 'cancelled', 'commented', 'status_changed']
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      comment: String
    }],
    completedAt: Date,
    notes: String
  },
  { timestamps: true }
);

// Virtual for formatted time
caseStudyTaskSchema.virtual('formattedTimeSpent').get(function() {
  const seconds = this.timeTracking.totalTimeSpent || 0;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Method to start timer
caseStudyTaskSchema.methods.startTimer = function() {
  if (!this.timeTracking.timerRunning) {
    this.timeTracking.timerRunning = true;
    this.timeTracking.startedAt = new Date();

    if (this.status === 'todo' || this.status === 'pending') {
      this.status = 'in_progress';
    }
  }
};

// Method to pause timer
caseStudyTaskSchema.methods.pauseTimer = function() {
  if (this.timeTracking.timerRunning && this.timeTracking.startedAt) {
    const now = new Date();
    const duration = Math.floor((now - this.timeTracking.startedAt) / 1000); // seconds

    this.timeTracking.totalTimeSpent += duration;
    this.timeTracking.timerRunning = false;
    this.timeTracking.lastPausedAt = now;

    // Add session
    this.timeTracking.sessions.push({
      startTime: this.timeTracking.startedAt,
      endTime: now,
      duration
    });

    this.timeTracking.startedAt = null;
  }
};

// Method to complete task
caseStudyTaskSchema.methods.completeTask = function() {
  if (this.timeTracking.timerRunning) {
    this.pauseTimer();
  }
  this.status = 'completed';
  this.completedAt = new Date();
};

// Indexes
caseStudyTaskSchema.index({ assignedTo: 1, status: 1 });
caseStudyTaskSchema.index({ assignedBy: 1 });
caseStudyTaskSchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('CaseStudyTask', caseStudyTaskSchema);
