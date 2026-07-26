import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { buildRunSummary } from "./runSummary.js";

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "run-summary-test-"));
}

function baseState(overrides: Record<string, unknown> = {}) {
  return {
    featureId: "054-review-run-summary-audit-trail",
    featureName: "Review Run Summary and Audit Trail",
    baseBranch: "main",
    results: [],
    ...overrides,
  };
}

describe("buildRunSummary: planned (no run started)", () => {
  it("reports status planned and no fabricated activity", () => {
    const summary = buildRunSummary(baseState());
    expect(summary.schemaVersion).toBe(1);
    expect(summary.run.status).toBe("planned");
    expect(summary.run.stopReason).toBeNull();
    expect(summary.run.runId).toBeNull();
    expect(summary.roles.implementer.agentId).toBeNull();
    expect(summary.roles.reviewer.agentId).toBeNull();
    expect(summary.stageTimeline).toEqual([]);
    expect(summary.validation.status).toBe("not-run");
    expect(summary.review.finalDecision).toBe("Unknown");
    expect(summary.findings.opened).toBe(0);
    expect(summary.humanGate.ready).toBe(false);
    expect(summary.humanGate.required).toBe(false);
    expect(summary.artifacts).toEqual([]);
    expect(summary.warnings).toEqual([]);
  });
});

describe("buildRunSummary: clean approved run", () => {
  const runDirRelative = ".agent-workflow/runs/054-review-run-summary-audit-trail";

  function approvedState(cwd: string) {
    const runDir = path.join(cwd, runDirRelative);
    fs.mkdirSync(runDir, { recursive: true });
    for (const name of [
      "implement-claude-execution.md", "implement-claude-result.md", "validate-validation.md",
      "review-independent-review-execution.md", "review-independent-review-result.md",
      "final-verification-validation.md",
    ]) {
      fs.writeFileSync(path.join(runDir, name), "fixture content", "utf8");
    }
    fs.writeFileSync(
      path.join(runDir, "review-structured-review.json"),
      JSON.stringify({ schemaVersion: 1, decision: "approved", blockingFindings: [], nonBlockingFindings: [], questions: [] }),
      "utf8",
    );
    const p = (name: string) => `${runDirRelative}/${name}`;
    return baseState({
      orchestration: {
        currentStage: "human-merge-decision",
        startedAt: "2026-07-26T00:00:00.000Z",
        updatedAt: "2026-07-26T00:05:00.000Z",
        resolvedImplementerId: "claude",
        resolvedReviewerId: "codex",
        roleResolutionSource: "cli-override",
        implementerIdentity: "Claude Code CLI",
        reviewerIdentity: "OpenAI Codex CLI",
        terminalState: "human-merge-decision",
        decision: "Ready for human merge decision",
      },
      orchestrationRuns: [
        { stage: "implement", status: "completed", path: p("implement-claude-execution.md"), resultPath: p("implement-claude-result.md") },
      ],
      validationRuns: [
        { stage: "validate", command: "npm test", status: "passed", exitCode: 0, durationMs: 1000, path: p("validate-validation.md") },
        { stage: "final-verification", command: "npm test", status: "passed", exitCode: 0, durationMs: 900, path: p("final-verification-validation.md") },
      ],
      reviewRuns: [
        {
          stage: "review",
          outcome: "Approved",
          reviewerId: "codex",
          structuredReviewStatus: "valid",
          structuredReviewDecision: "Approved",
          executionPath: p("review-independent-review-execution.md"),
          resultPath: p("review-independent-review-result.md"),
          structuredReviewPath: p("review-structured-review.json"),
        },
      ],
      latestReviewDecision: "Approved",
      latestStructuredReviewStatus: "valid",
      questionCycle: 0,
      fixCycleCount: 0,
    });
  }

  it("reports awaiting-human-decision with humanGate.ready true", () => {
    const cwd = createTempDir();
    const summary = buildRunSummary(approvedState(cwd), { cwd });
    expect(summary.run.status).toBe("awaiting-human-decision");
    expect(summary.run.stopReason).toBeNull();
    expect(summary.roles).toEqual({
      implementer: { agentId: "claude", displayName: "Claude Code CLI" },
      reviewer: { agentId: "codex", displayName: "OpenAI Codex CLI" },
      source: "cli-override",
    });
    expect(summary.review.finalDecision).toBe("Approved");
    expect(summary.review.structuredReviewStatus).toBe("valid");
    expect(summary.validation.status).toBe("passed");
    expect(summary.findings.remainingBlocking).toBe(0);
    expect(summary.warnings).toEqual([]);
    expect(summary.humanGate.ready).toBe(true);
    expect(summary.humanGate.state).toBe("ready-for-merge-decision");
    expect(summary.humanGate.required).toBe(true);
  });

  it("downgrades readiness with a warning when the final review's evidence artifact is missing", () => {
    const cwd = createTempDir();
    const state = approvedState(cwd);
    fs.rmSync(path.join(cwd, runDirRelative, "review-independent-review-result.md"));
    const summary = buildRunSummary(state, { cwd });
    expect(summary.humanGate.ready).toBe(false);
    expect(summary.warnings.some((w: { code: string }) => w.code === "missing-or-malformed-artifact")).toBe(true);
  });

  it("builds a correctly-ordered stage timeline: implement -> validate -> review -> final-verification", () => {
    const cwd = createTempDir();
    const summary = buildRunSummary(approvedState(cwd), { cwd });
    expect(summary.stageTimeline.map((entry: any) => entry.stage)).toEqual([
      "implement",
      "validate",
      "review",
      "final-verification",
    ]);
    expect(summary.stageTimeline[2].role).toBe("reviewer");
    expect(summary.stageTimeline[2].agentId).toBe("codex");
    expect(summary.stageTimeline[2].result).toBe("Approved");
    expect(summary.execution.stagesCompleted).toEqual(["implement", "validate", "review", "final-verification"]);
  });

  it("indexes artifacts without duplicates, in stage order, normalized run-directory-relative", () => {
    const cwd = createTempDir();
    const summary = buildRunSummary(approvedState(cwd), { cwd });
    expect(summary.artifacts).toEqual([
      "implement-claude-execution.md",
      "implement-claude-result.md",
      "validate-validation.md",
      "review-independent-review-execution.md",
      "review-independent-review-result.md",
      "review-structured-review.json",
      "final-verification-validation.md",
    ]);
  });

  it("is deterministic across repeated calls on unchanged state", () => {
    const cwd = createTempDir();
    const state = approvedState(cwd);
    const first = JSON.stringify(buildRunSummary(state, { cwd }));
    const second = JSON.stringify(buildRunSummary(state, { cwd }));
    expect(first).toBe(second);
  });
});

