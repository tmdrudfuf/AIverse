import { createExecutionPlanId, EXECUTION_PLAN_RULES_VERSION } from "../execution-plans/ExecutionPlanTypes";
import { createExecutionReadinessId, EXECUTION_READINESS_RULES_VERSION } from "../execution-readiness/ExecutionReadinessTypes";
import { createHumanExecutionApprovalId, HUMAN_EXECUTION_APPROVAL_RULES_VERSION } from "../human-execution-approvals/HumanExecutionApprovalTypes";
import {
  createImplementerRuntimeId,
  createImplementerRuntimeResultId,
  IMPLEMENTER_RUNTIME_RULES_VERSION,
} from "../implementer-runtime/ImplementerRuntimeTypes";
import { createReviewTargetId, REVIEW_TARGET_RULES_VERSION } from "../reviewer-runtime/ReviewTarget";
import {
  createReviewerRuntimeId,
  createReviewerRuntimeResultId,
  REVIEWER_RUNTIME_RULES_VERSION,
} from "../reviewer-runtime/ReviewerRuntimeTypes";
import { createRuntimePreflightId, RUNTIME_PREFLIGHT_RULES_VERSION } from "../runtime-preflight/RuntimePreflightTypes";
import { createRuntimeStartId, RUNTIME_START_RULES_VERSION } from "../runtime-start/RuntimeStartTypes";
import {
  REVIEW_PROMOTION_APPROVED_IMPLEMENTER_AGENT,
  REVIEW_PROMOTION_APPROVED_REVIEWER_AGENT,
  type ReviewDecisionInput,
  type ReviewPromotionReasonCode,
} from "./ReviewDecisionTypes";

// The one focused, provider-neutral chain-integrity validator (see
// .agent-workflow/spec-078-chain-integrity-audit.md). Every stage from
// Execution Plan through Reviewer Runtime Result is checked here for both (1)
// linkage to the exact current upstream context and (2) internal validity of
// its own deterministic identity and rules version. ReviewDecisionService
// consumes this as a single call rather than growing its own mirrored list of
// per-field checks (see review.md, Round 10 P1-001 and later).
//
// Every check below recomputes a record's id using the same canonical
// create*Id helper its creation service already uses, and compares its
// rulesVersion field against the same canonical *_RULES_VERSION constant its
// creation service already writes -- no id formula or rules-version constant
// is duplicated as an inline string anywhere in this file.
export function validateReviewRuntimeChainIntegrity(input: ReviewDecisionInput): ReviewPromotionReasonCode | undefined {
  return (
    validatePlan(input) ??
    validateReadiness(input) ??
    validateApproval(input) ??
    validatePreflight(input) ??
    validateRuntimeStart(input) ??
    validateImplementerRuntime(input) ??
    validateReviewTarget(input) ??
    validateReviewerRuntime(input)
  );
}

// Also used by ReviewDecisionService.promote()'s precondition 3, which
// validates the live requesting actor rather than a historical chain record --
// the same actor-format rule applies to both, so both consume this one
// implementation.
export function getActorBlockReason(actor: string | undefined): ReviewPromotionReasonCode | undefined {
  const normalized = actor?.trim().toLowerCase();
  if (!normalized || /(codex|claude|agent|bot|automation|workflow)/.test(normalized)) {
    return "REVIEW_PROMOTION_INVALID_ACTOR";
  }
  return undefined;
}

function validatePlan(input: ReviewDecisionInput): ReviewPromotionReasonCode | undefined {
  const plan = input.executionPlan;
  if (!plan || plan.projectId !== input.projectId) return "REVIEW_PROMOTION_PLAN_INVALID";
  if (
    plan.planId !== createExecutionPlanId(plan.projectId, plan.activeSessionId) ||
    plan.rulesVersion !== EXECUTION_PLAN_RULES_VERSION
  ) {
    return "REVIEW_PROMOTION_PLAN_INVALID";
  }
  return undefined;
}

