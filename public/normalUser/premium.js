/* ═══════════════════════════════════════════════
   premium.js — Go Premium page interactions
   Handles: notify-me modal open/close/submit
   Future hook: replace notifyForm submit with
   payment provider SDK call when ready.
═══════════════════════════════════════════════ */

(function () {
  "use strict";

  const overlay      = document.getElementById("notifyOverlay");
  const closeBtn     = document.getElementById("notifyClose");
  const upgradeBtn   = document.getElementById("premiumUpgradeBtn");
  const notifyForm   = document.getElementById("notifyForm");
  const emailInput   = document.getElementById("notifyEmail");

  /* ── Open / close helpers ─────────────────── */
  function openModal() {
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    // Give the browser a tick so the transition fires after display
    requestAnimationFrame(() => emailInput.focus());
  }

  function closeModal() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }

  /* ── Trigger: Upgrade button ──────────────── */
  if (upgradeBtn) {
    upgradeBtn.addEventListener("click", openModal);
  }

  /* ── Dismiss: close button ────────────────── */
  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  /* ── Dismiss: click outside modal ────────── */
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
  }

  /* ── Dismiss: Escape key ──────────────────── */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("open")) {
      closeModal();
    }
  });

  /* ── Form submit ──────────────────────────── */
  if (notifyForm) {
    notifyForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = emailInput.value.trim();

      // Basic client-side validation
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailInput.classList.add("error");
        emailInput.focus();
        return;
      }
      emailInput.classList.remove("error");

      const submitBtn = notifyForm.querySelector(".notify-submit");
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving…";

      /*
       * ── FUTURE PAYMENT INTEGRATION POINT ──────
       * Replace the setTimeout block below with:
       *   1. A call to your payment provider's SDK
       *      (e.g., Stripe.js redirectToCheckout).
       *   2. Or a POST to /api/premium/notify with { email }
       *      to register interest in your backend.
       *
       * Example placeholder structure:
       *   fetch("/api/premium/notify", {
       *     method: "POST",
       *     headers: { "Content-Type": "application/json" },
       *     body: JSON.stringify({ email })
       *   })
       *   .then(res => { if (!res.ok) throw new Error(); return res.json(); })
       *   .then(() => showSuccess())
       *   .catch(() => { submitBtn.disabled = false; submitBtn.textContent = "Try again"; });
       */
      setTimeout(function () {
        showSuccess();
      }, 800);
    });
  }

  /* ── Show success state inside modal ─────── */
  function showSuccess() {
    // Hide the form, show success message
    const formContent = notifyForm.closest(".notify-modal");
    if (!formContent) return;

    // Replace form area with success message
    notifyForm.style.display = "none";
    notifyForm.previousElementSibling /* .notify-body */.style.display = "none";

    const successDiv = document.createElement("div");
    successDiv.className = "notify-success visible";
    successDiv.innerHTML = `
      <div class="notify-success-icon">✓</div>
      <p class="notify-success-title">You're on the list!</p>
      <p class="notify-success-sub">We'll email you the moment Premium launches.</p>
    `;

    notifyForm.insertAdjacentElement("afterend", successDiv);

    // Auto-close after 3 seconds
    setTimeout(closeModal, 3000);
  }
})();
