# Contract: Fifth Employee Recruiting Action

## Player Input Contract

- **Context**: Operating terminal list view.
- **Selection**: Fifth employee recruiting row.
- **Activation**: Existing action/confirm input.

## Expected Outcomes

### Successful recruitment

- Adds one deterministic employee to the current roster.
- Sets latest recruiting result to `recruited`.
- Refreshes employee simulations and company dashboard/progression state.
- Leaves task collections, projects, work sessions, repositories, and runtime records unchanged.

### Already recruited

- Leaves the roster unchanged.
- Sets latest recruiting result to `already_recruited`.
- Keeps the action visible as complete.

### Blocked

- Leaves the roster unchanged.
- Sets latest recruiting result to `blocked`.
- Reports that the base roster is not ready.
