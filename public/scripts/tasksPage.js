document.addEventListener("DOMContentLoaded", async () => {
  const tasksContainer = document.getElementById("tasks-container");
  if (!tasksContainer) {
    return;
  }

  tasksContainer.innerHTML = `<div class="card card-pad">Loading tasks...</div>`;

  try {
    const response = await thriveUtils.fetchJson("/api/tasks");
    const tasks = response.tasks || [];

    if (tasks.length === 0) {
      tasksContainer.innerHTML = `<div class="card card-pad"><p class="empty-state">No tasks yet. Complete a goal plan to see tasks here.</p></div>`;
      return;
    }

    const groupedTasks = groupTasksByGoal(tasks);
    tasksContainer.innerHTML = Object.values(groupedTasks)
      .map((group) => createTaskGroupCard(group))
      .join("");

    taskCompletion.bindTaskCompletion(tasksContainer);
  } catch (error) {
    tasksContainer.innerHTML = `<div class="card card-pad"><p class="empty-state">Unable to load tasks. ${error.message}</p></div>`;
    console.error("Tasks page error:", error);
  }
});

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
