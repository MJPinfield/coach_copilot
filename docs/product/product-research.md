# Comparable products and product hypotheses

Research recorded **3 October 2026** from official public product/help pages. These
are vendor-documented or marketed capabilities, not independently tested workflows.
We have not assessed account-only behaviour, real usability, reliability or pricing.
No competitor feature becomes a requirement merely by appearing here.

## What comparable products emphasise

| Product | Evidence from reviewed official pages | Useful lesson for discussion |
| --- | --- | --- |
| **TrueCoach** | Saved workout sequences assigned to clients; client-specific edits; optional programme synchronisation; exercise history accessible to clients | Separate reusable source material from an individual's prescription; explain which clients an edit affects |
| **ABC Trainerize** | Explicit copied versus subscribed programmes; scheduled progression targets; substitutions; post-workout effort/comments | Reuse, propagation and scheduling need deliberate rules; lasting exercise cues differ from session-specific feedback |
| **Everfit** | Reusable sections/templates; tracking with history; coach-selected alternatives and configurable replacement freedom; exercise-linked comments | Guidance at the point of training may be more valuable than a large feature catalogue |
| **Hevy Coach** | Programme/routine reuse and client-specific targets; per-set logging; client exercise swaps; activity feed and exercise history | Easy logging should directly support coach review and the next training decision |

### TrueCoach sources

- [Programs](https://help.truecoach.co/en/articles/3047401-programs) — documented
  assignment, client-specific changes and optional sync behaviour.
- [Client exercise history](https://help.truecoach.co/en/articles/2403762-client-exercise-history)
  — documented access to previous workouts/metrics beneath a movement.
- [Workout builder](https://truecoach.co/features/program-workout-builder/) and
  [product overview](https://truecoach.co/) — marketed calendar, logging and communication.

Client-controlled substitution was not established from these reviewed pages. That
does not establish its absence from the product. Automatic progression was also not established.

### ABC Trainerize sources

- [Copying versus subscribing to a programme](https://help.trainerize.com/hc/en-us/articles/11402922731540-What-is-the-Difference-Between-Subscribing-and-Copying-a-Program-to-a-Client)
  — independent copies versus propagated master changes.
- [Progressions spreadsheet](https://help.trainerize.com/hc/en-us/articles/212130826-Progressing-Regressing-Workouts-with-the-Progressions-Spreadsheet)
  — scheduled targets; documented removal of progressions when moving/rescheduling work.
- [Exercise substitutions](https://help.trainerize.com/hc/en-us/articles/46226883603604-How-to-Substitute-Exercises-During-a-Workout)
  — replacement filters and scopes for trainer changes.
- [Workout RPE](https://help.trainerize.com/hc/en-us/articles/360033937932-How-to-Use-the-RPE-Rating-of-Perceived-Exertion-in-Your-Training)
  — effort ratings, comments and coach responses.
- [Exercise notes](https://help.trainerize.com/hc/en-us/articles/48453656208660-How-to-Use-Exercise-Notes-in-Workouts)
  — a shared editable exercise note, not an immutable session-feedback history.

### Everfit sources

- [Training features](https://everfit.io/training/) — marketed reuse, templates and
  percentage-based targets; not evidence of an effective autonomous progression system.
- [Client workout tracking](https://help.everfit.io/en/articles/5829094-client-app-track-a-workout)
  — documented set tracking, timers, comments and finishing rating.
- [Alternate exercises](https://help.everfit.io/en/articles/3365668-add-an-alternate-exercise)
  and [replacement settings](https://help.everfit.io/en/articles/8755701-replace-exercise-setting)
  — prescribed alternatives versus freedom to choose a replacement.
- [Client exercise history](https://help.everfit.io/en/articles/5322257-client-app-exercise-history)
  and [exercise comment history](https://help.everfit.io/en/articles/13010112-view-exercise-comment-history)
  — previous performance and workout-linked context.

### Hevy Coach sources

- [Create a programme](https://help.hevycoach.com/en/articles/8460764-create-a-program)
  — documented assembly from new or existing routines.
- [Programme builder](https://hevycoach.com/features/workout-program-builder/)
  — marketed duplication, assignment and individual targets.
- [Client training platform](https://www.hevyapp.com/features/trainer-platform/)
  — marketed set logging and exercise swaps.
- [Client management](https://hevycoach.com/features/client-management/)
  — marketed activity review, history, charts and communication.

## Recommended product direction — a hypothesis for Max and Mark

**A focused coaching loop: Mark prescribes clearly, Max records honestly, and Mark
can use the result to decide what comes next.**

The opportunity is not to match the largest competitor feature list. A strong small
product could make this loop dependable and natural for Mark's actual coaching style.
Validate that against the alternatives and the cost of maintaining our own app.

| Hypothesis | Value | Tradeoff to resolve | Story / discovery prompt |
| --- | --- | --- | --- |
| Reuse a plan, personalise it and clearly deliver it | Reduce Mark's repeated entry | Linked templates can unexpectedly propagate changes; copies require repeated edits | US-04–06: compare two real plans Mark reused |
| A focused next-session view with targets and last-time context | Keep Max oriented with little in-gym interaction | Prefilled targets can be mistaken for performed work | US-07–08: observe when Max actually consults and records values |
| A small set of Mark-approved alternatives | Keep training moving when equipment is unavailable | Too many choices transfer coaching decisions to the client | US-09: discuss the last three substitutions |
| Review results and unanswered concerns in one place | Make training records actionable for Mark | Review queues/notifications create an expectation of response | US-13: establish when Mark reviews and what triggers action |
| Separate lasting exercise cues from dated feedback | Preserve useful setup guidance and session context | An extra conversation channel may fragment existing messaging | US-10, US-13: bring real examples currently sent in messages |
| Coach-led progression supported by recent history | Make next targets informed and explainable | More metrics can obscure judgement; incomplete logs mislead automation | US-06, US-14: walk through a real increase/repeat/deload decision |
| Trustworthy history and recovery | Make training worth recording in the first place | Revision/correction and interruption rules need careful scope | US-11–12: decide what must survive plan changes and connectivity loss |

**My recommendation:** agree and validate the basic loop, historical truth and
interruption handling before expanding dashboards or automation. Prefer explicit
coach decisions until real examples justify rules. Reuse can begin with understandable
copies if Mark's workflow supports that; live-linked templates should earn their complexity.

## Candidates to defer unless a demonstrated need emerges

These are recommendations to discuss, not agreed exclusions:

**Update · 2026-10-04:** Max has now supplied a concrete AI use case: workout analysis
and conversational adaptation of his programme, including combining days and taking
it easier when ill. This is requested product direction in US-16–19, not part of the
defer list. It does not by itself establish a need for autonomous long-term programming.

- Payments, subscriptions and bookings.
- Nutrition, habits and meal logging.
- Autonomous full-programme generation or long-term progression without an agreed
  coaching workflow; distinguish these from the requested chat-assisted adaptations.
- Full chat replacement, extensive notifications and video-review tooling.
- Wearables, social feeds, gamification, team management and elaborate analytics.

## Validate before committing

1. Mark shows a recent programme and explains how results changed the next prescription.
2. Max walks through a normal session and one shortened/substituted session.
3. Together, identify where existing tools fail and whether a competitor already solves it.
4. Select and agree the smallest complete story slice; park the remaining ideas.

Capture the answers in the [product brief](product-brief.md) and
[open questions](open-questions.md), then update the [stories](user-stories.md).
