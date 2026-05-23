(function (window) {
  const categoryMap = {
    "spanish": { emoji: "🇪🇸", badge: "badge-violet" },
    "development": { emoji: "💻", badge: "badge-teal" },
    "fitness": { emoji: "🏃", badge: "badge-coral" },
    "learning": { emoji: "📚", badge: "badge-violet" },
  };

  const statusMap = {
    pending: { label: "Pending", badge: "badge-coral" },
    completed: { label: "Completed", badge: "badge-teal" },
    in_progress: { label: "In Progress", badge: "badge-violet" },
    on_track: { label: "On Track", badge: "badge-teal" },
    at_risk: { label: "At Risk", badge: "badge-coral" },
  };

  function fetchJson(url, options = {}) {
    return fetch(url, { credentials: "include", ...options }).then(async (response) => {
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Unable to load data");
      }
      return json;
    });
  }

  function formatDate(value) {
    if (!value) {
      return "No deadline";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Invalid date";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, "_");
  }

  function getGoalStatusLabel(status) {
    const normalized = normalizeText(status);
    return statusMap[normalized]?.label || "Pending";
  }

  function getGoalBadgeClass(status) {
    const normalized = normalizeText(status);
    return statusMap[normalized]?.badge || "badge-coral";
  }

  function getTaskStatusLabel(status) {
    const normalized = normalizeText(status);
    return statusMap[normalized]?.label || "Pending";
  }

  function getTaskBadgeClass(status) {
    const normalized = normalizeText(status);
    return statusMap[normalized]?.badge || "badge-coral";
  }

  function getCategoryEmoji(category) {
    const normalized = normalizeText(category);
    return categoryMap[normalized]?.emoji || "🎯";
  }

  function getCategoryBadgeClass(category) {
    const normalized = normalizeText(category);
    return categoryMap[normalized]?.badge || "badge-violet";
  }

  window.thriveUtils = {
    fetchJson,
    formatDate,
    getGoalStatusLabel,
    getGoalBadgeClass,
    getTaskStatusLabel,
    getTaskBadgeClass,
    getCategoryEmoji,
    getCategoryBadgeClass,
  };
})(window);
