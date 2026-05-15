// Handle password reset form submission
const resetForm = document.querySelector("form");
const resetEmail = document.getElementById("reset-email");

if (resetForm) {
  resetForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!resetEmail.value) {
      alert("Please enter your email address.");
      return;
    }

    // Simulate sending reset link
    alert(`A password reset link has been sent to ${resetEmail.value}`);
  });
}
