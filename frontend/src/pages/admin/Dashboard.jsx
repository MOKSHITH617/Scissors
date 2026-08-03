import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Calendar, IndianRupee, HelpCircle, 
  CheckCircle, ArrowUpRight, Clock, MessageSquare, AlertTriangle, Send, AlertCircle, CalendarDays
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { authFetch, addToast } = useAuth();
  
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    todayAppointments: 0,
    todayRevenue: 0,
    pendingFollowups: 0,
    dueToday: 0,
    sentToday: 0,
    failedToday: 0,
    upcomingThisWeek: 0,
  });

  const [popularServices, setPopularServices] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingFollowups, setUpcomingFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load dashboard summaries
  const loadDashboardData = async () => {
    try {
      const res = await authFetch('/api/analytics/dashboard');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data.metrics);
        setPopularServices(data.data.popularServices || []);
        setRecentCustomers(data.data.recentCustomers || []);
        setTodayAppointments(data.data.todayAppointmentsList || []);
        setUpcomingFollowups(data.data.upcomingFollowups || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleConfirmAppointment = async (appt) => {
    try {
      const res = await authFetch(`/api/appointments/${appt._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'confirmed' })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Appointment confirmed!', 'success');
        loadDashboardData();

        // WhatsApp Confirmation message
        const formattedDate = new Date(appt.date).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

        const clientName = appt.customer?.name || appt.name;
        const clientPhone = appt.customer?.phone || appt.phone;

        let phoneNum = clientPhone.replace(/\D/g, '');
        if (phoneNum.length === 10) {
          phoneNum = '91' + phoneNum;
        }

        const message = `Hello ${clientName},\n\nYour appointment with Scissor Lines Salon has been confirmed.\n\nDate:\n${formattedDate}\n\nTime:\n${appt.timeSlot}\n\nThank you for choosing us.\n\nScissor Lines\nHair & Beauty Unisex Salon`;
        const whatsappUrl = `https://wa.me/${phoneNum}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (err) {
      addToast('Failed to confirm appointment', 'error');
    }
  };

  const getDaysSinceVisit = (visitDate) => {
    if (!visitDate) return '0 days ago';
    const diffTime = Math.abs(new Date() - new Date(visitDate));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days ago`;
  };

  const renderStatusBadge = (item) => {
    const isSent = item.reminderSent || item.status === 'Sent' || item.status === 'Completed' || item.whatsappStatus === 'Sent';
    const isFailed = item.status === 'Failed' || item.whatsappStatus === 'Failed';

    if (isSent) {
      return (
        <span className="dash-status-badge sent" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600',
          background: 'rgba(46, 204, 113, 0.15)',
          color: '#2ecc71',
          border: '1px solid rgba(46, 204, 113, 0.3)'
        }}>
          🟢 Reminder Sent
        </span>
      );
    }

    if (isFailed) {
      return (
        <span className="dash-status-badge failed" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600',
          background: 'rgba(231, 76, 60, 0.15)',
          color: '#e74c3c',
          border: '1px solid rgba(231, 76, 60, 0.3)'
        }}>
          🔴 Failed
        </span>
      );
    }

    return (
      <span className="dash-status-badge pending" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '600',
        background: 'rgba(241, 196, 15, 0.15)',
        color: '#f1c40f',
        border: '1px solid rgba(241, 196, 15, 0.3)'
      }}>
        🟡 Pending
      </span>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading-root">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-root animate-fade-in-simple">
      
      {/* 7 Cards Overview Metrics HUD */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="metric-card glass-card">
          <div className="metric-body">
            <span className="metric-title">Total Customers</span>
            <h3 className="metric-number">{metrics.totalCustomers}</h3>
            <span className="metric-sub">Registered in CRM</span>
          </div>
          <div className="metric-icon-circle bg-gold">
            <Users size={20} />
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-body">
            <span className="metric-title">Today's Bookings</span>
            <h3 className="metric-number">{metrics.todayAppointments}</h3>
            <span className="metric-sub">Active appointments</span>
          </div>
          <div className="metric-icon-circle bg-warning">
            <Calendar size={20} />
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-body">
            <span className="metric-title">Today's Revenue</span>
            <h3 className="metric-number">₹{metrics.todayRevenue}</h3>
            <span className="metric-sub">Settled sales</span>
          </div>
          <div className="metric-icon-circle bg-success">
            <IndianRupee size={20} />
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-body">
            <span className="metric-title">Due Today</span>
            <h3 className="metric-number">{metrics.dueToday || metrics.pendingFollowups}</h3>
            <span className="metric-sub">Reminders scheduled</span>
          </div>
          <div className="metric-icon-circle bg-warning">
            <Clock size={20} />
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-body">
            <span className="metric-title">Sent Today</span>
            <h3 className="metric-number">{metrics.sentToday || 0}</h3>
            <span className="metric-sub">WhatsApp automated</span>
          </div>
          <div className="metric-icon-circle bg-success">
            <Send size={20} />
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-body">
            <span className="metric-title">Failed Today</span>
            <h3 className="metric-number">{metrics.failedToday || 0}</h3>
            <span className="metric-sub">Delivery alerts</span>
          </div>
          <div className="metric-icon-circle bg-danger">
            <AlertCircle size={20} />
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-body">
            <span className="metric-title">Upcoming This Week</span>
            <h3 className="metric-number">{metrics.upcomingThisWeek || 0}</h3>
            <span className="metric-sub">Next 7 days</span>
          </div>
          <div className="metric-icon-circle bg-gold">
            <CalendarDays size={20} />
          </div>
        </div>
      </div>

      {/* Row 2: Today's Appointments & Follow-ups deck */}
      <div className="dashboard-row-2">
        
        {/* Today's appointments list */}
        <div className="dash-card glass-card">
          <div className="card-header">
            <h4>Today's Schedule</h4>
            <Link to="/admin/appointments" className="view-more-link">
              View Schedule <ArrowUpRight size={14} />
            </Link>
          </div>
          
          <div className="appointments-list-deck">
            {todayAppointments.length === 0 ? (
              <div className="empty-list-state">
                <Calendar className="empty-icon" size={28} />
                <p>No appointments booked for today.</p>
              </div>
            ) : (
              todayAppointments.map((appt) => (
                <div key={appt._id} className="appointment-strip">
                  <div className="strip-time">
                    <Clock size={12} style={{ marginRight: '4px' }} />
                    {appt.timeSlot}
                  </div>
                  <div className="strip-client">
                    <strong>{appt.customer?.name || appt.name}</strong>
                    <span>{appt.service}</span>
                  </div>
                  <div className="strip-actions">
                    <span className={`badge badge-${appt.status}`}>{appt.status}</span>
                    {appt.status === 'pending' && (
                      <button 
                        className="strip-btn confirm"
                        onClick={() => handleConfirmAppointment(appt)}
                      >
                        Confirm
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Automated Follow-ups List */}
        <div className="dash-card glass-card">
          <div className="card-header">
            <h4>Follow-up Automation Deck</h4>
            <Link to="/admin/followups" className="view-more-link">
              Follow-up Hub <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="followup-list-deck">
            {upcomingFollowups.length === 0 ? (
              <div className="empty-list-state">
                <CheckCircle className="empty-icon" size={28} />
                <p>All client follow-ups are clear!</p>
              </div>
            ) : (
              upcomingFollowups.map((item) => {
                const custName = item.customerName || item.customer?.name || 'Customer';
                const serviceName = item.serviceName || item.lastService || item.visit?.service || 'Service';
                const vDate = item.visitDate || item.visit?.visitDate;
                const rDate = item.reminderDate || item.followupDate;
                const isSent = item.reminderSent || item.status === 'Sent' || item.status === 'Completed' || item.whatsappStatus === 'Sent';

                return (
                  <div key={item._id} className="followup-strip" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <div className="strip-client-info">
                        <strong>{custName}</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          Service: <strong>{serviceName}</strong> • {getDaysSinceVisit(vDate)}
                        </span>
                      </div>
                      {renderStatusBadge(item)}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Visit: {vDate ? new Date(vDate).toLocaleDateString() : 'N/A'}</span>
                      <span>Reminder: <strong>{rDate ? new Date(rDate).toLocaleDateString() : 'N/A'}</strong></span>
                    </div>

                    {isSent ? (
                      <div style={{
                        marginTop: '4px',
                        padding: '4px 10px',
                        background: 'rgba(46, 204, 113, 0.12)',
                        border: '1px solid rgba(46, 204, 113, 0.3)',
                        borderRadius: '4px',
                        color: '#2ecc71',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <CheckCircle size={14} /> ✅ Reminder Sent
                      </div>
                    ) : (
                      <div style={{
                        marginTop: '4px',
                        fontSize: '0.75rem',
                        color: 'var(--accent-gold)',
                        fontStyle: 'italic'
                      }}>
                        ⚡ Automated Meta WhatsApp reminder scheduled for 9:00 AM
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Row 3: Popular Services, Recent Customers */}
      <div className="dashboard-row-3">
        
        {/* Popular Services table */}
        <div className="dash-card glass-card">
          <div className="card-header">
            <h4>Popular Services</h4>
          </div>
          <div className="popular-services-table-wrapper">
            {popularServices.length === 0 ? (
              <p className="text-secondary text-center mt-3">No sales logged yet.</p>
            ) : (
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th className="text-right">Visits Count</th>
                  </tr>
                </thead>
                <tbody>
                  {popularServices.map((service, index) => (
                    <tr key={index}>
                      <td className="font-semibold text-primary">{service.name}</td>
                      <td className="text-right">{service.count} visits</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Customers List */}
        <div className="dash-card glass-card">
          <div className="card-header">
            <h4>Recent Registrations</h4>
            <Link to="/admin/customers" className="view-more-link">
              Directory <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="recent-customers-deck">
            {recentCustomers.length === 0 ? (
              <p className="text-secondary text-center mt-3">No customers registered.</p>
            ) : (
              recentCustomers.map((cust) => (
                <div key={cust._id} className="recent-customer-card">
                  <div className="cust-initials">
                    {cust.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="cust-bio">
                    <strong>{cust.name}</strong>
                    <span>{cust.phone}</span>
                  </div>
                  <span className={`badge badge-${cust.category.toLowerCase().replace(' ', '-')}`}>
                    {cust.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
