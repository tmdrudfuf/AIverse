# Research: External Project Repository Identity Edit Overlay

## Decision: Use Bounded Identity Choices

**Rationale**: The portal input contract currently exposes discrete button presses and directional movement, not arbitrary text input. Bounded choices allow a useful MVP without adding a broader text-entry subsystem.

**Alternatives considered**: Free-form owner/name/path editing was rejected for this feature because it would expand scope into keyboard text capture, validation, cursor editing, and mobile/input handling.

## Decision: Apply Edits Through Registry Helper

**Rationale**: The registry helper can update `projectRegistryEntries`, re-derive `projects`, and re-create repository mappings in one place, matching the Spec 125 draft helper pattern.

**Alternatives considered**: Mutating the derived portal project directly was rejected because browser persistence stores registry entries and derived rows would drift.

## Decision: Persist Through Existing Browser Session Service

**Rationale**: Spec 123 and Spec 125 already persist project registry entries through `BrowserOfficeSessionService`; repository identity edits are registry data and should use the same path.

**Alternatives considered**: Adding a new storage key was rejected because it would duplicate project registry state and complicate restore ordering.
