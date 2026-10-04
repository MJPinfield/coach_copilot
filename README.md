# Coach Copilot

A local-first **design and testing foundation**, rebuilt with React, TypeScript,
TanStack Router, TanStack Query and Vite. Product scope is still being discussed in
[the product workspace](docs/README.md).

**Supabase is implemented as a separate local backend** for authentication, Postgres,
RLS and transactional APIs. See [backend setup and testing](supabase/README.md).
The local API below is a synthetic fixture for fast design and browser testing.

For the real backend: `npm run backend:start`, then `npm run check:backend`.
Use `npm run backend:seed` for fictional accounts and `npm run catalogue:import`
for the real exercise library and Gym Visual image/GIF references. No hosted account
is required. The design UI has not yet been connected to this authenticated backend.

## Start designing

Requires Node.js 24+ and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:5173 in any browser. The local API seeds a fictional client
and programme automatically. Edit the programme as coach, then open **Client view**
to see the result. No account, credentials or external service is needed.

The **Design scenario** selector exposes populated, empty, slow, read-error and
save-error states. Errors fail once so you can exercise retry. **Reset demo**
restores fixtures and rearms errors. Draft fields survive failed saves; saved data
survives reloads and navigation until the server restarts or the demo is reset.
Browser profiles get isolated workspaces; tabs in the same profile share data.

## Domain component library

```sh
npm run components:dev
# http://127.0.0.1:5174/test-components.html
npm run storybook
# http://localhost:6006
```

Reusable Mantine components cover coach prescriptions, client set logging, supersets,
programmes, accounts, guidance, feedback, conversations and adaptations. The gallery
uses fictional training records and real catalogue guidance/media references; actions
run in memory. See [component contracts and coverage](docs/architecture/component-library.md).

`npm run test:components` builds the gallery and checks interactions, accessibility
and mobile layout in Chromium, Firefox and WebKit. `npm run storybook:build` builds
the isolated examples. Outputs are under `.artifacts/`.

## Verify in real browsers

```sh
npx playwright install chromium firefox webkit
npm run check
```

`check` runs TypeScript, a production build, and the browser integration suite
against the built app and local HTTP API. Chromium, Firefox and mobile WebKit run
the same journeys. Tests have isolated workspaces and need no running dev server.

For the short feedback loop:

```sh
npm run test:browser:quick  # Chromium against the dev server
npm run test:ui            # interactive browser runner against the dev server
npm run test:headed       # watch Chromium run
npm run test:report       # inspect the last report and failure traces
```

Playwright owns port 4173; development uses 5173. CI runs `check` and retains the
HTML report, screenshots and traces on failure.

## Where to work

- `src/main.tsx`: application entry point and providers.
- `src/app/router.tsx`: typed routes and application shell.
- `src/app/styles.css`: responsive design tokens and UI styling; Vite updates instantly.
- `src/features/programme/`: coach/client UI, HTTP boundary and prototype data types.
- `src/backend/`: typed Supabase client factory and generated database/API types.
- `public/`: static assets served at the site root.
- `tooling/`: Vite configuration, synthetic local API and backend development scripts.
- `tests/playwright*.ts`: browser runner configuration.
- `tests/browser/`: acceptance journeys through the real browser and HTTP API.
- `supabase/`: fresh migrations, local Auth configuration, database tests and Edge Functions.
- `docs/product/`: brief, user stories, open questions and research.
- `docs/architecture/`: domain/data models and [technical foundation](docs/architecture/technical-foundation.md).
- `docs/history/`: historical technical records.

Build output, browser reports and failure traces live under the ignored `.artifacts/`
directory. The root retains npm manifests, the TypeScript project config, Vite's HTML
entry point and repository-level instructions. Use the npm scripts above so relocated
tool configurations are loaded automatically.

This is a synthetic prototype, not a production coaching service. It has no
authentication or durable database. `npm run preview` serves the built prototype
with the same local API; serving `.artifacts/dist/` alone requires a future `/api` backend and
SPA fallback. The previous app is available in Git history at `8e5b952` and in the
original checkout. It is no longer the application entry point on this branch.
