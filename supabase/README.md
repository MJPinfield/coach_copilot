# Supabase backend

Supabase remains the chosen backend: Auth, Postgres with RLS, and Edge Functions.
The TanStack rebuild changes the frontend foundation, not this preference.

## Retained source

- `functions/invite-client/index.ts`: existing invitation handler, copied from the
  original working tree including its coach/client relationship check on resend.
- Root `v3.3-activate-invited-client.sql`, `v3.3.5-activate-client-rpc.sql`, and
  `v3.4.2-onboarding-status.sql`: existing incremental SQL patches.

These patches are not a full migration baseline: the repository does not contain
the table definitions, complete policies, constraints, or all auth triggers.
The React prototype currently calls only the synthetic `/api` fixture. It does
not yet connect to Supabase or exercise this Edge Function.

## Next integration step

Obtain the reviewed backend baseline from the existing Supabase project. With the
project owner's access and Docker available, the Supabase CLI workflow is:

1. `npx supabase init` to create local configuration.
2. `npx supabase login`, then `npx supabase link --project-ref <project-ref>`.
3. `npx supabase db pull` to capture the remote schema. Review application-specific
   auth/storage policies and triggers too; those schemas are excluded by default.
4. Add synthetic seed data, then `npx supabase start` and `npx supabase db reset
   --local` to verify the migration chain on a disposable local instance.
5. Generate database types; wire `src/api.ts` to the Supabase SDK and real auth.
6. Run browser journeys against local Supabase for auth, cross-role access,
   persistence and retry behavior, alongside the fast synthetic design suite.

Do not treat the fixture's `Programme` shape as a database schema. Map the agreed
product slice to the reviewed existing tables. Keep service-role credentials in
Edge Functions; the browser uses the public project key and authenticated session.

Official guide: https://supabase.com/docs/guides/local-development/overview
