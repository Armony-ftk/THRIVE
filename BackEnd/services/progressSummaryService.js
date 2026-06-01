const { poolPromise, sql } = require("../database/connection");
const { createApiError } = require("../utils/apiErrorHandler");

const AVERAGE_WINDOW_DAYS = 30;
const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_TASKS_PER_DAY = 5;

function normalizeUserId(value) {
  const userId = Number(value);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

function getTodayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addDays(date, offset) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + offset));
}

function getStartOfWeek(date) {
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addDays(date, mondayOffset);
}

function getWeekDays(referenceDate) {
  const startOfWeek = getStartOfWeek(referenceDate);
  return Array.from({ length: 7 }, (_, index) => addDays(startOfWeek, index));
}

function isValidIsoDateString(value) {
  return typeof value === "string" && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value);
}

function parseDateOnlyString(value) {
  if (!isValidIsoDateString(value)) {
    return null;
  }
  return new Date(`${value}T00:00:00Z`);
}

function formatDateOnlyUtc(date) {
  return date.toISOString().slice(0, 10);
}

function calculateTasksCompletedThisMonth(completionDates, referenceDate) {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();

  return completionDates.reduce((count, dateString) => {
    const date = parseDateOnlyString(dateString);
    if (!date) {
      return count;
    }

    return date.getUTCFullYear() === year && date.getUTCMonth() === month ? count + 1 : count;
  }, 0);
}

function calculateAverageDailyCompletedTasks(completionDates, referenceDate) {
  const windowStart = addDays(referenceDate, -AVERAGE_WINDOW_DAYS + 1);
  const completedCount = completionDates.reduce((count, dateString) => {
    const date = parseDateOnlyString(dateString);
    if (!date) {
      return count;
    }
    return date >= windowStart && date <= referenceDate ? count + 1 : count;
  }, 0);

  if (completedCount === 0) {
    return 0;
  }

  return Number((completedCount / AVERAGE_WINDOW_DAYS).toFixed(1));
}

function calculateCurrentWeekDailyCompletions(completionDates, referenceDate, maxTasksPerDay = MAX_TASKS_PER_DAY) {
  const weekDays = getWeekDays(referenceDate);
  const countsByDate = weekDays.reduce((map, date) => {
    map[formatDateOnlyUtc(date)] = 0;
    return map;
  }, {});

  for (const dateString of completionDates) {
    const date = parseDateOnlyString(dateString);
    if (!date) {
      continue;
    }

    const key = formatDateOnlyUtc(date);
    if (key in countsByDate) {
      countsByDate[key] += 1;
    }
  }

  return weekDays.map((date) => {
    const dateKey = formatDateOnlyUtc(date);
    const count = countsByDate[dateKey] || 0;
    const normalizedCount = Math.min(count, maxTasksPerDay);
    return {
      date: dateKey,
      dayLabel: getDayLetter(date),
      count,
      target: maxTasksPerDay,
      percentage: maxTasksPerDay > 0 ? Math.round((normalizedCount / maxTasksPerDay) * 100) : 0,
      isToday: dateKey === formatDateOnlyUtc(referenceDate),
    };
  });
}

function getWeeklyRanges(referenceDate, weeks = 4) {
  return Array.from({ length: weeks }, (_, index) => {
    const start = addDays(referenceDate, -7 * (weeks - index) + 1);
    const end = addDays(referenceDate, -7 * (weeks - index - 1));
    return {
      weekLabel: `W${index + 1}`,
      start,
      end,
      isCurrentWeek: index === weeks - 1,
    };
  });
}

function calculateWeeklyCompletionSeries(completionDates, referenceDate, weeks = 4) {
  const ranges = getWeeklyRanges(referenceDate, weeks);
  const counts = ranges.map(() => 0);

  for (const dateString of completionDates) {
    const date = parseDateOnlyString(dateString);
    if (!date) {
      continue;
    }

    for (let index = 0; index < ranges.length; index++) {
      const range = ranges[index];
      if (date >= range.start && date <= range.end) {
        counts[index] += 1;
        break;
      }
    }
  }

  const maxCount = counts.length === 0 ? 0 : Math.max(...counts);

  return ranges.map((range, index) => ({
    weekLabel: range.weekLabel,
    count: counts[index],
    percentage: maxCount > 0 ? Math.round((counts[index] / maxCount) * 100) : 0,
    rangeLabel: `${formatDateOnlyUtc(range.start)} — ${formatDateOnlyUtc(range.end)}`,
    isCurrentWeek: range.isCurrentWeek,
  }));
}

function getLastDays(referenceDate, days = 7) {
  return Array.from({ length: days }, (_, index) => {
    const offset = index - (days - 1);
    return addDays(referenceDate, offset);
  });
}

