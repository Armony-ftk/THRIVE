// Toggle password visibility for main password
const toggleSignup = document.getElementById("toggle");
const signupPassword = document.getElementById("signup-password");


if (toggleSignup && signupPassword) {
  toggleSignup.addEventListener("click", () => {
    const type = signupPassword.getAttribute("type") === "password" ? "text" : "password";
    signupPassword.setAttribute("type", type);
    toggleSignup.textContent = type === "password" ? "👁" : "🙈";
  });
}

// Toggle password visibility for confirm password
const toggleConfirm = document.getElementById("toggle-confirm");
const confirmPassword = document.getElementById("confirm-password");

if (toggleConfirm && confirmPassword) {
  toggleConfirm.addEventListener("click", () => {
    const type = confirmPassword.getAttribute("type") === "password" ? "text" : "password";
    confirmPassword.setAttribute("type", type);
    toggleConfirm.textContent = type === "password" ? "👁" : "🙈";
  });
}

const signUpForm = document.querySelector("form");
if (signUpForm) {
  signUpForm.addEventListener("submit", (e) => {
    if (signupPassword.value !== confirmPassword.value) {
      e.preventDefault(); // stop submission only if invalid
      alert("Passwords do not match. Please try again.");
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const messageBox = document.getElementById("message-box");

  if (params.has("error")) {
    messageBox.textContent = decodeURIComponent(params.get("error"));
    messageBox.className = "error";
    messageBox.style.display = "block";
  }

  if (params.has("success")) {
    messageBox.textContent = decodeURIComponent(params.get("success"));
    messageBox.className = "success";
    messageBox.style.display = "block";
  }

  // Clear query string so message disappears on refresh
  if (params.has("error") || params.has("success")) {
    window.history.replaceState({}, document.title, window.location.pathname);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      messageBox.style.opacity = "1"; // start fully visible
      let fadeEffect = setInterval(() => {
        if (!messageBox.style.opacity) {
          messageBox.style.opacity = "1";
        }
        if (messageBox.style.opacity > 0) {
          messageBox.style.opacity -= 0.05;
        } else {
          clearInterval(fadeEffect);
          messageBox.style.display = "none";
        }
      }, 50);
    }, 5000); // wait 5 seconds before fading out
  }
});


document.querySelector(".google-btn").addEventListener("click", () => {
  // Always hit the backend server directly
  window.location.href = "http://localhost:3000/auth/google";
});