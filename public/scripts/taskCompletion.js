(function (window) {
  function renderTaskCheckbox(task) {
    const isDone = String(task.status).toLowerCase() === "completed";
    const checked = isDone ? "checked" : "";
    const disabled = isDone ? "disabled" : "";

    return `
      <label class="checkbox-wrap">
        <input
          type="checkbox"
          class="task-checkbox"
          data-task-id="${task.id}"
          ${checked}
          ${disabled}
          aria-label="Mark task complete"
        />
        <span class="checkmark"></span>
      </label>
    `;
  }

  async function completeTaskRequest(taskId) {
    return thriveUtils.fetchJson(`/api/tasks/${taskId}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
  }

  function bindTaskCompletion(container) {
    if (!container || container.__taskCompletionBound) {
      return;
    }

    container.__taskCompletionBound = true;
    container.addEventListener("change", async (event) => {
      const checkbox = event.target.closest(".task-checkbox");
      if (!checkbox || checkbox.disabled || !checkbox.checked) {
        return;
      }

      const taskId = checkbox.dataset.taskId;
      const taskRow = checkbox.closest(".task-row");
      if (!taskId || !taskRow) {
        return;
      }

      checkbox.disabled = true;
      taskRow.classList.add("pending-complete");

      try {
        await completeTaskRequest(taskId);
        finalizeTaskRow(taskRow);
      } catch (error) {
        checkbox.disabled = false;
        checkbox.checked = false;
        taskRow.classList.remove("pending-complete");
        showTaskError(error.message || "Unable to complete task. Please try again.");
        console.error("Task completion error:", error);
      }
    });
  }

  function finalizeTaskRow(row) {
    row.classList.add("completed");
    const name = row.querySelector(".task-name");
    if (name) {
      name.classList.add("done");
    }

    const check = row.querySelector(".task-check");
    if (check) {
      check.classList.add("done");
    }

    const badge = row.querySelector(".badge");
    if (badge) {
      badge.textContent = "Completed";
      badge.className = "badge badge-teal";
    }

    row.classList.add("fade-out");
    window.setTimeout(() => {
      row.remove();
    }, 300);
  }

  function showTaskError(message) {
    window.alert(message);
  }

  window.taskCompletion = {
    renderTaskCheckbox,
    bindTaskCompletion,
  };
})(window);
