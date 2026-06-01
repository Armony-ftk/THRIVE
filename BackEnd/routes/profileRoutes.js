const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");

router.get("/profile/current", profileController.getCurrentProfile);
router.post("/profile/update", profileController.updateProfile);

module.exports = router;