document.addEventListener("DOMContentLoaded", async () => {
  const goalsContainer = document.getElementById("goals-container");
  if (!goalsContainer) {
    return;
  }

  goalsContainer.innerHTML = `<div class="card card-pad">Loading goals...</div>`;

  try {
    const response = await thriveUtils.fetchJson("/api/goals");
    const goals = response.goals || [];

    if (goals.length === 0) {
      goalsContainer.innerHTML = `<div class="card card-pad"><p class="empty-state">No goals yet. Create one in Thrive AI to see it here.</p></div>`;
      return;
    }

    goalsContainer.innerHTML = goals
      .map((goal) => createGoalCard(goal))
      .join("");
  } catch (error) {
    goalsContainer.innerHTML = `<div class="card card-pad"><p class="empty-state">Unable to load goals. ${error.message}</p></div>`;
    console.error("Goals page error:", error);
  }
});

function createGoalCard(goal) {
  const title = goal.title || "Untitled goal";
  const category = goal.category || "General";
  const deadline = thriveUtils.formatDate(goal.deadline);
  const statusLabel = thriveUtils.getGoalStatusLabel(goal.status);
  const statusClass = thriveUtils.getGoalBadgeClass(goal.status);
  const emoji = thriveUtils.getCategoryEmoji(category);
  const progressPercent = Number.isFinite(Number(goal.progress_percent)) ? Number(goal.progress_percent) : 0;
  const progressLabel = goal.total_tasks ? `${progressPercent}% complete` : "No tasks yet";

  return `
    <div class="goal-card card card-pad">
      <div class="goal-card-header">
        <div class="goal-card-left">
          <span class="goal-emoji">${emoji}</span>
          <div>
            <p class="goal-card-title">${escapeHtml(title)}</p>
            <p class="goal-card-meta">${escapeHtml(category)} · Target: ${deadline}</p>
          </div>
        </div>
        <span class="badge ${statusClass}">${statusLabel}</span>
      </div>
      <div class="goal-card-body">
        <div class="goal-card-stats">
          <span>Deadline: ${deadline}</span>
          <span>Status: ${statusLabel}</span>
          <span>${progressLabel}</span>
        </div>
        <div class="goal-card-progress">
          <div class="progress-track">
            <div class="progress-fill fill-violet" style="width:${progressPercent}%"></div>
          </div>
        </div>
      </div>
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
