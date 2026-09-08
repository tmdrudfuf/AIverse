import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { resolveEffectiveRoles } from "./roleResolver.js";
import { CONVERGENCE_STATUSES, computeConvergenceStatus } from "./reviewConvergence.js";

// Spec 148 - Adaptive agent role and exact-candidate-ownership evidence
// (authoritative requirements 10, 11; Required Tests P-W, and part of X/U).
//
// The durable ADOS role assignment lives in
// `.agent-workflow/runs/<feature>/ados-run.json` (gitignored, worktree-absolute
// paths). Its non-path fields are mirrored into the tracked, sanitized
// `specs/148-.../ados-run.sanitized.json`. These tests assert:
//   - the sanitized artifact carries the durable role/candidate assignment
//     (and, when the durable file is present, that the sanitized copy still
//     matches it) - so the evidence is verified against ADOS state, not a
//     free-standing label;
//   - `runtime-evidence.json` transcribes the sanitized values unchanged;
//   - candidate/validated/reviewed SHA alignment is resolved from durable ADOS
//     sources when present, and the exact-HEAD + no-stale-approval gate holds
//     regardless via the real agent-workflow enforcement modules.

const specDir = new URL("../../specs/148-autonomous-company-operations-end-to-end/", import.meta.url);
const runDir = new URL("../../.agent-workflow/runs/148-autonomous-company-operations-end-to-end/", import.meta.url);

function readJson(url: URL): unknown {
  return JSON.parse(readFileSync(fileURLToPath(url), "utf8"));
}

function readJsonIfPresent(url: URL): unknown | undefined {
  const path = fileURLToPath(url);
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : undefined;
}

const evidence = readJson(new URL("runtime-evidence.json", specDir)) as {
  adosRun: { runId: string; agentAssignment: Record<string, unknown> };
  candidateOwner: string;
  reviewer: string;
  publicationResult: string;
  shaAlignment: { staleApprovalReuseAllowed: boolean; candidateOwner: string };
};

const sanitized = readJson(new URL("ados-run.sanitized.json", specDir)) as {
  _durableSource: string;
  _derivedFields: string[];
  runId: string;
  specNumber: string;
  featureBranch: string;
  authoritativeBaseSha: string;
  executionPolicyVersion: string;
  agentAssignment: {
    mode: string;
    implementerId: string;
    reviewerId: string;
    candidateOwnerId: string;
    reason: string;
    [key: string]: unknown;
  };
};

const durableRun = readJsonIfPresent(new URL("ados-run.json", runDir)) as
  | { runId: string; featureBranch: string; authoritativeBaseSha: string; executionPolicyVersion: string; status: string; agentAssignment: Record<string, unknown> }
  | undefined;
// A clean checkout has no `.agent-workflow` run dir at all (gitignored), so the
// durable cross-check below simply does not apply. But if any *other* durable
// run artifact is present, the run dir is live and `ados-run.json` - the role
// assignment source of truth - must be present too; it may not be selectively
// deleted while its siblings remain. Under authoritative ADOS validation the run
// dir is fully populated (this branch's dir currently holds ados-run.json,
// candidate.json, implementer-runtime.json, validation-runtime.json,
// review-runtime.json), so the field-for-field check does execute there.
const RUN_DIR_SIBLING_ARTIFACTS = [
  "candidate.json",
  "implementer-runtime.json",
  "validation-runtime.json",
  "review-runtime.json",
  "bootstrap-runtime.json",
];
const runDirIsPopulated = RUN_DIR_SIBLING_ARTIFACTS.some((name) =>
  existsSync(fileURLToPath(new URL(name, runDir))),
);
const VOLATILE_DURABLE_FIELDS = [
  "status",
  "nextStage",
  "implementationFailure",
  "implementationRecoveryAttempts",
  "implementationRecoveryBlock",
];
const durableCandidate = readJsonIfPresent(new URL("candidate.json", runDir)) as
  | { candidate_sha: string; status: string }
  | undefined;
const durableValidation = readJsonIfPresent(new URL("validation-runtime.json", runDir)) as
  | { head_before: string; head_after: string; commands: Array<{ command: string; exit_code: number }> }
  | undefined;
