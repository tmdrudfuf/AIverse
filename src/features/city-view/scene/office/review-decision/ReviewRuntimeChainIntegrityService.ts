import { createExecutionPlanId, EXECUTION_PLAN_RULES_VERSION } from "../execution-plans/ExecutionPlanTypes";
import {
  createExecutionReadinessId,
  createExecutionReadinessResultId,
  EXECUTION_READINESS_RULES_VERSION,
} from "../execution-readiness/ExecutionReadinessTypes";
import { createHumanExecutionApprovalId, HUMAN_EXECUTION_APPROVAL_RULES_VERSION } from "../human-execution-approvals/HumanExecutionApprovalTypes";
import {
  createImplementerRuntimeId,
  createImplementerRuntimeResultId,
  IMPLEMENTER_RUNTIME_RULES_VERSION,
} from "../implementer-runtime/ImplementerRuntimeTypes";
import {
  computeReviewTargetBaseSha,
  computeReviewTargetSha,
  createPostValidationReviewTargetId,
  createReviewTargetId,
  REVIEW_TARGET_BASE_BRANCH,
  REVIEW_TARGET_RULES_VERSION,
} from "../reviewer-runtime/ReviewTarget";
import {
  createReviewerRuntimeId,
  createReviewerRuntimeResultId,
  REVIEWER_RUNTIME_RULES_VERSION,
} from "../reviewer-runtime/ReviewerRuntimeTypes";
import {
  createRuntimePreflightId,
  createRuntimePreflightResultId,
  RUNTIME_PREFLIGHT_RULES_VERSION,
} from "../runtime-preflight/RuntimePreflightTypes";
import {
  createRuntimeStartId,
  createRuntimeStartResultId,
  RUNTIME_START_RULES_VERSION,
} from "../runtime-start/RuntimeStartTypes";
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
  // A malformed plan that already claims execution/subprocess/mutation activity
  // cannot back an Approved promotion -- the root record's own literal-false
  // lifecycle fields must still hold true at runtime, not merely at the type
  // level (see .agent-workflow/spec-077-078-lifecycle-safety-audit.md, #1).
  if (
    plan.executionStarted !== false ||
    plan.runtimeStarted !== false ||
    plan.subprocessStarted !== false ||
    plan.repositoryMutationStarted !== false ||
    plan.githubMutationStarted !== false
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
  if (
    readinessResult.id !== createExecutionReadinessResultId(plan.projectId, plan.planId) ||
    readinessResult.rulesVersion !== EXECUTION_READINESS_RULES_VERSION
  ) {
    return "REVIEW_PROMOTION_READINESS_NOT_READY";
  }
  if (
    readiness.activeSessionId !== plan.activeSessionId ||
    readiness.projectTaskId !== plan.projectTaskId ||
    readiness.confirmedAssignmentId !== plan.confirmedAssignmentId ||
    readiness.preparedSessionId !== plan.preparedSessionId ||
    readiness.employeeId !== plan.employeeId ||
    readiness.repositoryId !== plan.repositoryId
  ) {
    return "REVIEW_PROMOTION_READINESS_NOT_READY";
  }
  // Neither the Readiness record nor its Result may claim execution/agent/
  // mutation activity already started -- both carry the same literal-false
  // contract RuntimeStartService's own precondition re-derives independently
  // (see audit #2).
  if (
    readiness.executionApproved !== false ||
    readiness.executionStarted !== false ||
    readiness.agentStarted !== false ||
    readiness.repositoryMutationStarted !== false ||
    readiness.githubMutationStarted !== false ||
    readinessResult.executionApproved !== false ||
    readinessResult.executionStarted !== false ||
    readinessResult.agentStarted !== false ||
    readinessResult.repositoryMutationStarted !== false ||
    readinessResult.githubMutationStarted !== false
  ) {
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
  if (
    approval.activeSessionId !== plan.activeSessionId ||
    approval.projectTaskId !== plan.projectTaskId ||
    approval.confirmedAssignmentId !== plan.confirmedAssignmentId ||
    approval.preparedSessionId !== plan.preparedSessionId ||
    approval.employeeId !== plan.employeeId ||
    approval.repositoryId !== plan.repositoryId
  ) {
    return "REVIEW_PROMOTION_APPROVAL_STALE";
  }
  if (
    approval.validationCommands.length !== plan.validationCommands.length ||
    approval.validationCommands.some((command, index) => command !== plan.validationCommands[index]) ||
    approval.allowedMutationScope.length !== plan.allowedMutationScope.length ||
    approval.allowedMutationScope.some((scope, index) => scope !== plan.allowedMutationScope[index])
  ) {
    return "REVIEW_PROMOTION_APPROVAL_STALE";
  }
  if (getActorBlockReason(approval.approvedBy)) return "REVIEW_PROMOTION_INVALID_ACTOR";
  // An approval that claims execution/agent/mutation activity already started
  // is internally contradictory -- approval only grants permission to start,
  // it cannot itself be the record of having started (audit #3).
  if (
    approval.executionStarted !== false ||
    approval.agentStarted !== false ||
    approval.repositoryMutationStarted !== false ||
    approval.githubMutationStarted !== false
  ) {
    return "REVIEW_PROMOTION_APPROVAL_STALE";
  }
  return undefined;
}

function validatePreflight(input: ReviewDecisionInput): ReviewPromotionReasonCode | undefined {
  const plan = input.executionPlan!;
  const readiness = input.readiness!;
  const approval = input.approval!;
  const preflight = input.preflight;
  const preflightResult = input.preflightResult;

  if (
    !preflight || !preflightResult ||
    preflight.projectId !== plan.projectId || preflightResult.projectId !== plan.projectId ||
    preflight.executionPlanId !== plan.planId || preflightResult.executionPlanId !== plan.planId ||
    preflight.preflightId !== createRuntimePreflightId(plan.projectId, plan.planId) ||
    preflight.rulesVersion !== RUNTIME_PREFLIGHT_RULES_VERSION ||
    preflight.status !== "Ready" || preflightResult.status !== "Ready" ||
    !preflight.runtimePreflightPassed || !preflightResult.runtimePreflightPassed
  ) {
    return "REVIEW_PROMOTION_PREFLIGHT_NOT_READY";
  }
  if (preflight.readinessId !== readiness.readinessId) return "REVIEW_PROMOTION_PREFLIGHT_NOT_READY";
  if (preflight.approvalId !== approval.approvalId) return "REVIEW_PROMOTION_PREFLIGHT_NOT_READY";
  if (
    preflight.activeSessionId !== plan.activeSessionId ||
    preflight.projectTaskId !== plan.projectTaskId ||
    preflight.confirmedAssignmentId !== plan.confirmedAssignmentId ||
    preflight.preparedSessionId !== plan.preparedSessionId ||
    preflight.employeeId !== plan.employeeId ||
    preflight.repositoryId !== plan.repositoryId
  ) {
    return "REVIEW_PROMOTION_PREFLIGHT_NOT_READY";
  }
  if (preflightResult.preflightId !== preflight.preflightId) return "REVIEW_PROMOTION_PREFLIGHT_NOT_READY";
  if (
    preflightResult.readinessId !== readiness.readinessId ||
    preflightResult.approvalId !== approval.approvalId
  ) {
    return "REVIEW_PROMOTION_PREFLIGHT_NOT_READY";
  }
  if (
    preflightResult.id !== createRuntimePreflightResultId(plan.projectId, plan.planId) ||
    preflightResult.rulesVersion !== RUNTIME_PREFLIGHT_RULES_VERSION
  ) {
    return "REVIEW_PROMOTION_PREFLIGHT_NOT_READY";
  }
  // executionApproved must be carried through as true (Preflight runs only
  // after human approval); execution/agent/mutation activity must not have
  // started yet on either record -- same literal-false contract
  // RuntimeStartService's own precondition re-derives independently (audit #4).
  if (
    preflight.executionApproved !== true ||
    preflight.executionStarted !== false ||
    preflight.agentStarted !== false ||
    preflight.repositoryMutationStarted !== false ||
    preflight.githubMutationStarted !== false ||
    preflightResult.executionApproved !== true ||
    preflightResult.executionStarted !== false ||
    preflightResult.agentStarted !== false ||
    preflightResult.repositoryMutationStarted !== false ||
    preflightResult.githubMutationStarted !== false
  ) {
    return "REVIEW_PROMOTION_PREFLIGHT_NOT_READY";
  }
  return undefined;
}

function validateRuntimeStart(input: ReviewDecisionInput): ReviewPromotionReasonCode | undefined {
  const plan = input.executionPlan!;
  const approval = input.approval!;
  const preflight = input.preflight!;
  const readinessResult = input.readinessResult!;
  const runtimeStart = input.runtimeStart;
  const runtimeStartResult = input.runtimeStartResult;

  if (!runtimeStart || !runtimeStartResult) return "REVIEW_PROMOTION_START_STALE";
  if (runtimeStart.projectId !== plan.projectId || runtimeStartResult.projectId !== plan.projectId) {
    return "REVIEW_PROMOTION_START_STALE";
  }
  if (runtimeStartResult.executionPlanId !== plan.planId) return "REVIEW_PROMOTION_START_STALE";
  if (
    runtimeStart.runtimeStartId !== createRuntimeStartId(plan.projectId, plan.planId) ||
    runtimeStart.rulesVersion !== RUNTIME_START_RULES_VERSION ||
    (runtimeStartResult.status !== "Started" && runtimeStartResult.status !== "AlreadyStarted")
  ) {
    return "REVIEW_PROMOTION_START_STALE";
  }
  if (runtimeStartResult.runtimeStartId !== runtimeStart.runtimeStartId) return "REVIEW_PROMOTION_START_STALE";
  if (
    runtimeStartResult.id !== createRuntimeStartResultId(plan.projectId, plan.planId) ||
    runtimeStartResult.rulesVersion !== RUNTIME_START_RULES_VERSION
  ) {
    return "REVIEW_PROMOTION_START_STALE";
  }
  if (
    runtimeStartResult.runtimePreflightId !== preflight.preflightId ||
    runtimeStartResult.approvalId !== approval.approvalId
  ) {
    return "REVIEW_PROMOTION_START_STALE";
  }
  if (runtimeStart.repositoryId !== plan.repositoryId) return "REVIEW_PROMOTION_START_STALE";
  if (
    runtimeStart.executionPlanId !== plan.planId ||
    runtimeStart.executionReadinessResultId !== readinessResult.id ||
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
  // Runtime Start's own lifecycle contract (RuntimeStartService.ts's internal
  // invariant predicate): executionApproved/runtimePreflightPassed/
  // executionStarted must be true, and no downstream stage (agent, Implementer,
  // Reviewer, dedicated Validation, repository/GitHub mutation) may have
  // started yet (audit #5).
  if (
    runtimeStart.executionApproved !== true ||
    runtimeStart.runtimePreflightPassed !== true ||
    runtimeStart.executionStarted !== true ||
    runtimeStart.agentStarted !== false ||
    runtimeStart.implementerStarted !== false ||
    runtimeStart.reviewerStarted !== false ||
    runtimeStart.validationStarted !== false ||
    runtimeStart.repositoryMutationStarted !== false ||
    runtimeStart.githubMutationStarted !== false
  ) {
    return "REVIEW_PROMOTION_START_STALE";
  }
  // The Result must coherently report the same "started" outcome across all
  // of its own started/approved/preflight-passed fields, and duplicateExistingStart
  // must match the status it is reporting (RuntimeStartService.ts createResult).
  const runtimeStartResultStarted = runtimeStartResult.status === "Started" || runtimeStartResult.status === "AlreadyStarted";
  if (
    runtimeStartResult.started !== runtimeStartResultStarted ||
    runtimeStartResult.executionApproved !== runtimeStartResultStarted ||
    runtimeStartResult.runtimePreflightPassed !== runtimeStartResultStarted ||
    runtimeStartResult.executionStarted !== runtimeStartResultStarted ||
    runtimeStartResult.duplicateExistingStart !== (runtimeStartResult.status === "AlreadyStarted")
  ) {
    return "REVIEW_PROMOTION_START_STALE";
  }
  if (
    runtimeStartResult.agentStarted !== false ||
    runtimeStartResult.implementerStarted !== false ||
    runtimeStartResult.reviewerStarted !== false ||
    runtimeStartResult.validationStarted !== false ||
    runtimeStartResult.repositoryMutationStarted !== false ||
    runtimeStartResult.githubMutationStarted !== false
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
    implementerRuntime.executionPlanId !== plan.planId ||
    implementerRuntime.humanExecutionApprovalId !== runtimeStart.humanExecutionApprovalId ||
    implementerRuntime.runtimePreflightId !== runtimeStart.runtimePreflightId ||
    implementerRuntime.taskId !== plan.projectTaskId ||
    implementerRuntime.confirmedAssignmentId !== plan.confirmedAssignmentId ||
    implementerRuntime.preparedSessionId !== plan.preparedSessionId ||
    implementerRuntime.activeSessionId !== plan.activeSessionId ||
    implementerRuntime.employeeId !== plan.employeeId
  ) {
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
  if (
    implementerRuntime.reviewerStarted ||
    implementerRuntime.validationStarted ||
    implementerRuntime.repositoryMutationStarted ||
    implementerRuntime.githubMutationStarted
  ) {
    return "REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED";
  }
  // A Completed Implementer Runtime must truthfully report that execution and
  // the agent itself started (ImplementerRuntimeService.ts: `spawned` is only
  // true for Completed/TimedOut, and both agentStarted/implementerStarted are
  // set to `spawned`) -- a record claiming Completed while agentStarted is
  // false is an impossible lifecycle state (audit #6).
  if (!implementerRuntime.executionStarted || !implementerRuntime.agentStarted || !implementerRuntime.implementerStarted) {
    return "REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED";
  }
  // The provider evidence's own process-lifecycle fields must agree with the
  // Completed status they are attached to (ClaudeImplementerRuntimeProvider.ts's
  // Completed branch always writes started/completed true, timedOut/cancelled
  // false) -- an internally inconsistent evidence record cannot back an
  // Approved promotion even though it is self-consistent with everything else.
  if (
    !implementerRuntime.evidence.started ||
    !implementerRuntime.evidence.completed ||
    implementerRuntime.evidence.timedOut ||
    implementerRuntime.evidence.cancelled
  ) {
    return "REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED";
  }
  // The Result record must mirror the Runtime's own started-flags exactly
  // (ImplementerRuntimeService.ts's Result construction always copies
  // runtime.agentStarted/implementerStarted verbatim) and must not itself
  // claim any later-stage activity.
  if (
    implementerRuntimeResult.started !== implementerRuntime.agentStarted ||
    implementerRuntimeResult.agentStarted !== implementerRuntime.agentStarted ||
    implementerRuntimeResult.implementerStarted !== implementerRuntime.implementerStarted ||
    implementerRuntimeResult.reviewerStarted ||
    implementerRuntimeResult.validationStarted ||
    implementerRuntimeResult.repositoryMutationStarted ||
    implementerRuntimeResult.githubMutationStarted
  ) {
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
  // The runtime evidence a provider actually produced must describe the same
  // Implementer context the chain approved -- not merely be internally
  // self-consistent -- otherwise a stale or foreign Implementer Runtime could
  // still authorize promotion (P1-002).
  if (
    implementerRuntime.evidence.providerId !== REVIEW_PROMOTION_APPROVED_IMPLEMENTER_AGENT ||
    implementerRuntime.evidence.agentId !== "Claude" ||
    implementerRuntime.evidence.role !== "Implementer" ||
    implementerRuntime.evidence.workingDirectory !== plan.worktreePath
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
  if (reviewTarget.rulesVersion !== REVIEW_TARGET_RULES_VERSION) return "REVIEW_PROMOTION_TARGET_MISMATCH";
  // baseBranch, baseSha, mergeBaseSha, and reviewTargetSha must each match the
  // one canonical formula ReviewTarget.resolveReviewTarget uses to derive
  // them from the exact current plan/implementerRuntime context -- not
  // merely agree with each other. A malformed target that changes baseSha
  // and mergeBaseSha together stays internally self-consistent but no longer
  // represents the approved comparison base; recomputing both against the
  // authoritative formula here (rather than only comparing them to one
  // another) closes that gap (see review.md, combined round 2 P1-001).
  const expectedBaseSha = computeReviewTargetBaseSha(plan.projectId, plan.planId);
  if (reviewTarget.source === "PostValidation") {
    if (
      reviewTarget.reviewTargetId !==
        createPostValidationReviewTargetId(plan.projectId, reviewTarget.validationRuntimeId ?? "", reviewTarget.reviewTargetSha) ||
      !reviewTarget.validationRuntimeId ||
      !reviewTarget.validationRuntimeResultId ||
      !reviewTarget.reviewFixRuntimeId ||
      !reviewTarget.reviewFixRuntimeResultId ||
      !reviewTarget.reviewFixPlanId ||
      !reviewTarget.reviewFixRequestId ||
      reviewTarget.validationEvidenceExpectedHead !== reviewTarget.reviewTargetSha ||
      reviewTarget.validationEvidenceCommandCount !== reviewTarget.validationCommands?.length ||
      reviewTarget.validationEvidenceCompletedCommandCount !== reviewTarget.validationCommands?.length ||
      reviewTarget.baseBranch !== REVIEW_TARGET_BASE_BRANCH ||
      reviewTarget.baseSha !== expectedBaseSha ||
      reviewTarget.mergeBaseSha !== expectedBaseSha
    ) {
      return "REVIEW_PROMOTION_TARGET_MISMATCH";
    }
    return undefined;
  }
  if (
    reviewTarget.baseBranch !== REVIEW_TARGET_BASE_BRANCH ||
    reviewTarget.baseSha !== expectedBaseSha ||
    reviewTarget.mergeBaseSha !== expectedBaseSha ||
    reviewTarget.reviewTargetId !==
      createReviewTargetId(plan.projectId, runtimeStart.runtimeStartId, reviewTarget.reviewTargetSha) ||
    reviewTarget.reviewTargetSha !== computeReviewTargetSha(implementerRuntime.implementerRuntimeId)
  ) {
    return "REVIEW_PROMOTION_TARGET_MISMATCH";
  }
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
  // Mirrors the Implementer Runtime evidence-parity check above -- the
  // Reviewer Runtime's own provider evidence, including the exact SHA it
  // reviewed, must match the current approved chain context, not merely be
  // internally self-consistent, or a Reviewer Runtime that reviewed another
  // SHA/worktree/branch/target could still authorize promotion (P1-002).
  if (
    reviewerRuntime.evidence.providerId !== REVIEW_PROMOTION_APPROVED_REVIEWER_AGENT ||
    reviewerRuntime.evidence.agentId !== "Codex" ||
    reviewerRuntime.evidence.role !== "Reviewer" ||
    reviewerRuntime.evidence.workingDirectory !== plan.worktreePath ||
    reviewerRuntime.evidence.reviewTargetSha !== reviewTarget.reviewTargetSha
  ) {
    return "REVIEW_PROMOTION_ROLE_MISMATCH";
  }
  // executionStarted and implementerStarted are literal-true on this record --
  // Reviewer Runtime can only exist once Implementer Runtime already
  // Completed -- and no dedicated Validation Runtime or repository/GitHub
  // mutation may have started (ReviewerRuntimeService.ts's own construction
  // writes false for all three unconditionally) (audit #8, the finding's
  // second named example: zero prior lifecycle coverage on this record).
  if (!reviewerRuntime.executionStarted || !reviewerRuntime.implementerStarted) {
    return "REVIEW_PROMOTION_REVIEWER_STALE";
  }
  if (reviewerRuntime.validationStarted || reviewerRuntime.repositoryMutationStarted || reviewerRuntime.githubMutationStarted) {
    return "REVIEW_PROMOTION_REVIEWER_STALE";
  }
  // agentStarted/reviewerStarted must cohere with the record's own status --
  // spawned is true only for Completed/TimedOut (ReviewerRuntimeService.ts).
  // evidence.started follows a separate, wider rule: the provider sets it
  // true whenever the process was actually spawned, which includes Failed
  // (e.g. a non-zero exit or a process that could not be parsed after
  // starting), not only Completed/TimedOut -- only Blocked (rejected before
  // spawn) leaves it false (CodexReviewerRuntimeProvider.ts). This blocks
  // e.g. a Completed record with evidence.completed false, or a TimedOut
  // record whose evidence still claims a completed success, regardless of
  // what decision it reached -- classify()/promote() already own the
  // Completed+Approved outcome gate one layer up, this is coherence only.
  const reviewerSpawned = reviewerRuntime.status === "Completed" || reviewerRuntime.status === "TimedOut";
  if (reviewerRuntime.agentStarted !== reviewerSpawned || reviewerRuntime.reviewerStarted !== reviewerSpawned) {
    return "REVIEW_PROMOTION_REVIEWER_STALE";
  }
  if (
    reviewerRuntime.evidence.started !== (reviewerRuntime.status !== "Blocked") ||
    reviewerRuntime.evidence.completed !== (reviewerRuntime.status === "Completed") ||
    reviewerRuntime.evidence.timedOut !== (reviewerRuntime.status === "TimedOut")
  ) {
    return "REVIEW_PROMOTION_REVIEWER_STALE";
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
  // The Result must mirror the Runtime's own started-flags exactly
  // (ReviewerRuntimeService.ts's Result construction always copies
  // runtime.agentStarted/reviewerStarted verbatim and writes implementerStarted
  // literal true) and must not itself claim any later-stage activity.
  if (
    reviewerRuntimeResult.implementerStarted !== true ||
    reviewerRuntimeResult.agentStarted !== reviewerRuntime.agentStarted ||
    reviewerRuntimeResult.reviewerStarted !== reviewerRuntime.reviewerStarted ||
    reviewerRuntimeResult.validationStarted ||
    reviewerRuntimeResult.repositoryMutationStarted ||
    reviewerRuntimeResult.githubMutationStarted
  ) {
    return "REVIEW_PROMOTION_REVIEWER_NOT_COMPLETED";
  }
  return undefined;
}
