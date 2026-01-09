const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Extract profile data from Google
    const googleId = profile.id;
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    const firstName = profile.name && profile.name.givenName ? profile.name.givenName : '';
    const lastName = profile.name && profile.name.familyName ? profile.name.familyName : '';
    const profilePicture = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

    if (!email) {
      return done(new Error('No email found in Google profile'), null);
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - update with Google ID if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        user.googleProfilePicture = profilePicture;
        await user.save();
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      return done(null, user);
    }

    // User doesn't exist - will be created in the callback handler
    // Just pass the profile data
    return done(null, {
      googleId,
      email,
      firstName,
      lastName,
      profilePicture,
      isNewUser: true
    });

  } catch (error) {
    return done(error, null);
  }
}));

// Serialize user for the session (not heavily used since we use JWT)
passport.serializeUser((user, done) => {
  done(null, user.id || user._id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
