import { isSafeImplementerCommand } from "../implementer-runtime/ClaudeImplementerRuntimeProvider";
import {
  DEFAULT_IMPLEMENTER_RUNTIME_COMMAND_CONFIG,
  type ImplementerRuntimeCommandConfig,
} from "../implementer-runtime/ImplementerRuntimeService";
import type { ImplementerRuntimeProviderCommand } from "../implementer-runtime/ImplementerRuntimeProvider";
import { ReviewDecisionService } from "../review-decision/ReviewDecisionService";
import { getActorBlockReason } from "../review-decision/ReviewRuntimeChainIntegrityService";
import { findCurrentReviewFixRequest } from "../review-fix-requests/ReviewFixRequestService";
import { findCurrentReviewFixPlan, ReviewFixPlanService } from "../review-fix-plans/ReviewFixPlanService";
import { REVIEW_FIX_PLAN_RULES_VERSION, type ReviewFixPlan } from "../review-fix-plans/ReviewFixPlanTypes";
import { createReviewFixRuntimePrompt } from "./ReviewFixRuntimePrompt";
import type { ReviewFixRuntimeProvider } from "./ReviewFixRuntimeProvider";
import {
  REVIEW_FIX_RUNTIME_APPROVED_IMPLEMENTER_AGENT,
  REVIEW_FIX_RUNTIME_APPROVED_REVIEWER_AGENT,
  REVIEW_FIX_RUNTIME_RULES_VERSION,
  copyReviewFixRuntime,
  createReviewFixRuntimeCollection,
  createReviewFixRuntimeId,
  createReviewFixRuntimeResultCollection,
  createReviewFixRuntimeResultId,
  type ReviewFixRuntime,
  type ReviewFixRuntimeCommand,
  type ReviewFixRuntimeInput,
  type ReviewFixRuntimeOutcome,
  type ReviewFixRuntimeReasonCode,
  type ReviewFixRuntimeResult,
  type ReviewFixRuntimeStatus,
} from "./ReviewFixRuntimeTypes";

export class ReviewFixRuntimeService {
  private readonly reviewDecisionService = new ReviewDecisionService();
  private readonly reviewFixPlanService = new ReviewFixPlanService();

  constructor(
    private readonly provider: ReviewFixRuntimeProvider,
    private readonly commandConfig: ImplementerRuntimeCommandConfig = DEFAULT_IMPLEMENTER_RUNTIME_COMMAND_CONFIG,
  ) {}

