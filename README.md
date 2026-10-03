# Coach Copilot

A local-first **design and testing foundation**, rebuilt with React, TypeScript,
TanStack Router, TanStack Query and Vite. Product scope is still being discussed in
[the product workspace](docs/README.md).

**Supabase remains the backend choice** for authentication, Postgres and Edge
Functions. See [the retained backend and integration plan](supabase/README.md).
The local API below is a synthetic fixture for fast design and browser testing.

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

- `src/router.tsx`: typed routes and application shell.
- `src/programme.tsx`: the coach editor and client view, with Query reads/mutations.
- `src/styles.css`: responsive design tokens and UI styling; Vite updates instantly.
- `src/api.ts`, `src/model.ts`: HTTP boundary and shared prototype data types.
- `dev/local-api.ts`: synthetic API, fixtures, scenarios and reset behavior.
- `tests/browser/`: acceptance journeys through the real browser and HTTP API.
- [Technical foundation](docs/technical-foundation.md): decisions and boundaries.

This is a synthetic prototype, not a production coaching service. It has no
authentication or durable database. `npm run preview` serves the built prototype
with the same local API; serving `dist/` alone requires a future `/api` backend and
SPA fallback. The previous app is available in Git history at `8e5b952` and in the
original checkout. It is no longer the application entry point on this branch.
