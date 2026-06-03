const { poolPromise, sql } = require("../database/connection");
const { createApiError } = require("../utils/apiErrorHandler");

// "New user" threshold — users who joined within this many days are labelled "new".
const NEW_USER_DAYS = 7;

/**
 * Platform-level statistics for the admin overview dashboard.
 */
async function getUserStats() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT
      SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END)                                                       AS total_users,
      SUM(CASE WHEN role = 'user' AND account_status = 'suspended' THEN 1 ELSE 0 END)                      AS suspended_users,
      SUM(CASE WHEN role = 'user' AND created_at >= DATEADD(day, -${NEW_USER_DAYS}, GETDATE()) THEN 1 ELSE 0 END) AS new_users,
      (
        SELECT COUNT(DISTINCT g2.user_id)
        FROM   Progress p2
        JOIN   Tasks   t2 ON t2.id  = p2.task_id
        JOIN   Goals   g2 ON g2.id  = t2.goal_id
        WHERE  CAST(p2.completion_date AS DATE) = CAST(GETDATE() AS DATE)
      ) AS active_today
    FROM Users
  `);
  return result.recordset[0];
}

/**
 * Most recently registered regular users.
 * @param {number} limit
 */
async function getRecentUsers(limit = 5) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("limit", sql.Int, limit)
    .query(`
      SELECT TOP (@limit)
        u.id,
        u.name,
        u.email,
        u.account_status,
        u.created_at,
        COUNT(g.id) AS goal_count
      FROM   Users u
      LEFT   JOIN Goals g ON g.user_id = u.id
      WHERE  u.role = 'user'
      GROUP  BY u.id, u.name, u.email, u.account_status, u.created_at
      ORDER  BY u.created_at DESC
    `);
  return result.recordset;
}

/**
 * Paginated, filterable, searchable user list with goal count and current streak.
 * @param {{ page?: number, pageSize?: number, filter?: string, search?: string }} opts
 */
async function getUsers({ page = 1, pageSize = 12, filter = "all", search = "" } = {}) {
  const offset = (page - 1) * pageSize;
  const pool   = await poolPromise;

  const result = await pool
    .request()
    .input("offset",   sql.Int,          offset)
    .input("pageSize", sql.Int,          pageSize)
    .input("filter",   sql.VarChar(20),  filter)
    .input("search",   sql.VarChar(255), search)
    .query(`
      /* ── Current streak per user using a consecutive-day grouping trick ── */
      WITH activity AS (
        SELECT DISTINCT
          g.user_id,
          CAST(p.completion_date AS DATE) AS d
        FROM   Progress p
        JOIN   Tasks t ON t.id  = p.task_id
        JOIN   Goals  g ON g.id = t.goal_id
      ),
      ranked AS (
        SELECT user_id, d,
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY d DESC) AS rn
        FROM   activity
      ),
      grp AS (
        /* Same DATEADD(rn-1, d) value for all rows in a consecutive block */
        SELECT user_id, DATEADD(day, rn - 1, d) AS anchor
        FROM   ranked
      ),
      streak AS (
        /* Keep only the group that touches today or yesterday — that is the current streak */
        SELECT user_id, COUNT(*) AS streak_days
        FROM   grp
        WHERE  anchor >= CAST(DATEADD(day, -1, GETDATE()) AS DATE)
        GROUP  BY user_id
      ),
      user_goals AS (
        SELECT user_id, COUNT(*) AS goal_count
        FROM   Goals
        GROUP  BY user_id
      ),
      filtered AS (
        SELECT
          u.id,
          u.name,
          u.email,
          u.account_status,
          u.created_at,
          ISNULL(ug.goal_count,   0) AS goal_count,
          ISNULL(s.streak_days,   0) AS streak_days,
          COUNT(*) OVER ()           AS total_count
        FROM   Users u
        LEFT   JOIN user_goals ug ON ug.user_id = u.id
        LEFT   JOIN streak     s  ON s.user_id  = u.id
        WHERE  u.role = 'user'
          AND (
                @search  = ''
             OR u.name  LIKE '%' + @search + '%'
             OR u.email LIKE '%' + @search + '%'
          )
          AND (
                @filter = 'all'
             OR (@filter = 'active'    AND u.account_status = 'active')
             OR (@filter = 'suspended' AND u.account_status = 'suspended')
             OR (@filter = 'new'       AND u.created_at >= DATEADD(day, -${NEW_USER_DAYS}, GETDATE()))
          )
      )
      SELECT *
      FROM   filtered
      ORDER  BY created_at DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
    `);

  const rows  = result.recordset || [];
  const total = rows.length > 0 ? rows[0].total_count : 0;
  return { users: rows, total };
}

/**
 * Mark a regular user account as suspended.
 * @param {number} userId
 */
async function suspendUser(userId) {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) throw createApiError(400, "Invalid user ID");

  const pool   = await poolPromise;
  const result = await pool
    .request()
    .input("userId", sql.Int, id)
    .query("UPDATE Users SET account_status = 'suspended' WHERE id = @userId AND role = 'user'");

  if (!result.rowsAffected[0]) throw createApiError(404, "User not found");
  return true;
}

/**
 * Restore a suspended user account to active.
 * @param {number} userId
 */
async function reinstateUser(userId) {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) throw createApiError(400, "Invalid user ID");

  const pool   = await poolPromise;
  const result = await pool
    .request()
    .input("userId", sql.Int, id)
    .query("UPDATE Users SET account_status = 'active' WHERE id = @userId AND role = 'user'");

  if (!result.rowsAffected[0]) throw createApiError(404, "User not found");
  return true;
}

/**
 * Permanently delete a regular user.
 * Goals / Tasks / Progress are removed via ON DELETE CASCADE.
 * @param {number} userId
 */
async function deleteUser(userId) {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) throw createApiError(400, "Invalid user ID");

  const pool   = await poolPromise;
  const result = await pool
    .request()
    .input("userId", sql.Int, id)
    .query("DELETE FROM Users WHERE id = @userId AND role = 'user'");

  if (!result.rowsAffected[0]) throw createApiError(404, "User not found");
  return true;
}

/**
 * Suspend multiple users in one operation.
 * @param {number[]} userIds
 */
async function bulkSuspendUsers(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw createApiError(400, "No user IDs provided");
  }

  const ids = userIds.map(Number).filter(n => Number.isInteger(n) && n > 0);
  if (ids.length === 0) throw createApiError(400, "No valid user IDs provided");

  const pool = await poolPromise;
  const req  = pool.request();
  const params = ids.map((id, i) => { req.input(`id${i}`, sql.Int, id); return `@id${i}`; });

  await req.query(
    `UPDATE Users SET account_status = 'suspended' WHERE id IN (${params.join(",")}) AND role = 'user'`
  );
  return true;
}

/**
 * Delete multiple users in one operation.
 * @param {number[]} userIds
 */
async function bulkDeleteUsers(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw createApiError(400, "No user IDs provided");
  }

  const ids = userIds.map(Number).filter(n => Number.isInteger(n) && n > 0);
  if (ids.length === 0) throw createApiError(400, "No valid user IDs provided");

  const pool = await poolPromise;
  const req  = pool.request();
  const params = ids.map((id, i) => { req.input(`id${i}`, sql.Int, id); return `@id${i}`; });

  await req.query(
    `DELETE FROM Users WHERE id IN (${params.join(",")}) AND role = 'user'`
  );
  return true;
}

module.exports = {
  getUserStats,
  getRecentUsers,
  getUsers,
  suspendUser,
  reinstateUser,
  deleteUser,
  bulkSuspendUsers,
  bulkDeleteUsers,
};
