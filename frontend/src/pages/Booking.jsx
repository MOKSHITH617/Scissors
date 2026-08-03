import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Scissors, User, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import './Booking.css';

const Booking = () => {
  const { addToast } = useAuth();
  
  // State
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const timeSlots = [
    '09:30 AM', '10:30 AM', '11:30 AM', '01:00 PM', 
    '02:30 PM', '04:00 PM', '05:30 PM', '07:00 PM'
  ];

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services');
        const data = await res.json();
        if (data.success) {
          setServices(data.services);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleDateTimeSubmit = () => {
    if (!selectedDate || !selectedTimeSlot) {
      addToast('Please select both a date and time slot.', 'warning');
      return;
    }
    setStep(3);
  };

  const handleInputChange = (e) => {
    setCustomerDetails({
      ...customerDetails,
      [e.target.name]: e.target.value
    });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!customerDetails.name || !customerDetails.phone) {
      addToast('Please input your name and phone number.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerDetails.name,
          phone: customerDetails.phone,
          email: customerDetails.email,
          service: selectedService.name,
          date: selectedDate,
          timeSlot: selectedTimeSlot,
          notes: customerDetails.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setStep(4);
        addToast('Appointment requested successfully!', 'success');
      } else {
        addToast(data.message || 'Error booking appointment', 'error');
      }
    } catch (err) {
      addToast('Network error, please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Get tomorrow's date string for min date attribute
  const getMinDateStr = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className="booking-page-root">
      <Navbar />

      {/* Hero Header */}
      <header className="page-header-banner booking-banner">
        <div className="header-banner-overlay"></div>
        <div className="container banner-content animate-fade-in">
          <span className="banner-subtitle">APPOINTMENT WIZARD</span>
          <h1 className="banner-title">Book an Experience</h1>
          <p className="banner-description">
            Reserve a stylist, schedule your treatment date, and prepare for a luxury salon transformation.
          </p>
        </div>
      </header>

      {/* Main Wizard section */}
      <section className="booking-wizard-section">
        <div className="container">
          
          {/* Wizard step progress */}
          <div className="wizard-progress-bar">
            <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <span className="step-num">{step > 1 ? <Check size={14} /> : '1'}</span>
              <span className="step-label">Service</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <span className="step-num">{step > 2 ? <Check size={14} /> : '2'}</span>
              <span className="step-label">Date & Time</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
              <span className="step-num">{step > 3 ? <Check size={14} /> : '3'}</span>
              <span className="step-label">Details</span>
            </div>
          </div>

          <div className="wizard-card-wrapper glass-card animate-fade-in-simple">
            {/* Step 1: Services Selector */}
            {step === 1 && (
              <div className="step-content">
                <h2 className="step-title">Select A Luxury Service</h2>
                <p className="step-desc">Browse our service catalog and click on a card to continue booking.</p>

                {loading ? (
                  <div className="services-wizard-grid">
                    {[...Array(4)].map((_, idx) => (
                      <div key={idx} className="service-wizard-card skeleton-card">
                        <div className="skeleton skeleton-title" style={{ width: '40%' }}></div>
                        <div className="skeleton skeleton-text"></div>
                        <div className="skeleton skeleton-meta"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="services-wizard-grid">
                    {services.map((item) => (
                      <div 
                        key={item._id} 
                        className={`service-wizard-card ${selectedService?._id === item._id ? 'selected' : ''}`}
                        onClick={() => handleServiceSelect(item)}
                      >
                        <div className="service-wiz-header">
                          <span className="service-wiz-cat">{item.category}</span>
                          <span className="service-wiz-price">₹{item.price}</span>
                        </div>
                        <h3 className="service-wiz-name">{item.name}</h3>
                        <p className="service-wiz-desc">{item.description}</p>
                        <span className="service-wiz-duration">{item.duration} mins</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Date & Time Picker */}
            {step === 2 && (
              <div className="step-content">
                <h2 className="step-title">Select Date & Time Slot</h2>
                <p className="step-desc">Pick your desired date and scheduling slot to lock the booking.</p>
                
                <div className="date-time-picker-grid">
                  {/* Date Input */}
                  <div className="date-picker-col">
                    <label className="picker-label">
                      <Calendar size={16} className="picker-icon" /> Select Date
                    </label>
                    <input 
                      type="date" 
                      className="form-control date-selector" 
                      min={getMinDateStr()}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>

                  {/* Time Slots Grid */}
                  <div className="time-picker-col">
                    <label className="picker-label">
                      <Clock size={16} className="picker-icon" /> Select Time Slot
                    </label>
                    <div className="slots-grid">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          className={`time-slot-btn ${selectedTimeSlot === slot ? 'selected' : ''}`}
                          onClick={() => setSelectedTimeSlot(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="wizard-nav-buttons">
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>
                    <ChevronLeft size={16} /> Back to Services
                  </button>
                  <button className="btn btn-gold" onClick={handleDateTimeSubmit}>
                    Next: Personal Info <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Customer Details Form */}
            {step === 3 && (
              <div className="step-content">
                <h2 className="step-title">Input Personal Details</h2>
                <p className="step-desc">Please supply your contact details so our staff can confirm the session.</p>

                <div className="booking-summary-banner">
                  <h4>Appointment Summary</h4>
                  <div className="summary-details">
                    <p><strong>Service:</strong> {selectedService?.name} (₹{selectedService?.price})</p>
                    <p><strong>Date & Time:</strong> {selectedDate} at {selectedTimeSlot}</p>
                  </div>
                </div>

                <form onSubmit={handleBookingSubmit} className="booking-details-form">
                  <div className="form-group">
                    <label htmlFor="booking-name">Your Full Name *</label>
                    <input 
                      type="text" 
                      name="name" 
                      id="booking-name" 
                      required
                      placeholder="Enter full name"
                      className="form-control"
                      value={customerDetails.name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="booking-phone">Mobile Phone Number *</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      id="booking-phone" 
                      required
                      placeholder="Enter 10-digit mobile number"
                      className="form-control"
                      value={customerDetails.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="booking-email">Email Address</label>
                    <input 
                      type="email" 
                      name="email" 
                      id="booking-email" 
                      placeholder="Enter email address"
                      className="form-control"
                      value={customerDetails.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="booking-notes">Special Notes / Instructions</label>
                    <textarea 
                      name="notes" 
                      id="booking-notes" 
                      rows="3"
                      placeholder="Stylist preferences, skin conditions, hair details, etc."
                      className="form-control"
                      value={customerDetails.notes}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>

                  <div className="wizard-nav-buttons">
                    <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
                      <ChevronLeft size={16} /> Back to Date/Time
                    </button>
                    <button type="submit" className="btn btn-gold" disabled={submitting}>
                      {submitting ? (
                        <div className="spinner" style={{ width: '1.2rem', height: '1.2rem' }}></div>
                      ) : (
                        'Confirm Appointment Booking'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 4: Success Confirmed Screen */}
            {step === 4 && (
              <div className="step-content text-center booking-success-screen">
                <div className="success-icon-badge">
                  <Check size={36} className="success-icon" />
                </div>
                <h2>Booking Request Submitted!</h2>
                <p className="success-intro">
                  Thank you, <strong>{customerDetails.name}</strong>. Your appointment request for <strong>{selectedService?.name}</strong> has been logged.
                </p>
                <div className="success-details-card glass-card">
                  <p><strong>Scheduled Date:</strong> {selectedDate}</p>
                  <p><strong>Scheduled Time:</strong> {selectedTimeSlot}</p>
                  <p><strong>Boutique Address:</strong> 45, Luxury Boulevard, Gachibowli</p>
                  <p className="status-note">Our front desk coordinator will call or SMS you shortly to confirm.</p>
                </div>
                <div className="success-actions">
                  <Link to="/" className="btn btn-primary">
                    Return to Home
                  </Link>
                  <button className="btn btn-outline-gold" onClick={() => {
                    setStep(1);
                    setSelectedService(null);
                    setSelectedDate('');
                    setSelectedTimeSlot('');
                    setCustomerDetails({ name: '', phone: '', email: '', notes: '' });
                  }}>
                    Book Another Service
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Booking;