const durableReview = readJsonIfPresent(new URL("review-runtime.json", runDir)) as
  | { reviewed_sha: string; status: string; decision: string }
  | undefined;

describe("Spec 148 durable ADOS role assignment", () => {
  const assignment = sanitized.agentAssignment;

  it("carries the durable role/candidate assignment in the sanitized ADOS artifact (Tests P, S)", () => {
    expect(assignment.implementerId).toBe("claude");
    expect(assignment.reviewerId).toBe("codex");
    expect(assignment.candidateOwnerId).toBe("claude");
    expect(assignment.mode).toBe("adaptive");
    expect(assignment.reason.toLowerCase()).toContain("claude");
    expect(sanitized.runId).toMatch(/^[a-z0-9]+$/);
    expect(sanitized.featureBranch).toBe("codex/148-autonomous-company-operations-end-to-end");
    expect(sanitized.authoritativeBaseSha).toMatch(/^[0-9a-f]{40}$/);
  });

  it("declares provenance from the durable ADOS run record, not a free-standing label (Tests P, Q, S)", () => {
    expect(sanitized._durableSource).toBe(
      ".agent-workflow/runs/148-autonomous-company-operations-end-to-end/ados-run.json",
    );
    // The sanitized artifact is an allowlisted copy of stable identity fields.
    // It must not freeze any volatile per-cycle lifecycle field: those go stale
    // the moment this commit advances HEAD (authoritative requirement 21).
    const sanitizedKeys = new Set(Object.keys(sanitized));
    for (const volatileField of VOLATILE_DURABLE_FIELDS) {
      expect(sanitizedKeys.has(volatileField), `${volatileField} must not be frozen into tracked evidence`).toBe(false);
    }
    expect(sanitized._derivedFields).toEqual([
      "runId",
      "specNumber",
      "featureBranch",
      "authoritativeBaseSha",
      "executionPolicyVersion",
      "agentAssignment",
    ]);
  });

  it("carries no absolute machine path and no unexpected field, in any checkout (Tests P, Q, S)", () => {
    // This must hold for the tracked artifact itself, independent of whether a
    // live ADOS run dir exists in this worktree.
    const allowed = new Set([...sanitized._derivedFields, "_note", "_durableSource", "_derivedFields"]);
    for (const key of Object.keys(sanitized)) {
      expect(allowed.has(key), `sanitized artifact must not carry unexpected field ${key}`).toBe(true);
    }
    expect(JSON.stringify(sanitized)).not.toMatch(/[A-Za-z]:[\\/]/);
  });

  it("requires the durable ADOS run record whenever the run dir is populated (Tests P, Q, S)", () => {
    // Not dodgeable by deleting ados-run.json alone inside a live run dir: if any
    // sibling run artifact exists, the durable role-assignment record must too.
    if (!runDirIsPopulated) return;
    expect(
      durableRun,
      "ados-run.json must exist when the .agent-workflow run dir is populated",
    ).toBeDefined();
  });

  it.skipIf(!durableRun)(
    "matches the durable ADOS run record field-for-field when it is present in the worktree (Tests P, Q, S)",
    () => {
      // Every allowlisted field is transcribed unchanged from durable ADOS state.
      // Reported as skipped (not passed) in a clean checkout with no run dir, so
      // it can never be a silent green that never proved provenance.
      for (const field of sanitized._derivedFields) {
        expect(
          (sanitized as Record<string, unknown>)[field],
          `sanitized.${field} must equal durable ados-run.json`,
        ).toEqual((durableRun as Record<string, unknown>)[field]);
      }
    },
  );

  it("has runtime-evidence.json transcribe the sanitized assignment unchanged (Tests P, Q, R, S)", () => {
    const transcribed = evidence.adosRun.agentAssignment;
    for (const [key, value] of Object.entries(sanitized.agentAssignment)) {
      expect(transcribed[key]).toEqual(value);
    }
    expect(evidence.adosRun.runId).toBe(sanitized.runId);
    expect(evidence.candidateOwner).toBe(sanitized.agentAssignment.candidateOwnerId);
    expect(evidence.reviewer).toBe(sanitized.agentAssignment.reviewerId);
  });

  it("keeps implementer and reviewer distinct (Test R)", () => {
    expect(assignment.implementerId).not.toBe(assignment.reviewerId);
    expect(evidence.candidateOwner).not.toBe(evidence.reviewer);
  });
});

