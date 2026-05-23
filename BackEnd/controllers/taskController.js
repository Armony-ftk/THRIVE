const { getTasksForUser } = require("../services/taskQueryService");

function getAuthenticatedUserId(req) {
  return req.session?.user?.id || req.user?.id;
}

async function getTasks(req, res, next) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: "not_authenticated" });
  }

  try {
    const tasks = await getTasksForUser(userId);
    return res.json({ success: true, tasks });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getTasks,
};
