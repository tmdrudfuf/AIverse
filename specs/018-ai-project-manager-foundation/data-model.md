# Data Model

## ProjectHealthStatus
- healthy
- watch
- at_risk

## ProjectRiskSeverity
- low
- medium
- high

## ProjectHealthSummary
- projectId
- status
- summary
- totalTasks
- activeTasks
- completedTasks
- activeEmployees
- recentActivityCount

## ProjectRisk
- id
- projectId
- severity
- message
- relatedTaskIds

## NextActionRecommendation
- projectId
- action
- reason
- taskId optional
- employeeId optional

## ProjectManagementSuggestion
- projectId
- healthSummary
- risks
- nextAction
- createdAt

## Portal State
- projectManagementSuggestions: Record<string, ProjectManagementSuggestion>