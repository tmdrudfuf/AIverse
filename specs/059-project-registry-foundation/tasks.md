---
description: "Task list for Spec 059 — Project Registry Foundation"
---

# Tasks: Project Registry Foundation

**Input**: Design documents from `specs/059-project-registry-foundation/` (spec.md, plan.md)

**Tests**: Included — the Spec explicitly requires automated coverage for the registry service, adapters, and detail-screen rendering.

**Organization**: Grouped by user story per `plan.md`'s Project Structure. All new code lives under `src/features/city-view/scene/office/project-registry/`; modifications touch `OfficeProjectPortalTypes.ts`, `OfficeProjectPortalRegistry.ts`, `OfficeProjectPortalView.ts`.

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: The registry model and service must exist before any adapter, wiring, or UI task can proceed.

- [X] T001 Create `src/features/city-view/scene/office/project-registry/ProjectRegistryTypes.ts`: `ProjectRegistryLocalRepositoryIdentity`, `ProjectRegistryOwner`, `ProjectRegistryEntry` (per plan.md's Key Entities / field mapping table). Widen `ProjectPortalProjectType` in `OfficeProjectPortalTypes.ts` to `"Company" | "Portfolio" | "Lab" | (string & {})`.
- [X] T002 Add optional `ownerCompany?: string` and `localRepositoryLabel?: string` to `ProjectPortalProject`, and add `projectRegistryEntries: ProjectRegistryEntry[]` to `ProjectPortalState`, in `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`.
- [X] T003 Create `src/features/city-view/scene/office/project-registry/ProjectRegistrySeedData.ts` exporting `createDefaultProjectRegistryEntries(): ProjectRegistryEntry[]` with the `daily-proof`/`portfolio`/`ai-lab` entries from plan.md's seed data table (fixed ISO timestamps, verbatim descriptions from today's `OfficeProjectPortalRegistry.ts`).
- [X] T004 [P] Create `src/features/city-view/scene/office/project-registry/ProjectRegistryService.ts`: class with a constructor accepting optional seed entries (default `createDefaultProjectRegistryEntries()`), `getAllProjects()`, `getProject(id)`, `registerProject(entry)` (throws on duplicate id), all returning/storing deep clones (no shared mutable references), per FR-001–FR-003.
- [X] T005 [P] `src/features/city-view/scene/office/project-registry/ProjectRegistryService.test.ts`: seeded state contains exactly the three default projects in order; `registerProject` adds a fourth entry and appears in `getAllProjects()`; `registerProject` with a duplicate id throws and leaves the registry unchanged; `getAllProjects()`/`getProject()` results are independent copies (mutating a returned entry does not affect the registry).

**Checkpoint**: Registry model + service exist and are independently tested. No other file has been touched yet.

---

## Phase 2: User Story 1 - See Daily Proof as a company-owned project (P1) 🎯 MVP

**Goal**: Selecting Daily Proof in the portal shows `Repository: Connected (local)` and `Company: Daily Proof Inc.`, and `state.repositoryMappings` is unchanged in value from today.

**Independent Test**: Render the detail screen for `daily-proof` with a fresh `createProjectPortalState()` and confirm both new lines appear with the correct values; confirm `state.repositoryMappings` still contains exactly the one `daily-proof -> ai-verse/daily-proof` mapping.

### Implementation for User Story 1

- [X] T006 [US1] Create `src/features/city-view/scene/office/project-registry/ProjectRegistryAdapters.ts`: `toProjectPortalProject(entry)` and `toRepositoryMapping(entry)` per plan.md's field-mapping table (nextAction derived from `lifecycleStatus`, not per-project id).
- [X] T007 [P] [US1] `src/features/city-view/scene/office/project-registry/ProjectRegistryAdapters.test.ts`: `toProjectPortalProject` maps every field correctly for an Active entry and a Planned/no-remote entry (including the `nextAction`/`enabled` lifecycle-status rule); `toRepositoryMapping` returns the exact expected mapping for `daily-proof`'s seed entry and returns `undefined` when `remoteRepository` is absent.
- [X] T008 [US1] Rewrite `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`: remove the `PROJECTS` and `REPOSITORY_MAPPINGS` consts and `createRepositoryMappings()`; construct a `ProjectRegistryService` in `createProjectPortalState()`, and derive `projects`, `repositoryMappings`, and the new `projectRegistryEntries` state field from `service.getAllProjects()` via the T006 adapters. Leave `PLACEHOLDER_SERVICES`/`createLinkedServices()`/`WORKSPACES`/`createWorkspaces()` untouched (depends on T001–T006).
- [X] T009 [US1] Add a `Repository:`/`Company:` line to `OfficeProjectPortalView.renderDetail()` (`src/features/city-view/scene/office/OfficeProjectPortalView.ts`), rendered only when `ownerCompany`/`localRepositoryLabel` are present on the selected project, placed after the existing `lastActionText` line without colliding with the bottom instruction row (depends on T002).
- [X] T010 [US1] Update/extend the existing registry-adjacent test file(s) — `OfficeProjectPortalController.repository-provider.test.ts` and any `OfficeProjectPortalRegistry.test.ts` — only if they assert against the removed `PROJECTS`/`REPOSITORY_MAPPINGS` consts directly rather than through `createProjectPortalState()`'s output; otherwise confirm they pass unmodified (SC-003).

