// Save settings button
const saveBtn = document.querySelector(".save-btn");

if (saveBtn) {
  saveBtn.addEventListener("click", () => {
    alert("Settings saved!");
    
    const reminders = document.querySelector("input[type='checkbox']").checked;
    console.log("Daily reminders enabled:", reminders);
  });
}

// Toggle switches
const switches = document.querySelectorAll(".switch input");
switches.forEach(sw => {
  sw.addEventListener("change", () => {
    console.log(`${sw.parentElement.previousElementSibling.textContent} set to ${sw.checked}`);
  });
});
