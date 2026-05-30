(function (window) {
  function getBarBackground(highlight) {
    return highlight ? "linear-gradient(0deg,#2bbfa4,#34d399)" : "linear-gradient(0deg,#7c6aee,#a78bfa)";
  }

  function createWeeklyCompletionBar(weekData) {
    const activeClass = weekData.isCurrentWeek ? " active" : "";
    const label = String(weekData.weekLabel || "");
    const count = Number.isFinite(weekData.count) ? weekData.count : 0;
    const percent = Number.isFinite(weekData.percentage) ? weekData.percentage : 0;
    const range = String(weekData.rangeLabel || "");

    return `
      <div class="chart-bar${activeClass}" title="${range}: ${count} completed (${percent}%)">
        <div class="cb-fill">
          <div class="cb-fill-inner" style="position:absolute;bottom:0;left:0;right:0;height:${percent}%;background:${getBarBackground(weekData.isCurrentWeek)};border-radius:inherit;opacity:.85;"></div>
        </div>
        <span>${label}</span>
        <span class="chart-bar-note">${count} done</span>
      </div>
    `;
  }

  function createDailyCompletionBar(dayData) {
    const activeClass = dayData.isToday ? " active" : "";
    const label = String(dayData.dayLabel || "");
    const count = Number.isFinite(dayData.count) ? dayData.count : 0;
    const percent = Number.isFinite(dayData.percentage) ? dayData.percentage : 0;
    const target = Number.isFinite(dayData.target) ? dayData.target : 5;

    return `
      <div class="chart-bar${activeClass}" title="${dayData.date}: ${count}/${target} completed">
        <div class="cb-fill">
          <div class="cb-fill-inner" style="position:absolute;bottom:0;left:0;right:0;height:${percent}%;background:${getBarBackground(dayData.isToday)};border-radius:inherit;opacity:.85;"></div>
        </div>
        <span>${label}</span>
        <span class="chart-bar-note">${count}/${target}</span>
      </div>
    `;
  }

  function renderDailyCompletionChart(container, dailySeries) {
    if (!container) {
      return;
    }

    if (!Array.isArray(dailySeries) || dailySeries.length === 0) {
      container.innerHTML = `<div class="card card-pad"><p class="empty-state">No weekly completion history yet.</p></div>`;
      return;
    }

    container.innerHTML = dailySeries.map(createDailyCompletionBar).join("");
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
    renderDailyCompletionChart,
  };
})(window);