describe("buildRunSummary: multi-command validation stages", () => {
  it("preserves every command's artifact and reports the failing command's status, not the first command's", () => {
    const cwd = createTempDir();
    const runDir = path.join(cwd, ".agent-workflow/runs/054-review-run-summary-audit-trail");
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(path.join(runDir, "implement-execution.md"), "fixture", "utf8");
    fs.writeFileSync(path.join(runDir, "implement-result.md"), "fixture", "utf8");
    fs.writeFileSync(path.join(runDir, "validate-1.md"), "fixture", "utf8");
    fs.writeFileSync(path.join(runDir, "validate-2.md"), "fixture", "utf8");
    const p = (name: string) => `.agent-workflow/runs/054-review-run-summary-audit-trail/${name}`;

    const state = baseState({
      orchestration: { currentStage: "blocked", startedAt: "2026-07-26T00:00:00.000Z", reason: "validate failed: npx tsc --noEmit", terminalState: "blocked" },
      orchestrationRuns: [{ stage: "implement", status: "completed", path: p("implement-execution.md"), resultPath: p("implement-result.md") }],
      validationRuns: [
        { stage: "validate", command: "npm test", status: "passed", exitCode: 0, path: p("validate-1.md") },
        { stage: "validate", command: "npx tsc --noEmit", status: "failed", exitCode: 1, path: p("validate-2.md") },
      ],
    });

    const summary = buildRunSummary(state, { cwd });
    const validateEntries = summary.stageTimeline.filter((e: any) => e.stage === "validate");
    expect(validateEntries).toHaveLength(1);
    expect(validateEntries[0].status).toBe("failed");
    expect(validateEntries[0].artifactPaths).toEqual(["validate-1.md", "validate-2.md"]);
    expect(summary.artifacts).toContain("validate-1.md");
    expect(summary.artifacts).toContain("validate-2.md");
  });

  it("preserves every command's artifact for a fully passing multi-command stage", () => {
    const cwd = createTempDir();
    const runDir = path.join(cwd, ".agent-workflow/runs/054-review-run-summary-audit-trail");
    fs.mkdirSync(runDir, { recursive: true });
    for (const name of ["implement-execution.md", "implement-result.md", "validate-1.md", "validate-2.md", "validate-3.md"]) {
      fs.writeFileSync(path.join(runDir, name), "fixture", "utf8");
    }
    const p = (name: string) => `.agent-workflow/runs/054-review-run-summary-audit-trail/${name}`;

    const state = baseState({
      orchestration: { currentStage: "blocked", startedAt: "2026-07-26T00:00:00.000Z", reason: "Reviewer returned Unknown", terminalState: "blocked" },
      orchestrationRuns: [{ stage: "implement", status: "completed", path: p("implement-execution.md"), resultPath: p("implement-result.md") }],
      validationRuns: [
        { stage: "validate", command: "npm test", status: "passed", exitCode: 0, path: p("validate-1.md") },
        { stage: "validate", command: "npx tsc --noEmit", status: "passed", exitCode: 0, path: p("validate-2.md") },
        { stage: "validate", command: "npm run build", status: "passed", exitCode: 0, path: p("validate-3.md") },
      ],
      latestReviewDecision: "Unknown",
    });

    const summary = buildRunSummary(state, { cwd });
    const validateEntries = summary.stageTimeline.filter((e: any) => e.stage === "validate");
    expect(validateEntries).toHaveLength(1);
    expect(validateEntries[0].status).toBe("passed");
    expect(validateEntries[0].artifactPaths).toEqual(["validate-1.md", "validate-2.md", "validate-3.md"]);
  });

  it("separates two fully-passing revalidate occurrences using batchId, across two fix cycles", () => {
    const cwd = createTempDir();
    const runDir = path.join(cwd, ".agent-workflow/runs/054-review-run-summary-audit-trail");
    fs.mkdirSync(runDir, { recursive: true });
    const names = [
      "implement-execution.md", "implement-result.md",
      "validate-1.md",
      "fix1-execution.md", "fix1-result.md", "revalidate1a.md", "revalidate1b.md",
      "fix2-execution.md", "fix2-result.md", "revalidate2a.md", "revalidate2b.md",
      "final-verification.md",
    ];
    for (const name of names) fs.writeFileSync(path.join(runDir, name), "fixture", "utf8");
    const p = (name: string) => `.agent-workflow/runs/054-review-run-summary-audit-trail/${name}`;

    const state = baseState({
      orchestration: {
        currentStage: "human-merge-decision",
        startedAt: "2026-07-26T00:00:00.000Z",
        updatedAt: "2026-07-26T00:20:00.000Z",
        resolvedImplementerId: "claude",
        resolvedReviewerId: "codex",
        roleResolutionSource: "cli-override",
      },
      orchestrationRuns: [
        { stage: "implement", status: "completed", path: p("implement-execution.md"), resultPath: p("implement-result.md") },
        { stage: "fix", status: "completed", path: p("fix1-execution.md"), resultPath: p("fix1-result.md") },
        { stage: "fix", status: "completed", path: p("fix2-execution.md"), resultPath: p("fix2-result.md") },
      ],
      validationRuns: [
        { stage: "validate", batchId: 1, command: "npm test", status: "passed", path: p("validate-1.md") },
        { stage: "revalidate", batchId: 2, command: "npm test", status: "passed", path: p("revalidate1a.md") },
        { stage: "revalidate", batchId: 2, command: "npx tsc --noEmit", status: "passed", path: p("revalidate1b.md") },
        { stage: "revalidate", batchId: 3, command: "npm test", status: "passed", path: p("revalidate2a.md") },
        { stage: "revalidate", batchId: 3, command: "npx tsc --noEmit", status: "passed", path: p("revalidate2b.md") },
        { stage: "final-verification", batchId: 4, command: "npm test", status: "passed", path: p("final-verification.md") },
      ],
      reviewRuns: [
        { stage: "review", outcome: "Changes Requested", reviewerId: "codex", structuredReviewStatus: "valid" },
        { stage: "re-review", outcome: "Changes Requested", reviewerId: "codex", structuredReviewStatus: "valid" },
        { stage: "re-review", outcome: "Approved", reviewerId: "codex", structuredReviewStatus: "valid" },
      ],
      latestReviewDecision: "Approved",
      fixCycleCount: 2,
    });

    const summary = buildRunSummary(state, { cwd });
    expect(summary.stageTimeline.map((e: any) => e.stage)).toEqual([
      "implement", "validate", "review", "fix", "revalidate", "re-review", "fix", "revalidate", "re-review", "final-verification",
    ]);
    const revalidateEntries = summary.stageTimeline.filter((e: any) => e.stage === "revalidate");
    expect(revalidateEntries).toHaveLength(2);
    expect(revalidateEntries[0].artifactPaths).toEqual(["revalidate1a.md", "revalidate1b.md"]);
    expect(revalidateEntries[1].artifactPaths).toEqual(["revalidate2a.md", "revalidate2b.md"]);
    expect(revalidateEntries[0].attempt).toBe(1);
    expect(revalidateEntries[1].attempt).toBe(2);
  });
});

