# Data Model: Home Route Playwright Canvas Boot Smoke

## Home Route Smoke Result

- **Purpose**: Captures whether the home route evaluates to the intended city view entry.
- **Fields**:
  - `routeContent`: the top-level route element returned from the home route
  - `cityViewPresent`: whether the route content is the city view experience
- **Validation rules**: The route content must be the city view entry and must be inspectable without live browser automation.

## Canvas Entry Signal

- **Purpose**: Captures whether the city view contains the city canvas entry point expected by downstream browser smoke workflows.
- **Fields**:
  - `cityViewContent`: the evaluated city view element tree
  - `canvasEntryPresent`: whether the city canvas entry component is present
- **Validation rules**: The city view must include exactly the canvas entry surface that boots the city scene in the browser component.
