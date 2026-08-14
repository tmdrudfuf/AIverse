# Tasks: Fifth Employee Recruiting Action

**Input**: Design documents from `/specs/098-fifth-employee-recruiting-action/`

## Phase 1: Setup

- [X] T001 Update active Spec Kit pointer in `.specify/feature.json` and `AGENTS.md`

## Phase 2: Foundational

- [X] T002 [P] Add employee recruiting service tests in `src/features/city-view/scene/office/employees/EmployeeRecruitmentService.test.ts`
- [X] T003 Add employee recruiting service in `src/features/city-view/scene/office/employees/EmployeeRecruitmentService.ts`
- [X] T004 Add recruiting result state fields in `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts` and `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`

## Phase 3: User Story 1 - Recruit Fifth Employee (P1)

**Goal**: Player activates a company-level recruiting action and one fifth employee joins the roster.

**Independent Test**: Controller input from operating terminal selected on recruiting row adds the fifth employee once and leaves unrelated state unchanged.

- [X] T005 [P] [US1] Add controller recruiting action tests in `src/features/city-view/scene/office/OfficeProjectPortalController.fifth-employee-recruiting.test.ts`
- [X] T006 [US1] Wire recruiting service and selection handling in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T007 [US1] Refresh employee simulation, company dashboard, and progression trigger state after recruitment in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`

## Phase 4: User Story 2 - Show Recruitment Feedback (P2)

**Goal**: Terminal shows whether the fifth employee can be recruited or has already joined.

**Independent Test**: View rendering includes available and complete recruiting row text without losing existing list rows.

- [X] T008 [P] [US2] Add or update terminal rendering tests in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`
- [X] T009 [US2] Render recruiting row and instructions in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`

## Final Phase: Polish

- [X] T010 Review implementation against spec, plan, and contracts without running disallowed validation commands

## Dependencies

- Phase 1 before all other phases.
- T002 before T003.
- T003 and T004 before T006.
- T006 before T007 and T009.
- User Story 1 before User Story 2.

## Implementation Strategy

Implement the recruiting service first, then controller state/input, then terminal display feedback.
