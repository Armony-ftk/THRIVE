(function (window) {
  function getBarBackground(isCurrentWeek) {
    return isCurrentWeek ? "linear-gradient(0deg,#7c6aee,#a78bfa)" : "var(--violet)";
  }

  function createWeeklyCompletionBar(weekData) {
    const activeClass = weekData.isCurrentWeek ? " active" : "";
    const label = String(weekData.weekLabel || "");
    const count = Number.isFinite(weekData.count) ? weekData.count : 0;
    const percent = Number.isFinite(weekData.percentage) ? weekData.percentage : 0;
    const range = String(weekData.rangeLabel || "");

    return `
      <div class="chart-bar${activeClass}" title="${range}: ${count} completed (${percent}%)">
        <div class="cb-fill" style="--h:${percent}%;background:${getBarBackground(weekData.isCurrentWeek)}"></div>
        <span>${label}</span>
        <span class="chart-bar-note">${count} done</span>
      </div>
    `;
  }

  function renderWeeklyCompletionChart(container, weeklySeries) {
    if (!container) {
      return;
    }

    if (!Array.isArray(weeklySeries) || weeklySeries.length === 0) {
      container.innerHTML = `<div class="card card-pad"><p class="empty-state">No weekly completion history yet.</p></div>`;
      return;
    }

    container.innerHTML = weeklySeries.map(createWeeklyCompletionBar).join("");
  }

  window.progressChartRenderer = {
    renderWeeklyCompletionChart,
  };
})(window);
