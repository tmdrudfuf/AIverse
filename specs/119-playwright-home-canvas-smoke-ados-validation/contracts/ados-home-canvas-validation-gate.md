# Contract: ADOS Home Canvas Validation Gate

## Default Full Validation

When the ADOS workflow resolves validation commands with no custom validation policy or CLI validation command override:

- The command list includes `npm test`.
- The command list includes `npx tsc --noEmit`.
- The command list includes `npm run build`.
- The command list includes `npm run test:e2e:home-canvas`.
- The command list includes `git diff --check`.
- `npm run test:e2e:home-canvas` appears after `npm run build`.

## Prompt Display

When the workflow generates an implementer prompt from default validation commands:

- The prompt includes `npm run test:e2e:home-canvas`.
- The prompt still includes human-only remote mutation boundaries.

## Override Compatibility

When custom validation commands are supplied through state or CLI options:

- The workflow uses the custom command list according to existing precedence.
- The workflow does not append the home canvas smoke command to custom lists.
