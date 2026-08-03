import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, Plus, User, Phone, Mail, FileText, 
  PlusCircle, Check, Coins, X, CheckCircle2
} from 'lucide-react';
import './Customers.css';

const Customers = () => {
  const { authFetch, addToast } = useAuth();
  
  // States
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomerVisits, setSelectedCustomerVisits] = useState([]);
  
  // Registration Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  // Log Visit / Walk-in Form State
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [services, setServices] = useState([]);
  const [visitForm, setVisitForm] = useState({
    name: '',
    phone: '',
    service: '',
    amount: '',
    visitDate: new Date().toISOString().split('T')[0],
    staffMember: 'Alex',
    notes: '',
    followupIntervalDays: '30'
  });

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
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
        if (data.services.length > 0) {
          setVisitForm(prev => ({ ...prev, service: data.services[0].name, amount: data.services[0].price.toString() }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadServices();
  }, []);

  // Search by Phone number
  const performPhoneSearch = async (phoneVal) => {
    if (!phoneVal || phoneVal.trim().length < 10) return;
    
    try {
      const cleanPhone = phoneVal.trim();
      const res = await authFetch(`/api/customers/search?phone=${cleanPhone}`);
      const data = await res.json();
      if (data.success) {
        if (data.found) {
          setSelectedCustomer(data.customer);
          setSelectedCustomerVisits(data.visits);
          addToast(`Customer located: ${data.customer.name}`, 'success');
        } else {
          setSelectedCustomer(null);
          setSelectedCustomerVisits([]);
          addToast('Customer not found with this phone number. You can register them below.', 'warning');
          setAddForm(prev => ({ ...prev, phone: cleanPhone }));
          setShowAddForm(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Automatic search when typing 10 digits
  const handlePhoneInputChange = (e) => {
    const val = e.target.value;
    setSearchPhone(val);

    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length === 10) {
      performPhoneSearch(cleaned);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchPhone) {
      performPhoneSearch(searchPhone);
    }
  };

  // Add Customer submit
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.phone) {
      addToast('Please provide Name and Phone number', 'warning');
      return;
    }

    try {
      const res = await authFetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify(addForm)
      });
      const data = await res.json();
      if (data.success) {
        addToast('New customer profile created!', 'success');
        setAddForm({ name: '', phone: '', email: '', notes: '' });
        setShowAddForm(false);
        setSelectedCustomer(data.customer);
        setSelectedCustomerVisits([]);
        loadCustomers();
      } else {
        addToast(data.message || 'Failed to add customer', 'error');
      }
    } catch (err) {
      addToast('Network error', 'error');
    }
  };

  // Service select updates amount auto-fill in log visit form
  const handleServiceChange = (serviceName) => {
    const matchedService = services.find(s => s.name === serviceName);
    setVisitForm({
      ...visitForm,
      service: serviceName,
      amount: matchedService ? matchedService.price.toString() : ''
    });
  };

  // Log Visit / Complete Service submit
  const handleLogVisit = async (e) => {
    e.preventDefault();
    if (!visitForm.service || visitForm.amount === undefined || !visitForm.staffMember) {
      addToast('Please fill all required visit details', 'warning');
      return;
    }

    const payload = {
      customerId: selectedCustomer ? selectedCustomer._id : undefined,
      phone: visitForm.phone || (selectedCustomer ? selectedCustomer.phone : ''),
      name: visitForm.name || (selectedCustomer ? selectedCustomer.name : ''),
      service: visitForm.service,
      amount: visitForm.amount,
      visitDate: visitForm.visitDate,
      staffMember: visitForm.staffMember,
      notes: visitForm.notes,
      status: 'Completed',
      followupIntervalDays: visitForm.followupIntervalDays || '30'
    };

    try {
      const res = await authFetch('/api/visits', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        addToast('Visit saved & Meta WhatsApp follow-up scheduled automatically!', 'success');
        setShowVisitForm(false);
        
        // Refresh active customer data
        if (data.customer) {
          setSelectedCustomer(data.customer);
          const vRes = await authFetch(`/api/customers/${data.customer._id}`);
          const vData = await vRes.json();
          if (vData.success) {
            setSelectedCustomerVisits(vData.visits);
          }
        }
        
        loadCustomers();
      } else {
        addToast(data.message || 'Error saving visit', 'error');
      }
    } catch (err) {
      addToast('Network error', 'error');
    }
  };

  // Row selection handler
  const handleSelectRow = async (customer) => {
    setSelectedCustomer(customer);
    try {
      const res = await authFetch(`/api/customers/${customer._id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedCustomerVisits(data.visits);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="customers-root animate-fade-in-simple">
      
      {/* Search HUD header */}
      <div className="search-hud-card glass-card">
        <form onSubmit={handleSearchSubmit} className="search-phone-form">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="tel" 
              placeholder="Search customer by entering 10-digit phone number... (Auto-searches)"
              className="form-control"
              value={searchPhone}
              onChange={handlePhoneInputChange}
            />
          </div>
          <button type="submit" className="btn btn-gold search-btn">
            Search Phone
          </button>
        </form>
      </div>

      {/* Main Customers Split Container */}
      <div className="customers-split-grid">
        
        {/* Left Column: Customer Detailed Profiler */}
        <div className="profiler-card-col">
          {selectedCustomer ? (
            <div className="profile-details-card glass-card animate-fade-in-simple">
              
              {/* Profile Card Header */}
              <div className="profile-details-header">
                <div className="initials-circle">
                  {selectedCustomer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="profile-bio">
                  <h3>{selectedCustomer.name}</h3>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                    <span className={`badge badge-${selectedCustomer.category.toLowerCase().replace(' ', '-')}`}>
                      {selectedCustomer.category}
                    </span>
                    <Link to={`/admin/customers/${selectedCustomer._id}`} className="view-profile-link" style={{ fontSize: '0.75rem', textDecoration: 'underline', color: 'var(--accent-gold)' }}>
                      View Full Profile →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Profile contact grid */}
              <div className="profile-meta-grid">
                <div className="meta-row">
                  <Phone size={14} className="meta-icon" />
                  <span>{selectedCustomer.phone}</span>
                </div>
                {selectedCustomer.email && (
                  <div className="meta-row">
                    <Mail size={14} className="meta-icon" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                )}
                <div className="meta-row">
                  <FileText size={14} className="meta-icon" />
                  <span>Notes: {selectedCustomer.notes || 'None logged.'}</span>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="profile-stats-grid">
                <div className="stat-box">
                  <span className="stat-label">Total Visits</span>
                  <span className="stat-value">{selectedCustomer.totalVisits}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Total spent</span>
                  <span className="stat-value font-gold">₹{selectedCustomer.totalSpent}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Last visit</span>
                  <span className="stat-value date">
                    {selectedCustomer.lastVisitDate 
                      ? new Date(selectedCustomer.lastVisitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'None'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="profile-actions-banner">
                <button 
                  className="btn btn-gold btn-block"
                  onClick={() => {
                    setVisitForm(prev => ({
                      ...prev,
                      name: selectedCustomer.name,
                      phone: selectedCustomer.phone,
                      service: services[0]?.name || 'Haircut',
                      amount: services[0]?.price?.toString() || '500'
                    }));
                    setShowVisitForm(true);
                  }}
                >
                  <PlusCircle size={14} style={{ marginRight: '6px' }} /> Log New Visit
                </button>
              </div>

              {/* Visits History list */}
              <div className="visits-history-section">
                <h4>Visit History Log</h4>
                <div className="visits-scroller">
                  {selectedCustomerVisits.length === 0 ? (
                    <p className="text-secondary text-center font-sm">No visits logged for this client.</p>
                  ) : (
                    selectedCustomerVisits.map((visit) => (
                      <div key={visit._id} className="visit-history-strip">
                        <div className="visit-strip-left">
                          <strong>{visit.service}</strong>
                          <span>Stylist: {visit.staffMember} • Date: {new Date(visit.visitDate).toLocaleDateString()}</span>
                        </div>
                        <div className="visit-strip-right">
                          <strong className="font-gold">₹{visit.amount}</strong>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="profile-empty-state glass-card text-center">
              <User className="empty-icon-avatar" size={48} />
              <h4>No Customer Selected</h4>
              <p className="text-secondary">Type a 10-digit phone number above to search automatically or click a customer from the directory.</p>
            </div>
          )}
        </div>

        {/* Right Column: Listing Table / Registration Card */}
        <div className="directory-list-col">
          
          {showAddForm ? (
            <div className="registration-card glass-card animate-fade-in-simple">
              <div className="card-header">
                <h4>New Customer Registration</h4>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
              </div>

              <form onSubmit={handleAddCustomer} className="registration-form">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="E.g., Moksh Patel"
                    className="form-control"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="10-digit number"
                    className="form-control"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="client@example.com"
                    className="form-control"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Internal Notes / Styling Preferences</label>
                  <textarea 
                    rows="3"
                    placeholder="Prefers hot water, sensitive skin notes, styling choices"
                    className="form-control"
                    value={addForm.notes}
                    onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-gold btn-block">
                  Save Customer Profile
                </button>
              </form>
            </div>
          ) : (
            <div className="directory-table-card glass-card">
              <div className="card-header">
                <h4>Customer Directory</h4>
                <button className="btn btn-gold btn-sm" onClick={() => setShowAddForm(true)}>
                  <Plus size={14} /> New Customer
                </button>
              </div>

              <div className="table-scroll-wrapper">
                {loading ? (
                  <div className="spinner" style={{ margin: '3rem auto' }}></div>
                ) : customers.length === 0 ? (
                  <p className="text-secondary text-center mt-3">No customers registered yet.</p>
                ) : (
                  <table className="crm-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Category</th>
                        <th className="text-right">Spent</th>
                        <th className="text-right">Visits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((cust) => (
                        <tr 
                          key={cust._id} 
                          className={`table-row-clickable ${selectedCustomer?._id === cust._id ? 'selected' : ''}`}
                          onClick={() => handleSelectRow(cust)}
                        >
                          <td>
                            <div className="table-cust-cell">
                              <strong>{cust.name}</strong>
                              <span>{cust.phone}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-${cust.category.toLowerCase().replace(' ', '-')}`}>
                              {cust.category}
                            </span>
                          </td>
                          <td className="text-right font-semibold">₹{cust.totalSpent}</td>
                          <td className="text-right">{cust.totalVisits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Walk-in / Log Visit Modal Overlay */}
      {showVisitForm && (
        <div className="modal-overlay" onClick={() => setShowVisitForm(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log Visit (Walk-in / Service Complete)</h3>
              <button className="modal-close" onClick={() => setShowVisitForm(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleLogVisit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input 
                    type="text" 
                    required
                    className="form-control"
                    value={visitForm.name}
                    onChange={(e) => setVisitForm({ ...visitForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input 
                    type="tel" 
                    required
                    className="form-control"
                    value={visitForm.phone}
                    onChange={(e) => setVisitForm({ ...visitForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Select Service Rendered *</label>
                <select 
                  className="form-control"
                  value={visitForm.service}
                  onChange={(e) => handleServiceChange(e.target.value)}
                >
                  {services.map((s) => (
                    <option key={s._id} value={s.name}>{s.name} (₹{s.price})</option>
                  ))}
                  <option value="Custom Service">Custom / Other Service</option>
                </select>
              </div>

              {visitForm.service === 'Custom Service' && (
                <div className="form-group">
                  <label>Custom Service Description</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Enter custom service details"
                    onChange={(e) => setVisitForm({ ...visitForm, service: e.target.value })}
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Amount Settled (₹) *</label>
                  <div className="input-with-icon-left">
                    <Coins size={14} className="icon-left" />
                    <input 
                      type="number" 
                      required
                      className="form-control pl-icon"
                      value={visitForm.amount}
                      onChange={(e) => setVisitForm({ ...visitForm, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Staff Stylist *</label>
                  <select 
                    className="form-control"
                    value={visitForm.staffMember}
                    onChange={(e) => setVisitForm({ ...visitForm, staffMember: e.target.value })}
                  >
                    <option value="Alex">Alex</option>
                    <option value="Maria">Maria</option>
                    <option value="Sofia">Sofia</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Visit Date</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={visitForm.visitDate}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setVisitForm({ ...visitForm, visitDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Remind in (Days)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={visitForm.followupIntervalDays}
                    onChange={(e) => setVisitForm({ ...visitForm, followupIntervalDays: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Visit Notes</label>
                <textarea 
                  rows="2"
                  className="form-control"
                  placeholder="Styling preferences, notes..."
                  value={visitForm.notes}
                  onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-actions mt-3">
                <button type="button" className="btn btn-secondary" onClick={() => setShowVisitForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-gold">
                  <CheckCircle2 size={14} style={{ marginRight: '6px' }} /> Complete Service & Auto-Schedule Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Customers;
