import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { resolveEffectiveRoles } from "./roleResolver.js";
import { CONVERGENCE_STATUSES, computeConvergenceStatus } from "./reviewConvergence.js";

// Spec 148 - Adaptive agent role and exact-candidate-ownership evidence
// (authoritative requirements 10, 11; Required Tests P-W, and part of X/U).
//
// The durable ADOS role assignment lives in
// `.agent-workflow/runs/<feature>/ados-run.json`, which is gitignored. Its
// values are transcribed into the tracked
// `specs/148-.../runtime-evidence.json` so this evidence is stable across
// worktree locations. These tests assert the transcribed values and exercise
// the real agent-workflow enforcement modules for distinctness, exact-HEAD,
// reviewer availability, and no self-review.

const evidence = JSON.parse(
  readFileSync(
    fileURLToPath(
      new URL(
        "../../specs/148-autonomous-company-operations-end-to-end/runtime-evidence.json",
        import.meta.url,
      ),
    ),
    "utf8",
  ),
) as {
  adosRun: {
    runId: string;
    agentAssignment: {
      implementerId: string;
      reviewerId: string;
      mode: string;
      reason: string;
      candidateOwnerId: string;
    };
  };
  candidateOwner: string;
  reviewer: string;
  shaAlignment: {
    candidateOwner: string;
    candidateSha: string;
    validatedSha: string;
    reviewedSha: string;
    validationStatus: string;
    validationTreeMutated: boolean;
    reviewDecisionForTranscribedCandidate: string;
    staleApprovalReuseAllowed: boolean;
  };
};

describe("Spec 148 durable ADOS role assignment", () => {
  const assignment = evidence.adosRun.agentAssignment;

  it("exposes Claude as the durable implementer (Test P)", () => {
    expect(assignment.implementerId).toBe("claude");
    expect(assignment.mode).toBe("adaptive");
    expect(assignment.reason.toLowerCase()).toContain("claude");
    expect(evidence.adosRun.runId).toMatch(/^[a-z0-9]+$/);
  });

  it("exposes Codex as the durable independent reviewer (Test Q)", () => {
    expect(assignment.reviewerId).toBe("codex");
    expect(evidence.reviewer).toBe("codex");
  });

  it("keeps implementer and reviewer distinct (Test R)", () => {
    expect(assignment.implementerId).not.toBe(assignment.reviewerId);
  });

  it("records Claude as the candidate owner for the exercised run (Test S)", () => {
    expect(assignment.candidateOwnerId).toBe("claude");
    expect(evidence.candidateOwner).toBe("claude");
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

  it("records candidate == validated == reviewed SHA for the exercised candidate (Tests S, U)", () => {
    const sha = evidence.shaAlignment;
    // The candidate produced by Claude is durably identified, and the durable
    // ADOS validation + independent review both targeted that exact SHA.
    expect(sha.candidateOwner).toBe("claude");
    expect(sha.candidateOwner).not.toBe(evidence.reviewer);
    expect(sha.candidateSha).toMatch(/^[0-9a-f]{40}$/);
    expect(sha.validatedSha).toBe(sha.candidateSha);
    expect(sha.reviewedSha).toBe(sha.candidateSha);
    expect(sha.validationStatus).toBe("PASS");
    expect(sha.validationTreeMutated).toBe(false);
    expect(sha.staleApprovalReuseAllowed).toBe(false);
  });

  it("does not converge the transcribed candidate while its review decision is not Approved (Tests U, X)", () => {
    const sha = evidence.shaAlignment;
    // computeConvergenceStatus consumes exactly this alignment: validated ==
    // reviewed == exact HEAD is necessary but not sufficient - the latest
    // decision must also be Approved. The evidence records "Changes Requested",
    // so publication stays blocked.
    const exactTargetMatch = sha.validatedSha === sha.reviewedSha && sha.validatedSha === sha.candidateSha;
    expect(exactTargetMatch).toBe(true);
    expect(
      computeConvergenceStatus({
        hasAnyReviewAttempt: true,
        latestReviewOutcome: sha.reviewDecisionForTranscribedCandidate,
        latestCompletenessStatus: "complete",
        activeBlockingFindingsCount: 0,
        exactTargetMatch,
      }),
    ).not.toBe(CONVERGENCE_STATUSES.CONVERGED);
  });

  it("does not let a stale approval authorize a newer candidate (Test T)", () => {
    // A prior "Approved" recorded against an older SHA is modelled as
    // exactTargetMatch=false once a newer candidate exists.
    const staleApprovalNewerCandidate = {
      hasAnyReviewAttempt: true,
      latestReviewOutcome: "Approved",
      latestCompletenessStatus: "complete",
      activeBlockingFindingsCount: 0,
      exactTargetMatch: false,
    };
    expect(computeConvergenceStatus(staleApprovalNewerCandidate)).not.toBe(CONVERGENCE_STATUSES.CONVERGED);
  });
});
