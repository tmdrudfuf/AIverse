# Implementation Plan: GitHub Issue Candidate Task Mapping Foundation

**Branch**: `codex/issue-candidate-task-mapping` | **Date**: 2026-07-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/063-github-issue-candidate-task-mapping-foundation/spec.md`

## Summary

Add an in-memory, provider-neutral Candidate Task mapping layer beside Spec 062's issue synchronization module. The mapper converts already-synchronized `IssueSnapshotCollection` values into `CandidateTaskCollection` values without making provider requests, assigning employees, creating executable tasks, or mutating GitHub. The project dashboard renders candidate-task rows separately from raw issue-sync rows.

## Technical Context

**Language/Version**: TypeScript strict mode in the existing Next.js/Phaser app.

**Primary Dependencies**: No new dependencies. Reuses Spec 062 `issue-sync/` types and existing project dashboard/controller patterns.

**Storage**: In-memory only on `ProjectPortalState`; no persistence.

**Testing**: Vitest colocated test files.

**Target Platform**: Browser runtime; no server API, filesystem, shell, GitHub mutation, or Firebase.

**Project Type**: Client application feature in the office project portal.

**Performance Goals**: Mapping is synchronous and linear in the number of synchronized issue snapshots shown in state.

**Constraints**: Provider-neutral, deterministic, read-only, no network calls, no assignment/execution.

**Scale/Scope**: Same project dashboard and issue-sync state introduced by Specs 060-062.

## Constitution Check

No violations.

- Spec first: `spec.md` and quality checklist are present.
- Plan before code: this plan defines the affected files and validation before implementation.
- Tasks gate implementation: `tasks.md` will be created before source changes.
- Preserve application stability: source changes are scoped to a new `candidate-tasks/` module plus state/controller/view integration.
- Validation required: focused tests plus full validation are listed below.

## Project Structure

### Documentation (this feature)

```text
specs/063-github-issue-candidate-task-mapping-foundation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── candidate-task-mapping.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
├── candidate-tasks/
│   ├── CandidateTaskTypes.ts
│   ├── CandidateTaskTypes.test.ts
│   ├── CandidateTaskMapper.ts
│   ├── CandidateTaskMapper.test.ts
│   ├── CandidateTaskService.ts
│   ├── CandidateTaskService.test.ts
│   ├── CandidateTaskView.ts
│   └── CandidateTaskView.test.ts
├── OfficeProjectPortalTypes.ts
├── OfficeProjectPortalRegistry.ts
├── OfficeProjectPortalController.ts
├── OfficeProjectPortalController.issue-sync.test.ts
├── OfficeProjectPortalView.ts
└── OfficeProjectPortalView.test.ts
```

**Structure Decision**: A new `candidate-tasks/` sibling module keeps mapping and inference isolated from provider reads (`issue-sync/`) and executable work (`tasks/`). The controller derives candidate tasks only after issue-sync results are available, and the view receives pure display rows.

## Validation Strategy

- `npx vitest run src/features/city-view/scene/office/candidate-tasks/*.test.ts`
- `npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## Complexity Tracking

No constitution violations.