function getDayLetter(date) {
  const letters = ["S", "M", "T", "W", "T", "F", "S"];
  return letters[date.getUTCDay()] || "?";
}

function calculateDailyActivity(uniqueDateStrings, referenceDate, days = 7) {
  const dateSet = new Set(uniqueDateStrings);
  return getLastDays(referenceDate, days).map((date) => {
    const dateKey = formatDateOnlyUtc(date);
    return {
      date: dateKey,
      dayLabel: getDayLetter(date),
      active: dateSet.has(dateKey),
      isToday: dateKey === formatDateOnlyUtc(referenceDate),
    };
  });
}

function calculateStreaks(uniqueDateStrings, referenceDate) {
  const sortedDates = Array.from(uniqueDateStrings)
    .filter(isValidIsoDateString)
    .map(parseDateOnlyString)
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());

  let bestStreakDays = 0;
  let currentRun = 0;
  let previousDate = null;

  for (const currentDate of sortedDates) {
    if (previousDate && currentDate.getTime() - previousDate.getTime() === MILLIS_PER_DAY) {
      currentRun += 1;
    } else {
      currentRun = 1;
    }

    bestStreakDays = Math.max(bestStreakDays, currentRun);
    previousDate = currentDate;
  }

  let currentStreakDays = 0;
  let cursor = referenceDate;
  const dateSet = new Set(sortedDates.map(formatDateOnlyUtc));

  while (dateSet.has(formatDateOnlyUtc(cursor))) {
    currentStreakDays += 1;
    cursor = addDays(cursor, -1);
  }

  return {
    currentStreakDays,
    bestStreakDays,
  };
}

function createGoalMilestones(goalRows) {
  if (!Array.isArray(goalRows)) {
    return [];
  }

  return goalRows.map((goal) => ({
    id: Number(goal.id) || null,
    title: String(goal.title || "Untitled goal").trim(),
    category: goal.category || "other",
    deadline: goal.deadline || null,
    status: String(goal.status || "pending").trim().toLowerCase(),
  }));
}

function createProgressSummary(completionRows, goalRows) {
  const completionDates = (completionRows || [])
    .map((row) => String(row.completion_date || "").trim())
    .filter(isValidIsoDateString);

  const referenceDate = getTodayUtc();
  const tasksCompletedThisMonth = calculateTasksCompletedThisMonth(completionDates, referenceDate);
  const avgDailyCompletedTasks = calculateAverageDailyCompletedTasks(completionDates, referenceDate);
  const weeklyCompletion = calculateWeeklyCompletionSeries(completionDates, referenceDate);
  const uniqueDateStrings = new Set(completionDates);
  const dailyActivity = calculateDailyActivity(uniqueDateStrings, referenceDate, 7);
  const currentWeekDailyCompletions = calculateCurrentWeekDailyCompletions(completionDates, referenceDate);
  const { currentStreakDays, bestStreakDays } = calculateStreaks(uniqueDateStrings, referenceDate);

  return {
    tasksCompletedThisMonth,
    avgDailyCompletedTasks,
    currentStreakDays,
    bestStreakDays,
    weeklyCompletion,
    dailyActivity,
    currentWeekDailyCompletions,
    goalMilestones: createGoalMilestones(goalRows),
  };
}

async function getProgressSummaryForUser(userId) {
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId) {
    throw createApiError(401, "Authenticated user is required to fetch progress summaries.");
  }

  const pool = await poolPromise;
  const [completionResult, milestonesResult] = await Promise.all([
    pool
      .request()
      .input("userId", sql.Int, normalizedUserId)
      .query(`
        SELECT CONVERT(varchar(10), p.completion_date, 23) AS completion_date
        FROM Progress AS p
        INNER JOIN Tasks AS t ON t.id = p.task_id
        INNER JOIN Goals AS g ON g.id = t.goal_id
        WHERE g.user_id = @userId
        ORDER BY p.completion_date ASC;
      `),
    pool
      .request()
      .input("userId", sql.Int, normalizedUserId)
      .query(`
        SELECT
          g.id,
          g.title,
          g.category,
          CONVERT(varchar(10), g.deadline, 23) AS deadline,
          g.status
        FROM Goals AS g
        WHERE g.user_id = @userId
        ORDER BY
          CASE LOWER(ISNULL(g.status, ''))
            WHEN 'completed' THEN 1
            WHEN 'at_risk' THEN 2
            WHEN 'active' THEN 3
            WHEN 'pending' THEN 4
            ELSE 5
          END,
          CASE WHEN g.deadline IS NULL THEN 1 ELSE 0 END,
          g.deadline ASC;
      `),
  ]);

  return createProgressSummary(completionResult.recordset || [], milestonesResult.recordset || []);
}

module.exports = {
  createProgressSummary,
  getProgressSummaryForUser,
};
