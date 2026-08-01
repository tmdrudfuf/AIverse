# Quickstart: Claude Implementer Runtime Foundation

## Focused Tests

Run Implementer Runtime focused coverage:

```powershell
npx vitest run src/features/city-view/scene/office/implementer-runtime src/features/city-view/scene/office/OfficeProjectPortalController.implementer-runtime.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

## Full Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Manual Flow

1. Open the Project Dashboard for a project with a current Runtime Start (advance the existing chain one explicit input at a time, as in Spec 074's quickstart, ending at "start approved runtime").
2. Confirm the dashboard shows `[IMPLEMENTER RUNTIME] Claude Implementer Ready; Explicit Human Start Required; Codex Reviewer Not Started` — and that this row never appeared automatically merely because Runtime Start exists.
3. Press the distinct Start-Implementer input (not Enter/Action — see `contracts/implementer-runtime.md`). Verify a single bounded terminal result appears (`Completed`, `TimedOut`, `Blocked`, or `Failed`), never a fabricated `Starting`/`Running` state.
4. Verify a second Start-Implementer press against the same still-active or already-terminal Runtime Start does not spawn a second process (`Blocked` / `IMPLEMENTER_RUNTIME_ALREADY_ACTIVE`, or requires a new explicit action after a terminal result).
5. Verify staling any upstream record (plan, approval, preflight, Runtime Start) after the fact blocks the next Start-Implementer attempt.
6. Verify swapping the approved role binding (in a test fixture, not in the live dashboard, since the live dashboard always uses the approved Claude=Implementer/Codex=Reviewer constants) blocks with a role-mismatch reason.
7. Verify no Codex process starts, no dedicated Validation stage runs, no files are staged/committed, no Git mutation occurs, no GitHub mutation occurs, no push occurs, and no PR is created — regardless of the result status.

## Safe Manual Smoke Test (opt-in, human-triggered)

This procedure genuinely spawns a real `claude` CLI process. It is not run automatically by any test or by this feature's own implementation; a human must explicitly trigger it.

**Required opt-in**: `ClaudeImplementerRuntimeProvider` will not resolve a real `node:child_process` import unless the environment variable `AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN` is set to exactly `"1"` in the process running the smoke test — this is in addition to the `typeof window !== "undefined"` browser guard, and exists specifically because an early integration test written while developing this feature spawned five real Claude Code agent processes before this second gate was added (see plan.md, Architecture Decision 4). Set this variable only in the shell running the smoke script; never set it for `npm test`/CI.

**Scope decision**: the smoke test's one approved, explicitly-scoped edit target is `specs/075-claude-implementer-runtime-foundation/smoke-test-note.md`, a dedicated scratch file created specifically for this purpose and included in this feature's approved mutation scope. This is a documentation-only file inside the approved feature worktree; no other file may be touched by the smoke-test task. If a human runs this procedure and it produces a real edit to that file, the edit is intentionally in scope and may be committed as part of this feature; it does not need to be restored.

Steps:

1. In the dedicated Spec 075 feature worktree (`C:\Users\tmdru\Desktop\Ky-Project\AIverse-spec-075`, branch `codex/075-claude-implementer-runtime-foundation`), set `AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN=1` in the shell, then construct a real `ClaudeImplementerRuntimeProvider` and a matching `ImplementerRuntimeRequest` whose task is exactly: *"Append a single line to `specs/075-claude-implementer-runtime-foundation/smoke-test-note.md` recording the current UTC timestamp. Do not edit any other file."*
2. Confirm Codex is represented as the approved Reviewer in the constructed request but is not started.
3. Use a bounded timeout (for example 60000ms).
4. Run the invocation and record: the exact `command`/`arguments` spawned, whether the process started, the exit status, and the bounded/truncated output.
5. Verify `specs/075-claude-implementer-runtime-foundation/smoke-test-note.md` contains exactly one new line and no other file changed (`git status --short`).
6. Verify Codex did not start (no `codex` process was spawned).
7. Verify the dedicated product Validation stage did not run (it does not exist yet; this is a structural check that no such stage was invoked).
8. Verify no remote mutation occurred (`git status --short` shows no staged/pushed state; no branch was pushed; no PR exists).

This procedure was not run as part of implementing Spec 075 itself (no human explicitly triggered it); it is documented here for a human to run later, opt-in.
