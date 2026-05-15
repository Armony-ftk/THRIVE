const COLORS = ['av-blue','av-teal','av-amber','av-purple'];
const AVBG = { 'av-blue':'linear-gradient(135deg,#3b82f6,#1d4ed8)', 'av-teal':'linear-gradient(135deg,#10b981,#059669)', 'av-amber':'linear-gradient(135deg,#f59e0b,#d97706)', 'av-purple':'linear-gradient(135deg,#8b5cf6,#6d28d9)' };

const USERS = [
  { id:1, name:'Jamie Kim',      handle:'@jamiekim',    email:'jamie@email.com',    joined:'Apr 20, 2026', goals:3, streak:7,  status:'active',    color:'av-blue' },
  { id:2, name:'Sofia Lara',     handle:'@sofialara',   email:'sofia@email.com',    joined:'Apr 19, 2026', goals:5, streak:14, status:'active',    color:'av-teal' },
  { id:3, name:'Marcus Reed',    handle:'@marcusreed',  email:'marcus@email.com',   joined:'Apr 18, 2026', goals:2, streak:0,  status:'suspended', color:'av-amber' },
  { id:4, name:'Priya Nair',     handle:'@priyanair',   email:'priya@email.com',    joined:'Apr 17, 2026', goals:4, streak:21, status:'active',    color:'av-purple' },
  { id:5, name:'Lucas Ferreira', handle:'@lucasf',      email:'lucas@email.com',    joined:'Apr 16, 2026', goals:6, streak:3,  status:'new',       color:'av-blue' },
  { id:6, name:'Aisha Okafor',   handle:'@aishao',      email:'aisha@email.com',    joined:'Apr 15, 2026', goals:2, streak:9,  status:'active',    color:'av-teal' },
  { id:7, name:'Tom Higgins',    handle:'@tomh',        email:'tom@email.com',      joined:'Apr 14, 2026', goals:1, streak:0,  status:'suspended', color:'av-amber' },
  { id:8, name:'Mei Lin',        handle:'@meilin',      email:'mei@email.com',      joined:'Apr 13, 2026', goals:7, streak:30, status:'active',    color:'av-purple' },
  { id:9, name:'Ethan Brooks',   handle:'@ethanb',      email:'ethan@email.com',    joined:'Apr 12, 2026', goals:3, streak:5,  status:'new',       color:'av-blue' },
  { id:10,name:'Clara Voss',     handle:'@clarav',      email:'clara@email.com',    joined:'Apr 11, 2026', goals:4, streak:18, status:'active',    color:'av-teal' },
  { id:11,name:'Ravi Sharma',    handle:'@ravis',       email:'ravi@email.com',     joined:'Apr 10, 2026', goals:2, streak:0,  status:'suspended', color:'av-amber' },
  { id:12,name:'Zoe Marchetti',  handle:'@zoemar',      email:'zoe@email.com',      joined:'Apr 9, 2026',  goals:5, streak:12, status:'active',    color:'av-purple' },
];

let currentFilter = 'all';
let searchTerm = '';
const selectedIds = new Set();

function statusBadge(status) {
  const map = { active:'s-active', suspended:'s-suspended', new:'s-new' };
  return `<span class="status-badge ${map[status]||'s-active'}">${status}</span>`;
}

function actionBtns(user) {
  const view = `<button class="act-btn view" data-id="${user.id}" data-action="view" title="View profile"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg></button>`;
  const del  = `<button class="act-btn delete" data-id="${user.id}" data-action="delete" title="Delete user"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M7 8v4M9 8v4M4 5l1 9h6l1-9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
  if (user.status === 'suspended') {
    const reinstate = `<button class="act-btn reinstate" data-id="${user.id}" data-action="reinstate" title="Reinstate user"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8a5 5 0 1 0 2-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M3 4v4h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
    return `<div class="action-group">${view}${reinstate}${del}</div>`;
  }
  const suspend = `<button class="act-btn suspend" data-id="${user.id}" data-action="suspend" title="Suspend user"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><rect x="6" y="5" width="1.3" height="6" rx=".65" fill="currentColor"/><rect x="8.7" y="5" width="1.3" height="6" rx=".65" fill="currentColor"/></svg></button>`;
  return `<div class="action-group">${view}${suspend}${del}</div>`;
}

function getFiltered() {
  return USERS.filter(u => {
    const matchFilter = currentFilter === 'all' || u.status === currentFilter;
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.handle.includes(q) || u.email.includes(q);
    return matchFilter && matchSearch;
  });
}

