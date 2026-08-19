# V34 Realtime Sync

Fixes automatic family-device syncing.

Changes:
- planner changes trigger automatic cloud saves
- Supabase realtime listens for all household_state changes
- same-account changes from a second device are no longer ignored
- visible Last synced time
- cloud-config.js bypasses the service-worker cache
- manual Push/Pull remains available as backup

Upload all V34 web files to GitHub Pages and test with `?v=34`.
