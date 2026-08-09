import { ReviewDecisionService } from "../review-decision/ReviewDecisionService";
import { getActorBlockReason } from "../review-decision/ReviewRuntimeChainIntegrityService";
import { findCurrentReviewFixPlan, ReviewFixPlanService } from "../review-fix-plans/ReviewFixPlanService";
import { type ReviewFixPlan } from "../review-fix-plans/ReviewFixPlanTypes";
import { findCurrentReviewFixRequest } from "../review-fix-requests/ReviewFixRequestService";
import {
  findCurrentReviewFixRuntime,
  findCurrentReviewFixRuntimeResult,
} from "../review-fix-runtime/ReviewFixRuntimeService";
import { REVIEW_FIX_RUNTIME_RULES_VERSION, type ReviewFixRuntime, type ReviewFixRuntimeResult } from "../review-fix-runtime/ReviewFixRuntimeTypes";
import { isSafeValidationCommandLine, type ValidationRuntimeProvider } from "./ValidationRuntimeProvider";
import {
  VALIDATION_RUNTIME_RULES_VERSION,
  copyValidationRuntime,
  createValidationRuntimeCollection,
  createValidationRuntimeId,
  createValidationRuntimeResultCollection,
  createValidationRuntimeResultId,
  type ValidationRuntime,
  type ValidationRuntimeCommand,
  type ValidationRuntimeInput,
  type ValidationRuntimeOutcome,
  type ValidationRuntimeReasonCode,
  type ValidationRuntimeResult,
  type ValidationRuntimeStatus,
} from "./ValidationRuntimeTypes";

export const DEFAULT_VALIDATION_RUNTIME_TIMEOUT_MS = 5 * 60 * 1000;

export class ValidationRuntimeService {
  private readonly reviewDecisionService = new ReviewDecisionService();
  private readonly reviewFixPlanService = new ReviewFixPlanService();

  constructor(
    private readonly provider: ValidationRuntimeProvider,
    private readonly timeoutMs = DEFAULT_VALIDATION_RUNTIME_TIMEOUT_MS,
  ) {}

  async startValidation(input: ValidationRuntimeInput, command: ValidationRuntimeCommand): Promise<ValidationRuntimeOutcome> {
    const validationRuntimeId = createValidationRuntimeId(
      command.projectId || "unknown-project",
      command.reviewFixRuntimeId || "unknown-review-fix-runtime",
    );

    if (!command.projectId || !command.reviewFixRuntimeId || !command.actor || !command.startedAt) {
      return this.blockedOutcome(command, validationRuntimeId, input.existingValidationRuntimeResults, "VALIDATION_RUNTIME_MALFORMED", "Failed");
    }
    if (getActorBlockReason(command.actor)) {
      return this.blockedOutcome(command, validationRuntimeId, input.existingValidationRuntimeResults, "VALIDATION_RUNTIME_INVALID_ACTOR");
    }

    const classification = this.reviewDecisionService.classify(input);
    const currentRequest = findCurrentReviewFixRequest(input, classification);
    const currentPlan = findCurrentReviewFixPlan(input, currentRequest);
    const currentRuntime = findCurrentReviewFixRuntime(input, currentPlan);
    const currentRuntimeResult = findCurrentReviewFixRuntimeResult(command.projectId, currentPlan, input.existingFixRuntimeResults);
    const expectedHead = input.reviewTarget?.reviewTargetSha;
    if (!currentRequest || !currentPlan || !currentRuntime || !currentRuntimeResult || !expectedHead) {
      return this.blockedOutcome(command, validationRuntimeId, input.existingValidationRuntimeResults, "VALIDATION_RUNTIME_CONTEXT_MISSING");
    }
    if (currentRuntime.reviewFixRuntimeId !== command.reviewFixRuntimeId) {
      return this.blockedOutcome(command, validationRuntimeId, input.existingValidationRuntimeResults, "VALIDATION_RUNTIME_TARGET_MISMATCH");
    }
    if (!reviewFixRuntimeCompleted(currentRuntime, currentRuntimeResult)) {
      return this.blockedOutcome(command, validationRuntimeId, input.existingValidationRuntimeResults, "VALIDATION_RUNTIME_REVIEW_FIX_NOT_COMPLETED");
    }

    const staleReason = validateRuntimeContext(currentPlan, currentRuntime);
    if (staleReason) return this.blockedOutcome(command, validationRuntimeId, input.existingValidationRuntimeResults, staleReason);

    const revalidatedPlan = this.reviewFixPlanService.planFix(input, {
      projectId: command.projectId,
      reviewFixRequestId: currentPlan.reviewFixRequestId,
      actor: currentPlan.plannedBy,
      plannedAt: currentPlan.plannedAt,
    });
    if (
      (revalidatedPlan.result.status !== "Planned" && revalidatedPlan.result.status !== "AlreadyPlanned") ||
      !revalidatedPlan.plan ||
      !planStillMatches(currentPlan, revalidatedPlan.plan)
    ) {
      return this.blockedOutcome(command, validationRuntimeId, input.existingValidationRuntimeResults, "VALIDATION_RUNTIME_CONTEXT_STALE");
    }

    const existingRuntime = input.existingValidationRuntimes?.runtimes.find((runtime) =>
      runtime.validationRuntimeId === validationRuntimeId
    );
    if (existingRuntime) {
      if (!validationRuntimeMatches(existingRuntime, currentPlan, currentRuntime, currentRuntimeResult.id, expectedHead)) {
        return this.blockedOutcome(command, validationRuntimeId, input.existingValidationRuntimeResults, "VALIDATION_RUNTIME_EXISTING_RUNTIME_MISMATCH");
      }
      if (existingRuntime.status === "Completed") {
        const result = createResult(command, validationRuntimeId, existingRuntime, "Completed", ["VALIDATION_RUNTIME_ALREADY_COMPLETED"]);
        return {
          result,
          runtime: copyValidationRuntime(existingRuntime),
          runtimeCollection: this.upsertRuntime(input.existingValidationRuntimes, existingRuntime),
          resultCollection: this.upsertResult(input.existingValidationRuntimeResults, result),
        };
      }
    }

    if (currentRuntime.validationCommands.length === 0) {
      return this.blockedOutcome(command, validationRuntimeId, input.existingValidationRuntimeResults, "VALIDATION_RUNTIME_COMMANDS_MISSING");
    }
    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs <= 0 || this.timeoutMs > 30 * 60 * 1000) {
      return this.blockedOutcome(command, validationRuntimeId, input.existingValidationRuntimeResults, "VALIDATION_RUNTIME_COMMAND_UNSAFE");
    }
    if (!currentRuntime.validationCommands.every(isSafeValidationCommandLine)) {
      return this.blockedOutcome(command, validationRuntimeId, input.existingValidationRuntimeResults, "VALIDATION_RUNTIME_COMMAND_UNSAFE");
    }

