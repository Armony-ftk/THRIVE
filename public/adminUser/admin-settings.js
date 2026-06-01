// Wire up all toggles
document.querySelectorAll('.toggle').forEach(tog => {
  tog.addEventListener('click', () => tog.classList.toggle('on'));
});

// Settings nav highlight on click
document.querySelectorAll('.snav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.snav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

// Danger zone buttons
document.getElementById('btn-clearflags')?.addEventListener('click', () => {
  showModal({
    icon: '🚩',
    title: 'Clear flag queue',
    body: 'This will dismiss all 9 pending flags without taking action. Are you sure?',
    confirmLabel: 'Clear queue',
    confirmStyle: '',
    onConfirm: () => {
      const btn = document.getElementById('btn-clearflags');
      btn.textContent = 'Queue cleared'; btn.disabled = true; btn.style.opacity = '.5';
    }
  });
});

document.getElementById('btn-export')?.addEventListener('click', () => {
  showModal({
    icon: '📦',
    title: 'Export user data',
    body: 'A full CSV of all 2,841 users will be generated and sent to admin@thrive.app.',
    confirmLabel: 'Export',
    confirmStyle: 'confirm-green',
    onConfirm: () => {
      const btn = document.getElementById('btn-export');
      btn.textContent = 'Export queued'; btn.disabled = true; btn.style.opacity = '.5';
    }
  });
});

document.getElementById('btn-resetstats')?.addEventListener('click', () => {
  showModal({
    icon: '⚠️',
    title: 'Reset platform statistics',
    body: 'This will permanently wipe all analytics data. This cannot be undone.',
    confirmLabel: 'Reset everything',
    confirmStyle: '',
    onConfirm: () => {
      const btn = document.getElementById('btn-resetstats');
      btn.textContent = 'Stats reset'; btn.disabled = true; btn.style.opacity = '.5';
    }
  });
});