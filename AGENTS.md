# Project workflow

- After completing requested work and its relevant checks, commit the changes and
  push to this project's fork (`origin`: `MJPinfield/coach_copilot`) by default.
- Preserve unrelated user changes and review the staged diff before committing.
- Do not push to `upstream` (`MarkReid30/coach_copilot`) unless explicitly requested.

# UI components

- Backend-first domain changes: if UI work reveals a missing or incorrect domain
  model, pause frontend implementation. Update the Supabase schema, constraints,
  RLS, transactional APIs and generated types; add and pass the relevant domain
  and security tests before resuming frontend work. Do not mask the mismatch with
  frontend-only types, fixtures or state.
- Supersets are a confirmed product requirement. Preserve ordered exercise groups,
  alternating rounds, per-exercise targets and actuals, and original/applied workout
  history. Superset execution is A1 → A2 → rest → repeat: prescribe rest after the
  complete round, not after each exercise. Do not invent a separate intra-superset
  rest setting unless a later product requirement calls for it.

- Use Mantine for new UI work, as confirmed by Max on 2026-10-04.
- Start with Mantine's default theme; custom branding and theming come later.
- Use Mantine UI examples as starting layouts, adapting them to coach desktop and
  client mobile workflows. Keep TanStack Router and Query for navigation and data.
- Library-first implementation: consult current Mantine and TanStack documentation
  and use their applicable built-in capabilities before writing custom code,
  wrappers or overrides. Prefer composition and supported configuration over
  modifying library behaviour; document the concrete gap when custom code is needed.
- In particular, use TanStack Router's routing, search validation, loaders and
  pending/error/not-found handling instead of hand-rolled navigation or route state.
  Use Query's caching, mutations, retry and invalidation capabilities for server state.
- For offline work, evaluate TanStack Query's persistence, hydration, network modes
  and paused-mutation/resume support first. Explicitly verify reload recovery and
  synchronization needs; a cache alone is not durable offline logging.
- When implementing AI, evaluate the applicable TanStack AI/client integrations
  before building custom chat, streaming or tool-call plumbing. Verify suitability
  for the chosen backend/provider rather than assuming support.
- Prefer Mantine's controls, form helpers, hooks and accessibility behaviour over
  custom equivalents. Build domain components by composing them; add only the
  capabilities required for the current task, not every feature the libraries offer.

# Repository layout

- Keep development scripts and Vite configuration in `tooling/`, and browser runner
  configurations in `tests/`. Use npm scripts to load these relocated configs.
- Put generated build/test output under the ignored `.artifacts/` directory.
- Keep the root lean; place new files with the feature or tooling they belong to.
