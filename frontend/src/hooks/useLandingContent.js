import { useState, useEffect } from 'react';
import api from '../services/api';

export const useLandingContent = () => {
  const [content, setContent] = useState({
    heroSection: {
      backgroundImage: null,
      headline: 'Build Your Business Faster',
      subheadline: 'Enterprise CRM Platform',
      ctaText: 'Get Started Free'
    },
    featuresSection: {
      backgroundImage: null,
      heading: 'Powerful Features',
      features: []
    },
    aboutSection: {
      backgroundImage: null,
      heading: 'About Us'
    },
    statsSection: {
      backgroundImage: null,
      stats: []
    },
    testimonialsSection: {
      backgroundImage: null,
      testimonials: []
    },
    ctaSection: {
      backgroundImage: null,
      heading: 'Ready to Get Started?'
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      // Try to fetch from API - tenant-specific landing page
      const response = await api.get('/landing-page/settings');
      if (response.data?.data) {
        setContent(response.data.data);
      }
    } catch (err) {
      console.log('Using default content');
      // Use default content (already set in state)
    } finally {
      setLoading(false);
    }
  };

  return { content, loading };
};
