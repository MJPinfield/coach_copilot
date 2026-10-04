# Open product questions

Questions are **Open** unless explicitly marked Resolved. Suggested respondents are not approval gates;
they identify whose experience would make the answer useful. Answer with a concrete
example wherever possible. Record decisions here, then update the affected stories.

## Initial backend decisions · 2026-10-04

Max chose a **fresh schema** and approved invite-only clients, administratively
provisioned coach roles, published-only client programme access, private AI chats,
and client-confirmed adaptations limited to the current workout. Mark may review
applied changes/context, not private chat transcripts. These settle the initial
backend choices within Q-03, Q-05, Q-15 and Q-18; broader lifecycle/scheduling details
remain open. The [backend contract](../architecture/backend-api.md) records implemented
rules and remaining limitations. This is not blanket agreement on every draft story.

## First conversation: purpose and the smallest useful product

### Q-01 — Why this product?

**Ask:** Mark and Max. What is difficult in today's coaching/training workflow?
What should this replace, and what should remain in existing tools? Why build this
instead of adopting another coaching app?

**Evidence to bring:** one real programme and the conversation around changing it.

**Answer / decision:** _To discuss._

### Q-02 — Who and what is the first release for?

**Ask:** Mark and Max. Is the first usable slice for Mark and a few existing clients,
or a broader audience? Which complete journey must work, and what can wait?
What devices and gym connectivity must that slice support?

**Answer / decision:** **Partially confirmed by Max**, 2026-10-04: the product focus
is Mark authoring programmes and clients such as Max following/logging workouts
with training-aware text AI assistance. Mark must also be able to use the app on
mobile. Offline training is required: clients can continue logging without gym
signal and sync later. Initial audience size and the complete first-release slice
remain open. See the durable product record in `PRODUCT.md` at the repository root.

## Model the coaching loop

### Q-03 — What does joining coaching mean?

**Ask:** Mark. Does active mean invitation accepted, password created, consultation
complete, coaching begun, or something else? Can training be prepared before acceptance?
Can a person have multiple coaches or both coach and client roles?

**Affected stories:** US-01, US-02, US-03.

**Answer / decision:** _To discuss._

### Q-04 — What happens when coaching pauses or ends?

**Ask:** Both. Who may view or change programmes, history and feedback afterwards?
Can a client return, transfer to another coach, or keep using their training record?
What do deactivation, retention and deletion each mean to the people involved?

**Affected stories:** US-02, US-12, US-15.

**Answer / decision:** _To discuss._

### Q-05 — When is a prescription ready for the client?

**Ask:** Mark. Are immediate edits desirable, or should Mark draft and release a plan?
Can multiple programmes be current? What should a client see when a plan changes?
Which version applies to an underway or completed workout?

**Affected stories:** US-03, US-04, US-05, US-07, US-12.

**Answer / decision:** _To discuss._

### Q-06 — What is a week, and what should the client do next?

**Ask:** Both. Is a week a calendar period, a repeatable block, or a sequence completed
at the client's pace? Who advances the client? How do missed, moved and repeated
sessions affect the next instruction? How does Mark decide progression or deloads?

**Affected stories:** US-06, US-07, US-13.

**Answer / decision:** _To discuss._

### Q-07 — What may happen differently from the plan?

**Ask:** Both. Can clients substitute movements, add/remove sets, change targets,
skip a session or do unplanned training? When is a reason useful? What counts as
finishing a partial workout rather than completing the prescription?

**Affected stories:** US-08, US-09, US-10, US-13.

**Answer / decision:** _To discuss._

### Q-08 — What must survive interruption, and what may be corrected?

**Ask:** Max, then Mark. Consider locking the phone, refreshing, losing signal,
closing the app, switching devices and an ambiguous save result. What should resume?
Can completed workouts be corrected, by whom, and with what visibility of changes?

**Affected stories:** US-08, US-10, US-11, US-12.

**Answer / decision:** **Offline requirement confirmed by Max**, 2026-10-04:
clients must be able to continue logging without gym signal and sync later.
Initial offline preparation, conflict resolution, cross-device recovery and
completed-workout correction rules remain open. This requirement is not yet
implemented in the design prototype.

## Make the information meaningful

### Q-09 — What notation and exercise identity matter?

**Ask:** Mark. Bring actual examples: rep ranges, RIR, rest, tempo, warm-ups,
supersets, bodyweight/assistance and alternatives. Which must be structured versus
readable notes? Is a dumbbell load per hand or total? What makes two exercise names
the same movement for comparison?

**Affected stories:** US-04, US-05, US-08, US-09, US-14.

**Answer / decision:** _To discuss._

### Q-10 — Which feedback changes a coaching decision?

**Ask:** Mark and Max. What should be reported each session, optionally, or only
when something goes wrong? How are pain or difficulty followed up? Is an explicit
answer needed, or is a default acceptable? Does a client expect a response?

**Affected stories:** US-10, US-13.

**Answer / decision:** _To discuss._

### Q-11 — What does adherence actually tell us?

**Ask:** Mark. Is it attendance, unique prescribed sessions attempted, performed sets,
or fidelity to the plan? Which period/assignment is measured? How should repeats,
partial sessions, substitutions and rescheduling count?

**Affected stories:** US-07, US-13.

**Answer / decision:** _To discuss._

### Q-12 — What counts as meaningful progress?

