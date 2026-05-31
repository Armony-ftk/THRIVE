let currentGoals = [];
let deleteMode = false;
let selectedGoalId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const goalsContainer = document.getElementById("goals-container");
  const newGoalButton = document.getElementById("new-goal-button");
  const deleteGoalButton = document.getElementById("delete-goal-button");
  const actionInfo = document.getElementById("goal-action-info");

  function setActionMessage(message = "", type = "info") {
    if (!actionInfo) {
      return;
    }

    if (!message) {
      actionInfo.style.display = "none";
      actionInfo.textContent = "";
      return;
    }

    actionInfo.style.display = "block";
    actionInfo.textContent = message;
    actionInfo.style.marginBottom = "16px";
    actionInfo.style.padding = "10px 0";
    actionInfo.style.borderLeft = "3px solid transparent";

    if (type === "success") {
      actionInfo.style.color = "var(--teal)";
      actionInfo.style.background = "rgba(43,191,164,0.08)";
      actionInfo.style.borderLeft = "3px solid var(--teal)";
    } else if (type === "error") {
      actionInfo.style.color = "var(--coral)";
      actionInfo.style.background = "rgba(248,113,113,0.08)";
      actionInfo.style.borderLeft = "3px solid var(--coral)";
    } else if (type === "warning") {
      actionInfo.style.color = "var(--coral)";
      actionInfo.style.background = "rgba(248,113,113,0.08)";
      actionInfo.style.borderLeft = "3px solid var(--coral)";
    } else {
      actionInfo.style.color = "var(--text-2)";
      actionInfo.style.background = "transparent";
    }
  }

  function updateDeleteModeState() {
    if (!goalsContainer) {
      return;
    }

    goalsContainer.innerHTML = currentGoals.length === 0
      ? `<div class="card card-pad"><p class="empty-state">No goals yet. Create one in Thrive AI to see it here.</p></div>`
      : currentGoals.map((goal) => createGoalCard(goal)).join("");
  }

  async function loadGoals() {
    if (!goalsContainer) {
      return;
    }

    goalsContainer.innerHTML = `<div class="card card-pad">Loading goals...</div>`;

    try {
      const response = await thriveUtils.fetchJson("/api/goals");
      currentGoals = response.goals || [];

      if (currentGoals.length === 0) {
        goalsContainer.innerHTML = `<div class="card card-pad"><p class="empty-state">No goals yet. Create one in Thrive AI to see it here.</p></div>`;
      } else {
        updateDeleteModeState();
      }

      renderGoalStatistics(currentGoals);
    } catch (error) {
      goalsContainer.innerHTML = `<div class="card card-pad"><p class="empty-state">Unable to load goals. ${escapeHtml(error.message)}</p></div>`;
      console.error("Goals page error:", error);
      setActionMessage("Unable to load goals right now. Please try again later.", "error");
    }
  }

  function resetDeleteMode() {
    deleteMode = false;
    selectedGoalId = null;
    updateDeleteModeState();
  }

  async function handleDeleteButtonClick() {
    if (!deleteMode) {
      deleteMode = true;
      selectedGoalId = null;
      updateDeleteModeState();
      setActionMessage("Delete mode active — select one goal, then click Remove Goal again to confirm.", "warning");
      return;
    }

    if (!selectedGoalId) {
      setActionMessage("Select a goal to remove before confirming.", "warning");
      return;
    }

    const confirmed = window.confirm(
      "Delete this goal and all associated tasks? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      await thriveUtils.fetchJson(`/api/goals/${selectedGoalId}`, {
        method: "DELETE",
      });

      setActionMessage("Goal removed successfully.", "success");
      resetDeleteMode();
      await loadGoals();
    } catch (error) {
      console.error("Goal deletion failed:", error);
      resetDeleteMode();
      await loadGoals();
      setActionMessage(`Unable to remove goal. ${escapeHtml(error.message)}`, "error");
    }
  }

  function handleGoalSelect(event) {
    if (!deleteMode || !goalsContainer) {
      return;
    }

    const card = event.target.closest(".goal-card");
    if (!card || !card.dataset.goalId) {
      return;
    }

    selectedGoalId = String(card.dataset.goalId);
    updateDeleteModeState();
    setActionMessage("Delete mode active — click Remove Goal again to confirm deletion.", "warning");
  }

  if (newGoalButton) {
    newGoalButton.addEventListener("click", () => {
      window.location.href = "thriveAI.html";
    });
  }

  if (deleteGoalButton) {
    deleteGoalButton.addEventListener("click", handleDeleteButtonClick);
  }

  if (goalsContainer) {
    goalsContainer.addEventListener("click", handleGoalSelect);
  }

  await loadGoals();
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
  const isSelected = deleteMode && String(goal.id) === selectedGoalId;
  const selectedCardClass = isSelected ? " selected-goal-card" : "";

  const selectionMarkup = deleteMode
    ? `
      <label class="goal-card-select">
        <input
          type="radio"
          name="selectedGoal"
          value="${goal.id}"
          ${isSelected ? "checked" : ""}
          aria-label="Select goal to delete"
        />
        <span>Select</span>
      </label>
    `
    : "";

  return `
    <div class="goal-card card card-pad${selectedCardClass}" data-goal-id="${goal.id}">
      <div class="goal-card-header">
        <div class="goal-card-left">
          ${selectionMarkup}
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

function renderGoalStatistics(goals) {
  const stats = dashboardHelpers.countGoalStatuses(goals);
  const categoryCount = dashboardHelpers.countUniqueCategories(goals);

  const totalCount = document.getElementById("goal-total-count");
  const categoryLabel = document.getElementById("goal-total-categories");
  const onTrackCount = document.getElementById("goal-on-track-count");
  const atRiskCount = document.getElementById("goal-at-risk-count");

  if (totalCount) {
    totalCount.textContent = String(goals.length);
  }

  if (categoryLabel) {
    categoryLabel.textContent = `Across ${categoryCount} categories`;
  }

  if (onTrackCount) {
    onTrackCount.textContent = String(stats.onTrackGoals);
  }

  if (atRiskCount) {
    atRiskCount.textContent = String(stats.atRiskGoals);
  }
}
