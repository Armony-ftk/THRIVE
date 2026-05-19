const authService = require("../services/authService");

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

async function signup(req, res, next) {
  const { username, email, password, confirmPassword, role } = req.body;

  if (password !== confirmPassword) {
    return res.redirect("/signUp.html?error=Passwords+do+not+match");
  }

  try {
    const user = await authService.createLocalUser({ username, email, password, role });
    setAuthenticatedUser(req, user);
    return res.redirect("/dashboard.html");
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
  const { username, password } = req.body;

  try {
    const result = await authService.validateLocalLogin(username, password);

    if (!result.success) {
      if (result.reason === "user_not_found") {
        return res.redirect("/login.html?error=Invalid+username+or+password");
      }

      if (result.reason === "google_login_required") {
        return res.redirect("/login.html?error=Use+Google+Login");
      }

      return res.redirect("/login.html?error=Invalid+password");
    }

    setAuthenticatedUser(req, result.user);
    return res.redirect("/dashboard.html");
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
    setAuthenticatedUser(req, result.user);
    return res.redirect("/dashboard.html");
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
