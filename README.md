# V38.1 Sync Status Fix

Small patch on V38.

Fixes:
- removes misleading "Waiting for sync..." after a successful connection
- initializes Last synced from household_state.updated_at
- refreshes Last synced during fallback cloud checks
- wording is now "Last synced: <time>"
- does not change the V36 Safe Sync architecture
- does not change Supabase configuration

IMPORTANT:
cloud-config.js is not included. Leave your working GitHub cloud-config.js untouched.

Upload/replace the included files, then open with ?v=381.
