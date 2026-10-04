# Draft user stories

Every story below is **Draft**, with **Release: Unassigned**. These are
discovery-sized stories, not implementation-ready tickets. Split them where needed
after discussion. Proposed acceptance scenarios describe outcomes to validate with
Max and Mark; they are not assertions about today's app.

These stories were recovered after the frontend refactor. Their **historical evidence**
describes the pre-rebuild app and initial tests, not implemented capabilities in the
new prototype. The [technical foundation](technical-foundation.md) describes what the
rebuild currently verifies. Story IDs and draft status are preserved for discussion.

Current and historical behavior are distinguished in the [product inventory](current-product.md).
Question IDs link conceptually to [open questions](open-questions.md). Use the
[story template](story-template.md) for additions and decision records.

## Story map

| Stage | Coach | Client | Shared product promises to discuss |
| --- | --- | --- | --- |
| Establish coaching | US-02 | US-01 | US-15 access |
| Prepare and deliver | US-03, US-04, US-05, US-06 | US-07 | Clear recipient and prescription |
| Train | — | US-08, US-09 | Honest record of actual work |
| Finish and recover | — | US-10, US-11 | No lost or duplicated training |
| Review and adapt | US-13, US-06 | US-12, US-14 | Useful, understandable history |

This is journey order, not priority. No first-release cut has been agreed.

## US-01 — Join the right coaching relationship

**Story:** As a client, I want to accept my coach's invitation and establish access,
so that I can receive my training instructions.

**Proposed acceptance scenarios:**
- Given a valid invitation, when I finish the agreed setup steps, then I understand
  which coach I am connected to and can access the intended client experience.
- Given an expired/invalid link or failed sign-in, I receive an understandable next
  action rather than a dead end.

**Historical evidence:** Invite/setup UI and RPC source; synthetic password validation
and activation journey. Real invitation redemption and email delivery unverified.
**Questions:** Q-03, Q-04. Account recovery may become a separate story.

## US-02 — Manage a coaching relationship through its lifecycle

**Story:** As a coach, I want to understand and manage a client's relationship state,
so that invitations, active coaching and ended coaching are not confused.

**Proposed acceptance scenarios:**
- Given an invited client, I can see whether they are ready and help them with setup.
- Given coaching is paused or ended, the client and I retain or lose access according
  to an agreed rule, with a clear route if coaching resumes.

**Historical evidence:** Invited/active list, resend and deactivate in source; no return flow.
**Questions:** Q-03, Q-04. Invitation, pause/end and return may need separate stories.

## US-03 — Work in the correct client's context

**Story:** As a coach, I want to see whose plan I am working on and their relevant
recent training, so that I make changes for the right person.

**Proposed acceptance scenarios:**
- Given I select a client, their identity, relevant prescription and training context
  remain clear while I prepare changes.
- Given I change clients with unfinished authoring work, that work cannot silently
  be saved to a different client.

**Historical evidence:** Client selection and snapshot; draft destination ambiguity.
**Questions:** Q-03, Q-05, Q-11.

## US-04 — Turn coaching notes into a faithful prescription

**Story:** As a coach, I want to enter a programme in notation I naturally use and
review its interpretation, so that I save entry time without losing coaching intent.

**Proposed acceptance scenarios:**
- Given representative notes supplied by Mark, I can inspect and correct the resulting
  sessions, exercises and instructions before making them available.
- Given ambiguous or unsupported notation, I see what needs attention; cancelling
  does not alter the client's programme.

**Historical evidence:** Quick Build source plus parser/preview tests; ranges
become lower-bound targets with explanatory notes.
**Questions:** Q-05, Q-09. Collect real examples before extending syntax.

## US-05 — Author and deliberately deliver a programme

**Story:** As a coach, I want to prescribe and revise training precisely and understand
when clients see it, so that they follow instructions I intend to deliver.

**Proposed acceptance scenarios:**
- Given a programme for a selected client, I can express the agreed exercise and
  set instructions and confirm its delivery state.
- Given I revise a programme, the client receives the intended version and previous
  training remains understandable, including any workout already underway.

**Historical evidence:** Manual authoring and immediate writes; no draft/release/version
workflow. A publish step is a proposal, not an agreed requirement.
**Questions:** Q-05, Q-09.

## US-06 — Prepare the next block using previous work

**Story:** As a coach, I want to reuse a useful prescription and adjust it using
client results, so that progression reflects my coaching decisions without repeated entry.

**Proposed acceptance scenarios:**
- Given a previous block, I can reuse its useful structure and inspect what the next
  prescription changes.
- Given actual training or feedback suggests repeating, reducing or changing work,
  I can make that decision without rewriting the historical record.

**Historical evidence:** Create Next Week copies the selected week; adjustment is manual.
**Questions:** Q-05, Q-06, Q-12. Reusable cross-client templates are not yet agreed scope.

## US-07 — Know what to train and understand it before starting

**Story:** As a client, I want to know which session I should follow and see its
instructions before training, so that I can arrive prepared and avoid the wrong plan.

**Proposed acceptance scenarios:**
- Given training has been delivered, I can identify the intended session and inspect
  the prescription without accidentally logging a workout.
- Given no training is ready, or my schedule changes, I understand the state and my
  available next action.

**Historical evidence:** Programme/week/session selectors; no explicit next-session rule;
full prescription appears only after Start through the normal client journey.
**Questions:** Q-05, Q-06, Q-11.

