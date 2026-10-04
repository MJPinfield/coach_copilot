# Coach Copilot

Client training UI built with default Mantine, TanStack Router and Query, and a
real Supabase backend: **sign in → client home → choose a workout → log and save**.
Clients can switch exercises around busy equipment while retaining their results.
Supersets preserve A1 → A2 → rest → repeat.

## Run the client journey locally

Requires Node.js 24+, npm and the local container runtime used by Supabase.

```sh
npm ci
npm run backend:start
npm run client:seed
npm run dev:client
```

Open http://127.0.0.1:5173. `client:seed` creates the fictional
`training@example.test` account, prints its local-only password, and supplies two
demo sessions. It is repeatable and does not reset existing workouts. Demonstration
movements have no guessed exercise-catalogue identity.

`dev:client` discovers local Supabase and passes **only its public URL/key** to Vite.
For a separately configured backend, set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` in your ignored local environment, then use
`npm run dev`. A missing connection displays setup guidance on the login page.

Clients are invitation-only. Coach roles and programme authoring are backend
capabilities; this first connected UI focuses on the client workout journey.
See [backend setup](supabase/README.md) and [API contracts](docs/architecture/backend-api.md).

## Saved and offline workouts

- Start a workout while connected. Supabase snapshots the programme and creates
  actual-set records transactionally.
- Edits are written to a user/workout-scoped device journal immediately, then
  uploaded through `save_workout`. Blank actuals remain unknown, not zero.
- Switch exercises, leave and resume, or reload without losing device-saved entries.
  Failed saves have an explicit retry. Reopening a dirty workout resumes syncing.
- The **production build** precaches its application shell. After the initial
  connected load, an already-downloaded workout can be reopened and edited offline
  while the existing authentication session remains usable. Reconnect with its page
  open to sync. New sessions and sign-in require connectivity.
- Service workers are disabled in Vite development. Use the production preview
  built by `npm run test:client`, then `npm run preview`, for offline reloads.
- Clearing browser storage removes unsynced local entries. Device storage failures
  are surfaced; the UI does not claim those edits are device-saved. Background sync
  after closing the app, expired-session offline recovery, concurrent-device draft
  conflict resolution and offline exercise media remain follow-up work.

Finishing asks for confirmation. Unchecked sets stay incomplete; finishing does
not imply all targets were met. Completed workouts are read-only.

## Verify

```sh
npx playwright install chromium firefox webkit
npm run check             # TypeScript, build, signed-out route checks
npm run test:client       # Real Auth/DB journey, builds with local public config
npm run test:components   # Domain gallery, interactions and accessibility
```

The connected tests cover login/error/empty states, equipment-driven switching,
Supabase results, reload/resume, partial completion, failed-save retry, accessibility
and responsive overflow across Chromium, Firefox and mobile WebKit. Chromium also
tests full offline navigation/reload using the production service worker.

`npm run check:backend` resets the local database and checks schema, security, APIs
and generated types. After a reset, rerun `client:seed`; use `catalogue:import` to
restore the licensed real exercise catalogue. CI runs both backend and UI checks.

## Domain component library

```sh
npm run components:dev # http://127.0.0.1:5174/test-components.html
npm run storybook      # http://localhost:6006
```

The component gallery remains an in-memory engineering catalogue with fictional
records. See [component contracts](docs/architecture/component-library.md) and
[client journey decisions](docs/product/client-workout-journey.md).

## Layout

- `src/app/`: application shell, routes and Query client.
- `src/features/client/`: authenticated pages, workout editor and Supabase boundary.
- `src/components/`: controlled reusable Mantine domain components.
- `src/backend/`: typed client factory and generated database types.
- `tooling/`: Vite, component/Storybook configuration and local scripts.
- `tests/`: browser runner configuration, real client journeys and backend checks.
- `supabase/`: schema migrations, RLS, transactional APIs and database tests.
- `docs/`: product decisions, architecture and historical records.

Generated builds, test reports and screenshots live under ignored `.artifacts/`.
The previous synthetic programme slice remains in source/history but is no longer
the application entry point. No hosted deployment or live AI integration is implied.
