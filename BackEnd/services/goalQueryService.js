const { poolPromise, sql } = require("../database/connection");
const { createApiError } = require("../utils/apiErrorHandler");
const { attachProgressToGoals } = require("./goalProgressService");

const GOAL_STATUS_PRIORITY_SQL = `
      CASE LOWER(ISNULL(g.status, ''))
        WHEN 'at_risk' THEN 1
        WHEN 'active' THEN 2
        WHEN 'pending' THEN 3
        WHEN 'completed' THEN 4
        ELSE 5
      END`;

async function getGoalsForUser(userId) {
  if (userId === undefined || userId === null) {
    throw createApiError(401, "Authenticated user is required to fetch goals.");
  }

  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("userId", sql.Int, Number(userId))
    .query(`
      SELECT
        g.id,
        g.user_id,
        g.title,
        g.category,
        g.duration,
        g.duration_unit,
        g.deadline,
        g.created_at,
        g.status,
        COUNT(t.id) AS total_tasks,
        SUM(CASE WHEN LOWER(ISNULL(t.status, '')) = 'completed' THEN 1 ELSE 0 END) AS completed_tasks
      FROM goals AS g
      LEFT JOIN tasks AS t ON t.goal_id = g.id
      WHERE g.user_id = @userId
      GROUP BY
        g.id,
        g.user_id,
        g.title,
        g.category,
        g.duration,
        g.duration_unit,
        g.deadline,
        g.created_at,
        g.status
      ORDER BY ${GOAL_STATUS_PRIORITY_SQL}, g.deadline ASC, g.created_at DESC;
    `);

  return attachProgressToGoals(result.recordset || []);
}

async function deleteGoalForUser(userId, goalId) {
  if (userId === undefined || userId === null) {
    throw createApiError(401, "Authenticated user is required to delete goals.");
  }

  const parsedGoalId = Number(goalId);
  if (!Number.isInteger(parsedGoalId) || parsedGoalId <= 0) {
    throw createApiError(400, "A valid goal id is required to delete a goal.");
  }

  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("userId", sql.Int, Number(userId))
    .input("goalId", sql.Int, parsedGoalId)
    .query(`
      DELETE FROM goals
      WHERE id = @goalId AND user_id = @userId;
    `);

  if (!result.rowsAffected || result.rowsAffected[0] === 0) {
    throw createApiError(404, "Goal not found or access denied.");
  }

  return true;
}

module.exports = {
  getGoalsForUser,
  deleteGoalForUser,
};
