const { createGoalPlan } = require("../services/aiPlannerService");
const { createApiError } = require("../utils/apiErrorHandler");

exports.planGoal = async (req, res, next) => {
  const goal = req.body?.goal;
  if (typeof goal !== "string" || !goal.trim()) {
    return res.status(400).json({
      success: false,
      error: "Please enter a goal before sending.",
    });
  }

  const userInput = goal.trim();

  try {
    const validatedPlan = await createGoalPlan(userInput);
    return res.json({
      success: true,
      data: validatedPlan,
    });
  } catch (error) {
    if (error && error.status && error.message) {
      return res.status(error.status).json({
        success: false,
        error: error.message,
      });
    }
    return next(error);
  }
};
