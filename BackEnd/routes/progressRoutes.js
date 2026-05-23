const express = require("express");
const progressController = require("../controllers/progressController");

const router = express.Router();

router.get("/summary", progressController.getProgressSummary);

module.exports = router;
