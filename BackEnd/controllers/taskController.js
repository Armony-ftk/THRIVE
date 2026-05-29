const { getTasksForUser } = require("../services/taskQueryService");
const { completeTaskForUser } = require("../services/taskCompletionService");
const { createApiError } = require("../utils/apiErrorHandler");

function getAuthenticatedUserId(req) {
  return req.session?.user?.id || req.user?.id;
}

function parseStatusesQuery(rawStatuses) {
  if (!rawStatuses) {
    return undefined;
  }

  const statuses = String(rawStatuses)
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return statuses.length ? statuses : undefined;
}

async function getTasks(req, res, next) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: "not_authenticated" });
  }

  try {
    const requestedStatuses = parseStatusesQuery(req.query.statuses);
    const tasks = await getTasksForUser(userId, requestedStatuses);
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