    let providerResult;
    try {
      providerResult = await this.provider.invoke({
        workingDirectory: currentRuntime.worktreePath,
        expectedHead,
        commands: currentRuntime.validationCommands,
        timeoutMs: this.timeoutMs,
      });
    } catch {
      return this.blockedOutcome(command, validationRuntimeId, input.existingValidationRuntimeResults, "VALIDATION_RUNTIME_INTERNAL_FAILURE", "Failed");
    }

    if (providerResult.status === "Blocked") {
      const result = createResult(command, validationRuntimeId, undefined, "Blocked", ["VALIDATION_RUNTIME_PROVIDER_UNAVAILABLE"]);
      return { result, resultCollection: this.upsertResult(input.existingValidationRuntimeResults, result) };
    }

    const runtime = createRuntime(currentPlan, currentRuntime, currentRuntimeResult.id, expectedHead, command, validationRuntimeId, providerResult);
    const result = createResult(command, validationRuntimeId, runtime, runtime.status, [statusReasonCode(runtime.status)]);
    return {
      result,
      runtime,
      runtimeCollection: this.upsertRuntime(input.existingValidationRuntimes, runtime),
      resultCollection: this.upsertResult(input.existingValidationRuntimeResults, result),
    };
  }

  upsertRuntime(collection: ValidationRuntimeInput["existingValidationRuntimes"], runtime: ValidationRuntime) {
    const existing = collection?.runtimes ?? [];
    const nextRuntimes = existing.some((item) => item.validationRuntimeId === runtime.validationRuntimeId)
      ? existing.map((item) => (item.validationRuntimeId === runtime.validationRuntimeId ? runtime : item))
      : [...existing, runtime];
    return createValidationRuntimeCollection({
      projectId: collection?.projectId ?? runtime.projectId,
      runtimes: nextRuntimes,
      generatedAt: runtime.startedAt,
      rulesVersion: VALIDATION_RUNTIME_RULES_VERSION,
    });
  }

  upsertResult(collection: ValidationRuntimeInput["existingValidationRuntimeResults"], result: ValidationRuntimeResult) {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return createValidationRuntimeResultCollection({
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      generatedAt: result.resultAt,
      rulesVersion: VALIDATION_RUNTIME_RULES_VERSION,
    });
  }

  private blockedOutcome(
    command: ValidationRuntimeCommand,
    validationRuntimeId: string,
    existingResults: ValidationRuntimeInput["existingValidationRuntimeResults"],
    reason: ValidationRuntimeReasonCode,
    status: "Blocked" | "Failed" = "Blocked",
  ): ValidationRuntimeOutcome {
    const result = createResult(command, validationRuntimeId, undefined, status, [reason]);
    return { result, resultCollection: this.upsertResult(existingResults, result) };
  }
}

