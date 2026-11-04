# Feature Specification: GitHub Write Integration

**Feature Branch**: `codex/150-github-write-integration`

**Created**: 2026-11-04

**Status**: Draft

**Input**: User description: "Spec 149 proved real execution works end to end: an approved run genuinely modifies the operator's own real registered project on disk. That is not yet a 'maintenance update' in any useful sense until it can actually reach GitHub. Build the next piece: let the operator push the real local changes a real run produced to a new branch on that project's real GitHub remote and open a pull request, with one explicit action — never automatically, and never going further than opening the PR. New-project design/creation is explicitly deferred to a later feature."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Publish a Real Maintenance Change (Priority: P1)

As the operator, after a real run has made local changes to one of my own registered real projects, I can take one explicit action to get those changes onto a new branch on that project's real GitHub remote with a pull request open, so the maintenance update actually reaches GitHub instead of staying stuck on my own machine.

**Why this priority**: This is the entire point of the feature — Spec 149 already proves local execution works; without this, no maintenance update is actually delivered anywhere.

**Independent Test**: With GitHub write access explicitly authorized for a registered real project that has local, uncommitted or committed-but-unpushed changes from a real run, trigger the publish action and confirm a new branch exists on the real GitHub remote with those exact changes, and a real pull request is open against the project's default branch.

**Acceptance Scenarios**:

1. **Given** a registered real project has local changes from a completed real run, and GitHub write access is authorized for it, **When** the operator triggers the publish action, **Then** a new branch is created, the changes are committed (if not already) and pushed to the project's real GitHub remote, and a real pull request is opened against the project's default branch.
2. **Given** the publish action has completed successfully, **When** the operator looks at the result, **Then** they see the real branch name and the real pull request URL.
3. **Given** a project has no local changes to publish, **When** the operator triggers the publish action, **Then** the system refuses with an honest "nothing to publish" status rather than creating an empty branch or PR.

---

### User Story 2 - See What Will Be Published Before It Happens (Priority: P1)

As the operator, before I trigger the publish action, I can see which files changed and what the commit message will be, so I am never surprised by what gets pushed to a real GitHub remote under my name.

**Why this priority**: Pushing to a real remote and opening a real, visible pull request is a consequential, externally-visible action; the operator must be able to make an informed decision before triggering it, not discover the content after the fact.

**Independent Test**: With local changes present, open the publish view before triggering it and confirm the listed changed files and planned commit message match what actually gets pushed once triggered.

**Acceptance Scenarios**:

1. **Given** local changes exist for a registered real project, **When** the operator opens the publish view, **Then** the changed file list and the planned commit message are shown before any push happens.
2. **Given** the operator has reviewed the preview, **When** they decline to proceed, **Then** nothing is pushed and no pull request is opened.

---

### User Story 3 - Honest Refusal When Publishing Isn't Possible (Priority: P2)

As the operator, when a project has no real GitHub remote configured, or I haven't authorized GitHub write access for it yet, or the push/pull-request creation fails for any reason, I see a clear, honest reason rather than a silent failure, a hang, or a misleading success.

**Why this priority**: A consequential, externally-visible action must never fail silently or ambiguously; the operator needs to know exactly why nothing happened so they can fix it.

**Independent Test**: Attempt to publish for a project with no configured GitHub remote, and separately with GitHub write access not yet authorized, and confirm each attempt is refused with a distinct, accurate reason and makes no partial change (no branch created, no commit pushed) on either GitHub or the local project.

**Acceptance Scenarios**:

1. **Given** a registered project has no real GitHub remote configured, **When** the operator triggers the publish action, **Then** the system refuses with a "no GitHub remote" reason and performs no push.
2. **Given** GitHub write access has not been explicitly authorized on this machine, **When** the operator triggers the publish action for any project, **Then** the system refuses with a "GitHub write access not authorized" reason and performs no push.
3. **Given** authorization is valid but the actual push or pull-request creation fails (e.g. the remote branch already exists, or GitHub is unreachable), **When** this happens, **Then** the system reports the real failure reason, and any branch that was partially pushed before the failure is clearly reported as such rather than implied to be a complete, open pull request.

