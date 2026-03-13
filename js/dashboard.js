// === DASHBOARD.JS — Core navigation and overview ===

// Page navigation
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const page = item.dataset.page;
    if (page) navigateTo(page);
    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
  });
});

function navigateTo(pageName) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  const navItem = document.querySelector(`[data-page="${pageName}"]`);
  const page    = document.getElementById('page-' + pageName);

  if (navItem) navItem.classList.add('active');
  if (page)    page.classList.add('active');

  const titles = {
    overview:      'OVERVIEW',
    staff:         'STAFF ROSTER',
    shifts:        'SHIFT LOGS',
    patrols:       'PATROL LOGS',
    announcements: 'ANNOUNCEMENTS',
    admin:         'ADMIN PANEL'
  };
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) pageTitle.textContent = titles[pageName] || pageName.toUpperCase();

  // Load page data
  if (pageName === 'overview')      loadOverview();
  if (pageName === 'staff')         loadStaff();
  if (pageName === 'shifts')        loadShifts();
  if (pageName === 'patrols')       loadPatrols();
  if (pageName === 'announcements') loadAnnouncements();
  if (pageName === 'admin')         loadAdminSettings();
}

// Initial load
window.addEventListener('DOMContentLoaded', () => {
  loadOverview();
  updateTopbarOnline();
  setInterval(updateTopbarOnline, 30000);
});

async function loadOverview() {
  await Promise.all([
    loadOverviewStats(),
    loadActivityFeed(),
    loadDutyList(),
    loadAnnouncementPreview()
  ]);
}

async function loadOverviewStats() {
  try {
    const [staff, shifts, patrols] = await Promise.all([
      DataStore.getAll(COLLECTIONS.staff),
      DataStore.getAll(COLLECTIONS.shifts),
      DataStore.getAll(COLLECTIONS.patrols)
    ]);

    const today = new Date().toLocaleDateString();
    const onDuty = shifts.filter(s => s.active);
    const shiftsToday = shifts.filter(s => new Date(s.startTime).toLocaleDateString() === today);
    const patrolsToday = patrols.filter(p => new Date(p.createdAt).toLocaleDateString() === today);

    setEl('stat-totalStaff',  staff.length);
    setEl('stat-onDuty',      onDuty.length);
    setEl('stat-shiftsToday', shiftsToday.length);
    setEl('stat-patrolsToday',patrolsToday.length);

    setEl('topbarOnline', onDuty.length);
  } catch(e) { console.error('Stats:', e); }
}

async function loadActivityFeed() {
  const feed = document.getElementById('activityFeed');
  if (!feed) return;
  try {
    const items = await DataStore.getAll(COLLECTIONS.activity);
    const recent = items.slice(0, 15);
    if (!recent.length) {
      feed.innerHTML = '<div class="activity-empty">No recent activity</div>';
      return;
    }
    feed.innerHTML = recent.map(a => `
      <div class="activity-item">
        <div class="activity-dot" style="background:${activityColor(a.type)}"></div>
        <div class="activity-text">${escHtml(a.text)}</div>
        <div class="activity-time">${timeAgo(a.time || a.createdAt)}</div>
      </div>
    `).join('');
  } catch(e) { feed.innerHTML = '<div class="activity-empty">Error loading activity</div>'; }
}

async function loadDutyList() {
  const list = document.getElementById('dutyList');
  if (!list) return;
  try {
    const shifts = await DataStore.getAll(COLLECTIONS.shifts);
    const active = shifts.filter(s => s.active);
    if (!active.length) {
      list.innerHTML = '<div class="activity-empty">No staff on duty</div>';
      return;
    }
    list.innerHTML = active.map(s => `
      <div class="duty-item">
        <div class="duty-avatar">${s.username[0].toUpperCase()}</div>
        <div>
          <div class="duty-name">${escHtml(s.username)}</div>
          <div class="duty-rank">${escHtml(s.rank || '')}</div>
        </div>
        <div class="duty-time">Since ${new Date(s.startTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
      </div>
    `).join('');
  } catch(e) {}
}

async function loadAnnouncementPreview() {
  const el = document.getElementById('announcementPreview');
  if (!el) return;
  try {
    const anns = await DataStore.getAll(COLLECTIONS.announcements);
    const recent = anns.slice(0, 4);
    if (!recent.length) {
      el.innerHTML = '<div class="activity-empty">No announcements</div>';
      return;
    }
    el.innerHTML = recent.map(a => `
      <div class="ann-preview-item">
        <span class="ann-priority priority-${a.priority}">${a.priority.toUpperCase()}</span>
        <span class="ann-preview-title">${escHtml(a.title)}</span>
        <span class="ann-preview-meta">${timeAgo(a.createdAt)}</span>
      </div>
    `).join('');
  } catch(e) {}
}

async function updateTopbarOnline() {
  try {
    const shifts = await DataStore.getAll(COLLECTIONS.shifts);
    const onDuty = shifts.filter(s => s.active).length;
    setEl('topbarOnline', onDuty);
  } catch(e) {}
}

async function loadAdminSettings() {
  const settings = await DataStore.getSetting('serverSettings') || {};
  const names = ['settingServerName','settingServerDesc','settingAdminPass','settingDiscord'];
  const keys  = ['serverName','serverDesc','adminPass','discord'];
  names.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.value = settings[keys[i]] || '';
  });
}

async function saveSettings() {
  const settings = {
    serverName: document.getElementById('settingServerName')?.value || 'NEXUS RP',
    serverDesc: document.getElementById('settingServerDesc')?.value || '',
    adminPass:  document.getElementById('settingAdminPass')?.value  || DEFAULT_ADMIN_PASS,
    discord:    document.getElementById('settingDiscord')?.value    || ''
  };
  await DataStore.setSetting('serverSettings', settings);
  showToast('Settings saved!');
}

async function clearData(col) {
  if (!confirm(`Are you sure you want to clear all ${col}? This cannot be undone.`)) return;
  await DataStore.clearAll(COLLECTIONS[col]);
  showToast(`${col} cleared.`);
  loadOverview();
}

// Helpers
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function activityColor(type) {
  const map = { login:'#00d4ff', logout:'#5a7a9a', shift:'#00ff88', patrol:'#ffd700', staff:'#ff8c00', announce:'#ff4444' };
  return map[type] || '#00d4ff';
}
