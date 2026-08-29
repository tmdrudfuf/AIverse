# Contract: Office Visual Environment

## Scope

The office scene accepts optional office visual environment metadata on an office definition and renders enabled details as non-interactive visuals.

## Expected Behavior

- Callers can read enabled environment details without receiving references to mutable office configuration.
- Offices without visual environment metadata return an empty enabled-detail list.
- Validation fails for missing ids, missing labels, duplicate ids, and non-positive bounds.
- Visual environment markers are created during office visual layer construction.
- Interactive object marker refresh destroys and recreates only interactive markers, leaving environment markers stable.
- Destroying the office visual layer destroys environment markers.

## Non-Goals

- No new persistence contract.
- No external API contract.
- No new ADOS runtime state.
- No movement, collision, or interaction changes.
