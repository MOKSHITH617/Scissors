import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Phone, MapPin, Mail, Clock } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-root">
      <div className="container footer-grid">
        {/* Salon Branding Info */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <Scissors className="footer-logo-icon" />
            <span className="footer-logo-text">SCISSOR LINES</span>
          </Link>
          <p className="footer-desc">
            Experience the pinnacle of luxury grooming and hair care. Our master stylists blend classic techniques with modern trends to craft your perfect aesthetic.
          </p>
        </div>

        {/* Operating Hours */}
        <div className="footer-section">
          <h4 className="footer-title">Salon Hours</h4>
          <ul className="footer-list">
            <li className="footer-list-item">
              <Clock size={14} className="list-icon" />
              <span>Monday – Saturday: <span className="time-highlight">9:00 AM – 8:00 PM</span></span>
            </li>
            <li className="footer-list-item">
              <Clock size={14} className="list-icon" />
              <span>Sunday: <span className="time-highlight">10:00 AM – 6:00 PM</span></span>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-section">
          <h4 className="footer-title">Get In Touch</h4>
          <ul className="footer-list">
            <li className="footer-list-item">
              <Phone size={14} className="list-icon" />
              <a href="tel:+919876543210" className="contact-link">+91 98765 43210</a>
            </li>
            <li className="footer-list-item">
              <Mail size={14} className="list-icon" />
              <a href="mailto:info@scissorlines.com" className="contact-link">info@scissorlines.com</a>
            </li>
            <li className="footer-list-item">
              <MapPin size={14} className="list-icon" />
              <span>45, Luxury Boulevard, Gachibowli, Hyderabad, India</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container bottom-container">
          <p className="copyright-text">
            &copy; {currentYear} Scissor Lines Salon. All Rights Reserved. Crafted for luxury experience.
          </p>
          <Link to="/admin" className="admin-portal-link">
            Admin CRM Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
