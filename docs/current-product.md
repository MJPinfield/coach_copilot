# Product inventory

This is an **as-is map**, not the target specification. The current prototype and
historical application are described separately below. Neither inventory establishes
what is deployed at the live URL.

## Current connected client journey

The default Mantine UI now connects to real local Supabase Auth and workout APIs:
login → client home → published workout selection → saved workout. Clients switch
blocks and rounds around equipment availability, log actual values separately from
targets, resume drafts and finish partially performed workouts explicitly.

Device journals retain edits before upload and through failed requests. Production
builds cache the app shell for offline reload of a downloaded workout with a usable
auth session. Reconnection with the workout page open syncs pending entries.
Background sync, concurrent-device conflicts and expired-session offline access are
not implemented. See [client journey](product/client-workout-journey.md) and the root
README for setup, verification and exact boundaries.

AI, coach authoring screens and invitation/password setup screens are not part of
this connected slice. The independent component gallery remains in-memory.

## Earlier synthetic rebuild (historical)

The foundation merged in `313ecf3` provides a synthetic coach/client design slice:
the coach edits a fictional programme's title and notes, saves through the local
HTTP API, and the client view displays the result. Saved fixture data survives
navigation and reload within a workspace, but not a server restart or demo reset.

Design controls expose populated, empty, slow, read-error and save-error scenarios.
The design UI has no authentication or durable database connection. A separate
[fresh Supabase backend](architecture/backend-api.md) now implements authentication,
the domain schema, RLS and transactional workout/adaptation commands. The old UI
journeys below have not been reimplemented in the frontend.