## US-08 — Record actual training with little interruption

**Story:** As a client, I want to record what I actually performed alongside useful
targets and previous performance, so that logging supports rather than disrupts training.

**Proposed acceptance scenarios:**
- Given a prescribed exercise, I can distinguish targets from my actual load/reps/RIR
  and indicate which sets I performed.
- Given I performed the prescription exactly, a shortcut can record that honestly
  without silently marking work I did not do.

**Historical evidence:** Set entry and completion shortcuts; synthetic prescribed-workout
journey. Individual deviations and numeric semantics need further coverage.
**Questions:** Q-07, Q-08, Q-09.

## US-09 — Adapt training and retain the difference from the plan

**Story:** As a client, I want to record an appropriate substitution or omitted/extra
work, so that I can respond to real circumstances and my coach understands what changed.

**Proposed acceptance scenarios:**
- Given unavailable equipment or another reason to adapt, I can follow the agreed
  freedom/guidance for alternatives and record what I actually did.
- Given I skip or add work, the later record makes the difference from the prescription
  understandable to both me and my coach.

**Historical evidence:** Free-text swaps and add/remove set controls; differences are not
clearly represented in History. Coach-approved alternatives are only a proposal.
**Questions:** Q-07, Q-09, Q-10.

## US-10 — Finish a session and share meaningful feedback

**Story:** As a client, I want to finish a full or partial training attempt and report
useful context, so that my coach receives an honest account and I know what was saved.

**Proposed acceptance scenarios:**
- Given I stop after all or some planned work, the agreed completion meaning is clear
  and the record retains what actually happened.
- Given I report difficulty, pain or another concern, my intentional response is
  saved with the session; an unanswered field is not misrepresented as a report.

**Historical evidence:** Finish and feedback form; separate writes and several defaults.
**Questions:** Q-07, Q-08, Q-10. Feedback and completion may become separate stories.

## US-11 — Recover from interruptions and uncertain saves

**Story:** As a client, I want to recover my training after an interruption or failed
save, so that I do not lose work or create duplicate records.

**Proposed acceptance scenarios:**
- Given an interruption within the agreed support scope, I can return to the same
  attempt with the recorded work retained.
- Given a save result is uncertain, retrying yields one understandable training record,
  and I can tell whether it is safe to leave.

**Historical evidence:** No resume flow; memory-only draft and multi-step completion.
Programme-save cleanup tests do not cover this story.
**Questions:** Q-02, Q-08, Q-14. Offline and cross-device promises must be chosen explicitly.

## US-12 — Trust and revisit my training history

**Story:** As a client, I want to understand previous sessions and address recording
mistakes, so that my history remains useful and trustworthy.

**Proposed acceptance scenarios:**
- Given a previous workout, I can understand what I did and the relevant prescription
  and feedback even after future plans change.
- Given I discover a mistake, there is an agreed correction route and clarity about
  what my coach will see.

**Historical evidence:** Completed history and previous exercise performance; synthetic
reload check. No correction flow or full original-prescription snapshot.
**Questions:** Q-04, Q-05, Q-08, Q-12.

## US-13 — Review results and decide the next coaching action

**Story:** As a coach, I want to find meaningful results, deviations and client
feedback, so that I can decide whether to respond or adjust the next prescription.

**Proposed acceptance scenarios:**
- Given recorded training, I can understand intended versus actual work and see the
  feedback needed for my coaching decision.
- Given a client asks a question or flags a concern, our agreed review process makes
  the next action and any expectation of a response clear.

**Historical evidence:** Snapshot and history; no review/acknowledgement workflow or
explicit plan-versus-actual comparison. A queue or in-app messaging is not yet required.
**Questions:** Q-06, Q-10, Q-11, Q-13.

## US-14 — See progress that matches the training goal

**Story:** As a client, I want understandable evidence of progress against my plan,
so that I can recognise improvements without misleading counts or records.

**Proposed acceptance scenarios:**
- Given an agreed activity/progress measure, its period, target and qualifying work
  are understandable and consistent between views.
- Given a claimed personal record, it uses the agreed exercise and performance
  definition and is supported by the historical comparison.

**Historical evidence:** Weekly totals and two differing PR calculations; no agreed metric
definitions. Do not preserve the old algorithms as acceptance criteria.
**Questions:** Q-09, Q-11, Q-12.

## US-15 — Keep information within the agreed coaching relationship

**Story:** As a client, I want my training and feedback available only to the people
we have agreed, so that I can trust the service with an honest training record.

**Proposed acceptance scenarios:**
- Given another unrelated account, it cannot read or change my programme, history
  or feedback through either the interface or direct requests.
- Given a relationship changes, access follows the explicit rule for current/former
  coaches and for me, rather than an accidental UI state.

**Historical evidence:** Role-based UI, scoped frontend queries, limited invite handler
checks. Database access isolation is unverified; synthetic tests do not prove it.
**Questions:** Q-03, Q-04, Q-14.

## Choosing the first slice

After answering Q-01 and Q-02, select a small end-to-end path rather than implementing
every coach feature before the client can use it. Discuss whether a first slice should
cover one client receiving one prescription, recording an honest attempt, recovering
from an interruption, and having the result reviewed by Mark.

This is a suggested discussion starting point, not an approved release plan. Preserve
additional ideas in Draft or Deferred status rather than silently growing the first release.
