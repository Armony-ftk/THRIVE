const authService = require("../services/authService");
const { sendWelcomeEmail } = require("../services/emailService");

// Controllers manage request/response only. Business rules stay in services.
function setAuthenticatedUser(req, user) {
  // Keep a lightweight user record in the session so frontend routes can fetch the current user.
  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

//password
function validatePassword(pw) {
  return pw.length >= 8 && /[^A-Za-z0-9]/.test(pw);
}

//email
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

async function signup(req, res, next) {
  const { username, email, password, confirmPassword } = req.body;

   if (!isValidEmail(email)) {
    return res.redirect("/signUp.html?error=Invalid+email+format");
  }

  if (password !== confirmPassword) {
    return res.redirect("/signUp.html?error=Passwords+do+not+match");
  }

  if (!validatePassword(password)) {
  return res.redirect("/signUp.html?pwerror=Password+must+be+8+chars+and+include+special+character");
  }

  try {
    // Force role = user here, don’t take it from req.body
    const user = await authService.createLocalUser({ username, email, password });

    await sendWelcomeEmail(email);

    // No need to setAuthenticatedUser yet — they should log in first
    return res.redirect("/login.html?success=Account+created+successfully");
  } catch (err) {
    if (err.code === "USERNAME_TAKEN") {
      return res.redirect("/signUp.html?error=Username+already+taken");
    }
    if (err.code === "EMAIL_TAKEN") {
      return res.redirect("/signUp.html?error=Email+already+in+use");
    }

    return next(err);
  }
}


async function login(req, res, next) {
  const { username, password, role } = req.body; 

  try {
    const result = await authService.validateLocalLogin(username, password, role);

    if (!result.success) {
      if (result.reason === "user_not_found_or_wrong_role") {
        return res.redirect("/login.html?error=Invalid+username+or+role");
      }
      if (result.reason === "google_login_required") {
        return res.redirect("/login.html?error=Use+Google+Login");
      }
      return res.redirect("/login.html?error=Invalid+password");
    }

    // ✅ Save user into session
    setAuthenticatedUser(req, result.user);

    // ✅ Ensure session persists before redirect
    req.session.save(err => {
      if (err) {
        console.error("Session save failed:", err);
        return res.status(500).json({ error: "Failed to create session" });
      }

      // Redirect based on role
      if (role === "user") {
        return res.redirect("/normalUser/dashboard.html");
      } else if (role === "admin") {
        return res.redirect("/adminUser/admin.html");
      } else if (role === "super_admin") {
        return res.redirect("/superAdminUser/superAdminDashboard.html");
      } else {
        return res.redirect("/login.html?error=invalid_role");
      }
    });
  } catch (err) {
    return next(err);
  }
}


async function googleCallback(req, res, next) {
  try {
    const profile = req.user;
    const email = profile?.emails?.[0]?.value;
    const name = profile?.displayName || "Google User";

    if (!email) {
      return res.redirect("/login.html?error=Google+account+email+not+available");
    }

    const result = await authService.findOrCreateGoogleUser({ name, email });

    if (result.created) {
      await sendWelcomeEmail(result.user.email);
    }

    // ✅ Save user into session
    setAuthenticatedUser(req, result.user);

    // ✅ Ensure session persists before redirect
    req.session.save(err => {
      if (err) {
        console.error("Session save failed:", err);
        return res.status(500).send("Failed to create session");
      }

      return res.redirect("/normalUser/dashboard.html");
    });
  } catch (err) {
    return next(err);
  }
}


async function currentUser(req, res, next) {
  try {
    const sessionUser = req.session.user;
    const email = sessionUser?.email || req.user?.emails?.[0]?.value;

    if (!email) {
      return res.status(401).json({ error: "not_authenticated" });
    }

    const user = await authService.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "not_authenticated" });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  signup,
  login,
  googleCallback,
  currentUser,
};
