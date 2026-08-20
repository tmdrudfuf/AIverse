# Tasks: Project Portal Text Overflow and Layout Stability

**Input**: Design documents from `/specs/112-project-portal-text-overflow-and-layout/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is included because the feature changes user-visible layout stability and the handoff prohibits broader runtime validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Restore active Spec Kit context and identify the existing portal layout boundary.

- [X] T001 Restore feature 112 Spec Kit artifacts under specs/112-project-portal-text-overflow-and-layout/
- [X] T002 Update active Spec Kit pointer in .specify/feature.json and AGENTS.md to feature 112
- [X] T003 Inspect existing Project Portal render and test helpers in src/features/city-view/scene/office/OfficeProjectPortalView.ts and src/features/city-view/scene/office/OfficeProjectPortalView.test.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add reusable local fitting behavior needed by all affected portal views.

- [X] T004 Add local text fitting helpers in src/features/city-view/scene/office/OfficeProjectPortalView.ts
- [X] T005 Ensure existing Project Dashboard lower-row fitting still retains core rows before optional rows in src/features/city-view/scene/office/OfficeProjectPortalView.ts

---

## Phase 3: User Story 1 - Read Portal Rows Without Overlap (Priority: P1) MVP

**Goal**: Long portal content remains readable without row or panel collisions.

**Independent Test**: Render the Project Portal with long fixture content and verify rows are wrapped, compacted, clamped, or omitted inside visible panels.

### Tests for User Story 1

- [X] T006 [P] [US1] Add long-content Project Dashboard lower-panel layout test in src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
- [X] T007 [P] [US1] Add long-content detail/task/candidate view layout tests in src/features/city-view/scene/office/OfficeProjectPortalView.test.ts

### Implementation for User Story 1

- [X] T008 [US1] Apply bounded title, summary, detail, and metadata text fitting in src/features/city-view/scene/office/OfficeProjectPortalView.ts
- [X] T009 [US1] Clamp task detail, candidate detail, repository detail, workspace, and project detail body rows in src/features/city-view/scene/office/OfficeProjectPortalView.ts

**Checkpoint**: User Story 1 should be independently testable through the focused portal rendering tests.

---

## Phase 4: User Story 2 - Preserve Portal Navigation Cues (Priority: P2)

**Goal**: Footer instructions and selected-row highlights remain readable with crowded content.

**Independent Test**: Render crowded portal views and verify the footer instruction row remains clear of content.

### Tests for User Story 2

- [X] T010 [P] [US2] Add footer-clearance assertions for crowded portal views in src/features/city-view/scene/office/OfficeProjectPortalView.test.ts

### Implementation for User Story 2

- [X] T011 [US2] Reserve footer-safe content bounds for crowded portal views in src/features/city-view/scene/office/OfficeProjectPortalView.ts

**Checkpoint**: User Story 1 and User Story 2 should both be independently covered by focused tests.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Confirm task completion and document runtime validation limits.

- [X] T012 Mark all completed tasks in specs/112-project-portal-text-overflow-and-layout/tasks.md
- [X] T013 Document that validation commands were not run due to handoff policy

## Runtime Notes

- Validation commands were not run from this runtime because the handoff explicitly prohibited validation, review, publish, merge, deploy, GitHub mutation, and server/review runtime actions.

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies
- Foundational (Phase 2): Depends on Setup completion
- User Story 1 (Phase 3): Depends on Foundational completion
- User Story 2 (Phase 4): Depends on User Story 1 fitting behavior
- Polish (Phase 5): Depends on implementation completion

### Parallel Opportunities

- T006 and T007 touch the same test file and should be coordinated, but their fixtures are conceptually independent.
- T010 extends the same test file after US1 tests are in place.

## Implementation Strategy

1. Restore the missing feature 112 Spec Kit context.
2. Add tests describing the unsafe long-content cases.
3. Implement small view-local fitting helpers and apply them to crowded render paths.
4. Mark tasks complete and report that prohibited validation was not run.