  async startFixRuntime(
    input: ReviewFixRuntimeInput,
    command: ReviewFixRuntimeCommand,
  ): Promise<ReviewFixRuntimeOutcome> {
    const reviewFixRuntimeId = createReviewFixRuntimeId(
      command.projectId || "unknown-project",
      command.reviewFixPlanId || "unknown-review-fix-plan",
    );

    if (!command.projectId || !command.reviewFixPlanId || !command.actor || !command.startedAt) {
      return this.blockedOutcome(command, reviewFixRuntimeId, input.existingFixRuntimeResults, "REVIEW_FIX_RUNTIME_MALFORMED", "Failed");
    }

    if (getActorBlockReason(command.actor)) {
      return this.blockedOutcome(command, reviewFixRuntimeId, input.existingFixRuntimeResults, "REVIEW_FIX_RUNTIME_INVALID_ACTOR");
    }

    const classification = this.reviewDecisionService.classify(input);
    const currentRequest = findCurrentReviewFixRequest(input, classification);
    if (!currentRequest) {
      return this.blockedOutcome(command, reviewFixRuntimeId, input.existingFixRuntimeResults, "REVIEW_FIX_RUNTIME_PLAN_MISSING");
    }

    const currentPlan = findCurrentReviewFixPlan(input, currentRequest);
    if (!currentPlan) {
      return this.blockedOutcome(command, reviewFixRuntimeId, input.existingFixRuntimeResults, "REVIEW_FIX_RUNTIME_PLAN_MISSING");
    }
    if (currentPlan.reviewFixPlanId !== command.reviewFixPlanId) {
      return this.blockedOutcome(command, reviewFixRuntimeId, input.existingFixRuntimeResults, "REVIEW_FIX_RUNTIME_TARGET_MISMATCH");
    }

    const planPreflightReason = validatePlanSnapshot(currentPlan);
    if (planPreflightReason) {
      return this.blockedOutcome(command, reviewFixRuntimeId, input.existingFixRuntimeResults, planPreflightReason);
    }

    const revalidatedPlan = this.reviewFixPlanService.planFix(input, {
      projectId: command.projectId,
      reviewFixRequestId: currentPlan.reviewFixRequestId,
      actor: currentPlan.plannedBy,
      plannedAt: currentPlan.plannedAt,
    });
    if (revalidatedPlan.result.status !== "Planned" && revalidatedPlan.result.status !== "AlreadyPlanned") {
      return this.blockedOutcome(
        command,
        reviewFixRuntimeId,
        input.existingFixRuntimeResults,
        revalidatedPlan.result.status === "Blocked" ? "REVIEW_FIX_RUNTIME_PLAN_STALE" : "REVIEW_FIX_RUNTIME_PLAN_BLOCKED",
      );
    }
    if (!revalidatedPlan.plan || !runtimePlanMatches(currentPlan, revalidatedPlan.plan)) {
      return this.blockedOutcome(command, reviewFixRuntimeId, input.existingFixRuntimeResults, "REVIEW_FIX_RUNTIME_PLAN_STALE");
    }

    const existingRuntime = input.existingFixRuntimes?.runtimes.find(
      (runtime) => runtime.reviewFixRuntimeId === reviewFixRuntimeId,
    );
    if (existingRuntime) {
      if (!runtimeMatchesPlan(existingRuntime, currentPlan)) {
        return this.blockedOutcome(
          command,
          reviewFixRuntimeId,
          input.existingFixRuntimeResults,
          "REVIEW_FIX_RUNTIME_EXISTING_RUNTIME_MISMATCH",
        );
      }
      if (existingRuntime.status === "Completed") {
        const result = createResult(command, reviewFixRuntimeId, existingRuntime, "Completed", [
          "REVIEW_FIX_RUNTIME_ALREADY_COMPLETED",
        ]);
        return {
          result,
          runtime: copyReviewFixRuntime(existingRuntime),
          runtimeCollection: this.upsertRuntime(input.existingFixRuntimes, existingRuntime),
          resultCollection: this.upsertResult(input.existingFixRuntimeResults, result),
        };
      }
    }

    const roleReason = validateRoleBinding(currentPlan);
    if (roleReason) {
      return this.blockedOutcome(command, reviewFixRuntimeId, input.existingFixRuntimeResults, roleReason);
    }

    const prompt = createReviewFixRuntimePrompt(currentPlan);
    const providerCommand: ImplementerRuntimeProviderCommand = {
      command: this.commandConfig.command,
      arguments: this.commandConfig.arguments,
      inputMode: this.commandConfig.inputMode,
      workingDirectory: currentPlan.worktreePath,
      prompt: prompt.text,
      timeoutMs: this.commandConfig.timeoutMs,
    };

    if (!isValidTimeout(this.commandConfig.timeoutMs) || !isApprovedCommandConfig(this.commandConfig)) {
      return this.blockedOutcome(command, reviewFixRuntimeId, input.existingFixRuntimeResults, "REVIEW_FIX_RUNTIME_COMMAND_UNSAFE");
    }
    if (!isSafeImplementerCommand(providerCommand)) {
      return this.blockedOutcome(command, reviewFixRuntimeId, input.existingFixRuntimeResults, "REVIEW_FIX_RUNTIME_COMMAND_UNSAFE");
    }

    let providerResult;
    try {
      providerResult = await this.provider.invoke(providerCommand);
    } catch {
      return this.blockedOutcome(command, reviewFixRuntimeId, input.existingFixRuntimeResults, "REVIEW_FIX_RUNTIME_INTERNAL_FAILURE", "Failed");
    }

    const spawned = providerResult.status === "Completed" || providerResult.status === "TimedOut";
    if (!spawned) {
      const result = createResult(command, reviewFixRuntimeId, undefined, providerResult.status, [
        statusReasonCode(providerResult.status),
      ]);
      return { result, resultCollection: this.upsertResult(input.existingFixRuntimeResults, result) };
    }

    const runtime = createRuntime(currentPlan, command, reviewFixRuntimeId, prompt.promptId, providerResult);
    const result = createResult(command, reviewFixRuntimeId, runtime, runtime.status, [statusReasonCode(runtime.status)]);
    return {
      result,
      runtime,
      runtimeCollection: this.upsertRuntime(input.existingFixRuntimes, runtime),
      resultCollection: this.upsertResult(input.existingFixRuntimeResults, result),
    };
  }

