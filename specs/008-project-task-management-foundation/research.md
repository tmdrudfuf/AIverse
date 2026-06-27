# Research: Project Task Management Foundation

Decision: keep tasks under src/features/city-view/scene/office/tasks because tasks are a workspace domain concept, not a GitHub-specific concept.
Decision: use a provider/service boundary matching the repository foundation so future save/load, GitHub Issues, and AI employee assignment can replace the provider without changing view code.
Decision: keep data static and local for Phase 14; no network calls or real integrations are in scope.