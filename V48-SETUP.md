# V48 Setup

## Required: run the security migration
Supabase -> SQL Editor -> New query.
Paste and run:
`v48-security-hardening.sql`

This prevents regular household members from directly changing sensitive membership columns such as `role`.

## No Edge Function redeploy is required
Keep the V47 create-family-account and reset-family-password functions deployed.

## GitHub
Upload/replace the normal V48 website files.
Do not replace `cloud-config.js`.

Open normally. `?v=48` can be used once for initial testing, but V48 now includes an in-app update indicator so version query strings should no longer be necessary for normal updates.

## Test checklist
1. Dashboard Today's Chores shows completed progress.
2. Complete a chore; it stays visible and shows who completed it.
3. Complete a weekly chore after 7 PM local time; it should still count for the correct local day.
4. Ashley/Jerry profile identity is correct.
5. Change password / owner reset still works.
6. V48 label appears at bottom of sidebar.