**Ask:** Both. Which comparisons inform coaching or motivate the client: load,
repetitions, technique, RIR, consistency, symptoms, or something else? What qualifies
as a PR? Do first performances, assisted exercises and incomplete sets qualify?

**Affected stories:** US-12, US-14.

**Answer / decision:** _To discuss._

## Challenge the scope before building it

### Q-13 — What needs to live outside this app?

**Ask:** Both. Where do conversation, scheduling, payments and other coaching work
happen today? Would integrating or duplicating any of them solve a demonstrated problem?
Use the product comparison as prompts, not a shopping list.

**Answer / decision:** _To discuss._

### Q-14 — What evidence makes a story ready to release?

**Ask:** Both. Which real walkthroughs, synthetic tests and real-backend checks are
needed for the chosen slice? What would make a failure unacceptable during a workout?
Who can provide the current backend definition and disposable test accounts?

For AI stories, which examples should be reviewed with Max and Mark to establish
useful analysis and adaptations? Distinguish tests with controlled agent responses
from evaluation of real model behaviour and real-backend access checks.

**Answer / decision:** _To discuss._

## Confirmed AI direction and open details

### Recorded direction · 2026-10-04

Max explicitly requested AI chat for workout analysis and programme-aware assistance,
including combining two days and adapting before training when feeling ill. This
establishes the direction for US-16–19, not answers to the open policy questions below.

## AI-assisted analysis and adaptation

### Q-15 — What may the agent change, and who decides?

**Ask:** Max and Mark. Can Max apply an adaptation for today's attempt himself?
Which constraints does Mark set, if any? What requires a discussion with Mark, and
what is the difference between changing one session and rewriting future prescriptions?
What should “yes, do that” in chat apply, and how is that scope made clear?

**Affected stories:** US-07, US-09, US-13, US-17, US-18, US-19.

**Answer / decision:** **Initial rule confirmed by Max:** client confirmation applies
an adaptation to that workout, without per-change coach approval or rewriting future
prescriptions. Broader coach constraints and future-programme edits remain open.

### Q-16 — What does combining two days mean for the plan?

**Ask:** Both. Which work is essential and which can be reduced, omitted or moved?
How do time, overlapping movements, previous training and recovery shape the result?
Does the combined attempt fulfil both sessions, part of each, or a replacement assignment?
What happens to outstanding work, the next session and adherence counts?

**Affected stories:** US-06, US-07, US-09, US-13, US-17, US-19.

**Answer / decision:** _To discuss using two actual sessions from Max's programme._

### Q-17 — How should readiness change the conversation?

**Ask:** Max and Mark. What does “take it easy” mean in real examples: less load,
fewer sets, different movements, a shorter session, rest or postponement? What context
would Mark need when Max reports feeling ill? Which guidance can the agent use, and
when is a conversation with Mark more useful than another suggested workout?

**Affected stories:** US-10, US-13, US-18.

**Answer / decision:** _To discuss; no fixed reduction rule or requirement to train assumed._

### Q-18 — What context can chat use, retain and share?

**Ask:** Both. Which prescriptions, logged workouts, feedback and coach instructions
should inform a response? Should context persist between conversations? Does Mark see
the full transcript, a summary, or just the applied adaptation and its reason? What
happens to access and retained conversation context when coaching ends?

**Affected stories:** US-12, US-13, US-15, US-16, US-18, US-19.

**Answer / decision:** **Initial visibility confirmed by Max:** chat stays private;
Mark can review applied workout changes and their shared context/reason, not the full
chat transcript. Retention and future context-selection details remain open.

### Q-19 — Does “speaking to the agent” include voice?

**Status:** Resolved · 2026-10-04 · Max.

**Affected stories:** US-16, US-17, US-18, US-19.

**Answer / decision:** Text chat only. Max clarified “just text”; voice input and
spoken conversation are outside the requested scope. This applies to analysis,
follow-up questions and requests to adapt a workout.

## Exercise library and visual guidance

### Q-20 — How should Mark's exercise names map to library movements?

**Ask:** Mark and Max. Which actual programme exercises and abbreviations should we
match first? How do we distinguish grip, angle, equipment and machine variants? What
should the authoring flow do when there are multiple plausible matches? Who can create
custom entries and who should see them? Are English instructions sufficient initially?

**Affected stories:** US-04, US-05, US-09, US-16, US-20, US-21.

**Answer / decision:** Max selected the dataset and requested visual guidance and data-model
integration. Matching details, custom entries and language scope remain **Open**.

### Q-21 — How will exercise demonstrations be licensed and delivered?

**Ask:** Max and Mark. Do we already have a Gym Visual licence covering this app, or
need to obtain one? Are the supplied 180×180 GIFs clear enough on the devices clients
use? How should demonstrations behave with poor gym connectivity, and is offline
availability needed for the chosen release?

**Affected stories:** US-07, US-08, US-20, US-21.

**Evidence:** The inspected upstream LICENSE explicitly excludes media from MIT and
directs downstream users to obtain their own Gym Visual licence. Attribution is required
but does not itself grant reuse rights. See [data model and source details](../architecture/data-model.md).

**Answer / decision:** **Rights confirmed by Max**, 2026-10-04. The local import now
contains actual image/GIF URLs pinned to the dataset revision, with attribution and
the licence confirmation recorded. Production asset hosting and offline scope remain
open; this is not a production media deployment.

## Decision record template

```text
Date:
Participants:
Question ID:
Decision:
Rationale / real example:
Affected stories:
What remains open:
```
