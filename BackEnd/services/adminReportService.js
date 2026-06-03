const { poolPromise, sql } = require("../database/connection");

/**
 * Single aggregated analytics payload for the reports dashboard.
 * All data is derived from the existing schema — no new columns required.
 *
 * @param {{ days?: number }} opts
 */
async function getReportData({ days = 7 } = {}) {
  const pool = await poolPromise;

  // ── (1) Top-level platform stats ───────────────────────────────────────────
  const statsResult = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM Users WHERE role = 'user') AS total_users,
      (SELECT COUNT(*) FROM Users WHERE role = 'user'
         AND created_at >= DATEADD(day, -7, GETDATE()))  AS new_users_week,
      (
        SELECT COUNT(DISTINCT g.user_id)
        FROM   Progress p
        JOIN   Tasks t ON t.id  = p.task_id
        JOIN   Goals  g ON g.id = t.goal_id
        WHERE  CAST(p.completion_date AS DATE) = CAST(GETDATE() AS DATE)
      ) AS daily_active,
      (SELECT COUNT(*) FROM Goals
         WHERE status IN ('active','at_risk','pending')) AS active_goals
  `);

  // ── (2) Signups per day for the selected period ────────────────────────────
  const signupsResult = await pool
    .request()
    .input("days", sql.Int, days)
    .query(`
      SELECT
        CAST(created_at AS DATE) AS signup_date,
        COUNT(*)                 AS signup_count
      FROM   Users
      WHERE  role = 'user'
        AND  created_at >= DATEADD(day, -@days + 1, CAST(GETDATE() AS DATE))
      GROUP  BY CAST(created_at AS DATE)
      ORDER  BY signup_date ASC
    `);

  // ── (3) Goals by category (for donut chart) ────────────────────────────────
  const categoryResult = await pool.request().query(`
    SELECT
      ISNULL(NULLIF(LTRIM(RTRIM(category)), ''), 'other') AS category,
      COUNT(*) AS cnt
    FROM   Goals
    GROUP  BY ISNULL(NULLIF(LTRIM(RTRIM(category)), ''), 'other')
    ORDER  BY cnt DESC
  `);

  const totalGoals = categoryResult.recordset.reduce((s, r) => s + r.cnt, 0);
  const categories = categoryResult.recordset.map(r => ({
    category: r.category,
    count:    r.cnt,
    pct:      totalGoals > 0 ? Math.round((r.cnt / totalGoals) * 100) : 0,
  }));

  // ── (4) Most-engaged goals (deepest task engagement across all users) ───────
  const topGoalsResult = await pool.request().query(`
    SELECT TOP 5
      g.title,
      ISNULL(NULLIF(LTRIM(RTRIM(g.category)), ''), 'other') AS category,
      u.name  AS user_name,
      COUNT(t.id)                                                    AS task_count,
      SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END)       AS completed_tasks
    FROM   Goals g
    JOIN   Users u ON u.id = g.user_id
    LEFT   JOIN Tasks t ON t.goal_id = g.id
    GROUP  BY g.id, g.title, g.category, u.name
    ORDER  BY task_count DESC
  `);

  // ── (5) Platform activity metrics for selected period ─────────────────────
  const metricsResult = await pool
    .request()
    .input("days", sql.Int, days)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM Goals
           WHERE created_at  >= DATEADD(day, -@days, GETDATE()))                            AS goals_created,
        (SELECT COUNT(*) FROM Goals WHERE status = 'completed')                             AS goals_completed,
        (SELECT COUNT(*) FROM Goals WHERE status = 'cancelled')                             AS goals_cancelled,
        (SELECT COUNT(*) FROM Users
           WHERE role = 'user' AND created_at >= DATEADD(day, -@days, GETDATE()))          AS new_users,
        (SELECT COUNT(DISTINCT p.task_id)
         FROM   Progress p
         WHERE  p.completion_date >= DATEADD(day, -@days, GETDATE()))                      AS tasks_completed
    `);

  return {
    stats:    statsResult.recordset[0],
    signups:  signupsResult.recordset,
    categories,
    topGoals: topGoalsResult.recordset,
    metrics:  metricsResult.recordset[0],
    days,
  };
}

module.exports = { getReportData };
