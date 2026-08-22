# Data Model: Playwright WebGL Warning Allowlist

## BrowserConsoleSignal

- `type`: console signal severity captured from the browser (`warning` or `error`)
- `text`: browser console message text

Validation rules:

- Warning signals are checked against the allowed warning definitions.
- Error signals are never allowlisted by this feature.

## PageErrorSignal

- `message`: uncaught page error message

Validation rules:

- Page errors are always failure signals.

## AllowedWebGLWarning

- `label`: human-readable reason for the allowed warning
- `matches`: exact or bounded text criteria used to identify the warning

Validation rules:

- Match criteria must be specific enough to avoid allowing unrelated graphics, canvas, or application warnings.
- Allowed warnings apply only to warning-level console signals.

## BrowserFailureSignal

- `message`: normalized failure string included in the final smoke assertion

State transition:

- Raw console warning -> ignored when it matches `AllowedWebGLWarning`
- Raw console warning -> `BrowserFailureSignal` when it does not match
- Raw console error -> `BrowserFailureSignal`
- Raw page error -> `BrowserFailureSignal`
