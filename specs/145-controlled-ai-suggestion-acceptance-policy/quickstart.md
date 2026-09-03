# Quickstart: Controlled AI Suggestion Acceptance Policy

## Runtime Scenario

1. Open Project A planning.
2. Generate suggestions with A1 high and A2 low.
3. Enable AI suggestion auto-accept for Project A with allowed priority `high`.
4. Evaluate suggestions.
5. Confirm A1 creates exactly one Project A backlog task with automatic provenance.
6. Confirm A2 remains proposed with a priority skip reason.
7. Re-evaluate and confirm no duplicate task is created.
8. Switch to Project B with auto-accept off and an urgent suggestion.
9. Confirm Project B suggestion remains proposed.
10. Reload and confirm Project A policy/provenance and Project B off state persist.
11. Confirm manual accept and reject still work.

## Local Checks

ADOS runs the authoritative validation pipeline after implementation. Targeted implementation checks should cover the policy service, browser session persistence, controller interaction, and portfolio read-only summary.
