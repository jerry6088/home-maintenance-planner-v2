# V48.1 Chore Sync Fix

Built from V48.

Fix:
- completing or undoing a chore now performs an explicit immediate cloud commit
- this does not rely only on the generic localStorage/debounce bridge
- Dashboard shows Saving chore to family / Saved to family ✓ / cloud sync failed
- receiving devices keep the normal Realtime + 5-second fallback refresh
- V48 security, local-date fixes, password management, profiles, and UI remain intact

No new SQL migration.
No Edge Function changes.
Keep the V48 security migration applied.
Do not replace cloud-config.js.

Upload the normal web files and open once with ?v=481.

Test:
1. On Ashley's phone complete a chore.
2. Ashley should briefly see Saved to family ✓.
3. Jerry's computer should update through Realtime or within about 5 seconds.
