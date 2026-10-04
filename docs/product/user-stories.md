# Draft user stories

Every story below is **Draft**, with **Release: Unassigned**. These are
discovery-sized stories, not implementation-ready tickets. Split them where needed
after discussion. Proposed acceptance scenarios describe outcomes to validate with
Max and Mark; they are not assertions about today's app.

US-01–15 were recovered after the frontend refactor. Their **historical evidence**
describes the pre-rebuild app and initial tests, not implemented capabilities in the
new prototype. The [technical foundation](../architecture/technical-foundation.md) describes what the
rebuild currently verifies. Story IDs and draft status are preserved for discussion.

**Direction added by Max · 2026-10-04:** use AI chat to analyse recorded workouts
and work with the programme, including combining two training days and adapting a
session before starting when feeling ill. US-16–19 capture this request. The need
is confirmed; detailed behaviour, permissions and release scope remain Draft.

**Input confirmed by Max:** text chat only for US-16–19, including follow-up questions
and workout-change requests. Voice input and spoken conversation are outside scope
(Q-19, resolved 2026-10-04).

**Direction added by Max · 2026-10-04:** integrate the
[exercises dataset](https://github.com/hasaneyldrm/exercises-dataset) so unfamiliar
exercises can be understood visually. US-20–21 and the [proposed data model](../architecture/data-model.md)
make exercise identity, instructions and demonstrations part of the product model.

Current and historical behavior are distinguished in the [product inventory](../current-product.md).
Question IDs link conceptually to [open questions](open-questions.md). Use the
[story template](story-template.md) for additions and decision records.

## Story map

| Stage | Coach | Client | Shared product promises to discuss |
| --- | --- | --- | --- |
| Establish coaching | US-02 | US-01 | US-15 access |
| Prepare and deliver | US-03, US-04, US-05, US-06 | US-07 | Clear recipient and prescription |
| Understand exercises | US-21 | US-20 | Correct movement variant, demonstration and coach-specific cues |
| Discuss and adapt before training | US-13 review context | US-16, US-17, US-18, US-19 | Clear proposal, applied workout and effect on the original plan |
| Train | — | US-08, US-09 | Honest record of actual work |
| Finish and recover | — | US-10, US-11 | No lost or duplicated training |
| Review and adapt | US-13, US-06 | US-12, US-14, US-16 | Useful, understandable history and grounded AI explanations |

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
- Given I want to combine sessions or report how I feel before starting, I can open
  the agent with the relevant prescription in context, without logging a workout yet.
- Given an unfamiliar exercise, I can inspect its demonstration and guidance through
  US-20 before committing to start the session.

**Historical evidence:** Programme/week/session selectors; no explicit next-session rule;
full prescription appears only after Start through the normal client journey.
**Questions:** Q-05, Q-06, Q-11, Q-15. AI adaptation is described in US-17–19.

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
- Given an adaptation was worked out in chat, the workout records the applied version
  and its reason alongside actual performance, rather than treating the suggestion
  itself as performed training.

**Historical evidence:** Free-text swaps and add/remove set controls; differences are not
clearly represented in History. Coach-approved alternatives are only a proposal.
**Questions:** Q-07, Q-09, Q-10, Q-15, Q-16. See US-17–19 for pre-workout adaptations.

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
- Given I trained an AI-adapted session, the record distinguishes Mark's original
  prescription, the applied adaptation and the work I actually performed.
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
- Given the client used an AI adaptation, I can review the applied changes and agreed
  shared context when assessing the result; AI suggestions are not presented as my instructions.

**Historical evidence:** Snapshot and history; no review/acknowledgement workflow or
explicit plan-versus-actual comparison. A queue or in-app messaging is not yet required.
**Questions:** Q-06, Q-10, Q-11, Q-13, Q-15, Q-18. Whether Mark sees the full chat is undecided.

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
- Given the agent reads records or applies an adaptation, the same access rules apply;
  asking in chat cannot retrieve or change an unrelated client's information.

**Historical evidence:** Role-based UI, scoped frontend queries, limited invite handler
checks. Database access isolation is unverified; synthetic tests do not prove it.
**Questions:** Q-03, Q-04, Q-14, Q-18.

## US-16 — Analyse my training through a context-aware conversation

**Story:** As a client, I want to discuss my workouts and programme with an AI agent,
so that I can understand what happened, recognise patterns and ask useful follow-up questions.

**Example:** “How did my last two workouts compare with the programme?” followed by
“Was the lower volume because I skipped sets or because the plan changed?”

**Proposed acceptance scenarios:**
- Given access to my prescription, logged performance and relevant feedback, when I
  ask about a session or period, the agent identifies the records it used and explains
  the distinction between prescribed, adapted and performed work.
- Given a numerical comparison, the totals and differences reconcile with those records;
  interpretation is distinguishable from recorded facts and missing data is acknowledged.
- Given I ask a follow-up, the agent retains the relevant conversational context; it
  asks which session or period I mean when the reference is ambiguous.
- Given I ask “How do I do that exercise?”, the agent can open the matching library
  demonstration and instructions, alongside Mark's cues, rather than guessing a media
  link or silently choosing a different exercise variant (US-20–21).
- Given insufficient history or an unavailable service, the agent explains the limit
  rather than inventing an analysis, and my ordinary workout/history views remain usable.
- Given I am only asking for analysis, that conversation does not modify my programme
  or mark training complete. Proposed actions use US-19.

**Evidence:** Explicit request from Max, 2026-10-04. No AI capability implemented or verified.
**Questions:** Q-12, Q-14, Q-18, Q-19. Which analyses are most valuable and how long chat context persists remain open.

## US-17 — Combine planned training days through chat

**Story:** As a client, I want to ask the agent to combine two planned sessions into
one workable session, so that I can adapt my training to the time I have available.

**Example:** “I can only train once before the weekend. Can you combine days two and
three?” followed by “I only have 45 minutes.” The time limit is an example, not a fixed rule.

**Proposed acceptance scenarios:**
- Given a request to combine days, the agent identifies the intended sessions and
  resolves missing constraints that materially affect the result, such as available time
  and any work from those sessions already performed.
- Given those inputs, it proposes one session, explaining what it retained, reduced,
  omitted or moved and how the proposal relates to the original prescriptions.
- Given overlapping exercises or a time limit, it does not simply concatenate both
  full workloads; it explains the tradeoff and does not guarantee all training objectives fit.
- Given I refine the request, the proposal updates coherently; a proposal that cannot
  meet the agreed constraints explains why and offers a meaningful alternative.
- Given I choose to apply it under US-19, one combined training attempt can be started.
  The app shows what happens to the two original sessions and what is next, using the
  counting/scheduling rule agreed in Q-16. It does not create two completed workouts
  merely because one attempt draws on two prescriptions.

**Evidence:** Max's explicit example, 2026-10-04; no existing implementation.
**Questions:** Q-06, Q-07, Q-11, Q-15, Q-16. Exercise priorities and the treatment of remaining work need Mark's input.

## US-18 — Explain how I feel and adapt before starting

**Story:** As a client, I want to tell the agent how I am feeling before a workout,
so that I can decide on an appropriate change rather than blindly following the usual session.

**Example:** “I'm feeling ill today and need to take it easy.”

**Proposed acceptance scenarios:**
- Given I have not started a workout, the agent considers the selected prescription,
  my current report and relevant available context, asking concise follow-ups where
  “take it easy” does not provide enough information for a useful response.
- Given a proposed adjustment, it explains the specific changes and their purpose,
  such as reduced work or a different session, rather than always applying a fixed percentage.
- Given the report, rest or postponement can be a valid outcome; the conversation
  does not assume I should train simply because a workout is scheduled, or treat
  a training adjustment as a diagnosis of the illness.
- Given I choose a lighter session under US-19, I can inspect and start that version,
  with the agreed readiness context attached. Future prescriptions are not silently changed.
- Given I choose to rest or defer, the app follows the agreed scheduling rule without
  fabricating completed sets or a completed workout.

**Evidence:** Max's explicit pre-workout illness example, 2026-10-04; no existing implementation.
**Questions:** Q-07, Q-10, Q-15, Q-17, Q-18. Readiness guidance and information shared with Mark remain to be agreed.

## US-19 — Turn an AI proposal into the workout I intend to perform

**Story:** As a client, I want a clear way to refine and apply an agent's proposed
session, so that the workout I start matches my intent and changes to the plan are traceable.

**Initial rule confirmed by Max, 2026-10-04:** a proposal is distinguishable from an
applied change. The client can confirm changes to the current workout without
per-change coach approval. Future prescriptions are not rewritten. Broader constraints
remain in Q-15; see the implemented [backend contract](../architecture/backend-api.md).

**Proposed acceptance scenarios:**
- Given a proposed adaptation, I can see its source sessions, changed instructions,
  reason and intended scope: this attempt versus any remaining schedule or future plan.
- Given the agreed application rule is satisfied, the resulting instructions appear
  in the workout itself, not just as text in a chat response. The original prescription
  remains available for comparison and the actor responsible for the change is recorded.
- Given I reject or revise a proposal, the rejected version does not alter the plan.
  If the source prescription changed while we were chatting, that difference is surfaced
  before applying an outdated proposal.
- Given applying fails or its result is uncertain, the agent does not claim success;
  retrying does not create duplicate adaptations or training attempts.
- Given I finish the adapted workout, history records the actual performance against
  that version, and Mark can review the changes and context permitted by the sharing rules.

**Evidence:** Proposed interaction supporting Max's requested AI workflows, 2026-10-04;
the fresh backend now implements proposal persistence, client application and coach
read access to applied changes. The conversational UI and real model are not implemented.
**Questions:** Q-05, Q-08, Q-14, Q-15, Q-16, Q-18.

## US-20 — See how to perform an unfamiliar exercise

**Story:** As a client, I want a visual demonstration and understandable instructions
for an exercise in my programme, so that I can recognise the movement and understand
what to do before attempting it.

**Example:** “Mark has added an exercise I haven't done before. Show me how it works.”

**Proposed acceptance scenarios:**
- Given a linked exercise in a programme, active workout or AI proposal, I can open
  its demonstration, name, equipment and step-by-step instructions for the correct variant.
- Given Mark has provided specific cues, these remain clearly visible and distinct
  from the library's general guidance; catalogue text does not replace his instructions.
- Given I open and close guidance during a workout, my entered values and completion
  state remain intact and viewing a demonstration does not count as performing a set.
- Given media is loading, unavailable or absent, I can still read available instructions
  and coach notes, understand that the demonstration is unavailable, and return to training.
- Given an exercise cannot be identified confidently, the app makes the missing match
  clear rather than showing a similar but incorrect movement.
- Given media is displayed, its required attribution is retained and the mobile layout
  makes both the movement and accompanying instructions usable.

**Evidence:** Max explicitly requested visual exercise guidance and selected
`hasaneyldrm/exercises-dataset` on 2026-10-04. The source contains thumbnails, GIFs
and instructions; integration and usability are not yet implemented or verified.
**Questions:** Q-09, Q-20, Q-21. Media reuse requires the separately documented licence.

## US-21 — Link prescriptions and agent suggestions to the right exercise

**Story:** As a coach, I want to associate my exercise prescriptions with the correct
library movement while retaining my own labels and cues, so that clients and the agent
use consistent instructions and demonstrations.

**Proposed acceptance scenarios:**
- Given I prescribe an exercise, I can find and inspect candidates by name and equipment,
  then choose the intended variant rather than relying on a loose text match.
- Given shorthand or an imported programme has ambiguous exercise names, uncertain
  matches remain explicit until resolved; the prescription itself is retained.
- Given my movement is not in the dataset, I can retain a custom exercise and its cues
  without an unrelated demonstration being attached.
- Given an agent suggests a replacement, it references the same exercise identity used
  by the library and workout, so the proposed and performed movement can be compared.
- Given a library name, instruction or asset changes, the client's previous prescriptions
  and logged work are not silently relabelled or reinterpreted.

**Evidence:** Supporting story proposed for Max's requested dataset integration. The
prototype currently stores exercise names and prescription strings only; the proposed
[data model](../architecture/data-model.md) adds shared identities, source references, media and history links.
**Questions:** Q-09, Q-20, Q-21. Matching workflow and custom-entry visibility remain open.

## Choosing the first slice

After answering Q-01 and Q-02, select a small end-to-end path rather than implementing
every coach feature before the client can use it. Discuss whether a first slice should
cover one client receiving one prescription, recording an honest attempt, recovering
from an interruption, and having the result reviewed by Mark.

This is a suggested discussion starting point, not an approved release plan. Preserve
additional ideas in Draft or Deferred status rather than silently growing the first release.

AI analysis and adaptation are now an explicitly requested product direction. Discuss
whether the first AI slice is read-only workout analysis (US-16), or includes one
pre-workout adaptation (US-17 or US-18) applied through US-19. The choice should follow
Max's immediate value and agreed programme-change rules, not treat AI as automatically deferred.

Visual exercise guidance is also explicitly requested as important. Include US-20
and the minimum exercise-linking part of US-21 when discussing a usable training slice;
keep the separate media-licensing dependency visible rather than assuming GitHub assets
can be shipped under the data licence.

## Verification for the AI stories — proposed

- Use synthetic programmes, workout history and controlled agent responses for local
  and CI browser journeys. Test analysis, follow-up, combined-session proposal,
  readiness adjustment/rest, refinement, application, rejection and service failure.
- Check the resulting instructions and persisted state, not just that chat returned
  text. Include original-prescription preservation, no invented completion, no duplicate
  application on retry and an outdated proposal after the coach changes the plan.
- Controlled responses establish application behaviour, not the quality of a real
  model's analysis. Separately evaluate the chosen agent against agreed examples for
  record-backed claims, correct comparisons, suitable clarification and adherence
  to the agreed adaptation rules. Evaluate outcomes rather than exact wording.
- Keep live-model calls optional for the local synthetic cycle. Real-backend permission
  tests must also cover agent reads/actions; mocked conversations cannot establish isolation.
