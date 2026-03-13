# NEXUS ER:LC Dashboard — Setup Guide

A fully functional ER:LC Roleplay server dashboard with staff management, shift logging, patrol tracking, and announcements.

---

## 🚀 Quick Start (Works Immediately — No Setup Required)

1. Upload all files to GitHub Pages
2. Open `index.html`
3. Enter **any username** + password `nexus2024`
4. First login auto-creates you as **Commissioner**

> **Note:** Without Firebase, data is saved in your browser's localStorage (only visible to you in that browser).

---

## 🔥 Connect Firebase (Shared Real-Time Data — Recommended)

Firebase is **free** for small communities. Follow these steps:

### Step 1 — Create Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com/)
2. Click **Add project** → Name it (e.g. `my-erlc-server`)
3. Disable Google Analytics (optional) → **Create project**

### Step 2 — Create Firestore Database
1. In your project: **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode**
4. Select a region → **Done**

### Step 3 — Get Your Config
1. In Project Overview, click the **</>** (Web) icon
2. Name your app (anything) → **Register app**
3. Copy the `firebaseConfig` object shown

### Step 4 — Add Config to Dashboard
Open `js/firebase-config.js` and replace:
```javascript
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",        // ← paste your values
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
```

### Step 5 — Firestore Security Rules (Important!)
In Firebase Console → Firestore → Rules, paste:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // Open access — fine for password-protected dashboards
    }
  }
}
```

---

## 📁 File Structure
```
/
├── index.html          ← Login page
├── dashboard.html      ← Main dashboard
├── css/
│   ├── style.css       ← Core styles + login
│   └── dashboard.css   ← Dashboard layout
└── js/
    ├── firebase-config.js  ← Firebase setup + DataStore layer
    ├── auth.js             ← Login / session management
    ├── dashboard.js        ← Navigation + overview
    ├── staff.js            ← Staff roster
    ├── shifts.js           ← Shift logging + timer
    ├── patrols.js          ← Patrol logs
    └── announcements.js    ← Announcements
```

---

## 🌐 Deploy to GitHub Pages

1. Create a new GitHub repository
2. Upload all files (maintain folder structure)
3. Go to **Settings → Pages**
4. Source: **Deploy from branch** → `main` → `/root`
5. Your dashboard will be live at `https://yourusername.github.io/reponame`

---

## ⚙️ Customization

### Change Server Name
- Edit `index.html` and `dashboard.html` — search for `NEXUS`
- Or use the Admin Panel → Server Settings after logging in

### Change Admin Password
- Default: `nexus2024`
- Change in **Admin Panel → Server Settings** after logging in

### Add Staff Members
- Log in as Commissioner/Admin
- Go to **Staff Roster → Add Staff**
- Once added, staff can log in with their Roblox username + the admin password

### Ranks (in order)
1. Commissioner
2. Deputy Commissioner
3. Assistant Commissioner
4. Chief
5. Captain
6. Lieutenant
7. Sergeant
8. Corporal
9. Officer
10. Cadet

**Admin access** = Commissioner, Deputy Commissioner, Assistant Commissioner, Chief

---

## 🎮 Features

| Feature | Description |
|---------|-------------|
| **Staff Roster** | Add/remove members, set ranks, departments, status |
| **Shift Logging** | Start/stop shift timer, view history, total hours |
| **Patrol Logs** | Log patrol types (Standard, Traffic, Pursuit, SWAT, etc.) |
| **Announcements** | Priority announcements (Info, Notice, Alert, Urgent) |
| **Activity Feed** | Live log of all dashboard actions |
| **Admin Panel** | Server settings, danger zone, data management |

---

## ❓ FAQ

**Q: Can multiple people use it at once?**  
A: Yes, with Firebase! Without it, data only stays in the local browser.

**Q: How do staff log in?**  
A: They need to be added to the roster first by an admin, then use their Roblox username + the server password.

**Q: Can I add custom ranks?**  
A: Yes — edit the `<select>` dropdowns in `dashboard.html` and `staff.js`.

**Q: Is it mobile friendly?**  
A: Yes, the sidebar collapses on mobile with a hamburger menu.
