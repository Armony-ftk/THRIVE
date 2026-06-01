(function (window) {
  const categoryMap = {
    // "spanish": { emoji: "🇪🇸", badge: "badge-violet" },
    // "development": { emoji: "💻", badge: "badge-teal" },
    // "fitness": { emoji: "🏃", badge: "badge-coral" },
    // "learning": { emoji: "📚", badge: "badge-violet" },
    education: {
      emoji: "📚",
      badge: "badge-violet",
    },

    fitness: {
      emoji: "🏃🏽‍♂️",
      badge: "badge-coral",
    },

    career: {
      emoji: "💼",
      badge: "badge-teal",
    },

    finance: {
      emoji: "💰",
      badge: "badge-coral",
    },

    productivity: {
      emoji: "⚡",
      badge: "badge-violet",
    },

    health: {
      emoji: "❤️",
      badge: "badge-coral",
    },

    business: {
      emoji: "📈",
      badge: "badge-teal",
    },

    personal_development: {
      emoji: "🧍🏽‍♂️",
      badge: "badge-violet",
    },

    relationships: {
      emoji: "🫱🏼‍🫲🏽",
      badge: "badge-teal",
    },

    spirituality: {
      emoji: "🙏🏽",
      badge: "badge-violet",
    },

    technology: {
      emoji: "💻",
      badge: "badge-teal",
    },

    other: {
      emoji: "🎯",
      badge: "badge-violet",
    },
  };

  const statusMap = {
    // pending: { label: "Pending", badge: "badge-violet" },
    // completed: { label: "Completed", badge: "badge-teal" },
    // in_progress: { label: "In Progress", badge: "badge-violet" },
    // on_track: { label: "On Track", badge: "badge-teal" },
    // at_risk: { label: "At Risk", badge: "badge-coral" },
    pending: {
      label: "Pending",
      badge: "badge-violet",
    },

    active: {
      label: "Active",
      badge: "badge-teal",
    },

    in_progress: {
      label: "In Progress",
      badge: "badge-violet",
    },

    completed: {
      label: "Completed",
      badge: "badge-teal",
    },

    at_risk: {
      label: "At Risk",
      badge: "badge-coral",
    },

    overdue: {
      label: "Overdue",
      badge: "badge-coral",
    },

    cancelled: {
      label: "Cancelled",
      badge: "badge-coral",
    },
  };

  function fetchJson(url, options = {}) {
    return fetch(url, { credentials: "include", ...options }).then(
      async (response) => {
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error || "Unable to load data");
        }
        return json;
      },
    );
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
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
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

  /**
   * Format date as "Wednesday, 22 Apr 2026"
   * @param {Date|null} date - Optional date object. If null, uses current date.
   * @returns {string} Formatted date string
   */
  function formatDateChip(date = null) {
    const d = date || new Date();
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) {
      return "Invalid date";
    }
    
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  }

  /**
   * Format date as "Apr 20, 2026"
   * @param {Date|null} date - Optional date object. If null, uses current date.
   * @returns {string} Formatted date string
   */
  function formatDateShort(date = null) {
    const d = date || new Date();
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) {
      return "Invalid date";
    }
    
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  }

  /**
   * Format date as "Monday, 20 April 2026"
   * @param {Date|null} date - Optional date object. If null, uses current date.
   * @returns {string} Formatted date string
   */
  function formatDateLong(date = null) {
    const d = date || new Date();
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) {
      return "Invalid date";
    }
    
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  }

  /**
   * Format date/time as relative time (e.g., "2h ago", "1d ago")
   * @param {Date|string|number} date - Date to format
   * @returns {string} Relative time string
   */
  function formatTimeAgo(date) {
    let d;
    if (typeof date === "string") {
      d = new Date(date);
    } else if (typeof date === "number") {
      d = new Date(date);
    } else {
      d = date;
    }

    if (!(d instanceof Date) || Number.isNaN(d.getTime())) {
      return "Invalid date";
    }

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "just now";
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return formatDateShort(d);
    }
  }

  /**
   * Get current date formatted as "Wednesday, 22 Apr 2026"
   * @returns {string} Formatted current date
   */
  function getCurrentDateChip() {
    return formatDateChip();
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
    formatDateChip,
    formatDateShort,
    formatDateLong,
    formatTimeAgo,
    getCurrentDateChip,
  };
})(window);
