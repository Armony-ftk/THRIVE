const { poolPromise, sql } = require("../database/connection");
const { createApiError } = require("../utils/apiErrorHandler");

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
        id,
        user_id,
        title,
        category,
        duration,
        duration_unit,
        deadline,
        created_at,
        status
      FROM goals
      WHERE user_id = @userId
      ORDER BY deadline ASC, created_at DESC;
    `);

  return result.recordset || [];
}

module.exports = {
  getGoalsForUser,
};
