const cron = require('node-cron');
const Followup = require('../models/Followup');
const MessagingConfig = require('../models/MessagingConfig');
const { sendReminder } = require('../services/whatsappService');

async function runReminderCheck() {
  console.log('[CRON] Running 9:00 AM WhatsApp Follow-up Reminder Scheduler...');
  
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Load messaging config
  let config = await MessagingConfig.findOne();
  if (!config) {
    config = await MessagingConfig.create({
      provider: 'meta_cloud',
      testMode: false,
      templateNameDueDay: 'salon_reminder_today',
    });
  } else if (config.testMode) {
    config.testMode = false;
    await config.save();
  }

  // Query matching followups: reminderDate <= Today AND reminderSent == False AND status != 'Completed'
  const followups = await Followup.find({
    reminderSent: false,
    $or: [
      { status: 'Pending' },
      { status: 'pending' },
      { status: 'Failed' }
    ],
    $or: [
      { reminderDate: { $lte: todayEnd } },
      { followupDate: { $lte: todayEnd } }
    ]
  }).populate('customer').populate('visit');

  let processedCount = 0;
  let sentCount = 0;
  let simulatedCount = 0;
  let failedCount = 0;

  for (const f of followups) {
    const custPhone = f.phone || f.customer?.phone;
    const custName = f.customerName || f.customer?.name;
    const serviceName = f.serviceName || f.lastService || f.visit?.service || 'Salon Service';
    const visitDate = f.visitDate || f.visit?.visitDate || f.createdAt;

    if (!custPhone || f.reminderSent) continue;

    processedCount++;

    try {
      const result = await sendReminder({
        phone: custPhone,
        customerName: custName,
        serviceName,
        visitDate,
        templateName: config.templateNameDueDay || 'salon_reminder_today',
      });

      if (result.success) {
        f.reminderSent = true;
        f.whatsappStatus = 'Sent';
        f.status = 'Completed';
        f.sentDate = result.sentTime || new Date();
        f.messageId = result.messageId || '';
        f.errorLog = '';
        if (result.simulated) simulatedCount++;
        else sentCount++;
      } else {
        f.whatsappStatus = 'Failed';
        f.status = 'Failed';
        f.retryCount = (f.retryCount || 0) + 1;
        f.errorLog = result.error || 'Failed to send WhatsApp reminder';
        failedCount++;
      }

      await f.save();
    } catch (error) {
      console.error(`[CRON ERROR] Failed to send reminder to ${custName}:`, error.message);
      f.whatsappStatus = 'Failed';
      f.status = 'Failed';
      f.retryCount = (f.retryCount || 0) + 1;
      f.errorLog = error.message;
      failedCount++;
      await f.save();
    }
  }

  console.log(`[CRON SUMMARY] Processed: ${processedCount}, Simulated: ${simulatedCount}, Sent: ${sentCount}, Failed: ${failedCount}`);

  return {
    processedCount,
    simulatedCount,
    sentCount,
    failedCount,
  };
}

// Scheduled to run every day at 9:00 AM
cron.schedule('0 9 * * *', () => {
  runReminderCheck().catch(err => {
    console.error('[CRON CRITICAL ERROR]', err);
  });
});

module.exports = { runReminderCheck };
