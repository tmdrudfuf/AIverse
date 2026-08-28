# Data Model: Project Company Office Interior Foundation

## Office Interior Foundation

Represents optional interior context for an office.

Fields:

- `zones`: ordered list of interior zones to render.

Validation rules:

- Missing foundation metadata is valid.
- Zones are rendered only when enabled.
- Zone identifiers are stable within an office.

## Interior Zone

Represents one visible area inside a company office.

Fields:

- `id`: stable zone identifier.
- `label`: concise display label.
- `role`: purpose category such as reception, founder desk, workspace, or employee desk.
- `bounds`: rectangular world area.
- `accentColor`: visual accent color.
- `enabled`: whether the zone should be rendered.
- `markerId`: optional source marker or placement reference.

Validation rules:

- `id`, `label`, `role`, `bounds`, and `accentColor` are required.
- Bounds must have positive width and height.
- Consumers receive defensive copies of zone data.
