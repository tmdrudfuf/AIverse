# Runtime Verification: Multi-Project Company Operations

## Evidence Captured In This Runtime

- `CityProjectOperationsStatusService.test.ts` proves Project A can be in implementation while Project B is in review, using status lookup keyed only by each building's canonical project id.
- The same service tests prove a project with no run remains idle even when another project has a newer run.
- The same service tests prove blocked, complete, and disconnected states remain scoped to the correct project, and disconnected projects have mutation disabled.
- The browser-session restoration test persists two project-scoped statuses, reloads through the default browser session path, and verifies each company restores its own stage.
- `CityBuildingLayer.test.ts` proves the Phaser city building layer receives and renders distinct building-attached labels such as `IMPLEMENTATION`, `REVIEW`, `IDLE`, and `BLOCKED`.
- `WorldStateSynchronizer.test.ts` proves the city runtime snapshot exposes distinct per-building `operationStage`, `operationLabel`, `operationTone`, `projectId`, and `mutationDisabled` fields.

## Deferred ADOS Visual Evidence

Per the implementer handoff, this runtime did not run the full configured ADOS validation or e2e visual pipeline. ADOS should run the authoritative runtime visual verification after implementation, including a city screenshot with two distinct company statuses and city-to-office-to-city switching evidence.
