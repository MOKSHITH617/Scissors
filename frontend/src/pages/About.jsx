import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './About.css';

const About = () => {
  const team = [
    {
      name: 'Alex Mercer',
      role: 'Master Hair Architect',
      specialty: 'Contemporary Fades & Precision Cuts',
      image: 'https://images.unsplash.com/photo-1605497746444-052d5b6bc34b?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Maria Santos',
      role: 'Senior Esthetician & Colorist',
      specialty: 'Balayage & Scalp Therapies',
      image: 'https://images.unsplash.com/photo-1596178060810-72cb612bb0ea?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Sofia Alvi',
      role: 'Lead Cosmetologist & Makeup Artist',
      specialty: 'Hydra Facials & Bridal Makeup',
      image: 'https://images.unsplash.com/photo-1527799863830-d34bc575b5b4?auto=format&fit=crop&w=400&q=80',
    }
  ];

  return (
    <div className="about-page-root">
      <Navbar />

      {/* Header Banner */}
      <header className="page-header-banner about-banner">
        <div className="header-banner-overlay"></div>
        <div className="container banner-content animate-fade-in">
          <span className="banner-subtitle">OUR LEGACY</span>
          <h1 className="banner-title">About Our Salon</h1>
          <p className="banner-description">
            Discover the legacy of premium unisex grooming, where skilled mastery meets luxury pampering.
          </p>
        </div>
      </header>

      {/* Salon History Section */}
      <section className="about-history-section">
        <div className="container history-grid">
          <div className="history-image-col">
            <img 
              src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80" 
              alt="Salon Crafting" 
              className="history-img"
            />
          </div>
          <div className="history-content-col">
            <span className="section-subtitle">SINCE 2021</span>
            <h2 className="section-title">A Journey of Sophisticated Style</h2>
            <p className="about-text">
              Scissor Lines was established with a singular vision: to create a sanctuary of self-care that redefines the traditional salon experience. Our founders envisioned a space that combined modern architectural layouts (sleek charcoal panels, warm gold trimmings, leather finishes) with the highest level of hospitality.
            </p>
            <p className="about-text">
              Over the last five years, we have grown into Hyderabad's premier destination for luxury grooming. Our stylists undergo continuous training under international academies, staying ahead of dynamic global trends to give you the perfect transformation.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="about-mission-section">
        <div className="container mission-grid">
          <div className="mission-card glass-card">
            <span className="mission-num">01</span>
            <h3 className="mission-title">Our Mission</h3>
            <p className="mission-text">
              To deliver premium grooming experiences utilizing organic, eco-friendly, and non-harming formulations, prioritizing our clients' long-term beauty health in a luxury space.
            </p>
          </div>
          <div className="mission-card glass-card">
            <span className="mission-num">02</span>
            <h3 className="mission-title">Our Vision</h3>
            <p className="mission-text">
              To build a premium chain of customer-retention-focused salon sanctuaries that set the standard for upscale unisex grooming, styling, and aesthetic care across the nation.
            </p>
          </div>
        </div>
      </section>

      {/* Stylists Team Section */}
      <section className="team-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-subtitle">THE ARTISANS</span>
            <h2 className="section-title">Meet Our Master Stylists</h2>
          </div>
          <div className="team-grid">
            {team.map((member, i) => (
              <div key={i} className="team-card animate-fade-in-simple">
                <div className="team-image-wrapper">
                  <img src={member.image} alt={member.name} className="team-img" />
                </div>
                <div className="team-body">
                  <h3 className="team-name">{member.name}</h3>
                  <span className="team-role">{member.role}</span>
                  <p className="team-specialty">{member.specialty}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