describe("buildRunSummary: never reports false success", () => {
  it("reports failed/validation-failed when validation fails", () => {
    const state = baseState({
      orchestration: { currentStage: "blocked", startedAt: "2026-07-26T00:00:00.000Z", reason: "validate failed: npm test", terminalState: "blocked" },
      orchestrationRuns: [{ stage: "implement", status: "completed", path: "a.md", resultPath: "b.md" }],
      validationRuns: [{ stage: "validate", command: "npm test", status: "failed", exitCode: 1, path: "validate.md" }],
    });
    const summary = buildRunSummary(state);
    expect(summary.run.status).toBe("failed");
    expect(summary.run.stopReason).toBe("validation-failed");
    expect(summary.validation.status).toBe("failed");
    expect(summary.humanGate.ready).toBe(false);
    expect(summary.review.finalDecision).not.toBe("Approved");
  });

  it("reports timed-out/timeout when the Reviewer times out", () => {
    const state = baseState({
      orchestration: { currentStage: "blocked", startedAt: "2026-07-26T00:00:00.000Z", reason: "Reviewer returned Timed Out", terminalState: "blocked" },
      reviewRuns: [{ stage: "review", outcome: "Timed Out", reviewerId: "codex", structuredReviewStatus: "invalid", structuredReviewDecision: "Unknown" }],
      latestReviewDecision: "Timed Out",
    });
    const summary = buildRunSummary(state);
    expect(summary.run.status).toBe("timed-out");
    expect(summary.run.stopReason).toBe("timeout");
    expect(summary.humanGate.ready).toBe(false);
    expect(summary.review.finalDecision).not.toBe("Approved");
  });

  it("reports review-decision-unknown, never Approved, for an Unknown decision", () => {
    const state = baseState({
      orchestration: { currentStage: "blocked", startedAt: "2026-07-26T00:00:00.000Z", reason: "Reviewer returned Unknown", terminalState: "blocked" },
      reviewRuns: [{ stage: "review", outcome: "Unknown", reviewerId: "codex", structuredReviewStatus: "invalid", structuredReviewDecision: "Unknown" }],
      latestReviewDecision: "Unknown",
      latestStructuredReviewStatus: "invalid",
    });
    const summary = buildRunSummary(state);
    expect(summary.run.stopReason).toBe("review-decision-unknown");
    expect(summary.review.finalDecision).toBe("Unknown");
    expect(summary.review.structuredReviewStatus).toBe("invalid");
    expect(summary.humanGate.ready).toBe(false);
  });

  it("reports structured-review-invalid for invalid finding lifecycle data, never Approved", () => {
    const state = baseState({
      orchestration: {
        currentStage: "blocked",
        startedAt: "2026-07-26T00:00:00.000Z",
        reason: "Finding lifecycle invalid: Valid structured lifecycle data is required when previous structured findings exist.",
        terminalState: "blocked",
      },
      reviewRuns: [{ stage: "review", outcome: "Changes Requested", reviewerId: "codex", structuredReviewStatus: "invalid", structuredReviewDecision: "Unknown" }],
      latestReviewDecision: "Changes Requested",
    });
    const summary = buildRunSummary(state);
    expect(summary.run.stopReason).toBe("structured-review-invalid");
    expect(summary.humanGate.ready).toBe(false);
  });

  it("reports changes-requested-limit-reached at the fix-cycle limit", () => {
    const state = baseState({
      orchestration: { currentStage: "blocked", startedAt: "2026-07-26T00:00:00.000Z", reason: "Maximum fix cycles reached", terminalState: "blocked" },
      fixCycleCount: 2,
    });
    const summary = buildRunSummary(state);
    expect(summary.run.stopReason).toBe("changes-requested-limit-reached");
    expect(summary.humanGate.ready).toBe(false);
  });

  it("reports reviewer-questions-unresolved at the question-cycle limit", () => {
    const state = baseState({
      orchestration: { currentStage: "blocked", startedAt: "2026-07-26T00:00:00.000Z", reason: "Maximum question cycles reached", terminalState: "blocked" },
      questionCycle: 1,
    });
    const summary = buildRunSummary(state);
    expect(summary.run.stopReason).toBe("reviewer-questions-unresolved");
    expect(summary.humanGate.ready).toBe(false);
  });
});

