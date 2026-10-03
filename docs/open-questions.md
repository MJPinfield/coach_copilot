# Open product questions

All questions below are **Open**. Suggested respondents are not approval gates;
they identify whose experience would make the answer useful. Answer with a concrete
example wherever possible. Record decisions here, then update the affected stories.

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

**Answer / decision:** _To discuss._

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

**Answer / decision:** _To discuss._

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

**Answer / decision:** _To discuss._

## Decision format

```text
Date:
Participants:
Question ID:
Decision:
Rationale / real example:
Affected stories:
What remains open:
```
