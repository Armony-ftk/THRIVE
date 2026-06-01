(function (window) {
  function createStreakDayHtml(day) {
    const activeClass = day.active ? " on" : "";
    const todayClass = day.isToday ? " today" : "";
    return `
      <div class="streak-day${todayClass}">
        <div class="streak-dot${activeClass}" title="${day.date}: ${day.active ? "completed" : "no completion"}"></div>
        <span>${day.dayLabel}</span>
      </div>
    `;
  }

  function renderStreakDays(container, dailyActivity) {
    if (!container) {
      return;
    }

    if (!Array.isArray(dailyActivity) || dailyActivity.length === 0) {
      container.innerHTML = `<p class="empty-state">No streak activity yet.</p>`;
      return;
    }

    container.innerHTML = dailyActivity.map(createStreakDayHtml).join("");
  }

  function renderCurrentStreak(countElement, labelElement, currentStreakDays) {
    if (countElement) {
      countElement.textContent = String(currentStreakDays || 0);
    }

    if (!labelElement) {
      return;
    }

    if (currentStreakDays > 0) {
      labelElement.textContent = `${currentStreakDays} day${currentStreakDays === 1 ? "" : "s"} in a row 🔥`;
    } else {
      labelElement.textContent = "No streak yet";
    }
  }

  window.progressStreakRenderer = {
    renderStreakDays,
    renderCurrentStreak,
  };
})(window);
