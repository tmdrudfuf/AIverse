import type { ReviewFixRequestInput, ReviewFixRequestResult } from "../review-fix-requests/ReviewFixRequestTypes";

export const REVIEW_FIX_PLAN_RULES_VERSION = "review-fix-plan-v1";

export type ReviewFixPlanStatus = "Planned" | "AlreadyPlanned" | "Blocked" | "Failed";

export type ReviewFixPlanReasonCode =
  | "REVIEW_FIX_PLAN_PLANNED"
  | "REVIEW_FIX_PLAN_ALREADY_PLANNED"
  | "REVIEW_FIX_PLAN_REQUEST_MISSING"
  | "REVIEW_FIX_PLAN_REQUEST_STALE"
  | "REVIEW_FIX_PLAN_REQUEST_BLOCKED"
  | "REVIEW_FIX_PLAN_TARGET_MISMATCH"
  | "REVIEW_FIX_PLAN_INVALID_ACTOR"
  | "REVIEW_FIX_PLAN_EXISTING_PLAN_MISMATCH"
  | "REVIEW_FIX_PLAN_INTERNAL_FAILURE";

export type ReviewFixPlanCommand = {
  projectId: string;
  reviewFixRequestId: string;
  actor: string;
  plannedAt: string;
};

export type ReviewFixPlan = {
  reviewFixPlanId: string;
  projectId: string;
  reviewFixRequestId: string;
  planId: string;
  readinessId: string;
  readinessResultId: string;
  approvalId: string;
  preflightId: string;
  preflightResultId: string;
  runtimeStartId: string;
  runtimeStartResultId: string;
  implementerRuntimeId: string;
  implementerRuntimeResultId: string;
  reviewerRuntimeId: string;
  reviewerRuntimeResultId: string;
  reviewTargetId: string;
  projectTaskId: string;
  candidateTaskId?: string;
  employeeId: string;
  repositoryId: string;
  worktreePath: string;
  branch: string;
  specificationPath: string;
  implementer: string;
  reviewer: string;
  approvedImplementerAgent: string;
  approvedReviewerAgent: string;
  validationCommands: string[];
  mutationScope: string[];
  decision: "ChangesRequested";
  blockingFindingCount: number;
  nonBlockingFindingCount: number;
  plannedBy: string;
  plannedAt: string;
  fixExecutionStarted: false;
  validationRuntimeStarted: false;
  codexStarted: false;
  claudeStarted: false;
  subprocessStarted: false;
  validationStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  rulesVersion: string;
};

export type ReviewFixPlanResult = {
  id: string;
  projectId: string;
  reviewFixRequestId?: string;
  reviewerRuntimeId?: string;
  reviewFixPlanId?: string;
  status: ReviewFixPlanStatus;
  planned: boolean;
  alreadyPlanned: boolean;
  reasonCodes: ReviewFixPlanReasonCode[];
  fixExecutionStarted: false;
  validationRuntimeStarted: false;
  codexStarted: false;
  claudeStarted: false;
  subprocessStarted: false;
  validationStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  resultAt: string;
  rulesVersion: string;
};

export type ReviewFixPlanCollection = {
  projectId: string;
  plans: ReviewFixPlan[];
  planCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type ReviewFixPlanResultCollection = {
  projectId: string;
  results: ReviewFixPlanResult[];
  resultCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type ReviewFixPlanInput = ReviewFixRequestInput & {
  latestFixRequestResult?: ReviewFixRequestResult;
  existingFixPlans?: ReviewFixPlanCollection;
  existingFixPlanResults?: ReviewFixPlanResultCollection;
};

export type ReviewFixPlanOutcome = {
  result: ReviewFixPlanResult;
  plan?: ReviewFixPlan;
  planCollection?: ReviewFixPlanCollection;
  resultCollection?: ReviewFixPlanResultCollection;
};

export function createReviewFixPlanId(
  projectId: string,
  reviewFixRequestId: string,
  rulesVersion = REVIEW_FIX_PLAN_RULES_VERSION,
) {
  return `${projectId}:review-fix-plan:${reviewFixRequestId}:${rulesVersion}`;
}

export function createReviewFixPlanResultId(
  projectId: string,
  reviewFixRequestId: string,
  rulesVersion = REVIEW_FIX_PLAN_RULES_VERSION,
) {
  return `${projectId}:review-fix-plan-result:${reviewFixRequestId}:${rulesVersion}`;
}

export function createReviewFixPlanCollection(input: Omit<ReviewFixPlanCollection, "plans" | "planCount"> & {
  plans: ReadonlyArray<ReviewFixPlan>;
}): ReviewFixPlanCollection {
  const plans = input.plans.map(copyReviewFixPlan);
  return { ...input, plans, planCount: plans.length };
}

export function createReviewFixPlanResultCollection(input: Omit<
  ReviewFixPlanResultCollection,
  "results" | "resultCount"
> & {
  results: ReadonlyArray<ReviewFixPlanResult>;
}): ReviewFixPlanResultCollection {
  const results = input.results.map(copyReviewFixPlanResult);
  return { ...input, results, resultCount: results.length };
}

export function copyReviewFixPlan(plan: ReviewFixPlan): ReviewFixPlan {
  return {
    ...plan,
    validationCommands: [...plan.validationCommands],
    mutationScope: [...plan.mutationScope],
  };
}

export function copyReviewFixPlanResult(result: ReviewFixPlanResult): ReviewFixPlanResult {
  return { ...result, reasonCodes: [...result.reasonCodes] };
}
