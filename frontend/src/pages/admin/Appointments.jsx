import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, Clock, Plus, Check, X, Trash2, 
  Edit2, User, Phone, CheckCircle2, AlertCircle, Coins
} from 'lucide-react';
import './Appointments.css';

const Appointments = () => {
  const { authFetch, addToast } = useAuth();

  // Lists and state
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');

  // Modal forms states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editApptId, setEditApptId] = useState(null);
  const [apptForm, setApptForm] = useState({
    name: '',
    phone: '',
    email: '',
    service: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM',
    notes: '',
    status: 'confirmed'
  });



  const timeSlots = [
    '09:30 AM', '10:30 AM', '11:30 AM', '01:00 PM', 
    '02:30 PM', '04:00 PM', '05:30 PM', '07:00 PM'
  ];

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/appointments');
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (data.success) {
        setServices(data.services);
        if (data.services.length > 0 && !apptForm.service) {
          setApptForm(prev => ({ ...prev, service: data.services[0].name }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAppointments();
    loadServices();
  }, []);

  // Filter appointments dynamically by active tab
  const getFilteredAppointments = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    return appointments.filter(appt => {
      const apptDateStr = new Date(appt.date).toISOString().split('T')[0];

      if (activeTab === 'today') {
        return apptDateStr === todayStr && appt.status !== 'completed' && appt.status !== 'cancelled';
      } else if (activeTab === 'upcoming') {
        return apptDateStr > todayStr && appt.status !== 'completed' && appt.status !== 'cancelled';
      } else if (activeTab === 'completed') {
        return appt.status === 'completed';
      } else {
        return appt.status === 'cancelled';
      }
    });
  };

  // Submit appointment add/edit form
  const handleApptSubmit = async (e) => {
    e.preventDefault();
    if (!apptForm.name || !apptForm.phone || !apptForm.service) {
      addToast('Please fill all required fields', 'warning');
      return;
    }

    try {
      let url = '/api/appointments';
      let method = 'POST';
      if (editApptId) {
        url = `/api/appointments/${editApptId}`;
        method = 'PUT';
      }

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(apptForm)
      });
      const data = await res.json();
      
      if (data.success) {
        addToast(editApptId ? 'Appointment updated!' : 'New appointment scheduled!', 'success');
        setShowFormModal(false);
        setEditApptId(null);
        setApptForm({
          name: '',
          phone: '',
          email: '',
          service: services[0]?.name || '',
          date: new Date().toISOString().split('T')[0],
          timeSlot: '10:00 AM',
          notes: '',
          status: 'confirmed'
        });
        loadAppointments();
      }
    } catch (err) {
      addToast('Error saving appointment', 'error');
    }
  };

  // Confirm appointment & launch WhatsApp confirmation
  const handleConfirm = async (appt) => {
    try {
      const res = await authFetch(`/api/appointments/${appt._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'confirmed' })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Appointment confirmed!', 'success');
        loadAppointments();

        // Format Date for readability (e.g. 15 July 2026)
        const formattedDate = new Date(appt.date).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

        // Format phone (ensure country code e.g. 91)
        let phoneNum = appt.phone.replace(/\D/g, '');
        if (phoneNum.length === 10) {
          phoneNum = '91' + phoneNum;
        }

        const message = `Hello ${appt.name},\n\nYour appointment with Scissor Lines Salon has been confirmed.\n\nDate:\n${formattedDate}\n\nTime:\n${appt.timeSlot}\n\nThank you for choosing us.\n\nScissor Lines\nHair & Beauty Unisex Salon`;
        const whatsappUrl = `https://wa.me/${phoneNum}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  // Cancel appointment
  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      const res = await authFetch(`/api/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled' })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Appointment cancelled', 'success');
        loadAppointments();
      }
    } catch (err) {
      addToast('Failed to cancel appointment', 'error');
    }
  };

  // Complete appointment trigger
  const handleCompleteTrigger = async (appt) => {
    if (!window.confirm(`Mark appointment for ${appt.customer?.name || appt.name} as completed? This will automatically log a visit and schedule a 30-day follow-up.`)) return;
    
    setLoading(true);
    try {
      const res = await authFetch(`/api/appointments/${appt._id}/complete`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        addToast('Appointment completed and visit logged successfully!', 'success');
        await loadAppointments();
      } else {
        addToast(data.message || 'Failed to complete appointment', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error completing appointment', 'error');
    } finally {
      setLoading(false);
    }
  };



  // Delete appointment
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this appointment permanently?')) return;
    try {
      const res = await authFetch(`/api/appointments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast('Appointment deleted', 'success');
        loadAppointments();
      }
    } catch (err) {
      addToast('Error deleting appointment', 'error');
    }
  };

  const filteredAppts = getFilteredAppointments();

  return (
    <div className="appointments-root animate-fade-in-simple">
      
      {/* Tabs / Heading */}
      <div className="appointments-header-card glass-card">
        <div className="tabs-wrapper">
          <button 
            className={`tab-item ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            Today's Schedule
          </button>
          <button 
            className={`tab-item ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Bookings
          </button>
          <button 
            className={`tab-item ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed Sessions
          </button>
          <button 
            className={`tab-item ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelled bookings
          </button>
        </div>

        <button 
          className="btn btn-gold new-appt-btn"
          onClick={() => {
            setEditApptId(null);
            setApptForm({
              name: '',
              phone: '',
              email: '',
              service: services[0]?.name || 'Haircut',
              date: new Date().toISOString().split('T')[0],
              timeSlot: '10:00 AM',
              notes: '',
              status: 'confirmed'
            });
            setShowFormModal(true);
          }}
        >
          <Plus size={14} /> Schedule Appointment
        </button>
      </div>

      {/* Main Grid display list */}
      <div className="appointments-grid-card glass-card">
        {loading ? (
          <div className="spinner" style={{ margin: '4rem auto' }}></div>
        ) : filteredAppts.length === 0 ? (
          <div className="empty-appointments text-center">
            <AlertCircle size={48} className="empty-icon" />
            <h3>No Appointments Found</h3>
            <p className="text-secondary">No records exist for the selected scheduling deck.</p>
          </div>
        ) : (
          <div className="appointments-list-cards">
            {filteredAppts.map((appt) => (
              <div key={appt._id} className="appointment-row-card glass-card">
                <div className="appt-card-left">
                  <div className="appt-avatar">
                    <User size={18} className="avatar-icon" />
                  </div>
                  <div className="appt-client-info">
                    <h4 className="client-name">{appt.customer?.name || appt.name}</h4>
                    <span className="client-phone">
                      <Phone size={11} style={{ marginRight: '4px' }} /> {appt.customer?.phone || appt.phone}
                    </span>
                  </div>
                </div>

                <div className="appt-card-details">
                  <div className="detail-item">
                    <span className="label">Service</span>
                    <strong className="value service-text">{appt.service}</strong>
                  </div>
                  <div className="detail-item">
                    <span className="label">Scheduled Time</span>
                    <strong className="value datetime-text">
                      {new Date(appt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {appt.timeSlot}
                    </strong>
                  </div>
                </div>

                <div className="appt-card-status">
                  <span className={`badge badge-${appt.status}`}>{appt.status}</span>
                </div>

                <div className="appt-card-actions">
                  {appt.status === 'pending' && (
                    <button 
                      className="appt-action-btn btn-confirm"
                      onClick={() => handleConfirm(appt)}
                      title="Confirm Booking"
                    >
                      <Check size={13} /> Confirm
                    </button>
                  )}
                  {(appt.status === 'confirmed' || appt.status === 'pending') && (
                    <button 
                      className="appt-action-btn btn-complete"
                      onClick={() => handleCompleteTrigger(appt)}
                      title="Complete & Log Visit"
                    >
                      <CheckCircle2 size={13} /> Complete
                    </button>
                  )}
                  {(appt.status === 'confirmed' || appt.status === 'pending') && (
                    <button 
                      className="appt-action-btn btn-cancel"
                      onClick={() => handleCancel(appt._id)}
                      title="Cancel Booking"
                    >
                      <X size={13} /> Cancel
                    </button>
                  )}
                  
                  {/* Edit/Delete Icon buttons */}
                  <div className="icon-actions-group">
                    <button 
                      className="appt-icon-btn edit"
                      onClick={() => {
                        setEditApptId(appt._id);
                        setApptForm({
                          name: appt.customer?.name || appt.name,
                          phone: appt.customer?.phone || appt.phone,
                          email: appt.customer?.email || appt.email || '',
                          service: appt.service,
                          date: new Date(appt.date).toISOString().split('T')[0],
                          timeSlot: appt.timeSlot,
                          notes: appt.notes,
                          status: appt.status
                        });
                        setShowFormModal(true);
                      }}
                      title="Edit Details"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      className="appt-icon-btn delete"
                      onClick={() => handleDelete(appt._id)}
                      title="Delete Permanent"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Appointment Modal */}
      {showFormModal && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editApptId ? 'Edit Appointment' : 'Schedule Appointment'}</h3>
              <button className="modal-close" onClick={() => setShowFormModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApptSubmit} className="modal-form">
              <div className="form-group">
                <label>Client Full Name *</label>
                <input 
                  type="text" 
                  required
                  className="form-control"
                  value={apptForm.name}
                  onChange={(e) => setApptForm({ ...apptForm, name: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Client Phone *</label>
                  <input 
                    type="tel" 
                    required
                    className="form-control"
                    value={apptForm.phone}
                    onChange={(e) => setApptForm({ ...apptForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    className="form-control"
                    value={apptForm.email}
                    onChange={(e) => setApptForm({ ...apptForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Service Interest</label>
                <select 
                  className="form-control"
                  value={apptForm.service}
                  onChange={(e) => setApptForm({ ...apptForm, service: e.target.value })}
                >
                  {services.map(s => (
                    <option key={s._id} value={s.name}>{s.name} (₹{s.price})</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Scheduled Date</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={apptForm.date}
                    onChange={(e) => setApptForm({ ...apptForm, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Time Slot</label>
                  <select 
                    className="form-control"
                    value={apptForm.timeSlot}
                    onChange={(e) => setApptForm({ ...apptForm, timeSlot: e.target.value })}
                  >
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Special Instructions / Notes</label>
                <textarea 
                  rows="2"
                  className="form-control"
                  value={apptForm.notes}
                  onChange={(e) => setApptForm({ ...apptForm, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-actions mt-3">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-gold">
                  Schedule Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



    </div>
  );
};

export default Appointments;
