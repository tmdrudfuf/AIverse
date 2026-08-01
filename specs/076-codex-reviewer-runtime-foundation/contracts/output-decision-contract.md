# Reviewer Output & Decision Contract

## Required Output Format

Codex's response must express its decision and findings using exactly these markers, one per line, anywhere in the output:

```text
Decision: Approved
Decision: Changes Requested
Finding: <P1|P2|P3> | <blocking|non-blocking> | <category> | <path[:line]> | <message> | <suggestion>
```

The `Finding:` line's trailing `<suggestion>` segment is optional. This format is stated in the Reviewer prompt itself (see `prompt-contract.md`) and parsed deterministically by `ReviewDecisionParser.parseReviewOutput` (`ReviewDecisionParser.ts`).

## Decision Parsing Rules

- A line counts as a decision marker in either of two forms: (1) a `Decision: Approved` / `Decision: Changes Requested` marker, optionally heading-prefixed at any depth (`#`, `##`, ...) and/or bold-wrapped; or (2) a standalone bare line that is exactly the label or begins with the label plus a space (`Approved`, `Approved pending the fix above`), optionally prefixed with a single `#` heading marker — an h2+ heading (`## Approved`) is never treated as a standalone marker, since headings routinely restate section titles that are not themselves a decision. Free-form approval-sounding prose that is not one of these two forms is never consulted.
- Both markers present in the same output → `Unknown` (a conflicting explicit signal is never resolved in favor of the more permissive one).
- `Approved` co-occurring with at least one parsed **blocking** finding → downgraded to `ChangesRequested`. A finding search that turns up a blocking issue is not overridden by an `Approved` line elsewhere in the same output.
- `Approved` co-occurring with a non-zero process exit code → downgraded to `Unknown`. A non-zero exit is never sufficient evidence of a safe `Approved` outcome without an explicit repository policy permitting it (none exists today); the parser does not trust output text the process may not have finished emitting.
- No decision marker present → `Unknown`.

This mirrors the precedence used by `tools/agent-workflow/agentWorkflow.js#detectDecision`, the repository's existing dev-tooling classifier for the same Implementer→Reviewer loop — the in-product parser is a new, independent implementation but deliberately does not diverge in behavior from the classifier this repository's own review loop already depends on (see `research.md`, Finding 4).

## Finding Parsing Rules

- Bounded to 20 findings per result (`MAX_FINDINGS`); lines beyond the cap are not parsed.
- Severity token must be exactly `P1`, `P2`, or `P3` (case-insensitive); any other token is a parse failure that fails safe to `P1` (the most severe, always-blocking tier) rather than silently discarding the finding or treating it as low-severity.
- `blocking` is explicit (`blocking`/`non-blocking` token) when present; otherwise defaults to `severity !== "P3"` (P1/P2 default blocking, P3 defaults non-blocking) — except an unrecognized severity token always forces `blocking: true` regardless of the token present.
- A location token containing `..`, a drive-letter prefix (`C:\`), or a leading `/` is treated as untrusted and dropped (`filePath`/`line` both omitted) rather than embedded as-is — findings never carry an absolute or traversal-shaped path forward into product state.
- `category`, `message`, and `suggestion` are each capped (50/300/300 characters respectively); no unbounded text from Codex's output reaches stored product state.

## Exact-HEAD Gate

A `ReviewerRuntimeResult` can only be produced against a `ReviewTarget` whose `workingTreeState` is exactly `"Clean"` — `ReviewerRuntimeService.validateReviewTarget` blocks with `REVIEWER_RUNTIME_TARGET_UNCOMMITTED` for any other value, before any command-safety check or provider invocation. This is the "Exact-HEAD Gate": a review is only ever attempted against a target the system can honestly call an exact, committed HEAD — never against an uncommitted, in-progress, or ambiguous working tree.

In this repository today, `ReviewTarget.ts`'s deterministic, zero-I/O `resolveReviewTarget` always reports `"Uncommitted"` (see `plan.md`, Architecture Decision 1) — there is no real git-backed commit stage yet to honestly produce `"Clean"`. The gate therefore blocks every controller-driven Start-Reviewer attempt unconditionally, by design, rather than ever fabricating a passing target. The gate itself, and the checks that come after it (command safety, the spawn-allow env-var gate), are exercised only via a directly constructed `Clean` `ReviewTarget` fixture at the service level — the same shape a future real git-backed stage would need to supply to ever pass this gate for real.

## Status/Decision Separation

See `data-model.md` and `plan.md`, Architecture Decision 3. `ReviewerRuntimeService.statusReasonCode` maps `(status, decision)` to exactly one reason code:

```text
Completed + Unknown decision   -> REVIEWER_RUNTIME_DECISION_UNKNOWN
Completed + Approved/ChangesRequested -> REVIEWER_RUNTIME_STARTED
TimedOut                        -> REVIEWER_RUNTIME_TIMED_OUT
Blocked                         -> REVIEWER_RUNTIME_PROVIDER_UNAVAILABLE
Failed                          -> REVIEWER_RUNTIME_SPAWN_FAILED
```

`REVIEWER_RUNTIME_PROVIDER_UNAVAILABLE` is reachable only from a provider-level `Blocked` result (the browser guard or the spawn-allow env-var gate) — it is never produced by the Service's own pre-invoke checks, which use `REVIEWER_RUNTIME_COMMAND_UNSAFE` or `REVIEWER_RUNTIME_TARGET_UNCOMMITTED` instead. A test asserting `REVIEWER_RUNTIME_PROVIDER_UNAVAILABLE` is therefore proof the provider boundary itself was reached and returned `Blocked`, not merely that the Service short-circuited earlier.
