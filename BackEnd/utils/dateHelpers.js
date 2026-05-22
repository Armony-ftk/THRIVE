function calculateGoalDeadline(duration, durationUnit) {
  if (typeof duration !== "number" || duration <= 0 || !Number.isInteger(duration)) {
    throw new Error("Invalid duration for goal deadline calculation.");
  }

  const deadline = new Date();

  switch (durationUnit) {
    case "days":
      deadline.setDate(deadline.getDate() + duration);
      break;
    case "weeks":
      deadline.setDate(deadline.getDate() + duration * 7);
      break;
    case "months":
      deadline.setMonth(deadline.getMonth() + duration);
      break;
    default:
      throw new Error("Invalid duration unit for goal deadline calculation.");
  }

  if (Number.isNaN(deadline.getTime())) {
    throw new Error("Goal deadline calculation produced an invalid date.");
  }

  return deadline;
}

function calculateTaskDeadline(offsetDays) {
  if (typeof offsetDays !== "number" || offsetDays <= 0 || !Number.isInteger(offsetDays)) {
    throw new Error("Invalid offset days for task deadline calculation.");
  }

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + offsetDays);

  if (Number.isNaN(deadline.getTime())) {
    throw new Error("Task deadline calculation produced an invalid date.");
  }

  return deadline;
}

module.exports = {
  calculateGoalDeadline,
  calculateTaskDeadline,
};
