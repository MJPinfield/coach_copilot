# Project workflow

- After completing requested work and its relevant checks, commit the changes and
  push to this project's fork (`origin`: `MJPinfield/coach_copilot`) by default.
- Preserve unrelated user changes and review the staged diff before committing.
- Do not push to `upstream` (`MarkReid30/coach_copilot`) unless explicitly requested.

# UI components

- Use Mantine for new UI work, as confirmed by Max on 2026-10-04.
- Start with Mantine's default theme; custom branding and theming come later.
- Use Mantine UI examples as starting layouts, adapting them to coach desktop and
  client mobile workflows. Keep TanStack Router and Query for navigation and data.

# Repository layout

- Keep development scripts and Vite configuration in `tooling/`, and browser runner
  configurations in `tests/`. Use npm scripts to load these relocated configs.
- Put generated build/test output under the ignored `.artifacts/` directory.
- Keep the root lean; place new files with the feature or tooling they belong to.
