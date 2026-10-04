# Domain permissions and verification

The fresh Supabase backend is tested through real Auth, PostgREST, database RPCs,
the invitation Edge Function and local Mailpit. Tests use signed-in users for
permission assertions; service-role access is used for fixtures, trusted commands
and verifying the stored state after denied operations.

## Actor and operation matrix

The HTTP suites explicitly inventory all **31 public domain tables**. Each table
is read as anonymous, owning client, owning coach, unrelated client, unrelated
coach and trusted service. Every forbidden direct insert/update/delete is tested.
Allowed operations are exercised in the lifecycle tests below. A denied update
or delete must return an authorization error or affect zero rows; an unrelated
constraint error does not count as a successful permission test. Stored rows are
checked again through the service after denied writes.

`R` = read, `C` = create, `U` = update, `D` = delete. Anonymous users have none of
these operations. The service role is a trusted administrative boundary with RLS
bypass, still subject to constraints/triggers. Analysis revisions and mappings are
an exception to its direct write privileges: they require the revision RPC.

| Table | Client | Owning coach | Lifecycle / deletion rule |
| --- | --- | --- | --- |
| `profiles` | R own/related; U own display name | R own/related; U own display name | Auth provisions profile; no client role/identity changes or direct deletion. Related profile access ends on deactivation. |
| `coach_clients` | R own; accept via RPC | R own; deactivate via RPC | Trusted invitation creates relationship; participants immutable; referenced plans prevent deletion. |
| `exercises` | R shared and active coach custom entries | R shared/own; C/U/D own custom entries | Shared imports service-only; referenced identities protected; retirement blocks new selections. |
| `exercise_instructions` | R according to exercise visibility | C/U/D own custom exercise instructions | Cannot move instructions between exercises. Remove instructions before deleting an unreferenced exercise. |
| `exercise_media` | R according to exercise visibility | R according to exercise visibility | Service-only writes; HTTPS delivery requires a nonblank rights reference. |
| `programmes` | R active published plan | C/R/U/D own invited/active relationship | Parent immutable; unreferenced hierarchy deletable; archive retains workout history. |
| `programme_weeks` | R through visible plan | C/R/U/D through manageable plan | Parent immutable; cascading delete if history permits. |
| `sessions` | R through visible plan | C/R/U/D through manageable plan | Parent immutable; source references prevent deletion. |
| `session_blocks` | R through visible plan | C/R/U/D through manageable plan | Session immutable; edits increment revision; deleting a block cascades prescriptions only if history permits. |
| `exercise_prescriptions` | R through visible plan | C/R/U/D through manageable plan | Parent immutable; exercise must be accessible; provenance references prevent deletion. |
| `prescribed_sets` | R through visible plan | C/R/U/D through manageable plan | Changes increment programme revision; existing workout snapshots survive edits/deletion. |
| `conversations` | C/R/D own | None | Deletion cascades messages unless a proposal references the conversation. |
| `messages` | C own user messages; R own chat | None | Append-only client API; assistant writes trusted; conversation deletion cascades. |
| `adaptation_proposals` | R own; reject/apply via RPC | None | Created atomically by trusted RPC; applied workout prevents deletion. |
| `proposal_sessions` | R own proposal | None | Trusted proposal writes; programme revision captured; cascades on proposal deletion. |
| `proposed_blocks` | R own proposal | None | Trusted proposal grouping; cardinality/membership validated atomically; cascades on proposal deletion. |
| `proposed_exercises` | R own proposal | None | Trusted writes with target validation; cascades on proposal deletion. |
| `proposal_exercise_sources` | R own proposal | None | Trusted provenance linking; cascades with proposed exercise. |
| `workouts` | R own; start/save/finish/abandon via RPC | R relevant active relationship | Public direct C/U/D forbidden; closed attempts immutable to client commands. |
| `workout_sources` | R own workout | R relevant active relationship | Created by start; public direct writes forbidden. |
| `workout_blocks` | R own workout | R relevant active relationship | Immutable applied grouping/rest via public API; created atomically by start/add-extra. |
| `workout_exercises` | R own; edit/add via RPC | R relevant active relationship | Applied snapshot retained independently of actual substitutions. |
| `workout_exercise_sources` | R own workout | R relevant active relationship | Created by start; public direct writes forbidden. |
| `logged_sets` | R own; replace draft sets via RPC | R relevant active relationship | Empty replacement removes actual sets, not prescribed snapshot. |
| `workout_feedback` | R own; save via RPC | R relevant active relationship | Atomic with workout edits/completion; public direct writes forbidden. |

