// === STAFF.JS — Staff Roster Management ===

let allStaff = [];

async function loadStaff() {
  const tbody = document.getElementById('staffTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Loading...</td></tr>';

  try {
    allStaff = await DataStore.getAll(COLLECTIONS.staff);
    renderStaffTable(allStaff);
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Error loading staff</td></tr>';
  }
}

function renderStaffTable(data) {
  const tbody = document.getElementById('staffTableBody');
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No staff members found</td></tr>';
    return;
  }

  tbody.innerHTML = data.map((s, i) => `
    <tr>
      <td style="color:var(--text-muted);font-family:var(--font-mono);font-size:11px">${i+1}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--blue-dim);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:var(--blue)">${s.username[0].toUpperCase()}</div>
          <strong>${escHtml(s.username)}</strong>
        </div>
      </td>
      <td><span class="rank-badge rank-${s.rank?.replace(/\s+/g,'-')}">${escHtml(s.rank)}</span></td>
      <td style="color:var(--text-dim)">${escHtml(s.department || '—')}</td>
      <td><span class="status-badge status-${s.status || 'active'}">${(s.status || 'active').toUpperCase()}</span></td>
      <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim)">${s.joined || new Date(s.createdAt).toLocaleDateString()}</td>
      <td>
        <div class="table-actions">
          ${currentUser?.isAdmin ? `
            <button class="btn-table" onclick="editStaffStatus('${s.id}','${s.status}')">Edit</button>
            <button class="btn-table delete" onclick="deleteStaff('${s.id}','${escHtml(s.username)}')">Remove</button>
          ` : '<span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted)">—</span>'}
        </div>
      </td>
    </tr>
  `).join('');
}

async function addStaff() {
  const username = document.getElementById('newStaffUsername').value.trim();
  const rank     = document.getElementById('newStaffRank').value;
  const dept     = document.getElementById('newStaffDept').value;
  const notes    = document.getElementById('newStaffNotes').value.trim();

  if (!username) { showToast('Username is required', true); return; }
  if (!rank)     { showToast('Rank is required', true); return; }

  // Check for duplicate
  const existing = allStaff.find(s => s.username.toLowerCase() === username.toLowerCase());
  if (existing) { showToast('Username already exists in roster', true); return; }

  await DataStore.add(COLLECTIONS.staff, {
    username, rank, department: dept, notes,
    status: 'active',
    joined: new Date().toLocaleDateString()
  });

  await logActivity(`${currentUser.username} added ${username} (${rank}) to roster`, 'staff');

  closeModal('addStaffModal');
  document.getElementById('newStaffUsername').value = '';
  document.getElementById('newStaffRank').value = '';
  document.getElementById('newStaffNotes').value = '';

  showToast(`${username} added to roster!`);
  loadStaff();
}

async function editStaffStatus(id, currentStatus) {
  const statuses = ['active', 'inactive', 'suspended'];
  const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
  await DataStore.update(COLLECTIONS.staff, id, { status: nextStatus });
  await logActivity(`${currentUser.username} changed staff status to ${nextStatus}`, 'staff');
  showToast(`Status updated to ${nextStatus}`);
  loadStaff();
}

async function deleteStaff(id, username) {
  if (!confirm(`Remove ${username} from the roster? This cannot be undone.`)) return;
  await DataStore.delete(COLLECTIONS.staff, id);
  await logActivity(`${currentUser.username} removed ${username} from roster`, 'staff');
  showToast(`${username} removed from roster`);
  loadStaff();
}

function filterStaff(query) {
  const q = query.toLowerCase();
  const filtered = allStaff.filter(s =>
    s.username.toLowerCase().includes(q) ||
    (s.rank || '').toLowerCase().includes(q) ||
    (s.department || '').toLowerCase().includes(q)
  );
  renderStaffTable(filtered);
}

function filterStaffByRank(rank) {
  if (!rank) { renderStaffTable(allStaff); return; }
  renderStaffTable(allStaff.filter(s => s.rank === rank));
}
