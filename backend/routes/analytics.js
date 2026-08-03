const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Visit = require('../models/Visit');
const Followup = require('../models/Followup');
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');

// @route   GET api/analytics/dashboard
// @desc    Get dashboard metrics & trends
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    const startOfWeek = new Date(startOfToday);
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // 1. Total Customers Count
    const totalCustomers = await Customer.countDocuments();

    // 2. Today's Appointments Count
    const todayAppointments = await Appointment.countDocuments({
      date: { $gte: startOfToday, $lte: endOfToday },
      status: { $ne: 'cancelled' }
    });

    // 3. Today's Revenue (Sum of completed visits today)
    const todayVisits = await Visit.find({
      visitDate: { $gte: startOfToday, $lte: endOfToday },
      status: 'Completed'
    });
    const todayRevenue = todayVisits.reduce((sum, v) => sum + v.amount, 0);

    // 4. Due Today (Follow-ups with reminderDate <= today and reminderSent == false)
    const dueToday = await Followup.countDocuments({
      reminderSent: false,
      $or: [
        { reminderDate: { $lte: endOfToday } },
        { followupDate: { $lte: endOfToday } }
      ]
    });

    // 5. Sent Today (Follow-ups sent today)
    const sentToday = await Followup.countDocuments({
      reminderSent: true,
      sentDate: { $gte: startOfToday, $lte: endOfToday }
    });

    // 6. Failed Today (Follow-ups with Failed status updated today)
    const failedToday = await Followup.countDocuments({
      status: 'Failed',
      updatedAt: { $gte: startOfToday, $lte: endOfToday }
    });

    // 7. Upcoming This Week (Follow-ups scheduled in the next 7 days)
    const upcomingThisWeek = await Followup.countDocuments({
      reminderSent: false,
      $or: [
        { reminderDate: { $gte: startOfToday, $lte: endOfWeek } },
        { followupDate: { $gte: startOfToday, $lte: endOfWeek } }
      ]
    });

    // 8. Popular Services (Top 5)
    const popularServicesData = await Visit.aggregate([
      { $group: { _id: '$service', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const serviceCounts = {};
    popularServicesData.forEach(item => {
      if (item._id) {
        const names = item._id.split(',').map(n => n.trim());
        names.forEach(name => {
          serviceCounts[name] = (serviceCounts[name] || 0) + item.count;
        });
      }
    });

    const popularServices = Object.keys(serviceCounts)
      .map(name => ({ name, count: serviceCounts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 9. Recent Customers
    const recentCustomers = await Customer.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // 10. Today's Appointment List
    const todayAppointmentsList = await Appointment.find({
      date: { $gte: startOfToday, $lte: endOfToday }
    })
      .populate('customer')
      .sort({ timeSlot: 1 });

    // 11. Dashboard Follow-ups List (Show recent followups with full details)
    const dashboardFollowups = await Followup.find()
      .populate('customer', 'name phone')
      .populate('visit', 'visitDate service')
      .sort({ reminderDate: 1, followupDate: 1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        metrics: {
          totalCustomers,
          todayAppointments,
          todayRevenue,
          pendingFollowups: dueToday,
          dueToday,
          sentToday,
          failedToday,
          upcomingThisWeek
        },
        popularServices,
        recentCustomers,
        todayAppointmentsList,
        upcomingFollowups: dashboardFollowups
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET api/analytics/insights
// @desc    Get detailed charts & reports data
// @access  Private
router.get('/insights', protect, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyRevenueAggregate = await Visit.aggregate([
      { $match: { visitDate: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitDate' } },
          revenue: { $sum: '$amount' },
          visits: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyRevenue = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const match = dailyRevenueAggregate.find(item => item._id === dateStr);
      dailyRevenue.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: match ? match.revenue : 0,
        visits: match ? match.visits : 0
      });
    }

    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const monthlyRevenueAggregate = await Visit.aggregate([
      { $match: { visitDate: { $gte: startOfYear } } },
      {
        $group: {
          _id: { $month: '$visitDate' },
          revenue: { $sum: '$amount' },
          visits: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenue = monthNames.map((name, index) => {
      const match = monthlyRevenueAggregate.find(item => item._id === (index + 1));
      return {
        month: name,
        revenue: match ? match.revenue : 0,
        visits: match ? match.visits : 0
      };
    });

    const customers = await Customer.find();
    const categoriesCount = {
      'New Customer': 0,
      'Regular Customer': 0,
      'Premium Customer': 0,
      'Inactive Customer': 0
    };
    let totalSpentSum = 0;

    customers.forEach(c => {
      categoriesCount[c.category] = (categoriesCount[c.category] || 0) + 1;
      totalSpentSum += c.totalSpent;
    });

    const categoryDistribution = Object.keys(categoriesCount).map(name => ({
      name,
      value: categoriesCount[name]
    }));

    const totalFollowups = await Followup.countDocuments();
    const completedFollowups = await Followup.countDocuments({ $or: [{ status: 'Completed' }, { status: 'completed' }, { reminderSent: true }] });
    const pendingFollowups = await Followup.countDocuments({ $or: [{ status: 'Pending' }, { status: 'pending' }] });
    const failedFollowups = await Followup.countDocuments({ status: 'Failed' });

    const conversionRate = totalFollowups > 0 
      ? Math.round((completedFollowups / totalFollowups) * 100) 
      : 0;

    const averageSpending = customers.length > 0 
      ? Math.round(totalSpentSum / customers.length) 
      : 0;

    const returningCount = customers.filter(c => c.totalVisits >= 2).length;
    const returningRate = customers.length > 0
      ? Math.round((returningCount / customers.length) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        dailyRevenue,
        monthlyRevenue,
        categoryDistribution,
        statistics: {
          averageSpending,
          returningRate,
          conversionRate,
          followups: {
            total: totalFollowups,
            completed: completedFollowups,
            failed: failedFollowups,
            pending: pendingFollowups
          }
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
