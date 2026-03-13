// === AUTH.JS — Login / Session Management ===

const SESSION_KEY = 'nexus_session';
const DEFAULT_ADMIN_PASS = 'nexus2024';

// Current user object
let currentUser = null;

// On page load
(async function init() {
  const isLoginPage   = document.body.classList.contains('login-page');
  const isDashPage    = !isLoginPage;

  // Load session
  const session = loadSession();

  if (isLoginPage) {
    if (session) {
      window.location.href = 'dashboard.html';
      return;
    }
    await loadLoginStats();
  }

  if (isDashPage) {
    if (!session) {
      window.location.href = 'index.html';
      return;
    }
    currentUser = session;
    setupDashboard();
  }
})();

function loadSession() {
  try {
    const s = sessionStorage.getItem(SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

function saveSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

async function handleLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl  = document.getElementById('loginError');

  errorEl.textContent = '';

  if (!username) { errorEl.textContent = 'Please enter your Roblox username.'; return; }
  if (!password) { errorEl.textContent = 'Please enter your access code.'; return; }

  // Check admin password (stored in settings or default)
  const settings = await DataStore.getSetting('serverSettings');
  const adminPass = settings?.adminPass || DEFAULT_ADMIN_PASS;

  if (password !== adminPass) {
    errorEl.textContent = 'Incorrect access code.';
    return;
  }

  // Find user in staff roster
  let staffData = await DataStore.getAll(COLLECTIONS.staff);
  let staff = staffData.find(s => s.username.toLowerCase() === username.toLowerCase());

  if (!staff) {
    // Auto-create as basic officer if not found, or check if it's the first user
    if (staffData.length === 0) {
      // First user becomes Commissioner
      const id = await DataStore.add(COLLECTIONS.staff, {
        username, rank: 'Commissioner', department: 'Command',
        status: 'active', notes: 'Auto-created (first user)',
        joined: new Date().toLocaleDateString()
      });
      staff = { id, username, rank: 'Commissioner', department: 'Command', status: 'active' };
    } else {
      errorEl.textContent = 'Username not found in the staff roster. Ask an admin to add you.';
      return;
    }
  }

  if (staff.status === 'suspended') {
    errorEl.textContent = 'Your account is suspended. Contact an administrator.';
    return;
  }

  const isAdmin = ['Commissioner','Deputy Commissioner','Assistant Commissioner','Chief'].includes(staff.rank);

  const user = {
    id: staff.id,
    username: staff.username,
    rank: staff.rank,
    department: staff.department,
    isAdmin,
    loginTime: new Date().toISOString()
  };

  saveSession(user);
  await logActivity(`${user.username} logged in`, 'login');
  window.location.href = 'dashboard.html';
}

function handleSignOut() {
  if (currentUser) logActivity(`${currentUser.username} signed out`, 'logout');
  clearSession();
  window.location.href = 'index.html';
}

function setupDashboard() {
  // Set user info in sidebar
  document.getElementById('sidebarName').textContent = currentUser.username;
  document.getElementById('sidebarRank').textContent = currentUser.rank;
  document.getElementById('sidebarAvatar').textContent = currentUser.username[0].toUpperCase();

  // Show admin nav if admin
  if (currentUser.isAdmin) {
    const adminNav = document.getElementById('adminNavItem');
    if (adminNav) adminNav.style.display = 'flex';

    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    const annBtn = document.getElementById('newAnnouncementBtn');
    if (annBtn) annBtn.style.display = 'inline-flex';
    const allShiftsCard = document.getElementById('allShiftsCard');
    if (allShiftsCard) allShiftsCard.style.display = 'block';
  }

  startClock();
}

async function loadLoginStats() {
  try {
    const staff   = await DataStore.getAll(COLLECTIONS.staff);
    const shifts  = await DataStore.getAll(COLLECTIONS.shifts);
    const today   = new Date().toLocaleDateString();
    const todayShifts = shifts.filter(s => new Date(s.startTime).toLocaleDateString() === today);
    const onDuty  = shifts.filter(s => s.active);

    const onlineEl  = document.getElementById('onlineCountVal');
    const totalEl   = document.getElementById('totalStaffVal');
    const patrolsEl = document.getElementById('totalPatrolsVal');

    if (onlineEl)  onlineEl.textContent  = onDuty.length;
    if (totalEl)   totalEl.textContent   = staff.length;
    if (patrolsEl) patrolsEl.textContent = todayShifts.length;
  } catch(e) { console.log('Stats load:', e); }
}

// Allow pressing Enter on login form
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.getElementById('loginForm')) {
    handleLogin();
  }
});

function startClock() {
  function update() {
    const now = new Date();
    const t = now.toTimeString().split(' ')[0];
    const el = document.getElementById('topbarClock');
    if (el) el.textContent = t;
  }
  update();
  setInterval(update, 1000);
}

async function logActivity(text, type = 'info') {
  try {
    await DataStore.add(COLLECTIONS.activity, { text, type, time: new Date().toISOString() });
  } catch(e) {}
}

function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function timeAgo(isoStr) {
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  if (diff < 86400)return Math.floor(diff/3600) + 'h ago';
  return Math.floor(diff/86400) + 'd ago';
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