  upsertRuntime(collection: ReviewFixRuntimeInput["existingFixRuntimes"], runtime: ReviewFixRuntime) {
    const existing = collection?.runtimes ?? [];
    const nextRuntimes = existing.some((item) => item.reviewFixRuntimeId === runtime.reviewFixRuntimeId)
      ? existing.map((item) => (item.reviewFixRuntimeId === runtime.reviewFixRuntimeId ? runtime : item))
      : [...existing, runtime];
    return createReviewFixRuntimeCollection({
      projectId: collection?.projectId ?? runtime.projectId,
      runtimes: nextRuntimes,
      generatedAt: runtime.startedAt,
      rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION,
    });
  }

  upsertResult(collection: ReviewFixRuntimeInput["existingFixRuntimeResults"], result: ReviewFixRuntimeResult) {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return createReviewFixRuntimeResultCollection({
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      generatedAt: result.resultAt,
      rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION,
    });
  }

  private blockedOutcome(
    command: ReviewFixRuntimeCommand,
    reviewFixRuntimeId: string,
    existingResults: ReviewFixRuntimeInput["existingFixRuntimeResults"],
    reason: ReviewFixRuntimeReasonCode,
    status: "Blocked" | "Failed" = "Blocked",
  ): ReviewFixRuntimeOutcome {
    const result = createResult(command, reviewFixRuntimeId, undefined, status, [reason]);
    return { result, resultCollection: this.upsertResult(existingResults, result) };
  }
}

export function findCurrentReviewFixRuntime(
  input: ReviewFixRuntimeInput | undefined,
  currentPlan: ReviewFixPlan | undefined,
): ReviewFixRuntime | undefined {
  if (!input || !currentPlan) return undefined;
  const runtimeId = createReviewFixRuntimeId(input.projectId, currentPlan.reviewFixPlanId);
  const runtime = input.existingFixRuntimes?.runtimes.find((item) => item.reviewFixRuntimeId === runtimeId);
  return runtime && runtimeMatchesPlan(runtime, currentPlan) ? copyReviewFixRuntime(runtime) : undefined;
}

export function findCurrentReviewFixRuntimeResult(
  projectId: string | undefined,
  currentPlan: ReviewFixPlan | undefined,
  resultCollection: ReviewFixRuntimeInput["existingFixRuntimeResults"],
): ReviewFixRuntimeResult | undefined {
  if (!projectId || !currentPlan) return undefined;
  const runtimeId = createReviewFixRuntimeId(projectId, currentPlan.reviewFixPlanId);
  const resultId = createReviewFixRuntimeResultId(projectId, runtimeId);
  const result = resultCollection?.results.find((item) => item.id === resultId);
  return result ? { ...result, reasonCodes: [...result.reasonCodes] } : undefined;
}

function validatePlanSnapshot(plan: ReviewFixPlan): ReviewFixRuntimeReasonCode | undefined {
  if (plan.projectId === "" || plan.reviewFixPlanId === "" || plan.reviewFixRequestId === "") {
    return "REVIEW_FIX_RUNTIME_PLAN_STALE";
  }
  if (plan.decision !== "ChangesRequested") return "REVIEW_FIX_RUNTIME_PLAN_STALE";
  if (plan.rulesVersion !== REVIEW_FIX_PLAN_RULES_VERSION) return "REVIEW_FIX_RUNTIME_PLAN_STALE";
  if (
    plan.fixExecutionStarted ||
    plan.validationRuntimeStarted ||
    plan.codexStarted ||
    plan.claudeStarted ||
    plan.subprocessStarted ||
    plan.validationStarted ||
    plan.repositoryMutationStarted ||
    plan.githubMutationStarted
  ) {
    return "REVIEW_FIX_RUNTIME_PLAN_STALE";
  }
  if (plan.worktreePath.includes("..") || !plan.worktreePath.trim()) return "REVIEW_FIX_RUNTIME_COMMAND_UNSAFE";
  if (!plan.branch.trim() || !plan.repositoryId.trim()) return "REVIEW_FIX_RUNTIME_TARGET_MISMATCH";
  return undefined;
}

