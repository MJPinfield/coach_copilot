# Product brief

Status: **Draft for Max and Mark**. This is deliberately incomplete.

## What we know from the initial conversation

- Mark is a personal trainer building an app to enter his programmes and make
  them available to his customers.
- Max is one of those customers and is helping shape and improve the project.
- The existing app is hosted at <https://markreid30.github.io/coach_copilot/>.
- We want a clear product model before continuing technical development.
- Development must support synthetic local testing without a Supabase account,
  plus repeatable CI including browser tests.

## Confirmed direction · 2026-10-04

Max wants an AI agent that can work with his programme and training history through
chat: analyse workouts, discuss results and help adapt upcoming training. His examples
are combining two planned training days into one session, and saying before starting
that he feels ill and needs to take it easy.

This is a requested product capability, not merely a competitor-inspired idea.
[US-16–19](user-stories.md#us-16--analyse-my-training-through-a-context-aware-conversation)
capture the direction. Max confirmed **text chat only** (Q-19); voice is outside scope.
Acceptance details and release scope remain open. Max subsequently approved
client-confirmed changes limited to the current workout, private chat and coach access
to the applied changes. The backend implements these contracts; no live AI model is connected.

Max also identified visual guidance for unfamiliar exercises as important and selected
[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) as the
integration source. The library must connect to the data model, not just display
unlinked images: prescriptions, agent suggestions and logged movements should refer
to the right exercise. See US-20–21 and the [proposed data model](../architecture/data-model.md).
The dataset's media has a separate Gym Visual licence, which Max confirmed the app
has. The local catalogue now includes real attributed image/GIF URLs; production
hosting and offline delivery remain to be decided.

## Working problem statement — confirm or replace

Mark needs a dependable way to communicate training prescriptions to clients.
Clients need to understand and carry out that training and report what happened,
so Mark can make informed coaching decisions.

Max also wants conversational help understanding his training and adapting it to his
available time and how he feels, with a clear relationship between Mark's prescription,
an agent-assisted adaptation and the workout actually performed.

The current application suggests this feedback loop, but we have not yet confirmed
which parts matter most, what tools it replaces, or what should remain outside it.

## People

| Person / role | What we know | To understand |
| --- | --- | --- |
| Mark / coach | Authors programmes for clients | Current workflow, repetitive work, decision-making, scale |
| Max / client | Receives and follows a programme | In-gym workflow, friction, device/connectivity, useful feedback |
| Other clients | Intended users | How their needs differ; who to speak to first |

No gym administrator, coach marketplace or wider organisation model has been agreed.

## Outcomes to discuss

These are hypotheses, not targets or approved scope:

- Mark can turn a coaching plan into clear instructions without repetitive entry.
- A client can identify what to do next and record training with little interruption.
- A client can open a demonstration and instructions for an unfamiliar exercise,
  alongside Mark's cues, before or during training.
- Mark can distinguish prescribed work from actual work and adapt the plan.
- Both can trust that recorded training is retained and visible to the right people.
- Max can ask questions grounded in his own training records and turn a conversational
  adaptation into usable workout instructions, under the programme-change rules we agree.

For each agreed outcome, add a concrete example and a way to recognise success.
Avoid choosing arbitrary numerical targets before understanding the baseline.

## Discovery notes — contribute here

### Mark: show us one real coaching cycle

- How you currently assess a client and decide on a programme:
- How you write and deliver it:
- How a week changes when training does not go to plan:
- What you look at before changing the next prescription:
- The most frustrating or time-consuming part today:

### Max: walk through one real training session

- How you find out what to train:
- What you need on screen during a set:
- What you change or skip, and why:
- What you record afterwards:
- Where the current app helps or gets in the way:

## Scope decisions — not yet made

- Who the first version is for:
- The smallest complete coaching loop worth releasing:
- What it replaces and what remains in other tools:
- Explicit non-goals:
- How we will know it is ready to use:

See [open questions](open-questions.md) before prioritising the story backlog.
