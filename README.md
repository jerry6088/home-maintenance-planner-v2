# V46.2 Forced Password Change

Fixes the missing temporary-password flow.

What changes:
- owner-created family accounts are marked must_change_password=true
- when that member signs in, the app opens a blocking Change Your Password dialog
- they cannot dismiss it with Escape
- after a successful Supabase password update, the app clears the database flag
- future sign-ins use the new password normally
- existing accounts are not forced unless you set must_change_password=true

Required one-time Supabase step:
1. Run `v46-2-force-password-change-migration.sql`.
2. Redeploy the existing `create-family-account` Edge Function using the included updated index.ts.
3. Keep Verify JWT with legacy secret OFF for that function.
4. Upload the V46.2 web files to GitHub.
5. Leave cloud-config.js untouched.
6. Open with ?v=462.

For Ashley's already-created account, after running the migration, set her flag once:
update public.household_members
set must_change_password = true
where profile_name = 'Ashley';

Then refresh Ashley's app.
