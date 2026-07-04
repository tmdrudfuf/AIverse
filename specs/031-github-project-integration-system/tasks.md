# Tasks: GitHub Project Integration System

**Input**: Design documents from specs/031-github-project-integration-system/
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Approval and Existing System Review

**Purpose**: Resolve security/product decisions and inspect existing systems before implementation.

- [X] T001 Obtain explicit approval for authentication approach in `specs/031-github-project-integration-system/spec.md`.
- [X] T002 Obtain explicit approval for credential/token handling boundary in `specs/031-github-project-integration-system/spec.md`.
- [X] T003 Obtain explicit approval for repository selection flow in `specs/031-github-project-integration-system/spec.md`.
- [X] T004 Obtain explicit approval for refresh/sync model in `specs/031-github-project-integration-system/spec.md`.
- [X] T005 Obtain explicit approval for public/private repository behavior in `specs/031-github-project-integration-system/spec.md`.
- [X] T006 Inspect existing Project Dashboard provider files in `src/features/city-view/scene/office/project-dashboard/`.
- [X] T007 Inspect existing GitHub repository files in `src/features/city-view/scene/office/github/`.
- [X] T008 Inspect portal/dashboard integration files in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`, `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`, and `src/features/city-view/scene/office/OfficeProjectPortalView.ts`.
- [X] T009 Update `specs/031-github-project-integration-system/plan.md` if approval decisions change source touchpoints or implementation strategy.

---

## Phase 2: Mapping and Source Status Foundation

**Purpose**: Add read-only mapping and source status models without touching GitHub transport.

- [X] T010 Add AIverse project repository mapping types in the approved source location.
- [X] T011 Add external source status types for fresh, stale, unavailable, unauthenticated, rate-limited, offline, and unknown states.
- [X] T012 Add tests for mapping validation, disabled mapping, invalid mapping, and source status labels.
- [X] T013 Confirm mapping state does not duplicate internal project, task, employee, schedule, progression, insight, knowledge, or work-session state.

---

## Phase 3: GitHub Read-Only Provider Vertical Slice

**Purpose**: Map approved read-only GitHub repository data into Project Dashboard provider-neutral snapshots.

- [X] T014 Add GitHub repository snapshot/read model types for the approved vertical slice.
- [X] T015 Add a GitHub project dashboard provider/adapter that maps repository snapshots into provider-neutral Project Dashboard data.
- [X] T016 Add tests for repository identity, owner/name, default branch, URL metadata, source status, sync freshness, empty issue/PR/commit/check summaries, and latest activity.
- [X] T017 Confirm the provider does not expose repository mutation methods.

---

## Phase 4: Project Dashboard Integration

**Purpose**: Surface GitHub read-only context through the existing Project Dashboard without making UI GitHub-specific.

- [X] T018 Integrate GitHub provider output through the existing Project Dashboard provider-neutral contract.
- [X] T019 Render GitHub source status and repository context using AIverse Office Terminal visual language only where provider-neutral data supports it.
- [X] T020 Add tests proving Project Dashboard UI does not import GitHub provider/API response types directly.
- [X] T021 Add tests for internal simulation fallback when GitHub data is absent, stale, unavailable, unauthorized, rate-limited, or offline.

---

## Phase 5: Read-Only and Security Regression Coverage

**Purpose**: Protect external and internal state from unintended mutation.

- [ ] T022 Add regression tests proving GitHub refresh/display does not mutate repository, project, task, employee, schedule, work-session, company influence, progression, Insight, or Knowledge state.
- [ ] T023 Add assertions that no issue creation, PR creation, branch creation, commit, merge, GitHub Actions modification, webhook setup, credential display, or autonomous AI coding controls appear.
- [ ] T024 Review imports and implementation paths for forbidden external mutation, credential storage, background sync, webhook, and speculative connector framework behavior.

---

## Phase 6: Validation and Manual Review

**Purpose**: Confirm the GitHub integration is read-only, provider-neutral, and safe.

- [ ] T025 Complete manual validation using `specs/031-github-project-integration-system/quickstart.md`.
- [ ] T026 Run `npm test`.
- [ ] T027 Run `npx tsc --noEmit`.
- [ ] T028 Run `npm run build`.
- [ ] T029 Run `git diff --check`.
- [ ] T030 Run `git diff --cached --check`.
- [ ] T031 Confirm internal simulation remains authoritative and unchanged by GitHub source reads.
- [ ] T032 Confirm no repository mutation or autonomous AI employee coding behavior was added.

## Dependencies

- Phase 1 approval tasks block implementation.
- Phase 2 must complete before provider work.
- Phase 3 must complete before dashboard integration.
- Phase 4 must complete before read-only/security regression review.
- Phase 5 must complete before final validation.
- Phase 6 completes the feature.

## Implementation Strategy

1. Stop for approval of product/security decisions.
2. Inspect existing Project Dashboard and GitHub foundation files.
3. Add mapping/source status foundation.
4. Add read-only GitHub provider mapping.
5. Integrate provider-neutral dashboard display.
6. Add read-only/security regression coverage.
7. Run full automated and manual validation.
