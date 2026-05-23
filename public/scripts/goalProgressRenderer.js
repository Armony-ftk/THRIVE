(function (window) {
  function normalizeProgressValue(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
      return 0;
    }
    return Math.min(Math.max(Math.round(numeric), 0), 100);
  }

  function getGoalProgressFillClass(category) {
    const normalized = String(category || "").trim().toLowerCase();
    switch (normalized) {
      case "development":
        return "fill-teal";
      case "fitness":
        return "fill-coral";
      case "spanish":
      case "learning":
      default:
        return "fill-violet";
    }
  }

  function createGoalProgressRow(goal) {
    const title = String(goal.title || "Untitled goal");
    const progressPercent = normalizeProgressValue(goal.progress_percent);
    const fillClass = getGoalProgressFillClass(goal.category);

    return `
      <div class="goal-row">
        <div class="goal-info">
          <span>${escapeHtml(title)}</span>
          <span class="pct">${progressPercent}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${fillClass}" style="width:0" data-w="${progressPercent}%"></div>
        </div>
      </div>
    `;
  }

  function renderGoalProgressRows(container, goals) {
    if (!container) {
      return;
    }

    if (!Array.isArray(goals) || goals.length === 0) {
      container.innerHTML = `<div class="card card-pad"><p class="empty-state">No goals yet. Add a goal to see your progress here.</p></div>`;
      return;
    }

    container.innerHTML = goals.map((goal) => createGoalProgressRow(goal)).join("");
    animateProgressFill(container);
  }

  function animateProgressFill(container) {
    if (!container) {
      return;
    }

    container.querySelectorAll(".progress-fill[data-w]").forEach((fill) => {
      fill.style.width = fill.dataset.w;
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  window.goalProgressRenderer = {
    renderGoalProgressRows,
    createGoalProgressRow,
    animateProgressFill,
  };
})(window);