describe("buildRunSummary: question and fix cycle tracking", () => {
  it("reports correct question/fix cycle counts and finding lifecycle aggregates", () => {
    const state = baseState({
      orchestration: {
        currentStage: "human-merge-decision",
        startedAt: "2026-07-26T00:00:00.000Z",
        updatedAt: "2026-07-26T00:10:00.000Z",
        resolvedImplementerId: "claude",
        resolvedReviewerId: "codex",
        roleResolutionSource: "cli-override",
      },
      orchestrationRuns: [
        { stage: "implement", status: "completed", path: "i1.md", resultPath: "i1r.md" },
        { stage: "answer-questions", status: "completed", path: "aq.md", resultPath: "aqr.md" },
        { stage: "fix", status: "completed", path: "f1.md", resultPath: "f1r.md" },
      ],
      validationRuns: [
        { stage: "validate", status: "passed", path: "v1.md" },
        { stage: "revalidate", status: "passed", path: "v2.md" },
        { stage: "final-verification", status: "passed", path: "v3.md" },
      ],
      reviewRuns: [
        { stage: "review", outcome: "Questions", reviewerId: "codex", structuredReviewStatus: "valid", structuredReviewDecision: "Questions" },
        { stage: "final-review", outcome: "Changes Requested", reviewerId: "codex", structuredReviewStatus: "valid", structuredReviewDecision: "Changes Requested" },
        { stage: "re-review", outcome: "Approved", reviewerId: "codex", structuredReviewStatus: "valid", structuredReviewDecision: "Approved" },
      ],
      questionCycle: 1,
      fixCycleCount: 1,
      findingHistory: [
        {
          findingId: "F1",
          kind: "blocking",
          severity: "P1",
          summary: "resolved roles are lost after first step",
          currentStatus: "resolved",
          firstSeenReviewSequence: 1,
          resolvedReviewSequence: 2,
          latestReviewArtifactPath: "final-review-independent-review-result.md",
        },
      ],
      latestReviewDecision: "Approved",
    });

    const summary = buildRunSummary(state);
    expect(summary.review.questionCycles).toBe(1);
    expect(summary.review.fixCycles).toBe(1);
    expect(summary.review.reviewAttempts).toBe(3);
    expect(summary.findings.opened).toBe(1);
    expect(summary.findings.resolved).toBe(1);
    expect(summary.findings.remainingBlocking).toBe(0);
    expect(summary.findings.items[0]).toMatchObject({
      findingId: "F1",
      status: "resolved",
      openedReviewAttempt: 1,
      resolvedReviewAttempt: 2,
    });
    expect(summary.stageTimeline.map((e: any) => e.stage)).toEqual([
      "implement", "validate", "review", "answer-questions", "final-review", "fix", "revalidate", "re-review", "final-verification",
    ]);
  });
});

