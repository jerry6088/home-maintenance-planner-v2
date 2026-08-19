# V48.2 Atomic Chore Sync

This is a targeted fix based on live Supabase inspection.

Finding:
Ashley was the most recent cloud writer, but the shared hmv2-weekly-chores array still contained no completion state. So the completion was being lost before/while writing the whole household snapshot.

Fix:
- chore completion/undo now calls a dedicated Supabase RPC
- only hmv2-weekly-chores is updated
- the update is atomic and server-timestamped
- other household state is preserved
- receiving devices still use normal Realtime/polling
- V48 security and usability fixes remain intact

Required one-time step:
Run `v48-2-atomic-chore-sync.sql` in Supabase SQL Editor.

No Edge Function changes.
Do not replace cloud-config.js.

Then upload V48.2 and open once with ?v=482.