describe("Spec 148 independent-review and exact-HEAD enforcement", () => {
  it("resolves Claude implementer to a distinct Codex reviewer (Tests R, W)", () => {
    const result = resolveEffectiveRoles({ state: {}, requestedImplementerId: "claude" });
    expect(result.ok).toBe(true);
    expect(result.roles).toEqual({ implementer: "claude", reviewer: "codex" });
    expect(result.roles?.reviewer).not.toBe(result.roles?.implementer);
  });

  it("refuses to let Claude review its own candidate when no distinct reviewer exists (Test W)", () => {
    const result = resolveEffectiveRoles({
      state: { roleRoster: ["claude"] },
      requestedImplementerId: "claude",
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.join(" ")).toContain("No distinct Reviewer candidate exists");
  });

  it("blocks safely when the Codex reviewer runtime is unavailable (Test V)", () => {
    const result = resolveEffectiveRoles({
      state: { agentRunners: { codex: { enabled: false } } },
      requestedImplementerId: "claude",
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.join(" ").toLowerCase()).toContain("codex");
  });

  it("does not converge without any reviewer attempt (no self-review fallback) (Test W)", () => {
    expect(computeConvergenceStatus({ hasAnyReviewAttempt: false })).toBe(CONVERGENCE_STATUSES.NOT_STARTED);
  });

  it("converges only when validated == reviewed == exact HEAD (Test U)", () => {
    const aligned = {
      hasAnyReviewAttempt: true,
      latestReviewOutcome: "Approved",
      latestCompletenessStatus: "complete",
      activeBlockingFindingsCount: 0,
      exactTargetMatch: true,
    };
    expect(computeConvergenceStatus(aligned)).toBe(CONVERGENCE_STATUSES.CONVERGED);
    expect(computeConvergenceStatus({ ...aligned, exactTargetMatch: false })).toBe(CONVERGENCE_STATUSES.IN_PROGRESS);
  });

  it("does not converge on 'Changes Requested' even at exact HEAD (Tests U, X)", () => {
    expect(
      computeConvergenceStatus({
        hasAnyReviewAttempt: true,
        latestReviewOutcome: "Changes Requested",
        latestCompletenessStatus: "complete",
        activeBlockingFindingsCount: 0,
        exactTargetMatch: true,
      }),
    ).not.toBe(CONVERGENCE_STATUSES.CONVERGED);
  });

  it("does not let a stale approval authorize a newer candidate (Test T)", () => {
    // A prior "Approved" recorded against an older SHA is modelled as
    // exactTargetMatch=false once a newer candidate exists.
    expect(
      computeConvergenceStatus({
        hasAnyReviewAttempt: true,
        latestReviewOutcome: "Approved",
        latestCompletenessStatus: "complete",
        activeBlockingFindingsCount: 0,
        exactTargetMatch: false,
      }),
    ).not.toBe(CONVERGENCE_STATUSES.CONVERGED);
    expect(evidence.shaAlignment.staleApprovalReuseAllowed).toBe(false);
  });

  it("reads candidate/review SHA identity from durable ADOS sources when present (Tests S, U, X)", () => {
    if (!durableCandidate) {
      // No live ADOS run dir (clean checkout): there is no durable candidate
      // record to cross-check at all. This is not a silent pass on the
      // requirement - the exact-HEAD + no-stale-approval gate itself is
      // exercised unconditionally by the "Spec 148 independent-review and
      // exact-HEAD enforcement" tests above (converges only when aligned,
      // rejects stale approval, rejects self-review, blocks when reviewer
      // unavailable), which do not depend on a live ADOS run dir existing.
      expect(evidence.shaAlignment.candidateOwner).toBe("claude");
      return;
    }
    expect(durableCandidate.candidate_sha).toMatch(/^[0-9a-f]{40}$/);
    // candidate.json is written for the exact commit under test, before
    // validation runs (see the pipeline-order comment below) - so unlike
    // reviewed_sha, this leg has no circularity and holds unconditionally:
    // the durable candidate must name exact HEAD, not a prior or stale commit.
    const exactHead = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    expect(durableCandidate.candidate_sha).toBe(exactHead);
    // The ADOS pipeline order is candidate -> validate -> review
    // (run_pipeline.py: candidate.json is written, *then* ValidationEngine.run
    // executes every configured command including this repository's own
    // `npm test`, and only after that full run returns does it write
    // validation-runtime.json; review-runtime.json is written later still,
    // only once validation has already passed). This suite itself runs as
    // part of that `npm test` command. So at the moment this test executes for
    // a freshly-committed candidate, validation-runtime.json and
    // review-runtime.json on disk can only reflect a *prior*, already-finished
    // cycle (or be absent on the first cycle) - never the in-flight candidate.
    // Asserting reviewed_sha === candidate_sha, or that the *prior* cycle's
    // command list all exited 0, unconditionally here would fail by
    // construction on every cycle after the first.
    //
    // Both branches below are checkable without that circularity, and both
    // assert a real invariant rather than a bare shape check - a durable
    // record that names a *different* SHA than the current candidate must be
    // provably treated as non-convergent for this candidate, never silently
    // accepted as authorization.
    if (durableValidation) {
      expect(Array.isArray(durableValidation.commands)).toBe(true);
      // Worktree-unmutated holds for any validation cycle, stale or current:
      // validation must never leave HEAD different from where it started.
      expect(durableValidation.head_before).toBe(durableValidation.head_after);
      if (durableValidation.head_after === durableCandidate.candidate_sha) {
        // This durable validation record additionally targeted the exact
        // current candidate (not a stale prior cycle): every command must
        // have exited 0.
        for (const command of durableValidation.commands) {
          expect(command.exit_code, `${command.command} must exit 0`).toBe(0);
        }
      }
    }
    if (durableReview) {
      expect(durableReview.reviewed_sha).toMatch(/^[0-9a-f]{40}$/);
      if (durableReview.reviewed_sha === durableCandidate.candidate_sha) {
        // This durable review targeted the exact current candidate: only a
        // genuine "Approved" decision may converge, and even that must still
        // require exact-HEAD alignment (asserted above) to authorize
        // publication. Assert the invariant from the decision's meaning
        // ("Approved" converges, anything else does not) rather than a
        // specific non-Approved status literal, since the exact spelling of a
        // non-Approved decision is not reproducible from this repository.
        const status = computeConvergenceStatus({
          hasAnyReviewAttempt: true,
          latestReviewOutcome: durableReview.decision,
          latestCompletenessStatus: "complete",
          activeBlockingFindingsCount: durableReview.decision === "Approved" ? 0 : 1,
          exactTargetMatch: true,
        });
        if (durableReview.decision === "Approved") {
          expect(status).toBe(CONVERGENCE_STATUSES.CONVERGED);
        } else {
          expect(status).not.toBe(CONVERGENCE_STATUSES.CONVERGED);
        }
      } else {
        // Named review targets a different (stale) SHA than the current
        // candidate: it must never authorize the current candidate, however
        // its own decision reads.
        expect(computeConvergenceStatus({
          hasAnyReviewAttempt: true,
          latestReviewOutcome: durableReview.decision,
          latestCompletenessStatus: "complete",
          activeBlockingFindingsCount: 0,
          exactTargetMatch: false,
        })).not.toBe(CONVERGENCE_STATUSES.CONVERGED);
      }
    }
    expect(evidence.shaAlignment.candidateOwner).toBe("claude");
  });

  it("keeps publicationResult a standing gate, not a frozen per-candidate verdict (Tests U, X, Y)", () => {
    expect(evidence.publicationResult).toMatch(/Approved/);
    expect(evidence.publicationResult.toLowerCase()).toContain("exact head");
    // No frozen candidate SHA literal in the publication result.
    expect(evidence.publicationResult).not.toMatch(/[0-9a-f]{40}/);
  });
});
