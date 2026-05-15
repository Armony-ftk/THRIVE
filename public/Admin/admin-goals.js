const GOALS = [
  { id:1,  title:'Run a 5K in under 25 minutes',          user:'@jamiekim',    category:'fitness',  progress:72, users:1840, flagged:false, emoji:'🏃', fill:'fill-green',  color:'#064e3b' },
  { id:2,  title:'Read 24 books this year',               user:'@sofialara',   category:'learning', progress:45, users:2310, flagged:false, emoji:'📚', fill:'fill-blue',   color:'#1e3a8a' },
  { id:3,  title:'Save $10,000 emergency fund',           user:'@priyanair',   category:'finance',  progress:60, users:980,  flagged:false, emoji:'💰', fill:'fill-amber',  color:'#78350f' },
  { id:4,  title:'Make quick cash online fast',           user:'@unknown44',   category:'finance',  progress:10, users:12,   flagged:true,  emoji:'⚠️', fill:'fill-red',    color:'#991b1b' },
  { id:5,  title:'Complete AWS Solutions Architect cert', user:'@ethanb',      category:'learning', progress:38, users:560,  flagged:false, emoji:'☁️', fill:'fill-blue',   color:'#1e3a8a' },
  { id:6,  title:'Lose 20kg in 2 weeks no food',          user:'@health99',    category:'fitness',  progress:5,  users:3,    flagged:true,  emoji:'⚠️', fill:'fill-red',    color:'#991b1b' },
  { id:7,  title:'Build a side project earning $1K/mo',   user:'@zoemar',      category:'finance',  progress:28, users:1420, flagged:false, emoji:'🚀', fill:'fill-amber',  color:'#78350f' },
  { id:8,  title:'Meditate for 30 days straight',         user:'@aishao',      category:'fitness',  progress:90, users:3200, flagged:false, emoji:'🧘', fill:'fill-green',  color:'#064e3b' },
  { id:9,  title:'Get revenge on my ex by April',         user:'@user_2891',   category:'learning', progress:0,  users:1,    flagged:true,  emoji:'⚠️', fill:'fill-red',    color:'#991b1b' },
  { id:10, title:'Learn conversational Spanish in 6 months', user:'@clarav',   category:'learning', progress:55, users:4100, flagged:false, emoji:'🗣️', fill:'fill-blue',   color:'#1e3a8a' },
];

let gFilter = 'all';
let gSearch = '';

function catClass(cat, flagged) {
  if (flagged) return 'cat-flagged';
  return { fitness:'cat-fitness', learning:'cat-learning', finance:'cat-finance', career:'cat-career' }[cat] || '';
}

function renderGoals() {
  const list = GOALS.filter(g => {
    const mf = gFilter === 'all' || (gFilter === 'flagged' ? g.flagged : g.category === gFilter);
    const q  = gSearch.toLowerCase();
    const ms = !q || g.title.toLowerCase().includes(q) || g.user.includes(q);
    return mf && ms;
  });

  const container = document.getElementById('goals-list');
  if (!list.length) {
    container.innerHTML = `<div class="card card-pad" style="text-align:center;padding:40px;color:var(--text-3)">No goals match your search</div>`;
    return;
  }

  container.innerHTML = list.map(g => `
    <div class="card goal-admin-card ${g.flagged ? 'flag-card flag-urgent' : ''}" id="goal-${g.id}">
      <div class="goal-admin-header">
        <div class="goal-admin-left">
          <span class="goal-emoji">${g.emoji}</span>
          <div>
            <div class="goal-admin-title">${g.title}</div>
            <div class="goal-admin-meta">by ${g.user} &nbsp;·&nbsp; ${g.category}</div>
          </div>
        </div>
        <div class="goal-admin-right">
          <span class="cat-badge ${catClass(g.category, g.flagged)}">${g.flagged ? 'Flagged' : g.category}</span>
          ${g.flagged
            ? `<button class="act-btn delete" data-gid="${g.id}" title="Remove goal"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M7 8v4M9 8v4M4 5l1 9h6l1-9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`
            : `<button class="act-btn suspend" data-gid="${g.id}" title="Flag goal"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 2v12M3 2h8l-2 4 2 4H3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
               <button class="act-btn delete" data-gid="${g.id}" title="Remove goal"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M7 8v4M9 8v4M4 5l1 9h6l1-9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`
          }
        </div>
      </div>
      <div class="goal-stats" style="margin-bottom:14px">
        <div class="goal-stat">
          <div class="goal-stat-val" style="color:${g.color}">${g.users.toLocaleString()}</div>
          <div class="goal-stat-label">Users with goal</div>
        </div>
        <div class="goal-stat">
          <div class="goal-stat-val" style="color:${g.color}">${g.progress}%</div>
          <div class="goal-stat-label">Avg. progress</div>
        </div>
      </div>
      <div class="goal-progress-row">
        <div class="progress-track"><div class="progress-fill ${g.fill}" style="width:0" data-w="${g.progress}%"></div></div>
        <span class="pct-label">${g.progress}%</span>
      </div>
    </div>
  `).join('');

  // Animate progress bars
  setTimeout(() => {
    document.querySelectorAll('.progress-fill[data-w]').forEach(el => {
      el.style.width = el.dataset.w;
    });
  }, 80);

  wireGoalActions();
}

function wireGoalActions() {
  document.querySelectorAll('[data-gid]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = +btn.dataset.gid;
      const goal = GOALS.find(g => g.id === id);
      const isDelete = btn.classList.contains('delete');
      if (isDelete) {
        showModal({
          icon: '🗑️',
          title: 'Remove goal',
          body: `Remove "${goal.title}"? This will be deleted from all ${goal.users.toLocaleString()} users' accounts.`,
          confirmLabel: 'Remove goal',
          confirmStyle: '',
          onConfirm: () => {
            GOALS.splice(GOALS.indexOf(goal), 1);
            renderGoals();
          }
        });
      } else {
        showModal({
          icon: '🚩',
          title: 'Flag goal',
          body: `Flag "${goal.title}" for review? It will be marked and reviewed by the moderation team.`,
          confirmLabel: 'Flag goal',
          confirmStyle: 'confirm-amber',
          onConfirm: () => {
            goal.flagged = true;
            renderGoals();
          }
        });
      }
    });
  });
}

// Filters
document.querySelectorAll('[data-gfilter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-gfilter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gFilter = btn.dataset.gfilter;
    renderGoals();
  });
});

document.getElementById('goal-search').addEventListener('input', function() {
  gSearch = this.value;
  renderGoals();
});

renderGoals();