const express = require("express");
const passport = require("passport");
const authController = require("../controllers/authController");

const router = express.Router();

// Auth routes are intentionally kept thin. They delegate all business logic to controllers.
router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/auth/google/chooser",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    callbackURL: "http://localhost:3000/auth/google/callback",
  }),
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login.html" }),
  authController.googleCallback,
);

module.exports = router;
