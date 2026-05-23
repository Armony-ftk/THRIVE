const { getProgressSummaryForUser } = require("../services/progressSummaryService");

function getAuthenticatedUserId(req) {
  return req.session?.user?.id || req.user?.id;
}

async function getProgressSummary(req, res, next) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: "not_authenticated" });
  }

  try {
    const summary = await getProgressSummaryForUser(userId);
    return res.json({ success: true, summary });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getProgressSummary,
};
