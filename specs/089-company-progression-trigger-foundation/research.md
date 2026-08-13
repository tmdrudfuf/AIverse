# Research: Spec 089 - Company Progression Trigger Foundation

## Decision: Trigger Detection Belongs Beside Progression

`CompanyProgressionService` already owns levels, stages, layout metadata, unlocked zones, and evaluated milestones. A separate trigger service colocated in `progression/` can consume its snapshots without changing threshold rules or mixing trigger state into the pure progression resolver.

## Decision: In-Memory Latest Trigger List

The feature is a foundation. Persisting historical triggers, showing notifications, or adding knowledge entries would create product scope beyond the current handoff. The portal can retain only the latest computed triggers so future features have a stable local state field to consume.

## Decision: Upward Transitions Only

Spec 057 documents that current progression can regress because the service is stateless. This trigger foundation should avoid firing "level lost" events or repeated level-up events. It emits only when the current level is greater than the previous level.

## Decision: Multi-Level Jumps Emit Ordered Records

When a large input change crosses several thresholds, returning one trigger per reached level preserves context for future reward or notification consumers.
