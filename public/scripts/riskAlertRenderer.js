(function (window) {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Creates the risk message text based on at-risk goals.
   * Displays up to 2 goals in the format: "Goal Title is falling behind."
   * @param {Array} atRiskGoals - Array of at-risk goal objects (up to 2)
   * @returns {string} HTML risk text content
   */
  function createRiskGoalText(atRiskGoals) {
    if (!Array.isArray(atRiskGoals) || atRiskGoals.length === 0) {
      return "";
    }

    return atRiskGoals
      .map((goal) => {
        const title = escapeHtml(goal.title || "Untitled goal");
        return `<strong>${title}</strong> is falling behind.`;
      })
      .join("<br/>");
  }

  /**
   * Updates the risk badge with the total count of at-risk goals.
   * @param {HTMLElement} badgeElement - The badge DOM element
   * @param {number} count - Total number of at-risk goals
   */
  function updateRiskBadge(badgeElement, count) {
    if (!badgeElement) {
      return;
    }

    const countStr = String(count || 0);
    const label = count === 1 ? "at risk" : "at risk";
    badgeElement.textContent = `${countStr} ${label}`;
  }

  /**
   * Renders the risk alert content, including empty state handling.
   * @param {HTMLElement} container - The container element for risk text
   * @param {Array} atRiskGoals - Array of at-risk goals (up to 2 for display)
   * @param {number} totalAtRiskCount - Total count of all at-risk goals
   */
  function renderAtRiskGoalsContent(container, atRiskGoals, totalAtRiskCount) {
    if (!container) {
      return;
    }

    // Empty state: no at-risk goals
    if (!Array.isArray(atRiskGoals) || atRiskGoals.length === 0 || totalAtRiskCount === 0) {
      container.innerHTML = `<p class="success-state">Great job — no goals are currently at risk.</p>`;
      return;
    }

    // Display at-risk goals (up to 2)
    const riskText = createRiskGoalText(atRiskGoals);
    container.innerHTML = `<p class="risk-text">${riskText}</p>`;
  }

  window.riskAlertRenderer = {
    createRiskGoalText,
    updateRiskBadge,
    renderAtRiskGoalsContent,
  };
})(window);