describe("buildRunSummary: validation skipped vs not-run", () => {
  it("reports skipped when orchestration.validationSkipped is set", () => {
    const summary = buildRunSummary(baseState({ orchestration: { startedAt: "2026-07-26T00:00:00.000Z", currentStage: "review", validationSkipped: true } }));
    expect(summary.validation.status).toBe("skipped");
  });

  it("reports not-run when validation simply has not happened yet", () => {
    const summary = buildRunSummary(baseState({ orchestration: { startedAt: "2026-07-26T00:00:00.000Z", currentStage: "implement" } }));
    expect(summary.validation.status).toBe("not-run");
  });

  it("does not let a stale earlier 'passed' record mask the current occurrence being skipped", () => {
    // Simulates a resumed run: an earlier validate occurrence genuinely
    // passed, but the latest (e.g. final-verification) occurrence was
    // explicitly skipped via --skip-validation. The current occurrence's
    // skip must not be hidden behind the earlier unrelated "passed" record.
    const summary = buildRunSummary(baseState({
      orchestration: { startedAt: "2026-07-26T00:00:00.000Z", currentStage: "human-merge-decision", validationSkipped: true },
      validationRuns: [{ stage: "validate", status: "passed", path: "validate.md" }],
      reviewRuns: [{ stage: "review", outcome: "Approved", reviewerId: "codex" }],
      latestReviewDecision: "Approved",
    }));
    expect(summary.validation.status).toBe("skipped");
    expect(summary.humanGate.ready).toBe(false);
  });
});

