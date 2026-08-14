# Data Model: Company Growth Gameplay Loop Integration

## CompanyGrowthGameplayLoopResult

Represents the derived gameplay outputs for the current company progression change.

Fields:

- `triggers`: copied `CompanyProgressionTrigger[]`
- `effects`: copied `WorldEffectState[]`
- `rewards`: copied `WorldRewardState[]`
- `eventFeed`: copied `WorldEventFeedState[]`

Rules:

- Effects derive from `triggers`.
- Rewards derive from `effects`.
- Event feed entries derive from `rewards`.
- Every returned array is a fresh copy.
- Empty trigger input returns empty arrays.

## CompanyGrowthGameplayLoopInput

Fields:

- `triggers`: readonly list of current company progression triggers

Rules:

- Input triggers must not be mutated.
- Trigger ordering is preserved by the generated output chain.
