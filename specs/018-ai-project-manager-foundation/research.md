# Research

## Decision: Put project manager service in office AI folder
Rationale: The service orchestrates existing office AI, task, employee, and activity data. Keeping it under the office AI domain avoids premature global coupling.
Alternatives considered: A global project manager service was rejected until multiple features consume it.

## Decision: Service depends on AIService
Rationale: This preserves provider replaceability and prevents provider leakage into project-management logic.
Alternatives considered: Calling MockAIProvider directly was rejected by architecture rules.

## Decision: Store a single ProjectManagementSuggestion per project
Rationale: Phase 24 is hidden foundation work. A single keyed snapshot is enough and can later evolve into history if save/load or dashboards require it.