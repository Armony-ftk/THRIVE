const FLAGS = [
  { id:1, title:'Make quick cash online fast', user:'@unknown44', handle:'unkown_user44', time:'2h ago', type:'Spam / scam', severity:'urgent', quote:'Make quick cash online fast', reportCount:7 },
  { id:2, title:'Lose 20kg in 2 weeks no food', user:'@health99', handle:'healthseeker99', time:'5h ago', type:'Harmful content', severity:'urgent', quote:'Lose 20kg in 2 weeks no food', reportCount:12 },
  { id:3, title:'Get revenge on my ex by April', user:'@user_2891', handle:'user_2891', time:'9h ago', type:'Harmful content', severity:'urgent', quote:'Get revenge on my ex by April', reportCount:4 },
  { id:4, title:'Buy followers to look popular', user:'@clickfarm_a', handle:'clickfarm_a', time:'11h ago', type:'Spam / scam', severity:'urgent', quote:'Buy followers to look popular', reportCount:3 },
  { id:5, title:'Manifest wealth by doing nothing', user:'@manifester22', handle:'manifester22', time:'1d ago', type:'Misinformation', severity:'moderate', quote:'Manifest wealth by doing nothing', reportCount:2 },
  { id:6, title:'Cure anxiety without any therapy or meds', user:'@selfhelp_bro', handle:'selfhelp_bro', time:'1d ago', type:'Misinformation', severity:'moderate', quote:'Cure anxiety without any therapy or meds', reportCount:5 },
  { id:7, title:'Complete a 72-hour fast monthly', user:'@fasting_king', handle:'fasting_king', time:'2d ago', type:'Harmful content', severity:'moderate', quote:'Complete a 72-hour fast monthly', reportCount:8 },
  { id:8, title:'Go off-grid and avoid all taxes', user:'@freemind99', handle:'freemind99', time:'2d ago', type:'Off-platform', severity:'moderate', quote:'Go off-grid and avoid all taxes', reportCount:1 },
  { id:9, title:'Invest all savings in meme coins', user:'@cryptobro_x', handle:'cryptobro_x', time:'3d ago', type:'Misinformation', severity:'moderate', quote:'Invest all savings in meme coins', reportCount:6 },
];

let currentFFilter = 'all';

function renderFlags() {
  const list = FLAGS.filter(f => currentFFilter === 'all' || f.severity === currentFFilter);
  const container = document.getElementById('flags-list');

  container.innerHTML = list.map(f => `
    <div class="card flag-card flag-${f.severity}" id="flag-${f.id}">
      <div class="flag-header">
        <div>
          <div class="flag-title-text">${f.title}</div>
          <div class="flag-meta-row">
            <span class="flag-dot" style="background:${f.severity==='urgent'?'var(--red)':'var(--amber)'}"></span>
            <span>${f.type}</span>
            <span>·</span>
            <span>${f.reportCount} report${f.reportCount!==1?'s':''}</span>
          </div>
        </div>
        <span class="cat-badge ${f.severity==='urgent'?'cat-flagged':''}\" style="${f.severity==='moderate'?'background:var(--amber-light);color:#92400e;border:1px solid var(--amber-mid)':''}">${f.severity}</span>
      </div>
      <div class="flag-quote ${f.severity==='moderate'?'q-amber':''}">"${f.quote}"</div>
      <div class="flag-footer">
        <div class="flag-meta-row">
          <span>By <strong style="color:var(--text)">@${f.handle}</strong></span>
          <span>·</span>
          <span>${f.time}</span>
        </div>
        <div style="display:flex;gap:7px">
          <button class="act-btn suspend" data-fid="${f.id}" data-faction="suspend" title="Suspend user" style="width:auto;padding:6px 12px;font-size:11px;font-weight:600;gap:5px;display:flex;align-items:center">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><rect x="6" y="5" width="1.3" height="6" rx=".65" fill="currentColor"/><rect x="8.7" y="5" width="1.3" height="6" rx=".65" fill="currentColor"/></svg>
            Suspend user
          </button>
          <button class="act-btn delete" data-fid="${f.id}" data-faction="remove" title="Remove goal" style="width:auto;padding:6px 12px;font-size:11px;font-weight:600;gap:5px;display:flex;align-items:center">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M7 8v4M9 8v4M4 5l1 9h6l1-9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Remove goal
          </button>
          <button class="act-btn dismiss" data-fid="${f.id}" data-faction="dismiss" title="Dismiss flag" style="width:auto;padding:6px 12px;font-size:11px;font-weight:500;gap:5px;display:flex;align-items:center">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  `).join('');

  updateCounts();
  wireFlagActions();

  // animate sev bars
  setTimeout(() => {
    document.querySelectorAll('.sev-fill[data-w]').forEach(el => { el.style.width = el.dataset.w; });
  }, 120);
}

function updateCounts() {
  document.getElementById('fc-all').textContent     = FLAGS.length;
  document.getElementById('fc-urgent').textContent  = FLAGS.filter(f=>f.severity==='urgent').length;
  document.getElementById('fc-moderate').textContent= FLAGS.filter(f=>f.severity==='moderate').length;
}

function wireFlagActions() {
  document.querySelectorAll('[data-fid]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id     = +btn.dataset.fid;
      const action = btn.dataset.faction;
      const flag   = FLAGS.find(f => f.id === id);

      if (action === 'remove') {
        showModal({
          icon:'🗑️', title:'Remove goal',
          body:`Remove "${flag.title}" by @${flag.handle}? This will permanently delete it.`,
          confirmLabel:'Remove goal', confirmStyle:'',
          onConfirm:() => { FLAGS.splice(FLAGS.indexOf(flag),1); renderFlags(); }
        });
      } else if (action === 'suspend') {
        showModal({
          icon:'⏸️', title:'Suspend user',
          body:`Suspend @${flag.handle}'s account and remove this flagged goal?`,
          confirmLabel:'Suspend & remove', confirmStyle:'confirm-amber',
          onConfirm:() => { FLAGS.splice(FLAGS.indexOf(flag),1); renderFlags(); }
        });
      } else if (action === 'dismiss') {
        const card = document.getElementById(`flag-${id}`);
        if (card) card.style.cssText = 'opacity:.3;pointer-events:none;transition:opacity .3s';
        setTimeout(() => { FLAGS.splice(FLAGS.indexOf(flag),1); renderFlags(); }, 320);
      }
    });
  });
}

document.querySelectorAll('[data-ffilter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-ffilter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFFilter = btn.dataset.ffilter;
    renderFlags();
  });
});

renderFlags();