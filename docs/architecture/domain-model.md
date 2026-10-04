# Candidate domain model

Status: **Draft vocabulary for discussion**, derived from the pre-rebuild app. This is
a conceptual product model, not a proposed database design or service architecture.
Mark's coaching language should take precedence over implementation names.

Requested exercise-library integration is detailed in the [proposed data model](data-model.md),
including fields and references between catalogue entries, prescriptions, AI proposals
and actual workout records. The [fresh backend](backend-api.md) now implements these
structures; the design UI remains a synthetic prototype.

## Working capability areas

| Area | Purpose | Working classification |
| --- | --- | --- |
| Training prescription | Express and communicate what a client should do | Core |
| Training performance and review | Record what happened and inform the next coaching decision | Core |
| Coaching relationships | Establish who is coaching whom and manage that relationship | Supporting |
| Exercise library and guidance | Identify movements and explain them visually and in text | Supporting |
| Account access | Sign-in, invitations and recovery | Generic |

These are discussion boundaries, not a recommendation to split the application into services.

## Shared language

| Term | Candidate meaning | Important distinction / unresolved rule |
| --- | --- | --- |
| Account | A person's sign-in identity | An account is not an active coaching relationship |
| Profile | Display name and role associated with an account | Can a person be both coach and client? |
| Coaching relationship | A coach working with a particular client | Invitation, account setup, consent and active coaching may be separate events |
| Programme | A coherent training plan for a client and a purpose | Current, assigned, active and published are not interchangeable until defined |
| Programme week | An ordered block of prescribed sessions | It may not mean a Monday–Sunday calendar week |
| Prescribed session | A planned training session within a programme | This is the plan, not evidence that training occurred |
| Exercise prescription | A movement and the instructions for performing it in a session | An occurrence of an exercise is different from the identity of that exercise |
| Library exercise | A stable movement identity with equipment and descriptive metadata | A display name or alias is not the identity; keep variants distinct |
| Exercise family | An organisational grouping of related exact exercises | Versioned membership does not imply equivalent strength or interchangeable movements |
| Exercise classification | A versioned family and muscle/group mapping for one exact exercise | Imported or coach-reviewed; historical interpretation is snapshotted |
| Muscle involvement | A primary, secondary or stabiliser role at explicit muscle/group granularity | No inferred contribution percentages or expansion of broad labels into specific muscles |
| Exercise instruction | General guidance for a library movement, optionally by language | Separate from Mark's specific cues and prescribed targets |
| Exercise media | Demonstration/thumbnail associated with a library movement | May be absent; source reference, attribution and reuse rights are separate concerns |
| Prescribed set | Targets or guidance for a set | A range, a fixed target and an optional target may have different meanings |
| Workout / training attempt | One occasion when a client performs training | May differ from, partially fulfil, or repeat a prescribed session |
| Logged set | What the client recorded for a set, including whether it was performed | Current `completed_sets` storage also contains unchecked sets |
| Load convention | How a prescribed or actual kilogram value must be interpreted | Total load, per-dumbbell, added bodyweight, assistance, machine display, bodyweight or unknown |
| Workout feedback | The client's report of context, experience or concerns | A default value is not necessarily an explicit report |
| Adherence | An agreed comparison of intended and performed training | Must define the plan, period and what counts |
| Personal record (PR) | A qualifying improvement against comparable previous performance | Requires agreed exercise identity, eligible sets and comparison rules |
| Training conversation | A client's questions and requests, with relevant programme and workout context | Conversation is not a completed workout or an applied programme change |
| Adaptation proposal | Suggested changes to one or more prescribed sessions for a stated reason | May be refined or discarded; application authority is undecided |
| Applied adaptation | The agreed version of training instructions selected for an attempt | Preserve the distinction from the coach's original prescription and actual performance |
| Readiness report | What the client reports before training, such as feeling ill or having limited energy | Current self-report is distinct from post-workout feedback and an inferred diagnosis |

## Conceptual relationships

```text
Person/account ── participates in ── Coaching relationship ── with ── Person/account
                                          │
                               coach prescribes for client
                                          │
                                      Programme
                                          │
                                    Programme week
                                          │
                                  Prescribed session
                                          │
                                Exercise prescription ── references ── Library exercise
                                          │
                                    Prescribed set

Client undertakes a Workout / training attempt
  ├── may refer to a Prescribed session
  ├── contains Performed exercise occurrences → Logged sets
  │             └── reference actual Library exercise and source prescription
  └── carries Workout feedback

Training history informs coach review and, where meaningful, adherence and PRs.
Library exercise → General instructions + Demonstration media
AI proposals reference the same library identities as prescriptions and performances.
```

