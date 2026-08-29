# Research: Project Company Office Visual Environment

## Decision: Reuse Office Definition Metadata

**Rationale**: Office environment details are static visual context tied to an office definition. Keeping them in `OfficeDefinition` preserves the current pattern used by interior foundation zones and avoids new runtime state.

**Alternatives considered**: A separate scene controller or persisted environment state was rejected because the feature is visual-only and does not need lifecycle ownership beyond the visual layer.

## Decision: Render Details as Non-Interactive Scene Primitives

**Rationale**: The visual environment should not affect collision, pointer interaction, ADOS flows, or project portal state. Phaser primitives are already used by `OfficeVisualLayer` for foundation zones and interactive markers.

**Alternatives considered**: Tilemap edits were rejected because this follow-up only needs lightweight environment markers and should avoid asset churn.

## Decision: Add Defensive Reader and Validator

**Rationale**: Spec 132 established defensive reads and validation for office visual metadata. Reusing that pattern keeps configured definitions stable and catches malformed detail data early.

**Alternatives considered**: Direct reads from `office.visualEnvironment` were rejected because callers could mutate shared config objects.
