# Research: Controlled Autonomous Backlog Execution Policy

## Decision: Use a focused policy service plus controller orchestration

**Rationale**: Eligibility, deterministic selection, cloning, and malformed-state fail-closed behavior are pure policy concerns. The office controller already owns selected project context and the trusted Spec 142 start method, so orchestration can select a task and delegate to that method without duplicating execution logic.

**Alternatives considered**: Adding autonomous behavior directly to the bridge was rejected because Spec 142 should remain the manual task-to-development primitive. A separate executor was rejected because it would duplicate request, preparation, execution, and association logic.

## Decision: Persist policies in browser office session state

**Rationale**: Project backlog tasks, suggestions, execution associations, and ADOS run state already persist through BrowserOfficeSessionService. Adding project-scoped policies to the same snapshot restores consent and limits without a second store.

**Alternatives considered**: A global application policy was rejected because multi-project isolation is mandatory. Ephemeral state was rejected because reload must preserve explicit operator configuration without implying new consent.

## Decision: Initial concurrency and frequency boundary is one event-driven start

**Rationale**: The trusted execution path already models active/resumable runs. Starting one eligible task per explicit evaluation or safe event avoids busy loops and uncontrolled queues while satisfying the controlled autonomy goal.

**Alternatives considered**: Daily limits and cooldowns were deferred because the requirements allow a simpler safe implementation. Polling and chained recursive execution were rejected as unsafe.

## Decision: Priority, status, and association data come from real backlog tasks

**Rationale**: Spec 143 suggestions are advisory until operator acceptance. The accepted backlog task is the authoritative source for priority, Ready state, title, and description.

**Alternatives considered**: Reading suggestion priority directly was rejected because it would bypass operator acceptance/editing.
