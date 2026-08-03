import React, { useState, useEffect } from 'react';
import { X, Scissors, Gift, Settings as SettingsIcon, Plus, Edit2, Trash2, Save, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './SettingsDrawer.css';

const SettingsDrawer = ({ open, onClose }) => {
  const { authFetch, addToast } = useAuth();
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  
  // Service CRUD form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editServiceId, setEditServiceId] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: 'Hair',
    price: '',
    duration: '',
    description: '',
    icon: 'Scissors'
  });

  // Salon Configuration Settings State
  const [salonSettings, setSalonSettings] = useState({
    salonPhone: '+919876543210',
    reminderDays: '30',
    whatsappTemplate: "Hello [Customer Name],\n\nThank you for visiting Scissor Lines Salon.\nIt's been a while since your last visit.\n\nWe would love to welcome you back.\n\nContact us:\n[Phone Number]"
  });

  // Admin Profile settings state
  const [profileForm, setProfileForm] = useState({
    name: 'Salon Owner',
    email: 'admin@scissorlines.com',
    password: '',
    confirmPassword: ''
  });

  // WhatsApp Automation configuration state
  const [whatsappAutomation, setWhatsappAutomation] = useState({
    provider: 'none',
    apiKey: '',
    phoneNumberId: '',
    templateNamePre3Day: 'salon_reminder_3day',
    templateNameDueDay: 'salon_reminder_today',
    testMode: true
  });
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Load services for listing
  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const res = await authFetch('/api/services/admin');
      const data = await res.json();
      if (data.success) {
        setServices(data.services);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchWhatsappConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await authFetch('/api/messaging/config');
      const data = await res.json();
      if (data.success && data.config) {
        setWhatsappAutomation({
          provider: data.config.provider || 'none',
          apiKey: data.config.apiKey || '',
          phoneNumberId: data.config.phoneNumberId || '',
          templateNamePre3Day: data.config.templateNamePre3Day || 'salon_reminder_3day',
          templateNameDueDay: data.config.templateNameDueDay || 'salon_reminder_today',
          testMode: data.config.testMode !== undefined ? data.config.testMode : true
        });
      }
    } catch (err) {
      console.error(err);
      addToast('Error loading WhatsApp configuration', 'error');
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveWhatsappConfig = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/messaging/config', {
        method: 'PUT',
        body: JSON.stringify(whatsappAutomation)
      });
      const data = await res.json();
      if (data.success) {
        addToast('WhatsApp Automation settings updated!', 'success');
        if (data.config) {
          setWhatsappAutomation({
            provider: data.config.provider || 'none',
            apiKey: data.config.apiKey || '',
            phoneNumberId: data.config.phoneNumberId || '',
            templateNamePre3Day: data.config.templateNamePre3Day || 'salon_reminder_3day',
            templateNameDueDay: data.config.templateNameDueDay || 'salon_reminder_today',
            testMode: data.config.testMode !== undefined ? data.config.testMode : true
          });
        }
      } else {
        addToast(data.message || 'Failed to save settings', 'error');
      }
    } catch (err) {
      addToast('Failed to save settings', 'error');
    }
  };

  useEffect(() => {
    if (open) {
      fetchServices();
      fetchWhatsappConfig();
      // Load saved configurations from localStorage if any
      const savedConfig = localStorage.getItem('salon_configs');
      if (savedConfig) {
        setSalonSettings(JSON.parse(savedConfig));
      }
    }
  }, [open]);

  // Handle service submit
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    if (!serviceForm.name || !serviceForm.price || !serviceForm.duration) {
      addToast('Please fill all required service fields', 'warning');
      return;
    }

    try {
      let url = '/api/services';
      let method = 'POST';
      if (editServiceId) {
        url = `/api/services/${editServiceId}`;
        method = 'PUT';
      }

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(serviceForm)
      });
      const data = await res.json();

      if (data.success) {
        addToast(editServiceId ? 'Service updated successfully!' : 'New service added!', 'success');
        setServiceForm({ name: '', category: 'Hair', price: '', duration: '', description: '', icon: 'Scissors' });
        setShowAddForm(false);
        setEditServiceId(null);
        fetchServices();
      } else {
        addToast(data.message || 'Error saving service', 'error');
      }
    } catch (err) {
      addToast('Failed to save service', 'error');
    }
  };

  // Delete Service handler
  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      const res = await authFetch(`/api/services/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast('Service deleted successfully', 'success');
        fetchServices();
      }
    } catch (err) {
      addToast('Failed to delete service', 'error');
    }
  };

  // Save configurations
  const handleSaveConfigs = (e) => {
    e.preventDefault();
    localStorage.setItem('salon_configs', JSON.stringify(salonSettings));
    addToast('Preferences saved successfully!', 'success');
  };

  // Update password/credentials
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (profileForm.password !== profileForm.confirmPassword) {
      addToast('Passwords do not match', 'warning');
      return;
    }
    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          password: profileForm.password || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Admin credentials updated!', 'success');
        setProfileForm({ ...profileForm, password: '', confirmPassword: '' });
      }
    } catch (err) {
      addToast('Failed to update credentials', 'error');
    }
  };

  if (!open) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="drawer-header">
          <h3 className="drawer-title">Boutique Console</h3>
          <button className="drawer-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="drawer-tabs">
          <button 
            className={`drawer-tab-btn ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => { setActiveTab('services'); setShowAddForm(false); setEditServiceId(null); }}
          >
            <Scissors size={14} /> Services
          </button>
          <button 
            className={`drawer-tab-btn ${activeTab === 'promotions' ? 'active' : ''}`}
            onClick={() => setActiveTab('promotions')}
          >
            <Gift size={14} /> Offers
          </button>
          <button 
            className={`drawer-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon size={14} /> Salon Settings
          </button>
        </div>

        {/* Content body wrapper */}
        <div className="drawer-body">
          
          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="tab-pane animate-fade-in-simple">
              <div className="pane-header">
                <h4>Services Catalog</h4>
                {!showAddForm && (
                  <button className="btn btn-gold btn-sm" onClick={() => setShowAddForm(true)}>
                    <Plus size={14} /> Add Service
                  </button>
                )}
              </div>

              {showAddForm || editServiceId ? (
                // Add/Edit Service Form
                <form onSubmit={handleServiceSubmit} className="service-crud-form">
                  <h5>{editServiceId ? 'Edit Service' : 'Add New Service'}</h5>
                  <div className="form-group">
                    <label>Service Name *</label>
                    <input 
                      type="text" 
                      required
                      className="form-control dark-input" 
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                      placeholder="E.g., Beard Trim combo"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Category</label>
                      <select 
                        className="form-control dark-input"
                        value={serviceForm.category}
                        onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                      >
                        <option value="Hair">Hair</option>
                        <option value="Skin Care">Skin Care</option>
                        <option value="Grooming">Grooming</option>
                        <option value="Makeup">Makeup</option>
                        <option value="Hair Treatment">Hair Treatment</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Icon</label>
                      <select 
                        className="form-control dark-input"
                        value={serviceForm.icon}
                        onChange={(e) => setServiceForm({ ...serviceForm, icon: e.target.value })}
                      >
                        <option value="Scissors">Scissors</option>
                        <option value="Sparkles">Sparkles</option>
                        <option value="Heart">Heart</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Price (₹) *</label>
                      <input 
                        type="number" 
                        required
                        className="form-control dark-input"
                        value={serviceForm.price}
                        onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Duration (mins) *</label>
                      <input 
                        type="number" 
                        required
                        className="form-control dark-input"
                        value={serviceForm.duration}
                        onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea 
                      className="form-control dark-input"
                      rows="2"
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setShowAddForm(false); setEditServiceId(null); }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-gold btn-sm">
                      <Save size={14} style={{ marginRight: '4px' }} /> Save Service
                    </button>
                  </div>
                </form>
              ) : (
                // Services List Table
                <div className="services-admin-list">
                  {loadingServices ? (
                    <div className="spinner" style={{ margin: '2rem auto' }}></div>
                  ) : services.length === 0 ? (
                    <p className="text-secondary text-center mt-3">No services configured.</p>
                  ) : (
                    services.map((item) => (
                      <div key={item._id} className="service-admin-card">
                        <div className="service-meta-col">
                          <strong>{item.name}</strong>
                          <span>{item.category} • ₹{item.price} • {item.duration}m</span>
                        </div>
                        <div className="service-action-col">
                          <button 
                            className="action-icon-btn edit" 
                            title="Edit"
                            onClick={() => {
                              setEditServiceId(item._id);
                              setServiceForm({
                                name: item.name,
                                category: item.category,
                                price: item.price,
                                duration: item.duration,
                                description: item.description,
                                icon: item.icon
                              });
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="action-icon-btn delete" 
                            title="Delete"
                            onClick={() => handleDeleteService(item._id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Offers Tab */}
          {activeTab === 'promotions' && (
            <div className="tab-pane animate-fade-in-simple">
              <h4>Promotions & Campaigns</h4>
              <p className="section-desc">Manage offers broadcasted directly in automated messages.</p>

              <div className="offers-stack">
                <div className="offer-card glass-card">
                  <div className="offer-header">
                    <strong>Birthday Special Offer</strong>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider-switch"></span>
                    </label>
                  </div>
                  <p>15% discount on all facials and hair spa treatments during the client's birthday month.</p>
                </div>

                <div className="offer-card glass-card">
                  <div className="offer-header">
                    <strong>Festival Campaign</strong>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider-switch"></span>
                    </label>
                  </div>
                  <p>Flat 10% combo discount on Haircut + Beard Grooming + Hair coloring.</p>
                </div>

                <div className="offer-card glass-card">
                  <div className="offer-header">
                    <strong>Returning Gift Voucher</strong>
                    <label className="toggle-switch">
                      <input type="checkbox" />
                      <span className="slider-switch"></span>
                    </label>
                  </div>
                  <p>Flat ₹300 cashback voucher on visits logged within 20 days since last followup.</p>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="tab-pane animate-fade-in-simple">
              
              {/* Salon Configs */}
              <form onSubmit={handleSaveConfigs} className="settings-form-section">
                <h4>Salon Configuration</h4>
                
                <div className="form-group">
                  <label>Salon Phone Number (for WhatsApp Links)</label>
                  <input 
                    type="text" 
                    className="form-control dark-input"
                    value={salonSettings.salonPhone}
                    onChange={(e) => setSalonSettings({ ...salonSettings, salonPhone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Next Follow-Up Threshold (Days)</label>
                  <input 
                    type="number" 
                    className="form-control dark-input"
                    value={salonSettings.reminderDays}
                    onChange={(e) => setSalonSettings({ ...salonSettings, reminderDays: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Follow-up WhatsApp Message Template</label>
                  <textarea 
                    className="form-control dark-input"
                    rows="6"
                    value={salonSettings.whatsappTemplate}
                    onChange={(e) => setSalonSettings({ ...salonSettings, whatsappTemplate: e.target.value })}
                  ></textarea>
                  <span className="template-tip">Use [Customer Name] and [Phone Number] as dynamic fillers.</span>
                </div>

                <button type="submit" className="btn btn-gold btn-sm btn-block">
                  Save Salon Config
                </button>
              </form>

              {/* WhatsApp Automation Section */}
              <form onSubmit={handleSaveWhatsappConfig} className="settings-form-section credential-section">
                <h4>WhatsApp Automation</h4>
                
                {loadingConfig ? (
                  <div className="spinner" style={{ margin: '1rem auto' }}></div>
                ) : (
                  <>
                    <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <div style={{ paddingRight: '15px' }}>
                        <label style={{ marginBottom: '2px', display: 'block', fontSize: '0.9rem', fontWeight: '600' }}>Test Mode / Simulation</label>
                        <span className="template-tip" style={{ margin: 0, display: 'block', fontSize: '0.75rem', opacity: 0.7 }}>Simulates sending reminders without API costs.</span>
                      </div>
                      <label className="toggle-switch" style={{ flexShrink: 0 }}>
                        <input 
                          type="checkbox" 
                          checked={whatsappAutomation.testMode} 
                          onChange={(e) => setWhatsappAutomation({ ...whatsappAutomation, testMode: e.target.checked })} 
                        />
                        <span className="slider-switch"></span>
                      </label>
                    </div>

                    <div className="form-group">
                      <label>WhatsApp Service Provider</label>
                      <select 
                        className="form-control dark-input"
                        value={whatsappAutomation.provider}
                        onChange={(e) => setWhatsappAutomation({ ...whatsappAutomation, provider: e.target.value })}
                      >
                        <option value="none">None / Disabled</option>
                        <option value="interakt">Interakt (REST API)</option>
                        <option value="meta_cloud">Meta Cloud (Stub)</option>
                        <option value="twilio">Twilio (Stub)</option>
                      </select>
                    </div>

                    {whatsappAutomation.provider !== 'none' && (
                      <>
                        <div className="form-group">
                          <label>API Key / Auth Token</label>
                          <input 
                            type="password" 
                            className="form-control dark-input"
                            placeholder={whatsappAutomation.apiKey ? "••••••••" : "Enter API Key"}
                            value={whatsappAutomation.apiKey}
                            onChange={(e) => setWhatsappAutomation({ ...whatsappAutomation, apiKey: e.target.value })}
                          />
                        </div>

                        {whatsappAutomation.provider === 'meta_cloud' && (
                          <div className="form-group">
                            <label>Phone Number ID</label>
                            <input 
                              type="text" 
                              className="form-control dark-input"
                              placeholder="Enter Meta Phone Number ID"
                              value={whatsappAutomation.phoneNumberId}
                              onChange={(e) => setWhatsappAutomation({ ...whatsappAutomation, phoneNumberId: e.target.value })}
                            />
                          </div>
                        )}

                        <div className="form-row">
                          <div className="form-group">
                            <label>Pre-3 Day Template Code</label>
                            <input 
                              type="text" 
                              className="form-control dark-input"
                              value={whatsappAutomation.templateNamePre3Day}
                              onChange={(e) => setWhatsappAutomation({ ...whatsappAutomation, templateNamePre3Day: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Due Day Template Code</label>
                            <input 
                              type="text" 
                              className="form-control dark-input"
                              value={whatsappAutomation.templateNameDueDay}
                              onChange={(e) => setWhatsappAutomation({ ...whatsappAutomation, templateNameDueDay: e.target.value })}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <button type="submit" className="btn btn-gold btn-sm btn-block">
                      Save WhatsApp Automation
                    </button>
                  </>
                )}
              </form>

              {/* Password management */}
              <form onSubmit={handleUpdateProfile} className="settings-form-section credential-section">
                <h4>Admin Credentials</h4>
                
                <div className="form-group">
                  <label>Admin User Name</label>
                  <input 
                    type="text" 
                    className="form-control dark-input"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    className="form-control dark-input"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    className="form-control dark-input"
                    value={profileForm.password}
                    onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                    placeholder="Leave blank to keep current"
                  />
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <input 
                    type="password" 
                    className="form-control dark-input"
                    value={profileForm.confirmPassword}
                    onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                    placeholder="Leave blank to keep current"
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-sm btn-block">
                  Update Admin profile
                </button>
              </form>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsDrawer;
