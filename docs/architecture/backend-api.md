# Backend API and initial rules

Implemented locally on **2026-10-04** using a fresh Supabase model. This is a backend
foundation; the current design UI still uses its synthetic API. No hosted deployment
or live AI model is connected.

## Confirmed decisions

Max chose a fresh database and approved these initial rules:

- Client onboarding is invitation-only. Coach roles are provisioned administratively;
  user-controlled auth metadata cannot grant a coach role.
- Coaches author programmes for invited/active relationships. Clients read only their
  published programmes while the relationship is active.
- AI conversations are private to the client. An assistant response/proposal is written
  only by trusted backend code, not forged through a client table insert.
- Clients can confirm an adaptation for the current workout without per-change coach
  approval. It does not rewrite Mark's programme or progress future sessions automatically.
- The relevant active coach can read the applied workout, readiness context, adaptation
  reason and feedback, but not the private conversation/proposal tables.
- Max confirmed a Gym Visual licence; the real exercise import includes attributed
  image/GIF URLs as well as text and metadata.

Implementation conventions for this first slice:

- Completing an attempt means the client finished recording it, not that every target
  was achieved. Unchecked sets and missing values remain distinct from completed work/zero.
- Deactivation blocks new client access to the programme and new starts. Clients keep
  access to their own workouts, including an already-started draft. The former coach
  loses workout access; the coach retains their authored programme records.
- Combining sessions is limited to one coaching relationship. Source links express
  provenance; they do not automatically credit two completed sessions for adherence.
- Completed attempts are immutable to the public API. Corrections, reactivation,
  calendar scheduling and PR/adherence algorithms need their own product decisions.

## Schema map

| Domain | Tables |
| --- | --- |
| Identity / coaching | `profiles`, `coach_clients` (auth identities live in `auth.users`) |
| Exercise library | `exercises`, `exercise_instructions`, `exercise_media` |
| Prescription | `programmes`, `programme_weeks`, `sessions`, `exercise_prescriptions`, `prescribed_sets` |
| Private conversation | `conversations`, `messages` |
| Adaptation | `adaptation_proposals`, `proposal_sessions`, `proposed_exercises`, `proposal_exercise_sources` |
| Performance | `workouts`, `workout_sources`, `workout_exercises`, `workout_exercise_sources`, `logged_sets`, `workout_feedback` |

All public domain tables have RLS. Anonymous API requests have no table grants.
Private authorization helpers are outside the exposed schema. Profile role updates,
shared catalogue/media imports and assistant/proposal writes require a trusted admin
or backend service. The client can edit only its own profile display name.

Exercise IDs identify movements, not labels. Prescription occurrences, applied
snapshots and actual performed exercise IDs remain separate. Client-authored extra
work and substitutions do not overwrite the original snapshot. Workout references
prevent referenced prescriptions/catalogue entries being deleted out from under history.

Programme revisions increment when the programme or its nested prescription changes.
Parents/ownership cannot be changed by moving existing rows to another programme or
client. Start snapshots and revision checks lock the programme against concurrent edits.

## Public API

Use Supabase JS's generated, typed `.from(...)` and `.rpc(...)` calls. Tables are exposed
at `/rest/v1/<table>`, commands at `/rest/v1/rpc/<name>`, all with the signed-in JWT.
There is no parallel custom REST server to maintain.

### Auth and invitations

- `auth.signInWithPassword`, `refreshSession`, `getUser`, `updateUser`,
  `resetPasswordForEmail`, `signOut`: actual Supabase Auth operations.
- Public `signUp` is disabled. The profile trigger creates a client profile for an
  invited/admin-created auth user and ignores any supplied role metadata.
- `functions.invoke('invite-client', { body: { name, email } })`: authenticated coach
  invites a new client; returns `clientId` and `relationshipId`. Auth creates the user
  and profile, then the function creates the invited relationship. It attempts cleanup
  of a newly created auth user if that relationship write fails. Email delivery and
  database writes are not one distributed transaction.
- Resend uses `{ resend: true, clientId }` and requires the caller's own pending
  relationship. Redirect destinations are server configuration, not caller input.
- After invitation/password setup, `accept_invitation({ relationship_id })` activates
  only that signed-in client's specified relationship. Repeating active acceptance is safe.
- `deactivate_relationship({ relationship_id })`: owning coach only.

### Programmes and catalogue

