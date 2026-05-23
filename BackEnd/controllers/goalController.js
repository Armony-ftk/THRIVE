const { getGoalsForUser } = require("../services/goalQueryService");

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

module.exports = {
  getGoals,
};
