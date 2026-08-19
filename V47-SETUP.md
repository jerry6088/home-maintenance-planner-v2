# V47 Password Management Setup

V47 keeps the no-SMTP family account workflow and adds two password paths.

## 1. User changes their own password
No extra Edge Function is required.
Cloud Sync -> Password & Security -> Current Password / New Password.

## 2. Owner resets a forgotten family password
Deploy a new Edge Function named exactly:

reset-family-password

Use:
supabase/functions/reset-family-password/index.ts

In Settings:
Verify JWT with legacy secret = OFF

The function verifies the caller's session itself, checks that the caller is the household owner, resets only a member of that household, generates a temporary password, and sets must_change_password=true.

## 3. Existing create-family-account function
Keep the V46.2 version deployed so new accounts receive must_change_password=true.

## 4. Database
The V46.2 migration must already be applied because V47 uses:
household_members.must_change_password
clear_my_password_change_flag(...)

No new V47 SQL migration is required.

## 5. GitHub
Upload the V47 web files.
Do not replace cloud-config.js.
Open with ?v=47.
