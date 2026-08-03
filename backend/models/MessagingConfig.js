const mongoose = require('mongoose');

const MessagingConfigSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ['none', 'interakt', 'meta_cloud', 'twilio'],
    default: 'meta_cloud',
  },
  apiKey: {
    type: String,
  },
  phoneNumberId: {
    type: String,
  },
  templateNamePre3Day: {
    type: String,
    default: 'salon_reminder_3day',
  },
  templateNameDueDay: {
    type: String,
    default: 'salon_reminder_today',
  },
  testMode: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('MessagingConfig', MessagingConfigSchema);
