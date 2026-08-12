# Data Model: Spec 087

## Promotion Timeline Event

- **Purpose**: Read-only audit item for one promotion-backed or result-only promotion-history event.
- **Fields**: event id, project id, reviewer runtime id, optional promotion id, status, reason codes, occurred-at timestamp, current flag, historical flag, safety flags.
- **Validation rules**: Current may be true only when the event references the current Review Promotion. Historical is true for promotion-backed events that are not current. Result-only blocked events have no promotion id.

## Promotion Timeline

- **Purpose**: Deterministic, per-project read model for dashboard display and future timeline expansion.
- **Fields**: project id, events, event count, optional current promotion id, optional generated-at timestamp, rules version.
- **Validation rules**: Events are sorted deterministically by timestamp and id. Missing source collections produce an empty timeline.

## State Transitions

```text
No promotion records/results -> empty timeline
Historical promotion exists -> historical event
Current Approved promotion recorded -> current granted event
Repeated current Promote -> current already-promoted event, same promotion count
Blocked Promote result -> blocked result-only event
```
