const { poolPromise, sql } = require("../database/connection");
const { createApiError } = require("../utils/apiErrorHandler");

async function getTasksForUser(userId) {
  if (userId === undefined || userId === null) {
    throw createApiError(401, "Authenticated user is required to fetch tasks.");
  }

  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("userId", sql.Int, Number(userId))
    .query(`
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
      ORDER BY t.deadline ASC, t.position ASC;
    `);

  return result.recordset || [];
}

module.exports = {
  getTasksForUser,
};
