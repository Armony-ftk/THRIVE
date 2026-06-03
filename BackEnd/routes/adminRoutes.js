const express = require("express");
const adminController = require("../controllers/adminController");

const router = express.Router();

// Guard: only admin and super_admin sessions may reach any route in this module.
function requireAdmin(req, res, next) {
  const role = req.session?.user?.role;
  if (role !== "admin" && role !== "super_admin") {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
  next();
}

router.use(requireAdmin);

// ── Stats & overview ─────────────────────────────────────────────────────────
router.get("/stats",        adminController.getStats);
router.get("/recent-users", adminController.getRecentUsers);

// ── User list (paginated, filtered, searchable) ───────────────────────────────
router.get("/users", adminController.getUsers);

// ── Bulk operations (must be declared before /:userId routes) ─────────────────
router.post("/users/bulk-suspend", adminController.bulkSuspend);
router.post("/users/bulk-delete",  adminController.bulkDelete);

// ── Individual user actions ───────────────────────────────────────────────────
router.patch("/users/:userId/suspend",   adminController.suspendUser);
router.patch("/users/:userId/reinstate", adminController.reinstateUser);
router.delete("/users/:userId",          adminController.deleteUser);

// ── Goals (paginated, searchable, filterable) ─────────────────────────────────
router.get("/goals/stats", adminController.getGoalStats);
router.get("/goals",       adminController.getGoals);
router.delete("/goals/:goalId", adminController.deleteGoal);

// ── Reports analytics ─────────────────────────────────────────────────────────
router.get("/reports", adminController.getReports);

// ── Admin profile & activity ──────────────────────────────────────────────────
router.get("/me",          adminController.getAdminMe);
router.get("/my-activity", adminController.getAdminActivity);

module.exports = router;
