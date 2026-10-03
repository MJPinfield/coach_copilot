# Product workspace

We are defining what Coach Copilot should do while building a local design foundation.
These documents are a starting point for Max and Mark to edit together, not an
approved specification or a commitment to reproduce the current app.

## Start here

1. [Product brief](product-brief.md) — the problem, people and outcomes.
2. [Domain model](domain-model.md) — shared language and lifecycle questions from the historical app.
3. [Open questions](open-questions.md) — decisions needed before choosing scope.
4. [Technical foundation](technical-foundation.md) — the current rebuild and browser workflow.

[Story template](story-template.md) · [Historical technical checkpoint](technical-checkpoint.md)

The previous workspace referred to a current-product inventory and user-story
backlog that were not present when copied. Existing story IDs remain discussion
references; create agreed stories using the template as scope becomes clear.

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
