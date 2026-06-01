const validatePassword = require("../utils/updatePassword");
const settingsService = require("../services/settingsService");

function getCurrentUser(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  res.json(req.session.user); // ✅ always return latest session user
}

function getSettings(req, res) {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }
  res.sendFile(path.join(__dirname, "../public/settings.html"));
};

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.user.id;

  try {
    const errorMessage = validatePassword(newPassword);
    if (errorMessage) {
      return res.status(400).json({ error: errorMessage });
    }

    await settingsService.changePassword(userId, currentPassword, newPassword);
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

function signOut(req, res) {
  // Destroy the session only
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: "Failed to sign out" });
    }
    // ✅ Return JSON with redirect path
    res.json({ success: true, redirect: "/login.html" });
  });
}

async function deleteAccount(req, res) {
  const userId = req.session.user.id;

 if (!userId) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    // Delete from DB first
    await settingsService.deleteAccount(userId);

    // Then destroy session
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ error: "Failed to end session" });
      }
      res.json({ success: true, redirect: "/login.html" });
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete account" });
  }
};

module.exports = {
    getCurrentUser,
    getSettings,
    changePassword,
    signOut,
    deleteAccount,
}