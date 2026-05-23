document.addEventListener("DOMContentLoaded", async () => {
  const goalsPreview = document.getElementById("dashboard-goals-preview");
  const tasksPreview = document.getElementById("dashboard-tasks-preview");
  if (!goalsPreview || !tasksPreview) {
    return;
  }

  goalsPreview.innerHTML = `<div class="card card-pad">Loading goal previews...</div>`;
  tasksPreview.innerHTML = `<div class="card card-pad">Loading task previews...</div>`;

  try {
    const [goalsResponse, tasksResponse] = await Promise.all([
      thriveUtils.fetchJson("/api/goals"),
      thriveUtils.fetchJson("/api/tasks"),
    ]);

    renderGoalsPreview(goalsPreview, goalsResponse.goals || []);
    renderTasksPreview(tasksPreview, tasksResponse.tasks || []);
  } catch (error) {
    const message = `Unable to load dashboard preview. ${error.message}`;
    goalsPreview.innerHTML = `<div class="card card-pad"><p class="empty-state">${message}</p></div>`;
    tasksPreview.innerHTML = `<div class="card card-pad"><p class="empty-state">${message}</p></div>`;
    console.error("Dashboard page error:", error);
  }
});

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
    <div class="task-row">
      <div class="task-check ${isDone ? "done" : ""}">
        ${isDone ? `<svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ""}
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
