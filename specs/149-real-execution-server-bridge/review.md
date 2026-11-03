# Review: 149-real-execution-server-bridge

**Reviewed commit**: 6b29c88e1e3eb46fb6d0e4304e91182a9c898f2b (round 7; round 6 approved ba4a9dc753074016b0e0b3bc1dbd6e899a3c3a8f)
**Decision**: Approved

## Blocking Findings

- None (rounds 6 and 7 both Approved).

## Suggestions

- N-006: a request with a loopback `Host` and neither `Sec-Fetch-Site` nor `Origin` is trusted — any local process capable of reaching localhost can drive this endpoint once enabled. Documented in `RuntimeBridgeOrigin.ts` as consistent with the feature's single-operator, own-machine assumption.
- N-007: a reused client-supplied `runId` whose refusal was audited first could, under the exclusive (`wx`) audit write, block a later genuine run reusing the same id from recording its own audit record. Documented in `RuntimeBridgeTypes.ts`; not reachable via the browser's real usage path (both server-bridge providers always generate a fresh UUID).
- N-008 (round 5/6): on Windows, `claude`/`codex` installed as `.cmd` shims would fail to spawn under `shell: false`. Documented in `quickstart.md` with a `where claude`/`where codex` check; verified as real `.exe` files on this machine.
- N-009/N-010/N-011 (round 7, on the T028/T029 UI-wiring delta): enablement label staleness after cancel, a stale class comment, and a discarded cancel-outcome boolean — all fixed in the commit immediately after the reviewed one (re-fetch enablement after cancel, updated comment, outcome surfaced in the label text).

## Residual Risks

- T027 (the one manual, real-CLI quickstart walkthrough) is deliberately left for the operator — it genuinely spawns a real agent process and was never run by this implementation pass.
- T028/T029 (office UI label + Cancel control) are now implemented and reviewed (round 7, Approved) — `spec.md`'s FR-003/FR-007 and the corresponding User Story 2/3 acceptance scenarios are fully delivered end to end.
