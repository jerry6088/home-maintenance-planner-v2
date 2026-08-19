# V44 Family Profiles

Built from V43.

## What V44 adds
- links each Supabase login to one family profile name
- owner can link every household login to Jerry, Ashley, Jack, Jace, Wesley, Waylon, Roger, etc.
- regular members can set/change only their own linked profile
- Today -> My Tasks uses the linked login profile
- the linked person is marked "Me" in the people list
- tasks/chores remain assigned by family name, so once a login is linked, those assignments automatically belong to that login
- existing V43 chores, Dashboard, Calendar, Today, phone UI, and cloud state syncing remain intact

## One-time Supabase step
Run `v44-family-profiles-migration.sql` in Supabase SQL Editor.

Do this before testing the Family Profiles controls.

## GitHub upload
Upload/replace the normal V44 web files.

IMPORTANT: `cloud-config.js` is intentionally NOT included. Leave your working GitHub cloud-config.js untouched.

## How to use
1. Run the migration SQL.
2. Open the planner with `?v=44`.
3. Open Cloud Sync.
4. Under Family Profiles, link your login to Jerry.
5. When Ashley joins with her own account, link her login to Ashley.
6. Repeat for other family members.
7. Assign a task/chore to Ashley, Jace, etc. Their login will automatically recognize those items as their My Tasks.

The household owner can manage all profile links. Other members can manage only their own profile link.
