const adminUserService     = require("../services/adminUserService");
const adminGoalService     = require("../services/adminGoalService");
const adminReportService   = require("../services/adminReportService");
const adminActivityService = require("../services/adminActivityService");
const { poolPromise, sql } = require("../database/connection");

// Controllers stay thin — request parsing, validation, delegation to service, response.

async function getStats(req, res, next) {
  try {
    const stats = await adminUserService.getUserStats();
    return res.json({ success: true, stats });
  } catch (err) {
    return next(err);
  }
}

async function getRecentUsers(req, res, next) {
  try {
    const users = await adminUserService.getRecentUsers(5);
    return res.json({ success: true, users });
  } catch (err) {
    return next(err);
  }
}

async function getUsers(req, res, next) {
  const page     = Math.max(1, parseInt(req.query.page)     || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 12));
  const filter   = ["all", "active", "suspended", "new"].includes(req.query.filter)
    ? req.query.filter
    : "all";
  const search = typeof req.query.search === "string"
    ? req.query.search.slice(0, 255).trim()
    : "";

  try {
    const { users, total } = await adminUserService.getUsers({ page, pageSize, filter, search });
    return res.json({ success: true, users, total, page, pageSize });
  } catch (err) {
    return next(err);
  }
}

async function suspendUser(req, res, next) {
  const userId  = parseInt(req.params.userId);
  const adminId = req.session?.user?.id;
  if (!userId || userId <= 0) {
    return res.status(400).json({ success: false, error: "Invalid user ID" });
  }
  try {
    await adminUserService.suspendUser(userId);
    adminActivityService.logActivity(adminId, "suspend_user", `Suspended user #${userId}`);
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

async function reinstateUser(req, res, next) {
  const userId  = parseInt(req.params.userId);
  const adminId = req.session?.user?.id;
  if (!userId || userId <= 0) {
    return res.status(400).json({ success: false, error: "Invalid user ID" });
  }
  try {
    await adminUserService.reinstateUser(userId);
    adminActivityService.logActivity(adminId, "reinstate_user", `Reinstated user #${userId}`);
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

async function deleteUser(req, res, next) {
  const userId  = parseInt(req.params.userId);
  const adminId = req.session?.user?.id;
  if (!userId || userId <= 0) {
    return res.status(400).json({ success: false, error: "Invalid user ID" });
  }
  try {
    await adminUserService.deleteUser(userId);
    adminActivityService.logActivity(adminId, "delete_user", `Deleted user #${userId}`);
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

async function bulkSuspend(req, res, next) {
  const { userIds } = req.body;
  try {
    await adminUserService.bulkSuspendUsers(userIds);
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

async function bulkDelete(req, res, next) {
  const { userIds } = req.body;
  try {
    await adminUserService.bulkDeleteUsers(userIds);
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

// ── Admin profile & activity ──────────────────────────────────────────────────

async function getAdminMe(req, res, next) {
  const adminId = req.session?.user?.id;
  if (!adminId) return res.status(401).json({ success: false, error: "Not authenticated" });
  try {
    const pool   = await poolPromise;
    const result = await pool
      .request()
      .input("adminId", sql.Int, adminId)
      .query("SELECT id, name, email, role, created_at FROM Users WHERE id = @adminId");
    const user = result.recordset[0];
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    return res.json({ success: true, user });
  } catch (err) {
    return next(err);
  }
}

async function getAdminActivity(req, res, next) {
  const adminId = req.session?.user?.id;
  if (!adminId) return res.status(401).json({ success: false, error: "Not authenticated" });
  try {
    const [stats, recentActions] = await Promise.all([
      adminActivityService.getActivityStats(adminId),
      adminActivityService.getRecentActivity(adminId, 5),
    ]);
    return res.json({ success: true, stats, recentActions });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getStats,
  getRecentUsers,
  getUsers,
  suspendUser,
  reinstateUser,
  deleteUser,
  bulkSuspend,
  bulkDelete,
  // Goals
  getGoalStats,
  getGoals,
  deleteGoal,
  // Reports
  getReports,
  // Admin profile & activity
  getAdminMe,
  getAdminActivity,
};

// ── Goals ─────────────────────────────────────────────────────────────────────

async function getGoalStats(req, res, next) {
  try {
    const stats = await adminGoalService.getGoalStats();
    return res.json({ success: true, stats });
  } catch (err) {
    return next(err);
  }
}

async function getGoals(req, res, next) {
  const page     = Math.max(1, parseInt(req.query.page)     || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 50));
  const VALID_CATS = ["all", "fitness", "learning", "finance", "career", "health", "other", "flagged"];
  const category   = VALID_CATS.includes(req.query.category) ? req.query.category : "all";
  const search     = typeof req.query.search === "string"
    ? req.query.search.slice(0, 255).trim()
    : "";

  try {
    const { goals, total } = await adminGoalService.getGoals({ page, pageSize, category, search });
    return res.json({ success: true, goals, total, page, pageSize });
  } catch (err) {
    return next(err);
  }
}

async function deleteGoal(req, res, next) {
  const goalId  = parseInt(req.params.goalId);
  const adminId = req.session?.user?.id;
  if (!goalId || goalId <= 0) {
    return res.status(400).json({ success: false, error: "Invalid goal ID" });
  }
  try {
    await adminGoalService.deleteGoal(goalId);
    adminActivityService.logActivity(adminId, "delete_goal", `Deleted goal #${goalId}`);
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

// ── Reports ───────────────────────────────────────────────────────────────────

async function getReports(req, res, next) {
  const days = Math.min(90, Math.max(7, parseInt(req.query.days) || 7));
  try {
    const data = await adminReportService.getReportData({ days });
    return res.json({ success: true, data });
  } catch (err) {
    return next(err);
  }
}
