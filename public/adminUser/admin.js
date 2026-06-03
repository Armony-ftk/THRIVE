
// ── Auth guard: checked before any page init runs ─────────────────────────────
// Stored as a promise so page-specific scripts can await it via window._adminGuard.
window._adminGuard = (async function guardAdminPage() {
  try {
    const res = await fetch('/api/current-user', { credentials: 'include' });
    if (res.status === 401 || !res.ok) {
      window.location.replace('/login.html');
      return null;
    }
    const user = await res.json();
    if (user.error) {
      window.location.replace('/login.html');
      return null;
    }
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      window.location.replace('/normalUser/dashboard.html');
      return null;
    }
    window._adminUser = user;
    return user;
  } catch (err) {
    window.location.replace('/login.html');
    return null;
  }
})();

document.addEventListener("DOMContentLoaded", async function () {
  const user = await window._adminGuard;
  if (!user) return; // redirecting

  const dateElement = document.getElementById("date-text");
  
  if (dateElement && typeof thriveUtils !== 'undefined') {
    dateElement.textContent = thriveUtils.getCurrentDateChip();
  }

  loadOverviewData();
});

/* ── Overview: fetch stats + recent users from API ── */

const AVATAR_COLORS = ['av-blue','av-teal','av-amber','av-purple'];
const AVATAR_BG = {
  'av-blue':   'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  'av-teal':   'linear-gradient(135deg,#10b981,#059669)',
  'av-amber':  'linear-gradient(135deg,#f59e0b,#d97706)',
  'av-purple': 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
};

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function adminFetch(url, opts = {}) {
  const res  = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Request failed');
  return data;
}

async function loadOverviewData() {
  try {
    const [statsRes, usersRes] = await Promise.all([
      adminFetch('/api/admin/stats'),
      adminFetch('/api/admin/recent-users'),
    ]);
    renderStats(statsRes.stats);
    renderRecentUsers(usersRes.users);
  } catch (err) {
    console.error('Failed to load overview data:', err);
    const list = document.getElementById('recent-users-list');
    if (list) list.innerHTML = '<p style="color:var(--text-3);font-size:13px;padding:12px 0">Failed to load users.</p>';
  }
}

function renderStats(stats) {
  const totalEl      = document.getElementById('stat-total');
  const totalSubEl   = document.getElementById('stat-total-sub');
  const suspendedEl  = document.getElementById('stat-suspended');
  const activeTodayEl= document.getElementById('stat-active-today');

  if (totalEl)       totalEl.textContent       = Number(stats.total_users || 0).toLocaleString();
  if (totalSubEl)    totalSubEl.textContent     = `↑ ${Number(stats.new_users || 0).toLocaleString()} joined this week`;
  if (suspendedEl)   suspendedEl.textContent    = Number(stats.suspended_users || 0).toLocaleString();
  if (activeTodayEl) activeTodayEl.textContent  = Number(stats.active_today || 0).toLocaleString();
}

function userRowHtml(user) {
  const color    = AVATAR_COLORS[user.id % AVATAR_COLORS.length];
  const initials = escapeHtml(user.name).split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2);
  const joined   = typeof thriveUtils !== 'undefined'
    ? thriveUtils.formatDateShort(new Date(user.created_at))
    : new Date(user.created_at).toLocaleDateString();
  const isSuspended = user.account_status === 'suspended';
  const badgeCls    = isSuspended ? 's-suspended' : 's-active';
  const badgeTxt    = isSuspended ? 'Suspended'   : 'Active';

  const actionBtn = isSuspended
    ? `<button class="act-btn reinstate" data-id="${user.id}" data-action="reinstate" title="Reinstate user">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8a5 5 0 1 0 2-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M3 4v4h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
       </button>`
    : `<button class="act-btn suspend" data-id="${user.id}" data-action="suspend" title="Suspend user">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><rect x="6" y="5" width="1.3" height="6" rx=".65" fill="currentColor"/><rect x="8.7" y="5" width="1.3" height="6" rx=".65" fill="currentColor"/></svg>
       </button>`;

  return `
    <div class="user-row" data-id="${user.id}">
      <div class="user-avatar ${color}" style="background:${AVATAR_BG[color]}">${initials}</div>
      <div class="user-info">
        <p class="user-name">${escapeHtml(user.name)}</p>
        <p class="user-meta">${escapeHtml(user.email)} · Joined ${joined}</p>
      </div>
      <span class="status-badge ${badgeCls}">${badgeTxt}</span>
      <div class="action-group">
        ${actionBtn}
        <button class="act-btn delete" data-id="${user.id}" data-action="delete" title="Delete user">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M7 8v4M9 8v4M4 5l1 9h6l1-9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>`;
}

function renderRecentUsers(users) {
  const list = document.getElementById('recent-users-list');
  if (!list) return;

  if (!users || users.length === 0) {
    list.innerHTML = '<p style="color:var(--text-3);font-size:13px;padding:12px 0">No users found.</p>';
    return;
  }

  list.innerHTML = users.map(userRowHtml).join('');
  wireRecentUserActions(list);
}

function wireRecentUserActions(container) {
  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id     = +btn.dataset.id;
      const action = btn.dataset.action;
      const row    = btn.closest('.user-row');
      const name   = row.querySelector('.user-name')?.textContent || 'this user';

      if (action === 'suspend') {
        showModal({
          icon: '⏸️', title: 'Suspend user',
          body: `Suspend ${name}'s account? They will be locked out until reinstated.`,
          confirmLabel: 'Suspend', confirmStyle: 'confirm-amber',
          onConfirm: async () => {
            await adminFetch(`/api/admin/users/${id}/suspend`, { method: 'PATCH' });
            loadOverviewData();
          }
        });
      } else if (action === 'reinstate') {
        showModal({
          icon: '✅', title: 'Reinstate user',
          body: `Reinstate ${name}'s account? They will regain full access.`,
          confirmLabel: 'Reinstate', confirmStyle: 'confirm-green',
          onConfirm: async () => {
            await adminFetch(`/api/admin/users/${id}/reinstate`, { method: 'PATCH' });
            loadOverviewData();
          }
        });
      } else if (action === 'delete') {
        showModal({
          icon: '🗑️', title: 'Delete account',
          body: `Permanently delete ${name}'s account? This cannot be undone.`,
          confirmLabel: 'Delete account', confirmStyle: '',
          onConfirm: async () => {
            await adminFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            loadOverviewData();
          }
        });
      }
    });
  });
}



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

/* ── Wire flagged-goals action buttons (static HTML) ── */
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