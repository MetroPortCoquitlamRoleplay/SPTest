// === ANNOUNCEMENTS.JS — Division Announcements ===

async function loadAnnouncements() {
  const list = document.getElementById('announcementsList');
  if (!list) return;
  list.innerHTML = '<div class="activity-empty">Loading...</div>';
  try {
    const anns = await DataStore.getAll(COLLECTIONS.announcements);
    if (!anns.length) {
      list.innerHTML = '<div class="activity-empty">No announcements yet</div>';
      return;
    }
    list.innerHTML = anns.map(a => `
      <div class="announcement-card ${a.priority}">
        <div class="ann-header">
          <span class="ann-priority priority-${a.priority}">${a.priority.toUpperCase()}</span>
          <div class="ann-title">${escHtml(a.title)}</div>
        </div>
        <div class="ann-meta">
          <span>By ${escHtml(a.author)}</span>
          <span>•</span>
          <span>${timeAgo(a.createdAt)}</span>
          <span>•</span>
          <span>${new Date(a.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="ann-body">${escHtml(a.content)}</div>
        ${currentUser?.isAdmin ? `
        <div class="ann-actions">
          <button class="btn-table delete" onclick="deleteAnnouncement('${a.id}')">Delete</button>
        </div>` : ''}
      </div>
    `).join('');
  } catch(e) {
    list.innerHTML = '<div class="activity-empty">Error loading announcements</div>';
  }
}

async function addAnnouncement() {
  const title    = document.getElementById('newAnnTitle').value.trim();
  const priority = document.getElementById('newAnnPriority').value;
  const content  = document.getElementById('newAnnContent').value.trim();

  if (!title)   { showToast('Title is required', true); return; }
  if (!content) { showToast('Content is required', true); return; }

  await DataStore.add(COLLECTIONS.announcements, {
    title, priority, content,
    author: currentUser.username
  });

  await logActivity(`${currentUser.username} posted an announcement: "${title}"`, 'announce');

  document.getElementById('newAnnTitle').value   = '';
  document.getElementById('newAnnContent').value = '';
  document.getElementById('newAnnPriority').value = 'info';

  closeModal('addAnnouncementModal');
  showToast('Announcement published!');
  loadAnnouncements();
}

async function deleteAnnouncement(id) {
  if (!confirm('Delete this announcement?')) return;
  await DataStore.delete(COLLECTIONS.announcements, id);
  showToast('Announcement deleted');
  loadAnnouncements();
}