export function findCurrentValidationRuntime(
  input: ValidationRuntimeInput | undefined,
  currentReviewFixRuntime: ReviewFixRuntime | undefined,
): ValidationRuntime | undefined {
  if (!input || !currentReviewFixRuntime) return undefined;
  const runtimeId = createValidationRuntimeId(input.projectId, currentReviewFixRuntime.reviewFixRuntimeId);
  const runtime = input.existingValidationRuntimes?.runtimes.find((item) => item.validationRuntimeId === runtimeId);
  return runtime && validationRuntimeMatches(runtime, undefined, currentReviewFixRuntime) ? copyValidationRuntime(runtime) : undefined;
}

function createRuntime(
  plan: ReviewFixPlan,
  reviewFixRuntime: ReviewFixRuntime,
  reviewFixRuntimeResultId: string,
  expectedHead: string,
  command: ValidationRuntimeCommand,
  validationRuntimeId: string,
  providerResult: Awaited<ReturnType<ValidationRuntimeProvider["invoke"]>>,
): ValidationRuntime {
  const started = providerResult.evidence.commands.some((item) => item.started);
  return copyValidationRuntime({
    validationRuntimeId,
    projectId: plan.projectId,
    reviewFixRequestId: plan.reviewFixRequestId,
    reviewFixPlanId: plan.reviewFixPlanId,
    reviewFixRuntimeId: reviewFixRuntime.reviewFixRuntimeId,
    reviewFixRuntimeResultId,
    planId: plan.planId,
    readinessId: plan.readinessId,
    readinessResultId: plan.readinessResultId,
    approvalId: plan.approvalId,
    preflightId: plan.preflightId,
    preflightResultId: plan.preflightResultId,
    runtimeStartId: plan.runtimeStartId,
    runtimeStartResultId: plan.runtimeStartResultId,
    implementerRuntimeId: plan.implementerRuntimeId,
    implementerRuntimeResultId: plan.implementerRuntimeResultId,
    reviewerRuntimeId: plan.reviewerRuntimeId,
    reviewerRuntimeResultId: plan.reviewerRuntimeResultId,
    reviewTargetId: plan.reviewTargetId,
    projectTaskId: plan.projectTaskId,
    candidateTaskId: plan.candidateTaskId,
    employeeId: plan.employeeId,
    repositoryId: plan.repositoryId,
    worktreePath: plan.worktreePath,
    branch: plan.branch,
    expectedHead,
    specificationPath: plan.specificationPath,
    implementer: plan.implementer,
    reviewer: plan.reviewer,
    validationCommands: [...reviewFixRuntime.validationCommands],
    mutationScope: [...reviewFixRuntime.mutationScope],
    reviewFixRuntimeRulesVersion: reviewFixRuntime.rulesVersion,
    status: providerResult.status,
    startedBy: command.actor,
    startedAt: command.startedAt,
    validationRuntimeStarted: true,
    validationStarted: started,
    commandExecutionStarted: started,
    reviewerStarted: false,
    reviewTargetCreated: false,
    promotionStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    pushStarted: false,
    prStarted: false,
    readyForReviewStarted: false,
    mergeStarted: false,
    deployStarted: false,
    branchDeletionStarted: false,
    evidence: providerResult.evidence,
    rulesVersion: VALIDATION_RUNTIME_RULES_VERSION,
  });
}

function createResult(
  command: ValidationRuntimeCommand,
  validationRuntimeId: string,
  runtime: ValidationRuntime | undefined,
  status: ValidationRuntimeStatus,
  reasonCodes: ValidationRuntimeReasonCode[],
): ValidationRuntimeResult {
  return {
    id: createValidationRuntimeResultId(command.projectId || "unknown-project", validationRuntimeId),
    projectId: command.projectId || "unknown-project",
    reviewFixRuntimeId: command.reviewFixRuntimeId,
    validationRuntimeId: runtime ? validationRuntimeId : undefined,
    status,
    reasonCodes,
    started: Boolean(runtime?.commandExecutionStarted),
    alreadyCompleted: reasonCodes.includes("VALIDATION_RUNTIME_ALREADY_COMPLETED"),
    commandCount: runtime?.evidence.commandCount ?? 0,
    completedCommandCount: runtime?.evidence.completedCommandCount ?? 0,
    failedCommandCount: runtime?.evidence.failedCommandCount ?? 0,
    timedOutCommandCount: runtime?.evidence.timedOutCommandCount ?? 0,
    validationRuntimeStarted: Boolean(runtime?.validationRuntimeStarted),
    validationStarted: Boolean(runtime?.validationStarted),
    commandExecutionStarted: Boolean(runtime?.commandExecutionStarted),
    reviewerStarted: false,
    reviewTargetCreated: false,
    promotionStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    pushStarted: false,
    prStarted: false,
    readyForReviewStarted: false,
    mergeStarted: false,
    deployStarted: false,
    branchDeletionStarted: false,
    resultAt: command.startedAt || new Date(0).toISOString(),
    rulesVersion: VALIDATION_RUNTIME_RULES_VERSION,
  };
}

