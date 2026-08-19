# V39 Chores + Today

Built directly from stable V36 Safe Sync.

Fixes:
- adds a real Today page using the planner's native view/navigation system
- adds Today's Chores to Dashboard
- daily chores appear on Calendar using their current-week date
- "Entire week" chores appear across the current week
- a default chore assignee now counts for the current week unless a weekly assignment overrides it
- editing/completing chores refreshes Dashboard, Calendar and Today immediately
- V36 cloud sync is unchanged

IMPORTANT:
cloud-config.js is NOT included. Leave your working GitHub cloud-config.js untouched.

Upload/replace:
index.html
styles.css
app.js
cloud-sync.js
pwa-install.js
service-worker.js
manifest.webmanifest
icon-192.png
icon-512.png

Open with ?v=39.
