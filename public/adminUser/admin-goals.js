/* ═══════════════════════════════════════════════════════════════
   admin-goals.js  –  dynamic, API-driven goal management table
   ═══════════════════════════════════════════════════════════════ */

// ── Category config ───────────────────────────────────────────────────────────
const CAT_EMOJI = { fitness: '🏃', learning: '📚', finance: '💰', career: '🚀', health: '🧘' };
const CAT_COLOR = { fitness: '#064e3b', learning: '#1e3a8a', finance: '#78350f', career: '#4c1d95', health: '#064e3b' };
const CAT_FILL  = { fitness: 'fill-green', learning: 'fill-blue', finance: 'fill-amber', career: 'fill-blue', health: 'fill-green' };
const CAT_BADGE = { fitness: 'cat-fitness', learning: 'cat-learning', finance: 'cat-finance', career: 'cat-career', health: 'cat-fitness' };

// ── State ─────────────────────────────────────────────────────────────────────
let gFilter   = 'all';
let gSearch   = '';
let gDebounce = null;
const PAGE_SIZE = 50;

// ── Helpers ───────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function catEmoji(cat) { return CAT_EMOJI[cat]  || '🎯'; }
function catColor(cat) { return CAT_COLOR[cat]  || '#1e3a8a'; }
function catFill(cat)  { return CAT_FILL[cat]   || 'fill-blue'; }
function catBadge(cat) { return CAT_BADGE[cat]  || ''; }

// ── API ───────────────────────────────────────────────────────────────────────
async function callApi(url, method = 'GET') {
  const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' } });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Request failed');
  return data;
}

// ── Stats ─────────────────────────────────────────────────────────────────────
async function loadGoalStats() {
  try {
    const { stats } = await callApi('/api/admin/goals/stats');
    setText('gsm-total',     Number(stats.total_goals     || 0).toLocaleString());
    setText('gsm-active',    Number(stats.active_goals    || 0).toLocaleString());
    setText('gsm-completed', Number(stats.completed_goals || 0).toLocaleString());
    setText('gsm-cancelled', Number(stats.cancelled_goals || 0).toLocaleString());
  } catch (err) {
    console.error('Failed to load goal stats:', err);
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── Goals list ────────────────────────────────────────────────────────────────
async function renderGoals() {
  const container = document.getElementById('goals-list');
  container.innerHTML = `<div class="card card-pad" style="text-align:center;padding:40px;color:var(--text-3)">Loading…</div>`;

  try {
    const params = new URLSearchParams({ page: 1, pageSize: PAGE_SIZE, category: gFilter, search: gSearch });
    const { goals } = await callApi(`/api/admin/goals?${params}`);

    if (!goals.length) {
      container.innerHTML = `<div class="card card-pad" style="text-align:center;padding:40px;color:var(--text-3)">No goals match your search</div>`;
      return;
    }

    container.innerHTML = goals.map(g => {
      const pct    = g.task_count > 0 ? Math.round((g.completed_tasks / g.task_count) * 100) : 0;
      const cat    = g.category || 'other';
      const color  = catColor(cat);
      const fill   = catFill(cat);
      const badge  = catBadge(cat);
      const emoji  = catEmoji(cat);

      return `
        <div class="card goal-admin-card" id="goal-${g.id}">
          <div class="goal-admin-header">
            <div class="goal-admin-left">
              <span class="goal-emoji">${emoji}</span>
              <div>
                <div class="goal-admin-title">${escapeHtml(g.title)}</div>
                <div class="goal-admin-meta">by ${escapeHtml(g.user_name)} &nbsp;·&nbsp; ${escapeHtml(cat)}</div>
              </div>
            </div>
            <div class="goal-admin-right">
              <span class="cat-badge ${badge}">${escapeHtml(cat)}</span>
              <button class="act-btn delete" data-gid="${g.id}" data-gtitle="${escapeHtml(g.title)}" title="Delete goal">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M7 8v4M9 8v4M4 5l1 9h6l1-9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </div>
          <div class="goal-stats" style="margin-bottom:14px">
            <div class="goal-stat">
              <div class="goal-stat-val" style="color:${color}">${g.task_count}</div>
              <div class="goal-stat-label">Tasks</div>
            </div>
            <div class="goal-stat">
              <div class="goal-stat-val" style="color:${color}">${pct}%</div>
              <div class="goal-stat-label">Completed</div>
            </div>
          </div>
          <div class="goal-progress-row">
            <div class="progress-track">
              <div class="progress-fill ${fill}" style="width:0" data-w="${pct}%"></div>
            </div>
            <span class="pct-label">${pct}%</span>
          </div>
        </div>`;
    }).join('');

    // Animate progress bars
    setTimeout(() => {
      document.querySelectorAll('.progress-fill[data-w]').forEach(el => { el.style.width = el.dataset.w; });
    }, 80);

    wireGoalActions();
  } catch (err) {
    container.innerHTML = `<div class="card card-pad" style="text-align:center;padding:40px;color:var(--text-3)">Failed to load goals. Please refresh.</div>`;
    console.error('Failed to load goals:', err);
  }
}

function wireGoalActions() {
  document.querySelectorAll('[data-gid]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id    = +btn.dataset.gid;
      const title = btn.dataset.gtitle || 'this goal';
      showModal({
        icon:         '🗑️',
        title:        'Delete goal',
        body:         `Permanently delete "${title}"? All tasks and progress will also be removed.`,
        confirmLabel: 'Delete goal',
        confirmStyle: '',
        onConfirm: async () => {
          try {
            await callApi(`/api/admin/goals/${id}`, 'DELETE');
            renderGoals();
            loadGoalStats();
          } catch (err) {
            console.error('Failed to delete goal:', err);
          }
        }
      });
    });
  });
}

// ── Filter buttons ─────────────────────────────────────────────────────────────
document.querySelectorAll('[data-gfilter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-gfilter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gFilter = btn.dataset.gfilter;
    renderGoals();
  });
});

// ── Search (debounced) ────────────────────────────────────────────────────────
document.getElementById('goal-search').addEventListener('input', function () {
  gSearch = this.value;
  clearTimeout(gDebounce);
  gDebounce = setTimeout(renderGoals, 300);
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadGoalStats();
renderGoals();