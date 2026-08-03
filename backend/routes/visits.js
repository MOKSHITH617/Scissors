const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');
const Customer = require('../models/Customer');
const Followup = require('../models/Followup');
const { protect } = require('../middleware/auth');
const { getUpdatedCategory } = require('./customers');

/**
 * Helper function to create follow-up for a completed visit
 */
const createFollowupForVisit = async (visit, customer) => {
  // Check if follow-up already exists for this visit
  const existing = await Followup.findOne({ visit: visit._id });
  if (existing) return existing;

  const vDate = new Date(visit.visitDate);
  const intervalDays = visit.followupIntervalDays || 30;
  const fDate = new Date(vDate.getTime());
  fDate.setDate(fDate.getDate() + intervalDays);

  const followup = await Followup.create({
    customer: customer._id,
    customerName: customer.name,
    phone: customer.phone,
    visit: visit._id,
    serviceName: visit.service,
    lastService: visit.service, // backward compatibility
    visitDate: vDate,
    reminderDate: fDate,
    followupDate: fDate, // backward compatibility
    status: 'Pending',
    whatsappStatus: 'Waiting',
    reminderSent: false,
    retryCount: 0,
    errorLog: '',
  });

  return followup;
};

// @route   GET api/visits
// @desc    Get all visits
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const visits = await Visit.find()
      .populate('customer', 'name phone category')
      .sort({ visitDate: -1 });
    res.json({ success: true, visits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST api/visits
// @desc    Log a new customer visit (walk-in or receptionist form) & schedule follow-up
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { 
      customerId, 
      phone, 
      name, 
      service, 
      amount, 
      visitDate, 
      staffMember, 
      notes, 
      status, 
      followupIntervalDays 
    } = req.body;

    if (!service || amount === undefined || !staffMember) {
      return res.status(400).json({ success: false, message: 'Please provide service, amount, and staffMember' });
    }

    // Validate that visitDate is today's date
    if (visitDate) {
      const todayStr = new Date().toISOString().split('T')[0];
      const submittedDateStr = new Date(visitDate).toISOString().split('T')[0];
      if (submittedDateStr !== todayStr) {
        return res.status(400).json({ success: false, message: "Visit date must be today's date." });
      }
    }

    let customer = null;

    // 1. Identify Customer by phone or customerId
    if (phone && phone.trim()) {
      const cleanPhone = phone.trim();
      customer = await Customer.findOne({ phone: cleanPhone });
      if (!customer) {
        // Create new customer if not found by phone
        customer = await Customer.create({
          name: name ? name.trim() : 'Walk-in Client',
          phone: cleanPhone,
          notes: notes || '',
        });
      }
    } else if (customerId) {
      customer = await Customer.findById(customerId);
    }

    if (!customer) {
      return res.status(400).json({ success: false, message: 'Customer phone number or customerId is required' });
    }

    const vDate = visitDate ? new Date(visitDate) : new Date();
    const intervalDays = parseInt(followupIntervalDays) || 30;
    const fDate = new Date(vDate.getTime());
    fDate.setDate(fDate.getDate() + intervalDays);

    const visitStatus = status || 'Completed';

    // 2. Create the visit
    const visit = await Visit.create({
      customer: customer._id,
      service,
      amount: parseFloat(amount),
      visitDate: vDate,
      staffMember,
      followupDate: fDate,
      followupIntervalDays: intervalDays,
      notes: notes || '',
      status: visitStatus,
    });

    let followup = null;

    // 3. Update Customer stats & Generate Follow-up ONLY if visit is Completed
    if (visitStatus === 'Completed') {
      customer.totalVisits += 1;
      customer.totalSpent += parseFloat(amount);
      if (!customer.lastVisitDate || new Date(visit.visitDate) > new Date(customer.lastVisitDate)) {
        customer.lastVisitDate = visit.visitDate;
      }
      customer.category = getUpdatedCategory(customer.totalVisits, customer.totalSpent, customer.lastVisitDate);
      await customer.save();

      // Create Followup
      followup = await createFollowupForVisit(visit, customer);
    }

    res.status(201).json({
      success: true,
      visit,
      followup,
      customer,
    });
  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT api/visits/:id/status
// @desc    Update visit status (Booked -> In Progress -> Completed)
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Booked', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid visit status' });
    }

    const visit = await Visit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    const previousStatus = visit.status;
    visit.status = status;
    await visit.save();

    let followup = null;

    // If transitioned to Completed, calculate stats & create follow-up
    if (status === 'Completed' && previousStatus !== 'Completed') {
      const customer = await Customer.findById(visit.customer);
      if (customer) {
        customer.totalVisits += 1;
        customer.totalSpent += visit.amount;
        if (!customer.lastVisitDate || new Date(visit.visitDate) > new Date(customer.lastVisitDate)) {
          customer.lastVisitDate = visit.visitDate;
        }
        customer.category = getUpdatedCategory(customer.totalVisits, customer.totalSpent, customer.lastVisitDate);
        await customer.save();

        followup = await createFollowupForVisit(visit, customer);
      }
    }

    res.json({ success: true, visit, followup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE api/visits/:id
// @desc    Delete a visit & reverse customer statistics
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    const customer = await Customer.findById(visit.customer);
    if (customer && visit.status === 'Completed') {
      customer.totalVisits = Math.max(0, customer.totalVisits - 1);
      customer.totalSpent = Math.max(0, customer.totalSpent - visit.amount);
      
      const otherVisits = await Visit.find({ customer: customer._id, _id: { $ne: visit._id }, status: 'Completed' }).sort({ visitDate: -1 });
      customer.lastVisitDate = otherVisits.length > 0 ? otherVisits[0].visitDate : null;
      customer.category = getUpdatedCategory(customer.totalVisits, customer.totalSpent, customer.lastVisitDate);
      await customer.save();
    }

    await Followup.deleteMany({ visit: visit._id });
    await Visit.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Visit and corresponding follow-ups deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
