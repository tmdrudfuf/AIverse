# Contract: Company Growth Gameplay Loop

## Service API

```ts
type CompanyGrowthGameplayLoopInput = {
  triggers: ReadonlyArray<CompanyProgressionTrigger>;
};

type CompanyGrowthGameplayLoopResult = {
  triggers: CompanyProgressionTrigger[];
  effects: WorldEffectState[];
  rewards: WorldRewardState[];
  eventFeed: WorldEventFeedState[];
};

class CompanyGrowthGameplayLoopService {
  createLoopResult(input: CompanyGrowthGameplayLoopInput): CompanyGrowthGameplayLoopResult;
}
```

## Controller API

```ts
class OfficeProjectPortalController {
  getCompanyGrowthGameplayLoopResult(): CompanyGrowthGameplayLoopResult;
}
```

## Behavioral Contract

- Empty input returns empty result arrays.
- One trigger returns one matching effect, reward, and feed event.
- Multiple triggers preserve input order.
- Returned arrays and nested array fields are copied.
- Office scene exit handoff consumes the controller result and does not instantiate the effect/reward/feed services inline.
