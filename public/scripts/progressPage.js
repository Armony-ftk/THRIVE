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
    renderGoalMilestones(summaryResponse.summary?.goalMilestones);
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

function renderGoalMilestones(goalMilestones) {
  const listContainer = document.getElementById("goal-milestones-list");
  if (!listContainer) {
    return;
  }

  if (!Array.isArray(goalMilestones) || goalMilestones.length === 0) {
    listContainer.innerHTML = `<div class="card card-pad"><p class="empty-state">No goals available yet.</p></div>`;
    return;
  }

  listContainer.innerHTML = goalMilestones
    .map((goal) => {
      const emoji = thriveUtils.getCategoryEmoji(goal.category);
      const statusLabel = thriveUtils.getGoalStatusLabel(goal.status);
      const badgeClass = thriveUtils.getGoalBadgeClass(goal.status);
      const deadlineText = thriveUtils.formatDate(goal.deadline);
      return `
        <div class="milestone-row">
          <span class="ms-emoji">${escapeHtml(emoji)}</span>
          <div class="ms-info">
            <p>${escapeHtml(goal.title)}</p>
            <span class="ms-date">${escapeHtml(deadlineText)}</span>
          </div>
          <span class="badge ${escapeHtml(badgeClass)}">${escapeHtml(statusLabel)}</span>
        </div>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
