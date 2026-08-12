# Data Model: Spec 088 - World State Synchronization Foundation

## WorldStateSyncStatus

Explicit lifecycle: `NotStarted | Syncing | Succeeded | Failed | Unavailable`.

## WorldStateSnapshot

- `worldId`: stable active world identifier.
- `activeWorldSpaceId`: stable active world-space identifier.
- `sceneKey`: rendered scene key for the active space.
- `bounds`: copied world-space rectangle.
- `buildings`: copied `WorldBuildingState[]`.
- `actors`: copied `WorldActorState[]`.
- `syncStatus`: synchronization lifecycle state.
- `lastSuccessfulSyncAt`: timestamp for the last successful semantic update.
- `errorSummary`: display-safe summary for failed or unavailable state.

## WorldBuildingState

- `id`: stable building identifier.
- `name`: display name.
- `type`: building category.
- `position`: copied world position.
- `size`: copied width and height.
- `active`: whether the building is active in the current product state.
- `destinationEnabled`: whether entry/destination behavior is enabled.
- `companyId`: optional future company/project association.
- `projectId`: optional future project association.

## WorldActorState

- `id`: stable actor identifier.
- `role`: actor category, initially `Founder`.
- `position`: copied world position.
- `facing`: optional facing direction.

## WorldStateSyncResult

- `snapshot`: latest copied snapshot.
- `changed`: whether semantic world facts changed.
- `status`: result status for the synchronization request.

## State Rules

- Snapshots are read-only projections and must be defensively copied.
- Invalid actor positions are omitted rather than failing the whole synchronization.
- `lastSuccessfulSyncAt` changes only when a successful synchronization creates a semantically different snapshot.
- `Syncing`, `Failed`, and `Unavailable` results preserve the previous successful timestamp when available.
