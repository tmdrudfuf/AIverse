import { describe, expect, it } from "vitest";

import {
  REVIEW_FIX_REQUEST_RULES_VERSION,
  copyReviewFixRequest,
  copyReviewFixRequestResult,
  createReviewFixRequestCollection,
  createReviewFixRequestId,
  createReviewFixRequestResultCollection,
  createReviewFixRequestResultId,
  type ReviewFixRequest,
  type ReviewFixRequestResult,
} from "./ReviewFixRequestTypes";

const request: ReviewFixRequest = {
  reviewFixRequestId: createReviewFixRequestId("project-1", "reviewer-1"),
  projectId: "project-1",
  planId: "plan-1",
  readinessId: "readiness-1",
  readinessResultId: "readiness-result-1",
  approvalId: "approval-1",
  preflightId: "preflight-1",
  preflightResultId: "preflight-result-1",
  runtimeStartId: "start-1",
  runtimeStartResultId: "start-result-1",
  implementerRuntimeId: "implementer-1",
  implementerRuntimeResultId: "implementer-result-1",
  reviewerRuntimeId: "reviewer-1",
  reviewerRuntimeResultId: "reviewer-result-1",
  reviewTargetId: "target-1",
  projectTaskId: "task-1",
  candidateTaskId: "candidate-1",
  employeeId: "employee-1",
  repositoryId: "repo-1",
  worktreePath: "C:/worktree",
  branch: "codex/079-review-fix-request-foundation",
  specificationPath: "specs/079-review-fix-request-foundation/spec.md",
  implementer: "Implementer",
  reviewer: "Reviewer",
  approvedImplementerAgent: "claude",
  approvedReviewerAgent: "codex",
  validationCommands: ["npm test", "npx tsc --noEmit"],
  mutationScope: ["local-worktree-only"],
  decision: "ChangesRequested",
  blockingFindingCount: 1,
  nonBlockingFindingCount: 0,
  requestedBy: "Local Human",
  requestedAt: "2026-08-05T00:00:00.000Z",
  fixExecutionStarted: false,
  validationRuntimeStarted: false,
  codexStarted: false,
  claudeStarted: false,
  subprocessStarted: false,
  validationStarted: false,
  repositoryMutationStarted: false,
  githubMutationStarted: false,
  rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION,
};

const result: ReviewFixRequestResult = {
  id: createReviewFixRequestResultId("project-1", "reviewer-1"),
  projectId: "project-1",
  reviewerRuntimeId: "reviewer-1",
  reviewFixRequestId: request.reviewFixRequestId,
  status: "Requested",
  requested: true,
  alreadyRequested: false,
  reasonCodes: ["REVIEW_FIX_REQUEST_REQUESTED"],
  fixExecutionStarted: false,
  validationRuntimeStarted: false,
  codexStarted: false,
  claudeStarted: false,
  subprocessStarted: false,
  validationStarted: false,
  repositoryMutationStarted: false,
  githubMutationStarted: false,
  resultAt: "2026-08-05T00:00:00.000Z",
  rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION,
};

describe("ReviewFixRequestTypes", () => {
  it("uses deterministic request and result identities", () => {
    expect(createReviewFixRequestId("project-1", "reviewer-1")).toBe(
      "project-1:review-fix-request:reviewer-1:review-fix-request-v1",
    );
    expect(createReviewFixRequestResultId("project-1", "reviewer-1")).toBe(
      "project-1:review-fix-request-result:reviewer-1:review-fix-request-v1",
    );
  });

  it("defensively copies requests, results, and collections", () => {
    const copiedRequest = copyReviewFixRequest(request);
    copiedRequest.validationCommands.push("npm run build");
    copiedRequest.mutationScope.push("remote");
    expect(request.validationCommands).toEqual(["npm test", "npx tsc --noEmit"]);
    expect(request.mutationScope).toEqual(["local-worktree-only"]);

    const copiedResult = copyReviewFixRequestResult(result);
    copiedResult.reasonCodes.push("REVIEW_FIX_REQUEST_ALREADY_REQUESTED");
    expect(result.reasonCodes).toEqual(["REVIEW_FIX_REQUEST_REQUESTED"]);

    const collection = createReviewFixRequestCollection({ projectId: "project-1", requests: [request], rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION });
    collection.requests[0].validationCommands.push("mutated");
    expect(request.validationCommands).toEqual(["npm test", "npx tsc --noEmit"]);

    const resultCollection = createReviewFixRequestResultCollection({ projectId: "project-1", results: [result], rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION });
    resultCollection.results[0].reasonCodes.push("REVIEW_FIX_REQUEST_INTERNAL_FAILURE");
    expect(result.reasonCodes).toEqual(["REVIEW_FIX_REQUEST_REQUESTED"]);
  });
});