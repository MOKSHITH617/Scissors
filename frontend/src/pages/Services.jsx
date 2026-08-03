import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Sparkles, Heart, Star, Clock, Coins } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Services.css';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  // Map icon name string to Lucide component
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Scissors': return Scissors;
      case 'Sparkles': return Sparkles;
      case 'Heart': return Heart;
      default: return Star;
    }
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services');
        const data = await res.json();
        if (data.success) {
          setServices(data.services);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Get unique categories for filtering
  const categories = ['All', ...new Set(services.map(s => s.category))];

  const filteredServices = activeCategory === 'All'
    ? services
    : services.filter(s => s.category === activeCategory);

  return (
    <div className="services-page-root">
      <Navbar />

      {/* Header Banner */}
      <header className="page-header-banner">
        <div className="header-banner-overlay"></div>
        <div className="container banner-content animate-fade-in">
          <span className="banner-subtitle">OUR MENU</span>
          <h1 className="banner-title">Luxury Services</h1>
          <p className="banner-description">
            Explore our curated catalog of elite hair designs, revitalizing therapies, skincare enhancements, and professional cosmetic styling.
          </p>
        </div>
      </header>

      {/* Services Menu Section */}
      <section className="services-menu-section">
        <div className="container">
          
          {/* Category Tabs Selector */}
          {!loading && (
            <div className="category-tabs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Cards Grid */}
          <div className="services-grid">
            {loading ? (
              // Skeleton Loader
              [...Array(6)].map((_, i) => (
                <div key={i} className="service-card skeleton-card">
                  <div className="skeleton skeleton-icon"></div>
                  <div className="skeleton skeleton-title"></div>
                  <div className="skeleton skeleton-text"></div>
                  <div className="skeleton skeleton-meta"></div>
                </div>
              ))
            ) : filteredServices.length === 0 ? (
              <div className="empty-state text-center">
                <h3>No Services Found</h3>
                <p className="text-secondary">We couldn't load the service catalog. Please check back later.</p>
              </div>
            ) : (
              filteredServices.map((service) => {
                const IconComponent = getIcon(service.icon);
                return (
                  <div key={service._id} className="service-card glass-card animate-fade-in-simple">
                    <div className="service-card-header">
                      <div className="service-icon-bg">
                        <IconComponent className="service-card-icon" />
                      </div>
                      <span className="service-card-cat">{service.category}</span>
                    </div>
                    <div className="service-card-body">
                      <h3 className="service-card-name">{service.name}</h3>
                      <p className="service-card-desc">{service.description}</p>
                    </div>
                    <div className="service-card-footer">
                      <div className="service-meta-item">
                        <Clock size={14} className="meta-icon" />
                        <span>{service.duration} mins</span>
                      </div>
                      <div className="service-meta-item font-semibold text-primary">
                        <Coins size={14} className="meta-icon" />
                        <span>₹{service.price}</span>
                      </div>
                    </div>
                    <Link to="/book" className="btn btn-primary service-card-book-btn">
                      Book Now
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="booking-cta-section">
        <div className="container text-center">
          <span className="section-subtitle">INDULGE YOURSELF</span>
          <h2>Experience Salon Luxury Like Never Before</h2>
          <p className="text-secondary">Choose your signature service and let our experts pamper you.</p>
          <Link to="/book" className="btn btn-gold mt-3">
            Schedule Your Visit
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
