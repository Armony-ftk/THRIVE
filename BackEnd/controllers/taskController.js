const { getTasksForUser } = require("../services/taskQueryService");
const { completeTaskForUser } = require("../services/taskCompletionService");
const { createApiError } = require("../utils/apiErrorHandler");

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

async function completeTask(req, res, next) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: "not_authenticated" });
  }

  const taskId = req.params?.id;

  try {
    const result = await completeTaskForUser(taskId, userId);
    return res.json({ success: true, data: result });
  } catch (error) {
    if (error && error.status === 400) {
      return res.status(400).json({ success: false, error: error.message });
    }
    return next(error);
  }
}

module.exports = {
  getTasks,
  completeTask,
};
