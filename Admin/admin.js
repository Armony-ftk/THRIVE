
document.addEventListener("DOMContentLoaded", function () {
  const dateElement = document.getElementById("date-text");

  const today = new Date();

  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };

  dateElement.textContent = today.toLocaleDateString('en-ZA', options);
});



/* ── Aurora canvas  ── */
(function() {
  const canvas = document.getElementById('aurora');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const waves = [
      { y: H * 0.28, amp: 90, freq: 0.0018, speed: 0.0001, r:30,  g:80,  b:180, a:0.08 },
      { y: H * 0.55, amp: 70, freq: 0.0022, speed: 0.0009, r:10,  g:120, b:200, a:0.06 },
      { y: H * 0.78, amp: 55, freq: 0.0015, speed: 0.0005, r:50,  g:50,  b:160, a:0.05 },
    ];
    waves.forEach(w => {
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) {
        const y = w.y + Math.sin(x * w.freq + t * w.speed) * w.amp
                      + Math.sin(x * w.freq * 1.6 + t * w.speed * 0.9) * (w.amp * 0.4);
        ctx.lineTo(x, y);
      }

      
      ctx.lineTo(W, H); ctx.closePath();
      const g = ctx.createLinearGradient(0, w.y - w.amp, 0, H);
      g.addColorStop(0, `rgba(${w.r},${w.g},${w.b},${w.a})`);
      g.addColorStop(1, `rgba(${w.r},${w.g},${w.b},0)`);
      ctx.fillStyle = g; ctx.fill();
    });
    t += 16;
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ── Animate bar charts on load ── */
window.addEventListener('load', () => {
  document.querySelectorAll('.bar-fill').forEach(el => {
    const h = el.style.getPropertyValue('--h');
    el.style.setProperty('--h', '0%');
    setTimeout(() => el.style.setProperty('--h', h), 100);
  });
});

/* ── Confirm modal system ── */
const modal      = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalBody  = document.getElementById('modal-body');
const modalIcon  = document.getElementById('modal-icon');
const modalConfirmBtn = document.getElementById('modal-confirm');
const modalCancelBtn  = document.getElementById('modal-cancel');

let pendingAction = null;

function showModal({ icon, title, body, confirmLabel, confirmStyle, onConfirm }) {
  modalIcon.textContent = icon;
  modalTitle.textContent = title;
  modalBody.textContent  = body;
  modalConfirmBtn.textContent = confirmLabel;
  modalConfirmBtn.className = 'modal-confirm ' + (confirmStyle || '');
  pendingAction = onConfirm;
  modal.style.display = 'flex';
}

function closeModal() {
  modal.style.display = 'none';
  pendingAction = null;
}

modalCancelBtn.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

modalConfirmBtn.addEventListener('click', () => {
  if (pendingAction) pendingAction();
  closeModal();
});

/* ── Wire up action buttons ── */
document.querySelectorAll('.act-btn.delete').forEach(btn => {
  btn.addEventListener('click', () => {
    const row  = btn.closest('.user-row');
    const name = row.querySelector('.user-name')?.textContent || 'this user';
    showModal({
      icon: '🗑️',
      title: 'Delete account',
      body: `Permanently delete ${name}'s account? This cannot be undone.`,
      confirmLabel: 'Delete account',
      confirmStyle: '',
      onConfirm: () => row.style.cssText = 'opacity:.3;pointer-events:none;transition:opacity .3s;'
    });
  });
});

document.querySelectorAll('.act-btn.suspend').forEach(btn => {
  btn.addEventListener('click', () => {
    const row  = btn.closest('.user-row');
    const name = row.querySelector('.user-name')?.textContent || 'this user';
    showModal({
      icon: '⏸️',
      title: 'Suspend user',
      body: `Suspend ${name}'s account? They will be locked out until reinstated.`,
      confirmLabel: 'Suspend',
      confirmStyle: 'confirm-amber',
      onConfirm: () => {
        const badge = row.querySelector('.status-badge');
        if (badge) { badge.className = 'status-badge s-suspended'; badge.textContent = 'Suspended'; }
        btn.className = 'act-btn reinstate'; btn.title = 'Reinstate user';
        btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8a5 5 0 1 0 2-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M3 4v4h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      }
    });
  });
});

document.querySelectorAll('.act-btn.reinstate').forEach(btn => {
  btn.addEventListener('click', () => {
    const row  = btn.closest('.user-row');
    const name = row.querySelector('.user-name')?.textContent || 'this user';
    showModal({
      icon: '✅',
      title: 'Reinstate user',
      body: `Reinstate ${name}'s account? They will regain full access.`,
      confirmLabel: 'Reinstate',
      confirmStyle: 'confirm-green',
      onConfirm: () => {
        const badge = row.querySelector('.status-badge');
        if (badge) { badge.className = 'status-badge s-active'; badge.textContent = 'Active'; }
        btn.className = 'act-btn suspend'; btn.title = 'Suspend user';
        btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><rect x="6" y="5" width="1.3" height="6" rx=".65" fill="currentColor"/><rect x="8.7" y="5" width="1.3" height="6" rx=".65" fill="currentColor"/></svg>`;
      }
    });
  });
});

document.querySelectorAll('.act-btn.remove').forEach(btn => {
  btn.addEventListener('click', () => {
    const row   = btn.closest('.flag-row');
    const title = row.querySelector('.flag-title')?.textContent || 'this goal';
    showModal({
      icon: '🚩',
      title: 'Remove goal',
      body: `Remove "${title}"? This will permanently delete it from the user's account.`,
      confirmLabel: 'Remove goal',
      confirmStyle: '',
      onConfirm: () => row.style.cssText = 'opacity:.3;pointer-events:none;transition:opacity .3s;'
    });
  });
});

document.querySelectorAll('.act-btn.dismiss').forEach(btn => {
  btn.addEventListener('click', () => {
    const row = btn.closest('.flag-row');
    row.style.cssText = 'opacity:.3;pointer-events:none;transition:opacity .3s;';
  });
});