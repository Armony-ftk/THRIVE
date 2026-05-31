const express = require("express");
const goalController = require("../controllers/goalController");

const router = express.Router();

router.get("/", goalController.getGoals);
router.delete("/:goalId", goalController.deleteGoal);

module.exports = router;
