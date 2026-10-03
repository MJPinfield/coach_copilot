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

## Working problem statement — confirm or replace

Mark needs a dependable way to communicate training prescriptions to clients.
Clients need to understand and carry out that training and report what happened,
so Mark can make informed coaching decisions.

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
- Mark can distinguish prescribed work from actual work and adapt the plan.
- Both can trust that recorded training is retained and visible to the right people.

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
