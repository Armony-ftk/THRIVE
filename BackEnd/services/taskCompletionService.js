const { poolPromise, sql } = require("../database/connection");
const { createApiError } = require("../utils/apiErrorHandler");

function normalizeId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function completeTaskForUser(taskId, userId) {
  const normalizedTaskId = normalizeId(taskId);
  const normalizedUserId = normalizeId(userId);

  if (!normalizedUserId) {
    throw createApiError(401, "Authenticated user is required to complete a task.");
  }

  if (!normalizedTaskId) {
    throw createApiError(400, "Task id must be a valid positive integer.");
  }

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const selectRequest = new sql.Request(transaction);
    selectRequest.input("taskId", sql.Int, normalizedTaskId);
    selectRequest.input("userId", sql.Int, normalizedUserId);

    const selectSql = `
      SELECT t.status
      FROM Tasks AS t
      INNER JOIN Goals AS g ON g.id = t.goal_id
      WHERE t.id = @taskId AND g.user_id = @userId;
    `;

    const selectResult = await selectRequest.query(selectSql);
    const taskRecord = selectResult.recordset && selectResult.recordset[0];

    if (!taskRecord) {
      throw createApiError(404, "Task not found for the authenticated user.");
    }

    const currentStatus = String(taskRecord.status || "").toLowerCase();
    if (currentStatus === "completed") {
      throw createApiError(400, "Task is already completed.");
    }

    if (!["pending", "in_progress"].includes(currentStatus)) {
      throw createApiError(400, "Only pending or in_progress tasks may be marked as completed.");
    }

    const updateRequest = new sql.Request(transaction);
    updateRequest.input("taskId", sql.Int, normalizedTaskId);
    updateRequest.input("status", sql.NVarChar(50), "completed");

    const updateSql = `
      UPDATE Tasks
      SET status = @status
      WHERE id = @taskId;
    `;

    await updateRequest.query(updateSql);

    const progressRequest = new sql.Request(transaction);
    progressRequest.input("taskId", sql.Int, normalizedTaskId);

    const insertSql = `
      INSERT INTO Progress (task_id)
      VALUES (@taskId);
    `;

    await progressRequest.query(insertSql);
    await transaction.commit();

    return {
      taskId: normalizedTaskId,
      status: "completed",
    };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Failed to rollback task completion transaction:", rollbackError);
    }

    if (error && error.status && error.message) {
      throw error;
    }

    throw createApiError(500, "Failed to complete the task.");
  }
}

module.exports = {
  completeTaskForUser,
};
