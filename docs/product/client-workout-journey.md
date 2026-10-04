# Client workout journey

Confirmed 2026-10-04: build real saved workouts, starting at login, then client home,
workout selection and workout logging. Equipment availability means clients must
be free to switch exercises and return without losing their place.

## Direction contract

**THESIS:** Keep the next useful action clear without forcing exercise order.
An available exercise is always reachable from the workout overview.

**OWN-WORLD:** Existing default Mantine: system typography, light background for
bright gym use, blue actions, semantic feedback, standard controls and spacing.

**STORY:** Sign in, resume or choose a published session, record actual sets, move
between exercises as equipment becomes free, and finish recording explicitly.
Targets and performed results remain distinct; blank values never imply zero.

**FIRST VIEWPORT:** Compact product navigation with an Account menu, workout title,
Finish action, save status, exercise jump links and the first compact set rows.
All prescribed sets are visible in one scrolling log. Guidance and detailed load
interpretation expand on demand. Supersets retain A1 → A2 → rest in each round.

**FORM:** Operate; code-led extension of the established Mantine world. User-pinned
login → home → workout structure, with sessions directly on home and flexible
exercise navigation. The dedicated selector URL remains available.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Component review

Single-context review (nested agent launch blocked by harness depth limit).
Browser inspection of the component gallery confirmed useful target/actual
separation and correctly ordered superset rounds. Two priority gaps: repeated
classification/load controls make logging excessively tall; gallery-only state
has no real sign-in, persistence or resume journey. Scoped detector returned no
findings. Keep the gallery as an engineering catalogue, compose a focused client UI.

## Persistence

Supabase remains authoritative. Read published sessions under RLS; start and save
through existing transactional RPCs. No prescription model changes are required
for choosing a different exercise to perform next.

TanStack Query persistence, hydration, network modes and paused-mutation resume were
evaluated. The app uses Query mutations with a per-workout serial scope. A synchronous
local journal is also needed: entries must survive a reload before the debounce
creates a mutation, and failed (not only paused) requests must remain recoverable.
The journal stores the applied graph, actuals, notes and local revision, scoped to
the signed-in user and workout. A response only clears the matching local revision.
Workout loaders use TanStack Router's blocking stale reload mode: mounting an editor
from a stale route snapshot can otherwise overwrite the current device selection
when returning from the home page. The browser journey explicitly covers this resume.
Actual load conventions remain unknown until recorded explicitly; a target's known
load type or machine reference is not silently copied into actual history.
Workbox via `vite-plugin-pwa` precaches build assets, not Auth or database responses.

Supported offline boundary: a previously loaded workout, usable existing auth
session, same browser/device, page open for reconnection upload. New starts require
network. Background sync, expired-session offline recovery, concurrent-device
conflicts and media caching remain open. The existing backend's completion API is
immutable; an attempted draft save against a remotely closed workout retains local
entries and reports failure rather than claiming they synced.

## Scrollable-flow revision · 2026-10-04

Max rejected the selector-heavy flow and requested Strong/Hevy-style direct logging.
The existing backend already owns ordered prescribed sets and target ranges; no
domain/schema change is required for showing them together. Mantine Group,
NumberInput, ActionIcon, Popover and Menu provide the interaction without custom
navigation or control implementations.

- Home exposes published sessions and their Start buttons directly.
- All sets are on the page; exercise anchors replace block/round selection.
- Rep inputs suggest the applied prescription's lower bound (or upper bound if
  that is all the PT supplied). Ticking the set accepts that value; clients can
  change it first. No added sets or prescription edits are implied.
- Suggestions are presentation-only until the row is edited/recorded. Completing
  the workout does not turn untouched suggestions into actuals. Explicit blanks
  survive same-device reloads via an optional edited-set journal marker. Existing
  actuals and completed history are never given defaults. Load conventions and
  machine references still require explicit recording.
- Supersets repeat A1, A2, rest for each round; normal sets retain their own rest.
- Sign out lives in the header Account menu; Finish is available at both ends of
  the workout. Set details preserve all load controls and target notes.

**Review:** desktop (1440px) and mobile (390px) inspected together. The first batch
found low-contrast subtle-button text and duplicate round landmark labels; corrected
with Mantine's text-color prop and block-qualified labels. Mechanical detector: no
findings. No shipping raster assets or custom theme were introduced.

**Disposition: ship.** Final mobile/desktop confirmation is complete. `npm run check`
passes typecheck/build and 9 signed-out checks; `npm run test:client` passes 10
real-backend checks (2 existing non-Chromium offline skips). Coverage verifies
scrollable set order, PT defaults, variations, explicit blanks after sync/reload,
untouched actuals remaining null, offline recovery and completion. Axe reports no
violations in completed workouts, home, or open set-details controls at either size.
Edited-set markers use exercise ID plus position because `save_workout` replaces
logged-set rows and their IDs. This is same-device suggestion state, not a new
backend fact; cross-device blank-versus-untouched intent remains outside this slice.

## Original connected-slice finish review (superseded layout)

**disposition: ship** — first connected slice, single-context review because the
harness refused nested review/documenter agents. This is not an independent audit.
Desktop and mobile captures were inspected together; the correction batch replaced
the long list of every round with a selectable round and a Next round action.

### persistence

Product context, this durable surface contract and `DESIGN.md` are present. Local
Impeccable artifacts include the surface brief, token sidecar and review captures.

### fidelity

| Element | Result |
| --- | --- |
| Type | Match: default Mantine system typography |
| Material | Match: native library controls, no decorative asset substitutes |
| Ground | Match: default light surface |
| Journey | Match: login, home/resume, selection, saved workout |
| Flexible performance order | Match: block and round selectors retain entered actuals |
| Supersets | Match: A1/A2 displayed per round, one after-round rest instruction |
| Details | Match: guidance and load interpretation expand on demand |

### ceiling

Custom branding remains deliberately deferred. The current component world is
preserved. No shipping raster assets were added. The scoped detector returned zero
findings. The first pass supports the documented offline boundary, not a complete
multi-device offline system.

### material_fixes

Resolved: low-contrast defaults through built-in Mantine colour props; excessive
round-list length through round selection. Final captures show the intended layout.

### keep

Keep free exercise selection, separate target/actual values, explicit save state,
unknown values, and the complete-round superset rest instruction.

Verification: `npm run check` passed 9 signed-out browser checks; `npm run test:client`
passed 10 real-backend browser checks (two intentional non-Chromium offline-navigation
skips); `npm run test:components` passed 39 component checks. TypeScript and builds
passed. The connected journey includes axe accessibility and overflow assertions.
