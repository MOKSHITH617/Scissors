import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Gallery.css';

const Gallery = () => {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const galleryItems = [
    {
      title: 'Premium Reception Area',
      category: 'Reception',
      url: '/images/salon_reception.png',
      layoutClass: 'item-large-reception'
    },
    {
      title: 'Luxury Workstations',
      category: 'Salon Chairs',
      url: '/images/salon_chairs.png',
      layoutClass: 'item-normal'
    },
    {
      title: 'Precision Color Bar Mixing Station',
      category: 'Color Bar',
      url: '/images/salon_colorbar.png',
      layoutClass: 'item-normal'
    },
    {
      title: 'Vanguard Lounge Sanctuary',
      category: 'Waiting Area',
      url: '/images/salon_lounge.png',
      layoutClass: 'item-normal'
    },
    {
      title: 'Premium Reclining Hair Wash Station',
      category: 'Waiting Area',
      url: '/images/salon_wash.png',
      layoutClass: 'item-normal'
    },
    {
      title: 'Our Professional Cosmetologists Team',
      category: 'Staff',
      url: '/images/salon_staff.png',
      layoutClass: 'item-normal'
    },
    {
      title: 'Scissor Lines Storefront Entrance',
      category: 'Exterior',
      url: '/images/salon_exterior.png',
      layoutClass: 'item-normal'
    }
  ];

  // Filters categories list
  const categories = ['All', 'Reception', 'Salon Chairs', 'Color Bar', 'Waiting Area', 'Exterior', 'Staff'];

  // Filter items
  const filteredItems = activeCategory === 'All' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeCategory);

  const openLightbox = (itemUrl) => {
    // Find index of the clicked item in the FILTERED list to allow keyboard/lightbox navigation correctly
    const index = filteredItems.findIndex(item => item.url === itemUrl);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const navigateLightbox = (direction, e) => {
    e.stopPropagation();
    if (direction === 'prev') {
      setLightboxIndex((prev) => (prev === 0 ? filteredItems.length - 1 : prev - 1));
    } else {
      setLightboxIndex((prev) => (prev === filteredItems.length - 1 ? 0 : prev + 1));
    }
  };

  return (
    <div className="gallery-page-root">
      <Navbar />

      {/* Header banner */}
      <header className="page-header-banner gallery-banner">
        <div className="header-banner-overlay"></div>
        <div className="container banner-content animate-fade-in">
          <span className="banner-subtitle">TOUR THE SANCTUARY</span>
          <h1 className="banner-title">Salon Gallery</h1>
          <p className="banner-description">
            Step inside Scissor Lines. Review our state-of-the-art styling rooms, premium lounges, and luxury wash basins.
          </p>
        </div>
      </header>

      {/* Categories Filter Panel */}
      <section className="filter-section">
        <div className="container">
          <div className="category-filter-bar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(cat);
                  setLightboxIndex(null);
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid Layout Section */}
      <section className="gallery-grid-section">
        <div className="container">
          <div className="gallery-layout-grid">
            {filteredItems.map((item, index) => (
              <div 
                key={index} 
                className={`gallery-grid-item ${activeCategory === 'All' ? item.layoutClass : 'item-normal'}`}
                onClick={() => openLightbox(item.url)}
              >
                <img src={item.url} alt={item.title} className="gallery-grid-image" />
                <div className="gallery-grid-overlay">
                  <ZoomIn className="zoom-icon" size={24} />
                  <div className="gallery-grid-meta">
                    <span className="gallery-grid-cat">{item.category}</span>
                    <h4 className="gallery-grid-title">{item.title}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && filteredItems[lightboxIndex] && (
        <div className="lightbox-modal animate-fade-in-simple" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox} aria-label="Close lightbox">
            <X size={28} />
          </button>
          
          <button 
            className="lightbox-nav prev" 
            onClick={(e) => navigateLightbox('prev', e)}
            aria-label="Previous image"
          >
            <ChevronLeft size={36} />
          </button>
          
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={filteredItems[lightboxIndex].url} 
              alt={filteredItems[lightboxIndex].title} 
              className="lightbox-image" 
            />
            <div className="lightbox-caption">
              <span className="caption-category">{filteredItems[lightboxIndex].category}</span>
              <h3 className="caption-title">{filteredItems[lightboxIndex].title}</h3>
            </div>
          </div>

          <button 
            className="lightbox-nav next" 
            onClick={(e) => navigateLightbox('next', e)}
            aria-label="Next image"
          >
            <ChevronRight size={36} />
          </button>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Gallery;
