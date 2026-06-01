const editProfileBtn = document.querySelector('.btn-secondary[data-action="edit-profile"]');

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


editProfileBtn.addEventListener("click", () => {
  Swal.fire({
  title: "Edit Profile",
  html: `
        <input type="text" id="editName" class="swal2-input" placeholder="Full Name">
        <input type="email" id="editEmail" class="swal2-input" placeholder="Email">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const name = document.getElementById("editName").value;
        const email = document.getElementById("editEmail").value;
        if (!name || !email) {
          Swal.showValidationMessage("Both fields are required");
          return false;
        }
        return { name, email };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { name, email } = result.value;

        const res = await fetch("/api/profile/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // ✅ ensure session cookie is sent
          body: JSON.stringify({ name, email })
        });

        const data = await res.json();

        if (data.success) {
          // ✅ Immediate DOM update
          const user = { name, email };
          renderUserData(user);

          const initials = generateInitials(name);
          document.querySelectorAll("[data-user-avatar]").forEach(el => {
            el.textContent = initials;
            el.title = name;
          });
          const sidebarAvatar = document.querySelector(".sb-avatar.user-avatar");
          if (sidebarAvatar) sidebarAvatar.textContent = initials;

          Swal.fire({
            icon: "success",
            title: "Profile Updated",
            text: data.message,
            timer: 2000,
            showConfirmButton: false
          }).then(async () => {
            // ✅ Refresh from server for consistency
            const user = await fetchCurrentUser();
            renderUserData(user);
          });
        } else {
          Swal.fire("Error", data.error || "Failed to update profile", "error");
        }
      }
    });
  });




