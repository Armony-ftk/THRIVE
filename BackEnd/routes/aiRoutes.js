const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

// POST /api/ai/test -> runs a simple hardcoded Gemini prompt
router.post("/test", aiController.generateTest);

module.exports = router;
