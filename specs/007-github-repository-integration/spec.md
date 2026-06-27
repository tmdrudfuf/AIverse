# Feature Specification: GitHub Repository Integration Foundation

## User Story
As a Founder reviewing the Daily Proof workspace, I can open the Repository section and see a safe mock GitHub repository summary so future real GitHub integration has a clear UI and data boundary.

## Acceptance Criteria
- Daily Proof Repository section is enabled and opens a repository-detail view in the same portal overlay.
- Repository-detail shows loading and then deterministic mock repository summary data.
- Repository data is loaded through a provider/service boundary, not directly in Phaser view or scene code.
- Unsupported projects produce a not connected or error state without real network calls.
- Firebase, Analytics, Tasks, and AI Agents remain disabled.
- Esc returns repository-detail to workspace, then existing back behavior continues.
- No real GitHub API route, token, env var, network call, Firebase integration, AI agent, React overlay, or complex dashboard is added.