const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { protect } = require('../middleware/auth');

// @route   GET api/services
// @desc    Get all active services
// @access  Public
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ category: 1, name: 1 });
    res.json({ success: true, services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET api/services/admin
// @desc    Get all services (including inactive ones)
// @access  Private
router.get('/admin', protect, async (req, res) => {
  try {
    const services = await Service.find().sort({ category: 1, name: 1 });
    res.json({ success: true, services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST api/services
// @desc    Create a new service
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, category, price, duration, description, icon, isActive } = req.body;

    if (!name || !category || !price || !duration) {
      return res.status(400).json({ success: false, message: 'Please enter name, category, price, and duration' });
    }

    const service = await Service.create({
      name,
      category,
      price: parseFloat(price),
      duration: parseInt(duration),
      description,
      icon: icon || 'Scissors',
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({ success: true, service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT api/services/:id
// @desc    Update a service
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, category, price, duration, description, icon, isActive } = req.body;

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (name) service.name = name;
    if (category) service.category = category;
    if (price !== undefined) service.price = parseFloat(price);
    if (duration !== undefined) service.duration = parseInt(duration);
    if (description !== undefined) service.description = description;
    if (icon) service.icon = icon;
    if (isActive !== undefined) service.isActive = isActive;

    const updatedService = await service.save();
    res.json({ success: true, service: updatedService });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE api/services/:id
// @desc    Delete a service
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
