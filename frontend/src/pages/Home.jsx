import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Award, Sparkles, Star, ChevronRight, Phone } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Home.css';

const Home = () => {
  const stats = [
    { value: '2500+', label: 'Customers', icon: Sparkles },
    { value: '5+', label: 'Years Experience', icon: Award },
    { value: '20+', label: 'Services', icon: Scissors },
    { value: '4.9★', label: 'Rating', icon: Star },
  ];

  const featuredServices = [
    {
      name: 'Designer Haircut',
      price: '₹800',
      desc: 'Precision cuts designed by master stylists to suit your facial structure, inclusive of wash and premium styling.',
      image: '/images/salon_chairs.png'
    },
    {
      name: 'Nourishing Hair Spa',
      price: '₹1,800',
      desc: 'Therapeutic massage and steam treatment that restores natural shine, thickness, and health to your scalp.',
      image: '/images/salon_wash.png'
    },
    {
      name: 'Hydra Facial Glow',
      price: '₹2,000',
      desc: 'Deep skin exfoliation, moisture hydration, and massage that gives an instant brightened premium glow.',
      image: '/images/salon_colorbar.png'
    }
  ];

  const testimonials = [
    {
      name: 'Aditya Sen',
      role: 'Regular Client',
      quote: 'The finest salon in the city. The black and gold interiors are extremely luxury, and Alex gave me the best fade of my life. Highly recommended!',
      rating: 5
    },
    {
      name: 'Meera Deshmukh',
      role: 'VIP Member',
      quote: 'Scissor Lines is my go-to place for styling. Their attention to detail and customer care is unmatched. Every visit is a pampering experience.',
      rating: 5
    },
    {
      name: 'Rohan Mehra',
      role: 'Premium Client',
      quote: 'Extremely professional staff, minimal wait times, and high-end products. The coffee they serve during the service is also fantastic.',
      rating: 5
    }
  ];

  return (
    <div className="home-root">
      <Navbar />

      {/* Luxury Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        {/* Floating particles background container */}
        <div className="hero-particles">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="container hero-content animate-fade-in">
          <span className="hero-subtitle">WELCOME TO SCISSOR LINES</span>
          <h1 className="hero-title">Where Style Meets Luxury</h1>
          <p className="hero-description">
            A premium unisex salon experience designed for the modern individual. Master craftsmanship, premium organic products, and a calm, high-end atmosphere.
          </p>
          <div className="hero-actions">
            <Link to="/book" className="btn btn-gold btn-hero">
              Book Appointment
            </Link>
            <Link to="/services" className="btn btn-outline-gold btn-hero">
              Explore Services
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="stats-section">
        <div className="container stats-grid">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="stat-card glass-card">
                <div className="stat-icon-wrapper">
                  <Icon className="stat-icon" />
                </div>
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-label">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Brief Story Section */}
      <section className="story-section">
        <div className="container story-container">
          <div className="story-content">
            <span className="section-subtitle">OUR LEGACY</span>
            <h2 className="section-title">The Art of Fine Grooming</h2>
            <p className="story-text">
              Founded on the belief that a visit to the salon should be an escape, Scissor Lines offers premium grooming services under the direction of leading cosmetologists. Our salon features custom black-leather chairs, brushed gold fittings, and a minimalist design theme to provide ultimate relaxation.
            </p>
            <p className="story-text">
              We exclusively use international, organic, and ammonia-free products to ensure your hair and skin receive the premium care they deserve.
            </p>
            <Link to="/about" className="story-link">
              Read Our Full Story <ChevronRight size={16} />
            </Link>
          </div>
          <div className="story-image-wrapper">
            <img 
              src="/images/salon_reception.png" 
              alt="Luxury Salon Interior" 
              className="story-image"
            />
          </div>
        </div>
      </section>

      {/* Featured Services Overview */}
      <section className="featured-services-section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-subtitle">EXPERIENCE THE BEST</span>
              <h2 className="section-title">Signature Services</h2>
            </div>
            <Link to="/services" className="btn btn-secondary">
              View All Services
            </Link>
          </div>
          <div className="featured-grid">
            {featuredServices.map((service, index) => (
              <div key={index} className="featured-card">
                <div className="featured-image-wrapper">
                  <img src={service.image} alt={service.name} className="featured-image" />
                  <span className="featured-price">{service.price}</span>
                </div>
                <div className="featured-body">
                  <h3 className="featured-name">{service.name}</h3>
                  <p className="featured-desc">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Gallery Snippets */}
      <section className="gallery-snippet-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-subtitle">VISUAL JOURNEY</span>
            <h2 className="section-title">Step Inside Our Sanctuary</h2>
          </div>
          <div className="snippet-grid">
            <div className="snippet-item large">
              <img src="/images/salon_reception.png" alt="Salon Interiors" />
            </div>
            <div className="snippet-item">
              <img src="/images/salon_lounge.png" alt="Waiting Lounge" />
            </div>
            <div className="snippet-item">
              <img src="/images/salon_colorbar.png" alt="Coloring Bar" />
            </div>
          </div>
          <div className="text-center mt-3">
            <Link to="/gallery" className="btn btn-outline-gold">
              Explore Full Gallery
            </Link>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-subtitle">CLIENT VOICES</span>
            <h2 className="section-title">What Our Guests Say</h2>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card glass-card">
                <div className="rating-stars">
                  {[...Array(t.rating)].map((_, idx) => (
                    <Star key={idx} size={14} className="star-icon" fill="currentColor" />
                  ))}
                </div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-author">
                  <h4 className="author-name">{t.name}</h4>
                  <span className="author-role">{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="cta-banner">
        <div className="container cta-container">
          <div className="cta-left">
            <h2 className="cta-title">Ready for a Premium Transformation?</h2>
            <p className="cta-desc">Schedule your luxury grooming session today. Walk-ins subject to availability.</p>
          </div>
          <div className="cta-right">
            <a href="tel:+919876543210" className="btn btn-outline-gold btn-cta-call">
              <Phone size={16} style={{ marginRight: '8px' }} /> Call +91 98765 43210
            </a>
            <Link to="/book" className="btn btn-gold btn-cta-book">
              Book Online Now
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
