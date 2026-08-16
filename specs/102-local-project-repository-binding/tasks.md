# Tasks: Local Project Repository Binding

**Input**: Design documents from `specs/102-local-project-repository-binding/`

**Tests**: Included for binding transformation, clone safety, adapter mapping, and portal state integration. Validation is not run from this ADOS runtime.

## Phase 1: Setup

**Purpose**: Restore active Spec Kit pointers for spec 102.

- [X] T001 Update `.specify/feature.json` and `AGENTS.md` to point at `specs/102-local-project-repository-binding/plan.md`

---

## Phase 2: Foundational

**Purpose**: Add configured binding types before transformations or state integration.

- [X] T002 Add local repository binding types to `src/features/city-view/scene/office/project-registry/ProjectRegistryTypes.ts`

---

## Phase 3: User Story 1 - Bind a project to local repository metadata (Priority: P1)

**Goal**: Apply a successful local binding and expose it through project registry and portal state.

**Independent Test**: Apply a Daily Proof binding and read back exact configured metadata from registry entries and portal projects.

- [X] T003 [US1] Add `src/features/city-view/scene/office/project-registry/LocalProjectRepositoryBinding.ts` with pure binding application logic
- [X] T004 [US1] Extend `ProjectRegistryService` with optional seed bindings and cloned local binding metadata in `src/features/city-view/scene/office/project-registry/ProjectRegistryService.ts`
- [X] T005 [US1] Map local binding metadata through `toProjectPortalProject` in `src/features/city-view/scene/office/project-registry/ProjectRegistryAdapters.ts` and `ProjectPortalProject` in `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`
- [X] T006 [US1] Accept optional local bindings in `createProjectPortalState` in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`
- [X] T007 [P] [US1] Add successful binding tests in `src/features/city-view/scene/office/project-registry/LocalProjectRepositoryBinding.test.ts`
- [X] T008 [P] [US1] Add portal state binding test in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.test.ts`

---

## Phase 4: User Story 2 - Reject unsafe or incomplete bindings (Priority: P2)

**Goal**: Reject unknown-project and missing-path input without mutating entries.

**Independent Test**: Attempt rejected bindings and confirm unchanged entries plus explicit reasons.

- [X] T009 [US2] Add rejection behavior to `LocalProjectRepositoryBinding.ts`
- [X] T010 [P] [US2] Add rejection tests in `src/features/city-view/scene/office/project-registry/LocalProjectRepositoryBinding.test.ts`

---

## Phase 5: User Story 3 - Preserve safe copy boundaries (Priority: P3)

**Goal**: Bound metadata follows existing clone-on-read and adapter copy boundaries.

**Independent Test**: Mutate returned bound metadata and confirm registry/adapted source state remains unchanged.

- [X] T011 [US3] Update `ProjectRegistryService.test.ts` for bound metadata clone independence
- [X] T012 [US3] Update `ProjectRegistryAdapters.test.ts` for bound metadata copy independence

---

## Phase 6: Polish

- [X] T013 Confirm no feature code imports `fs`, `child_process`, or `node:*`, and do not run validation from this runtime

## Dependencies & Execution Order

- Phase 1 before implementation.
- Phase 2 blocks all user stories.
- User Story 1 is the MVP.
- User Story 2 depends on the binding module.
- User Story 3 depends on service and adapter mapping.

## Implementation Strategy

Implement sequentially in task order. Mark each task complete in this file after its edit is made.
