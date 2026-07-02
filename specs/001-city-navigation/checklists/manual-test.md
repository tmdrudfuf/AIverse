# Manual Test Checklist: City Navigation

**Purpose**: Validate the city navigation foundation in a browser before closing Phase 8.
**Feature**: [City Navigation](../spec.md)
**Task**: T030 browser validation should mark each item pass or fail with notes.

## Setup

- [ ] Open the city view in a desktop browser.
  - Expected: The top-down city canvas renders inside the AI City shell without console errors or broken layout.
- [ ] Confirm the visible hints list movement and zoom controls.
  - Expected: The UI shows WASD/arrows for movement and Q/E/wheel for zoom.

## Player Movement

- [ ] Press `W` only.
  - Expected: The controlled city position moves upward through the top-down city view.
- [ ] Press `A` only.
  - Expected: The controlled city position moves left through the top-down city view.
- [ ] Press `S` only.
  - Expected: The controlled city position moves downward through the top-down city view.
- [ ] Press `D` only.
  - Expected: The controlled city position moves right through the top-down city view.
- [ ] Press each arrow key individually.
  - Expected: Arrow keys produce the same direction model as the matching WASD keys.
- [ ] Press compatible horizontal and vertical keys together, such as `W` + `D`.
  - Expected: Movement is diagonal, controlled, and does not appear faster than intended.
- [ ] Press opposite keys on one axis, such as `A` + `D` or `W` + `S`.
  - Expected: The conflicting axis resolves without jitter or rapid direction flipping.
- [ ] Hold a movement key for at least 30 seconds.
  - Expected: Movement remains smooth and controlled, with no runaway acceleration or orientation-breaking jumps.

## Camera Behavior

- [ ] Move through several areas of the city while watching camera follow behavior.
  - Expected: The camera keeps the active area readable and does not visibly lag, snap, or drift away from navigation.
- [ ] Press `Q` to zoom in.
  - Expected: The city appears closer while remaining readable and navigable.
- [ ] Press `E` to zoom out.
  - Expected: More of the city is visible while orientation remains clear.
- [ ] Use the mouse wheel over the city canvas to zoom in and out.
  - Expected: Wheel zoom changes the view scale only while interacting with the city canvas.
- [ ] Move while zooming with keyboard or wheel input.
  - Expected: Movement and zoom remain usable together without sudden view jumps.

## Navigation Boundaries

- [ ] Navigate to each edge of the city world.
  - Expected: The view remains within supported city bounds and does not expose broken, blank, or non-city space.
- [ ] Repeatedly zoom in beyond the closest supported level.
  - Expected: Zoom stops at a readable maximum with no broken visual state.
- [ ] Repeatedly zoom out beyond the farthest supported level.
  - Expected: Zoom stops at a readable minimum with no broken visual state or exposed invalid space.
- [ ] Zoom near a world edge, then continue moving along the edge.
  - Expected: Camera clamping remains stable after the visible world size changes.

## Accessibility

- [ ] Inspect the city canvas accessible name.
  - Expected: The canvas is exposed as a top-down pixel-art city view and does not imply AI activity, NPC simulation, or unrelated controls.
- [ ] Use arrow-key navigation while the city view is active.
  - Expected: The page does not scroll during focused city navigation.
- [ ] Navigate away from or destroy the city view, then use arrow keys on the page.
  - Expected: Normal browser/page keyboard behavior is restored outside the city experience.

## Regression Checks

- [ ] Verify navigation remains camera/view control and does not depend on AI services or backend task execution.
  - Expected: Movement and zoom work without AI requests, tool activity, or external service behavior.
- [ ] Verify no NPC or autonomous agent behavior is required for navigation.
  - Expected: Navigation can be validated without NPCs, autonomous movement, or character interaction.
- [ ] Verify navigation validation does not require Founder-specific controls or building entry.
  - Expected: Movement and zoom can be checked without entering a building or depending on Founder-only behavior.
- [ ] Verify any existing Founder or building visuals do not replace the navigation controls being tested.
  - Expected: WASD/arrows and Q/E/wheel remain the navigation inputs under validation.
- [ ] Verify building labels and city scenery remain visually stable while navigating.
  - Expected: Existing city visuals stay recognizable and do not flicker, duplicate, or disappear during movement or zoom.

## Result

- [ ] Record any failures with reproduction notes.
  - Expected: Failures include the input used, browser state, and visible result.
- [ ] Confirm the checklist is complete.
  - Expected: Every item is marked pass or fail before T030 is completed.
