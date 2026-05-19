// userData.js
// This module provides a simple reusable way to fetch the currently authenticated user
// from the backend and render that information in any page using data attributes.

function getInitials(fullName) {
  if (!fullName) return "?";
  const words = fullName.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

async function fetchCurrentUser() {
  try {
    const response = await fetch("/api/current-user", {
      credentials: "include",
    });

    if (response.status === 401) {
      window.location.href = "/login.html";
      return null;
    }

    if (!response.ok) {
      console.error("Unable to load user data", response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

function renderUserData(user) {
  if (!user) return;

  document.querySelectorAll("[data-user-name]").forEach((element) => {
    element.textContent = user.name;
  });

  document.querySelectorAll("[data-user-email]").forEach((element) => {
    element.textContent = user.email;
  });

  const initials = getInitials(user.name || user.email || "User");

  document.querySelectorAll("[data-user-avatar]").forEach((element) => {
    element.textContent = initials;
    element.title = user.name;
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  const hasUserMarkup = document.querySelector("[data-user-name], [data-user-email], [data-user-avatar]");
  if (!hasUserMarkup) return;

  const user = await fetchCurrentUser();
  renderUserData(user);
});
