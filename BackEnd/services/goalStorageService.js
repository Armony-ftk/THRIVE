const { poolPromise, sql } = require("../database/connection");
const { calculateGoalDeadline, calculateTaskDeadline } = require("../utils/dateHelpers");
const { createApiError } = require("../utils/apiErrorHandler");

async function storeGoalPlan(validatedPlan, userId) {
  if (!validatedPlan || typeof validatedPlan !== "object") {
    throw createApiError(400, "Validated AI plan is required.");
  }

  if (userId === undefined || userId === null) {
    throw createApiError(401, "Authenticated user is required to save the goal.");
  }

  const goalDeadline = calculateGoalDeadline(validatedPlan.duration, validatedPlan.duration_unit);

  const taskRows = validatedPlan.tasks.map((task, index) => {
    const taskDeadline = calculateTaskDeadline(task.offset_days);

    return {
      title: task.title,
      deadline: taskDeadline,
      position: index + 1,
      status: "pending",
    };
  });

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const goalRequest = new sql.Request(transaction);
    goalRequest.input("userId", sql.NVarChar(255), String(userId));
    goalRequest.input("title", sql.NVarChar(255), validatedPlan.title);
    goalRequest.input("category", sql.NVarChar(100), validatedPlan.category);
    goalRequest.input("duration", sql.Int, validatedPlan.duration);
    goalRequest.input("durationUnit", sql.NVarChar(20), validatedPlan.duration_unit);
    goalRequest.input("deadline", sql.DateTime, goalDeadline);
    goalRequest.input("createdAt", sql.DateTime, new Date());
    goalRequest.input("status", sql.NVarChar(50), "pending");

    const insertGoalSql = `
      INSERT INTO goals (user_id, title, category, duration, duration_unit, deadline, created_at, status)
      OUTPUT INSERTED.id, INSERTED.user_id, INSERTED.title, INSERTED.category, INSERTED.duration, INSERTED.duration_unit, INSERTED.deadline, INSERTED.created_at, INSERTED.status
      VALUES (@userId, @title, @category, @duration, @durationUnit, @deadline, @createdAt, @status);
    `;

    const goalResult = await goalRequest.query(insertGoalSql);
    if (!goalResult.recordset || goalResult.recordset.length === 0) {
      throw createApiError(500, "Failed to persist goal in the database.");
    }

    const savedGoal = goalResult.recordset[0];
    const savedTasks = [];

    for (const task of taskRows) {
      const taskRequest = new sql.Request(transaction);
      taskRequest.input("goalId", sql.Int, savedGoal.id);
      taskRequest.input("title", sql.NVarChar(255), task.title);
      taskRequest.input("deadline", sql.DateTime, task.deadline);
      taskRequest.input("position", sql.Int, task.position);
      taskRequest.input("status", sql.NVarChar(50), task.status);

      const insertTaskSql = `
        INSERT INTO tasks (goal_id, title, deadline, position, status)
        OUTPUT INSERTED.id, INSERTED.goal_id, INSERTED.title, INSERTED.deadline, INSERTED.position, INSERTED.status
        VALUES (@goalId, @title, @deadline, @position, @status);
      `;

      const taskResult = await taskRequest.query(insertTaskSql);
      if (!taskResult.recordset || taskResult.recordset.length === 0) {
        throw createApiError(500, `Failed to persist task: ${task.title}`);
      }

      savedTasks.push(taskResult.recordset[0]);
    }

    await transaction.commit();

    return {
      goal: savedGoal,
      tasks: savedTasks,
    };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Failed to rollback transaction:", rollbackError);
    }

    if (error && error.status && error.message) {
      throw error;
    }

    throw createApiError(500, "Database transaction failed while saving the goal plan.");
  }
}

module.exports = {
  storeGoalPlan,
};