**Checkpoint**: User Story 1 fully functional — Daily Proof's detail screen shows real company/repository metadata, and no existing GitHub-mapping-dependent test regresses.

---

## Phase 3: User Story 2 - Registry supports more than one project without code changes (P2)

**Goal**: `ProjectRegistryService.registerProject` is proven to extend the registry without touching portal/view/dashboard code.

**Independent Test**: Already covered by T005's duplicate-id and fourth-entry cases; this phase adds the cross-cutting proof that a registered project would flow through to `ProjectPortalProject` via the same adapter with zero special-casing.

### Implementation for User Story 2

- [X] T011 [US2] Add a test case (in `ProjectRegistryAdapters.test.ts` or a small new integration test) that seeds a `ProjectRegistryService` with the defaults, calls `registerProject` with a new entry with no `remoteRepository` (e.g. a "Restaurant Ordering System" project), and confirms `getAllProjects().map(toProjectPortalProject)` produces a valid fourth `ProjectPortalProject` with `enabled` derived correctly from its `lifecycleStatus`, proving SC-004 without any file outside `project-registry/` needing a change.

**Checkpoint**: SC-004 (extensibility without architectural change) is demonstrated by a passing test, not just asserted in prose.

---

## Phase 4: User Story 3 - Internal placeholders stay visually distinct (P3)

**Goal**: Portfolio and AI Lab show `Repository: Not connected` and a generic internal owner, never fabricated real-company data.

### Implementation for User Story 3

- [X] T012 [US3] Extend `OfficeProjectPortalRegistry`/view-level test coverage (wherever T010 lands) with a case rendering `portfolio`'s detail screen and asserting `Repository: Not connected` / `Company: AIverse Internal` — confirms the seed data and adapter degrade correctly for a project with no remote repository (depends on T003, T006, T009).

**Checkpoint**: All three user stories independently verified.

---

## Phase 5: Polish & Spec Kit Housekeeping

- [X] T013 [P] Update `.specify/feature.json` to point at `specs/059-project-registry-foundation` and update the `<!-- SPECKIT START/END -->` pointer block in `AGENTS.md` to reference this Spec's `plan.md`, per the pattern set by prior Specs (056/057/058).
- [X] T014a Run `npx vitest run` (full suite) and `npx tsc --noEmit` as focused validation during implementation and after each review fix cycle.
- [X] T014b Run the full validation gate (`npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`) exactly once, after Codex review reaches Approved with 0 open blocking findings.

---

## Dependencies & Execution Order

- **Phase 1 (Foundational)**: No dependencies. Blocks every other phase (the registry model/service must exist first).
- **Phase 2 (US1, P1 — MVP)**: Depends on Phase 1. Delivers the entire player-visible outcome.
- **Phase 3 (US2, P2)**: Depends on Phase 1 (registry service) and is independent of Phase 2's view change — could run in parallel with Phase 2 if staffed separately, but in practice both are done by the same implementer here.
- **Phase 4 (US3, P3)**: Depends on Phase 2 (needs `renderDetail`'s new line and the seed data to already exist) — effectively a test-only addition once T003/T006/T009 land.
- **Phase 5 (Polish)**: Depends on all prior phases being complete.

## Implementation Strategy

Single implementer (Claude CLI), sequential: Phase 1 → Phase 2 (MVP, independently verifiable) → Phase 3 → Phase 4 → Phase 5. No parallel team split — tasks marked `[P]` may still be done back-to-back by the same implementer since they touch disjoint files.