function reviewFixRuntimeCompleted(runtime: ReviewFixRuntime, result: ReviewFixRuntimeResult) {
  return (
    runtime.status === "Completed" &&
    result.status === "Completed" &&
    result.reviewFixRuntimeId === runtime.reviewFixRuntimeId &&
    result.started &&
    result.implementerStarted &&
    !result.validationRuntimeStarted &&
    !runtime.validationRuntimeStarted &&
    !result.reviewerStarted &&
    !runtime.reviewerStarted
  );
}

function validateRuntimeContext(plan: ReviewFixPlan, runtime: ReviewFixRuntime): ValidationRuntimeReasonCode | undefined {
  if (runtime.rulesVersion !== REVIEW_FIX_RUNTIME_RULES_VERSION) return "VALIDATION_RUNTIME_CONTEXT_STALE";
  if (!runtime.worktreePath.trim() || runtime.worktreePath.includes("..")) return "VALIDATION_RUNTIME_COMMAND_UNSAFE";
  if (!runtime.repositoryId.trim() || !runtime.branch.trim() || !runtime.reviewFixRuntimeId.trim()) {
    return "VALIDATION_RUNTIME_TARGET_MISMATCH";
  }
  return validationRuntimeMatches(undefined, plan, runtime) ? undefined : "VALIDATION_RUNTIME_CONTEXT_STALE";
}

function validationRuntimeMatches(
  validationRuntime: ValidationRuntime | undefined,
  plan: ReviewFixPlan | undefined,
  reviewFixRuntime: ReviewFixRuntime,
  reviewFixRuntimeResultId?: string,
  expectedHead?: string,
) {
  const baseMatches = !plan || (
    reviewFixRuntime.projectId === plan.projectId &&
    reviewFixRuntime.reviewFixPlanId === plan.reviewFixPlanId &&
    reviewFixRuntime.reviewFixRequestId === plan.reviewFixRequestId &&
    reviewFixRuntime.planId === plan.planId &&
    reviewFixRuntime.repositoryId === plan.repositoryId &&
    reviewFixRuntime.worktreePath === plan.worktreePath &&
    reviewFixRuntime.branch === plan.branch &&
    reviewFixRuntime.specificationPath === plan.specificationPath &&
    sameOrderedStrings(reviewFixRuntime.validationCommands, plan.validationCommands)
  );
  if (!validationRuntime) return baseMatches;
  return (
    baseMatches &&
    validationRuntime.reviewFixRuntimeId === reviewFixRuntime.reviewFixRuntimeId &&
    (!reviewFixRuntimeResultId || validationRuntime.reviewFixRuntimeResultId === reviewFixRuntimeResultId) &&
    validationRuntime.projectId === reviewFixRuntime.projectId &&
    validationRuntime.repositoryId === reviewFixRuntime.repositoryId &&
    validationRuntime.worktreePath === reviewFixRuntime.worktreePath &&
    validationRuntime.branch === reviewFixRuntime.branch &&
    (!expectedHead || validationRuntime.expectedHead === expectedHead) &&
    sameOrderedStrings(validationRuntime.validationCommands, reviewFixRuntime.validationCommands) &&
    validationRuntime.rulesVersion === VALIDATION_RUNTIME_RULES_VERSION
  );
}

function planStillMatches(left: ReviewFixPlan, right: ReviewFixPlan) {
  return (
    left.reviewFixPlanId === right.reviewFixPlanId &&
    left.reviewFixRequestId === right.reviewFixRequestId &&
    left.planId === right.planId &&
    left.worktreePath === right.worktreePath &&
    left.branch === right.branch &&
    left.repositoryId === right.repositoryId &&
    sameOrderedStrings(left.validationCommands, right.validationCommands) &&
    left.rulesVersion === right.rulesVersion
  );
}

function statusReasonCode(status: ValidationRuntimeStatus): ValidationRuntimeReasonCode {
  if (status === "Completed") return "VALIDATION_RUNTIME_STARTED";
  if (status === "TimedOut") return "VALIDATION_RUNTIME_TIMED_OUT";
  return "VALIDATION_RUNTIME_COMMAND_FAILED";
}

function sameOrderedStrings(left: ReadonlyArray<string>, right: ReadonlyArray<string>) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}
