# Data Model

## EmployeeSimulationState
- idle
- assigned
- working
- unavailable

## EmployeeSimulationSnapshot
- employeeId
- currentState
- currentTaskId optional
- currentProjectId optional
- lastStateChangeAt
- displayLabel

## Portal State
- employeeSimulations: Record<string, EmployeeSimulationSnapshot>

## Rules
- Snapshot state is derived from Employee, ProjectTask, and WorkSession data.
- Employee data remains the source of truth.
- Done tasks do not count as active assignments.
- Running work sessions imply working state.