Unrelated users cannot access private records. Shared exercise-library entries are
intentionally readable by every signed-in user. An inactive coach retains authored
plans as read-only but loses the former client's profile and workout access. The
client keeps their own workout history and can finish a previously started draft.

## Executable coverage

- `supabase/tests/database/permissions.test.sql`: exact table inventory, all table
  privilege allowlists, profile column grants, RPC grants, trigger/helper exposure,
  pinned security-definer search paths and fail-closed defaults for future objects.
- `tests/backend/permissions.test.mjs`: full table/actor matrix, allowed owner CRUD,
  parent/identity changes, cross-tenant references, draft/archive/invitation states,
  history restrictions, deletion cascades, retirement, constraints and RPC lifecycle.
- `tests/backend/auth-security.test.mjs`: malformed requests/JWTs, actual invitation
  and recovery-link redemption, password setup, token replay, scoped resend,
  concurrent/duplicate invitations, caller-controlled redirects and private-schema
  exposure attempts.
- `tests/backend/api.test.mjs`: primary domain journeys including refresh/logout,
  user-metadata role spoofing, draft recovery, concurrent start/completion, stale
  proposals and combined-workout provenance.
- `tests/backend/supersets.test.mjs`: ordered blocks, pair-then-rest semantics,
  per-exercise rounds/results, proposal regrouping, stale block revisions, invalid
  memberships, snapshot stability and concurrent block-graph creation.

RPC tests include rollback on invalid numeric values/JSON, source mismatch,
cross-workout exercise IDs, concurrent application of one proposal, rejected and
applied proposal states, changed idempotency inputs, missing/duplicate sources and
closed-workout immutability. Existing original/applied snapshots remain distinct
from editable actual performance.

## Security fixes established by this work

- Inactive relationships no longer reveal the other person's profile.
- Exercise identities, instruction parents and relationship participants cannot be
  reassigned, including by privileged table updates.
- New public tables/functions default to no anonymous/authenticated access. The
  PostgreSQL global default for PUBLIC function execution is explicitly revoked;
  schema-scoped revocation alone does not remove that default.
- Proposed JSON targets validate ranges and normalized position uniqueness,
  including trusted direct writes. Retired exercises cannot be newly selected as
  extras/substitutions or proposals.
- Invitations reserve a new Auth identity before creating its relationship. A
  duplicate request cannot treat an existing unconfirmed user as newly created and
  delete it on relationship failure. Email-send failure retains the new relationship
  for scoped resend; successful delivery occurs only after the relationship exists.
- Foreign-key/RLS lookup indexes support access checks and deletion restrictions.

## Running and extending verification

```sh
npm run backend:start
npm run check:backend
npm run check
```

`check:backend` resets this project's local database, applies every migration, lints
SQL routines, runs database and HTTP tests and verifies generated API types. CI runs
the same command without a hosted Supabase account. Re-import the real catalogue
with `npm run catalogue:import` after a reset when using it locally.

When adding a table or RPC, extend its permission inventory and lifecycle tests in
the same change. Keep all denied operations covered as well as successful actions.

These checks establish the current local domain/API contract, not a guarantee
against every possible vulnerability. Hosted deployment still needs its actual Auth
redirect URLs, `APP_URL`, SMTP, secrets, backups and platform settings configured and
verified. No authenticated UI, live AI provider, account-erasure workflow or production
email-delivery failure simulation is included in this backend test suite. Chat with
linked proposals and completed workout history intentionally have no public erasure
operation; retention/erasure is a future explicit product contract.

## Exercise analysis extension

Migration 006 adds six tables (31 total): `muscle_groups`, `muscles`,
`muscle_group_members`, `exercise_families`, `exercise_analysis_revisions`, and
`exercise_muscle_mappings`. Taxonomy is readable by authenticated users and writable
only by the service role. Revisions/mappings follow exercise visibility and cannot be
written directly, even by the service role. `revise_exercise_analysis` is the only
API write path: owning coaches may review custom exercises; trusted service callers
may classify shared entries. Clients, unrelated coaches and anonymous users cannot
revise another coach's exercise. Reviewer impersonation is rejected.

The HTTP role coverage for these tables and the ninth public RPC lives in
`tests/backend/exercise-analysis.test.mjs`; pgTAP inventories all 31 tables and nine
RPCs. See [exercise analysis](exercise-analysis.md) for revision and snapshot semantics.
