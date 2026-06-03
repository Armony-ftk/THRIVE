/* ═══════════════════════════════════════════════════════════════
   admin-users.js  –  dynamic, API-driven user management table
   ═══════════════════════════════════════════════════════════════ */

const COLORS = ['av-blue', 'av-teal', 'av-amber', 'av-purple'];
const AVBG = {
  'av-blue':   'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  'av-teal':   'linear-gradient(135deg,#10b981,#059669)',
  'av-amber':  'linear-gradient(135deg,#f59e0b,#d97706)',
  'av-purple': 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
};

// ── State ─────────────────────────────────────────────────────────────────────
let currentFilter = 'all';
let searchTerm    = '';
let currentPage   = 1;
const PAGE_SIZE   = 12;
let totalUsers    = 0;
const selectedIds = new Set();
let searchDebounce = null;

// ── Helpers ───────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Derive display status from DB fields */
function displayStatus(user) {
  if (user.account_status === 'suspended') return 'suspended';
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  if (new Date(user.created_at).getTime() >= sevenDaysAgo) return 'new';
  return 'active';
}

function statusBadge(status) {
  const map = { active: 's-active', suspended: 's-suspended', new: 's-new' };
  return `<span class="status-badge ${map[status] || 's-active'}">${status}</span>`;
}

function actionBtns(user, status) {
  const viewBtn = `<button class="act-btn view" data-id="${user.id}" data-action="view" title="View profile"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg></button>`;
  const delBtn  = `<button class="act-btn delete" data-id="${user.id}" data-action="delete" title="Delete user"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M7 8v4M9 8v4M4 5l1 9h6l1-9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;

  if (status === 'suspended') {
    const reinstateBtn = `<button class="act-btn reinstate" data-id="${user.id}" data-action="reinstate" title="Reinstate user"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8a5 5 0 1 0 2-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M3 4v4h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
    return `<div class="action-group">${viewBtn}${reinstateBtn}${delBtn}</div>`;
  }
  const suspendBtn = `<button class="act-btn suspend" data-id="${user.id}" data-action="suspend" title="Suspend user"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><rect x="6" y="5" width="1.3" height="6" rx=".65" fill="currentColor"/><rect x="8.7" y="5" width="1.3" height="6" rx=".65" fill="currentColor"/></svg></button>`;
  return `<div class="action-group">${viewBtn}${suspendBtn}${delBtn}</div>`;
}

// ── API helpers ───────────────────────────────────────────────────────────────
async function callApi(url, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(url, opts);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Request failed');
  return data;
}

async function fetchUsers() {
  const params = new URLSearchParams({
    page:     currentPage,
    pageSize: PAGE_SIZE,
    filter:   currentFilter,
    search:   searchTerm,
  });
  return callApi(`/api/admin/users?${params}`);
}

// ── Render ────────────────────────────────────────────────────────────────────
async function render() {
  const tbody = document.getElementById('user-tbody');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-3)">Loading…</td></tr>`;

  try {
    const { users, total } = await fetchUsers();
    totalUsers = total;

    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-3);font-size:13px">No users match your search</td></tr>`;
      document.getElementById('table-count').textContent = 'No results';
      updatePagination();
      return;
    }

    tbody.innerHTML = users.map(u => {
      const status   = displayStatus(u);
      const color    = COLORS[u.id % COLORS.length];
      const initials = u.name.split(' ').map(n => (n[0] || '')).join('').toUpperCase().slice(0, 2);
      const joined   = typeof thriveUtils !== 'undefined'
        ? thriveUtils.formatDateShort(new Date(u.created_at))
        : new Date(u.created_at).toLocaleDateString();

      return `
        <tr data-id="${u.id}">
          <td><input type="checkbox" class="row-check user-check" data-id="${u.id}" ${selectedIds.has(u.id) ? 'checked' : ''}></td>
          <td>
            <div class="u-cell">
              <div class="u-av" style="background:${AVBG[color]}">${escapeHtml(initials)}</div>
              <div>
                <div class="u-name">${escapeHtml(u.name)}</div>
                <div class="u-handle">${escapeHtml(u.email)}</div>
              </div>
            </div>
          </td>
          <td>${escapeHtml(u.email)}</td>
          <td>${joined}</td>
          <td style="font-weight:500;color:var(--text)">${u.goal_count}</td>
          <td>${u.streak_days > 0 ? `<span style="color:var(--text-2)">${u.streak_days}d 🔥</span>` : '<span style="color:var(--text-3)">—</span>'}</td>
          <td>${statusBadge(status)}</td>
          <td>${actionBtns(u, status)}</td>
        </tr>`;
    }).join('');

    const showing = users.length;
    document.getElementById('table-count').textContent =
      `Showing ${showing} of ${Number(total).toLocaleString()} users`;

    updatePagination();
    wireRowActions();
    wireCheckboxes();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-3)">Failed to load users. Please refresh.</td></tr>`;
    console.error('Failed to load users:', err);
  }
}

