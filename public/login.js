// Toggle password visibility
const toggle = document.getElementById("toggle");
const password = document.getElementById("password");

if (toggle && password) {
  toggle.addEventListener("click", () => {
    const type = password.getAttribute("type") === "password" ? "text" : "password";
    password.setAttribute("type", type);
    toggle.textContent = type === "password" ? "👁" : "🙈";
  });
}

const params = new URLSearchParams(window.location.search);
const messageBox = document.createElement("div");
messageBox.id = "message-box";
document.body.appendChild(messageBox);

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

if (params.has("error") || params.has("success")) {
  window.history.replaceState({}, document.title, window.location.pathname);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    messageBox.classList.add("fade-out");
    setTimeout(() => {
      messageBox.style.display = "none";
    }, 1000); // wait for fade animation
  }, 5000);
}


document.querySelector(".google-btn").addEventListener("click", () => {
  // Always hit the backend server directly
  window.location.href = "http://localhost:3000/auth/google";
});



