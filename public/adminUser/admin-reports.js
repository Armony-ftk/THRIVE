/* ═══════════════════════════════════════════════════════════════
   admin-reports.js  –  dynamic, API-driven analytics dashboard
   ═══════════════════════════════════════════════════════════════ */

// ── Config ────────────────────────────────────────────────────────────────────
const CAT_COLOR = {
  fitness:  '#10b981',
  learning: '#3b82f6',
  finance:  '#f59e0b',
  career:   '#8b5cf6',
  health:   '#10b981',
  other:    '#6b7280',
};
const CAT_BADGE = {
  fitness:  'cat-fitness',
  learning: 'cat-learning',
  finance:  'cat-finance',
  career:   'cat-career',
  health:   'cat-fitness',
};
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// SVG donut: circumference of radius-40 circle
const CIRC = 2 * Math.PI * 40; // ≈ 251.33

let currentDays = 7;

// ── Helpers ───────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function catColor(cat) { return CAT_COLOR[cat] || '#6b7280'; }
function catBadge(cat) { return CAT_BADGE[cat] || ''; }

// ── API fetch ─────────────────────────────────────────────────────────────────
async function loadReports() {
  try {
    const res  = await fetch(`/api/admin/reports?days=${currentDays}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await res.json();
    if (!body.success) throw new Error(body.error || 'Request failed');
    renderAll(body.data);
  } catch (err) {
    console.error('Failed to load reports:', err);
  }
}

// ── Render orchestrator ───────────────────────────────────────────────────────
function renderAll(data) {
  renderStats(data.stats);
  renderSignupsChart(data.signups);
  renderDonut(data.categories);
  renderTopGoals(data.topGoals);
  renderMetrics(data.metrics);
}

// ── (1) Top stat cards ────────────────────────────────────────────────────────
function renderStats(stats) {
  setText('rpt-total-users',  Number(stats.total_users  || 0).toLocaleString());
  setText('rpt-new-users-sub', `↑ ${Number(stats.new_users_week || 0).toLocaleString()} new this week`);
  setText('rpt-daily-active', Number(stats.daily_active || 0).toLocaleString());
  setText('rpt-active-goals', Number(stats.active_goals || 0).toLocaleString());
}

// ── (2) Bar chart: signups per day ────────────────────────────────────────────
function renderSignupsChart(signups) {
  const chart = document.getElementById('signups-chart');
  const title = document.getElementById('signups-chart-title');
  if (title) title.textContent = `New signups — ${currentDays} days`;
  if (!chart) return;

  // Map DB rows to date → count
  const byDate = {};
  signups.forEach(r => {
    const key = String(r.signup_date).split('T')[0];
    byDate[key] = r.signup_count;
  });

  // Build the last N calendar days (newest last)
  const days = [];
  for (let i = currentDays - 1; i >= 0; i--) {
    const d   = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ date: d, count: byDate[key] || 0, isToday: i === 0 });
  }

  const maxCount = Math.max(...days.map(d => d.count), 1);

  chart.innerHTML = days.map(({ date, count, isToday }) => {
    const pct   = Math.round((count / maxCount) * 100);
    const label = DAY_LABELS[date.getDay()];
    return `
      <div class="bcf-col${isToday ? ' highlight' : ''}">
        <div class="bcf-bar" style="--h:0%" data-h="${pct}%"></div>
        <span class="bcf-label">${label}</span>
        <span class="bcf-val">${count}</span>
      </div>`;
  }).join('');

  // Animate bars after next paint
  setTimeout(() => {
    chart.querySelectorAll('.bcf-bar[data-h]').forEach(el => {
      el.style.setProperty('--h', el.dataset.h);
    });
  }, 100);
}

// ── (3) Donut: goals by category ──────────────────────────────────────────────
function renderDonut(categories) {
  if (!categories || categories.length === 0) return;

  // Take top 4 categories; pad with empty entries if fewer than 4
  const FALLBACK_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
  const top4 = categories.slice(0, 4);
  while (top4.length < 4) top4.push({ category: 'other', pct: 0, count: 0 });

  // Update the 4 SVG circles (segments) using stroke-dasharray + dashoffset
  let cumLen = 0;
  top4.forEach((seg, i) => {
    const circle = document.getElementById(`donut-seg-${i}`);
    if (!circle) return;
    const arcLen = (seg.pct / 100) * CIRC;
    const gap    = CIRC - arcLen;
    circle.setAttribute('stroke', catColor(seg.category) || FALLBACK_COLORS[i]);
    circle.setAttribute('stroke-dasharray',  `${arcLen.toFixed(1)} ${gap.toFixed(1)}`);
    circle.setAttribute('stroke-dashoffset', `${(-cumLen).toFixed(1)}`);
    cumLen += arcLen;
  });

  // Update centre total label
  const totalAll = categories.reduce((s, c) => s + (c.count || 0), 0);
  setText('donut-total', totalAll >= 1000
    ? `${(totalAll / 1000).toFixed(1)}K`
    : String(totalAll));

  // Rebuild legend
  const legend = document.getElementById('donut-legend');
  if (legend) {
    legend.innerHTML = top4.map((seg, i) => {
      const color = catColor(seg.category) || FALLBACK_COLORS[i];
      const label = seg.category.charAt(0).toUpperCase() + seg.category.slice(1);
      return `
        <div class="dl-row">
          <div class="dl-dot" style="background:${color}"></div>
          ${escapeHtml(label)} — ${seg.pct}%
        </div>`;
    }).join('');
  }
}

// ── (4) Most-engaged goals table ──────────────────────────────────────────────
function renderTopGoals(topGoals) {
  const tbody = document.getElementById('top-goals-tbody');
  if (!tbody) return;

  if (!topGoals || topGoals.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;padding:20px;color:var(--text-3)">
          No goals yet
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = topGoals.map((g, i) => {
    const cat   = g.category || 'other';
    const badge = catBadge(cat);
    const pct   = g.task_count > 0
      ? Math.round((g.completed_tasks / g.task_count) * 100)
      : 0;
    return `
      <tr>
        <td><span class="rank-num">${i + 1}</span></td>
        <td style="color:var(--text);font-weight:500">${escapeHtml(g.title)}</td>
        <td><span class="cat-badge ${badge}">${escapeHtml(cat)}</span></td>
        <td>${g.task_count}</td>
        <td>${pct}%</td>
      </tr>`;
  }).join('');
}

// ── (5) Platform metrics severity bars ────────────────────────────────────────
function renderMetrics(metrics) {
  const container = document.getElementById('metrics-container');
  if (!container) return;

  const rows = [
    { label: 'Goals created',   value: Number(metrics.goals_created   || 0), color: '#3b82f6' },
    { label: 'Goals completed', value: Number(metrics.goals_completed || 0), color: '#10b981' },
    { label: 'Goals cancelled', value: Number(metrics.goals_cancelled || 0), color: '#f59e0b' },
    { label: 'New users',       value: Number(metrics.new_users       || 0), color: '#8b5cf6' },
    { label: 'Tasks completed', value: Number(metrics.tasks_completed || 0), color: '#6b7280' },
  ];

  const absMax = Math.max(...rows.map(r => r.value), 1);

  container.innerHTML = rows.map(r => {
    const pct = Math.round((r.value / absMax) * 100);
    return `
      <div class="severity-row">
        <span class="sev-label">${escapeHtml(r.label)}</span>
        <div class="sev-bar-wrap">
          <div class="sev-bar">
            <div class="sev-fill" style="width:0;background:${r.color};transition:width 1.1s ease"
              data-w="${pct}%"></div>
          </div>
        </div>
        <span class="sev-num" style="color:var(--text)">${r.value.toLocaleString()}</span>
      </div>`;
  }).join('');

  // Animate fills
  setTimeout(() => {
    container.querySelectorAll('.sev-fill[data-w]').forEach(el => {
      el.style.width = el.dataset.w;
    });
  }, 120);
}

// ── Filter buttons ─────────────────────────────────────────────────────────────
document.querySelectorAll('.filter-btn[data-days]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn[data-days]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentDays = parseInt(btn.dataset.days) || 7;
    loadReports();
  });
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadReports();
