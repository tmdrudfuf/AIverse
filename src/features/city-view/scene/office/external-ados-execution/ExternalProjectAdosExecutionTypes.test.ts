import { describe, expect, it } from "vitest";
import { deriveExecutionPublicationReadiness } from "./ExternalProjectAdosExecutionTypes";
import type { ExternalProjectAdosExecution } from "./ExternalProjectAdosExecutionTypes";

type Readiness = NonNullable<ExternalProjectAdosExecution["evidence"]["childRunTechnicalReadiness"]>;

const validReadiness: Readiness = {
  childRunId: "run-2026-01-01T00:00:00.000Z",
  candidateSha: "a".repeat(40),
  reviewDecision: "Approved",
  validatedMatchesCandidate: true,
  reviewedMatchesCandidate: true,
  exactHeadMatch: true,
  ready: true,
};

function executionWithReadiness(readiness: Readiness | undefined): ExternalProjectAdosExecution {
  return {
    id: "p:run",
    projectId: "p",
    preparationId: "p:prep",
    developmentRequestDraftId: "p:draft",
    status: "Completed",
    durableAdosRunId: readiness?.childRunId,
    featureBranch: "codex/x",
    authoritativeBaseSha: "base",
    specPath: "specs/x/spec.md",
    repositoryPath: "repo",
    worktreePath: "worktree",
    validationCommands: [],
    reviewerCommand: "codex exec -",
    executionPolicyVersion: 1,
    trustedLocalExecutionApproved: true,
    startedBy: "Local Human",
    startedAt: "2026-01-01T00:00:00.000Z",
    implementerStarted: true,
    validationStarted: false,
    reviewStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    publishStarted: false,
    mergeStarted: false,
    deployStarted: false,
    evidence: {
      providerId: "external-ados-child-run",
      agentId: "Claude",
      role: "Implementer",
      commandDisplay: "orchestrate",
      workingDirectory: "worktree",
      started: true,
      completed: true,
      timedOut: false,
      cancelled: false,
      durationMs: 5,
      stdoutSummary: "",
      stderrSummary: "",
      outputTruncated: false,
      childRunTechnicalReadiness: readiness,
    },
    rulesVersion: "external-ados-execution-v1",
  };
}

describe("deriveExecutionPublicationReadiness", () => {
  it("is not ready with no execution at all", () => {
    expect(deriveExecutionPublicationReadiness(undefined)).toMatchObject({ ready: false });
  });

  it("is not ready when the execution's evidence never performed the child-run boundary", () => {
    expect(deriveExecutionPublicationReadiness(executionWithReadiness(undefined))).toMatchObject({ ready: false });
  });

  it("is ready when every conjunct genuinely holds", () => {
    expect(deriveExecutionPublicationReadiness(executionWithReadiness(validReadiness))).toMatchObject({ ready: true });
  });

  // The core re-verification proof: a precomputed `ready: true` flag must
  // never be trusted on its own. This function recomputes readiness from
  // the other fields, so a readiness object that lies about its own `ready`
  // flag while a real conjunct (the review decision) disagrees is still
  // correctly read as not-ready.
  it("ignores a precomputed ready:true flag when the review decision disagrees", () => {
    const readiness = { ...validReadiness, ready: true, reviewDecision: "Changes Requested" as const };
    expect(deriveExecutionPublicationReadiness(executionWithReadiness(readiness))).toMatchObject({ ready: false });
  });

  it("is not ready when validatedMatchesCandidate is false", () => {
    const readiness = { ...validReadiness, validatedMatchesCandidate: false };
    expect(deriveExecutionPublicationReadiness(executionWithReadiness(readiness))).toMatchObject({ ready: false });
  });

  it("is not ready when reviewedMatchesCandidate is false", () => {
    const readiness = { ...validReadiness, reviewedMatchesCandidate: false };
    expect(deriveExecutionPublicationReadiness(executionWithReadiness(readiness))).toMatchObject({ ready: false });
  });

  it("is not ready when exactHeadMatch is false", () => {
    const readiness = { ...validReadiness, exactHeadMatch: false };
    expect(deriveExecutionPublicationReadiness(executionWithReadiness(readiness))).toMatchObject({ ready: false });
  });

  it("is not ready when candidateSha is not a real 40-hex commit SHA", () => {
    const readiness = { ...validReadiness, candidateSha: "" };
    expect(deriveExecutionPublicationReadiness(executionWithReadiness(readiness))).toMatchObject({ ready: false });
  });
});
