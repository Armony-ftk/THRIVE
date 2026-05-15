/* ═══════════════════════════════════════════════
   thrive — shared nav + background script
   Include at bottom of every page
═══════════════════════════════════════════════ */

/* ── Aurora canvas ──────────────────────────── */
(function () {
  const cv = document.getElementById('aurora');
  if (!cv) return;
  const cx = cv.getContext('2d');
  let W, H, t = 0;
  function resize() { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  const stops = [[232,228,255],[212,232,255],[220,252,231],[255,228,230],[224,242,255],[245,228,255]];
  const lerp = (a, b, t) => a + (b - a) * t;
  const lc   = (c1, c2, t) => [lerp(c1[0],c2[0],t), lerp(c1[1],c2[1],t), lerp(c1[2],c2[2],t)];
  const rgba = (c, a = 1) => `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
  const bands = [[167,139,250,.22],[52,211,153,.18],[96,165,250,.20],[251,113,133,.17],[196,181,253,.18]];
  function draw() {
    cx.clearRect(0, 0, W, H);
    const sp = 0.00024, s = (Math.sin(t*sp)+1)/2;
    const c1 = lc(stops[0],stops[2],s);
    const c2 = lc(stops[1],stops[4],(Math.sin(t*sp*1.3+1)+1)/2);
    const c3 = lc(stops[3],stops[5],(Math.cos(t*sp*.7)+1)/2);
    const bg = cx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,rgba(c1)); bg.addColorStop(.45,rgba(c2)); bg.addColorStop(1,rgba(c3));
    cx.fillStyle = bg; cx.fillRect(0,0,W,H);
    bands.forEach(([r,g,b,a],i) => {
      const x=W*(0.1+i*0.2+Math.sin(t*0.00021+i*1.2)*0.13);
      const y=H*(0.14+Math.cos(t*0.00017+i*0.8)*0.32);
      const rx=W*(0.26+Math.sin(t*0.00029+i)*0.09);
      const ry=H*(0.19+Math.cos(t*0.00031+i*.5)*0.07);
      const mx=Math.max(rx,ry);
      const grd=cx.createRadialGradient(x,y,0,x,y,mx);
      grd.addColorStop(0,`rgba(${r},${g},${b},${a})`);
      grd.addColorStop(.5,`rgba(${r},${g},${b},${a*.38})`);
      grd.addColorStop(1,`rgba(${r},${g},${b},0)`);
      cx.save(); cx.translate(x,y); cx.scale(rx/mx,ry/mx);
      cx.beginPath(); cx.arc(0,0,mx,0,Math.PI*2);
      cx.fillStyle=grd; cx.fill(); cx.restore();
    });
    t++; requestAnimationFrame(draw);
  }
  draw();
})();

/* ── Particle system ────────────────────────── */
(function () {
  const cv = document.getElementById('particles');
  if (!cv) return;
  const cx = cv.getContext('2d');
  let W, H;
  function resize() { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; }
  resize(); window.addEventListener('resize', resize);
  const pal = [[139,92,246],[43,191,164],[96,165,250],[240,96,122],[196,181,253]];
  const pts = Array.from({length:52}, () => {
    const c = pal[Math.floor(Math.random()*pal.length)];
    return { x:Math.random()*window.innerWidth, y:Math.random()*window.innerHeight,
      vx:(Math.random()-.5)*.28, vy:-(Math.random()*.42+.08),
      r:Math.random()*2.6+.7, a:Math.random()*.42+.1, c, life:Math.random()*Math.PI*2 };
  });
  function draw() {
    cx.clearRect(0,0,W,H);
    pts.forEach(p => {
      p.life+=.011; p.x+=p.vx; p.y+=p.vy;
      if(p.y<-8) p.y=H+8; if(p.x<-8) p.x=W+8; if(p.x>W+8) p.x=-8;
      const a=p.a*(.55+.45*Math.sin(p.life));
      cx.beginPath(); cx.arc(p.x,p.y,p.r,0,Math.PI*2);
      cx.fillStyle=`rgba(${p.c[0]},${p.c[1]},${p.c[2]},${a})`; cx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ── Progress bars ──────────────────────────── */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelectorAll('.progress-fill[data-w]').forEach(el => {
      el.style.width = el.dataset.w;
    });
  }, 480);
});

/* ── Checkbox toggle ────────────────────────── */
document.querySelectorAll('.task-check:not(.done)').forEach(cb => {
  cb.addEventListener('click', () => {
    cb.classList.toggle('done');
    const label = cb.nextElementSibling;
    if (cb.classList.contains('done')) {
      cb.innerHTML = `<svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      label?.classList.add('done');
    } else { cb.innerHTML = ''; label?.classList.remove('done'); }
  });
});