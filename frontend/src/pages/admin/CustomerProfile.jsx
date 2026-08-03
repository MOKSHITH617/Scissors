import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ChevronLeft, Phone, Mail, FileText, Calendar, 
  Coins, User, CheckCircle, ArrowLeft, Clock, MessageSquare, CheckCircle2, TrendingUp
} from 'lucide-react';
import './CustomerProfile.css';

const CustomerProfile = () => {
  const { id } = useParams();
  const { authFetch, addToast } = useAuth();
  
  const [customer, setCustomer] = useState(null);
  const [visits, setVisits] = useState([]);
  const [upcomingFollowups, setUpcomingFollowups] = useState([]);
  const [completedFollowups, setCompletedFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfileDetails = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/customers/${id}`);
      const data = await res.json();
      if (data.success) {
        setCustomer(data.customer);
        setVisits(data.visits || []);

        // Fetch followups for this customer
        const fRes = await authFetch(`/api/followups?search=${encodeURIComponent(data.customer.phone)}`);
        const fData = await fRes.json();
        if (fData.success) {
          const allF = fData.followups || [];
          const upcoming = allF.filter(f => !f.reminderSent && f.status !== 'Completed' && f.status !== 'Sent');
          const completed = allF.filter(f => f.reminderSent || f.status === 'Completed' || f.status === 'Sent');
          setUpcomingFollowups(upcoming);
          setCompletedFollowups(completed);
        }
      } else {
        addToast(data.message || 'Customer not found', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error loading customer profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="profile-loading-root">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="profile-error-root glass-card text-center">
        <h3>Customer Not Found</h3>
        <p className="text-secondary">We couldn't locate a profile matching the requested ID.</p>
        <Link to="/admin/customers" className="btn btn-gold mt-3">
          <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Return to Customers
        </Link>
      </div>
    );
  }

  // Calculate Average Spend
  const avgSpend = customer.totalVisits > 0 
    ? Math.round(customer.totalSpent / customer.totalVisits) 
    : 0;

  // Reverse visits for chronological order (Oldest first for Visit #1, #2...) or display with numbered badges
  const chronologicalVisits = [...visits].reverse();

  return (
    <div className="cust-profile-root animate-fade-in-simple">
      {/* Navigation header */}
      <div className="profile-navigation-header">
        <Link to="/admin/customers" className="back-link">
          <ChevronLeft size={18} /> Back to Directory
        </Link>
      </div>

      {/* Main Profile Layout Grid */}
      <div className="profile-layout-grid">
        
        {/* Left Column: Personal Details Identity Sheet */}
        <div className="identity-sheet-card glass-card">
          <div className="identity-header">
            <div className="profile-avatar">
              {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <h2 className="profile-name">{customer.name}</h2>
            <span className={`badge badge-${customer.category.toLowerCase().replace(' ', '-')}`}>
              {customer.category}
            </span>
          </div>

          <div className="identity-details">
            <div className="detail-item">
              <Phone size={16} className="detail-icon" />
              <div className="detail-text">
                <span className="label">Phone Number</span>
                <span className="value">{customer.phone}</span>
              </div>
            </div>

            <div className="detail-item">
              <Mail size={16} className="detail-icon" />
              <div className="detail-text">
                <span className="label">Email Address</span>
                <span className="value">{customer.email || 'No email provided'}</span>
              </div>
            </div>

            <div className="detail-item">
              <FileText size={16} className="detail-icon" />
              <div className="detail-text">
                <span className="label">Internal Notes / Styling Preferences</span>
                <p className="value notes-paragraph">{customer.notes || 'No specific notes logged for this customer.'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Consolidated Single Profile Activity */}
        <div className="profile-main-activity">
          
          {/* Statistics Grid */}
          <div className="profile-metrics-grid">
            <div className="metric-box glass-card">
              <div className="box-icon bg-gold">
                <User size={18} />
              </div>
              <div className="box-body">
                <span className="box-label">Total Visits</span>
                <h3 className="box-value">{customer.totalVisits}</h3>
              </div>
            </div>

            <div className="metric-box glass-card">
              <div className="box-icon bg-success">
                <Coins size={18} />
              </div>
              <div className="box-body">
                <span className="box-label">Total Spent</span>
                <h3 className="box-value font-gold">₹{customer.totalSpent}</h3>
              </div>
            </div>

            <div className="metric-box glass-card">
              <div className="box-icon bg-warning">
                <TrendingUp size={18} />
              </div>
              <div className="box-body">
                <span className="box-label">Average Spend</span>
                <h3 className="box-value font-gold">₹{avgSpend}</h3>
              </div>
            </div>
          </div>

          {/* Last Visit summary pill */}
          <div className="glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Last Visit Date:
            </span>
            <strong style={{ color: 'var(--accent-gold)', fontSize: '0.95rem' }}>
              {customer.lastVisitDate 
                ? new Date(customer.lastVisitDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                : 'No visits logged yet'}
            </strong>
          </div>

          {/* Visit Timeline Section */}
          <div className="visits-history-card glass-card">
            <div className="card-header">
              <h4>Visit Timeline</h4>
            </div>

            {chronologicalVisits.length === 0 ? (
              <div className="empty-state text-center" style={{ padding: '2rem 0', color: 'var(--text-secondary)' }}>
                <Clock size={32} className="empty-icon" style={{ marginBottom: '0.5rem' }} />
                <p>No visits recorded yet for this customer.</p>
              </div>
            ) : (
              <div className="timeline-container">
                {chronologicalVisits.map((visit, index) => (
                  <div key={visit._id} className="timeline-item">
                    <div className="timeline-header">
                      <span className="timeline-service">{visit.service}</span>
                      <span className="timeline-number">Visit #{index + 1}</span>
                    </div>
                    <div className="timeline-meta">
                      <span>Stylist: {visit.staffMember || 'Alex'} • {new Date(visit.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <strong className="font-gold">₹{visit.amount}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Follow-ups Card */}
          <div className="glass-card" style={{ padding: '1.5rem 2rem' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} /> Upcoming Follow-ups ({upcomingFollowups.length})
              </h4>
            </div>

            {upcomingFollowups.length === 0 ? (
              <p className="text-secondary" style={{ fontSize: '0.85rem' }}>No pending follow-ups scheduled for this client.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {upcomingFollowups.map((f) => (
                  <div key={f._id} style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{f.serviceName || f.lastService}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Reminder Date: {f.reminderDate ? new Date(f.reminderDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <span style={{
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
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Follow-ups Card */}
          <div className="glass-card" style={{ padding: '1.5rem 2rem' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h4 style={{ color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} /> Completed Follow-ups ({completedFollowups.length})
              </h4>
            </div>

            {completedFollowups.length === 0 ? (
              <p className="text-secondary" style={{ fontSize: '0.85rem' }}>No completed follow-ups recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {completedFollowups.map((f) => (
                  <div key={f._id} style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{f.serviceName || f.lastService}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Sent Date: {f.sentDate ? new Date(f.sentDate).toLocaleDateString() : 'Sent'}
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: 'rgba(46, 204, 113, 0.15)',
                      color: '#2ecc71',
                      border: '1px solid rgba(46, 204, 113, 0.3)'
                    }}>
                      🟢 Sent
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default CustomerProfile;
