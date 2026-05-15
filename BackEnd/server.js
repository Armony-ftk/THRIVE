require('dotenv').config();
const express = require("express");
const sql = require("mssql");
const config = require("./dbConfig");
const path = require("path");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const bcrypt = require("bcrypt");
const app = express();

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.urlencoded({ extended: true }));    // parse form data

// Sign Up route
app.post("/signup", async (req, res) => {
  const { username, email, password, confirmPassword, role } = req.body;

  if (password !== confirmPassword) {
    return res.redirect("/signUp.html?error=Passwords+do+not+match");
  }
  // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10); // 10 = salt rounds

  try {
    await sql.connect(config);

    await sql.query`
      INSERT INTO Users (name, email, password, role)
      VALUES (${username}, ${email}, ${hashedPassword},${role})
    `;

    res.redirect("/login.html?success=Account+created+successfully");
  } catch (err) {
    console.error(err);
    res.redirect("/signUp.html?error=Server+error");
  } finally {
    await sql.close();
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    await sql.connect(config);

    // Check if user exists with matching username + password
    const result = await sql.query`
      SELECT * FROM Users WHERE name = ${username} 
    `;

    if (result.recordset.length === 0) {
      // Invalid login
      return res.redirect("/login.html?error=Invalid+username+or+password");
    }

    const user = result.recordset[0];

     // Compare entered password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.redirect("/login.html?error=Invalid+password");
    }

    // If match → login success
    res.redirect(`/thriveAI.html?user=${encodeURIComponent(user.name)}`);
  } catch (err) {
    console.error("Login error:", err);
    res.redirect("/login.html?error=Server+error");
  }
});

// Session + Passport setup
app.use(session({ secret: "r5idbav1iivh9d2do7ucp2umvprq7s8f", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Normal login (no chooser)
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Chooser (forces account picker)
app.get("/auth/google/chooser",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
   callbackURL: "http://localhost:3000/auth/google/callback"
  })
);

app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login.html" }),
  async (req, res) => {
    const profile = req.user;
    const email = profile.emails[0].value;
    const name = profile.displayName;

    try {
      await sql.connect(config);

      const result = await sql.query`
        SELECT * FROM Users WHERE email = ${email}
      `;

      if (result.recordset.length === 0) {
        // User not found → insert new
        await sql.query`
          INSERT INTO Users (name, email, role, password)
          VALUES (${name}, ${email}, 'user', 'GOOGLE_USER')
        `;
        return res.redirect(`/thriveAI.html?user=${encodeURIComponent(name)}&success=Signed+up+with+Google`);
      }

      // Existing user → login success
      return res.redirect(`/thriveAI.html?user=${encodeURIComponent(result.recordset[0].name)}&success=Logged+in+with+Google`);
    } catch (err) {
      console.error("Google login error:", err);
      res.redirect("/login.html?error=Server+error");
    } finally {
      await sql.close();
    }
  }
);


app.listen(3000, () => console.log("Server running on http://localhost:3000"));
