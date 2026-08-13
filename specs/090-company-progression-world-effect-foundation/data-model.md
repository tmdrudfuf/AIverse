# Data Model: Spec 090 - Company Progression World Effect Foundation

## CompanyProgressionWorldEffect

Represents a city world-state effect derived from one company progression level-up trigger.

Fields:

- `effectId`: stable identifier derived from the source trigger id.
- `effectType`: `company_progression_level_reached`.
- `source`: `company_progression`.
- `triggerId`: source progression trigger id.
- `fromLevel`: previous company level.
- `toLevel`: reached company level.
- `companyStage`: reached company stage.
- `layoutId`: reached office layout id.
- `floorCount`: reached office floor count.
- `maxEmployees`: reached employee capacity.
- `unlockedOfficeZones`: copied list of unlocked office zone identifiers.
- `milestoneIds`: copied list of reached milestone identifiers.

Validation rules:

- One effect is created per trigger.
- Effects preserve trigger order.
- Returned effects are copied before crossing service or scene boundaries.

## WorldStateSnapshot.effects

Represents the copied list of world effects visible to world-state consumers.

Validation rules:

- Defaults to an empty list when no effects are provided.
- Included in semantic comparison.
- Copied on snapshot creation, status snapshots, and public snapshot reads.

## CityReturnPayload.worldEffects

Represents the copied office-to-city handoff list for progression effects.

Validation rules:

- Omitted or empty when no progression triggers exist.
- Copied before being attached to the payload.
- Consumed by city world-state synchronization.
