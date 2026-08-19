# V47 Password Management

Built from V46.2.

Adds:
- signed-in users can change their own password from Cloud Sync -> Password & Security
- current password is verified before changing it
- household owner can reset another family member's forgotten password
- owner reset generates a random temporary password and copies/displays it
- reset member is marked must_change_password=true
- no email recovery or SMTP required for owner-assisted recovery
- existing forced-password-change flow remains in place
- cloud-config.js is intentionally not included

Required:
1. V46.2 database migration already applied.
2. Keep updated create-family-account function deployed.
3. Deploy new Edge Function reset-family-password from included index.ts.
4. Verify JWT with legacy secret = OFF for reset-family-password.
5. Upload V47 web files to GitHub.
6. Open with ?v=47.

Note:
Supabase also supports email-based password recovery via resetPasswordForEmail, but that flow requires outbound email/SMTP. V47's owner-reset path avoids that dependency for this private family app.
