const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const aiPlannerController = require("../controllers/aiPlannerController");

// POST /api/ai/test -> runs a simple hardcoded Gemini prompt
router.post("/test", aiController.generateTest);
// POST /api/ai/plan -> generate a structured goal plan from user input
router.post("/plan", aiPlannerController.planGoal);

module.exports = router;
