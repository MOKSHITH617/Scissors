import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, MessageSquare } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import './Contact.css';

const Contact = () => {
  const { addToast } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'Haircut',
    message: ''
  });
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    // Simulate sending inquiry form
    setTimeout(() => {
      addToast('Thank you! Your inquiry has been sent. We will contact you soon.', 'success');
      setFormData({
        name: '',
        phone: '',
        email: '',
        service: 'Haircut',
        message: ''
      });
      setSending(false);
    }, 1500);
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Hello Scissor Lines Salon, I'd like to ask a question about your luxury services.");
    window.open(`https://wa.me/919876543210?text=${message}`, '_blank');
  };

  return (
    <div className="contact-page-root">
      <Navbar />

      {/* Header Banner */}
      <header className="page-header-banner contact-banner">
        <div className="header-banner-overlay"></div>
        <div className="container banner-content animate-fade-in">
          <span className="banner-subtitle">REACH OUT</span>
          <h1 className="banner-title">Contact Us</h1>
          <p className="banner-description">
            Connect with our guest relations team. Book private suites, inquire about bridal packages, or locate our luxury boutique.
          </p>
        </div>
      </header>

      {/* Contact Grid Info and Form */}
      <section className="contact-main-section">
        <div className="container contact-grid">
          
          {/* Left Column: Details & Hours */}
          <div className="contact-details-col">
            <span className="section-subtitle">VISIT OR CALL</span>
            <h2 className="section-title">Get In Touch</h2>
            <p className="contact-intro">
              Have questions about bridal styling or custom packages? Call our boutique or send a direct text on WhatsApp.
            </p>

            <div className="contact-cards-stack">
              <div className="contact-info-card">
                <Phone className="info-card-icon" />
                <div>
                  <h4>Phone Number</h4>
                  <a href="tel:+919876543210" className="info-link">+91 98765 43210</a>
                </div>
              </div>

              <div className="contact-info-card">
                <Mail className="info-card-icon" />
                <div>
                  <h4>Email Address</h4>
                  <a href="mailto:info@scissorlines.com" className="info-link">info@scissorlines.com</a>
                </div>
              </div>

              <div className="contact-info-card">
                <MapPin className="info-card-icon" />
                <div>
                  <h4>Salon Location</h4>
                  <span>45, Luxury Boulevard, Gachibowli, Hyderabad, India</span>
                </div>
              </div>

              <div className="contact-info-card">
                <Clock className="info-card-icon" />
                <div>
                  <h4>Operating Hours</h4>
                  <span>Mon – Sat: 9:00 AM – 8:00 PM<br />Sun: 10:00 AM – 6:00 PM</span>
                </div>
              </div>
            </div>

            {/* Premium WhatsApp Button */}
            <button className="btn btn-outline-gold wa-chat-btn" onClick={handleWhatsAppClick}>
              <MessageSquare size={16} style={{ marginRight: '8px' }} />
              Chat instantly on WhatsApp
            </button>
          </div>

          {/* Right Column: Contact Inquiry Form */}
          <div className="contact-form-col glass-card animate-fade-in-simple">
            <h3 className="form-card-title">Send An Inquiry</h3>
            <p className="form-card-desc">Fill in details and our receptionist will call you within 30 minutes.</p>

            <form onSubmit={handleSubmit} className="inquiry-form">
              <div className="form-group">
                <label htmlFor="name">Your Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  id="name" 
                  required
                  className="form-control" 
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="E.g., Moksh Patel"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input 
                  type="tel" 
                  name="phone" 
                  id="phone" 
                  required
                  className="form-control" 
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="E.g., 9876543210"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  id="email" 
                  className="form-control" 
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="E.g., moksh@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="service">Interested Service</label>
                <select 
                  name="service" 
                  id="service" 
                  className="form-control" 
                  value={formData.service}
                  onChange={handleChange}
                >
                  <option value="Haircut">Haircut & Styling</option>
                  <option value="Hair Spa">Hair Treatment / Spa</option>
                  <option value="Facial">Glow Facials</option>
                  <option value="Bridal Makeup">Bridal / Wedding Makeovers</option>
                  <option value="Skin Care">Dermal Skin Care</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message">Your Message</label>
                <textarea 
                  name="message" 
                  id="message" 
                  rows="4"
                  className="form-control" 
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Detail any special requests (e.g. skin sensitivity, specific date interest)"
                ></textarea>
              </div>

              <button type="submit" className="btn btn-gold submit-inquiry-btn" disabled={sending}>
                {sending ? (
                  <div className="spinner" style={{ width: '1.2rem', height: '1.2rem' }}></div>
                ) : (
                  <>
                    <Send size={14} style={{ marginRight: '8px' }} />
                    Submit Inquiry
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Google Maps Simulation Section */}
      <section className="map-simulator-section">
        <div className="container">
          <div className="map-wrapper glass-card">
            {/* Simulation of a premium styled dark map */}
            <div className="map-placeholder">
              <div className="map-pin animate-fade-in">
                <MapPin className="pin-icon" size={32} />
                <div className="pin-tooltip">
                  <strong>Scissor Lines Salon</strong>
                  <p>45, Luxury Boulevard, Gachibowli</p>
                </div>
              </div>
              <div className="simulated-map-label">SIMULATED PREMIUM DARK MAP VIEW</div>
              {/* Background styling for the map to look extremely luxurious */}
              <div className="grid-lines"></div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
