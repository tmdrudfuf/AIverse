# Data Model: Project Company Office Visual Environment

## Office Visual Environment

Represents optional visual atmosphere metadata for a company office.

### Fields

- `details`: Ordered list of environment details.

### Validation Rules

- Missing visual environment metadata is valid.
- Detail ids must be unique within one office environment.
- Disabled details remain configured but are not exposed by enabled-detail readers or rendered.

## Environment Detail

Represents one non-interactive visual element in the office scene.

### Fields

- `id`: Stable unique identifier.
- `kind`: Purpose category such as brand sign, plant, lighting, collaboration board, or storage.
- `label`: Concise display name.
- `bounds`: Rectangular placement in office world coordinates.
- `accentColor`: Visual accent color.
- `enabled`: Whether the detail appears in enabled-detail readers and rendering.
- `markerId`: Optional source marker or tilemap reference.

### Relationships

- Belongs to one `OfficeDefinition`.
- May overlap visually with an interior foundation zone, but does not create interaction or collision behavior.
