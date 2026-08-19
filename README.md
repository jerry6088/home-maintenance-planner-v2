# V48 Stability & Usability

Built from V47.

Highlights:
- security hardening for household roles
- local-date/timezone fixes
- chore completion records include who completed the chore and timestamp
- completed chores remain visible and sort below unfinished chores
- Dashboard shows Today's Chores progress
- Cloud Sync renamed Account & Family in the UI
- app version shown in sidebar
- friendly Online/Offline status
- service-worker update banner with Reload button
- working V47 password management and V43/V42 chore behavior retained
- existing whole-household cloud snapshot sync architecture intentionally retained for stability

Required:
Run `v48-security-hardening.sql` once in Supabase SQL Editor before relying on V48.

No new Edge Function is required.
cloud-config.js is intentionally not included.
