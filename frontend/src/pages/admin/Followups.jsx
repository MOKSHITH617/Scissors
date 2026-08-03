import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  MessageSquare, Check, Calendar, AlertTriangle, 
  Clock, Search, Eye, RotateCw, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import './Followups.css';

const Followups = () => {
  const { authFetch, addToast } = useAuth();
  
  const [followups, setFollowups] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, sent: 0, failed: 0, today: 0, upcoming: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [testMode, setTestMode] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [retryingId, setRetryingId] = useState(null);

  // Preview Message Modal State
  const [previewItem, setPreviewItem] = useState(null);

  const isDevEnvironment = import.meta.env.DEV || process.env.NODE_ENV !== 'production';

  const fetchConfig = async () => {
    try {
      const res = await authFetch('/api/messaging/config');
      const data = await res.json();
      if (data.success && data.config) {
        setTestMode(data.config.testMode);
      }
    } catch (err) {
      console.error('Error fetching WhatsApp config:', err);
    }
  };

  const loadFollowups = async () => {
    setLoading(true);
    try {
      const url = `/api/followups?filter=${activeFilter}&search=${encodeURIComponent(searchTerm)}`;
      const res = await authFetch(url);
      const data = await res.json();
      if (data.success) {
        setFollowups(data.followups || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Error loading follow-ups', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    loadFollowups();
  }, [activeFilter, searchTerm]);

  const handleTriggerReminders = async () => {
    setTriggering(true);
    try {
      const res = await authFetch('/api/messaging/trigger-reminders', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const { processedCount, simulatedCount, sentCount, failedCount } = data.results;
        addToast(`Scheduler executed. Processed: ${processedCount}. (Simulated: ${simulatedCount}, Sent: ${sentCount}, Failed: ${failedCount})`, 'success');
        loadFollowups();
      } else {
        addToast(data.message || 'Failed to trigger reminders', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to trigger reminder check', 'error');
    } finally {
      setTriggering(false);
    }
  };

  const handleRetry = async (id) => {
    setRetryingId(id);
    try {
      const res = await authFetch(`/api/followups/${id}/retry`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (data.result?.success) {
          addToast('WhatsApp reminder retried successfully!', 'success');
        } else {
          addToast(`Retry failed: ${data.result?.error || 'Unknown error'}`, 'error');
        }
        loadFollowups();
      } else {
        addToast(data.message || 'Retry failed', 'error');
      }
    } catch (err) {
      addToast('Failed to retry reminder', 'error');
    } finally {
      setRetryingId(null);
    }
  };

  const getDaysSinceVisit = (visitDate) => {
    if (!visitDate) return 0;
    const diffTime = Math.abs(new Date() - new Date(visitDate));
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const renderBadge = (item) => {
    const isSent = item.reminderSent || item.status === 'Sent' || item.status === 'Completed' || item.whatsappStatus === 'Sent';
    const isFailed = item.status === 'Failed' || item.whatsappStatus === 'Failed';

    if (isSent) {
      return (
        <span className="fup-badge-pill sent" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '0.78rem',
          fontWeight: '600',
          background: 'rgba(46, 204, 113, 0.15)',
          color: '#2ecc71',
          border: '1px solid rgba(46, 204, 113, 0.3)'
        }}>
          🟢 Sent
        </span>
      );
    }

    if (isFailed) {
      return (
        <span className="fup-badge-pill failed" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '0.78rem',
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
      <span className="fup-badge-pill pending" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '0.78rem',
        fontWeight: '600',
        background: 'rgba(241, 196, 15, 0.15)',
        color: '#f1c40f',
        border: '1px solid rgba(241, 196, 15, 0.3)'
      }}>
        🟡 Pending
      </span>
    );
  };

  const getMessagePreviewText = (item) => {
    const custName = item.customerName || item.customer?.name || 'Customer';
    const serviceName = item.serviceName || item.lastService || item.visit?.service || 'Salon Service';
    const vDate = item.visitDate || item.visit?.visitDate;
    const formattedDate = vDate ? new Date(vDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently';

    return `Hello ${custName},\n\nWe hope you enjoyed your ${serviceName} on ${formattedDate} at Scissor Lines Salon!\n\nIt's time for your next pampering session. Book your next visit today.\n\nScissor Lines Hair & Beauty Unisex Salon`;
  };

  return (
    <div className="followups-root animate-fade-in-simple">
      
      {/* Dev Mode Banner with Manual Cron Trigger (Only in Development Mode) */}
      {isDevEnvironment && (
        <div className="test-mode-alert-banner" style={{
          background: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid #d4af37',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#d4af37',
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span><strong>Development Mode Active:</strong> Automatic node-cron runs daily at 9:00 AM. You can manually test the scheduler trigger below.</span>
          </div>
          <button 
            className="btn btn-gold btn-sm"
            onClick={handleTriggerReminders}
            disabled={triggering}
            style={{ margin: 0, padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            {triggering ? 'Executing Cron...' : 'Run Reminder Check Now'}
          </button>
        </div>
      )}

      {/* Filter Tabs Header */}
      <div className="followups-header-card glass-card">
        <div className="segments-wrapper">
          <button 
            className={`segment-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All ({counts.all})
          </button>
          <button 
            className={`segment-btn ${activeFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveFilter('pending')}
          >
            🟡 Pending ({counts.pending})
          </button>
          <button 
            className={`segment-btn ${activeFilter === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveFilter('sent')}
          >
            🟢 Sent ({counts.sent})
          </button>
          <button 
            className={`segment-btn ${activeFilter === 'failed' ? 'active' : ''}`}
            onClick={() => setActiveFilter('failed')}
          >
            🔴 Failed ({counts.failed})
          </button>
          <button 
            className={`segment-btn ${activeFilter === 'today' ? 'active' : ''}`}
            onClick={() => setActiveFilter('today')}
          >
            <Clock size={14} style={{ marginRight: '6px' }} />
            Today ({counts.today})
          </button>
          <button 
            className={`segment-btn ${activeFilter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveFilter('upcoming')}
          >
            <Calendar size={14} style={{ marginRight: '6px' }} />
            Upcoming ({counts.upcoming})
          </button>
          <button 
            className={`segment-btn ${activeFilter === 'overdue' ? 'active' : ''}`}
            onClick={() => setActiveFilter('overdue')}
          >
            <AlertCircle size={14} style={{ marginRight: '6px' }} />
            Overdue ({counts.overdue})
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="search-bar-card glass-card" style={{ padding: '0.85rem 1.5rem' }}>
        <div className="search-input-wrapper" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0 0.75rem' }}>
          <Search size={16} style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }} />
          <input 
            type="text"
            className="form-control"
            placeholder="Search by customer name, phone number, or service name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '0.65rem 0', color: 'var(--text-primary)' }}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main List Deck grid */}
      {loading ? (
        <div className="spinner" style={{ margin: '4rem auto' }}></div>
      ) : followups.length === 0 ? (
        <div className="empty-followups glass-card text-center">
          <Check className="success-icon" size={48} style={{ margin: '0 auto 1rem' }} />
          <h3>No Follow-ups Found</h3>
          <p className="text-secondary">No follow-up records match the selected filter and search criteria.</p>
        </div>
      ) : (
        <div className="followups-cards-grid">
          {followups.map((item) => {
            const custName = item.customerName || item.customer?.name || 'Customer';
            const custPhone = item.phone || item.customer?.phone || 'N/A';
            const serviceName = item.serviceName || item.lastService || item.visit?.service || 'Service';
            const vDate = item.visitDate || item.visit?.visitDate;
            const rDate = item.reminderDate || item.followupDate;
            const isFailed = item.status === 'Failed' || item.whatsappStatus === 'Failed';
            const isSent = item.reminderSent || item.status === 'Sent' || item.status === 'Completed' || item.whatsappStatus === 'Sent';

            return (
              <div key={item._id} className="followup-card-item glass-card animate-fade-in-simple">
                
                {/* Card Header details */}
                <div className="fup-card-header">
                  <div>
                    <h4 className="fup-client-name">{custName}</h4>
                    <span className="fup-client-phone">{custPhone}</span>
                  </div>
                  {renderBadge(item)}
                </div>

                {/* Service details */}
                <div className="fup-card-body">
                  <p><strong>Service:</strong> {serviceName}</p>
                  <p>
                    <strong>Visit Date:</strong> {vDate ? new Date(vDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </p>
                  <p>
                    <strong>Days Since Visit:</strong> {getDaysSinceVisit(vDate)} days
                  </p>
                  <p>
                    <strong>Reminder Date:</strong> {rDate ? new Date(rDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </p>

                  <div style={{ marginTop: '0.5rem', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>WhatsApp Status: </span>
                    <strong style={{ color: isSent ? '#2ecc71' : isFailed ? '#e74c3c' : '#f1c40f' }}>
                      {item.whatsappStatus || (isSent ? 'Sent' : isFailed ? 'Failed' : 'Waiting')}
                    </strong>
                  </div>

                  {item.errorLog && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.4rem 0.6rem',
                      background: 'rgba(231, 76, 60, 0.1)',
                      border: '1px solid rgba(231, 76, 60, 0.3)',
                      borderRadius: '4px',
                      color: '#e74c3c',
                      fontSize: '0.72rem'
                    }}>
                      Error: {item.errorLog}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="fup-card-actions">
                  <button 
                    className="fup-action-btn reschedule"
                    onClick={() => setPreviewItem(item)}
                  >
                    <Eye size={14} /> Preview Message
                  </button>

                  {isFailed && (
                    <button 
                      className="fup-action-btn complete"
                      onClick={() => handleRetry(item._id)}
                      disabled={retryingId === item._id}
                      style={{ background: 'var(--danger)', color: '#fff' }}
                    >
                      <RotateCw size={14} className={retryingId === item._id ? 'spinning' : ''} />
                      {retryingId === item._id ? 'Retrying...' : 'Retry Meta WhatsApp'}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Preview Message Modal */}
      {previewItem && (
        <div className="modal-overlay" onClick={() => setPreviewItem(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>WhatsApp Message Preview</h3>
              <button className="modal-close" onClick={() => setPreviewItem(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-form">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Previewing official Meta WhatsApp template message for <strong>{previewItem.customerName || previewItem.customer?.name}</strong>:
              </p>

              <div style={{
                background: '#0b141a',
                border: '1px solid #2a3942',
                borderRadius: '8px',
                padding: '1.25rem',
                color: '#e9edef',
                fontFamily: 'sans-serif',
                whiteSpace: 'pre-wrap',
                fontSize: '0.9rem',
                lineHeight: '1.5'
              }}>
                {getMessagePreviewText(previewItem)}
              </div>

              <div className="modal-actions mt-3">
                <button type="button" className="btn btn-gold btn-block" onClick={() => setPreviewItem(null)}>
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Followups;