function validateRoleBinding(plan: ReviewFixPlan): ReviewFixRuntimeReasonCode | undefined {
  if (
    plan.approvedImplementerAgent !== REVIEW_FIX_RUNTIME_APPROVED_IMPLEMENTER_AGENT ||
    plan.approvedReviewerAgent !== REVIEW_FIX_RUNTIME_APPROVED_REVIEWER_AGENT
  ) {
    return "REVIEW_FIX_RUNTIME_ROLE_MISMATCH";
  }
  return undefined;
}

function createRuntime(
  plan: ReviewFixPlan,
  command: ReviewFixRuntimeCommand,
  reviewFixRuntimeId: string,
  promptId: string,
  providerResult: Awaited<ReturnType<ReviewFixRuntimeProvider["invoke"]>>,
): ReviewFixRuntime {
  const spawned = providerResult.status === "Completed" || providerResult.status === "TimedOut";
  return copyReviewFixRuntime({
    reviewFixRuntimeId,
    projectId: plan.projectId,
    reviewFixPlanId: plan.reviewFixPlanId,
    reviewFixRequestId: plan.reviewFixRequestId,
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
    specificationPath: plan.specificationPath,
    implementer: plan.implementer,
    reviewer: plan.reviewer,
    approvedImplementerAgent: plan.approvedImplementerAgent,
    approvedReviewerAgent: plan.approvedReviewerAgent,
    validationCommands: [...plan.validationCommands],
    mutationScope: [...plan.mutationScope],
    decision: plan.decision,
    blockingFindingCount: plan.blockingFindingCount,
    nonBlockingFindingCount: plan.nonBlockingFindingCount,
    promptId,
    status: providerResult.status,
    startedBy: command.actor,
    startedAt: command.startedAt,
    fixExecutionStarted: true,
    agentStarted: spawned,
    implementerStarted: spawned,
    reviewerStarted: false,
    validationRuntimeStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    pushStarted: false,
    prStarted: false,
    readyForReviewStarted: false,
    mergeStarted: false,
    deployStarted: false,
    branchDeletionStarted: false,
    evidence: providerResult.evidence,
    rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION,
  });
}

function createResult(
  command: ReviewFixRuntimeCommand,
  reviewFixRuntimeId: string,
  runtime: ReviewFixRuntime | undefined,
  status: ReviewFixRuntimeResult["status"],
  reasonCodes: ReviewFixRuntimeReasonCode[],
): ReviewFixRuntimeResult {
  return {
    id: createReviewFixRuntimeResultId(command.projectId || "unknown-project", reviewFixRuntimeId),
    projectId: command.projectId || "unknown-project",
    reviewFixPlanId: command.reviewFixPlanId,
    reviewFixRuntimeId: runtime ? reviewFixRuntimeId : undefined,
    status,
    reasonCodes,
    started: Boolean(runtime?.agentStarted),
    alreadyCompleted: reasonCodes.includes("REVIEW_FIX_RUNTIME_ALREADY_COMPLETED"),
    duplicateActiveAttempt: reasonCodes.includes("REVIEW_FIX_RUNTIME_ALREADY_ACTIVE"),
    agentStarted: Boolean(runtime?.agentStarted),
    implementerStarted: Boolean(runtime?.implementerStarted),
    reviewerStarted: false,
    validationRuntimeStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    pushStarted: false,
    prStarted: false,
    readyForReviewStarted: false,
    mergeStarted: false,
    deployStarted: false,
    branchDeletionStarted: false,
    resultAt: command.startedAt || new Date(0).toISOString(),
    rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION,
  };
}

