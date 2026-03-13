// === PATROLS.JS — Patrol Logging ===

let allPatrols = [];

async function loadPatrols() {
  const tbody = document.getElementById('patrolTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Loading...</td></tr>';
  try {
    allPatrols = await DataStore.getAll(COLLECTIONS.patrols);
    renderPatrolTable(allPatrols);
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Error loading patrols</td></tr>';
  }
}

function renderPatrolTable(data) {
  const tbody = document.getElementById('patrolTableBody');
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No patrols logged</td></tr>';
    return;
  }
  tbody.innerHTML = data.map((p, i) => `
    <tr>
      <td style="color:var(--text-muted);font-family:var(--font-mono);font-size:11px">${i+1}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:26px;height:26px;border-radius:50%;background:var(--yellow-dim);border:1px solid rgba(255,215,0,0.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:var(--yellow)">${p.username[0].toUpperCase()}</div>
          <strong>${escHtml(p.username)}</strong>
        </div>
      </td>
      <td><span class="patrol-badge patrol-${escHtml(p.type)}">${escHtml(p.type)}</span></td>
      <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-dim)">${escHtml(p.description)}</td>
      <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim)">${p.duration ? p.duration + ' min' : '—'}</td>
      <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${new Date(p.createdAt).toLocaleDateString()}</td>
      <td>
        <div class="table-actions">
          ${canDeletePatrol(p) ? `<button class="btn-table delete" onclick="deletePatrol('${p.id}')">Delete</button>` : '<span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted)">—</span>'}
        </div>
      </td>
    </tr>
  `).join('');
}

function canDeletePatrol(patrol) {
  return currentUser?.isAdmin || patrol.userId === currentUser?.id;
}

async function addPatrol() {
  const type     = document.getElementById('newPatrolType').value;
  const desc     = document.getElementById('newPatrolDesc').value.trim();
  const duration = document.getElementById('newPatrolDuration').value;
  const partner  = document.getElementById('newPatrolPartner').value.trim();

  if (!type) { showToast('Select a patrol type', true); return; }
  if (!desc) { showToast('Add a description', true); return; }

  await DataStore.add(COLLECTIONS.patrols, {
    userId:      currentUser.id,
    username:    currentUser.username,
    rank:        currentUser.rank,
    type, description: desc,
    duration:    duration ? parseInt(duration) : null,
    partner:     partner || null
  });

  await logActivity(`${currentUser.username} logged a ${type} patrol`, 'patrol');

  document.getElementById('newPatrolType').value = '';
  document.getElementById('newPatrolDesc').value = '';
  document.getElementById('newPatrolDuration').value = '';
  document.getElementById('newPatrolPartner').value = '';

  closeModal('addPatrolModal');
  showToast('Patrol logged!');
  loadPatrols();
}

async function deletePatrol(id) {
  if (!confirm('Delete this patrol log?')) return;
  await DataStore.delete(COLLECTIONS.patrols, id);
  showToast('Patrol deleted');
  loadPatrols();
}

function filterPatrols(query) {
  const q = query.toLowerCase();
  const filtered = allPatrols.filter(p =>
    p.username.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    p.type.toLowerCase().includes(q)
  );
  renderPatrolTable(filtered);
}

function filterPatrolsByType(type) {
  if (!type) { renderPatrolTable(allPatrols); return; }
  renderPatrolTable(allPatrols.filter(p => p.type === type));
}
