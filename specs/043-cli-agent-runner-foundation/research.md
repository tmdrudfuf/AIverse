# Research: CLI Agent Runner Foundation

## Decision: Add a separate `agentRunner.js` module

**Rationale**: Spec 042's `agentWorkflow.js` owns prompt/state/path logic. A separate runner keeps subprocess behavior isolated and easier to review.

**Alternatives considered**:

- Put subprocess logic directly in `cli.js`: rejected because it would make testing harder and mix parsing with process orchestration.
- Replace Spec 042 workflow helpers: rejected because path containment and stage selection already exist and are tested.

## Decision: Use injected process adapters in tests

**Rationale**: Tests must not call real Codex or Claude services. An adapter seam lets tests prove behavior deterministically without shelling out.

**Alternatives considered**:

- Temporary fake executable files: workable but more brittle across Windows/Unix shells.
- Calling real `codex --version`/`claude --version` in tests: rejected because local installations vary.

## Decision: Default stdin prompt delivery

**Rationale**: CLI flags can change. The safest foundation is configurable command/args with prompt delivered to stdin by default, plus local overrides in state.

**Alternatives considered**:

- Hardcode full Codex/Claude invocation flags: rejected because local CLI versions differ and the user explicitly requested verification rather than assumptions.

## Local CLI Inspection

- `codex`: installed at `C:\Users\tmdru\AppData\Local\Programs\OpenAI\Codex\bin\codex.exe`, version output `codex-cli 0.142.3`.
- `claude`: not found.
- `claude-code`: not found.

The feature supports both Codex and Claude through configuration but does not require either in tests.
