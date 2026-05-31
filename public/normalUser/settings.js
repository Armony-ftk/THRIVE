// Save settings button
const saveBtn = document.querySelector(".save-btn");

const changePasswordBtn = document.querySelector('.btn-secondary[data-action="change-password"]');
const changePasswordModal = document.getElementById("changePasswordModal");
const signOutBtn = document.querySelector('.btn-secondary[data-action="signout"]');
const deleteAccountBtn = document.querySelector('.btn-secondary[data-action="delete-account"]');

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

//generate initials
function generateInitials(fullName) {
  const parts = fullName.trim().split(" ");
  if (parts.length >= 2) {
    // First + Last name → take first letters of both
    return (parts[0][0] + parts[1][0]).toUpperCase();
  } else {
    // Single name → just first letter
    return parts[0][0].toUpperCase();
  }
}


// Sign Out
signOutBtn.addEventListener("click", async () => {
  Swal.fire({
    title: "Are you sure?",
    text: "You will be logged out and redirected to login.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#28a745",
    confirmButtonText: "Yes, log me out",
    cancelButtonText: "No, stay logged in"
  }).then(async (result) => {
    if (result.isConfirmed) {
      const res = await fetch("/settings/signout", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        window.location.href = data.redirect;
      } else {
        Swal.fire("Error", data.error || "Failed to sign out", "error");
      }
    } else {
      Swal.fire("Cancelled", "You are still logged in.", "info");
    }
  });
});

// Change Password
changePasswordBtn.addEventListener("click", () => {
  Swal.fire({
    title: "Change Password",
    html: `
      <div class="swal-input-group">
        <input type="password" id="currentPassword" class="swal2-input" placeholder="Current Password">
        <span id="toggleCurrent" class="toggle-eye">👁</span>
      </div>
      <div class="swal-input-group">
        <input type="password" id="newPassword" class="swal2-input" placeholder="New Password">
        <span id="toggleNew" class="toggle-eye">👁</span>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Update Password",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#aaa",
    didOpen: () => {
      const toggleCurrent = document.getElementById("toggleCurrent");
      const currentInput = document.getElementById("currentPassword");
      toggleCurrent.addEventListener("click", () => {
        const type = currentInput.type === "password" ? "text" : "password";
        currentInput.type = type;
        toggleCurrent.textContent = type === "password" ? "👁" : "🙈";
      });

      const toggleNew = document.getElementById("toggleNew");
      const newInput = document.getElementById("newPassword");
      toggleNew.addEventListener("click", () => {
        const type = newInput.type === "password" ? "text" : "password";
        newInput.type = type;
        toggleNew.textContent = type === "password" ? "👁" : "🙈";
      });
    },
    preConfirm: () => {
      const currentPassword = document.getElementById("currentPassword").value;
      const newPassword = document.getElementById("newPassword").value;

      if (!currentPassword || !newPassword) {
        Swal.showValidationMessage("Both fields are required");
        return false;
      }
      return { currentPassword, newPassword };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      const { currentPassword, newPassword } = result.value;

      const res = await fetch("/settings/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Password Updated!",
          text: "Your password has been changed successfully.",
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: data.error || "Something went wrong",
          confirmButtonColor: "#d33"
        });
      }
    }
  });
});

document.querySelector(".form-change-password").addEventListener("submit", async (e) => {
  e.preventDefault();

  const currentPassword = e.target.currentPassword.value;
  const newPassword = e.target.newPassword.value;

  const res = await fetch("/settings/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword })
  });

  const data = await res.json();
  alert(data.message || data.error);
});

// Delete Account
deleteAccountBtn.addEventListener("click", async () => {
  Swal.fire({
    title: "Are you sure?",
    text: "Deleting your account is permanent. You will need to sign up again.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete my account",
    cancelButtonText: "No, keep my account"
  }).then(async (result) => {
    if (result.isConfirmed) {
      const res = await fetch("/settings/delete-account", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Account Deleted",
          text: "Your account has been deleted successfully.",
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          window.location.href = data.redirect;
        });
      } else {
        Swal.fire("Error", data.error || "Failed to delete account", "error");
      }
    } else {
      Swal.fire("Cancelled", "Your account is safe.", "info");
    }
  });
});


