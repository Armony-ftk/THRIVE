function normalizeTaskCount(count) {
  const numeric = Number(count);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }
  return Math.trunc(numeric);
}

function calculateCompletionPercent(completedTasks, totalTasks) {
  const safeTotal = normalizeTaskCount(totalTasks);
  const safeCompleted = normalizeTaskCount(completedTasks);

  if (safeTotal === 0) {
    return 0;
  }

  const percent = Math.round((safeCompleted / safeTotal) * 100);
  return Math.min(Math.max(percent, 0), 100);
}

function attachProgressToGoal(goal) {
  const totalTasks = normalizeTaskCount(goal.total_tasks);
  const completedTasks = normalizeTaskCount(goal.completed_tasks);

  return {
    ...goal,
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    progress_percent: calculateCompletionPercent(completedTasks, totalTasks),
  };
}

function attachProgressToGoals(goals) {
  if (!Array.isArray(goals)) {
    return [];
  }

  return goals.map(attachProgressToGoal);
}

module.exports = {
  normalizeTaskCount,
  calculateCompletionPercent,
  attachProgressToGoal,
  attachProgressToGoals,
};
