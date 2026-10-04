# Domain component library

## Scope

Reusable React domain components built from **default Mantine**, confirmed by Max.
Both coach authoring and client logging are represented. Storybook isolates examples;
`test-components.html` displays the complete catalogue and compositions together.
These are controlled UI components, not a second backend or a replacement app shell.

## Direction contract

**THESIS:** Build from training records upward, so an exercise, its sets and a
superset mean the same thing wherever they appear. Avoid designing finished screens
before their shared parts work.

**OWN-WORLD:** Stock Mantine controls, system typography, default light theme, standard
spacing and semantic status colours. No custom palette, fonts or branded CSS.

**STORY:** Inspect the domain areas, change coach targets, log client sets, compare
original/applied/actual values, and exercise loading, empty, error and pending-sync states.

**FIRST VIEWPORT:** A compact component-library title and demo boundary, anchor links
to domain sections, then account and coaching components. The rest of the document
contains every component and nested training composition at its usable size.

**FORM:** User-pinned component catalogue, code-led. No concept seed: the requested
form is a dump of reusable components in `test-components.html`, with matching stories.
Mode: Operate. Mobile and desktop must both support coach and client controls.

**FINISH:** Desktop/mobile rendering, interaction and accessibility checks establish
the component baseline. The visual contract remains default Mantine; branding is deferred.

## Composition

Programme → weeks → sessions → workout blocks → exercise items → prescribed/logged sets.
A block is a single exercise or superset. Supersets alternate A1/A2 by round, keep
each exercise's targets/results distinct and prescribe rest after the complete round
(A1 → A2 → rest → repeat), not after each exercise.
Coach editing presents each exercise's prescription; client logging presents rounds
in performance order. Unequal set counts retain the remaining exercise's sets.

Superset grouping/rest is persisted by migration 005 in `session_blocks`,
`proposed_blocks` and `workout_blocks`; generated database types inform the component
contracts. Backend and security tests passed before UI implementation resumed.
Local examples are fictional;
save/sync and AI states are demonstrations, not implemented persistence or AI execution.

## Coverage map

| Domain tables / capability | Reusable UI |
| --- | --- |
| `profiles`, `coach_clients`, Auth | Profile identity, relationship actions, invitation and sign-in forms |
| `exercises`, `exercise_instructions`, `exercise_media` | Catalogue picker and exercise guidance, attribution/unmatched/unavailable states |
| `programmes`, `programme_weeks`, `sessions`, `session_blocks` | Programme tree, session composition, publication state and single/superset blocks |
| `exercise_prescriptions`, `prescribed_sets` | Workout item, target summary and prescribed set editor |
| `conversations`, `messages` | Private conversation and message composer |
| `adaptation_proposals`, `proposal_sessions`, `proposed_blocks`, `proposed_exercises`, `proposal_exercise_sources` | Proposal comparison, source references, apply/reject states |
| `workouts`, `workout_sources`, `workout_blocks`, `workout_exercises`, `workout_exercise_sources`, `logged_sets` | Workout summary, source references, workout blocks and logged set editor |
| `workout_feedback` | Feedback form with unknown values retained |
| Offline/save state | Explicit not-saved, device-saved, pending, syncing, error and synced status |

Join tables describe provenance inside meaningful components; they do not each need
a standalone card. Components receive data and callbacks and have no Auth, router,
network or storage dependency. Containers will own loading, permission enforcement,
persistence and future offline synchronization. UI visibility is not authorization.

## Run and integrate

- `npm run components:dev`: http://127.0.0.1:5174/test-components.html.
- `npm run storybook`: http://localhost:6006, with 18 isolated/composed examples.
- `npm run test:components`: production-gallery browser checks on port 4174.
- `npm run storybook:build`: static Storybook under `.artifacts/storybook/`.
- `npm run components:build`: gallery under `.artifacts/components/`.

Components live by domain under `src/components/`; fixtures and example containers
live separately under `src/component-library/`. Import the domain component directly,
load `@mantine/core/styles.css` once, and supply a `MantineProvider` in the app shell.
`training/model.ts` derives record fields from generated database rows and adds the
nested read shapes needed for composition. Containers assemble those shapes from
queries/snapshots and translate callbacks to transactional APIs.

Mantine owns input editing, validation helpers, accordions, responsive grids, selects,
focus and control behaviour. Supported `color`/`c` props select darker built-in shades
for action/link contrast; helper text uses a `Text` child. No custom theme, CSS control
implementation or router is introduced. The gallery is a document with section anchors.

Unknown actuals stay null and distinct from zero or completion. A superset round
updates only the edited exercise/set. Caller-supplied callbacks own acceptance,
publication, saving and retries; read-only review supplies no edit callbacks.
Key forms by record identity when loading a different record: their `initialValue`
is an initial draft, not a server-state subscription. Conversation drafts are controlled
so failed sends retain text and only successful sends clear it.

## Verification and boundaries · 2026-10-04

- 30 component browser checks passed (10 scenarios across three browser/device projects).
- No WCAG A/AA axe violations in the rendered gallery on those projects.
- Desktop and 390px mobile rendering inspected; no horizontal overflow.
- All 18 built Storybook examples rendered without page errors.
- Existing 21 browser checks, TypeScript and both builds passed.

The baseline is ready for screen composition. Examples do not authenticate, write
Supabase records, invoke AI or implement durable offline storage. `SaveStatus` accepts
already-established persistence state; only a future verified persistence layer may
claim device-saved/synced data. Follow AGENTS.md's library-first TanStack evaluation
when connecting routes, queries, AI streaming and reload-safe offline synchronization.

The catalogue picker demonstrates two real movements from the pinned upstream
dataset, with licence attribution and opt-in playback. Production catalogue search,
media hosting and offline media caching belong to the data/persistence integration.
Exercise-analysis taxonomy added independently in migration 006 is not yet exposed
as authoring UI in this baseline.
