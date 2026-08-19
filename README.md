# V46 Owner Account Setup

Built from V45/V44.

New workflow:
- household owner creates family accounts directly
- choose family profile + email + temporary password
- optional secure temporary-password generator
- no invitation email
- no confirmation email
- no SMTP required
- account is email-confirmed by the server and usable immediately
- account is automatically linked to Miller Home and the selected Family Profile
- only the database-confirmed household owner can use the privileged account-creation endpoint
- service-role key remains server-side in Supabase

Required:
1. V44 Family Profiles migration already applied.
2. Deploy Edge Function `create-family-account` using included index.ts.
3. In that function's Settings, keep "Verify JWT with legacy secret" OFF.
4. Custom SMTP may be turned OFF.
5. Upload V46 web files to GitHub, leaving cloud-config.js untouched.
6. Open with ?v=46.

See V46-SETUP.md.
