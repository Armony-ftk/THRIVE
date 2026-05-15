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

// Form submission validation + redirect
const signUpForm = document.querySelector("form");
if (signUpForm) {
  signUpForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (signupPassword.value !== confirmPassword.value) {
      alert("Passwords do not match. Please try again.");
      return;
    }

    // Redirect to dashboard.html after successful sign up
    window.location.href = "dashboard.html";
  });
}
