document.addEventListener("DOMContentLoaded", async () => {
  const progressContainer = document.getElementById("goal-progress-breakdown");
  if (!progressContainer) {
    return;
  }

  progressContainer.innerHTML = `<div class="card card-pad">Loading goal progress...</div>`;

  try {
    const [goalsResponse, summaryResponse] = await Promise.all([
      thriveUtils.fetchJson("/api/goals"),
      thriveUtils.fetchJson("/api/progress/summary"),
    ]);

    const goals = goalsResponse.goals || [];
    goalProgressRenderer.renderGoalProgressRows(progressContainer, goals);
    renderProgressSummary(summaryResponse.summary);

    const weeklyChartContainer = document.getElementById("weekly-completion-chart");
    if (weeklyChartContainer) {
      progressChartRenderer.renderWeeklyCompletionChart(weeklyChartContainer, summaryResponse.summary?.weeklyCompletion);
    }
    const streakDaysContainer = document.getElementById("streak-days");
    const streakCountElement = document.getElementById("streak-current-count");
    const streakLabelElement = document.getElementById("streak-current-label");
    progressStreakRenderer.renderStreakDays(streakDaysContainer, summaryResponse.summary?.dailyActivity);
    progressStreakRenderer.renderCurrentStreak(streakCountElement, streakLabelElement, summaryResponse.summary?.currentStreakDays);
  } catch (error) {
    const message = `Unable to load progress data. ${error.message}`;
    progressContainer.innerHTML = `<div class="card card-pad"><p class="empty-state">${message}</p></div>`;
    console.error("Progress page error:", error);
  }
});

function renderProgressSummary(summary) {
  const avgDaily = document.getElementById("summary-avg-daily");
  const tasksMonth = document.getElementById("summary-tasks-month");
  const currentStreak = document.getElementById("summary-current-streak");
  const bestStreak = document.getElementById("summary-best-streak");

  if (!summary) {
    return;
  }

  if (avgDaily) {
    avgDaily.textContent = Number.isFinite(summary.avgDailyCompletedTasks)
      ? summary.avgDailyCompletedTasks.toFixed(1)
      : "0.0";
  }

  if (tasksMonth) {
    tasksMonth.textContent = String(summary.tasksCompletedThisMonth || 0);
  }

  if (currentStreak) {
    currentStreak.textContent = String(summary.currentStreakDays || 0);
  }

  if (bestStreak) {
    bestStreak.textContent = String(summary.bestStreakDays || 0);
  }
}
