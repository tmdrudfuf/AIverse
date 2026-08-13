# Data Model: Spec 091 - Company Progression Reward Foundation

## CompanyProgressionReward

Represents a city world-state reward derived from one company progression world effect.

Fields:

- `rewardId`: stable identifier derived from the source effect id.
- `rewardType`: `company_progression_reward_granted`.
- `source`: `company_progression`.
- `effectId`: source progression world effect id.
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

- One reward is created per progression world effect.
- Rewards preserve effect order.
- Returned rewards are copied before crossing service or scene boundaries.

## WorldStateSnapshot.rewards

Represents the copied list of rewards visible to world-state consumers.

Validation rules:

- Defaults to an empty list when no rewards are provided.
- Included in semantic comparison.
- Copied on snapshot creation, status snapshots, and public snapshot reads.

## CityReturnPayload.rewards

Represents the copied office-to-city handoff list for progression rewards.

Validation rules:

- Omitted or empty when no progression world effects exist.
- Copied before being attached to the payload.
- Consumed by city world-state synchronization.
