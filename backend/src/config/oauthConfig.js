/**
 * Central OAuth config.
 * Set BACKEND_URL in Vercel env vars to your production backend URL.
 * Locally it falls back to http://localhost:4000
 */
const BACKEND_URL  = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const redirect = (platform) => `${BACKEND_URL}/api/social/auth/${platform}/callback`;

module.exports = {
  FRONTEND_URL,

  linkedin: {
    clientId:     process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    redirectUri:  process.env.LINKEDIN_REDIRECT_URI || redirect('linkedin'),
  },

  twitter: {
    clientId:     process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    redirectUri:  process.env.TWITTER_REDIRECT_URI  || redirect('twitter'),
  },

  facebook: {
    appId:        process.env.FACEBOOK_APP_ID,
    appSecret:    process.env.FACEBOOK_APP_SECRET,
    redirectUri:  process.env.FACEBOOK_REDIRECT_URI || redirect('facebook'),
  },

  instagram: {
    appId:        process.env.FACEBOOK_APP_ID,     // same Facebook app
    appSecret:    process.env.FACEBOOK_APP_SECRET,
    redirectUri:  process.env.INSTAGRAM_REDIRECT_URI || redirect('instagram'),
  },

  google: {
    clientId:     process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    redirectUri:  process.env.YOUTUBE_REDIRECT_URI || redirect('youtube'),
  },
};
