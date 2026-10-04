# Exercise classification and load semantics

Implemented in migration `202610040006_exercise_analysis.sql`. Exact exercise IDs
remain the identity used by prescriptions, proposals, performances and progression.

## Anatomy and families

- `muscle_groups`: stable IDs/slugs for coarse labels such as chest and quadriceps.
- `muscles`: stable IDs/slugs for specific muscles such as pectoralis major.
- `muscle_group_members`: explicit muscle-to-group membership. This is not a
  recursively inferred anatomical hierarchy; a muscle may belong to multiple groups.
- `exercise_families`: organisational categories, initially Bench press. Membership
  does not assert interchangeability, shared PRs or equal training stimulus.
- `exercise_analysis_revisions`: append-only, numbered per exact exercise, with an
  optional `family_id`, provenance (`imported` or `coach_reviewed`), source reference,
  reviewer and timestamp. The largest revision is the current classification.
- `exercise_muscle_mappings`: one group **or** one muscle per entry, with role
  `primary`, `secondary` or `stabiliser`. Multiple primary entries are supported;
  duplicate targets within one revision are rejected. No contribution percentages.

Group-level evidence stays group-level: a pectorals label maps to Chest, not an
invented claim about pectoralis major. A group mapping must not be expanded into
claims that all its member muscles were trained. Specific muscle mappings can roll
up through their recorded group memberships. Reporting must deduplicate each set
within a group, including when a direct group mapping and muscle mapping overlap.

### Atomic revision API

`revise_exercise_analysis(exercise_id, provenance, source_reference, mappings,
family_id = null, reviewed_by = null)` replaces the **whole classification** by appending
a revision and its mappings atomically. It returns the revision record. Example:

```json
{
  "exercise_id": "<exact-exercise-uuid>",
  "family_id": "<bench-press-family-uuid>",
  "provenance": "coach_reviewed",
  "source_reference": "Coach review, 2026-10-04",
  "mappings": [
    { "muscle_group_id": "<chest-uuid>", "role": "primary" },
    { "muscle_group_id": "<triceps-uuid>", "role": "secondary" }
  ]
}
```

Coaches can review only their own custom exercises; the reviewer is their authenticated
identity. Trusted service tooling can import classifications or record a review by
an existing coach, including shared catalogue exercises. Shared taxonomy writes are
service-only. Revision and mapping tables are read-only even to service-role table
APIs; writes must use this command. Concurrent reviews serialize on the exercise.
Old revisions cannot be modified/deleted through these APIs. Referenced taxonomy
and exercise records cannot be deleted while classification references exist.

Family membership belongs to the revision rather than an independently editable
`exercises.family_id`, so family corrections and muscle mappings are versioned together.
An empty mapping list and null family can explicitly clear a previous classification.

### Import policy

`tooling/catalogue-analysis.mjs` supplies an explicit source-label allowlist and a
conservative list of nine flat/incline/decline barbell, dumbbell and Smith bench-press
IDs. Other exercise families remain unassigned until explicitly mapped.

The importer uses `target` for primary and `secondary_muscles` for secondary roles.
The source's `muscle_group` field is inconsistent (barbell bench press says triceps),
so it is retained as raw provenance but not used to infer primary involvement.
Ambiguous regions such as shoulders, spine, core, hands and feet are left unmapped
and reported in import output. Imported mappings are **not coach-reviewed anatomy**.
There are currently no imported stabiliser claims or guessed load conventions.

Source labels in `exercises` are preserved, alongside pinned dataset revision and
mapping-version provenance. Repeated imports of the same mapping version leave
revision identities unchanged. A newer import never replaces a latest coach review.
Change the mapping version when changing the explicit mapping rules.

The pinned 1,324-entry dataset currently produces 1,323 imported classifications and
nine bench-press family memberships. Classification coverage is not complete anatomy
coverage: many entries retain ambiguous secondary labels, and one has no recognised
anatomy. These mappings need coaching review before treating them as authoritative.

## Historical interpretation

- Original session snapshots capture classification and complete set load semantics
  when a workout starts.
- Proposals capture `analysis_snapshot` when created or their exercise ID changes.
  Applying a proposal retains that interpretation in the applied snapshot.
- `workout_exercises.actual_analysis_snapshot` captures the current classification
  at workout start, extra-exercise creation or actual exercise substitution. It may
  differ from an older proposal's interpretation. Saving the same exercise ID does
  not refresh its classification.
- Snapshots embed revision IDs, family, muscle/group labels and group memberships.
  Future taxonomy edits and classification revisions do not rewrite them.
- Existing historical rows are not retroactively classified. Null means unclassified,
  not zero muscle involvement. A partially mapped exercise remains partial evidence.

Historical reports should use actual snapshots by default. A future report that
reclassifies old sessions against current anatomy must explicitly identify that mode.

## Load contract

Both `prescribed_sets` and `logged_sets` carry `load_convention` and an optional
`load_reference`; proposal JSON targets accept the same fields.

| Convention | Meaning of `load_kg` |
| --- | --- |
| `unknown` | Legacy/unspecified interpretation; not safely comparable |
| `total_external` | Total external load, including the bar where applicable |
| `per_dumbbell` | Load of each dumbbell; do not automatically double for volume |
| `added_bodyweight` | External load added to a bodyweight movement |
| `assistance` | Assistance magnitude; more is not a strength improvement |
| `machine_display` | Machine-indicated kilograms, not equivalent external resistance |
| `bodyweight` | No recorded external load; `load_kg` must be null or zero |

For `machine_display`, `load_reference` may identify a stable specific machine/configuration,
e.g. `gym-a:chest-press-1`. It is an opaque reference, not an exercise name. Null means
the machine context is unknown. Other conventions cannot carry a machine reference.
Changing a machine configuration that affects resistance requires a distinct reference.
Non-kg display units require conversion before storage; numbered stack levels cannot
be represented as kilograms. Body mass and effective resistance are not inferred.

`save_workout` accepts these fields on each set. Its submitted set list replaces
the occurrence's logged sets atomically, as before. Callers must resend semantics
when editing: omitted convention becomes `unknown`, omitted reference becomes null.
Blank initial actual sets remain unknown; target semantics are never silently assumed
to describe actual performance. Invalid enum/bodyweight/reference values roll back
the full command. Legacy clients remain compatible with explicit unknown semantics.

## Analysis boundaries

This supplies the data foundation, not PR or stimulus-scoring algorithms. Future
reports should count completed primary/secondary/stabiliser set exposure separately,
expose missing mappings, avoid double-counting group rollups, and avoid combining
loads across variations or conventions. Machine comparisons additionally need a known,
matching reference. Family totals can describe frequency, but not equivalent strength.

Verification: `tests/backend/exercise-analysis.test.mjs` covers permissions, review
ownership, atomic revision validation, concurrency, import repeatability/review
preservation, snapshots, substitutions, proposals and set load semantics. The pgTAP
inventory checks all new table/RPC grants and fail-closed defaults.
