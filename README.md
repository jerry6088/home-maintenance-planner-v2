# V46.1 Family Profile Fix

Fixes the profile identity bug seen on Ashley's login.

Problem:
V46 sometimes selected the first Miller Home household member when setting "Your profile".
Because Jerry is the owner and usually appears first, Ashley could be signed in with her own email while the app still said "Your profile: Jerry".

Fix:
- current profile is selected by the authenticated Supabase user_id
- startup household selection uses the signed-in user's membership
- changing your own Family Profile updates the local profile immediately
- no schema, Edge Function, or cloud-config changes required

Upload/replace the normal web files.
Do NOT replace cloud-config.js.
Open with ?v=461.
