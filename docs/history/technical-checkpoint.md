# Technical checkpoint

**Historical note:** this describes the original checkout before the TanStack
rebuild. Use [the technical foundation](../architecture/technical-foundation.md) and root README
for current commands and coverage.

Technical work was paused in favour of product discovery. The working tree contains
an initial test setup and small fixes; this is not a declaration that the application
is ready for production.

## Available locally

Requires Node.js 22+ and npm. From the repository root:

```sh
npm ci
npx playwright install chromium firefox webkit
npm run check
```

- `npm test`: parser examples and invite-resend handler tests.
- `npm run test:browser`: browser journeys with synthetic HTTP responses.
- `npm run test:ui`: interactive Playwright test runner.
- `npm run demo`: opens a dedicated Chromium window with an in-memory backend.

In the **demo window**, sign in as `coach@example.test` or `client@example.test`
with any nonempty password. Sign out to switch roles. A sample programme is seeded;
changes survive page reloads but are discarded when the demo process ends. No
Supabase account or credentials are needed. Invitation delivery is a canned success,
not an actual email or new account. Use the window opened by the command: interception
does not apply to another browser window. Close the browser or press Ctrl-C to stop.

`npm run dev` only serves the static application. It does **not** supply a synthetic
backend: the checked-in app still points to Mark's hosted Supabase project. For
synthetic exploration, use `npm run demo` instead.

## Verification recorded before discovery

- 9 unit tests passed.
- 21 browser checks passed: seven scenarios across Chromium, Firefox and mobile WebKit.
- Scenarios: visible sign-in errors; preview without writes; coach-to-client programme
  and workout flow; programme-save failure/retry; onboarding validation; invitation
  submission; manifest/service-worker asset paths.
- Browser tests use the real app and a locally installed Supabase SDK, with intercepted
  API responses. Service workers are blocked in these tests; asset checks do not prove
  offline operation.
- GitHub Actions workflow added for the same checks and failure artifacts. No hosted
  CI run has been verified yet.
- The new demo launcher has not yet received a separate interactive walkthrough.

## Small fixes already made

- Invite resend checks the caller's relationship to the requested client before
  invoking privileged user lookup/email operations.
- Failed sign-in messages are displayed in the visible authentication section.
- Manifest and service worker icon paths match the committed files.

The first two defects had failing regression tests before the fixes; missing icon
paths also failed the browser asset check. These changes have not been deployed.

## Evidence limits and pending work

- No complete database schema, constraints, triggers or row-level security policies
  are present. Synthetic tests cannot establish real customer-data isolation.
- Handler tests substitute the Deno host and external services; they do not run a
  deployed Edge Function or prove email delivery.
- Workout completion is multi-step and vulnerable to partial writes/retries.
- In-progress workout state is held in browser memory without a resume flow.
- Broader review findings and unresolved product semantics are captured in the
  product inventory and questions; they need prioritisation against agreed stories.

Once the product slice is agreed, obtain a reviewed backend baseline from Mark,
build disposable real-backend tests, and verify access control and persistence in
addition to the synthetic suite. Choose that work deliberately rather than inventing
a database schema from frontend requests.
