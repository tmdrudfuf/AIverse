# Feature Specification: GitHub Project Integration System

**Feature Branch**: `031-github-project-integration-system`

**Created**: 2026-07-04

**Status**: Approved for implementation with public read-only defaults

**Input**: User description: "Connect real GitHub repositories, including my personal projects, to AIverse projects through the provider-neutral Project Dashboard architecture."

## User Scenarios & Testing

### User Story 1 - Link an AIverse Project to a GitHub Repository (Priority: P1)

As the player, I can associate one AIverse project with one real GitHub repository so the Project Dashboard can observe real project context without replacing internal simulation state.

**Why this priority**: Repository linking is the minimum read-only bridge between real personal software projects and AIverse projects.

**Independent Test**: Configure a repository reference for one AIverse project, open its Project Dashboard, and verify the dashboard identifies the linked repository without offering mutation controls.

**Acceptance Scenarios**:

1. **Given** an AIverse project has no external source, **When** the player views the project source context, **Then** the dashboard shows internal simulation as the active source and no GitHub data is fabricated.
2. **Given** an AIverse project has a GitHub repository reference, **When** the Project Dashboard opens, **Then** the dashboard shows repository identity, owner/name, URL metadata, provider status, and sync freshness where available.
3. **Given** a GitHub repository reference exists, **When** the dashboard renders, **Then** internal simulation remains a valid source and is not overwritten by GitHub source data.

---

### User Story 2 - Observe Read-Only Repository Signals (Priority: P1)

As the player, I can see read-only GitHub repository summaries mapped into the Project Dashboard so I understand external project activity from inside AIverse.

**Why this priority**: The first integration slice must provide useful observation without enabling repository mutation.

**Independent Test**: Open a linked project and verify repository metadata, branch context, open issue summary, pull request summary, recent commit summary, activity timestamp, and check/build summary appear only when source data is available.

**Acceptance Scenarios**:

1. **Given** GitHub source data is available, **When** the Project Dashboard opens, **Then** repository identity, default branch, repository URL metadata, open issue count, open pull request count, recent commit summary, latest activity timestamp, and check/build status summary are displayed where available.
2. **Given** a GitHub field is unavailable, **When** the dashboard renders, **Then** it shows a clear unavailable or stale state without inventing repository data.
3. **Given** GitHub data is visible, **When** the player reviews all controls, **Then** no issue creation, PR creation, branch creation, commit, merge, GitHub Actions modification, webhook, or repository mutation control appears.

---

### User Story 3 - Preserve Provider-Neutral Project Dashboard Architecture (Priority: P2)

As a developer, I can map GitHub data into the existing Project Dashboard provider contract without making the UI depend directly on GitHub.

**Why this priority**: GitHub is the first real external source, but future sources must remain possible without duplicating UI or simulation state.

**Independent Test**: Review the contracts and implementation plan to confirm GitHub-specific transport/auth/API logic is behind a provider or adapter boundary and the Project Dashboard UI consumes provider-neutral data.

**Acceptance Scenarios**:

1. **Given** the Project Dashboard UI is inspected, **When** GitHub integration is complete, **Then** the UI depends on provider-neutral project detail data rather than GitHub API shapes.
2. **Given** internal simulation and GitHub data both exist, **When** project detail data is derived, **Then** source-of-truth ownership is explicit and duplicated project/task/employee state is avoided.
3. **Given** future connectors are considered, **When** this feature is complete, **Then** no generic multi-provider framework beyond the GitHub vertical slice has been introduced.

---

### User Story 4 - Handle Source Failures and Stale Data Safely (Priority: P2)

As the player, I can understand whether GitHub data is fresh, stale, unavailable, unauthenticated, rate-limited, or offline so I do not mistake old external data for current project state.

**Why this priority**: External data can fail independently of the AIverse simulation and must be trustworthy.

**Independent Test**: Simulate unavailable, stale, unauthorized, rate-limited, and partial GitHub source states and verify the Project Dashboard displays explicit source status without breaking internal simulation display.

**Acceptance Scenarios**:

1. **Given** GitHub data cannot be refreshed, **When** the Project Dashboard opens, **Then** stale or unavailable status is shown and internal simulation data remains visible.
2. **Given** GitHub access is unauthorized or not configured, **When** the linked project is viewed, **Then** the dashboard shows a safe unauthenticated state and no token or secret details.
3. **Given** rate limits or network failures occur, **When** repository data is unavailable, **Then** the dashboard shows a non-blocking source status and does not retry in a way that blocks office simulation.

### Edge Cases

