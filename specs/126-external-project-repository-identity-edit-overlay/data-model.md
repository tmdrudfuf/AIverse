# Data Model: External Project Repository Identity Edit Overlay

## External Project Draft

Existing planned project created by Spec 125.

| Field | Required | Notes |
|-------|----------|-------|
| `id` | Yes | Must remain the stable external draft id. |
| `localRepository` | Yes | Updated to connected or not connected based on chosen identity. |
| `repositoryIdentity` | Yes | Updated from the selected identity choice. |
| `localRepositoryBinding` | No | Present only for local configured choices with usable local worktree metadata. |
| `remoteRepository` | No | Present only for GitHub-style choices. |

## Repository Identity Choice

Bounded option shown in the edit overlay.

| Field | Required | Notes |
|-------|----------|-------|
| `id` | Yes | Stable choice id for selection. |
| `label` | Yes | Short display text. |
| `summary` | Yes | Operator-facing summary. |
| `localRepositoryLabel` | Yes | Label applied to the draft. |
| `repositoryIdentity` | Yes | Provider-neutral repository identity metadata. |
| `localRepositoryBinding` | No | Optional local binding metadata. |
| `remoteRepository` | No | Optional GitHub-style mapping metadata. |

## State Transitions

- Unknown draft identity -> Overlay open: no data mutation.
- Overlay open -> Cancelled: no data mutation; return to project dashboard.
- Overlay open -> Applied local configured identity: draft local repository becomes connected, repository identity becomes configured, derived project row updates, browser session is saved.
- Overlay open -> Applied unknown identity: draft local repository becomes not connected, repository identity becomes local unknown, remote mapping remains absent, browser session is saved.
