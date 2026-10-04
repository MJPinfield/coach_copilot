# Product workspace

We are defining what Coach Copilot should do while building a local design foundation.
These documents are a starting point for Max and Mark to edit together, not an
approved specification or a commitment to reproduce the current app.

## Start here

1. [Product brief](product/product-brief.md) — the problem, people and outcomes.
2. [Product inventory](current-product.md) — the current prototype and historical app inventory.
3. [Domain model](architecture/domain-model.md) — shared language and lifecycle questions from the historical app.
4. [Proposed data model](architecture/data-model.md) — exercise-library entities, dataset mapping and training references.
5. [Draft user stories](product/user-stories.md) — outcomes and proposed acceptance scenarios.
6. [Open questions](product/open-questions.md) — decisions needed before choosing scope.
7. [Comparable products](product/product-research.md) — official-source research and proposed directions.
8. [Technical foundation](architecture/technical-foundation.md) — the current rebuild and browser workflow.
9. [Backend API](architecture/backend-api.md) — fresh schema, Auth, RLS, transactional commands and local verification.
10. [Domain security](architecture/domain-security.md) — role/operation matrix, lifecycle rules and security test coverage.

[Story template](product/story-template.md) · [Historical technical checkpoint](history/technical-checkpoint.md)

The inventory, draft stories and product research were recovered from the
pre-rebuild workspace. Story IDs are preserved so existing questions and discussion
references resolve. Historical evidence is not proof of capability in the current
prototype; agree scope and verify stories against the rebuilt app as work progresses.

Max's subsequent request for AI workout analysis and conversational session adaptation
is captured in **US-16–19**, with open details in **Q-15–18** and text-only chat confirmed
in **Q-19**. This is confirmed product
direction; the stories' acceptance details and release scope remain Draft.

Visual exercise guidance and the selected dataset integration are captured in
**US-20–21**, with the proposed data model and open details in **Q-20–21**.

## How we will work

- Start with a real example from Mark's coaching or Max's training.
- Agree the outcome and the language before choosing screens or technology.
- Edit an existing story or add one using the template. Keep story IDs stable.
- Add examples of success, failure and recovery. State which rules are undecided.
- Mark a story **Agreed** only after product discussion. Choose release scope
  separately; a story being useful does not automatically put it in the first release.
- Once a story is agreed and selected, use its acceptance scenarios to guide
  implementation and local/CI tests.

## Status and evidence

**Story status:** Draft → Agreed → Implementing → Verified. Deferred stories remain
visible with a reason. No story in this initial inventory is Agreed.

**Evidence is separate from status:**

- **Source-observed:** a path exists in the checked-out code.
- **Synthetic-tested:** exercised using fake services; this proves only that scenario.
- **Live-verified:** confirmed against a real deployment with the appropriate account.
- **Proposed:** an outcome or rule to discuss, not an existing capability.

We have not performed an authenticated live-product walkthrough or verified the
Supabase database policies. Client data isolation is not established by hiding
buttons or by passing synthetic tests.

## Contributing

Informal notes and disagreement are welcome. Add examples, replace terminology
that does not match coaching practice, or answer a question inline. Record a
decision with **date, participants, decision and rationale** so later changes have
context. Do not put credentials or identifiable client records in these documents.
