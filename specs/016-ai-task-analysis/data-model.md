# Data Model

## TaskAnalysisDifficulty
- Low
- Medium
- High
- Critical

## TaskAnalysis
- taskId
- difficulty
- estimatedHours
- requiredSkills
- priority
- reasoning

## Portal State
- taskAnalyses: Record<string, TaskAnalysis>

## Rules
- Analysis is keyed by task id.
- Analysis is local only and hidden from UI in Phase 22.
- Mock analysis is deterministic from task title, description, priority, and estimated hours.