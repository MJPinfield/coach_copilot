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

**FIRST VIEWPORT:** Compact product navigation, workout title and save status,
exercise selector with completion counts, current exercise and compact set controls.
Guidance and detailed load interpretation are expandable. Superset rounds retain
the paired exercise and rest instruction together.

**FORM:** Operate; code-led extension of the established Mantine world. User-pinned
login → home → selector → workout structure, with flexible exercise navigation.

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

## Finish review

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
