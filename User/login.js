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

// Example login form submission
const loginForm = document.querySelector("form");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Login submitted!");
    
  });
}
