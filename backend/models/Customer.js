const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    default: '',
  },
  category: {
    type: String,
    enum: ['New Customer', 'Regular Customer', 'Premium Customer', 'Inactive Customer'],
    default: 'New Customer',
  },
  lastVisitDate: {
    type: Date,
    default: null,
  },
  totalVisits: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
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

module.exports = mongoose.model('Customer', CustomerSchema);
