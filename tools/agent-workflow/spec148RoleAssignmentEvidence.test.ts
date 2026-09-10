import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { resolveEffectiveRoles } from "./roleResolver.js";
import { CONVERGENCE_STATUSES, computeConvergenceStatus } from "./reviewConvergence.js";
// Shared, test-only helper: derives the candidate/validated/reviewed SHA
// alignment of the publication gate from a durable run directory with the SAME
// production comparator (validationPolicy.js `targetsMatch`) and folds it for
// the real reviewConvergence.js `computeConvergenceStatus`. Used here over the
// run's own durable records AND over a deterministic real-SHA fixture triple
// (authoritative requirement 23: the review runtime is a process boundary).
import {
  CONFIGURED_VALIDATION_COMMANDS,
  convergenceForAlignment,
  deriveDurableAlignment,
} from "./spec148DurableAlignment.js";

// Spec 148 - Adaptive agent role and exact-candidate-ownership evidence
// (authoritative requirements 10, 11; Required Tests P-W, and part of X/U).
//
// This is the review / validation / exact-HEAD / publication stage of the one
// demonstrated controlled cycle (its earlier stages are in
// AutonomousCompanyOperationsE2E.test.ts) - it runs the real agent-workflow
// enforcement modules against the run's durable ADOS records, both directions,
// unconditionally. It is not a separate post-handoff concern.
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
  shaAlignment: {
    staleApprovalReuseAllowed: boolean;
    candidateOwner: string;
    observedCycles: Array<{
      candidateSha: string;
      validatedSha: string;
      reviewedSha: string;
      candidateEqualsValidatedEqualsReviewed: boolean;
      exactHeadAlignedAtObservation: boolean;
      reviewDecision: string;
      converged: boolean;
    }>;
  };
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
// durableValidation / durableReview back the observedCycles cross-check below;
// the exact-HEAD publication gate reads the full triple through the shared
// deriveDurableAlignment instead.
const durableValidation = readJsonIfPresent(new URL("validation-runtime.json", runDir)) as
  | {
      head_before: string;
      head_after: string;
      status?: string;
      commands: Array<{ command: string; exit_code: number; timed_out?: boolean }>;
    }
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

  // The durable/resumed ADOS role path is authoritative per requirement 10, so
  // it must enforce the same guards as a fresh resolution - not wave through
  // whatever roles are pinned.
  it("rejects durable/resumed roles that put one agent in both seats (no self-review from ADOS state) (Tests P, W)", () => {
    const result = resolveEffectiveRoles({
      state: {},
      existingRunRoles: { implementer: "claude", reviewer: "claude", source: "resume" },
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.join(" ")).toContain("review its own candidate");
  });

  it("blocks a resumed run whose durable Codex reviewer runtime is unavailable (Tests Q, V)", () => {
    const result = resolveEffectiveRoles({
      state: { agentRunners: { codex: { enabled: false } } },
      existingRunRoles: { implementer: "claude", reviewer: "codex", source: "resume" },
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.join(" ").toLowerCase()).toContain("codex");
  });

  it("preserves valid durable Claude implementer / Codex reviewer roles on resume (Tests P, Q, R)", () => {
    const result = resolveEffectiveRoles({
      state: {},
      existingRunRoles: { implementer: "claude", reviewer: "codex", source: "cli-override" },
    });
    expect(result.ok).toBe(true);
    expect(result.roles).toEqual({ implementer: "claude", reviewer: "codex" });
    expect(result.roles?.implementer).not.toBe(result.roles?.reviewer);
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

  it("enforces validated == reviewed == exact HEAD from the run's own durable ADOS state before publication (Tests S, U, X)", () => {
    // The run's own durable records, read through the shared
    // `deriveDurableAlignment` (pipeline order candidate -> validate -> review;
    // each SHA leg derived with the production comparator validationPolicy.js
    // `targetsMatch`; criterion 19 full-command-set assertion on any PASS
    // record; throws on a later-stage file without its earlier sibling). The
    // publication gate then runs UNCONDITIONALLY over the result: an absent leg
    // leaves its match false so the assertion is "must not authorize
    // publication".
    const exactHead = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    expect(exactHead).toMatch(/^[0-9a-f]{40}$/);

    const alignment = deriveDurableAlignment(fileURLToPath(runDir), exactHead);
    const status = convergenceForAlignment(alignment);

    if (alignment.decision === "Approved" && alignment.allAligned) {
      // The converged publication state, over real durable records: candidate ==
      // validated == reviewed == exact HEAD and an Approved independent review.
      expect(status).toBe(CONVERGENCE_STATUSES.CONVERGED);
    } else {
      // Non-Approved or non-aligned: a SPECIFIC non-converged status, and the
      // tracked evidence keeps publicationResult a standing "Blocked until ..."
      // gate. On the branch's current HEAD every SHA leg is aligned
      // (candidate/validation/review all name exact HEAD) and only the review
      // decision - "Changes Requested" while this candidate is under review -
      // holds the gate below CONVERGED.
      const expected = alignment.hasReview
        ? CONVERGENCE_STATUSES.IN_PROGRESS   // "Changes Requested", or a stale/trailing reviewed_sha
        : CONVERGENCE_STATUSES.NOT_STARTED;  // clean checkout, no review attempt yet
      expect(status).toBe(expected);
      expect(status).not.toBe(CONVERGENCE_STATUSES.CONVERGED);
      expect(evidence.publicationResult).toMatch(/^Blocked until\b/);
    }

    expect(evidence.shaAlignment.candidateOwner).toBe("claude");
    expect(evidence.shaAlignment.staleApprovalReuseAllowed).toBe(false);
  });

  it("exercises the publication-gate biconditional over a real-SHA durable triple: converges only on an Approved review aligned on candidate == validated == reviewed == exact HEAD (Tests U, T, W)", () => {
    // Unit coverage of the shared `deriveDurableAlignment` +
    // `convergenceForAlignment` path over realistic durable-shaped records.
    // Authoritative requirement 23: the review runtime is a process boundary in
    // the same category as the implementer spawn and the Spec 143 suggestion
    // provider - a deterministic durable record set may stand in for it while
    // the REAL enforcement code runs over it. Real git SHAs, written as real
    // durable-shaped JSON in a temp run dir, read back through the SAME
    // `deriveDurableAlignment` + `convergenceForAlignment` path the live check
    // above uses - never a hand-built options object, never a write into the
    // live .agent-workflow run dir. This is not a claim that a completed
    // converged cycle exists for this candidate: that gate (acceptance criteria
    // 19-20) is satisfied only when the real independent Codex review of this
    // exact candidate returns Approved, which cannot be recorded inside the
    // candidate under review.
    const exactHead = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    const ancestor = execFileSync("git", ["rev-parse", "HEAD~1"], { encoding: "utf8" }).trim();
    const dir = mkdtempSync(join(tmpdir(), "spec148-converged-"));
    const write = (name: string, body: unknown): void =>
      writeFileSync(join(dir, name), `${JSON.stringify(body, null, 2)}\n`);
    const passingValidation = (sha: string) => ({
      head_before: sha,
      head_after: sha,
      status: "PASS",
      commands: CONFIGURED_VALIDATION_COMMANDS.map((command) => ({ command, exit_code: 0, timed_out: false })),
    });

    try {
      // Positive: candidate == validated == reviewed == exact HEAD + Approved
      // -> the real computeConvergenceStatus reaches CONVERGED.
      write("candidate.json", { candidate_sha: exactHead, changed_files: [], status: "COMMITTED" });
      write("validation-runtime.json", passingValidation(exactHead));
      write("review-runtime.json", { reviewed_sha: exactHead, status: "PASS", decision: "Approved" });
      let alignment = deriveDurableAlignment(dir, exactHead);
      expect(alignment.allAligned).toBe(true);
      expect(convergenceForAlignment(alignment)).toBe(CONVERGENCE_STATUSES.CONVERGED);

      // Negative 1 - same aligned SHAs, review decision "Changes Requested":
      // the gate refuses on the decision alone.
      write("review-runtime.json", { reviewed_sha: exactHead, status: "PASS", decision: "Changes Requested" });
      alignment = deriveDurableAlignment(dir, exactHead);
      expect(alignment.allAligned).toBe(true);
      expect(convergenceForAlignment(alignment)).toBe(CONVERGENCE_STATUSES.IN_PROGRESS);
      expect(convergenceForAlignment(alignment)).not.toBe(CONVERGENCE_STATUSES.CONVERGED);

      // Negative 2 - Approved, but reviewed against a stale ancestor SHA: no
      // stale approval authorizes a newer candidate.
      write("review-runtime.json", { reviewed_sha: ancestor, status: "PASS", decision: "Approved" });
      alignment = deriveDurableAlignment(dir, exactHead);
      expect(alignment.reviewedMatchesHead).toBe(false);
      expect(alignment.allAligned).toBe(false);
      expect(convergenceForAlignment(alignment)).not.toBe(CONVERGENCE_STATUSES.CONVERGED);

      // Negative 3 - no review attempt yet: NOT_STARTED, never a self-review
      // fallback to CONVERGED.
      rmSync(join(dir, "review-runtime.json"));
      alignment = deriveDurableAlignment(dir, exactHead);
      expect(alignment.hasReview).toBe(false);
      expect(convergenceForAlignment(alignment)).toBe(CONVERGENCE_STATUSES.NOT_STARTED);

      // Tampering - a later pipeline stage present without its earlier sibling
      // throws rather than silently deriving a pass.
      rmSync(join(dir, "validation-runtime.json"));
      write("review-runtime.json", { reviewed_sha: exactHead, status: "PASS", decision: "Approved" });
      expect(() => deriveDurableAlignment(dir, exactHead)).toThrow(/pipeline order/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("records completed ADOS cycles as non-forgeable historical SHA observations (Tests S, T, U)", () => {
    // Requirement 21 asks for candidate/validated/reviewed SHA "where available".
    // Each observedCycles entry is a COMPLETED cycle recorded when the evidence
    // was authored - a historical fact about an already-finished candidate, not a
    // per-candidate verdict frozen ahead of the gate. These assertions make the
    // rows non-forgeable:
    //   - every recorded SHA is 40-hex and is exact HEAD or an ancestor of it
    //     (permanent branch history - never goes stale, never leads HEAD);
    //   - a row may only claim `converged` on an Approved decision;
    //   - when the durable review-runtime.json still names a recorded cycle's
    //     reviewed SHA, its decision must equal the one recorded.
    const cycles = evidence.shaAlignment.observedCycles;
    expect(Array.isArray(cycles)).toBe(true);
    expect(cycles.length).toBeGreaterThan(0);

    const exactHead = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    const isAncestorOrEqual = (sha: string): boolean => {
      if (sha === exactHead) return true;
      try {
        execFileSync("git", ["merge-base", "--is-ancestor", sha, exactHead]);
        return true;
      } catch {
        return false;
      }
    };

    for (const cycle of cycles) {
      for (const sha of [cycle.candidateSha, cycle.validatedSha, cycle.reviewedSha]) {
        expect(sha).toMatch(/^[0-9a-f]{40}$/);
        expect(isAncestorOrEqual(sha), `${sha} must be exact HEAD or an ancestor of it`).toBe(true);
      }
      if (cycle.candidateEqualsValidatedEqualsReviewed) {
        expect(cycle.validatedSha).toBe(cycle.candidateSha);
        expect(cycle.reviewedSha).toBe(cycle.candidateSha);
      }
      if (cycle.converged) {
        expect(cycle.reviewDecision).toBe("Approved");
        expect(cycle.exactHeadAlignedAtObservation).toBe(true);
      }
      // Cross-check against live durable state: if the durable review still
      // names this cycle's reviewed SHA, the recorded decision must match it.
      if (durableReview && durableReview.reviewed_sha === cycle.reviewedSha) {
        expect(durableReview.decision).toBe(cycle.reviewDecision);
      }
      // Same for the recorded full-validation claim: if the durable validation
      // record still names this cycle's validated SHA, it must be a PASS with
      // every command at exit 0 (skips harmlessly once ADOS writes a newer one).
      if (durableValidation && durableValidation.head_after === cycle.validatedSha) {
        expect(durableValidation.status).toBe("PASS");
        expect(durableValidation.commands.every((command) => command.exit_code === 0)).toBe(true);
      }
    }
  });

  it("keeps publicationResult a standing gate, not a frozen per-candidate verdict (Tests U, X, Y)", () => {
    expect(evidence.publicationResult).toMatch(/Approved/);
    expect(evidence.publicationResult.toLowerCase()).toContain("exact head");
    // No frozen candidate SHA literal in the publication result.
    expect(evidence.publicationResult).not.toMatch(/[0-9a-f]{40}/);
  });
});
