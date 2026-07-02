# Data Model

## TaskAnalysisResult
- taskId
- summary
- suggestedPriority
- suggestedFocusAreas
- riskNotes

## EmployeeRecommendationResult
- taskId
- employeeId optional
- employeeName optional
- reason
- confidence

## WorkSessionSummaryResult
- sessionId
- summary
- status

## AIActivityMessageInput
- type
- taskTitle optional
- employeeName optional
- workSessionId optional
- status optional

## AIActivityMessageResult
- message

## Relationships
- AIProvider consumes existing ProjectTask, Employee, and WorkSession objects.
- AIService exposes the same operations without exposing provider implementation details to controllers.