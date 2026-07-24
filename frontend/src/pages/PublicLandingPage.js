import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import './PublicLandingPage.css';

const PublicLandingPage = () => {
  const { tenantSlug } = useParams();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetchLandingPage();
  }, [tenantSlug]);

  // Auto-advance carousel
  useEffect(() => {
    if (settings?.heroSection?.backgroundType === 'carousel' &&
        settings?.heroSection?.backgroundImages?.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide(prev =>
          (prev + 1) % settings.heroSection.backgroundImages.length
        );
      }, 5000); // Change slide every 5 seconds
      return () => clearInterval(interval);
    }
  }, [settings]);

  const fetchLandingPage = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/landing-page/public/${tenantSlug}`);
      setSettings(response.data.data);
    } catch (err) {
      console.error('Failed to load landing page:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="landing-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="landing-error">
        <h1>404</h1>
        <p>Landing page not found or not published</p>
      </div>
    );
  }

  const theme = settings.theme || {};
  const hero = settings.heroSection || {};
  const features = settings.featuresSection || {};
  const about = settings.aboutSection || {};
  const showcase = settings.showcaseSection || {};
  const testimonials = settings.testimonialsSection || {};
  const stats = settings.statsSection || {};
  const cta = settings.ctaSection || {};
  const footer = settings.footer || {};

  return (
    <div className="landing-page" style={{
      '--primary-color': theme.primaryColor || '#3b82f6',
      '--secondary-color': theme.secondaryColor || '#1d4ed8',
      '--accent-color': theme.accentColor || '#f59e0b',
      '--text-color': theme.textColor || '#111827',
      fontFamily: theme.fontFamily || 'Inter, sans-serif'
    }}>

      {/* Hero Section */}
      <section className="hero-section">
        {/* Background */}
        {hero.backgroundType === 'image' && hero.backgroundImage && (
          <div className="hero-background">
            <img src={hero.backgroundImage} alt="Hero background" />
            <div className="hero-overlay" style={{ opacity: hero.overlayOpacity || 0.5 }}></div>
          </div>
        )}

        {hero.backgroundType === 'carousel' && hero.backgroundImages?.length > 0 && (
          <div className="hero-carousel">
            {hero.backgroundImages.map((img, idx) => (
              <div
                key={idx}
                className={`carousel-slide ${idx === currentSlide ? 'active' : ''}`}
                style={{ backgroundImage: `url(${img})` }}
              >
                <div className="hero-overlay" style={{ opacity: hero.overlayOpacity || 0.5 }}></div>
              </div>
            ))}
            {/* Carousel Indicators */}
            <div className="carousel-indicators">
              {hero.backgroundImages.map((_, idx) => (
                <button
                  key={idx}
                  className={idx === currentSlide ? 'active' : ''}
                  onClick={() => setCurrentSlide(idx)}
                />
              ))}
            </div>
          </div>
        )}

        {hero.backgroundType === 'video' && hero.backgroundVideo && (
          <div className="hero-background">
            <video autoPlay loop muted playsInline>
              <source src={hero.backgroundVideo} type="video/mp4" />
            </video>
            <div className="hero-overlay" style={{ opacity: hero.overlayOpacity || 0.5 }}></div>
          </div>
        )}

        {hero.backgroundType === 'gradient' && (
          <div className="hero-background hero-gradient" style={{
            background: `linear-gradient(135deg, ${hero.gradientColors?.start || '#3b82f6'} 0%, ${hero.gradientColors?.end || '#1d4ed8'} 100%)`
          }}></div>
        )}

        {/* Hero Content */}
        <div className="hero-content">
          <div className="container">
            <h1 className="hero-headline" data-aos="fade-up">
              {hero.headline || 'Welcome to Our Platform'}
            </h1>
            <p className="hero-subheadline" data-aos="fade-up" data-aos-delay="100">
              {hero.subheadline || 'Powerful CRM solution for your business'}
            </p>
            {hero.ctaText && (
              <Link to={hero.ctaLink || '/register'} className="hero-cta" data-aos="fade-up" data-aos-delay="200">
                {hero.ctaText}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      {features.enabled && (
        <section className="features-section" style={{
          backgroundColor: features.backgroundColor,
          backgroundImage: features.backgroundImage ? `url(${features.backgroundImage})` : 'none'
        }}>
          <div className="container">
            {features.heading && (
              <h2 className="section-heading" data-aos="fade-up">{features.heading}</h2>
            )}
            {features.subheading && (
              <p className="section-subheading" data-aos="fade-up">{features.subheading}</p>
            )}

            <div className="features-grid">
              {features.features?.map((feature, idx) => (
                <div key={idx} className="feature-card" data-aos="fade-up" data-aos-delay={idx * 100}>
                  {feature.image && (
                    <div className="feature-image">
                      <img src={feature.image} alt={feature.title} />
                    </div>
                  )}
                  {feature.icon && <div className="feature-icon">{feature.icon}</div>}
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      {about.enabled && (
        <section className="about-section" style={{
          backgroundImage: about.backgroundImage ? `url(${about.backgroundImage})` : 'none'
        }}>
          <div className="container">
            <div className={`about-layout about-${about.layout || 'image-left'}`}>
              <div className="about-content" data-aos="fade-right">
                {about.heading && <h2>{about.heading}</h2>}
                {about.content && <p>{about.content}</p>}
                {about.bulletPoints?.length > 0 && (
                  <ul className="about-points">
                    {about.bulletPoints.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="about-media" data-aos="fade-left">
                {about.images?.length > 1 ? (
                  <div className="about-gallery">
                    {about.images.map((img, idx) => (
                      <img key={idx} src={img} alt={`About ${idx + 1}`} />
                    ))}
                  </div>
                ) : about.image ? (
                  <img src={about.image} alt="About us" />
                ) : null}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Showcase Section */}
      {showcase.enabled && (
        <section className="showcase-section" style={{
          backgroundImage: showcase.backgroundImage ? `url(${showcase.backgroundImage})` : 'none'
        }}>
          <div className="container">
            {showcase.heading && (
              <h2 className="section-heading" data-aos="fade-up">{showcase.heading}</h2>
            )}

            <div className={`showcase-${showcase.type || 'grid'}`}>
              {showcase.items?.map((item, idx) => (
                <div key={idx} className="showcase-item" data-aos="zoom-in" data-aos-delay={idx * 100}>
                  {item.image && (
                    <div className="showcase-image">
                      <img src={item.image} alt={item.title} />
                    </div>
                  )}
                  <div className="showcase-details">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    {item.link && (
                      <a href={item.link} className="showcase-link">Learn More →</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      {stats.enabled && stats.stats?.length > 0 && (
        <section className="stats-section" style={{
          backgroundImage: stats.backgroundImage ? `url(${stats.backgroundImage})` : 'none'
        }}>
          <div className="container">
            <div className="stats-grid">
              {stats.stats.map((stat, idx) => (
                <div key={idx} className="stat-item" data-aos="fade-up" data-aos-delay={idx * 100}>
                  {stat.icon && <div className="stat-icon">{stat.icon}</div>}
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {testimonials.enabled && testimonials.testimonials?.length > 0 && (
        <section className="testimonials-section" style={{
          backgroundImage: testimonials.backgroundImage ? `url(${testimonials.backgroundImage})` : 'none'
        }}>
          <div className="container">
            <h2 className="section-heading" data-aos="fade-up">What Our Clients Say</h2>

            <div className="testimonials-grid">
              {testimonials.testimonials.map((testimonial, idx) => (
                <div key={idx} className="testimonial-card" data-aos="fade-up" data-aos-delay={idx * 100}>
                  {testimonial.image && (
                    <img src={testimonial.image} alt={testimonial.customerName} className="testimonial-avatar" />
                  )}
                  <div className="testimonial-rating">
                    {'⭐'.repeat(testimonial.rating || 5)}
                  </div>
                  <p className="testimonial-text">"{testimonial.text}"</p>
                  <div className="testimonial-author">
                    <strong>{testimonial.customerName}</strong>
                    <span>{testimonial.role}, {testimonial.company}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {cta.enabled && (
        <section className="cta-section">
          {cta.backgroundType === 'image' && cta.backgroundImage && (
            <div className="cta-background">
              <img src={cta.backgroundImage} alt="CTA background" />
              <div className="cta-overlay"></div>
            </div>
          )}
          {cta.backgroundType === 'video' && cta.backgroundVideo && (
            <div className="cta-background">
              <video autoPlay loop muted playsInline>
                <source src={cta.backgroundVideo} type="video/mp4" />
              </video>
              <div className="cta-overlay"></div>
            </div>
          )}
          {cta.backgroundType === 'gradient' && (
            <div className="cta-background" style={{
              background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)'
            }}></div>
          )}

          <div className="container cta-content">
            {cta.heading && <h2 data-aos="fade-up">{cta.heading}</h2>}
            {cta.subheading && <p data-aos="fade-up" data-aos-delay="100">{cta.subheading}</p>}
            {cta.buttonText && (
              <Link to={cta.buttonLink || '/register'} className="cta-button" data-aos="fade-up" data-aos-delay="200">
                {cta.buttonText}
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="landing-footer" style={{
        backgroundColor: footer.backgroundColor,
        backgroundImage: footer.backgroundImage ? `url(${footer.backgroundImage})` : 'none'
      }}>
        <div className="container">
          <div className="footer-content">
            {footer.logo && (
              <div className="footer-logo">
                <img src={footer.logo} alt="Logo" />
              </div>
            )}

            {footer.contactInfo && (
              <div className="footer-contact">
                {footer.contactInfo.email && <p>📧 {footer.contactInfo.email}</p>}
                {footer.contactInfo.phone && <p>📞 {footer.contactInfo.phone}</p>}
                {footer.contactInfo.address && <p>📍 {footer.contactInfo.address}</p>}
              </div>
            )}

            {footer.socialLinks && (
              <div className="footer-social">
                {footer.socialLinks.facebook && (
                  <a href={footer.socialLinks.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
                )}
                {footer.socialLinks.twitter && (
                  <a href={footer.socialLinks.twitter} target="_blank" rel="noopener noreferrer">Twitter</a>
                )}
                {footer.socialLinks.linkedin && (
                  <a href={footer.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
                )}
                {footer.socialLinks.instagram && (
                  <a href={footer.socialLinks.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
                )}
              </div>
            )}
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLandingPage;