- No repository linked: Project Dashboard remains internal-simulation only.
- Linked repository is public and accessible: read-only metadata can be shown without private data assumptions.
- Linked repository is private: access requires an approved authentication and credential handling decision before implementation.
- Invalid owner/name or repository URL: dashboard shows unavailable source state.
- Repository exists but has no issues, pull requests, or recent commits: sections show explicit empty states.
- GitHub API is rate-limited: dashboard shows rate-limited source status and stale data behavior if cached data exists.
- GitHub is offline/unreachable: dashboard shows unavailable source status without blocking simulation.
- Token expires or is revoked: dashboard shows unauthenticated state and never displays secrets.
- Multiple AIverse projects point to the same repository: mapping remains explicit per AIverse project.
- One AIverse project has internal and external source data: source ownership and freshness are displayed separately.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST allow one AIverse project to reference one GitHub repository as an external read-only source.
- **FR-002**: The system MUST preserve internal simulation as a valid Project Dashboard source when GitHub data is absent, stale, or unavailable.
- **FR-003**: GitHub repository data MUST map into the existing provider-neutral Project Dashboard structure rather than requiring GitHub-specific UI rendering.
- **FR-004**: The Project Dashboard MUST be able to show repository identity, owner/name, default branch, repository URL metadata, provider status, sync freshness, and source freshness when available.
- **FR-005**: The Project Dashboard SHOULD show open issue summary, open pull request summary, recent commit summary, latest activity timestamp, and check/build status summary when available.
- **FR-006**: GitHub source data MUST be distinguished from internal simulation state and MUST NOT overwrite project, task, employee, schedule, work-session, company influence, or progression state.
- **FR-007**: The first vertical slice MUST be read-only.
- **FR-008**: The feature MUST NOT create issues, create pull requests, create branches, commit code, merge pull requests, modify GitHub Actions, edit repository settings, write webhooks, or mutate repositories.
- **FR-009**: The feature MUST NOT add AI employee code modification, autonomous commits, autonomous branch creation, autonomous PR creation, or autonomous merge behavior.
- **FR-010**: GitHub-specific transport, authentication, and API handling MUST be isolated behind a provider or adapter boundary.
- **FR-011**: The UI MUST NOT depend directly on GitHub API response shapes.
- **FR-012**: The feature MUST define explicit source-of-truth boundaries for internal simulation data, GitHub source data, and AIverse project-to-repository mapping data.
- **FR-013**: The feature MUST define behavior for public repositories, private repositories, unauthorized access, stale data, offline failure, and rate limiting.
- **FR-014**: The feature MUST NOT introduce Firebase, Notion, Linear, Jira, Figma, or generic connector frameworks.
- **FR-015**: The feature MUST use the AIverse Office Terminal visual language for computer-opened repository context where player-facing UI is required.
- **FR-016**: Authentication approach, credential/token handling, repository selection flow, refresh/sync model, and public/private repository behavior MUST receive explicit user approval before implementation.

### Non-Goals

- No repository mutation.
- No issue creation.
- No PR creation.
- No branch creation.
- No commits.
- No merges.
- No GitHub Actions modification.
- No webhook infrastructure unless a later approved Spec requires it.
- No background sync architecture unless the first implementation plan proves it is required and receives approval.
- No credential storage implementation without explicit security design approval.
- No AI employee autonomous coding behavior.
- No Firebase, Notion, Linear, Jira, Figma, or speculative multi-provider framework.

### Product and Security Decisions Requiring Approval

These decisions have multiple reasonable directions and MUST be approved before implementation. The user approved the recommended first-slice defaults on 2026-07-04.

1. **Authentication approach**:
   - Option A: Public repositories only for the first vertical slice.
   - Option B: User-provided personal access token for private repositories.
   - Option C: GitHub OAuth/App flow.
   - Approved direction: Option A first, because it avoids credential storage and still validates provider-neutral mapping.
2. **Credential/token handling boundary**:
   - Option A: No credentials stored; public-only source data.
   - Option B: Session-only token entry.
   - Option C: Local encrypted token persistence.
   - Approved direction: Option A for first slice; defer storage until a dedicated security design exists.
3. **Repository selection flow**:
   - Option A: Developer-configured mapping in local project state/config.
   - Option B: Player-entered owner/name in the Office Terminal UI.
   - Option C: Authenticated repository picker.
   - Approved direction: Option A for first slice to keep UI and security surface small.
4. **Refresh/sync model**:
   - Option A: Manual refresh/read on dashboard open only.
   - Option B: timed foreground refresh while dashboard is open.
   - Option C: background sync.
   - Approved direction: Option A for first slice to avoid background architecture.
5. **Public vs private repository behavior**:
   - Option A: public-only first.
   - Option B: private repos with explicit token flow.
   - Approved direction: public-only first; private support requires approved auth/token handling.

### Key Entities

- **AIverse Project Repository Mapping**: The local association between an AIverse project and an external GitHub repository reference.
- **GitHub Repository Reference**: Owner/name, repository URL metadata, visibility expectation, and source identity.
- **GitHub Project Provider**: Read-only provider or adapter that maps GitHub source data into the provider-neutral Project Dashboard contract.
- **GitHub Repository Snapshot**: Read-only repository metadata and summary signals at a known freshness timestamp.
- **External Source Status**: Provider status, freshness, stale/unavailable/unauthorized/rate-limited/offline state.
- **Repository Activity Summary**: Recent commit, issue, pull request, check/build, and latest activity signals where available.
- **Source Ownership Boundary**: Rules describing which fields come from internal simulation, GitHub, or mapping metadata.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A linked AIverse project can display repository identity and source status in the Project Dashboard in under 30 seconds from opening the dashboard.
- **SC-002**: GitHub data appears through provider-neutral Project Dashboard fields without introducing GitHub-specific UI coupling.
- **SC-003**: The first vertical slice exposes zero repository mutation affordances.
- **SC-004**: Internal simulation data remains visible and unchanged when GitHub data is absent, stale, unauthorized, rate-limited, or offline.
- **SC-005**: Authentication, credential handling, repository selection, refresh model, and public/private behavior are explicitly approved before implementation begins.

## Assumptions

- Project Dashboard System is merged and provides the provider-neutral project detail foundation.
- AIverse Office Terminal visual language is approved for computer-opened interfaces.
- The first GitHub slice should prove read-only observation before any influence or autonomous work features.
- Private repository support is security-sensitive and should not be implemented until approved.