function validateReadiness(input: ReviewDecisionInput): ReviewPromotionReasonCode | undefined {
  const plan = input.executionPlan!;
  const readiness = input.readiness;
  const readinessResult = input.readinessResult;

  if (!readiness || !readinessResult || readiness.status !== "Ready" || readinessResult.status !== "Ready") {
    return "REVIEW_PROMOTION_READINESS_NOT_READY";
  }
  if (readiness.projectId !== plan.projectId || readinessResult.projectId !== plan.projectId) {
    return "REVIEW_PROMOTION_READINESS_NOT_READY";
  }
  if (readiness.executionPlanId !== plan.planId || readinessResult.executionPlanId !== plan.planId) {
    return "REVIEW_PROMOTION_READINESS_NOT_READY";
  }
  if (
    readiness.readinessId !== createExecutionReadinessId(plan.projectId, plan.planId) ||
    readiness.rulesVersion !== EXECUTION_READINESS_RULES_VERSION
  ) {
    return "REVIEW_PROMOTION_READINESS_NOT_READY";
  }
  if (readinessResult.readinessId !== readiness.readinessId) {
    return "REVIEW_PROMOTION_READINESS_NOT_READY";
  }
  return undefined;
}

function validateApproval(input: ReviewDecisionInput): ReviewPromotionReasonCode | undefined {
  const plan = input.executionPlan!;
  const readiness = input.readiness!;
  const approval = input.approval;

  if (!approval || approval.projectId !== plan.projectId || approval.executionPlanId !== plan.planId || !approval.executionApproved) {
    return "REVIEW_PROMOTION_APPROVAL_STALE";
  }
  if (
    approval.approvalId !== createHumanExecutionApprovalId(plan.projectId, plan.planId) ||
    approval.rulesVersion !== HUMAN_EXECUTION_APPROVAL_RULES_VERSION
  ) {
    return "REVIEW_PROMOTION_APPROVAL_STALE";
  }
  if (approval.readinessId !== readiness.readinessId) return "REVIEW_PROMOTION_APPROVAL_STALE";
  if (getActorBlockReason(approval.approvedBy)) return "REVIEW_PROMOTION_INVALID_ACTOR";
  return undefined;
}

function validatePreflight(input: ReviewDecisionInput): ReviewPromotionReasonCode | undefined {
  const plan = input.executionPlan!;
  const approval = input.approval!;
  const preflight = input.preflight;
  const preflightResult = input.preflightResult;

  if (
    !preflight || !preflightResult ||
    preflight.projectId !== plan.projectId || preflightResult.projectId !== plan.projectId ||
    preflight.preflightId !== createRuntimePreflightId(plan.projectId, plan.planId) ||
    preflight.rulesVersion !== RUNTIME_PREFLIGHT_RULES_VERSION ||
    preflight.status !== "Ready" || preflightResult.status !== "Ready" ||
    !preflight.runtimePreflightPassed || !preflightResult.runtimePreflightPassed
  ) {
    return "REVIEW_PROMOTION_PREFLIGHT_NOT_READY";
  }
  if (preflight.approvalId !== approval.approvalId) return "REVIEW_PROMOTION_PREFLIGHT_NOT_READY";
  if (preflightResult.preflightId !== preflight.preflightId) return "REVIEW_PROMOTION_PREFLIGHT_NOT_READY";
  return undefined;
}

