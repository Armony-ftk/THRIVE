const { poolPromise, sql } = require("../database/connection");

/**
 * Aggregate statistics for all goals in the platform.
 */
async function getGoalStats() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT
      COUNT(*)                                                                  AS total_goals,
      SUM(CASE WHEN status IN ('active','at_risk','pending') THEN 1 ELSE 0 END) AS active_goals,
      SUM(CASE WHEN status = 'completed'                    THEN 1 ELSE 0 END) AS completed_goals,
      SUM(CASE WHEN status = 'cancelled'                    THEN 1 ELSE 0 END) AS cancelled_goals
    FROM Goals
  `);
  return result.recordset[0];
}

/**
 * Paginated, searchable, category-filterable goal list.
 * Each row includes the owning user's name/email, task count, and completed task count
 * so the frontend can derive a completion percentage without extra round-trips.
 *
 * @param {{ page?: number, pageSize?: number, category?: string, search?: string }} opts
 */
async function getGoals({ page = 1, pageSize = 50, category = "all", search = "" } = {}) {
  const offset = (page - 1) * pageSize;
  const pool   = await poolPromise;

  const result = await pool
    .request()
    .input("offset",   sql.Int,          offset)
    .input("pageSize", sql.Int,          pageSize)
    .input("category", sql.VarChar(100), category)
    .input("search",   sql.VarChar(255), search)
    .query(`
      SELECT
        g.id,
        g.title,
        g.category,
        g.status,
        g.created_at,
        g.deadline,
        u.name  AS user_name,
        u.email AS user_email,
        COUNT(t.id)                                              AS task_count,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
        COUNT(*) OVER ()                                         AS total_count
      FROM   Goals g
      JOIN   Users u ON u.id = g.user_id
      LEFT   JOIN Tasks t ON t.goal_id = g.id
      WHERE  (
               @search   = ''
            OR g.title LIKE '%' + @search + '%'
            OR u.name  LIKE '%' + @search + '%'
             )
        AND  (@category = 'all' OR g.category = @category)
      GROUP  BY g.id, g.title, g.category, g.status, g.created_at, g.deadline,
                u.name, u.email
      ORDER  BY g.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `);

  const goals = result.recordset;
  const total = goals.length > 0 ? Number(goals[0].total_count) : 0;
  return { goals, total };
}

/**
 * Permanently delete a goal by ID. CASCADE removes its Tasks and Progress.
 * @param {number} goalId
 */
async function deleteGoal(goalId) {
  const pool = await poolPromise;
  await pool
    .request()
    .input("goalId", sql.Int, goalId)
    .query("DELETE FROM Goals WHERE id = @goalId");
  return true;
}

module.exports = { getGoalStats, getGoals, deleteGoal };