// ── Pagination ────────────────────────────────────────────────────────────────
function updatePagination() {
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  document.getElementById('pg-info').textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById('pg-prev').disabled = currentPage <= 1;
  document.getElementById('pg-next').disabled = currentPage >= totalPages;
}

document.getElementById('pg-prev').addEventListener('click', () => {
  if (currentPage > 1) { currentPage--; render(); }
});
document.getElementById('pg-next').addEventListener('click', () => {
  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);
  if (currentPage < totalPages) { currentPage++; render(); }
});

// ── Row action wiring ─────────────────────────────────────────────────────────
function wireRowActions() {
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id     = +btn.dataset.id;
      const action = btn.dataset.action;
      const row    = btn.closest('tr');
      const name   = row.querySelector('.u-name')?.textContent || 'this user';

      if (action === 'view') {
        // Navigate to admin profile view with userId query param
        window.location.href = `/adminUser/admin-profile.html?userId=${id}`;
        return;
      }
      if (action === 'delete') {
        showModal({
          icon: '🗑️', title: 'Delete account',
          body: `Permanently delete ${name}'s account? This cannot be undone.`,
          confirmLabel: 'Delete account', confirmStyle: '',
          onConfirm: async () => { await callApi(`/api/admin/users/${id}`, 'DELETE'); render(); }
        });
      } else if (action === 'suspend') {
        showModal({
          icon: '⏸️', title: 'Suspend user',
          body: `Suspend ${name}'s account? They will be locked out until reinstated.`,
          confirmLabel: 'Suspend', confirmStyle: 'confirm-amber',
          onConfirm: async () => { await callApi(`/api/admin/users/${id}/suspend`, 'PATCH'); render(); }
        });
      } else if (action === 'reinstate') {
        showModal({
          icon: '✅', title: 'Reinstate user',
          body: `Reinstate ${name}'s account? They will regain full access.`,
          confirmLabel: 'Reinstate', confirmStyle: 'confirm-green',
          onConfirm: async () => { await callApi(`/api/admin/users/${id}/reinstate`, 'PATCH'); render(); }
        });
      }
    });
  });
}

// ── Checkbox & bulk bar ───────────────────────────────────────────────────────
function wireCheckboxes() {
  document.querySelectorAll('.user-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = +cb.dataset.id;
      cb.checked ? selectedIds.add(id) : selectedIds.delete(id);
      updateBulkBar();
    });
  });

  const selectAll = document.getElementById('select-all');
  // Replace listener cleanly by cloning
  const fresh = selectAll.cloneNode(true);
  selectAll.parentNode.replaceChild(fresh, selectAll);
  fresh.addEventListener('change', function () {
    document.querySelectorAll('.user-check').forEach(cb => {
      const id = +cb.dataset.id;
      this.checked ? selectedIds.add(id) : selectedIds.delete(id);
      cb.checked = this.checked;
    });
    updateBulkBar();
  });
}

function updateBulkBar() {
  const bar = document.getElementById('bulk-bar');
  const n   = selectedIds.size;
  document.getElementById('bulk-count').textContent = `${n} user${n !== 1 ? 's' : ''} selected`;
  n > 0 ? bar.classList.add('visible') : bar.classList.remove('visible');
}

document.getElementById('bulk-clear').addEventListener('click', () => {
  selectedIds.clear();
  render();
  updateBulkBar();
});

document.getElementById('bulk-suspend').addEventListener('click', () => {
  showModal({
    icon: '⏸️', title: `Suspend ${selectedIds.size} users`,
    body: 'These users will be locked out until reinstated. Continue?',
    confirmLabel: 'Suspend all', confirmStyle: 'confirm-amber',
    onConfirm: async () => {
      await callApi('/api/admin/users/bulk-suspend', 'POST', { userIds: [...selectedIds] });
      selectedIds.clear();
      render();
      updateBulkBar();
    }
  });
});

document.getElementById('bulk-delete').addEventListener('click', () => {
  showModal({
    icon: '🗑️', title: `Delete ${selectedIds.size} accounts`,
    body: 'This will permanently remove these accounts. This cannot be undone.',
    confirmLabel: 'Delete all', confirmStyle: '',
    onConfirm: async () => {
      await callApi('/api/admin/users/bulk-delete', 'POST', { userIds: [...selectedIds] });
      selectedIds.clear();
      render();
      updateBulkBar();
    }
  });
});

// ── Filter buttons ────────────────────────────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    currentPage   = 1;
    render();
  });
});

// ── Search (debounced) ────────────────────────────────────────────────────────
document.getElementById('user-search').addEventListener('input', function () {
  searchTerm = this.value;
  currentPage = 1;
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(render, 300);
});

// ── Init ──────────────────────────────────────────────────────────────────────
render();
