/**
 * Date Initializer for Normal User Pages
 * Dynamically updates all date elements with current date
 */

document.addEventListener("DOMContentLoaded", function () {
  // Update all date-chip elements with the current date
  const dateChips = document.querySelectorAll(".date-chip .date-text");
  
  if (dateChips.length > 0) {
    const currentDateFormatted = thriveUtils.getCurrentDateChip();
    dateChips.forEach(chip => {
      chip.textContent = currentDateFormatted;
    });
  }

  // Update task page date label if present
  const taskDateLabel = document.querySelector(".task-date-label");
  if (taskDateLabel) {
    const currentDateLong = thriveUtils.formatDateLong();
    taskDateLabel.textContent = currentDateLong;
  }
});
