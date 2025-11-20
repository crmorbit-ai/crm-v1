import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState({
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    logo: null,
    companyName: 'SAAS Platform'
  });

  useEffect(() => {
    // Load theme from tenant settings
    if (user && user.tenant && user.tenant.theme) {
      setTheme({
        primaryColor: user.tenant.theme.primaryColor || '#1976d2',
        secondaryColor: user.tenant.theme.secondaryColor || '#dc004e',
        logo: user.tenant.theme.logo || null,
        companyName: user.tenant.theme.companyName || user.tenant.organizationName
      });
    }
  }, [user]);

  useEffect(() => {
    // Apply theme to CSS variables
    document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
  }, [theme]);

  const updateTheme = (newTheme) => {
    setTheme(prev => ({ ...prev, ...newTheme }));
  };

  const value = {
    theme,
    updateTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
