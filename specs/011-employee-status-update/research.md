# Research: Employee Status Update

Decision: keep runtime status in ProjectPortalState.employees because there is no persistence yet.
Decision: do not change MockEmployeeProvider; it remains the initial Idle source.
Decision: do not reload employees once loaded, because that would overwrite local Working/Idle runtime state.
Decision: scan loaded local task collections to decide whether a previous employee can return to Idle after reassignment.