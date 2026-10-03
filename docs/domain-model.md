# Candidate domain model

Status: **Draft vocabulary for discussion**, derived from the pre-rebuild app. This is
a conceptual product model, not a proposed database design or service architecture.
Mark's coaching language should take precedence over implementation names.

## Working capability areas

| Area | Purpose | Working classification |
| --- | --- | --- |
| Training prescription | Express and communicate what a client should do | Core |
| Training performance and review | Record what happened and inform the next coaching decision | Core |
| Coaching relationships | Establish who is coaching whom and manage that relationship | Supporting |
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
| Prescribed set | Targets or guidance for a set | A range, a fixed target and an optional target may have different meanings |
| Workout / training attempt | One occasion when a client performs training | May differ from, partially fulfil, or repeat a prescribed session |
| Logged set | What the client recorded for a set, including whether it was performed | Current `completed_sets` storage also contains unchecked sets |
| Workout feedback | The client's report of context, experience or concerns | A default value is not necessarily an explicit report |
| Adherence | An agreed comparison of intended and performed training | Must define the plan, period and what counts |
| Personal record (PR) | A qualifying improvement against comparable previous performance | Requires agreed exercise identity, eligible sets and comparison rules |

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
                                Exercise prescription
                                          │
                                    Prescribed set

Client undertakes a Workout / training attempt
  ├── may refer to a Prescribed session
  ├── contains Logged sets (which may refer to Prescribed sets)
  └── carries Workout feedback

Training history informs coach review and, where meaningful, adherence and PRs.
```

The current app always starts a workout from a prescribed session. Allowing an
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

## Evidence

- Historical `index.html` (Git revision `8e5b952`): `boot`, `loadTree`, `cur`, `parseQuickBuild`,
  `saveQuickDraft`, `startWorkout.onclick`, `finishWorkout.onclick`, `loadHistory`,
  `renderCoachSnapshot`, `renderClientSummary`, `findPRs`, `isHistoryPR`.
- [Invitation Edge Function](../supabase/functions/invite-client/index.ts): invitation and relationship creation handler.
- [Activation RPC](../v3.3.5-activate-client-rpc.sql),
  [onboarding status RPC](../v3.4.2-onboarding-status.sql),
  [older confirmation trigger](../v3.3-activate-invited-client.sql).

Missing schema and policies mean cardinality, deletion effects, retention and access
guarantees cannot be inferred reliably from the frontend alone.
