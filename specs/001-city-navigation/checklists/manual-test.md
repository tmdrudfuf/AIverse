# Manual Navigation Test Checklist

**Feature**: City Navigation
**Source**: `specs/001-city-navigation/spec.md`
**Task**: T029 Create manual navigation test checklist

## Instructions

- Run the app locally and open the city view.
- Complete each item with `PASS` or `FAIL`.
- For any failure, record expected behavior, actual behavior, and reproduction notes.
- Do not mark T030 complete until this checklist has been executed in a browser.

## Environment

- Command used:
- URL:
- Browser:
- Date:
- Tester:

## Player Movement

- [ ] City view loads and the camera/player navigation surface is visible.
  - Expected: The top-down city scene appears without broken rendering.
  - Result:
  - Notes:

- [ ] `W` moves the view/player upward as expected.
  - Expected: Movement direction is predictable and controlled.
  - Result:
  - Notes:

- [ ] `A` moves the view/player left as expected.
  - Expected: Movement direction is predictable and controlled.
  - Result:
  - Notes:

- [ ] `S` moves the view/player downward as expected.
  - Expected: Movement direction is predictable and controlled.
  - Result:
  - Notes:

- [ ] `D` moves the view/player right as expected.
  - Expected: Movement direction is predictable and controlled.
  - Result:
  - Notes:

- [ ] Arrow keys provide equivalent movement to WASD.
  - Expected: Arrow up/down/left/right match the corresponding WASD directions.
  - Result:
  - Notes:

- [ ] Diagonal movement is controlled.
  - Expected: Combining compatible horizontal and vertical inputs moves diagonally without excessive speed.
  - Result:
  - Notes:

- [ ] Opposite-key conflicts do not jitter.
  - Expected: Pressing opposite directions on the same axis resolves predictably.
  - Result:
  - Notes:

## Camera Behavior

- [ ] Held movement remains smooth for at least 30 seconds.
  - Expected: No visible jumps, uncontrolled acceleration, or disorienting jitter.
  - Result:
  - Notes:

- [ ] Releasing movement keys slows or stops cleanly.
  - Expected: The camera/player stops without visible snapping or continued drift beyond intended smoothing.
  - Result:
  - Notes:

- [ ] Camera/view remains readable while moving.
  - Expected: Roads, buildings, and labels remain understandable during movement.
  - Result:
  - Notes:

- [ ] Movement and zoom can be used together.
  - Expected: Movement remains usable during and after zoom changes.
  - Result:
  - Notes:

## Navigation Boundaries

- [ ] Moving toward the left/top bounds does not expose broken space.
  - Expected: The scene remains clamped to valid city content.
  - Result:
  - Notes:

- [ ] Moving toward the right/bottom bounds does not expose broken space.
  - Expected: The scene remains clamped to valid city content.
  - Result:
  - Notes:

- [ ] Zooming near world edges keeps bounds valid.
  - Expected: Zoom changes do not reveal unintended blank or broken space.
  - Result:
  - Notes:

## Zoom

- [ ] Keyboard zoom in works.
  - Expected: The city zooms in smoothly and remains readable.
  - Result:
  - Notes:

- [ ] Keyboard zoom out works.
  - Expected: The city zooms out smoothly and remains readable.
  - Result:
  - Notes:

- [ ] Mouse wheel zoom works while interacting with the city canvas.
  - Expected: Wheel input changes zoom only for the city canvas interaction.
  - Result:
  - Notes:

- [ ] Zoom limits are enforced.
  - Expected: Repeated zoom-in/out attempts stop at supported limits with no broken state.
  - Result:
  - Notes:

## Accessibility

- [ ] Arrow-key navigation does not scroll the page while the city view is active.
  - Expected: Movement input is captured for the city experience during active navigation.
  - Result:
  - Notes:

- [ ] City canvas accessible label is understandable.
  - Expected: The label describes the visual city canvas without requiring sighted-only context.
  - Result:
  - Notes:

- [ ] Visible navigation hints match implemented controls.
  - Expected: Movement and zoom hints match the actual keyboard/mouse controls.
  - Result:
  - Notes:

## Regression Checks

- [ ] Existing city buildings and labels still render.
  - Expected: Daily Proof Inc., AI Lab, Portfolio Studio, and city landmarks remain visible as applicable.
  - Result:
  - Notes:

- [ ] Existing office entry flow still works if present in the current product build.
  - Expected: Later features built on top of city navigation remain usable.
  - Result:
  - Notes:

- [ ] Existing office controls still work after returning from city navigation.
  - Expected: Entering/exiting office flows does not break movement or input handling.
  - Result:
  - Notes:

- [ ] No new NPC, AI, task, or project behavior is introduced by navigation validation.
  - Expected: This checklist observes existing behavior only and does not require new simulation behavior.
  - Result:
  - Notes:

## Manual Validation Summary

- Overall result:
- Failed items:
- Follow-up fixes required:
- T030 ready to mark complete: Yes / No
