# Research: Spec 087

## Decision: Derive history from existing promotion collections

**Rationale**: Review Promotion and Review Promotion Result records are already durable per-project audit collections. A derived timeline avoids duplicating state and keeps old records immutable.

**Alternatives considered**: Persist a separate timeline collection. Rejected because it would need synchronization and could drift from the authoritative promotion/result records.

## Decision: Mark current using the existing current-promotion resolver

**Rationale**: The dashboard and Promote action already share current promotion resolution through `findCurrentReviewPromotion`. Reusing that result prevents a historical promotion from being displayed as current.

**Alternatives considered**: Pick the latest promotion by array order. Rejected because earlier specs already fixed array-order drift for current promotion selection.

## Decision: Render a compact dashboard row first

**Rationale**: The feature is a foundation. A concise summary gives operators visibility without creating a new navigation mode or expanding the portal layout.

**Alternatives considered**: Add a dedicated timeline screen. Rejected for this foundation because it increases UI scope and layout risk.
