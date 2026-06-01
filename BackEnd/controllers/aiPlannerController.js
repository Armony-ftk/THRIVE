const { createGoalPlan } = require("../services/aiPlannerService");
const { storeGoalPlan } = require("../services/goalStorageService");
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
  const userId = req.session?.user?.id || req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: "You must be signed in to save your goal plan.",
    });
  }

  try {
    const validatedPlan = await createGoalPlan(userInput);
    const savedPlan = await storeGoalPlan(validatedPlan, userId);

    return res.json({
      success: true,
      data: savedPlan,
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
