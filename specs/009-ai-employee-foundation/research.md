# Research: AI Employee Foundation

Decision: keep employees under src/features/city-view/scene/office/employees because employees are an office workspace resource, not a task-owned model.
Decision: use a provider/service boundary matching repository and task foundations so future OpenAI, Codex CLI, Claude Code, Gemini, MCP, GitHub, schedules, and notifications can attach without changing view code.
Decision: Phase 15 assignment mutates only local portal state; no execution or external integration is in scope.