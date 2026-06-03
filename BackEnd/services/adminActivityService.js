const { poolPromise, sql } = require("../database/connection");

/**
 * Record an admin action in AdminActivityLog.
 * Silently swallows errors so a logging failure never breaks the primary action.
 * @param {number} adminId
 * @param {string} actionType  e.g. 'suspend_user' | 'reinstate_user' | 'delete_user' | 'delete_goal'
 * @param {string} description Human-readable summary
 */
async function logActivity(adminId, actionType, description) {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("adminId",     sql.Int,           adminId)
      .input("actionType",  sql.NVarChar(50),  actionType)
      .input("description", sql.NVarChar(500), description || "")
      .query(`
        INSERT INTO AdminActivityLog (admin_id, action_type, description)
        VALUES (@adminId, @actionType, @description)
      `);
  } catch (err) {
    console.error("[adminActivityService] logActivity failed:", err.message);
  }
}

/**
 * Aggregate counts for the activity stats panel.
 * Returns zero-counts on error (table may not exist yet).
 * @param {number} adminId
 */
async function getActivityStats(adminId) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("adminId", sql.Int, adminId)
      .query(`
        SELECT
          COUNT(*)                                                            AS total_actions,
          SUM(CASE WHEN action_type = 'delete_goal'   THEN 1 ELSE 0 END)    AS goals_removed,
          SUM(CASE WHEN action_type = 'suspend_user'  THEN 1 ELSE 0 END)    AS users_suspended
        FROM AdminActivityLog
        WHERE admin_id = @adminId
      `);
    return result.recordset[0] || { total_actions: 0, goals_removed: 0, users_suspended: 0 };
  } catch (err) {
    console.error("[adminActivityService] getActivityStats failed:", err.message);
    return { total_actions: 0, goals_removed: 0, users_suspended: 0 };
  }
}

/**
 * Most-recent N actions by this admin.
 * Returns an empty array on error.
 * @param {number} adminId
 * @param {number} [limit=5]
 */
async function getRecentActivity(adminId, limit = 5) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("adminId", sql.Int, adminId)
      .input("limit",   sql.Int, limit)
      .query(`
        SELECT TOP (@limit) action_type, description, created_at
        FROM   AdminActivityLog
        WHERE  admin_id = @adminId
        ORDER  BY created_at DESC
      `);
    return result.recordset;
  } catch (err) {
    console.error("[adminActivityService] getRecentActivity failed:", err.message);
    return [];
  }
}

module.exports = { logActivity, getActivityStats, getRecentActivity };
