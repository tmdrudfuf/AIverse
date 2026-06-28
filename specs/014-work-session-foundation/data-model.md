# Data Model

## WorkSessionStatus
- queued
- running
- finished
- failed
- cancelled

## WorkSessionProviderKind
- placeholder
- openai
- codex-cli
- claude-code
- gemini
- mcp
- github-actions

## WorkSession
- id
- taskId
- projectId
- employeeId
- employeeName
- provider
- status
- startedAt
- finishedAt optional
- summary optional
- resultType optional
- activityIds optional

## CreateWorkSessionInput
- taskId
- projectId
- employeeId
- employeeName
- startedAt optional

## Portal State
- workSessions: Record<string, WorkSession[]> keyed by task id
- selectedWorkSessionId optional