function render() {
  const list = getFiltered();
  const tbody = document.getElementById('user-tbody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-3);font-size:13px">No users match your search</td></tr>`;
    document.getElementById('table-count').textContent = 'No results';
    return;
  }
  tbody.innerHTML = list.map(u => `
    <tr data-id="${u.id}" class="${u._removed ? 'fading' : ''}">
      <td><input type="checkbox" class="row-check user-check" data-id="${u.id}" ${selectedIds.has(u.id)?'checked':''}></td>
      <td><div class="u-cell"><div class="u-av" style="background:${AVBG[u.color]}">${u.name.split(' ').map(n=>n[0]).join('')}</div><div><div class="u-name">${u.name}</div><div class="u-handle">${u.handle}</div></div></div></td>
      <td>${u.email}</td>
      <td>${u.joined}</td>
      <td style="font-weight:500;color:var(--text)">${u.goals}</td>
      <td>${u.streak > 0 ? `<span style="color:var(--text-2)">${u.streak}d 🔥</span>` : '<span style="color:var(--text-3)">—</span>'}</td>
      <td>${statusBadge(u.status)}</td>
      <td>${actionBtns(u)}</td>
    </tr>
  `).join('');
  document.getElementById('table-count').textContent = `Showing ${list.length} of 2,841 users`;
  wireRowActions();
  wireCheckboxes();
}

function wireRowActions() {
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = +btn.dataset.id;
      const user = USERS.find(u => u.id === id);
      const action = btn.dataset.action;
      if (action === 'delete') {
        showModal({ icon:'🗑️', title:'Delete account', body:`Permanently delete ${user.name}'s account? This cannot be undone.`, confirmLabel:'Delete account', confirmStyle:'', onConfirm:() => {
          USERS.splice(USERS.indexOf(user), 1); render();
        }});
      } else if (action === 'suspend') {
        showModal({ icon:'⏸️', title:'Suspend user', body:`Suspend ${user.name}'s account? They will be locked out until reinstated.`, confirmLabel:'Suspend', confirmStyle:'confirm-amber', onConfirm:() => {
          user.status = 'suspended'; user.streak = 0; render();
        }});
      } else if (action === 'reinstate') {
        showModal({ icon:'✅', title:'Reinstate user', body:`Reinstate ${user.name}'s account? They will regain full access.`, confirmLabel:'Reinstate', confirmStyle:'confirm-green', onConfirm:() => {
          user.status = 'active'; render();
        }});
      }
    });
  });
}

function wireCheckboxes() {
  document.querySelectorAll('.user-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = +cb.dataset.id;
      cb.checked ? selectedIds.add(id) : selectedIds.delete(id);
      updateBulkBar();
    });
  });
  document.getElementById('select-all').addEventListener('change', function() {
    getFiltered().forEach(u => this.checked ? selectedIds.add(u.id) : selectedIds.delete(u.id));
    render();
  });
}

function updateBulkBar() {
  const bar = document.getElementById('bulk-bar');
  const n = selectedIds.size;
  document.getElementById('bulk-count').textContent = `${n} user${n!==1?'s':''} selected`;
  n > 0 ? bar.classList.add('visible') : bar.classList.remove('visible');
}

document.getElementById('bulk-clear').addEventListener('click', () => { selectedIds.clear(); render(); updateBulkBar(); });
document.getElementById('bulk-suspend').addEventListener('click', () => {
  showModal({ icon:'⏸️', title:`Suspend ${selectedIds.size} users`, body:'These users will be locked out until reinstated. Continue?', confirmLabel:'Suspend all', confirmStyle:'confirm-amber', onConfirm:() => {
    selectedIds.forEach(id => { const u = USERS.find(u=>u.id===id); if(u) { u.status='suspended'; u.streak=0; } });
    selectedIds.clear(); render(); updateBulkBar();
  }});
});
document.getElementById('bulk-delete').addEventListener('click', () => {
  showModal({ icon:'🗑️', title:`Delete ${selectedIds.size} accounts`, body:'This will permanently remove these accounts. This cannot be undone.', confirmLabel:'Delete all', confirmStyle:'', onConfirm:() => {
    selectedIds.forEach(id => { const i = USERS.findIndex(u=>u.id===id); if(i>-1) USERS.splice(i,1); });
    selectedIds.clear(); render(); updateBulkBar();
  }});
});

// filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

// search
document.getElementById('user-search').addEventListener('input', function() {
  searchTerm = this.value;
  render();
});

// pagination buttons (visual only — full implementation would paginate USERS array)
document.getElementById('pg-next').addEventListener('click', function() {
  document.getElementById('pg-prev').disabled = false;
  document.getElementById('pg-info').textContent = 'Page 2 of 237';
  this.disabled = false;
});
document.getElementById('pg-prev').addEventListener('click', function() {
  document.getElementById('pg-info').textContent = 'Page 1 of 237';
  this.disabled = true;
});

// init
render();