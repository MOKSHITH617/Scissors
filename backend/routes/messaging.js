const express = require('express');
const router = express.Router();
const MessagingConfig = require('../models/MessagingConfig');
const { protect } = require('../middleware/auth');
const { encrypt } = require('../config/encryption');
const { runReminderCheck } = require('../jobs/reminderCron');

// @route   GET api/messaging/config
// @desc    Get WhatsApp automation config (masked API key)
// @access  Private (Admin only, handled by protect middleware)
router.get('/config', protect, async (req, res) => {
  try {
    let config = await MessagingConfig.findOne();
    if (!config) {
      config = await MessagingConfig.create({
        provider: 'meta_cloud',
        testMode: false,
        templateNamePre3Day: 'salon_reminder_3day',
        templateNameDueDay: 'salon_reminder_today',
      });
    } else if (config.testMode || config.provider !== 'meta_cloud') {
      config.provider = 'meta_cloud';
      config.testMode = false;
      await config.save();
    }

    // Clone config to mask API Key before sending to UI
    const configData = config.toObject();
    if (configData.apiKey) {
      configData.apiKey = '••••••••';
    }

    res.json({ success: true, config: configData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT api/messaging/config
// @desc    Update WhatsApp automation config
// @access  Private
router.put('/config', protect, async (req, res) => {
  try {
    const { provider, apiKey, phoneNumberId, templateNamePre3Day, templateNameDueDay, testMode } = req.body;

    let config = await MessagingConfig.findOne();
    if (!config) {
      config = new MessagingConfig({});
    }

    config.provider = provider !== undefined ? provider : 'meta_cloud';
    config.phoneNumberId = phoneNumberId !== undefined ? phoneNumberId : config.phoneNumberId;
    config.templateNamePre3Day = templateNamePre3Day !== undefined ? templateNamePre3Day : config.templateNamePre3Day;
    config.templateNameDueDay = templateNameDueDay !== undefined ? templateNameDueDay : config.templateNameDueDay;
    config.testMode = testMode !== undefined ? testMode : false;

    // Handle api key updates: if key is updated and it is not the masked placeholder
    if (apiKey !== undefined) {
      if (apiKey === '••••••••') {
        // Do not update key, leave it as is
      } else if (!apiKey) {
        config.apiKey = undefined;
      } else {
        // Encrypt the new API key before saving
        config.apiKey = encrypt(apiKey);
      }
    }

    await config.save();

    // Mask for response
    const configData = config.toObject();
    if (configData.apiKey) {
      configData.apiKey = '••••••••';
    }

    res.json({ success: true, config: configData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST api/messaging/trigger-reminders
// @desc    Manually run daily reminder cron logic
// @access  Private
router.post('/trigger-reminders', protect, async (req, res) => {
  try {
    const results = await runReminderCheck();
    res.json({ success: true, results });
  } catch (error) {
    console.error('Trigger reminder manual run failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
