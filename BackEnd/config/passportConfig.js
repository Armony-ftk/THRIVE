const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Passport configuration is separated from route handling and business logic.
// This keeps auth strategy wiring clean and easy to update later.
module.exports = function configurePassport(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/callback",
      },
      (accessToken, refreshToken, profile, done) => {
        return done(null, profile);
      },
    ),
  );

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));
};
