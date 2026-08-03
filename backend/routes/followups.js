const express = require('express');
const router = express.Router();
const Followup = require('../models/Followup');
const { protect } = require('../middleware/auth');
const { sendReminder } = require('../services/whatsappService');
const MessagingConfig = require('../models/MessagingConfig');

// @route   GET api/followups
// @desc    Get followups with search and filters
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { search, filter } = req.query;
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let query = {};

    // Search filter (Customer Name, Phone, Service)
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { customerName: regex },
        { phone: regex },
        { serviceName: regex },
        { lastService: regex }
      ];
    }

    // Specific category/tab filter if provided
    if (filter) {
      const f = filter.toLowerCase();
      if (f === 'pending') {
        query.$or = [{ status: 'Pending' }, { status: 'pending' }];
      } else if (f === 'sent') {
        query.$or = [{ status: 'Sent' }, { status: 'Completed' }, { whatsappStatus: 'Sent' }, { reminderSent: true }];
      } else if (f === 'failed') {
        query.$or = [{ status: 'Failed' }, { whatsappStatus: 'Failed' }];
      } else if (f === 'today') {
        query.$or = [
          { reminderDate: { $gte: startOfToday, $lte: endOfToday } },
          { followupDate: { $gte: startOfToday, $lte: endOfToday } }
        ];
      } else if (f === 'upcoming') {
        query.$or = [
          { reminderDate: { $gt: endOfToday } },
          { followupDate: { $gt: endOfToday } }
        ];
      } else if (f === 'overdue') {
        query.reminderSent = false;
        query.$or = [
          { reminderDate: { $lt: startOfToday } },
          { followupDate: { $lt: startOfToday } }
        ];
      }
    }

    const allFollowups = await Followup.find(query)
      .populate('customer', 'name phone lastVisitDate email')
      .populate('visit', 'visitDate service amount staffMember')
      .sort({ reminderDate: 1, followupDate: 1, createdAt: -1 });

    // Categorized statistics counts for badge tabs
    const allRecords = await Followup.find().populate('customer').populate('visit');
    
    const counts = {
      all: allRecords.length,
      pending: 0,
      sent: 0,
      failed: 0,
      today: 0,
      upcoming: 0,
      overdue: 0
    };

    const categorizedList = [];

    allRecords.forEach(item => {
      const remDate = item.reminderDate || item.followupDate;
      if (!remDate) return;

      const rDate = new Date(remDate);
      const isSent = item.reminderSent || item.status === 'Sent' || item.status === 'Completed' || item.whatsappStatus === 'Sent';
      const isFailed = item.status === 'Failed' || item.whatsappStatus === 'Failed';
      const isPending = !isSent && !isFailed;

      if (isPending) counts.pending++;
      if (isSent) counts.sent++;
      if (isFailed) counts.failed++;

      if (rDate >= startOfToday && rDate <= endOfToday) counts.today++;
      if (rDate > endOfToday) counts.upcoming++;
      if (!isSent && rDate < startOfToday) counts.overdue++;
    });

    res.json({
      success: true,
      followups: allFollowups,
      counts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST api/followups/:id/retry
// @desc    Retry sending WhatsApp reminder for a failed follow-up
// @access  Private
router.post('/:id/retry', protect, async (req, res) => {
  try {
    const followup = await Followup.findById(req.params.id)
      .populate('customer')
      .populate('visit');

    if (!followup) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }

    let config = await MessagingConfig.findOne();

    const custPhone = followup.phone || followup.customer?.phone;
    const custName = followup.customerName || followup.customer?.name;
    const serviceName = followup.serviceName || followup.lastService || followup.visit?.service || 'Salon Service';
    const visitDate = followup.visitDate || followup.visit?.visitDate || followup.createdAt;

    const result = await sendReminder({
      phone: custPhone,
      customerName: custName,
      serviceName,
      visitDate,
      templateName: config?.templateNameDueDay || 'salon_reminder_today'
    });

    if (result.success) {
      followup.reminderSent = true;
      followup.whatsappStatus = 'Sent';
      followup.status = 'Completed';
      followup.sentDate = result.sentTime || new Date();
      followup.messageId = result.messageId || '';
      followup.errorLog = '';
    } else {
      followup.whatsappStatus = 'Failed';
      followup.status = 'Failed';
      followup.retryCount = (followup.retryCount || 0) + 1;
      followup.errorLog = result.error || 'Failed to send WhatsApp reminder';
    }

    await followup.save();

    res.json({ success: true, followup, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT api/followups/:id/status
// @desc    Mark follow-up as completed or update status manually
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;

    const followup = await Followup.findById(req.params.id);
    if (!followup) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }

    followup.status = status;
    if (status === 'Completed' || status === 'completed' || status === 'Sent') {
      followup.reminderSent = true;
      followup.whatsappStatus = 'Sent';
      followup.sentDate = followup.sentDate || new Date();
    }

    await followup.save();
    res.json({ success: true, followup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