AI workout analysis and conversational adaptation were requested by Max on
2026-10-04 and are captured in [US-16–19](product/user-stories.md#us-16--analyse-my-training-through-a-context-aware-conversation).
They are product direction, not implemented prototype capabilities.

Visual exercise guidance and dataset-linked exercise identities were also requested
on 2026-10-04. See US-20–21 and the [proposed data model](architecture/data-model.md); the current
prototype still has name/prescription strings. The separate backend now contains the
real dataset and attributed image/GIF references, ready for frontend integration.

The merge verification passed typechecking, a production build and 21 browser
checks across Chromium, Firefox and mobile WebKit. These exercise the built
prototype and its local HTTP API, not the historical intercepted-Supabase suite.
See [technical foundation](architecture/technical-foundation.md) for current commands and scope.

## Historical inventory: pre-rebuild application

The remaining inventory records the original frontend at revision `8e5b952`, plus
the small working-tree fixes described in the [historical technical checkpoint](history/technical-checkpoint.md).
It is retained as discovery evidence, not a requirement to restore every old feature.
Function references below refer to that historical frontend unless otherwise stated.

Four parallel research passes informed these documents: coach journeys, client
journeys, domain rules and comparable products. The source inventories were read-only.
Authenticated production behavior and backend policies remain unverified.

## Historical capabilities at a glance

| Journey | Source-observed capability | Important limit | Draft stories |
| --- | --- | --- | --- |
| Client entry | Coach invites; client sets password; relationship activates | Real email/link lifecycle unverified; no client-facing forgot-password action | US-01 |
| Client management | List invited/active clients; resend; select; deactivate | No reactivation UI or established post-deactivation access promise | US-02, US-15 |
| Client context | Selected client's plan, recent activity and feedback | No roster-wide attention queue; “current” mostly means UI selection | US-03, US-13 |
| Shorthand authoring | Local parse, editable preview, save new plan or append sessions | Heuristic notation; no publication boundary; draft not bound to original client | US-04 |
| Manual authoring | Programme/week/session/exercise/set creation; edit targets and notes | Changes save immediately; no explicit release/version workflow | US-05 |
| Next week | Copy selected week's structure and targets into a new numbered week | No scheduled delivery, automatic advancement or progression rule | US-06 |
| Find training | Client selects programme, week and session | No explicit next session; full instructions appear after starting | US-07 |
| Train | Log actual load/reps/RIR; check sets; complete prescribed values | In-memory working state; incomplete work can still become a completed workout | US-08, US-10, US-11 |
| Adapt training | Free-text swap; add/remove sets; edit actuals | No approved alternatives or explicit reason; history obscures deviations | US-09 |
| Feedback | Energy, sleep, pain and notes at finish | Defaults can look like intentional answers; no review acknowledgement | US-10, US-13 |
| History | Completed workouts, exercise values, feedback, previous performance | No correction flow or complete original-prescription snapshot | US-12 |
| Progress | Weekly counts and simple load/rep PRs | Counting and comparison definitions need agreement; algorithms differ | US-14 |

## Historical coach journey details

### Bring a client into coaching

The coach supplies name/email. The Edge Function checks coach role, then separately
invites an auth user, writes their profile and links the coaching relationship.
Pending clients get a resend button; only active clients get Select. A client chooses
a matching password of at least eight characters before the UI requests activation.

The resend-handler fix verifies a linked invited/active relationship and is retained in the rebuild.
The UI only exposes resend for pending clients. Partial new-invitation failure and
existing-email conflicts do not have a complete recovery journey here.

**Evidence:** [Retained invitation handler](../supabase/functions/invite-client/index.ts);
[historical frontend](https://github.com/MJPinfield/coach_copilot/blob/8e5b952/index.html)
`boot`, `inviteClient`, `renderClients`, `savePassword.onclick`.

### Manage the relationship

Deactivation changes the link to inactive and removes it from the visible roster.
The confirmation text promises to retain history; no account deletion occurs here.
There is no visible return/reactivation flow. Inactive status is not itself an
explicit frontend access block; real permissions depend on missing policies.

Activation SQL can affect all the client's invited relationships. An older
email-confirmation trigger also exists; its deployed status is unknown.

**Evidence:** `loadClients`, `renderClients`; the three historical SQL scripts at Git revision `8e5b952`.

### Create and revise a prescription

Quick Build recognises sets×reps, kg, RIR, session headings and some notes. Its
preview is local, editable and cancellable. A rep range becomes its lower bound
as the structured target, with the range preserved in notes. Saving creates a new
programme or appends sessions to the selected week.

Manual authoring supports programme/session naming, exercises, sets, copy-down
targets, notes and removal. New programmes start with Week 1 / Session 1. Ordinary
field changes save immediately. Create Next Week copies the selected week to the
next available number; it does not decide the progression for Mark.

There is no dedicated release step, archive workflow or revision model. Multiple
programmes can coexist, with default selection falling back to the first loaded one.

**Evidence:** `parseQuickBuild`, `renderQuickDraft`, `saveQuickDraft`, `makeExercise`,
`makeSet`, programme/session/exercise handlers, `createNextWeek.onclick`.

### Review a client

The selected-client snapshot shows selected programme, completed count this week,
total completed workouts, latest sleep band and last workout date. History includes
exercise performance and client feedback. There is no review queue, response or
acknowledgement state, nor an explicit prescribed-versus-actual comparison.

**Evidence:** `renderCoachSnapshot`, `loadHistory`, `renderHistory`, `isHistoryPR`.

## Historical client journey details

### Find and understand training

Clients land on Workout, with coach-facing tabs hidden. They choose programme,
week and session themselves; selectors default to the first available values.
The normal pre-start view names the session but does not show the full prescription.
Different empty conditions collapse into “No session selected.”

**Evidence:** `boot`, `loadTree`, `cur`, `renderWorkout`, client selector handlers.

### Perform or adapt a session

Starting creates an in-progress workout and copies the prescription into page memory.
Exercise notes and previous same-name performance are shown. Load is prefilled;
reps/RIR have targets. Checking a set fills blanks from targets, while Complete
prescribed checks all current sets for the exercise, including added ones.

Clients can change actual values, add/remove sets and enter a replacement exercise
name. These do not rewrite the coach's prescription. Removed sets disappear from the
submitted record; unchecked sets remain as incomplete rows. History does not clearly
distinguish these cases, substitutions or extra sets.

**Evidence:** `startWorkout.onclick`, `renderWorkout`, `makeWorkoutSet`, `previousSummary`.

### Finish and report back

Finish writes remaining sets, then feedback, then marks the workout completed.
There is no required completion threshold. Feedback includes energy, sleep, pain
details and notes; several fields have defaults and are not visibly reset for the
next workout. Notes and selected feedback appear in history; saved pain effect does not.

**Evidence:** feedback markup; `finishWorkout.onclick`, `renderHistory`.

### Return to previous training

History reads completed workouts newest first and groups recorded sets by exercise
name. There is no completed-workout correction workflow. Previous performance and
PRs match exercises by trimmed, case-insensitive names, which can fragment when
names change or conflate distinct movements with similar naming.

**Evidence:** `loadHistory`, `previousSummary`, `findPRs`, `isHistoryPR`, `renderHistory`.

## Historical gaps to resolve through product stories

These findings explain why the historical inventory is not a readiness assessment.
They inform discovery; they are not claims that the refactored code has the same
defects. Implementation order should follow the agreed product slice.

| Finding | Source evidence | Why it matters / question |
| --- | --- | --- |
| Training data permissions unverified | Full schema and RLS absent | Who sees whose information, including former clients? Q-04 |
| Save can partially succeed or duplicate work on retry | `finishWorkout.onclick` uses separate writes | What does a successful finish guarantee? Q-08 |
| Unfinished values are lost on reload | `activeWorkout` exists only in page memory | What must resume, and under which interruptions? Q-08 |
| Draft destination can change | Global `quickDraft`; save reads current `selectedClient`/week | Coach must understand who receives a prescription. Q-05 |
| Cleanup claims more than it guarantees | `cleanupQuickBuild` ignores returned delete errors | Failure recovery needs truthful status. Q-14 |
| Plan edits lack historical version semantics | Direct writes; no complete original-target snapshot | Which prescription did the client actually follow? Q-05 |
| Activity count may misrepresent adherence | All completed workouts since local Monday / selected week's session count | Define planned versus performed scope. Q-11 |
| Immediate and historical PRs can disagree | `findPRs` versus `isHistoryPR`; history can label unchecked sets | Agree eligible performance and comparison rules. Q-12 |
| Default/reused feedback can misrepresent a report | Feedback controls and finish handler | Which values must be consciously reported? Q-10 |
| Asset caching does not provide offline workouts | Service worker caches static assets; no workout queue/resume | Define the actual connectivity promise. Q-02, Q-08 |

## Historical test evidence

The pre-rebuild local run passed **9 unit tests and 21 browser checks**. The seven
browser scenarios run across Chromium, Firefox and mobile-emulated WebKit.

- Parser examples cover multiple sessions, notes, ranges, decimals and unknown values.
- Invite-resend handler tests substitute services to check relationship/role rejection.
- Browser tests exercise the real frontend and Supabase SDK with intercepted responses:
  sign-in errors; preview/cancel; create programme → client workout → history after
  reload; one programme-save failure/retry; setup validation; invitation submission;
  manifest/service-worker asset availability.

These do **not** prove email delivery, SQL behavior, real persistence, RLS, actual
device behavior, service-worker installation or offline recovery. The failure/retry
test concerns programme creation, not workout completion. See
[historical technical checkpoint](history/technical-checkpoint.md) for that record and its
evidence limits. Use [technical foundation](architecture/technical-foundation.md) for current tests.
