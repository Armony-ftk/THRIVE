document.addEventListener("DOMContentLoaded", async () => {
  const goalsPreview = document.getElementById("dashboard-goals-preview");
  const tasksPreview = document.getElementById("dashboard-tasks-preview");
  const activeGoalsValue = document.getElementById("dashboard-active-goals");
  const activeGoalsSub = document.getElementById("dashboard-active-goals-sub");
  const tasksTodayValue = document.getElementById("dashboard-tasks-today");
  const tasksTodaySub = document.getElementById("dashboard-tasks-today-sub");
  const overallProgressValue = document.getElementById("dashboard-overall-progress");
  const overallProgressSub = document.getElementById("dashboard-overall-progress-sub");
  const riskBadge = document.getElementById("dashboard-risk-badge");
  const riskContent = document.getElementById("dashboard-risk-content");

  if (
    !goalsPreview ||
    !tasksPreview ||
    !activeGoalsValue ||
    !activeGoalsSub ||
    !tasksTodayValue ||
    !tasksTodaySub ||
    !overallProgressValue ||
    !overallProgressSub ||
    !riskBadge ||
    !riskContent
  ) {
    return;
  }

  setDashboardLoading();
  goalsPreview.innerHTML = `<div class="card card-pad">Loading goal previews...</div>`;
  tasksPreview.innerHTML = `<div class="card card-pad">Loading task previews...</div>`;

  try {
    const [goalsResponse, tasksResponse, summaryResponse] = await Promise.all([
      thriveUtils.fetchJson("/api/goals"),
      thriveUtils.fetchJson("/api/tasks?statuses=pending,in_progress,completed"),
      thriveUtils.fetchJson("/api/progress/summary"),
    ]);

    const goals = goalsResponse.goals || [];
    const tasks = tasksResponse.tasks || [];
    const progressSummary = summaryResponse.summary || null;

    renderDashboardSummary(goals, tasks);
    renderGoalsPreview(goalsPreview, goals);
    renderTasksPreview(tasksPreview, tasks);
    // Render risk alert using the shared risk alert renderer
    try {
      renderRiskAlert(riskBadge, riskContent, goals);
    } catch (err) {
      // Non-blocking: dashboard should still load if risk alert rendering fails
      console.error("Failed to render dashboard risk alert:", err);
    }
    // Render streak using the shared streak renderer (reuses progress implementation)
    try {
      const streakDaysContainer = document.getElementById("streak-days");
      const streakCountElement = document.getElementById("streak-current-count");
      const streakLabelElement = document.getElementById("streak-current-label");
      progressStreakRenderer.renderStreakDays(streakDaysContainer, progressSummary?.dailyActivity);
      progressStreakRenderer.renderCurrentStreak(streakCountElement, streakLabelElement, progressSummary?.currentStreakDays);
    } catch (err) {
      // Non-blocking: dashboard should still load if streak rendering fails
      console.error("Failed to render dashboard streak:", err);
    }
  } catch (error) {
    const message = `Unable to load dashboard preview. ${error.message}`;
    goalsPreview.innerHTML = `<div class="card card-pad"><p class="empty-state">${message}</p></div>`;
    tasksPreview.innerHTML = `<div class="card card-pad"><p class="empty-state">${message}</p></div>`;
    activeGoalsValue.textContent = "—";
    activeGoalsSub.textContent = "Unable to load goal stats";
    tasksTodayValue.textContent = "—";
    tasksTodaySub.textContent = "Unable to load tasks";
    overallProgressValue.textContent = "—";
    overallProgressSub.textContent = "Unable to load progress";
    console.error("Dashboard page error:", error);
  }
});

function setDashboardLoading() {
  document.getElementById("dashboard-active-goals").textContent = "...";
  document.getElementById("dashboard-active-goals-sub").textContent = "Loading goal status…";
  document.getElementById("dashboard-tasks-today").textContent = "...";
  document.getElementById("dashboard-tasks-today-sub").textContent = "Loading task totals…";
  document.getElementById("dashboard-overall-progress").textContent = "...";
  document.getElementById("dashboard-overall-progress-sub").textContent = "Loading progress…";
  const riskBadge = document.getElementById("dashboard-risk-badge");
  if (riskBadge) {
    riskBadge.textContent = "Loading…";
  }
}

