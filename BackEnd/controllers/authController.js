const authService = require("../services/authService");

// Controllers manage request/response only. Business rules stay in services.
async function signup(req, res, next) {
  const { username, email, password, confirmPassword, role } = req.body;

  if (password !== confirmPassword) {
    return res.redirect("/signUp.html?error=Passwords+do+not+match");
  }

  try {
    await authService.createLocalUser({ username, email, password, role });
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

    return res.redirect(`/thriveAI.html?user=${encodeURIComponent(result.user.name)}`);
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
    const action = result.created ? "Signed+up+with+Google" : "Logged+in+with+Google";

    return res.redirect(
      `/thriveAI.html?user=${encodeURIComponent(result.user.name)}&success=${action}`,
    );
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  signup,
  login,
  googleCallback,
};