describe("buildRunSummary: role fallback chain", () => {
  it("falls back to latestResolvedRoles when orchestration lacks pinned roles", () => {
    const summary = buildRunSummary(baseState({
      latestResolvedRoles: { implementer: "codex", reviewer: "claude" },
      latestRoleResolutionSource: "default",
    }));
    expect(summary.roles.implementer.agentId).toBe("codex");
    expect(summary.roles.reviewer.agentId).toBe("claude");
    expect(summary.roles.source).toBe("default");
  });

  it("does not fabricate role source when no role information exists at all", () => {
    const summary = buildRunSummary(baseState());
    expect(summary.roles.source).toBeNull();
  });
});

describe("buildRunSummary: secret safety", () => {
  it("never copies raw validation stdout/stderr into the summary", () => {
    const state = baseState({
      orchestration: { currentStage: "blocked", startedAt: "2026-07-26T00:00:00.000Z", reason: "validate failed: npm test", terminalState: "blocked" },
      validationRuns: [{
        stage: "validate",
        command: "npm test",
        status: "failed",
        exitCode: 1,
        path: "validate.md",
        stdout: "irrelevant",
        stderr: "GITHUB_TOKEN=ghp_supersecrettoken123 leaked in this log line",
      }],
    });
    const summary = buildRunSummary(state);
    const serialized = JSON.stringify(summary);
    expect(serialized).not.toContain("ghp_supersecrettoken123");
    expect(serialized).not.toContain("GITHUB_TOKEN");
  });

  it("redacts secret-bearing env assignments and recognizable tokens from validation command text", () => {
    const state = baseState({
      orchestration: { currentStage: "blocked", startedAt: "2026-07-26T00:00:00.000Z", reason: "validate failed: npm test", terminalState: "blocked" },
      validationRuns: [
        { stage: "validate", command: "MY_API_TOKEN=abc123supersecret npm test", status: "failed", exitCode: 1, path: "validate.md" },
        { stage: "validate", command: "curl -H \"Authorization: Bearer ghp_abcdefghijklmnopqrstuvwxyz012345\"", status: "passed", exitCode: 0, path: "validate2.md" },
      ],
    });
    const summary = buildRunSummary(state);
    expect(summary.validation.commands[0].command).toContain("MY_API_TOKEN=***REDACTED***");
    expect(summary.validation.commands[0].command).not.toContain("abc123supersecret");
    expect(summary.validation.commands[1].command).not.toContain("ghp_abcdefghijklmnopqrstuvwxyz012345");
  });
});

describe("buildRunSummary: artifact path safety", () => {
  it("omits and warns instead of emitting a path-traversal artifact path outside the run directory", () => {
    const state = baseState({
      findingHistory: [{
        findingId: "F1",
        kind: "blocking",
        severity: "P1",
        currentStatus: "resolved",
        firstSeenReviewSequence: 1,
        resolvedReviewSequence: 2,
        latestReviewArtifactPath: "../../outside-run-directory.md",
      }],
    });
    const summary = buildRunSummary(state);
    expect(summary.findings.items[0].artifactPaths).toEqual([]);
    expect(summary.warnings.some((w: { code: string }) => w.code === "artifact-path-outside-run-directory")).toBe(true);
  });

  it("omits and warns instead of emitting an absolute cross-drive artifact path", () => {
    // path.relative() returns an unchanged absolute (drive-qualified) path,
    // not a "../"-prefixed one, when the two paths are on different Windows
    // drives. Simulate that case deterministically via a spy, since it
    // cannot be reproduced reliably without a genuine second drive.
    const relativeSpy = vi.spyOn(path, "relative").mockReturnValueOnce("D:\\other-drive\\outside.md");
    const state = baseState({
      findingHistory: [{
        findingId: "F2",
        kind: "blocking",
        severity: "P1",
        currentStatus: "resolved",
        firstSeenReviewSequence: 1,
        resolvedReviewSequence: 2,
        latestReviewArtifactPath: "some/path.md",
      }],
    });
    const summary = buildRunSummary(state);
    relativeSpy.mockRestore();
    expect(summary.findings.items[0].artifactPaths).toEqual([]);
    expect(summary.warnings.some((w: { code: string }) => w.code === "artifact-path-outside-run-directory")).toBe(true);
  });
});

