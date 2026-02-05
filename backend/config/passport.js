import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load env vars explicitly for this module
dotenv.config();

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this Google ID
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        return done(null, user);
      }

      // Check if user exists with the same email
      user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id;
        user.authProvider = user.authProvider === 'local' ? 'local' : 'google';
        if (!user.profile.avatar && profile.photos[0]) {
          user.profile.avatar = profile.photos[0].value;
        }
        await user.save();
        return done(null, user);
      }

      // Create new user
      const username = await generateUniqueUsername(profile.displayName);
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        username,
        authProvider: 'google',
        isApproved: true,
        profile: {
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          avatar: profile.photos[0]?.value || ''
        }
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5000/api/auth/facebook/callback',
    profileFields: ['id', 'emails', 'name', 'displayName', 'photos']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this Facebook ID
      let user = await User.findOne({ facebookId: profile.id });

      if (user) {
        return done(null, user);
      }

      // Check if user exists with the same email
      const email = profile.emails?.[0]?.value;
      if (email) {
        user = await User.findOne({ email });

        if (user) {
          // Link Facebook account to existing user
          user.facebookId = profile.id;
          user.authProvider = user.authProvider === 'local' ? 'local' : 'facebook';
          if (!user.profile.avatar && profile.photos?.[0]) {
            user.profile.avatar = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }
      }

      // Create new user
      const username = await generateUniqueUsername(profile.displayName);
      user = await User.create({
        facebookId: profile.id,
        email: email || `fb_${profile.id}@codearena.local`,
        username,
        authProvider: 'facebook',
        isApproved: true,
        profile: {
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          avatar: profile.photos?.[0]?.value || ''
        }
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));
}

// Helper function to generate unique username
async function generateUniqueUsername(displayName) {
  let baseUsername = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);
  
  if (baseUsername.length < 3) {
    baseUsername = 'user';
  }

  let username = baseUsername;
  let counter = 1;

  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
}

export default passport;
