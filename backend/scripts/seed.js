const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load Models
const User = require('../models/User');
const Customer = require('../models/Customer');
const Visit = require('../models/Visit');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Followup = require('../models/Followup');
const MessagingConfig = require('../models/MessagingConfig');

dotenv.config();

const seed = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/scissor_lines');
    console.log('Connected to MongoDB.');

    // Clear existing data
    console.log('Clearing database collections...');
    await User.deleteMany();
    await Customer.deleteMany();
    await Visit.deleteMany();
    await Appointment.deleteMany();
    await Service.deleteMany();
    await Followup.deleteMany();
    await MessagingConfig.deleteMany();
    console.log('Database cleared.');

    // 1. Create Default Admin User
    console.log('Seeding Admin account...');
    
    await User.create({
      name: 'Salon Owner',
      email: 'admin@scissorlines.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Admin user seeded: admin@scissorlines.com / admin123');

    // Seed MessagingConfig
    await MessagingConfig.create({
      provider: 'meta_cloud',
      testMode: false,
      phoneNumberId: process.env.META_WA_PHONE_NUMBER_ID || '1292678567255668',
      templateNameDueDay: 'salon_reminder_today',
    });

    // 2. Create Services Catalog
    console.log('Seeding Services catalog...');
    const services = await Service.insertMany([
      { name: 'Haircut', category: 'Hair', price: 800, duration: 30, description: 'Premium designer haircut suited to your face structure, including hair wash and styling.', icon: 'Scissors' },
      { name: 'Hair Styling', category: 'Hair', price: 1000, duration: 45, description: 'Blow-dry, curling, straight styling, or premium updos for any special event.', icon: 'Scissors' },
      { name: 'Beard Grooming', category: 'Grooming', price: 500, duration: 25, description: 'Precision beard shaping, hot towel shave, and beard conditioning oil massage.', icon: 'Scissors' },
      { name: 'Hair Spa', category: 'Hair Treatment', price: 1800, duration: 60, description: 'Deep nourishing hair treatment with ozone steam, scalp massage, and vitalizing serums.', icon: 'Sparkles' },
      { name: 'Hair Coloring', category: 'Hair', price: 3500, duration: 120, description: 'Global hair coloring, root touch-up, or highlights using Ammonia-free premium products.', icon: 'Scissors' },
      { name: 'Facial', category: 'Skin Care', price: 2000, duration: 50, description: 'Hydrating, brightening, or anti-aging facial involving charcoal exfoliation and massage.', icon: 'Sparkles' },
      { name: 'Bridal Makeup', category: 'Makeup', price: 15000, duration: 180, description: 'Luxury makeup, draping, and styling service by our senior cosmetologist.', icon: 'Heart' },
      { name: 'Skin Care', category: 'Skin Care', price: 2500, duration: 60, description: 'Deep pore extraction, microdermabrasion scrub, and vitamin C glow-mask therapy.', icon: 'Sparkles' }
    ]);
    console.log(`${services.length} services seeded.`);

    // 3. Create Customers
    console.log('Seeding Customers...');
    
    const today = new Date();
    
    const date15DaysAgo = new Date();
    date15DaysAgo.setDate(today.getDate() - 15);

    const date5DaysAgo = new Date();
    date5DaysAgo.setDate(today.getDate() - 5);

    const date70DaysAgo = new Date();
    date70DaysAgo.setDate(today.getDate() - 70);

    const date2DaysAgo = new Date();
    date2DaysAgo.setDate(today.getDate() - 2);

    const date30DaysAgo = new Date();
    date30DaysAgo.setDate(today.getDate() - 30);

    const custMoksh = await Customer.create({
      name: 'Moksh Patel',
      phone: '9876543210',
      email: 'moksh@example.com',
      category: 'Regular Customer',
      lastVisitDate: date15DaysAgo,
      totalVisits: 3,
      totalSpent: 3100,
      notes: 'Prefers classic pompadour haircut. Scalp is slightly dry.'
    });

    const custAanya = await Customer.create({
      name: 'Aanya Sharma',
      phone: '9822334455',
      email: 'aanya@example.com',
      category: 'Premium Customer',
      lastVisitDate: date5DaysAgo,
      totalVisits: 7,
      totalSpent: 18500,
      notes: 'VIP customer. Regularly gets hair coloring and hydra facials. Likes chamomile tea.'
    });

    const custRohan = await Customer.create({
      name: 'Rohan Mehta',
      phone: '9123456789',
      email: 'rohan@example.com',
      category: 'Inactive Customer',
      lastVisitDate: date70DaysAgo,
      totalVisits: 2,
      totalSpent: 2300,
      notes: 'Friendly, usually gets haircut + beard trim combo.'
    });

    const custSneha = await Customer.create({
      name: 'Sneha Gupta',
      phone: '8877665544',
      email: 'sneha@example.com',
      category: 'New Customer',
      lastVisitDate: date2DaysAgo,
      totalVisits: 1,
      totalSpent: 800,
      notes: 'First time visit for a hair trim.'
    });

    const custVikram = await Customer.create({
      name: 'Vikram Singh',
      phone: '9900112233',
      email: 'vikram@example.com',
      category: 'Regular Customer',
      lastVisitDate: date30DaysAgo,
      totalVisits: 2,
      totalSpent: 2600,
      notes: 'Enjoys hot towel shaves. Visiting from out of town frequently.'
    });

    console.log('Customers seeded.');

    // 4. Create Visits & Follow-ups
    console.log('Seeding Visit logs and Follow-ups...');
    
    // Moksh visits
    const vMoksh1 = await Visit.create({
      customer: custMoksh._id,
      service: 'Haircut',
      amount: 800,
      visitDate: new Date(date15DaysAgo.getTime() - 60*24*60*60*1000),
      staffMember: 'Alex',
      followupDate: new Date(date15DaysAgo.getTime() - 30*24*60*60*1000),
      status: 'Completed'
    });
    
    const vMoksh2 = await Visit.create({
      customer: custMoksh._id,
      service: 'Hair Spa',
      amount: 1800,
      visitDate: new Date(date15DaysAgo.getTime() - 30*24*60*60*1000),
      staffMember: 'Maria',
      followupDate: new Date(date15DaysAgo.getTime()),
      status: 'Completed'
    });

    const vMoksh3 = await Visit.create({
      customer: custMoksh._id,
      service: 'Haircut, Beard Grooming',
      amount: 1300,
      visitDate: date15DaysAgo,
      staffMember: 'Alex',
      followupDate: new Date(date15DaysAgo.getTime() + 30*24*60*60*1000),
      status: 'Completed'
    });

    await Followup.create({
      customer: custMoksh._id,
      customerName: custMoksh.name,
      phone: custMoksh.phone,
      visit: vMoksh3._id,
      serviceName: 'Haircut, Beard Grooming',
      lastService: 'Haircut, Beard Grooming',
      visitDate: vMoksh3.visitDate,
      reminderDate: vMoksh3.followupDate,
      followupDate: vMoksh3.followupDate,
      status: 'Pending',
      whatsappStatus: 'Waiting',
      reminderSent: false
    });

    // Aanya visits
    const vAanyaLast = await Visit.create({
      customer: custAanya._id,
      service: 'Facial, Hair Styling',
      amount: 3000,
      visitDate: date5DaysAgo,
      staffMember: 'Sofia',
      followupDate: new Date(date5DaysAgo.getTime() + 30*24*60*60*1000),
      status: 'Completed'
    });
    
    await Followup.create({
      customer: custAanya._id,
      customerName: custAanya.name,
      phone: custAanya.phone,
      visit: vAanyaLast._id,
      serviceName: 'Facial, Hair Styling',
      lastService: 'Facial, Hair Styling',
      visitDate: vAanyaLast.visitDate,
      reminderDate: vAanyaLast.followupDate,
      followupDate: vAanyaLast.followupDate,
      status: 'Pending',
      whatsappStatus: 'Waiting',
      reminderSent: false
    });

    // Rohan visits
    const vRohanLast = await Visit.create({
      customer: custRohan._id,
      service: 'Haircut, Beard Grooming',
      amount: 1300,
      visitDate: date70DaysAgo,
      staffMember: 'Alex',
      followupDate: new Date(date70DaysAgo.getTime() + 30*24*60*60*1000),
      status: 'Completed'
    });

    await Followup.create({
      customer: custRohan._id,
      customerName: custRohan.name,
      phone: custRohan.phone,
      visit: vRohanLast._id,
      serviceName: 'Haircut, Beard Grooming',
      lastService: 'Haircut, Beard Grooming',
      visitDate: vRohanLast.visitDate,
      reminderDate: vRohanLast.followupDate,
      followupDate: vRohanLast.followupDate,
      status: 'Pending',
      whatsappStatus: 'Waiting',
      reminderSent: false
    });

    // Sneha visits
    const vSnehaLast = await Visit.create({
      customer: custSneha._id,
      service: 'Haircut',
      amount: 800,
      visitDate: date2DaysAgo,
      staffMember: 'Maria',
      followupDate: new Date(date2DaysAgo.getTime() + 30*24*60*60*1000),
      status: 'Completed'
    });

    await Followup.create({
      customer: custSneha._id,
      customerName: custSneha.name,
      phone: custSneha.phone,
      visit: vSnehaLast._id,
      serviceName: 'Haircut',
      lastService: 'Haircut',
      visitDate: vSnehaLast.visitDate,
      reminderDate: vSnehaLast.followupDate,
      followupDate: vSnehaLast.followupDate,
      status: 'Pending',
      whatsappStatus: 'Waiting',
      reminderSent: false
    });

    // Vikram visits (Due today)
    const vVikramLast = await Visit.create({
      customer: custVikram._id,
      service: 'Hair Spa, Beard Grooming',
      amount: 2300,
      visitDate: date30DaysAgo,
      staffMember: 'Maria',
      followupDate: today,
      status: 'Completed'
    });

    await Followup.create({
      customer: custVikram._id,
      customerName: custVikram.name,
      phone: custVikram.phone,
      visit: vVikramLast._id,
      serviceName: 'Hair Spa, Beard Grooming',
      lastService: 'Hair Spa, Beard Grooming',
      visitDate: vVikramLast.visitDate,
      reminderDate: today,
      followupDate: today,
      status: 'Pending',
      whatsappStatus: 'Waiting',
      reminderSent: false
    });

    console.log('Visits and Follow-ups seeded.');

    // 5. Create Appointments
    console.log('Seeding Appointments...');
    
    await Appointment.insertMany([
      {
        name: 'Kabir Kapoor',
        phone: '9555112233',
        email: 'kabir@example.com',
        service: 'Haircut',
        date: today,
        timeSlot: '10:00 AM',
        status: 'confirmed',
        notes: 'Requested senior stylist Alex'
      },
      {
        name: 'Priya Sen',
        phone: '9888223344',
        email: 'priya@example.com',
        service: 'Facial',
        date: today,
        timeSlot: '02:00 PM',
        status: 'pending',
        notes: 'Wants herbal facial'
      },
      {
        name: 'John Doe',
        phone: '9444111222',
        email: 'john@example.com',
        service: 'Beard Grooming',
        date: today,
        timeSlot: '04:30 PM',
        status: 'completed',
        notes: 'Completed earlier today'
      },
      {
        name: 'Deepika Roy',
        phone: '9111222333',
        email: 'deepika@example.com',
        service: 'Bridal Makeup',
        date: new Date(today.getTime() + 24*60*60*1000),
        timeSlot: '11:00 AM',
        status: 'confirmed',
        notes: 'Pre-wedding photoshoot trial'
      },
      {
        name: 'Rahul Khanna',
        phone: '9222333444',
        email: 'rahul@example.com',
        service: 'Hair Spa',
        date: new Date(today.getTime() + 24*60*60*1000),
        timeSlot: '03:00 PM',
        status: 'pending'
      },
      {
        name: 'Raj Malhotra',
        phone: '9000000001',
        email: 'raj@example.com',
        service: 'Hair Coloring',
        date: today,
        timeSlot: '06:00 PM',
        status: 'cancelled',
        notes: 'Client cancelled due to emergency'
      }
    ]);
    
    console.log('Appointments seeded.');
    console.log('Database seeding successfully finished!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seed();
