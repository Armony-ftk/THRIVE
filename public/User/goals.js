
document.querySelector('.btn-primary').addEventListener('click', function() {
document.getElementById('goal-modal-overlay').classList.add('open');
gmReset();
});

let gmCurrent = 0, gmCat = '', gmTime = '', gmEmoji = 'Well done';

function gmReset() {
gmCurrent = 0; gmCat = ''; gmTime = ''; 
document.querySelectorAll('.gm-step').forEach(s => s.classList.remove('active'));
document.getElementById('gm-step-0').classList.add('active');
document.querySelectorAll('.gm-dot').forEach(d => { d.classList.remove('active','done'); });
document.getElementById('gm-dot-0').classList.add('active');
document.querySelectorAll('.gm-chip, .gm-emoji').forEach(c => c.classList.remove('selected'));
document.getElementById('gm-title').value = '';
document.getElementById('gm-deadline').value = '';
document.getElementById('gm-hours').value = 1;
document.getElementById('gm-hours-val').textContent = '1 hr / day';
document.getElementById('gm-back').style.visibility = 'hidden';
const btn = document.getElementById('gm-next');
btn.textContent = 'Next →'; btn.className = 'gm-btn-next'; btn.onclick = gmNext;
document.getElementById('gm-form').style.display = '';
document.getElementById('gm-success').style.display = 'none';
gmValidate();
}

function gmPickEmoji(el) {
document.querySelectorAll('.gm-emoji').forEach(e => e.classList.remove('selected'));
el.classList.add('selected'); gmEmoji = el.dataset.e;
}

function gmPickChip(el, group) {
const container = group === 'cat' ? document.getElementById('gm-cats') : document.getElementById('gm-times');
container.querySelectorAll('.gm-chip').forEach(c => c.classList.remove('selected'));
el.classList.add('selected');
if (group === 'cat') gmCat = el.textContent; else gmTime = el.textContent;
gmValidate();
}

function gmUpdateHours(v) {
const n = parseFloat(v);
document.getElementById('gm-hours-val').textContent = n === 1 ? '1 hr / day' : n + ' hrs / day';
}

function gmIsValid() {
if (gmCurrent === 0) return document.getElementById('gm-title').value.trim().length > 0;
if (gmCurrent === 1) return gmCat !== '';
if (gmCurrent === 2) return document.getElementById('gm-deadline').value !== '';
if (gmCurrent === 3) return gmTime !== '';
return true;
}

function gmValidate() {
document.getElementById('gm-next').disabled = !gmIsValid();
}

function gmUpdateDots() {
for (let i = 0; i < 5; i++) {
    const d = document.getElementById('gm-dot-' + i);
    d.classList.remove('active','done');
    if (i < gmCurrent) d.classList.add('done');
    else if (i === gmCurrent) d.classList.add('active');
}
}

function gmNext() {
if (!gmIsValid()) return;
if (gmCurrent < 4) {
    document.getElementById('gm-step-' + gmCurrent).classList.remove('active');
    gmCurrent++;
    document.getElementById('gm-step-' + gmCurrent).classList.add('active');
    gmUpdateDots();
    document.getElementById('gm-back').style.visibility = 'visible';
    const btn = document.getElementById('gm-next');
    if (gmCurrent === 4) {
    btn.textContent = '+ Add Goal'; btn.className = 'gm-btn-next gm-btn-add'; btn.onclick = gmAdd;
    } else {
    btn.textContent = 'Next →'; btn.className = 'gm-btn-next'; btn.onclick = gmNext;
    }
    gmValidate();
}
}

function gmPrev() {
if (gmCurrent > 0) {
    document.getElementById('gm-step-' + gmCurrent).classList.remove('active');
    gmCurrent--;
    document.getElementById('gm-step-' + gmCurrent).classList.add('active');
    gmUpdateDots();
    if (gmCurrent === 0) document.getElementById('gm-back').style.visibility = 'hidden';
    const btn = document.getElementById('gm-next');
    btn.textContent = 'Next →'; btn.className = 'gm-btn-next'; btn.onclick = gmNext;
    gmValidate();
}
}

function gmAdd() {
const title = document.getElementById('gm-title').value.trim();
document.getElementById('gm-form').style.display = 'none';
document.getElementById('gm-success').style.display = 'block';
document.getElementById('gm-success-icon').textContent = gmEmoji;
document.getElementById('gm-success-title').textContent = gmEmoji + ' ' + title + ' — added!';
document.getElementById('gm-success-sub').textContent = 'Your new ' + gmCat + ' goal has been created. Head to your Goals page to start tracking.';

}

function gmClose() {
document.getElementById('goal-modal-overlay').classList.remove('open');
}


document.getElementById('goal-modal-overlay').addEventListener('click', function(e) {
if (e.target === this) gmClose();
});
