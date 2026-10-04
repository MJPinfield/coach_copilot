# Coach Copilot

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Mark, a personal trainer, authors and manages programmes for his clients. Coach
  workflows must work on mobile as well as desktop.
- Clients such as Max follow programmes, record workouts and use text AI assistance
  grounded in their programme and training history, including on mobile in the gym.

Max confirmed this focus during product-context setup on 2026-10-04. The audience
and size of the first release remain undecided; a wider organisation or marketplace
model has not been agreed.

## Product Purpose

Help Mark communicate training prescriptions and understand what clients actually
performed. Help clients understand and carry out their training, report results,
and discuss or adapt a workout through context-aware text chat.

Concrete requested adaptations include combining two planned days into one workout
and taking it easy when feeling ill. Detailed adaptation rules and release success
criteria remain open.

## Operating Context

- Coaching spans programme authoring, client training, recorded performance and
  coach review. Desktop is useful for coaching but is not its only supported context.
- **Offline training is required**, confirmed by Max on 2026-10-04: clients must be
  able to continue logging without gym signal and sync later. This is a requirement,
  not a capability of the current prototype. Initial offline preparation, conflict
  resolution, cross-device recovery and offline media availability remain undecided.
- Training terminology includes programmes, weeks, sessions, exercises, sets,
  prescribed versus actual load/repetitions, and RIR (repetitions in reserve).
- Which existing tools this replaces, scheduling semantics and the smallest
  releasable coaching loop remain open in `docs/product/open-questions.md`.

## Capabilities and Constraints

Confirmed direction and initial rules:

- Clients join by invitation; coach roles are administratively provisioned.
- Clients access published programmes rather than coach drafts.
- AI assistance is text-only; voice is outside the requested scope.
- Clients confirm adaptations to the current workout. Applying a change does not
  require per-change coach approval or rewrite future prescriptions.
- Chat transcripts stay private. Coaches can review applied workout changes and
  their shared context/reason, not the full private conversation.
- Exercise guidance must connect catalogue identities to prescriptions, suggestions
  and logged movements, rather than display disconnected illustrations.
- The selected library is `hasaneyldrm/exercises-dataset`. Max confirmed the app has
  the required Gym Visual media licence; attribution and provenance must be retained.
- New UI uses Mantine, starting with its default theme and Mantine UI examples;
  custom branding comes later. Retain TanStack Router and Query.
- Supersets are required: ordered exercise pairs with per-exercise targets/results,
  performed A1 → A2 → rest → repeat. Rest is prescribed after the complete round,
  not after each exercise. See `docs/architecture/training-blocks.md`.
- Development supports synthetic local testing and repeatable browser CI without
  requiring a hosted Supabase account.

Current implementation boundaries:

- The current design slice uses a synthetic local HTTP API. The initial Mantine
  mockups were discarded after review; their findings are retained in
  `docs/product/mockups-review-2026-10-04.md`.
- A separate local Supabase backend implements authentication, access rules,
  transactional workout/adaptation APIs and the imported exercise catalogue.
- The design UI is not connected to authenticated Supabase, no live AI model is
  connected, and offline workout logging/sync is not implemented.

Remaining decisions include release scope, programme progression, combined-session
accounting, completed-workout corrections, retention after coaching ends, exercise
matching conventions and production media delivery. Draft stories are not blanket
approval of their acceptance details.

## Brand Commitments

The existing product name is **Coach Copilot**. Custom branding is deferred; no new
voice or identity direction was established during setup.

## Evidence on Hand

- `docs/product/product-brief.md`: confirmed requests and draft discovery context.
- `docs/product/user-stories.md` and `docs/product/open-questions.md`: stable story
  references, decisions and unresolved details.
- `docs/architecture/backend-api.md`: implemented backend contracts and limitations.
- `docs/current-product.md`: current versus historical inventory, not deployment proof.
- `docs/product/mockups-review-2026-10-04.md`: archived Mantine mockup review and
  the follow-up need to represent supersets in coach and client views.
- `src/features/programme/` and `tooling/local-api.ts`: synthetic coach/client design slice.
- `supabase/` and `tooling/import-exercises.mjs`: backend and real catalogue import.

Demo clients and workout records are fictional. Historical functionality and local
tests do not establish a live deployment or customer outcomes; do not turn them into
testimonials or production claims.

## Product Principles

1. Preserve the distinction between the coach's prescription, a client-confirmed
   adaptation and the workout actually performed.
2. Keep training usable without gym connectivity, with later synchronisation.
3. Support coach tasks on mobile as well as desktop and client tasks during training.
4. Ground assistance and exercise guidance in the client's actual training context
   and correctly linked exercise identities.
5. Preserve private conversations while making applied changes understandable to
   the coach.