### Edge Cases

- What happens if the operator triggers the publish action twice in quick succession for the same project?
- What happens if the local project's current branch already has an upstream tracking branch with the same generated name from a previous publish?
- What happens if the project's default branch on GitHub has moved since the local change was made (i.e., the local branch is now behind)?
- What happens if the configured GitHub write credential belongs to an account without push access to that specific repository?
- What happens if the local project directory is not actually a git repository, or has no commits at all?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let the operator trigger, for a registered real project with local changes, a single explicit action that results in a new branch, a commit of those changes, a push of that branch to the project's real GitHub remote, and an open pull request against the project's default branch.
- **FR-002**: The system MUST NOT push to GitHub or open a pull request except in direct, explicit response to that one operator-triggered action — never automatically, and never as a side effect of a real execution run completing.
- **FR-003**: The system MUST NEVER merge a pull request, mark one ready beyond opening it, approve one, or delete a branch — those remain exclusively actions the operator takes themselves, directly on GitHub, exactly as already established for real execution in general.
- **FR-004**: The system MUST require the operator to explicitly authorize GitHub write access on this machine before any push or pull-request creation can occur, as a distinct, deliberate action separate from any existing read-only GitHub access.
- **FR-005**: The system MUST show the operator the changed files and the planned commit message before the publish action is triggered, so the decision to proceed is informed.
- **FR-006**: The system MUST refuse cleanly, with a distinct and accurate reason, when: there is nothing to publish, the project has no configured real GitHub remote, GitHub write access is not authorized, or the push/pull-request creation fails for any reason — never a silent failure, a hang, or a false success.
- **FR-007**: The system MUST record what was published (branch name, commit, pull request URL, or the refusal reason) in a durable, operator-inspectable audit trail, mirroring the existing real-run audit convention.
- **FR-008**: The system MUST NOT allow two publish attempts to run concurrently for the same project.

### Key Entities *(include if feature involves data)*

- **GitHub Write Authorization**: Whether GitHub write access (e.g. a personal access token) is configured on this machine; scoped to the machine, not to any single project, mirroring Spec 149's real-execution enablement.
- **Publish Attempt**: One attempt to push a branch and open a pull request for a registered real project; has a terminal outcome (published, refused, failed) and carries the branch name / commit / pull request URL or the refusal/failure reason.
- **Publish Audit Record**: The durable, inspectable record of one Publish Attempt's outcome, kept regardless of outcome.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a machine where GitHub write access has been authorized, 100% of publish attempts for a registered real project with real local changes result in a real branch, a real commit, and a real open pull request on that project's actual GitHub remote.
- **SC-002**: 100% of publish attempts made without GitHub write access authorized are refused, and zero of them push anything to GitHub.
- **SC-003**: 100% of publish attempts never result in a merge, an approval, a ready-for-review transition, or a branch deletion performed by the system itself.
- **SC-004**: Every publish attempt, successful or not, has a corresponding audit record the operator can inspect afterward.

## Assumptions

- This feature builds directly on Spec 149's real execution bridge: it assumes a real run has already produced real local changes (committed or not) in a registered real project; it is responsible only for getting those changes from the local machine onto GitHub as a branch and pull request, not for making the changes themselves.
- The operator runs this on their own machine against their own real GitHub-hosted projects; this feature does not need to support multiple untrusted end users or organizations sharing one deployment.
- New-project design/creation (designing and scaffolding a project that does not yet exist) is explicitly out of scope for this feature and will be specified separately.
- GitHub write authorization is a personal access token (or equivalent) the operator supplies themselves; this feature is responsible for using it safely and reporting honestly when it is missing or invalid, not for implementing a full OAuth application flow.
- The target repository's default branch and remote are whatever the registered project's own local git configuration already reports (`origin`'s default branch); this feature does not re-derive or guess repository identity beyond what the existing project registration already established.
