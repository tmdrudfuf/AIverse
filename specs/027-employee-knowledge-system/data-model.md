# Data Model: Employee Knowledge System

## EmployeeKnowledgeSource

**Purpose**: Read-only source context for the Employee Insight-selected employee.

**Fields**:

- `insightSource`: Existing `EmployeeInsightSource` for identity, role, AI state, task, project, progress, mood, schedule, movement, workstation, and progression context.
- `conversationContext`: Optional read-only conversation context when already available; must not include dialogue commands or choices.
- `activitySources`: Existing task, work session, schedule, AI, conversation, or progression activity records that can be summarized without duplication.
- `confidence`: Optional confidence value only when source systems expose it.

**Relationships**:

- Derived from Employee Insight source data and existing office controller composition.
- Feeds EmployeeKnowledgeService derivation.
- Does not persist or mutate source state.

## EmployeeKnowledgeViewModel

**Purpose**: Read-only panel content for the current observed employee.

**Fields**:

- `employeeId`
- `name`
- `roleLabel`
- `aiStateLabel`
- `taskLabel`
- `projectLabel`
- `progressLabel`
- `moodLabel`
- `thinkingText`
- `whyText`
- `currentGoalText`
- `scheduleSummary`
- `recentActivityTimeline`
- `plannedNextActivityText`
- `confidenceLabel`
- `updatedAtLabel`

**Validation Rules**:

- Required identity and state fields must use source data or stable fallback labels.
- Optional fields must be omitted or marked unavailable when real source data is missing.
- No field may create new simulation truth that does not exist in source systems.

## EmployeeKnowledgeReason

**Purpose**: A concise explanation for the observed employee's current behavior.

**Fields**:

- `summary`: Player-facing explanation.
- `sourceKinds`: Source categories used, such as AI state, schedule, task, project, conversation, or progression.
- `confidence`: Optional source-provided confidence.

**Validation Rules**:

- Must be deterministic from source state.
- Must not be dialogue speech.
- Must not call an AI provider.

## EmployeeKnowledgeGoal

**Purpose**: A concise summary of the employee's active objective.

**Fields**:

- `summary`
- `sourceTaskId`
- `sourceProjectId`
- `scheduleState`
- `aiState`

**Validation Rules**:

- Prefer current task/project when present.
- Fall back to schedule and AI state when no task exists.
- Use unavailable wording rather than inventing a goal.

## EmployeeKnowledgeScheduleSummary

**Purpose**: Today's schedule context for the observed employee.

**Fields**:

- `currentBlockLabel`
- `currentScheduleState`
- `nextBlockLabel`
- `plannedNextActivityText`

**Validation Rules**:

- Must derive from existing schedule snapshots.
- Must omit or mark unavailable when schedule data is absent.

## EmployeeKnowledgeTimelineItem

**Purpose**: One recent activity entry for the knowledge panel.

**Fields**:

- `id`
- `label`
- `timeLabel`
- `sourceKind`
- `sourceId`

**Validation Rules**:

- Must reference existing activity source data.
- Must be ordered predictably, newest first unless the panel contract states otherwise.
- Must limit item count for readability.

## State Transitions

```text
No nearby Insight target
  -> Knowledge hidden

Insight target selected
  -> Derive EmployeeKnowledgeSource
  -> Derive EmployeeKnowledgeViewModel
  -> Knowledge visible

Simulation source changes
  -> Re-derive from latest source data
  -> Knowledge remains visible for the same Insight target

Insight target changes or blocking overlay opens
  -> Knowledge hides or re-derives for new Insight target
```