function statusReasonCode(status: ReviewFixRuntimeStatus): ReviewFixRuntimeReasonCode {
  switch (status) {
    case "Completed":
      return "REVIEW_FIX_RUNTIME_STARTED";
    case "TimedOut":
      return "REVIEW_FIX_RUNTIME_TIMED_OUT";
    case "Blocked":
      return "REVIEW_FIX_RUNTIME_PROVIDER_UNAVAILABLE";
    case "Failed":
    default:
      return "REVIEW_FIX_RUNTIME_SPAWN_FAILED";
  }
}

function runtimeMatchesPlan(runtime: ReviewFixRuntime, plan: ReviewFixPlan) {
  return (
    runtime.projectId === plan.projectId &&
    runtime.reviewFixPlanId === plan.reviewFixPlanId &&
    runtime.reviewFixRequestId === plan.reviewFixRequestId &&
    runtime.planId === plan.planId &&
    runtime.readinessId === plan.readinessId &&
    runtime.readinessResultId === plan.readinessResultId &&
    runtime.approvalId === plan.approvalId &&
    runtime.preflightId === plan.preflightId &&
    runtime.preflightResultId === plan.preflightResultId &&
    runtime.runtimeStartId === plan.runtimeStartId &&
    runtime.runtimeStartResultId === plan.runtimeStartResultId &&
    runtime.implementerRuntimeId === plan.implementerRuntimeId &&
    runtime.implementerRuntimeResultId === plan.implementerRuntimeResultId &&
    runtime.reviewerRuntimeId === plan.reviewerRuntimeId &&
    runtime.reviewerRuntimeResultId === plan.reviewerRuntimeResultId &&
    runtime.reviewTargetId === plan.reviewTargetId &&
    runtime.projectTaskId === plan.projectTaskId &&
    runtime.candidateTaskId === plan.candidateTaskId &&
    runtime.employeeId === plan.employeeId &&
    runtime.repositoryId === plan.repositoryId &&
    runtime.worktreePath === plan.worktreePath &&
    runtime.branch === plan.branch &&
    runtime.specificationPath === plan.specificationPath &&
    runtime.implementer === plan.implementer &&
    runtime.reviewer === plan.reviewer &&
    runtime.approvedImplementerAgent === plan.approvedImplementerAgent &&
    runtime.approvedReviewerAgent === plan.approvedReviewerAgent &&
    sameOrderedStrings(runtime.validationCommands, plan.validationCommands) &&
    sameOrderedStrings(runtime.mutationScope, plan.mutationScope) &&
    runtime.decision === plan.decision &&
    runtime.blockingFindingCount === plan.blockingFindingCount &&
    runtime.nonBlockingFindingCount === plan.nonBlockingFindingCount &&
    runtime.rulesVersion === REVIEW_FIX_RUNTIME_RULES_VERSION
  );
}

function runtimePlanMatches(left: ReviewFixPlan, right: ReviewFixPlan) {
  return (
    left.reviewFixPlanId === right.reviewFixPlanId &&
    left.reviewFixRequestId === right.reviewFixRequestId &&
    left.planId === right.planId &&
    left.reviewerRuntimeResultId === right.reviewerRuntimeResultId &&
    left.reviewTargetId === right.reviewTargetId &&
    left.worktreePath === right.worktreePath &&
    left.branch === right.branch &&
    left.repositoryId === right.repositoryId &&
    left.plannedBy === right.plannedBy &&
    left.plannedAt === right.plannedAt &&
    left.rulesVersion === right.rulesVersion
  );
}

function isValidTimeout(timeoutMs: number) {
  return Number.isFinite(timeoutMs) && timeoutMs > 0 && timeoutMs <= 30 * 60 * 1000;
}

function isApprovedCommandConfig(config: ImplementerRuntimeCommandConfig) {
  return (
    config.command === DEFAULT_IMPLEMENTER_RUNTIME_COMMAND_CONFIG.command &&
    config.inputMode === DEFAULT_IMPLEMENTER_RUNTIME_COMMAND_CONFIG.inputMode &&
    config.arguments.length === DEFAULT_IMPLEMENTER_RUNTIME_COMMAND_CONFIG.arguments.length &&
    config.arguments.every((arg, index) => arg === DEFAULT_IMPLEMENTER_RUNTIME_COMMAND_CONFIG.arguments[index])
  );
}

function sameOrderedStrings(left: ReadonlyArray<string>, right: ReadonlyArray<string>) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}
