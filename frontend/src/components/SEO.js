import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
  title = 'Unified CRM - Complete B2B Customer Relationship Management Solution',
  description = 'Complete CRM solution with lead management, contact management, deal tracking, email integration, team collaboration, and advanced analytics for B2B businesses.',
  keywords = 'CRM, Customer Relationship Management, Lead Management, Contact Management, Sales CRM, B2B CRM',
  url = 'https://unifiedcrm.texora.ai/',
  image = 'https://unifiedcrm.texora.ai/logo.png',
  noindex = false
}) => {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