Coaches use table CRUD on their programme hierarchy and their own custom exercises/
instructions. Clients can read published plans, shared catalogue entries and custom
exercises owned by active coaches. Imported entries/media are not client/coach-editable.
Null exercise references represent unresolved free-text movements; they never silently
resolve to a guessed library entry.

Example nested read:

```ts
const { data, error } = await backend.from('programmes')
  .select('*, programme_weeks(*, sessions(*, exercise_prescriptions(*, prescribed_sets(*))))')
```

Sort nested data by its explicit `position` fields. Resolve exercise details through
`exercise_id`, including `exercise_instructions` and `exercise_media`. Shared lookup
permission does not imply access to anyone else's programmes or logs.

The API caps reads at 1,000 rows. Paginate catalogue results with `.range(...)`;
the full library has 1,324 imported exercises in addition to isolated test fixtures.

### Workout commands

| RPC | Inputs | Behaviour |
| --- | --- | --- |
| `start_workout` | `workout_id`, `session_ids`, optional `proposal_id`, `readiness` | Creates one attempt, sources, applied snapshots and empty actual-set records atomically. Retry the same UUID and inputs to get the same attempt. |
| `save_workout` | `workout_id`, `exercises`, optional `feedback`, `complete` | Atomically saves draft values or finishes. Locks the attempt; invalid values roll back the whole call. Retrying completion returns the same completed attempt without duplicate sets. |
| `add_workout_exercise` | `workout_id`, nullable `exercise_id`, `display_name` | Adds an explicitly unplanned occurrence to the caller's open workout. |
| `abandon_workout` | `workout_id` | Closes an open attempt as abandoned, retaining its recorded data. |

`save_workout.exercises` is an array of existing workout occurrences:

```json
[
  {
    "id": "<workout-exercise-uuid>",
    "performed_name": "Optional replacement label",
    "exercise_id": "<optional actual-library-exercise-uuid>",
    "sets": [
      { "position": 1, "load_kg": 70, "reps": 5, "rir": 2, "completed": true }
    ]
  }
]
```

For each supplied occurrence, sets replace its previous draft set values. Omitted
occurrences are unchanged. Empty sets represent no recorded work for that occurrence;
the applied prescription is retained. Omit `performed_name`/`exercise_id` to leave the
movement unchanged. JSON null is an unknown value, not zero. Supported feedback keys:
`energy`, `sleep_hours`, `pain_reported`, `pain_location`, `pain_severity`, `notes`.
There are no automatic wellbeing defaults. Re-sending a completed attempt does not edit it.

Resume by reading the client's `in_progress` workouts and their nested exercises/sets.
Direct client writes to these tables are denied, including attempts to rewrite snapshots.

### Chat and adaptation commands

Clients create their own conversations and append `role: user` messages. Trusted
backend code may append assistant messages. No model invocation/streaming endpoint is
implemented yet; these are storage and command contracts for the later agent integration.

`create_adaptation_proposal` is **service-role-only** and creates an entire proposal in
one transaction. Inputs: `client_id`, `session_ids`, `reason`, optional `conversation_id`,
and `exercises` with `position`, `exercise_id`, `display_name`, `notes`, `targets` and
`source_prescription_ids`. Targets use `position`, `load_kg`, `reps_min`, `reps_max`, `rir`.
Sources must belong to the selected client's published sessions. The function records
the current programme revision, validates references/targets and rolls back partial failure.

The client applies it through `start_workout` with the proposal ID. Changed programme
revisions, another client's proposal, mismatched sources and already-applied proposals
are rejected. Applied changes populate the actual workout instructions. `reject_proposal`
discards a proposed adaptation without modifying the programme. Rest/postponement can
remain a conversation outcome; the backend does not create fictitious completed work.

## Test and deployment boundaries

`npm run check:backend` tests local PostgreSQL constraints/privileges and actual Auth,
PostgREST, commands, function authorization, Mailpit invitation delivery, link redemption
and password setup. Cross-client, coach/client, draft/published, stale-proposal, retry and
atomic rollback scenarios are exercised using signed-in non-admin clients.

The catalogue import has separately been exercised twice against all 1,324 real records
to check ID stability, and sample real thumbnail/GIF URLs were fetched successfully.
CI uses a small test catalogue and needs no external dataset/media service.

Browser tests still exercise the design UI, not a live authenticated UI. Real model
behaviour, production email deliverability and a hosted deployment are not established
by these tests. Connect the UI to `src/backend/client.ts` next, then add those browser
journeys against this backend.
