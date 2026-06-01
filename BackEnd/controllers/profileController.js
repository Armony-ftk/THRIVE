const profileService = require("../services/profileService");

function getCurrentProfile(req, res) {
  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ error: "Not logged in" });

  res.json(req.session.user); // always return session user
}

async function updateProfile(req, res) {
  const userId = req.session?.user?.id;
  const { name, email } = req.body;

  if (!userId) return res.status(401).json({ error: "Not logged in" });

  try {
    await profileService.updateUser(userId, name, email);

    // Update session too
    req.session.user.name = name;
    req.session.user.email = email;

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
}

module.exports = { getCurrentProfile, updateProfile };
