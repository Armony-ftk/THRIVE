const { poolPromise, sql } = require("../database/connection");
const { createApiError } = require("../utils/apiErrorHandler");
const { attachProgressToGoals } = require("./goalProgressService");

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
      ORDER BY g.deadline ASC, g.created_at DESC;
    `);

  return attachProgressToGoals(result.recordset || []);
}

module.exports = {
  getGoalsForUser,
};
