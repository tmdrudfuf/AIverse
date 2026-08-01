# Research: Codex Reviewer Runtime Foundation

## Reusing Spec 075's empirical findings rather than re-running them

Spec 075's `research.md` already established, empirically, that:

- `OfficeProjectPortalController`/`View`/`Registry` are transitively bundled into the browser client build, so any static top-level `node:child_process` import fails `npm run build`, while a `typeof window !== "undefined"` guard around a dynamic `import("node:child_process")` builds successfully and resolves correctly under Vitest (which defaults to the `"node"` environment).
- `spawnSync` on this platform deterministically distinguishes timeout (`status: null`, `signal: "SIGTERM"`, `error.code: "ETIMEDOUT"`), normal exit, non-zero exit, and spawn failure (`error.code: "ENOENT"`), with no orphan-process risk since the call is synchronous by construction.

Spec 076 targets the same bundle graph and the same Node/Vitest execution environment; these conclusions were not re-verified experimentally for this feature because nothing about the bundling or `spawnSync` semantics changes between a Claude subprocess and a Codex subprocess. `CodexReviewerRuntimeProvider` reuses the identical guard shape `ClaudeImplementerRuntimeProvider` already proved out.

## Finding 1: the repository has no real git-backed "clean/committed" signal anywhere in this pipeline

Grepping every existing stage under `src/features/city-view/scene/office/` for real filesystem or git inspection (`fs.`, `child_process`, `execSync`, `isomorphic-git`) finds none outside `runtime-preflight`'s own guarded, represented `RepresentedRuntimeEnvironmentProvider` and Spec 075/076's own guarded providers. There is no product-code path anywhere that stages, commits, or otherwise produces a real `git status`-clean tree.

This means `ReviewTarget.ts`'s `resolveReviewTarget` — a required, deterministic, zero-I/O function — has exactly one honest value to report for `workingTreeState`: `"Uncommitted"`. Reporting `"Clean"` from this function would be indistinguishable from the kind of fabrication the spec explicitly prohibits (`workingTree.clean: true` faked by earlier stages that Spec 074/075 deliberately did not repeat for the fields they controlled). See plan.md, Architecture Decision 1, for the direct consequence this has on which tests can reach which gate.

## Finding 2: the existing agent-name resolver and Codex CLI convention

`RuntimePreflightProvider.normalizeAgentCommand` (unchanged since Spec 075's own Finding 1):

```ts
function normalizeAgentCommand(agentLabel: string) {
  const normalized = agentLabel.trim().toLowerCase();
  if (normalized.includes("codex") || normalized === "implementer") return "codex";
  if (normalized.includes("claude") || normalized === "reviewer") return "claude";
  return agentLabel.trim();
}
```

Since every record's `reviewerAgent`/`reviewer` field is always the literal `"Reviewer"`, this function always resolves it to `"claude"` — the repository's default mapping, i.e. exactly the opposite of the Codex=Reviewer binding this feature must enforce. Reusing it, or writing a parallel resolver for the same label, would make the approved-role check pass unconditionally on the one context this pipeline can currently produce. See plan.md, Architecture Decision 2.

`tools/agent-workflow/agentRunner.js`'s `DEFAULT_AGENT_RUNNERS`:

```js
const CODEX_FULL_ACCESS_ARGS = ["--sandbox", "danger-full-access", "--ask-for-approval", "never", "exec"];
// codex / implementer: { command: "codex", args: CODEX_FULL_ACCESS_ARGS, inputMode: "stdin" }
```

This is dev-tooling (used by `tools/agent-workflow/cli.js` to run this repository's own Implementer/Reviewer loop) — a separate concern from the in-product `CodexReviewerRuntimeProvider`, which does not import from `tools/agent-workflow`. `DEFAULT_REVIEWER_RUNTIME_COMMAND_CONFIG` matches this convention's shape (same command, same arguments, same input mode) as a deliberate choice, per the same non-substitution instruction Spec 075 followed for its own Claude configuration.

## Finding 3: Spec 075's own NB-001 non-blocking finding, and why the fix must be a distinct variable rather than a shared one

Spec 075 shipped `AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN` as `ClaudeImplementerRuntimeProvider`'s second gate, but its own documentation did not explicitly restate that gate everywhere a reader might look for it — recorded as non-blocking finding NB-001 during that spec's independent review. Reusing the same variable name for Codex would not only fail to fix NB-001, it would introduce a strictly worse coupling: setting one spawn-allow variable (say, for a documented Claude smoke test) would silently also enable a real Codex spawn, and vice versa — two independent product capabilities gated by one shared human decision. `AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN` is therefore a new, independent constant, and this restatement requirement is carried out three times (provider contract, plan.md Architecture Decision 4, quickstart.md) rather than once, addressing NB-001 directly.

## Finding 4: the repository's existing decision-classification precedent (`agentWorkflow.js#detectDecision`)

`tools/agent-workflow/agentWorkflow.js` already implements a dev-tooling decision classifier for the same Implementer→Reviewer loop this feature's in-product Codex Reviewer models. `ReviewDecisionParser.parseReviewOutput` deliberately mirrors that classifier's precedence (only explicit `Decision: Approved` / `Decision: Changes Requested` markers are consulted, never free-form approval-sounding prose, and conflicting explicit markers never resolve to `Approved`) so the in-product parser's behavior does not silently diverge from the dev-tooling behavior this repository's own review loop already depends on and trusts. `ReviewDecisionParser` is a new, independent, product-code implementation — it does not import from `tools/agent-workflow`, matching the same product/dev-tooling boundary Spec 075 established for command configuration.

## Dashboard row-fit mechanism (`OfficeProjectPortalView.ts`)

`fitProjectDashboardLowerRows` removes the row with the highest `dropPriority` first (ties broken by later array index) until the remaining set's computed height fits the panel. Current pipeline-stage priorities: `[HUMAN EXECUTION APPROVAL]` 9, `[RUNTIME PREFLIGHT]` 11, `[EXECUTION PLAN]` 12, `[RUNTIME START]` 13, `[EXECUTION READINESS]` 14, `[IMPLEMENTER RUNTIME]` 15. `[REVIEWER RUNTIME]` uses `16` — the next value up, making it the single most disposable pipeline-stage row, one step more disposable than Implementer Runtime, consistent with being the newest addition.
