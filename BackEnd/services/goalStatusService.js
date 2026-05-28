const { poolPromise, sql } = require("../database/connection");
const { createApiError } = require("../utils/apiErrorHandler");

const GOAL_RISK_THRESHOLDS = {
  timeProgressPercent: 80,
  minimumCompletionPercent: 70,
};

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function clampPercentage(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

function parseDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isTaskCompleted(task) {
  return normalizeStatus(task.status) === "completed";
}

function isTaskInProgress(task) {
  return normalizeStatus(task.status) === "in_progress";
}

function isTaskOverdue(task) {
  const status = normalizeStatus(task.status);
  if (status === "completed") {
    return false;
  }

  const deadline = parseDate(task.deadline);
  if (!deadline) {
    return false;
  }

  return deadline.getTime() < Date.now();
}

function calculateTaskCompletionPercent(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return 0;
  }

  const completedCount = tasks.filter(isTaskCompleted).length;
  return clampPercentage((completedCount / tasks.length) * 100);
}

function calculateTimeProgress(goal) {
  const createdAt = parseDate(goal.created_at || goal.createdAt);
  const deadline = parseDate(goal.deadline);

  if (!createdAt || !deadline) {
    return 0;
  }

  const elapsedMs = Date.now() - createdAt.getTime();
  const totalMs = deadline.getTime() - createdAt.getTime();

  if (totalMs <= 0) {
    return 100;
  }

  return clampPercentage((elapsedMs / totalMs) * 100);
}

function isGoalNearDeadline(goal) {
  return calculateTimeProgress(goal) >= GOAL_RISK_THRESHOLDS.timeProgressPercent;
}

function isCompletionLow(tasks) {
  return calculateTaskCompletionPercent(tasks) < GOAL_RISK_THRESHOLDS.minimumCompletionPercent;
}

function shouldMarkGoalAtRiskByProgress(goal, tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return false;
  }

  return isGoalNearDeadline(goal) && isCompletionLow(tasks);
}

function determineGoalStatus(tasks, goal) {
  if (!Array.isArray(tasks)) {
    throw createApiError(500, "Goal task list must be an array.");
  }

  if (tasks.length === 0) {
    return "pending";
  }

  if (tasks.every(isTaskCompleted)) {
    return "completed";
  }

  if (tasks.some(isTaskOverdue)) {
    return "at_risk";
  }

  if (shouldMarkGoalAtRiskByProgress(goal, tasks)) {
    return "at_risk";
  }

  if (tasks.some((task) => isTaskInProgress(task) || isTaskCompleted(task))) {
    return "active";
  }

  return "pending";
}

async function fetchGoalTasks(goalId, transaction) {
  const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
  request.input("goalId", sql.Int, Number(goalId));

  const result = await request.query(`
    SELECT id, status, deadline
    FROM tasks
    WHERE goal_id = @goalId;
  `);

  return result.recordset || [];
}

async function fetchGoalMeta(goalId, transaction) {
  const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
  request.input("goalId", sql.Int, Number(goalId));

  const result = await request.query(`
    SELECT status, created_at, deadline
    FROM goals
    WHERE id = @goalId;
  `);

  return result.recordset && result.recordset[0] ? result.recordset[0] : null;
}

async function persistGoalStatus(goalId, status, transaction) {
  const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
  request.input("goalId", sql.Int, Number(goalId));
  request.input("status", sql.NVarChar(50), status);

  await request.query(`
    UPDATE goals
    SET status = @status
    WHERE id = @goalId;
  `);
}

async function evaluateGoalStatus(goalId, transaction = null) {
  const normalizedGoalId = Number(goalId);
  if (!Number.isInteger(normalizedGoalId) || normalizedGoalId <= 0) {
    throw createApiError(400, "A valid goal id is required to evaluate goal status.");
  }

  let tasks;
  let goalMeta;

  // When operating inside an existing transaction we must avoid running
  // multiple requests in parallel on the same transaction/connection because
  // the `mssql` driver does not support concurrent requests on a single
  // transactional connection. Run sequentially in that case. When there is
  // no transaction, fetching in parallel is fine and slightly faster.
  if (transaction) {
    tasks = await fetchGoalTasks(normalizedGoalId, transaction);
    goalMeta = await fetchGoalMeta(normalizedGoalId, transaction);
  } else {
    [tasks, goalMeta] = await Promise.all([
      fetchGoalTasks(normalizedGoalId),
      fetchGoalMeta(normalizedGoalId),
    ]);
  }

  if (!goalMeta) {
    throw createApiError(404, "Goal not found while evaluating status.");
  }

  const newStatus = determineGoalStatus(tasks, goalMeta);
  const currentStatus = normalizeStatus(goalMeta.status);

  if (currentStatus !== newStatus) {
    await persistGoalStatus(normalizedGoalId, newStatus, transaction);
  }

  return newStatus;
}

module.exports = {
  evaluateGoalStatus,
  isTaskOverdue,
  determineGoalStatus,
  calculateTaskCompletionPercent,
  calculateTimeProgress,
  isGoalNearDeadline,
};
