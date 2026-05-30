document.addEventListener("DOMContentLoaded", async () => {
  const tasksContainer = document.getElementById("tasks-container");
  const weeklyChartContainer = document.getElementById("weekly-completion-chart");
  if (!tasksContainer) {
    return;
  }

  tasksContainer.innerHTML = `<div class="card card-pad">Loading tasks...</div>`;
  if (weeklyChartContainer) {
    weeklyChartContainer.innerHTML = `<div class="card card-pad">Loading weekly completions...</div>`;
  }

  try {
    const [tasksResponse, summaryResponse] = await Promise.all([
      thriveUtils.fetchJson("/api/tasks"),
      thriveUtils.fetchJson("/api/progress/summary"),
    ]);

    const tasks = tasksResponse.tasks || [];
    let allTasks = tasks;
    const progressSummary = summaryResponse.summary || null;

    if (tasks.length === 0) {
      tasksContainer.innerHTML = `<div class="card card-pad"><p class="empty-state">No tasks yet. Complete a goal plan to see tasks here.</p></div>`;
    } else {
      const groupedTasks = groupTasksByGoal(allTasks);
      tasksContainer.innerHTML = Object.values(groupedTasks)
        .map((group) => createTaskGroupCard(group))
        .join("");
      taskCompletion.bindTaskCompletion(tasksContainer);
      renderXpFromTasks(allTasks);
    }

    renderWeeklyCompletions(progressSummary);

    window.addEventListener("task:completed", async (e) => {
      const taskId = Number(e?.detail?.taskId);
      if (!taskId) return;

      const idx = allTasks.findIndex((t) => Number(t.id) === taskId);
      if (idx !== -1) {
        allTasks[idx].status = "completed";
        renderXpFromTasks(allTasks);
      }

      await refreshWeeklyCompletions();
    });
  } catch (error) {
    tasksContainer.innerHTML = `<div class="card card-pad"><p class="empty-state">Unable to load tasks. ${error.message}</p></div>`;
    if (weeklyChartContainer) {
      weeklyChartContainer.innerHTML = `<div class="card card-pad"><p class="empty-state">Unable to load weekly completions.</p></div>`;
    }
    console.error("Tasks page error:", error);
  }
});

function renderWeeklyCompletions(summary) {
  const container = document.getElementById("weekly-completion-chart");
  if (!container || !window.progressChartRenderer || typeof progressChartRenderer.renderDailyCompletionChart !== "function") {
    return;
  }

  progressChartRenderer.renderDailyCompletionChart(container, summary?.currentWeekDailyCompletions);
}

async function refreshWeeklyCompletions() {
  try {
    const summaryResponse = await thriveUtils.fetchJson("/api/progress/summary");
    renderWeeklyCompletions(summaryResponse.summary || null);
  } catch (error) {
    console.error("Failed to refresh weekly completions:", error);
  }
}

function groupTasksByGoal(tasks) {
  return tasks.reduce((grouped, task) => {
    const goalKey = task.goal_title || "General";
    if (!grouped[goalKey]) {
      grouped[goalKey] = {
        goalTitle: task.goal_title || "General goal",
        goalCategory: task.goal_category || "General",
        tasks: [],
      };
    }

    grouped[goalKey].tasks.push(task);
    return grouped;
  }, {});
}

function createTaskGroupCard(group) {
  const badgeClass = thriveUtils.getCategoryBadgeClass(group.goalCategory);

  return `
    <div class="card card-pad">
      <div class="card-header">
        <span class="card-title">${escapeHtml(group.goalTitle)}</span>
        <span class="badge ${badgeClass}">${escapeHtml(group.goalCategory)}</span>
      </div>
      ${group.tasks
        .map((task) => createTaskRow(task))
        .join("")}
    </div>
  `;
}

function createTaskRow(task) {
  const isDone = String(task.status).toLowerCase() === "completed";
  const taskClass = isDone ? "done" : "";
  const statusLabel = thriveUtils.getTaskStatusLabel(task.status);
  const deadline = thriveUtils.formatDate(task.deadline);

  return `
    <div class="task-row" data-task-id="${task.id}">
      <div class="task-check ${taskClass}">
        ${taskCompletion.renderTaskCheckbox(task)}
      </div>
      <p class="task-name ${taskClass}">${escapeHtml(task.title)}</p>
      <span class="task-xp">${escapeHtml(statusLabel)} · ${deadline}</span>
    </div>
  `;
}

function renderXpFromTasks(tasks) {
  try {
    if (!window.dashboardHelpers) return;
    const xp = dashboardHelpers.computeXpFromTasks(tasks, 50);
    const xpNum = document.querySelector(".xp-num");
    const xpLabel = document.querySelector(".xp-label");
    const progressFill = document.querySelector(".progress-fill");

    if (xpNum) xpNum.textContent = String(xp.earned);
    if (xpLabel) xpLabel.textContent = `/ ${xp.available} XP earned today`;
    if (progressFill) {
      progressFill.style.width = `${xp.percent}%`;
      progressFill.dataset.w = `${xp.percent}%`;
    }
  } catch (err) {
    console.error("Failed to render XP:", err);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
