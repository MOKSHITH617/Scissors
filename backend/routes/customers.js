const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Visit = require('../models/Visit');
const { protect } = require('../middleware/auth');

// Helper to determine customer category dynamically
const getUpdatedCategory = (totalVisits, totalSpent, lastVisitDate) => {
  if (!lastVisitDate) return 'New Customer';
  
  const daysSinceLastVisit = Math.floor((Date.now() - new Date(lastVisitDate)) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLastVisit > 60) {
    return 'Inactive Customer';
  }
  
  if (totalVisits >= 6 || totalSpent >= 8000) {
    return 'Premium Customer';
  } else if (totalVisits >= 2) {
    return 'Regular Customer';
  } else {
    return 'New Customer';
  }
};

// @route   GET api/customers
// @desc    Get all customers
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    
    // Dynamic recalculation of Inactive status on fetch
    const updatedCustomers = await Promise.all(customers.map(async (customer) => {
      const currentCategory = getUpdatedCategory(customer.totalVisits, customer.totalSpent, customer.lastVisitDate);
      if (currentCategory !== customer.category) {
        customer.category = currentCategory;
        await customer.save();
      }
      return customer;
    }));

    res.json({ success: true, customers: updatedCustomers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET api/customers/search
// @desc    Search customer by phone number
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number parameter is required' });
    }

    const customer = await Customer.findOne({ phone: phone.trim() });
    
    if (!customer) {
      return res.json({ success: true, found: false });
    }

    // Refresh category check
    const currentCategory = getUpdatedCategory(customer.totalVisits, customer.totalSpent, customer.lastVisitDate);
    if (currentCategory !== customer.category) {
      customer.category = currentCategory;
      await customer.save();
    }

    // Fetch visits history
    const visits = await Visit.find({ customer: customer._id }).sort({ visitDate: -1 });

    res.json({
      success: true,
      found: true,
      customer,
      visits
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET api/customers/:id
// @desc    Get customer details and profile
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Refresh category
    const currentCategory = getUpdatedCategory(customer.totalVisits, customer.totalSpent, customer.lastVisitDate);
    if (currentCategory !== customer.category) {
      customer.category = currentCategory;
      await customer.save();
    }

    const visits = await Visit.find({ customer: customer._id }).sort({ visitDate: -1 });
    const Followup = require('../models/Followup');
    const upcomingFollowup = await Followup.findOne({ customer: customer._id, status: 'pending' }).sort({ followupDate: 1 });

    res.json({
      success: true,
      customer,
      visits,
      upcomingFollowup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST api/customers
// @desc    Add new customer
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, phone, email, notes } = req.body;

    const existingCustomer = await Customer.findOne({ phone: phone.trim() });
    if (existingCustomer) {
      return res.status(400).json({ success: false, message: 'Customer with this phone number already exists' });
    }

    const customer = await Customer.create({
      name,
      phone: phone.trim(),
      email,
      notes,
      category: 'New Customer'
    });

    res.status(201).json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT api/customers/:id
// @desc    Update customer details
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, phone, email, notes } = req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (phone && phone.trim() !== customer.phone) {
      const existingCustomer = await Customer.findOne({ phone: phone.trim() });
      if (existingCustomer) {
        return res.status(400).json({ success: false, message: 'Customer with this phone number already exists' });
      }
      customer.phone = phone.trim();
    }

    customer.name = name || customer.name;
    customer.email = email !== undefined ? email : customer.email;
    customer.notes = notes !== undefined ? notes : customer.notes;

    // Recalculate category in case other fields updated
    customer.category = getUpdatedCategory(customer.totalVisits, customer.totalSpent, customer.lastVisitDate);

    const updatedCustomer = await customer.save();
    res.json({ success: true, customer: updatedCustomer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE api/customers/:id
// @desc    Delete customer
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await Customer.findByIdAndDelete(req.params.id);
    // Delete their visits and followups as well
    await Visit.deleteMany({ customer: req.params.id });
    const Followup = require('../models/Followup');
    await Followup.deleteMany({ customer: req.params.id });

    res.json({ success: true, message: 'Customer and all associated records deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
module.exports.getUpdatedCategory = getUpdatedCategory; // Export for visits trigger
