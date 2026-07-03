# Contract: Company Influence Planning Service

## Purpose

Provide deterministic local focus planning behavior without mutating employee, project, task, schedule, work-session, NPC, economy, or external provider state.

## Responsibilities

- Provide the canonical list of company focus options.
- Create the initial local influence plan state.
- Select a valid focus.
- Ignore or reject invalid focus identifiers without side effects.
- Derive dashboard-ready focus summary data from local state.

## Expected Behaviors

### List Focus Options

**Input**: None

**Output**: Exactly five focus options:

- Improve delivery speed
- Improve quality
- Improve team morale
- Reduce project risk
- Prepare for company growth

**Rules**:

- Ordering must be deterministic.
- Option identity must be stable.

### Create Initial State

**Input**: None

**Output**: Local state with no active focus.

**Rules**:

- Must not inspect or mutate simulation systems.

### Select Focus

**Input**: Current local state and a focus identifier.

**Output**: Updated local state with the selected focus active.

**Rules**:

- Valid focus identifiers select exactly one focus.
- Selecting the already active focus is idempotent.
- Invalid focus identifiers leave state unchanged or return a clear local failure result.
- Must not assign employees, change tasks, change AI behavior, change schedules, move NPCs, mutate work sessions, mutate projects, call external providers, or create economy/payroll effects.

### Build Dashboard Summary

**Input**: Current local influence plan state.

**Output**: Dashboard-ready current focus summary.

**Rules**:

- Summary text may be advisory only.
- Summary must not claim direct operational effects.
- Summary must be safe to render when no focus is selected.
