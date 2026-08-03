const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const Visit = require('../models/Visit');
const Followup = require('../models/Followup');
const Service = require('../models/Service');
const { protect } = require('../middleware/auth');
const { getUpdatedCategory } = require('./customers');

// Helper to automate appointment completion, logging visit, and setting followup
const completeAppointment = async (appointment) => {
  if (appointment.status === 'completed') return;

  const phoneNum = (appointment.phone || '').trim();

  // 1. Find or create Customer
  let customer = await Customer.findOne({ phone: phoneNum });
  if (!customer) {
    customer = await Customer.create({
      name: appointment.name,
      phone: phoneNum,
      email: appointment.email || ''
    });
  }

  appointment.customer = customer._id;

  // 2. Fetch service price
  const serviceObj = await Service.findOne({ name: appointment.service });
  const amount = serviceObj ? serviceObj.price : 800;

  // 3. Create visit record
  const visitDate = appointment.date ? new Date(appointment.date) : new Date();
  const fDate = new Date(visitDate.getTime());
  fDate.setDate(fDate.getDate() + 30);

  const visit = await Visit.create({
    customer: customer._id,
    service: appointment.service,
    amount,
    visitDate,
    staffMember: 'Alex',
    followupDate: fDate,
    followupIntervalDays: 30,
    status: 'Completed',
    notes: appointment.notes || ''
  });

  // 4. Update customer stats
  customer.totalVisits += 1;
  customer.totalSpent += amount;
  if (!customer.lastVisitDate || new Date(visit.visitDate) > new Date(customer.lastVisitDate)) {
    customer.lastVisitDate = visit.visitDate;
  }
  customer.category = getUpdatedCategory(customer.totalVisits, customer.totalSpent, customer.lastVisitDate);
  await customer.save();

  // 5. Create followup reminder
  await Followup.create({
    customer: customer._id,
    customerName: customer.name,
    phone: customer.phone,
    visit: visit._id,
    serviceName: appointment.service,
    lastService: appointment.service,
    visitDate: visitDate,
    reminderDate: fDate,
    followupDate: fDate,
    status: 'Pending',
    whatsappStatus: 'Waiting',
    reminderSent: false,
    retryCount: 0,
    errorLog: ''
  });

  appointment.status = 'completed';
};

// @route   POST api/appointments/book
// @desc    Self-book an appointment (Public Customer Website)
// @access  Public
router.post('/book', async (req, res) => {
  try {
    const { name, phone, email, service, date, timeSlot, notes } = req.body;

    if (!name || !phone || !service || !date || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Please provide name, phone, service, date, and timeSlot' });
    }

    const cleanPhone = phone.trim();

    // Find or create customer reference
    let customer = await Customer.findOne({ phone: cleanPhone });
    if (!customer) {
      customer = await Customer.create({ name: name.trim(), phone: cleanPhone, email: email || '' });
    }

    const appointment = await Appointment.create({
      customer: customer._id,
      name: name.trim(),
      phone: cleanPhone,
      email: email || '',
      service,
      date: new Date(date),
      timeSlot,
      status: 'pending',
      notes: notes || ''
    });

    res.status(201).json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET api/appointments
// @desc    Get all appointments (optional filter by status)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(query)
      .populate('customer')
      .sort({ date: 1, timeSlot: 1 });
    
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST api/appointments
// @desc    Create an appointment from Admin CRM
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, phone, email, service, date, timeSlot, status, notes } = req.body;

    if (!name || !phone || !service || !date || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }

    const cleanPhone = phone.trim();

    // Find or create customer reference
    let customer = await Customer.findOne({ phone: cleanPhone });
    if (!customer) {
      customer = await Customer.create({ name: name.trim(), phone: cleanPhone, email: email || '' });
    }

    const appointment = await Appointment.create({
      customer: customer._id,
      name: name.trim(),
      phone: cleanPhone,
      email: email || '',
      service,
      date: new Date(date),
      timeSlot,
      status: status || 'confirmed',
      notes: notes || ''
    });

    res.status(201).json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT api/appointments/:id/complete
// @desc    Complete appointment and log visit automatically
// @access  Private
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    await completeAppointment(appointment);
    const updatedAppointment = await appointment.save();

    res.json({ success: true, appointment: updatedAppointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT api/appointments/:id
// @desc    Update appointment status/details
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, phone, email, service, date, timeSlot, status, notes } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (name) appointment.name = name;
    if (phone) appointment.phone = phone.trim();
    if (email !== undefined) appointment.email = email;
    if (service) appointment.service = service;
    if (date) appointment.date = new Date(date);
    if (timeSlot) appointment.timeSlot = timeSlot;
    if (notes !== undefined) appointment.notes = notes;

    // Handle status update
    if (status) {
      if (status === 'completed') {
        await completeAppointment(appointment);
      } else {
        appointment.status = status;
      }
    }

    // Ensure customer reference is linked if details were updated
    if (phone) {
      const cleanPhone = phone.trim();
      let customer = await Customer.findOne({ phone: cleanPhone });
      if (!customer) {
        customer = await Customer.create({
          name: appointment.name,
          phone: cleanPhone,
          email: appointment.email || ''
        });
      }
      appointment.customer = customer._id;
    }

    const updatedAppointment = await appointment.save();
    res.json({ success: true, appointment: updatedAppointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE api/appointments/:id
// @desc    Delete appointment
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
