const { poolPromise, sql } = require("../database/connection");
const { createApiError } = require("../utils/apiErrorHandler");

const DEFAULT_ACTIVE_STATUSES = ["pending", "in_progress"];

function normalizeStatuses(statuses) {
  if (statuses === null) {
    return null;
  }

  if (!Array.isArray(statuses) || statuses.length === 0) {
    return DEFAULT_ACTIVE_STATUSES;
  }

  const normalized = statuses
    .map((status) => String(status || "").trim().toLowerCase())
    .filter(Boolean);

  if (normalized.length === 0) {
    return DEFAULT_ACTIVE_STATUSES;
  }

  if (normalized.includes("all")) {
    return null;
  }

  return normalized;
}

function applyStatusFilters(request, statuses) {
  const normalized = normalizeStatuses(statuses);
  if (normalized === null) {
    return null;
  }

  const placeholders = normalized.map((status, index) => {
    const paramName = `status${index}`;
    request.input(paramName, sql.NVarChar(50), status);
    return `@${paramName}`;
  });
  return placeholders.join(", ");
}

async function getTasksForUser(userId, statuses = DEFAULT_ACTIVE_STATUSES) {
  if (userId === undefined || userId === null) {
    throw createApiError(401, "Authenticated user is required to fetch tasks.");
  }

  const pool = await poolPromise;
  const request = pool.request();
  request.input("userId", sql.Int, Number(userId));

  const statusList = applyStatusFilters(request, statuses);
  const statusCondition = statusList ? `AND t.status IN (${statusList})` : "";

  const result = await request.query(`
      SELECT
        t.id,
        t.title,
        t.deadline,
        t.status,
        t.position,
        g.id AS goal_id,
        g.title AS goal_title,
        g.category AS goal_category
      FROM tasks AS t
      INNER JOIN goals AS g ON g.id = t.goal_id
      WHERE g.user_id = @userId
        ${statusCondition}
      ORDER BY t.deadline ASC, t.position ASC;
    `);

  return result.recordset || [];
}

module.exports = {
  getTasksForUser,
};