describe("buildRunSummary: missing/malformed optional artifacts", () => {
  it("does not crash and adds a warning when a referenced execution artifact is missing", () => {
    const cwd = createTempDir();
    const state = baseState({
      orchestration: { currentStage: "blocked", startedAt: "2026-07-26T00:00:00.000Z", reason: "Reviewer returned Execution Failed", terminalState: "blocked" },
      reviewRuns: [{ stage: "review", outcome: "Execution Failed", reviewerId: "codex", executionPath: "does-not-exist-execution.md" }],
      latestReviewDecision: "Execution Failed",
    });
    const summary = buildRunSummary(state, { cwd });
    expect(summary.run.status).toBe("blocked");
    expect(summary.run.stopReason).toBe("command-failed");
    expect(summary.warnings.length).toBeGreaterThan(0);
    expect(summary.warnings[0].code).toBe("missing-or-malformed-artifact");
  });

  it("refines status to timed-out when the referenced execution artifact proves a timeout", () => {
    const cwd = createTempDir();
    const executionPath = "review-independent-review-execution.md";
    fs.writeFileSync(path.join(cwd, executionPath), JSON.stringify({ timedOut: true }), "utf8");
    const state = baseState({
      orchestration: { currentStage: "blocked", startedAt: "2026-07-26T00:00:00.000Z", reason: "Reviewer returned Execution Failed", terminalState: "blocked" },
      reviewRuns: [{ stage: "review", outcome: "Execution Failed", reviewerId: "codex", executionPath }],
      latestReviewDecision: "Execution Failed",
    });
    const summary = buildRunSummary(state, { cwd });
    expect(summary.run.status).toBe("timed-out");
    expect(summary.run.stopReason).toBe("timeout");
    expect(summary.warnings).toEqual([]);
  });

  it("does not crash and adds a warning when a referenced validation artifact is missing", () => {
    const cwd = createTempDir();
    const state = baseState({
      orchestration: { currentStage: "blocked", startedAt: "2026-07-26T00:00:00.000Z", reason: "validate failed: npm test", terminalState: "blocked" },
      validationRuns: [{ stage: "validate", command: "npm test", status: "failed", exitCode: 1, path: "does-not-exist-validation.md" }],
    });
    const summary = buildRunSummary(state, { cwd });
    expect(summary.validation.commands[0].artifactPath).toBeNull();
    expect(summary.warnings.some((w: { code: string }) => w.code === "missing-or-malformed-artifact")).toBe(true);
  });

  it("reports the validation artifact path, normalized, when it exists", () => {
    const cwd = createTempDir();
    const runDir = path.join(cwd, ".agent-workflow/runs/054-review-run-summary-audit-trail");
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(path.join(runDir, "validate.md"), "fixture", "utf8");
    const state = baseState({
      orchestration: { currentStage: "blocked", startedAt: "2026-07-26T00:00:00.000Z", reason: "validate failed: npm test", terminalState: "blocked" },
      validationRuns: [{ stage: "validate", command: "npm test", status: "failed", exitCode: 1, path: ".agent-workflow/runs/054-review-run-summary-audit-trail/validate.md" }],
    });
    const summary = buildRunSummary(state, { cwd });
    expect(summary.validation.commands[0].artifactPath).toBe("validate.md");
    expect(summary.warnings).toEqual([]);
  });
});

describe("buildRunSummary: commit provenance", () => {
  it("reports unknown/null commit evidence rather than fabricating a match", () => {
    const summary = buildRunSummary(baseState());
    expect(summary.commits.implementationCommit).toBeNull();
    expect(summary.commits.reviewedCommit).toBeNull();
    expect(summary.commits.exactCommitMatch).toBe("unknown");
    expect(summary.review.exactReviewedCommitMatch).toBe("unknown");
  });

  it("reports the supplied current branch head when provided by the caller", () => {
    const summary = buildRunSummary(baseState(), { currentBranchHead: "abc123def456" });
    expect(summary.commits.currentBranchHead).toBe("abc123def456");
  });
});

