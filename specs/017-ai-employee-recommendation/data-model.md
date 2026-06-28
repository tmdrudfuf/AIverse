# Data Model

## EmployeeRecommendationResult
- taskId
- recommendedEmployeeId optional
- confidence
- reasons
- alternativeEmployeeIds

## Portal State
- employeeRecommendations: Record<string, EmployeeRecommendationResult>

## Rules
- Recommendation is keyed by task id.
- Recommendation is local only and hidden from UI in Phase 23.
- Mock recommendation is deterministic from task text, employee role, and employee ordering.
- Empty employee lists produce no recommendedEmployeeId, confidence 0, and no alternatives.