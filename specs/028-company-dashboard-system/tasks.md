# Tasks: Company Dashboard System

**Input**: Design documents from specs/028-company-dashboard-system/
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup and Existing System Review

**Purpose**: Confirm reusable systems and establish the dashboard feature foundation without implementation drift.

- [x] T001 Inspect Employee AI, Schedule, Projects, Company Progression, Office Layout, Conversation, Employee Insight, Employee Knowledge, work-session/activity, and existing portal/navigation code paths.
- [x] T002 Document reusable source selectors and implementation touchpoints in specs/028-company-dashboard-system/plan.md if the inspected architecture differs from the current plan.
- [x] T003 Create the dashboard feature folder and initial provider-neutral type files following existing project organization.

---

## Phase 2: Provider Contract Foundation

**Purpose**: Define the provider-neutral dashboard contract used by UI and providers.

- [x] T004 Add `CompanyDashboardSnapshot`, section, summary, risk, bottleneck, activity, and provider types.
- [x] T005 Add the `CompanyDashboardProvider` interface and Internal Simulation provider identifier.
- [x] T006 Add unit coverage for dashboard type helpers, empty section creation, and provider-neutral snapshot shape if existing test patterns support it.
- [x] T007 Verify no dashboard type introduces duplicate mutable employee, project, conversation, or workload state.

---

## Phase 3: Internal Simulation Provider

**Purpose**: Derive dashboard data from existing simulation systems only.

- [x] T008 Implement `InternalSimulationDashboardProvider` using existing Employee AI, Schedule, Projects, Company Progression, Office Layout, Conversation, Insight, Knowledge, and activity data where available.
- [x] T009 Add empty/unavailable states for missing employees, projects, occupancy, conversation, productivity, and risk data.
- [x] T010 Add deterministic company summary derivation from available provider data without external AI integration.
- [x] T011 Add tests for populated snapshots, partial data, empty data, and source freshness behavior.

---

## Phase 4: Read-Only Dashboard Vertical Slice

**Purpose**: Deliver the minimum playable Company Dashboard observation interface.

- [x] T012 Add the read-only Company Dashboard UI consuming only provider-neutral snapshot data.
- [x] T013 Add company health, employee summary, project summary, workload, and recent activity sections.
- [x] T014 Integrate the dashboard into an existing company/office access surface without adding management behavior.
- [x] T015 Add tests or assertions that the dashboard does not render assignment, editing, dialogue, project control, or direct employee-control affordances.

---

## Phase 5: Employee, Project, Workload, and Occupancy Detail

**Purpose**: Expand the dashboard's understanding layer while remaining read-only.

- [ ] T016 Add employee state, role, current work, mood where available, and AI state distribution sections.
- [ ] T017 Add project progress, active work, stalled work, and current project focus sections.
- [ ] T018 Add workload and office occupancy detail from existing systems where available.
- [ ] T019 Add tests for employee/project/workload/occupancy derivation and empty states.

---

## Phase 6: Context, Bottlenecks, Risks, and Summary

**Purpose**: Surface higher-level understanding from existing simulation signals.

- [ ] T020 Add current bottlenecks and current risks sections using derived provider observations.
- [ ] T021 Add recent company activity and recent conversations summary sections.
- [ ] T022 Add recent productivity and company summary presentation.
- [ ] T023 Add tests for bottleneck/risk/activity/conversation/productivity summary derivation and no-fabrication empty states.

---

## Phase 7: Future Connector Boundaries

**Purpose**: Preserve provider extensibility without implementing external integrations.

- [ ] T024 Add provider registry or selection boundary only if needed by existing architecture.
- [ ] T025 Ensure UI imports only provider-neutral contracts and never the Internal Simulation provider implementation.
- [ ] T026 Document future connector boundaries in code comments only where they clarify extension points.
- [ ] T027 Add tests or static checks for provider boundary behavior where practical.

---

## Phase 8: Validation and Manual Review

**Purpose**: Confirm the feature is playable, read-only, and ready for review.

- [ ] T028 Complete manual validation using specs/028-company-dashboard-system/quickstart.md.
- [ ] T029 Run `npm test`.
- [ ] T030 Run `npx tsc --noEmit`.
- [ ] T031 Run `npm run build`.
- [ ] T032 Run `git diff --check`.
- [ ] T033 Run `git diff --cached --check`.
- [ ] T034 Confirm no external provider implementation, credentials, network integration, management action, editing, dialogue, project control, or direct employee-control behavior was added.

## Dependencies

- Phase 1 must complete before implementation phases.
- Phase 2 must complete before providers or UI consume dashboard data.
- Phase 3 must complete before dashboard UI can show real simulation data.
- Phase 4 creates the first playable vertical slice.
- Phases 5 and 6 extend the observation and understanding layers.
- Phase 7 must complete before final validation to preserve connector extensibility.
- Phase 8 completes the feature.

## Parallel Example

After Phase 2, provider derivation tests and read-only UI component skeletons may be developed in parallel if they do not depend on each other's implementation details.
