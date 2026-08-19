# V36 Safe Sync

This fixes the stale-device overwrite bug found in V35.

## Root cause
V35 treated every button click as a cloud change.
On a phone, opening the menu or Cloud Sync could push the phone's older local copy to Supabase before it received the computer's newer copy.

## V36 changes
- navigation/menu/dialog clicks no longer trigger cloud saves
- only actual data saves/mutations trigger cloud writes
- before an automatic push, the device checks Supabase
- if Supabase has a newer version, the device receives it instead of overwriting it
- realtime remains enabled
- 5-second fallback cloud check remains enabled
- manual Push/Pull remains available for recovery
- service worker cache bumped to V36

## IMPORTANT
This ZIP intentionally does NOT contain cloud-config.js.
Leave your working cloud-config.js on GitHub exactly as it is.

## Upload/replace only
- index.html
- styles.css
- app.js
- cloud-sync.js
- pwa-install.js
- service-worker.js
- manifest.webmanifest
- icon-192.png
- icon-512.png

Do not delete or replace your existing cloud-config.js.

## Test
1. Computer and phone both open with ?v=36.
2. On the computer, change one due date and save.
3. Do not press Push/Pull.
4. Do not make any change on the phone.
5. The phone should update automatically, or within about 5 seconds.
