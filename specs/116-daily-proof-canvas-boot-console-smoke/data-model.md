# Data Model: Daily Proof Canvas Boot Console Smoke

## Daily Proof Canvas Boot Result

- **Purpose**: Captures whether the Daily Proof city canvas boot path requested a game instance for the supplied host.
- **Key attributes**: host reference, game configuration, scene count, optional game instance.
- **Validation rules**: A successful boot result includes one game request attached to the supplied host with the city scene collection configured.

## Console Smoke Signal

- **Purpose**: Captures whether boot emitted warning or error output.
- **Key attributes**: warning count, error count.
- **Validation rules**: The smoke passes only when warning count is 0 and error count is 0 during the boot attempt.

## Absent Host Boot Result

- **Purpose**: Represents a boot attempt after the component host is no longer available.
- **Key attributes**: missing host, no game instance.
- **Validation rules**: The boot path must return without constructing a game and without console warnings or errors.
