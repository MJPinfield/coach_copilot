# Coach Copilot V3.4 — coaching workflow

V3.4 is built from the known-good V3.3.5 baseline. The V3.3.5 onboarding, authentication, client activation, programme delivery, workout completion and history sync flow is retained.

## V3.4 changes

- **Coach-only Quick Build:** write/paste a programme in normal PT shorthand, preview the parsed structure, edit it, then create a new programme or add sessions to the current week.
- Quick Build is deterministic and local until approval: **nothing is written to Supabase when you press Build preview.**
- Supports common shorthand including `4x5 @70kg`, `70kg 4x5`, `3x8-10 @26kg`, RIR and coaching notes.
- Multiple sessions can be entered with `Session: Upper A`, `Session: Lower A`, etc.
- **Coach snapshot:** current programme, weekly completion, total completed sessions, latest sleep and last workout.
- **Client workout shortcut:** Complete prescribed fills and marks all prescribed sets for an exercise; the client can still edit individual values.
- **Workout review:** client notes are surfaced and simple historical weight/rep PRs are flagged in History.
- **Client weekly summary:** current weekly completion is shown above the workout.

## Deployment

Upload the root static files to GitHub Pages exactly as for V3.3.5.

**No new Supabase SQL or Edge Function deployment is required for V3.4.** Keep the existing V3.3.5 `invite-client` Edge Function and the `activate_my_client_relationship()` RPC.

## Quick Build examples

Single session:

    Upper A

    Bench press 4x5 @70kg 2 RIR
    Pull ups 3x8
    Incline DB press 3x8-10 @26kg
    Chest supported row 3x10 @70kg
    Lateral raise 3x12 @10kg

    Bench press: 3 min rest, pause first rep

Multiple sessions:

    Programme: 3 Day Strength
    Week: Week 1
    Session: Upper A
    Bench press 4x5 @70kg 2 RIR
    Pull ups 3x8

    Session: Lower A
    Leg press 3x10 @200kg
    RDL 3x8 @80kg

Rep ranges currently use the lower number as the structured rep target and preserve the full range in coach notes (for example `8-10` becomes target reps `8` plus note `Target rep range 8–10`). This avoids a database schema change in V3.4.
