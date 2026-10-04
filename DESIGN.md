---
name: Coach Copilot
description: Default Mantine for clear, task-focused training screens
colors:
  primary: "#1971c2"
  background: "#ffffff"
  text: "#000000"
  supporting-text: "#2e2e2e"
  divider: "#dee2e6"
typography:
  heading:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  supporting:
    fontSize: "14px"
rounded:
  sm: "4px"
  md: "8px"
spacing:
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    rounded: "{rounded.sm}"
  paper:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
---

# Design System: Coach Copilot

## Overview

Default Mantine is the confirmed visual direction. Custom branding is deferred.
This document records the existing library-based world rather than introducing a
new identity. Screens prioritise readable targets, direct controls and clear save
feedback while clients train in a bright gym.

**Key Characteristics:** standard controls; plain language; progressive disclosure;
explicit prescribed/actual distinction; mobile-friendly field groups.

## Colors

White surfaces and black body text use Mantine defaults. Primary text links and
filled actions use the built-in `blue.8` shade for contrast. Supporting descriptions
use `dark.6`; do not rely on low-contrast default dimmed text for instructions.
Status badges use the neutral `default` variant and communicate through words.

## Typography

Use Mantine's system font stack. H1 is 34px/700 with a 1.3 line height; normal body
text is 16px and supporting text 14px. Keep real semantic heading levels while
using Mantine's `size` when a smaller visual hierarchy fits.

## Layout

The client shell has a 64px header and a centred `Container size="sm"` (720px maximum).
Login uses a 420px container. Mantine padding and Stack spacing own the rhythm;
there is no custom grid or breakpoint override. Actual load, reps and RIR use a
three-column `SimpleGrid`. Exercise/block and round selectors remain accessible
without requiring a prescribed performance order.

## Elevation & Depth

Content uses flat surfaces and standard borders. Mantine owns popover, select and
modal elevation, focus handling and transition behaviour.

## Shapes

Use Mantine's standard 4px control corners and 8px Paper corners, with the default
border treatment. Do not create a parallel custom component theme.

## Components

- **Authentication:** existing `AccountForm`, inside a bordered Paper; adapted from
  Mantine UI's authentication layout.
- **Workout selection:** session name, notes, exercise summary and explicit Start
  action; resume is the primary home action when an attempt is open.
- **Logging:** selected round, target summary, actual inputs, explicit record/undo;
  superset partners retain separate results with rest after the pair.
- **Details:** Mantine Accordion for guidance and load interpretation.
- **Completion:** Mantine Modal because finishing makes the attempt immutable.
- **State:** readable save text, inline recoverable errors and ordinary empty states.

## Do's and Don'ts

- Do compose Mantine and use its supported props, controls and accessibility.
- Do keep targets separate from actuals and preserve unknown values.
- Do expose save and offline boundaries truthfully.
- Don't force clients through exercise order when equipment is unavailable.
- Don't introduce custom branding before it is requested.

Extracted from `src/main.tsx`, `src/app/router.tsx`, `src/features/client/` and the
rendered Mantine 9.6.3 CSS on 2026-10-04. Legacy `src/app/styles.css` is not loaded by
the connected client app and is not this system's authority.