function renderDashboardSummary(goals, tasks) {
  // Use the helper module to keep dashboard calculations separate and reusable.
  const goalSummary = dashboardHelpers.countGoalStatuses(goals);
  const taskSummary = dashboardHelpers.countTaskCompletion(tasks);
  const todaySummary = dashboardHelpers.countTasksToday(tasks);
  const completionPercent = dashboardHelpers.calculateCompletionPercent(taskSummary.completed, taskSummary.total);

  document.getElementById("dashboard-active-goals").textContent = String(goalSummary.activeGoals);
  document.getElementById("dashboard-active-goals-sub").textContent = `${goalSummary.onTrackGoals} on track · ${goalSummary.atRiskGoals} at risk`;

  document.getElementById("dashboard-tasks-today").textContent = String(todaySummary.count);
  document.getElementById("dashboard-tasks-today-sub").textContent = `${todaySummary.completed} completed · ${todaySummary.pending} pending`;

  document.getElementById("dashboard-overall-progress").textContent = `${completionPercent}%`;
  document.getElementById("dashboard-overall-progress-sub").textContent = taskSummary.total
    ? `${taskSummary.completed} completed · ${taskSummary.pending} pending`
    : "No tasks yet";
}

function renderGoalsPreview(container, goals) {
  if (!goals.length) {
    container.innerHTML = `<div class="card card-pad"><p class="empty-state">No goals yet. Add a goal to see it here.</p></div>`;
    return;
  }

  const latestGoals = goals.slice(0, 2);
  goalProgressRenderer.renderGoalProgressRows(container, latestGoals);
}

function renderTasksPreview(container, tasks) {
  const activeTasks = dashboardHelpers.filterActiveTasks(tasks);

  if (!activeTasks.length) {
    container.innerHTML = `<div class="card card-pad"><p class="empty-state">No active tasks yet. Complete a goal plan to see tasks here.</p></div>`;
    return;
  }

  const latestTasks = activeTasks.slice(0, 3);
  container.innerHTML = latestTasks.map((task) => createDashboardTaskRow(task)).join("");
  taskCompletion.bindTaskCompletion(container);
}

function createDashboardTaskRow(task) {
  const isDone = String(task.status).toLowerCase() === "completed";
  const statusLabel = thriveUtils.getTaskStatusLabel(task.status);
  const deadline = thriveUtils.formatDate(task.deadline);
  const badgeClass = thriveUtils.getCategoryBadgeClass(task.goal_category);

  return `
    <div class="task-row" data-task-id="${task.id}">
      <div class="task-check ${isDone ? "done" : ""}">
        ${taskCompletion.renderTaskCheckbox(task)}
      </div>
      <p class="task-name ${isDone ? "done" : ""}">${escapeHtml(task.title)}</p>
      <span class="task-xp">${escapeHtml(task.goal_title)} · ${escapeHtml(deadline)}</span>
      <span class="badge ${badgeClass}">${escapeHtml(statusLabel)}</span>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderRiskAlert(badgeElement, contentElement, goals) {
  // Get the total count of at-risk goals
  const allAtRiskGoals = dashboardHelpers.getAtRiskGoals(goals);
  const totalAtRiskCount = allAtRiskGoals.length;

  // Get the first 2 at-risk goals for display
  const displayedAtRiskGoals = dashboardHelpers.getAtRiskGoalsSlice(goals, 2);

  // Update the badge with the total count
  riskAlertRenderer.updateRiskBadge(badgeElement, totalAtRiskCount);

  // Render the content (empty state or at-risk goals)
  riskAlertRenderer.renderAtRiskGoalsContent(contentElement, displayedAtRiskGoals, totalAtRiskCount);
}
