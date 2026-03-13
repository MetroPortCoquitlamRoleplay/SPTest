// === SHIFTS.JS — Shift Logging & Timer ===

let shiftInterval = null;
let shiftStartTime = null;
let activeShiftId = null;

async function loadShifts() {
  await Promise.all([
    loadMyShifts(),
    checkActiveShift(),
    currentUser?.isAdmin ? loadAllShifts() : Promise.resolve()
  ]);
}

async function checkActiveShift() {
  try {
    const shifts = await DataStore.getAll(COLLECTIONS.shifts);
    const active = shifts.find(s => s.active && s.userId === currentUser?.id);
    if (active) {
      activeShiftId  = active.id;
      shiftStartTime = new Date(active.startTime);
      startShiftTimer();
      document.getElementById('activeShiftBanner').style.display = 'flex';
      document.getElementById('shiftBtn').textContent = '🔴 End Shift';
    }
  } catch(e) {}
}

async function loadMyShifts() {
  const tbody = document.getElementById('shiftTableBody');
  if (!tbody) return;

  try {
    const shifts = await DataStore.getAll(COLLECTIONS.shifts);
    const mine = shifts.filter(s => s.userId === currentUser?.id && !s.active);

    // Calc total
    const totalSecs = mine.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const totalEl = document.getElementById('myTotalHours');
    if (totalEl) totalEl.textContent = `Total: ${h}h ${m}m`;

    if (!mine.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No shifts logged yet</td></tr>';
      return;
    }
    tbody.innerHTML = mine.map(s => `
      <tr>
        <td style="font-family:var(--font-mono);font-size:11px">${new Date(s.startTime).toLocaleDateString()}</td>
        <td style="font-family:var(--font-mono);font-size:11px">${new Date(s.startTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</td>
        <td style="font-family:var(--font-mono);font-size:11px">${s.endTime ? new Date(s.endTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—'}</td>
        <td><span style="font-family:var(--font-mono);font-size:12px;color:var(--green)">${formatDuration(s.durationSeconds || 0)}</span></td>
        <td style="color:var(--text-dim);font-size:13px">${escHtml(s.notes || '—')}</td>
      </tr>
    `).join('');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Error loading shifts</td></tr>';
  }
}

async function loadAllShifts() {
  const tbody = document.getElementById('allShiftTableBody');
  if (!tbody) return;
  try {
    const shifts = await DataStore.getAll(COLLECTIONS.shifts);
    const completed = shifts.filter(s => !s.active);
    if (!completed.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="table-empty">No shifts found</td></tr>';
      return;
    }
    tbody.innerHTML = completed.map(s => `
      <tr>
        <td><strong>${escHtml(s.username)}</strong></td>
        <td style="font-family:var(--font-mono);font-size:11px">${new Date(s.startTime).toLocaleDateString()}</td>
        <td><span style="font-family:var(--font-mono);font-size:12px;color:var(--green)">${formatDuration(s.durationSeconds || 0)}</span></td>
        <td style="color:var(--text-dim);font-size:13px">${escHtml(s.notes || '—')}</td>
      </tr>
    `).join('');
  } catch(e) {}
}

function toggleShift() {
  if (activeShiftId) {
    // End shift — show notes modal
    openModal('endShiftModal');
  } else {
    startShift();
  }
}

async function startShift() {
  if (activeShiftId) return;
  shiftStartTime = new Date();
  const id = await DataStore.add(COLLECTIONS.shifts, {
    userId:    currentUser.id,
    username:  currentUser.username,
    rank:      currentUser.rank,
    startTime: shiftStartTime.toISOString(),
    active:    true
  });
  activeShiftId = id;
  startShiftTimer();
  document.getElementById('activeShiftBanner').style.display = 'flex';
  document.getElementById('shiftBtn').textContent = '🔴 End Shift';
  await logActivity(`${currentUser.username} started a shift`, 'shift');
  showToast('Shift started!');
}

function startShiftTimer() {
  if (shiftInterval) clearInterval(shiftInterval);
  shiftInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - shiftStartTime.getTime()) / 1000);
    const el = document.getElementById('shiftTimer');
    if (el) el.textContent = formatDuration(elapsed);
  }, 1000);
}

async function endShiftConfirm() {
  const notes    = document.getElementById('shiftNotes').value.trim();
  const endTime  = new Date();
  const duration = Math.floor((endTime - shiftStartTime) / 1000);

  await DataStore.update(COLLECTIONS.shifts, activeShiftId, {
    endTime:         endTime.toISOString(),
    active:          false,
    durationSeconds: duration,
    notes
  });

  clearInterval(shiftInterval);
  shiftInterval  = null;
  activeShiftId  = null;
  shiftStartTime = null;

  document.getElementById('activeShiftBanner').style.display = 'none';
  document.getElementById('shiftBtn').textContent = '🟢 Start Shift';
  document.getElementById('shiftNotes').value = '';

  await logActivity(`${currentUser.username} ended shift (${formatDuration(duration)})`, 'shift');
  closeModal('endShiftModal');
  showToast(`Shift ended — ${formatDuration(duration)}`);
  loadShifts();
}
