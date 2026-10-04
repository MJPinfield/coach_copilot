# TanStack foundation

## Decision · 2026-10-03

Max requested an isolated Worktrunk rebuild that replaces the implementation and
makes local design and browser integration testing fast. The branch is
`rebuild/tanstack-foundation`, based on `8e5b952`. Product guidance was copied from
the original working tree because it had not been committed there.

Use **React + TypeScript + TanStack Router + TanStack Query + Vite**. Router owns
typed navigation; Query owns HTTP reads, mutation status and the shared programme
cache. Code-based routing keeps this two-page foundation small. Vite supplies HMR.
TanStack Start is an option if server rendering or server functions become a
requirement; the current product guidance does not establish either requirement.

The old monolithic frontend and service worker are removed from this branch.
**Supabase remains the backend choice**, as explicitly confirmed by Max. The
incomplete historical SQL patches have been removed; the invitation Edge Function is retained
at `supabase/functions/invite-client/index.ts`, including the original checkout's
relationship-check fix. See [backend integration](../../supabase/README.md).
Historical frontend source remains in Git. The prior technical checkpoint
and domain inventory describe that historical app, not the rebuilt prototype.

## UI component decision · 2026-10-04

Max confirmed **Mantine** as the component library for Coach Copilot after comparing
it with Chakra UI Pro, Material UI and shadcn/ui. Its integrated inputs, forms,
navigation, dialogs, dates and charts fit programme authoring and mobile workout
logging with less assembly work.

Use [Mantine](https://mantine.dev/) components and
[Mantine UI](https://ui.mantine.dev/) layout examples for upcoming UI work. Begin
with the default theme and focus on working flows, responsive layouts and usable
touch targets; custom branding and theming are deferred. React, TypeScript, Vite,
TanStack Router/Query and Supabase remain the foundation.

This records the agreed direction; Mantine installation and conversion of the
existing synthetic screens are part of the upcoming UI implementation.

## Small executable design slice

Coach edits a fictional programme title and notes → saves over HTTP → client sees
the result → reload retains the saved result. This is a technical proving slice,
not agreement on programme publication, account roles or production behavior.

`dev/local-api.ts` mounts a process-local synthetic API in Vite dev and preview.
An opaque browser-local workspace ID isolates state so parallel tests do not race.
The shared seed and visible scenario controls work in any browser, including
Playwright; no browser interception, cloud credentials or external SDK is needed.
The API validates edits and returns real HTTP failures for the recovery scenarios.
State is discarded on server restart; Reset demo resets only the current workspace.

## Feedback loop and evidence

1. Run `npm run dev`, choose a scenario, edit UI/CSS and inspect with HMR.
2. Write a browser journey for an agreed behavior in `tests/browser/`.
3. Run `npm run test:ui` or `npm run test:browser:quick` during iteration.
4. Run `npm run check` before sharing: strict types, build, then Chromium, Firefox
   and mobile WebKit against the built application and local API.

Browser coverage includes save/read/reload/reset, failed read retry, failed save
retry with draft retention, empty-state recovery, slow load/save, blank-title
validation, viewport overflow, and unknown-route recovery. Add unit tests when
substantial domain rules emerge; the current value is in integrated UI behavior.

Verified locally on 2026-10-03: TypeScript and production build passed, all 21
cross-browser checks passed against the built app, and all seven Chromium checks
passed against the dev server. The desktop prototype was also inspected in a
browser. The GitHub Actions workflow has not yet been run on the hosted branch.

The [fresh backend](backend-api.md) now provides Supabase authentication, RLS,
database persistence and workout commands with real integration tests. Wiring this
design UI to that API, offline behaviour and hosted deployment remain future work.
The synthetic browser suite establishes prototype behaviour; the separate backend
suite validates the database/Auth/API foundation.
