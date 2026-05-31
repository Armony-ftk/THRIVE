const express = require("express");
const settingsController = require("../controllers/settingsController");

const router = express.Router()

router.post("/signout", settingsController.signOut);
router.get("/current-user", settingsController.getCurrentUser);
router.post("/change-password", settingsController.changePassword);
router.post("/delete-account", settingsController.deleteAccount);

module.exports = router;