The historical app always starts a workout from a prescribed session. Allowing an
unplanned workout is an open product question, not an existing capability.

## Lifecycles observed in source

### Coaching relationship

```text
invited → active → inactive
    └────────────→ inactive
```

The coach can deactivate either an invitation or an active relationship. There is
no reactivation UI. The activation RPC activates every invited relationship for
the signed-in client; onboarding status gives precedence to any active relationship.
An older confirmation-trigger script also exists. Which scripts are deployed is unknown.

**Product decision:** what constitutes joining, ending and resuming coaching?
How many simultaneous relationships are intended? See Q-03 and Q-04.

### Prescription

Quick Build has `local preview → saved` or `local preview → discarded`. Ordinary
editing saves immediately. New programmes are written with `status: active`, but
there is no separate release/version workflow or authoritative current assignment.

**Product decision:** is a draft → released → superseded lifecycle needed? If so,
what can change while a client is training? See Q-05 and Q-06.

### Training attempt

The visible path is `in_progress → completed`. Working set values live in page
memory until finish. There is no visible resume, abandon, skip or correction lifecycle.
Finishing can include unchecked sets, and can happen with no performed sets.

**Product decision:** define partial completion, interruption and corrections before
deriving progress from the word “completed”. See Q-07 and Q-08.

## Candidate product promises — not yet agreed

1. **Prescriptions and performance stay distinct.** Editing a plan should not
   silently change the historical record of what was prescribed or performed.
2. **One training attempt counts once.** Retrying a save should not create another
   workout or duplicate sets.
3. **Unknown is not zero.** Blank, bodyweight, skipped and zero need intentional meanings.
4. **Deviations are understandable.** Partial work and substitutions should not look
   indistinguishable from performing the prescription exactly.
5. **Adherence compares like with like.** The numerator and target need a shared plan
   and period; repeated sessions should follow an explicit counting rule.
6. **Records use one definition.** A PR shown at completion should agree with history.
7. **Relationship changes have clear access consequences.** Coach and client should
   understand what remains visible and editable after coaching ends.

These are candidates to discuss through examples, not instructions to implement yet.

## AI-assisted adaptation — requested direction, proposed model

Max requested programme-aware AI analysis and chat on 2026-10-04, including combined
sessions and easier training when feeling ill. The conceptual extension is:

```text
Prescription + workout history + relevant client context
  → conversation → analysis and/or adaptation proposal
  → refined, discarded or applied under the agreed change rules
  → workout performed against the applied instructions
  → actual results and permitted adaptation context available for review
```

Combining two prescribed sessions can yield one training attempt. This introduces
an unresolved relationship between the attempt and its source sessions; it must not
silently double-count actual work. A readiness conversation may instead lead to rest
or postponement, without creating a completed workout.

Keep the original prescription, proposed/applied instructions and logged performance
distinct. Who may apply a change, its effect on future sessions and what chat context
Mark sees are open product questions, not prescribed architecture. See
[US-16–19](../product/user-stories.md#us-16--analyse-my-training-through-a-context-aware-conversation)
and [Q-15–19](../product/open-questions.md#q-15--what-may-the-agent-change-and-who-decides).

## Evidence

- [Exercise dataset and proposed mapping](data-model.md): inspected source, licence,
  media references and model extensions requested by Max on 2026-10-04.

- Historical `index.html` (Git revision `8e5b952`): `boot`, `loadTree`, `cur`, `parseQuickBuild`,
  `saveQuickDraft`, `startWorkout.onclick`, `finishWorkout.onclick`, `loadHistory`,
  `renderCoachSnapshot`, `renderClientSummary`, `findPRs`, `isHistoryPR`.
- [Invitation Edge Function](../../supabase/functions/invite-client/index.ts): invitation and relationship creation handler.
- Historical SQL at Git revision `8e5b952`: activation RPC
  (`v3.3.5-activate-client-rpc.sql`), onboarding status RPC
  (`v3.4.2-onboarding-status.sql`) and older confirmation trigger
  (`v3.3-activate-invited-client.sql`). These incomplete patches were removed from
  the working tree; they remain historical evidence, not a migration baseline.

Missing schema and policies mean cardinality, deletion effects, retention and access
guarantees cannot be inferred reliably from the frontend alone.
