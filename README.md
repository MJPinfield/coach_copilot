# Coach Copilot V3.3.1 — client onboarding

This build adds coach-side client onboarding without exposing Supabase admin credentials in the PWA.

## Static app
Upload the normal root files to GitHub Pages as before.

## One-time Supabase setup
V3.3 also contains:
- `supabase/functions/invite-client/index.ts` — privileged invitation function. Deploy this as a Supabase Edge Function named `invite-client`.
- `supabase/v3.3-activate-invited-client.sql` — run once in SQL Editor.

The Edge Function uses Supabase's server-side `SUPABASE_SERVICE_ROLE_KEY` environment secret. Never put that key in `index.html` or GitHub Pages.

## Flow
Coach clicks + Add Client → name/email → Edge Function sends Supabase invitation and creates a pending relationship → client accepts invite → relationship becomes active → client appears as active in Coach Copilot.

Deactivation changes `coach_clients.status` to `inactive`; it does not delete training history.


V3.3.1 adds inline resend progress/success/error feedback beside each pending client.

## V3.3.5
Pending clients now use a password recovery/setup email for **Resend setup link**, rather than trying to invite an Auth user a second time. The PWA handles the Supabase `PASSWORD_RECOVERY` event and lets the client choose a password before opening the app.

Deploy the included `supabase/functions/invite-client/index.ts` over the existing `invite-client` Edge Function when deploying V3.3.5.


## V3.3.5
Recovery/setup links are detected from the URL before normal client boot, so an authenticated recovery session is forced through Finish account setup and password creation before the client app opens.


## V3.3.5
Client account setup now activates the coach/client relationship through the restricted `activate_my_client_relationship()` RPC instead of a direct browser update that can be filtered by Row Level Security.

Run `supabase/v3.3.5-activate-client-rpc.sql` once in the Supabase SQL Editor, then upload the V3.3.5 static app files to GitHub Pages. The existing `invite-client` Edge Function does not need changing for this patch.