function validateRuntimeStart(input: ReviewDecisionInput): ReviewPromotionReasonCode | undefined {
  const plan = input.executionPlan!;
  const approval = input.approval!;
  const preflight = input.preflight!;
  const runtimeStart = input.runtimeStart;
  const runtimeStartResult = input.runtimeStartResult;

  if (!runtimeStart || !runtimeStartResult) return "REVIEW_PROMOTION_START_STALE";
  if (runtimeStart.projectId !== plan.projectId || runtimeStartResult.projectId !== plan.projectId) {
    return "REVIEW_PROMOTION_START_STALE";
  }
  if (
    runtimeStart.runtimeStartId !== createRuntimeStartId(plan.projectId, plan.planId) ||
    runtimeStart.rulesVersion !== RUNTIME_START_RULES_VERSION ||
    (runtimeStartResult.status !== "Started" && runtimeStartResult.status !== "AlreadyStarted")
  ) {
    return "REVIEW_PROMOTION_START_STALE";
  }
  if (runtimeStartResult.runtimeStartId !== runtimeStart.runtimeStartId) return "REVIEW_PROMOTION_START_STALE";
  if (runtimeStart.repositoryId !== plan.repositoryId) return "REVIEW_PROMOTION_START_STALE";
  if (
    runtimeStart.executionPlanId !== plan.planId ||
    runtimeStart.humanExecutionApprovalId !== approval.approvalId ||
    runtimeStart.runtimePreflightId !== preflight.preflightId ||
    runtimeStart.taskId !== plan.projectTaskId ||
    runtimeStart.confirmedAssignmentId !== plan.confirmedAssignmentId ||
    runtimeStart.preparedSessionId !== plan.preparedSessionId ||
    runtimeStart.activeSessionId !== plan.activeSessionId ||
    runtimeStart.employeeId !== plan.employeeId
  ) {
    return "REVIEW_PROMOTION_START_STALE";
  }
  if (runtimeStart.worktreePath !== plan.worktreePath || runtimeStart.repositoryRoot !== plan.repositoryPath) {
    return "REVIEW_PROMOTION_START_STALE";
  }
  if (runtimeStart.branch !== plan.branchName || runtimeStart.specificationPath !== plan.specPath) {
    return "REVIEW_PROMOTION_START_STALE";
  }
  if (
    runtimeStart.validationCommands.length !== plan.validationCommands.length ||
    runtimeStart.validationCommands.some((command, index) => command !== plan.validationCommands[index])
  ) {
    return "REVIEW_PROMOTION_START_STALE";
  }
  if (
    runtimeStart.mutationScope.length !== plan.allowedMutationScope.length ||
    runtimeStart.mutationScope.some((scope, index) => scope !== plan.allowedMutationScope[index])
  ) {
    return "REVIEW_PROMOTION_START_STALE";
  }
  return undefined;
}

