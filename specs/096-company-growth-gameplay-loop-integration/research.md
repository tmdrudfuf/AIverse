# Research: Company Growth Gameplay Loop Integration

## Decision: Centralize Existing Chain In A Pure Service

Use a new `CompanyGrowthGameplayLoopService` to compose existing trigger, world-effect, reward, and event-feed services.

**Rationale**: The generation rules already exist and are covered independently. A small composition service removes duplicated scene-level orchestration while preserving the current outputs.

**Alternatives Considered**:

- Keep inline scene generation: rejected because the office scene should not know the full growth output chain.
- Persist loop results in portal state: rejected for this feature because current progression triggers are already stored and the result can be derived safely on demand.

## Decision: Controller Accessor Returns Fresh Copies

Expose `getCompanyGrowthGameplayLoopResult()` from `OfficeProjectPortalController`.

**Rationale**: The controller is already the office-side source of progression triggers and active progression state. Returning a copied result keeps callers from mutating portal state or generated outputs.

## Decision: No Runtime Validation In This Handoff

Document validation commands but do not execute them.

**Rationale**: The ADOS handoff explicitly prohibits validation, review, publishing, merging, deployment, GitHub mutation, and primary-repository mutation in this runtime.
