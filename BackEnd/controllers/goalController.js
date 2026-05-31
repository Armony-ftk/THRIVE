const { getGoalsForUser, deleteGoalForUser } = require("../services/goalQueryService");

function getAuthenticatedUserId(req) {
  return req.session?.user?.id || req.user?.id;
}

async function getGoals(req, res, next) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: "not_authenticated" });
  }

  try {
    const goals = await getGoalsForUser(userId);
    return res.json({ success: true, goals });
  } catch (error) {
    return next(error);
  }
}

async function deleteGoal(req, res, next) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: "not_authenticated" });
  }

  try {
    await deleteGoalForUser(userId, req.params.goalId);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getGoals,
  deleteGoal,
};