function validateImplementerRuntime(input: ReviewDecisionInput): ReviewPromotionReasonCode | undefined {
  const plan = input.executionPlan!;
  const runtimeStart = input.runtimeStart!;
  const implementerRuntime = input.implementerRuntime;
  const implementerRuntimeResult = input.implementerRuntimeResult;

  if (!implementerRuntime || !implementerRuntimeResult) return "REVIEW_PROMOTION_IMPLEMENTER_MISSING";
  if (implementerRuntime.projectId !== plan.projectId || implementerRuntimeResult.projectId !== plan.projectId) {
    return "REVIEW_PROMOTION_IMPLEMENTER_MISSING";
  }
  if (implementerRuntime.runtimeStartId !== runtimeStart.runtimeStartId) {
    return "REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED";
  }
  if (
    implementerRuntime.implementerRuntimeId !== createImplementerRuntimeId(plan.projectId, runtimeStart.runtimeStartId) ||
    implementerRuntime.rulesVersion !== IMPLEMENTER_RUNTIME_RULES_VERSION
  ) {
    return "REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED";
  }
  if (implementerRuntime.status !== "Completed" || implementerRuntimeResult.status !== "Completed") {
    return "REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED";
  }
  if (implementerRuntime.repositoryId !== plan.repositoryId) {
    return "REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED";
  }
  if (implementerRuntime.worktreePath !== plan.worktreePath || implementerRuntime.branch !== plan.branchName) {
    return "REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED";
  }
  if (implementerRuntime.specificationPath !== plan.specPath) {
    return "REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED";
  }
  if (
    implementerRuntimeResult.id !== createImplementerRuntimeResultId(plan.projectId, runtimeStart.runtimeStartId) ||
    implementerRuntimeResult.rulesVersion !== IMPLEMENTER_RUNTIME_RULES_VERSION
  ) {
    return "REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED";
  }
  if (
    implementerRuntimeResult.executionPlanId !== plan.planId ||
    implementerRuntimeResult.runtimeStartId !== runtimeStart.runtimeStartId ||
    implementerRuntimeResult.implementerRuntimeId !== implementerRuntime.implementerRuntimeId
  ) {
    return "REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED";
  }
  if (implementerRuntime.reviewerStarted || implementerRuntime.validationStarted || implementerRuntime.githubMutationStarted) {
    return "REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED";
  }

  if (
    plan.implementerAgent !== input.approval!.implementerAgent ||
    plan.reviewerAgent !== input.approval!.reviewerAgent ||
    plan.implementerAgent !== runtimeStart.implementer ||
    plan.reviewerAgent !== runtimeStart.reviewer ||
    plan.implementerAgent !== implementerRuntime.implementer ||
    plan.reviewerAgent !== implementerRuntime.reviewer
  ) {
    return "REVIEW_PROMOTION_ROLE_MISMATCH";
  }
  if (
    implementerRuntime.approvedImplementerAgent !== REVIEW_PROMOTION_APPROVED_IMPLEMENTER_AGENT ||
    implementerRuntime.approvedReviewerAgent !== REVIEW_PROMOTION_APPROVED_REVIEWER_AGENT
  ) {
    return "REVIEW_PROMOTION_ROLE_MISMATCH";
  }
  return undefined;
}

function validateReviewTarget(input: ReviewDecisionInput): ReviewPromotionReasonCode | undefined {
  const plan = input.executionPlan!;
  const runtimeStart = input.runtimeStart!;
  const implementerRuntime = input.implementerRuntime!;
  const reviewTarget = input.reviewTarget;

  if (!reviewTarget) return "REVIEW_PROMOTION_TARGET_MISMATCH";
  if (
    reviewTarget.projectId !== plan.projectId ||
    reviewTarget.runtimeStartId !== runtimeStart.runtimeStartId ||
    reviewTarget.implementerRuntimeId !== implementerRuntime.implementerRuntimeId ||
    reviewTarget.repositoryId !== plan.repositoryId
  ) {
    return "REVIEW_PROMOTION_TARGET_MISMATCH";
  }
  if (
    reviewTarget.worktreePath !== plan.worktreePath ||
    reviewTarget.featureBranch !== plan.branchName ||
    reviewTarget.specificationPath !== plan.specPath
  ) {
    return "REVIEW_PROMOTION_TARGET_MISMATCH";
  }
  // A target the policy cannot honestly call committed and clean can never
  // back an Approved promotion -- mirrors ReviewerRuntimeService.validateReviewTarget's
  // clean-working-tree guard (see ReviewTarget.ts, "Exact-HEAD Gate").
  if (reviewTarget.workingTreeState !== "Clean") return "REVIEW_PROMOTION_TARGET_MISMATCH";
  if (
    reviewTarget.reviewTargetId !==
      createReviewTargetId(plan.projectId, runtimeStart.runtimeStartId, reviewTarget.reviewTargetSha) ||
    reviewTarget.rulesVersion !== REVIEW_TARGET_RULES_VERSION
  ) {
    return "REVIEW_PROMOTION_TARGET_MISMATCH";
  }
  // mergeBaseSha and baseSha have no independent canonical helper of their own
  // (see .agent-workflow/spec-078-chain-integrity-audit.md, stage 7); every
  // real construction path holds them equal, so divergence is itself a
  // tamper/staleness signal.
  if (reviewTarget.mergeBaseSha !== reviewTarget.baseSha) return "REVIEW_PROMOTION_TARGET_MISMATCH";
  return undefined;
}

