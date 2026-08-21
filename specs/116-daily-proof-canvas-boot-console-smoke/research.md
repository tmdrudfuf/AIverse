# Research: Daily Proof Canvas Boot Console Smoke

## Decision: Test the canvas boot boundary with a mocked Phaser runtime

**Rationale**: The requested smoke target is canvas boot console cleanliness. Mocking the Phaser game constructor proves the application requests the correct boot configuration while avoiding real browser, canvas, GPU, or Phaser rendering requirements.

**Alternatives considered**:

- Add browser automation: rejected because it expands setup and validation surface for a narrow smoke check and conflicts with the ADOS runtime constraints.
- Instantiate real Phaser in Vitest: rejected because it can require DOM/canvas behavior unrelated to the requested smoke signal.

## Decision: Extract a small boot helper from the existing component

**Rationale**: The component currently performs dynamic import and game construction inside `useEffect`. A helper lets the smoke test call the same boot boundary directly without changing the rendered UI or adding a React DOM test dependency.

**Alternatives considered**:

- Test only `createCityScene`: rejected because it would not prove the canvas boot path requests a game instance for the host.
- Add a component rendering test: rejected because the repository does not currently use a React DOM test harness, and adding one is unnecessary for the smoke target.

## Decision: Smoke console warnings and errors only

**Rationale**: Console warnings and errors are the meaningful boot failure signals for this local smoke. Informational logs are not part of the requested regression boundary.

**Alternatives considered**:

- Assert no console output of any kind: rejected because it would overconstrain future harmless diagnostics.
- Ignore console output: rejected because the feature explicitly asks for console smoke coverage.
