# Data Model: Daily Proof Portal Browser Smoke Validation

## Daily Proof Project

- **Purpose**: The configured Project Portal entry used as the smoke target.
- **Key fields**: project id, display name, repository identity, local repository binding, dashboard selection state.
- **Validation rules**: Must be available from a fresh portal state and selectable without external services.

## Portal Smoke Result

- **Purpose**: The observed local state after smoke navigation.
- **Key fields**: portal open state, selected view mode, selected project id, selected dashboard project id, downstream runtime collection presence.
- **Validation rules**: Dashboard smoke passes only when Daily Proof is selected and downstream runtimes remain absent.

## Runtime-Start Record

- **Purpose**: The local readiness marker created before any agent or validation runtime begins.
- **Key fields**: project id, execution plan id, runtime start id, task id, branch, specification path.
- **Validation rules**: Runtime-start smoke passes only when exactly one Daily Proof runtime-start record exists and no downstream runtime collection starts.
