// Toggles
document.querySelectorAll('.toggle').forEach(tog => {
  tog.addEventListener('click', () => tog.classList.toggle('on'));
});

// Save details
document.getElementById('save-details').addEventListener('click', function() {
  this.textContent = 'Saved ✓';
  this.style.background = 'linear-gradient(135deg,#059669,#10b981)';
  setTimeout(() => {
    this.textContent = 'Save changes';
    this.style.background = '';
  }, 2200);
});

// Password match check
document.getElementById('confirm-pw').addEventListener('input', function() {
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

document.getElementById('save-password').addEventListener('click', function() {
  const np = document.getElementById('new-pw').value;
  const cp = document.getElementById('confirm-pw').value;
  const msg = document.getElementById('pw-msg');
  if (!np || !cp) { msg.style.color='var(--red)'; msg.textContent='Please fill in all fields'; return; }
  if (np !== cp)  { msg.style.color='var(--red)'; msg.textContent='Passwords do not match'; return; }
  this.textContent = 'Updated ✓';
  this.style.background = 'linear-gradient(135deg,#059669,#10b981)';
  msg.style.color = 'var(--green)'; msg.textContent = 'Password updated successfully';
  setTimeout(() => {
    this.textContent = 'Update password';
    this.style.background = '';
  }, 2200);
});

// Revoke session buttons
document.querySelectorAll('.session-revoke').forEach(btn => {
  btn.addEventListener('click', function() {
    const row = this.closest('.session-row');
    showModal({
      icon: '🔒',
      title: 'Revoke session',
      body: 'This device will be immediately logged out. Continue?',
      confirmLabel: 'Revoke',
      confirmStyle: '',
      onConfirm: () => { row.style.cssText = 'opacity:.3;pointer-events:none;transition:opacity .3s'; }
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
    }
  });
});