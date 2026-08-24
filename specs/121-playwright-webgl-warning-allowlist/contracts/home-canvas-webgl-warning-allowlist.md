# Contract: Home Canvas WebGL Warning Allowlist

## Smoke Signal Filtering

Consumer: `e2e/home-canvas-smoke.spec.ts`

Rules:

1. Warning-level console messages matching the documented WebGL allowlist are ignored.
2. Warning-level console messages not matching the allowlist are reported as `console warning: <text>`.
3. Error-level console messages are reported as `console error: <text>`.
4. Page errors are reported as `page error: <message>`.
5. The final browser signal assertion remains `[]` for a passing smoke.

## Allowed Warning Criteria

Initial allowed warning:

- A Chromium WebGL fallback/performance warning that includes both:
  - `WebGL`
  - `Software WebGL has been deprecated`
- A Chromium WebGL driver performance warning that includes all of:
  - `WebGL`
  - `GL Driver Message`
  - `Performance`
  - `GPU stall due to ReadPixels`

Any future allowed warning must be added with focused test coverage and documented here.

## Non-Allowed Signals

- Any page error
- Any console error
- Any warning that does not match every criterion for a documented allowed warning
