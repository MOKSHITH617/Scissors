const mongoose = require('mongoose');

const FollowupSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  visit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    required: true,
  },
  serviceName: {
    type: String,
    required: true,
  },
  lastService: {
    type: String, // Kept for backward compatibility
  },
  visitDate: {
    type: Date,
    required: true,
  },
  reminderDate: {
    type: Date,
    required: true,
  },
  followupDate: {
    type: Date, // Kept for backward compatibility
  },
  status: {
    type: String,
    enum: ['Pending', 'Sent', 'Failed', 'Completed', 'pending', 'completed', 'rescheduled'],
    default: 'Pending',
  },
  whatsappStatus: {
    type: String,
    enum: ['Waiting', 'Sent', 'Failed'],
    default: 'Waiting',
  },
  reminderSent: {
    type: Boolean,
    default: false,
  },
  sentDate: {
    type: Date,
  },
  messageId: {
    type: String,
    default: '',
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  errorLog: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Followup', FollowupSchema);
