document.addEventListener("DOMContentLoaded", async () => {
  const goalsPreview = document.getElementById("dashboard-goals-preview");
  const tasksPreview = document.getElementById("dashboard-tasks-preview");
  const activeGoalsValue = document.getElementById("dashboard-active-goals");
  const activeGoalsSub = document.getElementById("dashboard-active-goals-sub");
  const tasksTodayValue = document.getElementById("dashboard-tasks-today");
  const tasksTodaySub = document.getElementById("dashboard-tasks-today-sub");
  const overallProgressValue = document.getElementById("dashboard-overall-progress");
  const overallProgressSub = document.getElementById("dashboard-overall-progress-sub");

  if (
    !goalsPreview ||
    !tasksPreview ||
    !activeGoalsValue ||
    !activeGoalsSub ||
    !tasksTodayValue ||
    !tasksTodaySub ||
    !overallProgressValue ||
    !overallProgressSub
  ) {
    return;
  }

  setDashboardLoading();
  goalsPreview.innerHTML = `<div class="card card-pad">Loading goal previews...</div>`;
  tasksPreview.innerHTML = `<div class="card card-pad">Loading task previews...</div>`;

  try {
    const [goalsResponse, tasksResponse] = await Promise.all([
      thriveUtils.fetchJson("/api/goals"),
      thriveUtils.fetchJson("/api/tasks"),
    ]);

    const goals = goalsResponse.goals || [];
    const tasks = tasksResponse.tasks || [];

    renderDashboardSummary(goals, tasks);
    renderGoalsPreview(goalsPreview, goals);
    renderTasksPreview(tasksPreview, tasks);
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
  container.innerHTML = latestGoals.map((goal) => createDashboardGoalRow(goal)).join("");
}

function renderTasksPreview(container, tasks) {
  if (!tasks.length) {
    container.innerHTML = `<div class="card card-pad"><p class="empty-state">No tasks yet. Complete a goal plan to see tasks here.</p></div>`;
    return;
  }

  const latestTasks = tasks.slice(0, 3);
  container.innerHTML = latestTasks.map((task) => createDashboardTaskRow(task)).join("");
  taskCompletion.bindTaskCompletion(container);
}

function createDashboardGoalRow(goal) {
  const title = goal.title || "Untitled goal";
  const deadline = thriveUtils.formatDate(goal.deadline);
  const statusLabel = thriveUtils.getGoalStatusLabel(goal.status);
  const statusClass = thriveUtils.getGoalBadgeClass(goal.status);

  return `
    <div class="goal-row">
      <div class="goal-info">
        <span>${escapeHtml(title)}</span>
        <span class="pct">${escapeHtml(statusLabel)}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill fill-violet" style="width:0" data-w="0"></div>
      </div>
      <div class="task-name">Due ${escapeHtml(deadline)}</div>
      <span class="badge ${statusClass}">${statusLabel}</span>
    </div>
  `;
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
