const mongoose = require('mongoose');

const VisitSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  service: {
    type: String, // E.g., "Haircut, Beard Grooming"
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  visitDate: {
    type: Date,
    default: Date.now,
  },
  staffMember: {
    type: String,
    required: true,
  },
  followupDate: {
    type: Date,
    required: true,
  },
  followupIntervalDays: {
    type: Number,
    default: 30,
  },
  notes: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Booked', 'In Progress', 'Completed'],
    default: 'Completed',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Visit', VisitSchema);
