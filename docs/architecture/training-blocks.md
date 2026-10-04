# Training blocks and supersets

Supersets are a confirmed product requirement. This missing model was identified
while planning reusable UI components; the backend is extended before UI work resumes.

## Meaning

A session contains ordered blocks. A `single` block contains one exercise. A
`superset` contains two exercises, performed **A1 → A2 → rest → repeat**. The rest
prescription is `rest_after_round_seconds`, not a rest after each individual exercise.
Null means unspecified; zero explicitly means no prescribed rest. No intra-superset
rest setting is implemented. Tri-sets/circuits would be a separate future model change.

This matches [ACE's reciprocal superset description](https://www.acefitness.org/continuing-education/certified/june-2024/8648/short-on-time-try-reciprocal-superset-training/):
perform the paired exercises consecutively, then take the prescribed rest.

Set `position` identifies the round for each exercise; load, repetitions, RIR and
completion remain per exercise, not a single combined result. Unequal/missing logged
sets remain honest partial performance. Clients do not receive fabricated results
for the other exercise. Existing `prescribed_sets.rest_seconds` applies to standalone
set work; superset block rest is authoritative when exercises are grouped.

## Persisted contract

- `session_blocks`: coach-authored kind, order, label and round rest. Every
  `exercise_prescriptions.block_id` must belong to that prescription's session.
- `proposed_blocks`: trusted proposal grouping. Every proposed exercise belongs to
  one block inside its own proposal.
- `workout_blocks`: applied grouping/rest and immutable snapshot. Every actual
  exercise belongs to one block inside its own workout.

Within a session/proposal, exercise `position` remains globally unique and orders
exercises inside each block. Read block position first, then exercise position.
For client execution, interleave the exercises' set positions to present rounds.

Create the block before its prescriptions. Coach CRUD can temporarily leave an
incomplete block during authoring; `start_workout` and proposal creation reject an
invalid source block (single ≠ 1 exercise, superset ≠ 2). Moving prescriptions between
blocks within the same session is allowed, increments the programme revision and
requires removing any now-empty block before starting. Moving a block or attaching
an exercise to a block from another session is rejected.

Original workout snapshots include the coach's blocks and exercises. Applied workout
blocks independently capture the accepted proposal or unchanged original. Editing
current block order/rest cannot rewrite either history. Referenced prescriptions
prevent destructive block deletion through their existing provenance foreign keys.
Unplanned extra exercises get their own single block.

The migration upgrades old ungrouped records as single blocks; it does not infer
supersets or rewrite previously captured original workout snapshots.

## Atomic proposal input

`create_adaptation_proposal` accepts an optional `blocks` array in addition to its
existing `exercises` input:

```json
[
  {
    "position": 1,
    "kind": "superset",
    "label": "A",
    "rest_after_round_seconds": 90,
    "exercise_positions": [1, 2]
  }
]
```

These positions reference the proposal's exercise positions, not catalogue IDs or
set numbers. Membership must cover every proposed exercise exactly once. Missing,
duplicated, foreign or invalid memberships roll back the entire proposal. Omit
`blocks` only when intentionally proposing individual exercise blocks; a backend
agent preserving a superset must include its grouping explicitly.

Client application still uses `start_workout` with the proposal ID. Programme block
changes invalidate previously generated proposals via the existing revision check.
Grouping, initial actual-set rows and provenance are created in the same transaction.

## Evidence

The role matrix covers the three new tables. `tests/backend/supersets.test.mjs`
covers pair order/rest, independent results, ownership, constraints, partial rounds,
original/applied differences, stale grouping proposals, invalid membership rollback,
mixed blocks, extras, retries and history protection. Generated database types are
the frontend contract, not a hand-maintained substitute.