describe("buildRunSummary: backward compatibility with legacy state", () => {
  it("produces a safe partial summary for an old state file with no Spec 052/053/054 fields", () => {
    const legacyState = {
      featureId: "010-some-old-feature",
      featureName: "Some Old Feature",
      currentBranch: "codex/some-old-feature",
      baseBranch: "main",
      results: [{ stage: "implement", decision: undefined }],
    };
    expect(() => buildRunSummary(legacyState)).not.toThrow();
    const summary = buildRunSummary(legacyState);
    expect(summary.schemaVersion).toBe(1);
    expect(summary.run.status).toBe("planned");
    expect(summary.roles.source).toBeNull();
    expect(summary.findings.items).toEqual([]);
  });

  it("never drops a legacy stage-less reviewRuns entry, even when no implement record exists", () => {
    const legacyState = {
      featureId: "010-legacy-review-only",
      baseBranch: "main",
      results: [],
      orchestration: { currentStage: "blocked", startedAt: "2026-01-01T00:00:00.000Z", reason: "Reviewer returned Approved", terminalState: "blocked" },
      reviewRuns: [{ outcome: "Approved", reviewerId: "codex" }],
    };
    const summary = buildRunSummary(legacyState);
    expect(summary.review.reviewAttempts).toBe(1);
    expect(summary.stageTimeline).toHaveLength(1);
    expect(summary.stageTimeline[0]).toMatchObject({ stage: "unknown", role: null, agentId: null, result: "Approved" });
  });
});

describe("buildRunSummary: consistent artifact evidence verification", () => {
  it("warns when a stage-timeline artifact (not just review/validation evidence) is missing", () => {
    const cwd = createTempDir();
    const state = baseState({
      orchestration: { currentStage: "blocked", startedAt: "2026-07-26T00:00:00.000Z", reason: "implement execution failed", terminalState: "blocked" },
      orchestrationRuns: [{ stage: "implement", status: "failed", path: "does-not-exist-implement.md", resultPath: "does-not-exist-result.md" }],
    });
    const summary = buildRunSummary(state, { cwd });
    const missingWarnings = summary.warnings.filter((w: { code: string }) => w.code === "missing-or-malformed-artifact");
    expect(missingWarnings.length).toBeGreaterThanOrEqual(2);
  });

  it("warns when a finding's artifact reference is missing", () => {
    const cwd = createTempDir();
    const state = baseState({
      findingHistory: [{
        findingId: "F1",
        kind: "blocking",
        severity: "P1",
        currentStatus: "resolved",
        firstSeenReviewSequence: 1,
        resolvedReviewSequence: 2,
        latestReviewArtifactPath: "does-not-exist-finding.md",
      }],
    });
    const summary = buildRunSummary(state, { cwd });
    expect(summary.warnings.some((w: { code: string }) => w.code === "missing-or-malformed-artifact")).toBe(true);
  });

  it("does not treat malformed structured review content as Approved-ready", () => {
    const cwd = createTempDir();
    const runDir = path.join(cwd, ".agent-workflow/runs/054-review-run-summary-audit-trail");
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(path.join(runDir, "review-result.md"), "fixture", "utf8");
    fs.writeFileSync(path.join(runDir, "structured-review.json"), "{ not valid json", "utf8");
    const state = baseState({
      orchestration: {
        currentStage: "human-merge-decision",
        startedAt: "2026-07-26T00:00:00.000Z",
        updatedAt: "2026-07-26T00:05:00.000Z",
        resolvedImplementerId: "claude",
        resolvedReviewerId: "codex",
        roleResolutionSource: "cli-override",
      },
      orchestrationRuns: [{ stage: "implement", status: "completed" }],
      validationRuns: [{ stage: "validate", status: "passed" }, { stage: "final-verification", status: "passed" }],
      reviewRuns: [{
        stage: "review",
        outcome: "Approved",
        reviewerId: "codex",
        structuredReviewStatus: "valid",
        resultPath: ".agent-workflow/runs/054-review-run-summary-audit-trail/review-result.md",
        structuredReviewPath: ".agent-workflow/runs/054-review-run-summary-audit-trail/structured-review.json",
      }],
      latestReviewDecision: "Approved",
    });
    const summary = buildRunSummary(state, { cwd });
    expect(summary.humanGate.ready).toBe(false);
    expect(summary.warnings.some((w: { code: string }) => w.code === "missing-or-malformed-artifact")).toBe(true);
  });
});
