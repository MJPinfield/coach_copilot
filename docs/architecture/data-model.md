# Proposed data model: exercise library and training references

Status: **Model implemented in the fresh local backend**, 2026-10-04. This extends
the [domain model](domain-model.md). See [backend API](backend-api.md) and
`supabase/migrations/` for concrete names, permissions and commands. It is not a
claim about Mark's old hosted database or the still-synthetic design UI.

The current [`src/features/programme/model.ts`](../../src/features/programme/model.ts) is a synthetic programme DTO whose
exercises contain only `name` and `prescription`. It does not yet represent this
library, exercise identity, media or workout history. The separate generated
`src/backend/database.types.ts` represents the implemented backend. Max chose a fresh
schema rather than compatibility with the old database; see
[backend setup](../../supabase/README.md).

## Source inspected · 2026-10-04

Max selected [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset).
The observed upstream revision was `7455efae41b330c265e7cd4b78dfa848e7ce5ebd`.
The JSON contained **1,324 records**, all with English instructions and thumbnail/GIF
references. These checks establish data presence, not media accessibility, teaching
quality or coverage of Mark's programme.

- [Dataset](https://github.com/hasaneyldrm/exercises-dataset/blob/7455efae41b330c265e7cd4b78dfa848e7ce5ebd/data/exercises.json)
- [JSON schema](https://github.com/hasaneyldrm/exercises-dataset/blob/7455efae41b330c265e7cd4b78dfa848e7ce5ebd/data/exercises.schema.json)
- [Licence](https://github.com/hasaneyldrm/exercises-dataset/blob/7455efae41b330c265e7cd4b78dfa848e7ce5ebd/LICENSE)
  and [media notice](https://github.com/hasaneyldrm/exercises-dataset/blob/7455efae41b330c265e7cd4b78dfa848e7ce5ebd/NOTICE.md)

The code, data structure and instruction text are MIT-licensed. Images/GIFs are
explicitly excluded: the upstream licence says to obtain a separate licence from
Gym Visual. Max confirmed an app licence on 2026-10-04. The importer now records that
confirmation and real pinned image/GIF URLs with attribution. Supplied media is 180×180,
so its usefulness for understanding unfamiliar movements needs a real-device review.

## Main distinction

**Exercise identity**, **how to perform it**, **what Mark prescribes**, and **what
the client actually performs** are related but separate records. A changed exercise
name or demo URL must not change the identity of historical training.

```text
Exercise (shared catalogue entry or coach-owned custom entry)
  ├── ExerciseInstruction [0..many locales]
  └── ExerciseMedia [0..many assets]

Prescribed session → ExercisePrescription → Exercise [one, or unresolved]
                       └── Prescribed sets

Adaptation proposal → Proposed exercise → Exercise [one, or unresolved]
                       └── Source prescription references

Workout → WorkoutExercise → Exercise actually performed [one, or unresolved]
            ├── Source prescription references + applied-plan snapshot
            └── Logged sets
```

Each prescription/proposed/performed exercise occurrence has its own identity.
Repeated appearances of the same movement do not overwrite one another. A combined
session can refer to multiple original prescriptions without duplicating actual work.

## Candidate records and fields

These logical fields are mapped to the fresh migrations. Programme, set-target and
workout fields remain part of their own models. Some snapshot fields below are stored
as JSON rather than additional columns; the backend API documents the concrete contract.

### Exercise

Structured anatomy, versioned family membership and load conventions are now implemented;
see [exercise analysis](exercise-analysis.md). The fields below remain the raw catalogue
identity and source metadata, rather than the authoritative analytical taxonomy.

| Field | Meaning / rule |
| --- | --- |
| `id` | Stable application-owned exercise ID; not its name or media filename |
| `source` | `hasaneyldrm/exercises-dataset` or `custom` |
| `external_id` | Upstream string ID, nullable for custom entries; preserve leading zeros such as `0025` |
| `source_revision` | Pinned import revision; nullable for custom entries |
| `source_created_at` | Upstream `created_at`, not an invented last-update timestamp |
| `owner_coach_id` | For coach-owned custom entries; null for shared imported catalogue entries |
| `name` | Catalogue name; separate from the name Mark displays in a programme |
| `equipment`, `body_part`, `target`, `muscle_group`, `secondary_muscles` | Imported descriptive metadata; not proof that two movements are interchangeable |
| `retired_at` | Unavailable for new selection while existing references remain readable |

Imported `(source, external_id)` is unique. Reimport updates the same local identity;
it does not create new exercises for every revision. Keep equipment/grip/angle variants
distinct unless an explicit mapping decision establishes equivalence.

### ExerciseInstruction

| Field | Meaning / rule |
| --- | --- |
| `exercise_id`, `locale` | One instruction record per exercise/language |
| `text`, `steps` | General instructions and ordered steps from the source |
| `source_revision` | Revision from which the instructions were imported |

English is the proposed initial presentation language; multilingual source data does
not imply a translated application. Instructions and Mark's client-specific cues are
displayed separately. Imported instructions must not overwrite coaching notes.

### ExerciseMedia

| Field | Meaning / rule |
| --- | --- |
| `id`, `exercise_id` | Local asset identity and its exercise |
| `kind` | Thumbnail or animation for this source; GIFs are not narrated videos |
| `source_media_id`, `source_path`, `source_revision` | Upstream provenance; do not treat a relative path as a hosted app URL |
| `asset_url` | Nullable location of an asset the application can actually serve |
| `width`, `height` | Dimensions from verified asset metadata, not assumed from the file extension |
| `attribution` | Required source copyright notice |
| `rights_reference` | Reference to the applicable reuse permission/licence, separately from the MIT data licence |

Missing, unavailable or not-yet-licensed media is a supported state. Instructions and
programme data still work. An import should not automatically enable media delivery.
Hosting/caching is open in Q-21; GitHub is a source repository, not an assumed runtime CDN.

### ExercisePrescription

- `id`, `session_id`, `position`: this particular occurrence within a prescribed session.
- `exercise_id`: catalogue reference, nullable only while a legacy/free-text entry is unresolved.
- `display_name`: Mark's chosen label, without mutating the catalogue name.
- `coach_notes`: client/session-specific instructions; prescribed targets belong to its sets.
- An immutable version/snapshot of the applied prescription is retained with a workout,
  including exercise ID, displayed name, targets and relevant coaching notes.

Mark can choose a matching library entry or a coach-owned custom entry with no media.
Ambiguous names are not silently linked. A mapping change affects future instructions;
it does not reinterpret an already-recorded workout.

### Proposed exercise and WorkoutExercise

- AI proposals carry `exercise_id`, a display label, proposed targets and rationale,
  plus the original prescription references. They use the same catalogue as the UI.
- A `WorkoutExercise` has its own `id`, `workout_id`, `position`, actual `exercise_id`
  and `performed_name_snapshot`, with source prescription references where available.
- The applied-plan snapshot records the original and adapted instructions separately.
  Logged sets belong to the performed occurrence, not directly to the shared catalogue.
- Substitution can produce a different actual exercise ID from the prescribed one.
  Extra exercises/sets may lack a source prescription reference.
- Workout source sessions and source prescription references can be many-to-many for
  combined days. This relationship records provenance, not a rule for adherence counts.

An unavailable catalogue item retains its snapshot name and readable training record.
Retiring/importing catalogue data must not cascade-delete prescriptions or performances.

## Dataset-to-model mapping

| Source | Destination |
| --- | --- |
| `id` | `Exercise.external_id` with source namespace; generate/retain a separate local `id` |
| `name`, `equipment`, `body_part`, `target`, `muscle_group`, `secondary_muscles` | Exercise metadata |
| `category` | Preserve in import provenance if useful; source documents it as mirroring `body_part` |
| `instructions.<locale>`, `instruction_steps.<locale>` | ExerciseInstruction for that locale |
| `image`, `gif_url` | Distinct thumbnail/animation ExerciseMedia source paths |
| `media_id`, `attribution` | Media provenance and attribution |
| `created_at` | `source_created_at` |
| Inspected/imported Git revision | `source_revision`, not derived from `created_at` |

For example, external ID `0025` is **barbell bench press** and refers to
`images/0025-EIeI8Vf.jpg` and `videos/0025-EIeI8Vf.gif`. Mark's label “Bench” can be
linked explicitly to that record; it must not also match an incline dumbbell press
merely because a text search returns similar names.

## Read and update rules to carry into implementation

- Import a selected revision and validate it against its schema. Repeat imports are
  idempotent. Review ambiguous/remapped records instead of matching solely by name.
- Dataset updates change library descriptions, not historical names, targets or
  performance. If reproducing the exact historical demo is required, retain its asset
  revision reference too; that requirement is open rather than assumed.
- AI may select/explain catalogue entries, but it must not invent an ID, URL or claim
  that a demonstration exists for an unmatched movement. Unresolved variants remain explicit.
- Shared catalogue metadata is distinct from private prescriptions, performances,
  custom exercises and chat. Publishing a library entry does not publish client data.
- Catalogue IDs improve consistent comparison, but PR equivalence and training
  suitability still need the product rules in Q-09/Q-12; a muscle tag is not enough.

## Verification examples

- Import the same fixture twice: IDs/references remain stable and counts do not double.
- Select “Bench” as a confirmed alias for barbell bench press: details show that variant;
  similarly named exercises remain distinct and an ambiguous entry remains unresolved.
- Open guidance while logging: returning preserves entered sets; failed media still
  shows text and coach notes. Verify correct attribution with rights-cleared fixture assets.
- Apply an AI substitution: its exercise details and logged actual exercise match the
  proposal while the original prescription remains available.
- Rename/retire/update a catalogue entry: existing history retains its recorded meaning.
- Use small synthetic catalogue/media fixtures in local/CI runs, with no dependence
  on GitHub availability or downloading the complete media collection.

Related stories: **US-07, US-09, US-12, US-16–21**. Open details: **Q-09, Q-20, Q-21**.
