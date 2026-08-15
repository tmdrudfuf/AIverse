# Tasks: NPC Workstation Task Animation

**Input**: Design documents from `/specs/100-npc-workstation-task-animation/`

## Phase 1: Setup

- [X] T001 Update the managed Spec Kit pointer in `AGENTS.md` to `specs/100-npc-workstation-task-animation/plan.md`.

## Phase 2: Foundational

- [X] T002 [P] Add focused NPC work-animation derivation tests in `src/features/city-view/scene/office/OfficeProjectPortalController.npc-work-animation.test.ts`.
- [X] T003 [P] Add focused renderer tests for active and cleared work indicators in `src/features/city-view/scene/office/npc/OfficeEmployeeNpcRenderer.test.ts`.
- [X] T004 Extend `EmployeeNpcViewModel` with optional workstation work-animation state in `src/features/city-view/scene/office/npc/EmployeeNpcTypes.ts`.

## Phase 3: User Story 1 - See Active Work At Workstations (Priority: P1) MVP

**Goal**: A working employee whose NPC has arrived at a workstation shows active work animation state and a visible renderer indicator.

**Independent Test**: Generate a working arrived workstation NPC view model and render it; confirm active animation state and visible indicator output.

- [X] T005 [US1] Derive active workstation work-animation state in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.
- [X] T006 [US1] Render a visible attached work indicator for active animation state in `src/features/city-view/scene/office/npc/OfficeEmployeeNpcRenderer.ts`.

## Phase 4: User Story 2 - Keep Non-Working NPCs Static (Priority: P2)

**Goal**: Idle, assigned-only, unavailable, moving, or inactive employees do not show work animation, and stale indicators clear.

**Independent Test**: Generate/render inactive states after an active state and confirm no active animation state or visible indicator remains.

- [X] T007 [US2] Keep animation inactive for non-working and moving employees in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.
- [X] T008 [US2] Hide stale work indicators for inactive view models in `src/features/city-view/scene/office/npc/OfficeEmployeeNpcRenderer.ts`.

## Phase 5: User Story 3 - Preserve Read-Only Office State (Priority: P3)

**Goal**: Work-animation derivation and rendering do not mutate source portal or office service state.

**Independent Test**: Snapshot source state before deriving/rendering and confirm it remains unchanged afterward.

- [X] T009 [US3] Cover read-only source state behavior in `src/features/city-view/scene/office/OfficeProjectPortalController.npc-work-animation.test.ts`.
- [X] T010 [US3] Keep task context copied and bounded in `src/features/city-view/scene/office/OfficeProjectPortalController.ts` and `src/features/city-view/scene/office/npc/OfficeEmployeeNpcRenderer.ts`.

## Phase 6: Polish

- [X] T011 Review changed feature scope against `specs/100-npc-workstation-task-animation/spec.md`, `plan.md`, and `contracts/npc-workstation-task-animation.md`.

## Dependencies

- Phase 1 must complete before implementation tasks.
- Phase 2 tests/types precede story implementation.
- User Story 1 is the MVP and must complete before User Story 2 and User Story 3.
- User Story 2 depends on renderer and derivation behavior from User Story 1.
- User Story 3 depends on the final derivation and renderer shape.

## Parallel Execution Examples

- T002 and T003 can be written in parallel because they touch different test files.
- Renderer tests can evolve alongside view-model derivation tests once T004 establishes the type contract.

## Implementation Strategy

1. Complete the Spec Kit pointer and type contract.
2. Add focused tests for derivation and renderer behavior.
3. Implement the smallest view-model and renderer changes that satisfy the tests.
4. Mark tasks complete as each change lands.
