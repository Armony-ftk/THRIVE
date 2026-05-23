const express = require("express");
const taskController = require("../controllers/taskController");

const router = express.Router();

router.get("/", taskController.getTasks);
router.patch("/:id/complete", taskController.completeTask);

module.exports = router;
