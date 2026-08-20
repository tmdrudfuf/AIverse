# Data Model: Project Portal Text Overflow and Layout Stability

## Portal Text Row

**Purpose**: Represents one visible text item in the portal overlay.

**Fields**:
- `text`: The displayed text after wrapping, clamping, compacting, or truncation.
- `x`, `y`: Render position inside the overlay.
- `lineCount`: Number of visible lines after fitting.
- `priority`: Whether the row is core content or optional overflow content.

## Portal Panel

**Purpose**: Represents a visible bounded region that contains portal rows.

**Fields**:
- `x`, `y`, `width`, `height`: Panel bounds.
- `contentBottom`: The last safe content coordinate before footer or panel edge.
- `rowGap`: Minimum readable gap between rows.

## Overflow Policy

**Purpose**: Describes how dynamic content is made safe for a fixed portal area.

**Fields**:
- `maxLineLength`: Approximate character budget for a row.
- `maxLines`: Maximum visible wrapped lines.
- `strategy`: `wrap`, `clamp`, `compact`, or `drop`.
- `fallback`: Text used when original content is empty or unavailable.

## Validation Rules

- A row must not render past its owning panel or footer boundary.
- A one-line row with overflow must show a truncation indicator.
- Core rows must be retained before optional rows when content is crowded.