function validateReviewerRuntime(input: ReviewDecisionInput): ReviewPromotionReasonCode | undefined {
  const plan = input.executionPlan!;
  const runtimeStart = input.runtimeStart!;
  const implementerRuntime = input.implementerRuntime!;
  const reviewTarget = input.reviewTarget!;
  const reviewerRuntime = input.reviewerRuntime;
  const reviewerRuntimeResult = input.reviewerRuntimeResult;

  if (!reviewerRuntime) return "REVIEW_PROMOTION_REVIEWER_MISSING";
  if (
    reviewerRuntime.projectId !== plan.projectId ||
    reviewerRuntime.runtimeStartId !== runtimeStart.runtimeStartId ||
    reviewerRuntime.implementerRuntimeId !== implementerRuntime.implementerRuntimeId ||
    reviewerRuntime.reviewTargetId !== reviewTarget.reviewTargetId ||
    reviewerRuntime.worktreePath !== plan.worktreePath ||
    reviewerRuntime.branch !== plan.branchName ||
    reviewerRuntime.specificationPath !== plan.specPath
  ) {
    return "REVIEW_PROMOTION_REVIEWER_STALE";
  }
  if (
    reviewerRuntime.reviewerRuntimeId !== createReviewerRuntimeId(plan.projectId, reviewTarget.reviewTargetId) ||
    reviewerRuntime.rulesVersion !== REVIEWER_RUNTIME_RULES_VERSION
  ) {
    return "REVIEW_PROMOTION_REVIEWER_STALE";
  }
  if (
    reviewerRuntime.implementer !== plan.implementerAgent ||
    reviewerRuntime.reviewer !== plan.reviewerAgent ||
    reviewerRuntime.approvedImplementerAgent !== REVIEW_PROMOTION_APPROVED_IMPLEMENTER_AGENT ||
    reviewerRuntime.approvedReviewerAgent !== REVIEW_PROMOTION_APPROVED_REVIEWER_AGENT
  ) {
    return "REVIEW_PROMOTION_ROLE_MISMATCH";
  }
  if (
    !reviewerRuntimeResult ||
    reviewerRuntimeResult.reviewerRuntimeId !== reviewerRuntime.reviewerRuntimeId ||
    reviewerRuntimeResult.projectId !== plan.projectId ||
    reviewerRuntimeResult.status !== reviewerRuntime.status ||
    reviewerRuntimeResult.decision !== reviewerRuntime.decision
  ) {
    // Mirrors the Implementer Runtime chain's own runtime/result status
    // parity check above -- the Reviewer Runtime Result must describe the
    // exact same outcome as its Reviewer Runtime record, not merely share its
    // id, before that outcome can back an Approved classification or a
    // granted Promote (see review.md P1-001).
    return "REVIEW_PROMOTION_REVIEWER_NOT_COMPLETED";
  }
  if (
    reviewerRuntimeResult.runtimeStartId !== runtimeStart.runtimeStartId ||
    reviewerRuntimeResult.implementerRuntimeId !== implementerRuntime.implementerRuntimeId
  ) {
    return "REVIEW_PROMOTION_REVIEWER_NOT_COMPLETED";
  }
  if (
    reviewerRuntimeResult.id !== createReviewerRuntimeResultId(plan.projectId, reviewTarget.reviewTargetId) ||
    reviewerRuntimeResult.rulesVersion !== REVIEWER_RUNTIME_RULES_VERSION
  ) {
    // Round 10 P1-001: a malformed reviewerRuntimeResult.id or an unsupported
    // rulesVersion must block promotion even when every linkage field above
    // matches (see .agent-workflow/spec-078-chain-integrity-audit.md, stage 9).
    return "REVIEW_PROMOTION_REVIEWER_NOT_COMPLETED";
  }
  return undefined;
}
