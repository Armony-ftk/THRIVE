(function (window) {
  // Convert a deadline value into a Date object. This helper is defensive so the
  // dashboard can handle both Date instances and backend timestamp strings.
  function parseDeadline(value) {
    if (value instanceof Date) {
      return value;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function isSameCalendarDay(dateA, dateB) {
    if (!dateA || !dateB) {
      return false;
    }
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  }

  function normalizeStatus(status) {
    return String(status || "unknown").trim().toLowerCase().replace(/\s+/g, "_");
  }

  function countGoalStatuses(goals) {
    const counts = {
      activeGoals: 0,
      onTrackGoals: 0,
      atRiskGoals: 0,
      pendingGoals: 0,
    };

    for (const goal of goals) {
      const status = normalizeStatus(goal.status);
      if (status === "active" || status === "on_track" || status === "on track") {
        counts.activeGoals += 1;
        counts.onTrackGoals += 1;
      } else if (status === "at_risk" || status === "at risk") {
        counts.atRiskGoals += 1;
      } else if (status === "pending") {
        counts.pendingGoals += 1;
      }
    }

    return counts;
  }

  function isTaskCompleted(task) {
    return normalizeStatus(task.status) === "completed";
  }

  function filterActiveTasks(tasks) {
    if (!Array.isArray(tasks)) {
      return [];
    }
    return tasks.filter((task) => !isTaskCompleted(task));
  }

  function countTaskCompletion(tasks) {
    const completion = {
      total: tasks.length,
      completed: 0,
      pending: 0,
    };

    for (const task of tasks) {
      const status = normalizeStatus(task.status);
      if (status === "completed") {
        completion.completed += 1;
      } else {
        completion.pending += 1;
      }
    }

    return completion;
  }

  function countTasksToday(tasks) {
    const today = new Date();
    let count = 0;
    let completed = 0;
    let pending = 0;

    for (const task of tasks) {
      const deadline = parseDeadline(task.deadline);
      if (!deadline) {
        continue;
      }

      if (isSameCalendarDay(deadline, today)) {
        count += 1;
        const status = normalizeStatus(task.status);
        if (status === "completed") {
          completed += 1;
        } else {
          pending += 1;
        }
      }
    }

    return { count, completed, pending };
  }

  function calculateCompletionPercent(completed, total) {
    if (!total || total <= 0) {
      return 0;
    }
    return Math.round((completed / total) * 100);
  }

  function getAtRiskGoals(goals) {
    if (!Array.isArray(goals)) {
      return [];
    }
    return goals.filter((goal) => normalizeStatus(goal.status) === "at_risk");
  }

  function getAtRiskGoalsSlice(goals, limit = 2) {
    return getAtRiskGoals(goals).slice(0, limit);
  }

  window.dashboardHelpers = {
    parseDeadline,
    isSameCalendarDay,
    normalizeStatus,
    countGoalStatuses,
    countTaskCompletion,
    countTasksToday,
    calculateCompletionPercent,
    filterActiveTasks,
    getAtRiskGoals,
    getAtRiskGoalsSlice,
  };
})(window);
