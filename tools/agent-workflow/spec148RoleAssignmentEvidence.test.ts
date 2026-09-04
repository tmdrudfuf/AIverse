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
  | { commands: Array<{ command: string; exit_code: number }> }
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

  it("matches the durable ADOS run record field-for-field when it is present in the worktree (Tests P, Q, S)", () => {
    if (!durableRun) {
      // Clean checkout without a live ADOS run dir: nothing to cross-check here;
      // the sanitized artifact is the tracked source and the assertions above
      // plus the transcription check below still bind it to the evidence.
      return;
    }
    // Every allowlisted field is transcribed unchanged from durable ADOS state.
    for (const field of sanitized._derivedFields) {
      expect(
        (sanitized as Record<string, unknown>)[field],
        `sanitized.${field} must equal durable ados-run.json`,
      ).toEqual((durableRun as Record<string, unknown>)[field]);
    }
    // ...and the sanitized copy carries nothing beyond that allowlist plus its
    // own provenance markers - in particular no volatile lifecycle field and no
    // absolute machine path.
    const allowed = new Set([...sanitized._derivedFields, "_note", "_durableSource", "_derivedFields"]);
    for (const key of Object.keys(sanitized)) {
      expect(allowed.has(key), `sanitized artifact must not carry unexpected field ${key}`).toBe(true);
    }
    expect(JSON.stringify(sanitized)).not.toMatch(/[A-Za-z]:[\\/]/);
  });

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

  it("cross-checks validated == reviewed SHA from durable ADOS sources when present (Tests S, U, X)", () => {
    if (!durableCandidate || !durableReview || !durableValidation) {
      // No live ADOS run dir (clean checkout). The exact-HEAD + no-stale-approval
      // gate is still enforced by the computeConvergenceStatus tests above; the
      // evidence deliberately does not freeze a candidate SHA literal.
      expect(evidence.shaAlignment.candidateOwner).toBe("claude");
      return;
    }
    expect(durableCandidate.candidate_sha).toMatch(/^[0-9a-f]{40}$/);
    // validated candidate == reviewed candidate.
    expect(durableReview.reviewed_sha).toBe(durableCandidate.candidate_sha);
    // Full configured validation succeeded for that candidate. The review
    // *decision* is intentionally not asserted here: it changes every review
    // cycle, and publication gating is covered by computeConvergenceStatus.
    for (const command of durableValidation.commands) {
      expect(command.exit_code, `${command.command} must exit 0`).toBe(0);
    }
  });

  it("keeps publicationResult a standing gate, not a frozen per-candidate verdict (Tests U, X, Y)", () => {
    expect(evidence.publicationResult).toMatch(/Approved/);
    expect(evidence.publicationResult.toLowerCase()).toContain("exact head");
    // No frozen candidate SHA literal in the publication result.
    expect(evidence.publicationResult).not.toMatch(/[0-9a-f]{40}/);
  });
});
