---
target: src/features/mockups
total_score: 22
max_score: 40
na_heuristics: ""
p0_count: 0
p1_count: 5
---

# Mockup criteria review

## Archived design exploration

This report records the discarded Mantine mockups at commit `f14e97c`.
Source paths and line references below describe that historical prototype, not
the current main branch. The product context and findings were retained when the
mockup implementation and worktree were removed at Max's request.

Follow-up from Max: supersets were missing from the mockups. The next design pass
should represent grouped exercises (A1/A2), alternating round order, separate
between-exercise and between-round rest, and per-exercise reps/load logging in
both coach and client views. Detailed authoring rules remain to be agreed.

⚠️ DEGRADED: single-context (nested reviewers blocked by subagent depth limit).

## Verdict and scope

Visual direction meets the agreed Mantine approach. Product criteria are only
partially covered. Reviewed all three live routes, desktop layouts and a narrow
workout layout. Browser effective narrow viewport was 492 CSS pixels; exact 390px
behavior remains unverified. Confirmed requirements come from PRODUCT.md and
recorded decisions; draft story details are not blanket acceptance criteria.

## Coverage

- Meets: default Mantine styling, clear selected client, fixed prescription preview,
  explicitly checked sets, honest demo disclaimers.
- Partial: coach mobile layout, programme authoring, actual training entry.
- Missing: offline/sync/resume, contextual text AI, confirmed current-workout
  adaptations, original/applied/actual comparison, private versus shared AI context,
  linked exercise demonstrations/provenance, publishing and detailed result review.
- Outside these screens: invitation and role-scoped access verification.

## Heuristics

| Heuristic | Score /4 | Gap |
| --- | --- | --- |
| System status | 2 | No save/sync lifecycle |
| Real-world language | 3 | Load semantics unresolved |
| User control | 2 | No return-to-log after finish |
| Consistency | 3 | Incomplete cross-screen continuity |
| Error prevention | 2 | Interruption recovery absent |
| Recognition | 3 | Previous performance absent |
| Efficiency | 2 | Long mobile layout, small checkboxes |
| Minimalist design | 3 | Repeated summary cards |
| Error recovery | 1 | No workout save/retry states |
| Help | 1 | No exercise guidance |
| Total | 22/40 | Acceptable foundation; significant gaps |

## Priority issues

1. **P1 Offline/recovery missing:** `workout.tsx:8–11`, `shell.tsx:41`.
   Page state resets. Mock up device-saved, pending-sync, retry and resumed states.
   Suggested command: `/impeccable harden`.
2. **P1 AI adaptation missing:** `workout.tsx:17–19`. Add text conversation,
   source sessions, original/proposed differences, explicit application and shared
   context separate from private chat. Do not silently resolve scheduling rules.
   Suggested command: `/impeccable shape`.
3. **P1 Exercise guidance missing:** `coach.tsx:12–15`, `workout.tsx:18`.
   Link exact catalogue variants; show demonstration, instructions, attribution,
   distinct coach cues and unavailable-media/unmatched states while preserving entries.
   Suggested command: `/impeccable shape`.
4. **P1 Coaching loop incomplete:** `coach.tsx:53–68`, `workout.tsx:16`.
   Demonstrate prescription editing, deliberate delivery and original/adapted/actual
   review. Finished summary needs recorded set details, beyond a count.
   Suggested command: `/impeccable shape`.
5. **P1 Low contrast:** repeated dimmed text across all three files renders at
   3.2–3.3:1; some badges also fail. Use darker Mantine colors while retaining
   default theme. Enlarge set completion hit areas. Suggested command: `/impeccable audit`.

## Specificity, strengths and usability

Training prescriptions, cues and set tracking are product-relevant; conventional
dashboard styling fits the explicit default-theme direction. Clear client identity,
explicit completion and honest demo limitations are strengths.

Cognitive load is generally low on desktop, moderate on mobile where summaries
push logging down the page. Grouping and progressive disclosure help. No primary
decision has more than four peer choices. Repeated set inputs are records, not
unrelated options. Reassuring opening copy leads to a weak finish: only a count,
without inspect/edit action.

Persona red flags: Casey loses progress on reload and has a small completion
target; Sam encounters low-contrast instructions; Jordan cannot inspect unfamiliar
movements. Try-again clears feedback/completion but retains edited loads/reps
(`workout.tsx:16`); clarify intended reset behavior.

## Evidence

CLI detector: zero findings. Runtime detector: overview 36, programme 22, workout
20 flags, including repeated shell findings; not 78 unique defects. Runtime found
contrast issues missed by static scanning. Cramped-padding wrapper flags are not
convincing visual defects. Layout transitions alone do not prove performance harm.
Injection ran on all three routes; temporary detector server stopped. Existing app
server was reused. Exact 390px, keyboard and screen-reader checks remain outstanding.

## Questions for the next iteration

- Prioritize offline/recovery, AI adaptation, or coach-to-client end-to-end flow?
- Next scope: missing interactive mockup journeys, or mockups plus backend wiring?
