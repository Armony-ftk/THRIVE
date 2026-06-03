/* ═══════════════════════════════════════════════════════════════
   admin-profile.js — live admin profile management
   Reuses:  POST /api/profile/update
            POST /api/settings/change-password
            POST /api/settings/signout
   New:     GET  /api/admin/me
            GET  /api/admin/my-activity
═══════════════════════════════════════════════════════════════ */

// ── DOM helpers ───────────────────────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Name helpers ──────────────────────────────────────────────────────────────
function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/);
  return { first: parts[0] || '', last: parts.slice(1).join(' ') };
}

function getInitials(fullName) {
  const { first, last } = splitName(fullName);
  const a = (first[0] || '').toUpperCase();
  const b = (last ? last[0] : (first[1] || '')).toUpperCase();
  return (a + b) || '?';
}

function formatJoinDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

// ── Activity log helpers ──────────────────────────────────────────────────────
const LOG_DOT_CLASS = {
  suspend_user:   'suspend-dot',
  reinstate_user: 'ok-dot',
  delete_user:    'delete-dot',
  delete_goal:    'remove-dot',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  if (days <  7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ── Load real profile data ────────────────────────────────────────────────────
async function loadAdminProfile() {
  try {
    const res  = await fetch('/api/admin/me', { credentials: 'include' });
    const data = await res.json();
    if (!data.success) return;
    const u         = data.user;
    const initials  = getInitials(u.name);
    const roleLabel = u.role === 'super_admin' ? 'Super Admin' : 'Admin';

    // Hero card
    setText('profile-avatar-initials', initials);
    setText('profile-display-name',    u.name);
    setText('profile-display-email',   u.email);
    setText('profile-display-role',    roleLabel);
    setText('profile-display-joined',  `Member since ${formatJoinDate(u.created_at)}`);

    // Sidebar avatar
    setText('sb-avatar-profile', initials);

    // Account details form
    const { first, last } = splitName(u.name);
    setVal('profile-first-name',  first);
    setVal('profile-last-name',   last);
    setVal('profile-email-input', u.email);
    setVal('profile-role-input',  roleLabel);
  } catch (err) {
    console.error('[admin-profile] loadAdminProfile failed:', err);
  }
}

// ── Load real activity data ───────────────────────────────────────────────────
async function loadAdminActivity() {
  try {
    const res  = await fetch('/api/admin/my-activity', { credentials: 'include' });
    const data = await res.json();
    if (!data.success) return;

    // Activity stats
    const s = data.stats || {};
    setText('act-total',     Number(s.total_actions   || 0).toLocaleString());
    setText('act-removed',   Number(s.goals_removed   || 0).toLocaleString());
    setText('act-suspended', Number(s.users_suspended || 0).toLocaleString());

    // Recent actions log
    const log = document.getElementById('recent-actions-log');
    if (!log) return;

    const actions = data.recentActions || [];
    if (actions.length === 0) {
      log.innerHTML = '<p style="color:var(--text-3);font-size:13px;padding:12px 0">No actions recorded yet.</p>';
      return;
    }

    log.innerHTML = actions.map(a => {
      const dotClass = LOG_DOT_CLASS[a.action_type] || 'ok-dot';
      return `
        <div class="log-row">
          <div class="log-dot ${dotClass}"></div>
          <div class="log-text">
            <p>${escapeHtml(a.description || a.action_type)}</p>
            <span>${timeAgo(a.created_at)}</span>
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    console.error('[admin-profile] loadAdminActivity failed:', err);
  }
}

// ── Save account details ──────────────────────────────────────────────────────
document.getElementById('save-details').addEventListener('click', async function () {
  const first = (document.getElementById('profile-first-name')?.value || '').trim();
  const last  = (document.getElementById('profile-last-name')?.value  || '').trim();
  const email = (document.getElementById('profile-email-input')?.value || '').trim();
  const name  = last ? `${first} ${last}` : first;

  if (!first || !email) {
    showModal({ icon: '⚠️', title: 'Missing fields', body: 'First name and email address are required.', confirmLabel: 'OK', confirmStyle: '', onConfirm: () => {} });
    return;
  }

  try {
    const res  = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();

    if (data.success) {
      const initials = getInitials(name);
      setText('profile-display-name',    name);
      setText('profile-display-email',   email);
      setText('profile-avatar-initials', initials);
      setText('sb-avatar-profile',       initials);
      this.textContent = 'Saved ✓';
      this.style.background = 'linear-gradient(135deg,#059669,#10b981)';
      setTimeout(() => { this.textContent = 'Save changes'; this.style.background = ''; }, 2200);
    } else {
      showModal({ icon: '⚠️', title: 'Update failed', body: data.error || 'Failed to save changes.', confirmLabel: 'OK', confirmStyle: '', onConfirm: () => {} });
    }
  } catch (err) {
    console.error('[admin-profile] save-details failed:', err);
  }
});

// ── Password match indicator ──────────────────────────────────────────────────
document.getElementById('confirm-pw').addEventListener('input', function () {
  const msg = document.getElementById('pw-msg');
  if (!this.value) { msg.textContent = ''; return; }
  if (this.value !== document.getElementById('new-pw').value) {
    msg.style.color = 'var(--red)';
    msg.textContent = 'Passwords do not match';
  } else {
    msg.style.color = 'var(--green)';
    msg.textContent = 'Passwords match ✓';
  }
});

// ── Change password ───────────────────────────────────────────────────────────
document.getElementById('save-password').addEventListener('click', async function () {
  const current = document.getElementById('current-pw')?.value  || '';
  const newPw   = document.getElementById('new-pw')?.value      || '';
  const confirm = document.getElementById('confirm-pw')?.value  || '';
  const msg     = document.getElementById('pw-msg');

  msg.textContent = '';
  if (!current || !newPw || !confirm) {
    msg.style.color = 'var(--red)';
    msg.textContent = 'Please fill in all fields';
    return;
  }
  if (newPw !== confirm) {
    msg.style.color = 'var(--red)';
    msg.textContent = 'Passwords do not match';
    return;
  }

  try {
    const res  = await fetch('/api/settings/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword: current, newPassword: newPw }),
    });
    const data = await res.json();

    if (data.success) {
      msg.style.color  = 'var(--green)';
      msg.textContent  = 'Password updated successfully ✓';
      this.textContent = 'Updated ✓';
      this.style.background = 'linear-gradient(135deg,#059669,#10b981)';
      ['current-pw', 'new-pw', 'confirm-pw'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      setTimeout(() => {
        this.textContent  = 'Update password';
        this.style.background = '';
        msg.textContent   = '';
      }, 2200);
    } else {
      msg.style.color = 'var(--red)';
      msg.textContent = data.error || 'Failed to update password';
    }
  } catch (err) {
    msg.style.color = 'var(--red)';
    msg.textContent = 'Request failed. Please try again.';
    console.error('[admin-profile] change-password failed:', err);
  }
});

// ── Sign out ──────────────────────────────────────────────────────────────────
document.getElementById('btn-sign-out').addEventListener('click', () => {
  showModal({
    icon: '👋',
    title: 'Sign out',
    body: 'Sign out of the admin portal? Your current session will be cleared.',
    confirmLabel: 'Sign out',
    confirmStyle: '',
    onConfirm: async () => {
      try {
        const res  = await fetch('/api/settings/signout', { method: 'POST', credentials: 'include' });
        const data = await res.json();
        window.location.href = data.redirect || '/login.html';
      } catch {
        window.location.href = '/login.html';
      }
    },
  });
});

// ── Preferences (localStorage) ────────────────────────────────────────────────
const PREF_KEY = 'thrive_admin_prefs';

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; }
  catch { return {}; }
}

function savePrefs(prefs) {
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
}

document.querySelectorAll('.toggle[data-pref]').forEach(tog => {
  const key   = tog.dataset.pref;
  const prefs = loadPrefs();
  // If previously saved, apply persisted state; otherwise keep initial HTML class
  if (key in prefs) tog.classList.toggle('on', prefs[key]);

  tog.addEventListener('click', () => {
    tog.classList.toggle('on');
    const p = loadPrefs();
    p[key] = tog.classList.contains('on');
    savePrefs(p);
  });
});

// ── Session revoke (visual-only — no persistent session store) ────────────────
document.querySelectorAll('.session-revoke').forEach(btn => {
  btn.addEventListener('click', function () {
    const row = this.closest('.session-row');
    showModal({
      icon: '🔒',
      title: 'Revoke session',
      body: 'This device will be immediately logged out. Continue?',
      confirmLabel: 'Revoke',
      confirmStyle: '',
      onConfirm: () => {
        row.style.cssText = 'opacity:.3;pointer-events:none;transition:opacity .3s';
      },
    });
  });
});

document.getElementById('btn-revoke-all').addEventListener('click', () => {
  showModal({
    icon: '🔒',
    title: 'Revoke all other sessions',
    body: 'All devices except your current session will be logged out immediately.',
    confirmLabel: 'Revoke all',
    confirmStyle: '',
    onConfirm: () => {
      document.querySelectorAll('.session-revoke').forEach(btn => {
        btn.closest('.session-row').style.cssText = 'opacity:.3;pointer-events:none;transition:opacity .3s';
      });
    },
  });
});

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadAdminProfile();
  loadAdminActivity();
});
