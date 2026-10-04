# Supabase backend

Fresh schema, Supabase Auth, PostgREST table APIs, transactional RPCs and an invitation
Edge Function. This backend is independent of Mark's old database. Nothing here has
been deployed to his project.

## Local development

Requires Node.js 24+, npm and a running Docker-compatible runtime. The project wrapper
uses Docker when available, or the socket of the selected running Podman machine.
It does not change the selected machine or stop other projects.

```sh
npm ci
npm run backend:start
npm run backend:reset
npm run backend:seed
npm run catalogue:import
```

- API/Auth/functions: `http://127.0.0.1:55421`
- Postgres: `127.0.0.1:55422`
- Captured invitation/recovery emails (Mailpit): `http://127.0.0.1:55424`
- `npm run backend:status`: local URLs and keys.
- `npm run backend:stop`: stop this stack, retaining its database volume.

`backend:reset` destroys **this local database**, reapplies migrations and its SQL seed.
Run `backend:seed` and `catalogue:import` afterwards to repopulate local accounts and
the real exercise library. Seeds/imports refuse a non-local API URL.

Seed accounts: `coach@example.test`, `client@example.test`, `othercoach@example.test`,
`otherclient@example.test`. Development-only password: `Local-training-only-2026!`.
These are Auth users, not mocked sessions. They must not be provisioned in production.

## Real exercise catalogue

`catalogue:import` loads the pinned 1,324-exercise dataset, multilingual instructions
and real image/GIF URLs. Stable IDs survive repeat imports. Gym Visual attribution is
retained; Max confirmed the app has the required licence on 2026-10-04. The importer
records that confirmation as the rights reference. Assets currently resolve to the
pinned upstream revision; production hosting and offline availability remain separate
decisions. No binary media collection is committed to this repository.

The small synthetic exercise used by integration tests is separate from that real
catalogue. CI does not depend on fetching 1,324 exercises or external media.

## Verification

```sh
npm run backend:start
npm run check:backend
npm run check
```

`check:backend` resets the local database, lints SQL routines, runs pgTAP privilege/schema checks and real
HTTP integration tests, then checks generated TypeScript types for schema drift. The
tests seed isolated fictional accounts and exercise Auth, PostgREST, RPCs, Edge Functions
and Mailpit, including invitation redemption and password setup. Resetting removes any
locally imported catalogue; import it again after a clean test cycle if needed.

`check` retains the existing typecheck/build/browser suite against the synthetic UI.
The UI will connect to this authenticated API in the next phase. GitHub Actions runs
both jobs independently; the backend job needs no hosted Supabase account or secrets.

## Files and API contract

- `config.toml`: local services, invite-only Auth and local redirect URLs.
- `migrations/`: fresh database definition, RLS and transactional commands.
- `tests/database/`: pgTAP schema/privilege tests.
- `functions/invite-client/`: coach-authenticated invitation and resend endpoint.
- `../tests/backend/`: authenticated HTTP and integration scenarios.
- `../src/backend/database.types.ts`: generated types; use `npm run backend:types` after migrations.
- `../src/backend/client.ts`: typed public-key SDK factory for future UI features.
- [Backend API and decisions](../docs/architecture/backend-api.md): roles, tables, commands and limitations.
- [Domain security matrix](../docs/architecture/domain-security.md): all 25 tables,
  role-specific CRUD, lifecycle/deletion rules and executable security coverage.

Copy `.env.example` to `.env.local` and fill the local publishable key when connecting
UI features. Service-role keys stay in trusted scripts/functions, never `VITE_*` variables.
The Edge Function uses a server-configured `APP_URL` for redirects (local default
`http://127.0.0.1:5173`); configure this and Auth's matching redirect allowlist for deployment.

The three incomplete legacy SQL patches remain in Git history only. The fresh migrations
are now the source of truth. Future hosted deployment is a separate step, not part of
the local commands above.
