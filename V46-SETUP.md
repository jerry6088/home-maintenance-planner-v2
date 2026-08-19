# V46 Setup

## 1. Supabase Edge Function
Create/deploy an Edge Function named exactly:

create-family-account

Paste the contents of:
supabase/functions/create-family-account/index.ts

In the function Settings, leave "Verify JWT with legacy secret" OFF.
The function verifies the signed-in user itself and then checks the database to ensure that user is the household owner.

## 2. Custom SMTP
Not required for creating family accounts.
You can turn Custom SMTP OFF.

## 3. GitHub
Upload/replace the normal V46 website files.
Do NOT replace your existing cloud-config.js.

## 4. Use it
Open ?v=46.
Cloud Sync -> Add Family Account.
Choose a family member, enter their email, and either type or generate a temporary password.
Give them those credentials. They can sign in immediately.
