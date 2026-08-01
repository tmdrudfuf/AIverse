import { createExecutionPlanId, EXECUTION_PLAN_RULES_VERSION } from "../execution-plans/ExecutionPlanTypes";
import { RUNTIME_PREFLIGHT_RULES_VERSION, createRuntimePreflightId } from "../runtime-preflight/RuntimePreflightTypes";
import { RUNTIME_START_RULES_VERSION, createRuntimeStartId } from "../runtime-start/RuntimeStartTypes";
import { isSafeReviewerCommand } from "./CodexReviewerRuntimeProvider";
import { createReviewerPrompt } from "./ReviewerPrompt";
import type { ReviewerRuntimeProvider, ReviewerRuntimeProviderCommand } from "./ReviewerRuntimeProvider";
import {
  REVIEWER_RUNTIME_APPROVED_IMPLEMENTER_AGENT,
  REVIEWER_RUNTIME_APPROVED_REVIEWER_AGENT,
  REVIEWER_RUNTIME_RULES_VERSION,
  copyReviewerRuntime,
  copyReviewerRuntimeResult,
  createReviewerRuntimeCollection,
  createReviewerRuntimeId,
  createReviewerRuntimeResultCollection,
  createReviewerRuntimeResultId,
  type ReviewerRuntime,
  type ReviewerRuntimeInput,
  type ReviewerRuntimeOutcome,
  type ReviewerRuntimeReasonCode,
  type ReviewerRuntimeResult,
} from "./ReviewerRuntimeTypes";

export type ReviewerRuntimeCommandConfig = {
  command: string;
  arguments: ReadonlyArray<string>;
  inputMode: "argument" | "stdin";
  timeoutMs: number;
};

export const DEFAULT_REVIEWER_RUNTIME_COMMAND_CONFIG: ReviewerRuntimeCommandConfig = {
  command: "codex",
  arguments: ["--sandbox", "danger-full-access", "--ask-for-approval", "never", "exec"],
  inputMode: "stdin",
  timeoutMs: 300000,
};

export class ReviewerRuntimeService {
  constructor(
    private readonly provider: ReviewerRuntimeProvider,
    private readonly commandConfig: ReviewerRuntimeCommandConfig = DEFAULT_REVIEWER_RUNTIME_COMMAND_CONFIG,
  ) {}

  async startReviewer(input: ReviewerRuntimeInput): Promise<ReviewerRuntimeOutcome> {
    const { command } = input;
    const reviewTargetId = input.reviewTarget?.reviewTargetId ?? "unknown-review-target";
    const reviewerRuntimeId = createReviewerRuntimeId(command.projectId || "unknown-project", reviewTargetId);

    const malformedReason = validateCommand(command);
    if (malformedReason) {
      return this.createBlockedOutcome(input, reviewerRuntimeId, malformedReason, "Failed");
    }

    const contextReason = validateContext(input);
    if (contextReason) {
      return this.createBlockedOutcome(input, reviewerRuntimeId, contextReason);
    }

    const roleReason = validateRoleBinding(input);
    if (roleReason) {
      return this.createBlockedOutcome(input, reviewerRuntimeId, roleReason);
    }

    const targetReason = validateReviewTarget(input);
    if (targetReason) {
      return this.createBlockedOutcome(input, reviewerRuntimeId, targetReason);
    }

    const existingRuntime = input.existingRuntimes?.runtimes.find(
      (runtime) => runtime.reviewerRuntimeId === reviewerRuntimeId,
    );
    if (existingRuntime) {
      const result = createResult({
        input,
        reviewerRuntimeId,
        status: existingRuntime.status,
        decision: existingRuntime.decision,
        findings: existingRuntime.findings,
        reasonCodes: ["REVIEWER_RUNTIME_ALREADY_COMPLETED"],
        runtime: existingRuntime,
      });
      return {
        result,
        runtime: copyReviewerRuntime(existingRuntime),
        runtimeCollection: this.upsertRuntime(input.existingRuntimes, existingRuntime),
        resultCollection: this.upsertResult(input.existingResults, result),
      };
    }

    if (!isValidTimeout(this.commandConfig.timeoutMs)) {
      return this.createBlockedOutcome(input, reviewerRuntimeId, "REVIEWER_RUNTIME_COMMAND_UNSAFE");
    }

    // The configured command must be *exactly* the approved Codex CLI
    // configuration, not merely "safe" by the shared regex checks below --
    // mirrors ImplementerRuntimeService's own isApprovedCommandConfig check
    // (see plan.md, Architecture Decision 5).
    if (!isApprovedCommandConfig(this.commandConfig)) {
      return this.createBlockedOutcome(input, reviewerRuntimeId, "REVIEWER_RUNTIME_COMMAND_UNSAFE");
    }

    const reviewTarget = input.reviewTarget!;
    const prompt = createReviewerPrompt({
      projectId: reviewTarget.projectId,
      reviewTargetId: reviewTarget.reviewTargetId,
      featureId: input.executionPlan!.featureId,
      specificationPath: reviewTarget.specificationPath,
      worktreePath: reviewTarget.worktreePath,
      baseBranch: reviewTarget.baseBranch,
      baseSha: reviewTarget.baseSha,
      featureBranch: reviewTarget.featureBranch,
      reviewTargetSha: reviewTarget.reviewTargetSha,
      mergeBaseSha: reviewTarget.mergeBaseSha,
      changedFiles: reviewTarget.changedFiles,
      approvedImplementerAgent: REVIEWER_RUNTIME_APPROVED_IMPLEMENTER_AGENT,
      approvedReviewerAgent: REVIEWER_RUNTIME_APPROVED_REVIEWER_AGENT,
    });

    const providerCommand: ReviewerRuntimeProviderCommand = {
      command: this.commandConfig.command,
      arguments: this.commandConfig.arguments,
      inputMode: this.commandConfig.inputMode,
      workingDirectory: reviewTarget.worktreePath,
      prompt: prompt.text,
      timeoutMs: this.commandConfig.timeoutMs,
      reviewTargetSha: reviewTarget.reviewTargetSha,
    };

    // Reuses the exact same safety validation the provider itself applies --
    // a command the service considers safe must be identical to a command
    // the provider considers safe, with no gap where an unsafe or
    // non-approved config could still reach provider.invoke.
    if (!isSafeReviewerCommand(providerCommand)) {
      return this.createBlockedOutcome(input, reviewerRuntimeId, "REVIEWER_RUNTIME_COMMAND_UNSAFE");
    }

    let providerResult;
    try {
      providerResult = await this.provider.invoke(providerCommand);
    } catch {
      return this.createBlockedOutcome(input, reviewerRuntimeId, "REVIEWER_RUNTIME_INTERNAL_FAILURE", "Failed");
    }

    // Blocked/Failed pre-spawn outcomes never create a ReviewerRuntime record
    // -- only Completed/TimedOut represent an actual confirmed spawn, mirroring
    // ImplementerRuntimeService's own rule.
    const spawned = providerResult.status === "Completed" || providerResult.status === "TimedOut";
    if (!spawned) {
      const result = createResult({
        input,
        reviewerRuntimeId,
        status: providerResult.status,
        decision: "Unknown",
        findings: [],
        reasonCodes: [statusReasonCode(providerResult.status, "Unknown")],
      });
      return {
        result,
        resultCollection: this.upsertResult(input.existingResults, result),
      };
    }

    const runtime = createRuntime(input, reviewerRuntimeId, prompt.promptId, providerResult);
    const result = createResult({
      input,
      reviewerRuntimeId,
      status: runtime.status,
      decision: runtime.decision,
      findings: runtime.findings,
      reasonCodes: [statusReasonCode(runtime.status, runtime.decision)],
      runtime,
    });

    return {
      result,
      runtime,
      runtimeCollection: this.upsertRuntime(input.existingRuntimes, runtime),
      resultCollection: this.upsertResult(input.existingResults, result),
    };
  }

  upsertRuntime(collection: ReviewerRuntimeInput["existingRuntimes"], runtime: ReviewerRuntime) {
    const existing = collection?.runtimes ?? [];
    const nextRuntimes = existing.some((item) => item.reviewerRuntimeId === runtime.reviewerRuntimeId)
      ? existing.map((item) => (item.reviewerRuntimeId === runtime.reviewerRuntimeId ? runtime : item))
      : [...existing, runtime];
    return createReviewerRuntimeCollection({
      projectId: collection?.projectId ?? runtime.projectId,
      runtimes: nextRuntimes,
      generatedAt: runtime.startedAt,
      rulesVersion: REVIEWER_RUNTIME_RULES_VERSION,
    });
  }

  upsertResult(collection: ReviewerRuntimeInput["existingResults"], result: ReviewerRuntimeResult) {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return createReviewerRuntimeResultCollection({
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      generatedAt: result.resultAt,
      rulesVersion: REVIEWER_RUNTIME_RULES_VERSION,
    });
  }

  private createBlockedOutcome(
    input: ReviewerRuntimeInput,
    reviewerRuntimeId: string,
    reason: ReviewerRuntimeReasonCode,
    status: "Blocked" | "Failed" = "Blocked",
  ): ReviewerRuntimeOutcome {
    const result = createResult({
      input,
      reviewerRuntimeId,
      status,
      decision: "Unknown",
      findings: [],
      reasonCodes: [reason],
    });
    return {
      result,
      resultCollection: this.upsertResult(input.existingResults, result),
    };
  }
}

function validateCommand(command: ReviewerRuntimeInput["command"]): ReviewerRuntimeReasonCode | undefined {
  if (
    !command.projectId ||
    !command.runtimeStartId ||
    !command.executionPlanId ||
    !command.approvedImplementerAgent ||
    !command.approvedReviewerAgent ||
    !command.startedBy ||
    !command.requestedAt
  ) {
    return "REVIEWER_RUNTIME_MALFORMED";
  }
  if (getActorBlockReason(command.startedBy)) return "REVIEWER_RUNTIME_INVALID_ACTOR";
  return undefined;
}

function validateContext(input: ReviewerRuntimeInput): ReviewerRuntimeReasonCode | undefined {
  const plan = input.executionPlan;
  const readiness = input.readiness;
  const readinessResult = input.readinessResult;
  const approval = input.approval;
  const preflight = input.preflight;
  const preflightResult = input.preflightResult;
  const runtimeStart = input.runtimeStart;
  const runtimeStartResult = input.runtimeStartResult;
  const implementerRuntime = input.implementerRuntime;
  const implementerRuntimeResult = input.implementerRuntimeResult;
  const { command } = input;

  if (!plan) return "REVIEWER_RUNTIME_PLAN_INVALID";
  if (plan.projectId !== command.projectId || plan.planId !== command.executionPlanId) {
    return "REVIEWER_RUNTIME_PLAN_INVALID";
  }
  if (
    plan.planId !== createExecutionPlanId(plan.projectId, plan.activeSessionId) ||
    plan.rulesVersion !== EXECUTION_PLAN_RULES_VERSION
  ) {
    return "REVIEWER_RUNTIME_PLAN_INVALID";
  }

  if (!readiness || !readinessResult || readiness.status !== "Ready" || readinessResult.status !== "Ready") {
    return "REVIEWER_RUNTIME_READINESS_NOT_READY";
  }
  if (readiness.projectId !== plan.projectId || readinessResult.projectId !== plan.projectId) {
    return "REVIEWER_RUNTIME_PROJECT_MISMATCH";
  }
  if (readiness.executionPlanId !== plan.planId || readinessResult.executionPlanId !== plan.planId) {
    return "REVIEWER_RUNTIME_READINESS_NOT_READY";
  }

  if (!approval || approval.projectId !== plan.projectId || approval.executionPlanId !== plan.planId || !approval.executionApproved) {
    return "REVIEWER_RUNTIME_APPROVAL_STALE";
  }
  if (getActorBlockReason(approval.approvedBy)) return "REVIEWER_RUNTIME_INVALID_ACTOR";

  if (
    !preflight || !preflightResult ||
    preflight.projectId !== plan.projectId || preflightResult.projectId !== plan.projectId ||
    preflight.preflightId !== createRuntimePreflightId(plan.projectId, plan.planId) ||
    preflight.rulesVersion !== RUNTIME_PREFLIGHT_RULES_VERSION ||
    preflight.status !== "Ready" || preflightResult.status !== "Ready" ||
    !preflight.runtimePreflightPassed || !preflightResult.runtimePreflightPassed
  ) {
    return "REVIEWER_RUNTIME_PREFLIGHT_NOT_READY";
  }

  if (!runtimeStart || !runtimeStartResult) return "REVIEWER_RUNTIME_START_STALE";
  if (runtimeStart.projectId !== plan.projectId || runtimeStartResult.projectId !== plan.projectId) {
    return "REVIEWER_RUNTIME_PROJECT_MISMATCH";
  }
  if (runtimeStart.runtimeStartId !== command.runtimeStartId) return "REVIEWER_RUNTIME_START_STALE";
  if (
    runtimeStart.runtimeStartId !== createRuntimeStartId(plan.projectId, plan.planId) ||
    runtimeStart.rulesVersion !== RUNTIME_START_RULES_VERSION ||
    (runtimeStartResult.status !== "Started" && runtimeStartResult.status !== "AlreadyStarted")
  ) {
    return "REVIEWER_RUNTIME_START_STALE";
  }
  if (runtimeStart.worktreePath !== plan.worktreePath || runtimeStart.repositoryRoot !== plan.repositoryPath) {
    return "REVIEWER_RUNTIME_WORKTREE_MISMATCH";
  }
  if (runtimeStart.branch !== plan.branchName) return "REVIEWER_RUNTIME_BRANCH_MISMATCH";
  if (runtimeStart.specificationPath !== plan.specPath) return "REVIEWER_RUNTIME_SPEC_MISMATCH";

  // Claude Implementer Runtime revalidation (see plan.md, "Implementer
  // Result Revalidation"): only a terminal Completed result is reviewable by
  // default. Blocked/Failed/TimedOut/missing results all block here, and a
  // Reviewer or later stage that already started on this exact Implementer
  // Runtime blocks too -- a stale Implementer completion can never be
  // reviewed twice by silently reusing an earlier attempt.
  if (!implementerRuntime || !implementerRuntimeResult) return "REVIEWER_RUNTIME_IMPLEMENTER_MISSING";
  if (implementerRuntime.projectId !== plan.projectId || implementerRuntimeResult.projectId !== plan.projectId) {
    return "REVIEWER_RUNTIME_PROJECT_MISMATCH";
  }
  if (implementerRuntime.runtimeStartId !== runtimeStart.runtimeStartId) return "REVIEWER_RUNTIME_IMPLEMENTER_NOT_COMPLETED";
  if (implementerRuntime.worktreePath !== plan.worktreePath || implementerRuntime.branch !== plan.branchName) {
    return "REVIEWER_RUNTIME_WORKTREE_MISMATCH";
  }
  if (implementerRuntime.specificationPath !== plan.specPath) return "REVIEWER_RUNTIME_SPEC_MISMATCH";
  if (implementerRuntime.status !== "Completed" || implementerRuntimeResult.status !== "Completed") {
    return "REVIEWER_RUNTIME_IMPLEMENTER_NOT_COMPLETED";
  }
  if (implementerRuntime.reviewerStarted || implementerRuntime.validationStarted || implementerRuntime.githubMutationStarted) {
    return "REVIEWER_RUNTIME_START_STALE";
  }

  return undefined;
}

function validateRoleBinding(input: ReviewerRuntimeInput): ReviewerRuntimeReasonCode | undefined {
  const { command } = input;
  const plan = input.executionPlan;
  const approval = input.approval;
  const runtimeStart = input.runtimeStart;
  const implementerRuntime = input.implementerRuntime;
  if (!plan || !approval || !runtimeStart || !implementerRuntime) return "REVIEWER_RUNTIME_ROLE_MISMATCH";

  // The generic pipeline role labels must be internally consistent across
  // every upstream record, including the Implementer Runtime that already
  // ran -- an immediate pre-invocation check that Plan/Approval/RuntimeStart/
  // ImplementerRuntime all agree Claude=Implementer and Codex=Reviewer.
  if (
    plan.implementerAgent !== approval.implementerAgent ||
    plan.reviewerAgent !== approval.reviewerAgent ||
    plan.implementerAgent !== runtimeStart.implementer ||
    plan.reviewerAgent !== runtimeStart.reviewer ||
    plan.implementerAgent !== implementerRuntime.implementer ||
    plan.reviewerAgent !== implementerRuntime.reviewer
  ) {
    return "REVIEWER_RUNTIME_ROLE_MISMATCH";
  }

  // The approved binding travels as explicit request data -- never derived
  // from the generic labels above and never consulting the repository's
  // default agent-role mapping (Codex=Implementer/Claude=Reviewer). Any
  // mismatch here is a role swap and must Block, not silently proceed.
  if (command.approvedImplementerAgent !== REVIEWER_RUNTIME_APPROVED_IMPLEMENTER_AGENT) {
    return "REVIEWER_RUNTIME_CLAUDE_REVIEWER_MISMATCH";
  }
  if (command.approvedReviewerAgent !== REVIEWER_RUNTIME_APPROVED_REVIEWER_AGENT) {
    return "REVIEWER_RUNTIME_CODEX_NOT_REVIEWER";
  }
  if (
    implementerRuntime.approvedImplementerAgent !== REVIEWER_RUNTIME_APPROVED_IMPLEMENTER_AGENT ||
    implementerRuntime.approvedReviewerAgent !== REVIEWER_RUNTIME_APPROVED_REVIEWER_AGENT
  ) {
    return "REVIEWER_RUNTIME_ROLE_MISMATCH";
  }

  return undefined;
}

function validateReviewTarget(input: ReviewerRuntimeInput): ReviewerRuntimeReasonCode | undefined {
  const target = input.reviewTarget;
  const plan = input.executionPlan;
  const runtimeStart = input.runtimeStart;
  const implementerRuntime = input.implementerRuntime;
  if (!target) return "REVIEWER_RUNTIME_TARGET_MISSING";
  if (!plan || !runtimeStart || !implementerRuntime) return "REVIEWER_RUNTIME_TARGET_MISSING";
  if (target.projectId !== plan.projectId) return "REVIEWER_RUNTIME_PROJECT_MISMATCH";
  if (target.runtimeStartId !== runtimeStart.runtimeStartId) return "REVIEWER_RUNTIME_TARGET_MISMATCH";
  if (target.implementerRuntimeId !== implementerRuntime.implementerRuntimeId) return "REVIEWER_RUNTIME_TARGET_MISMATCH";
  if (target.worktreePath !== plan.worktreePath) return "REVIEWER_RUNTIME_WORKTREE_MISMATCH";
  if (target.featureBranch !== plan.branchName) return "REVIEWER_RUNTIME_BRANCH_MISMATCH";
  if (target.specificationPath !== plan.specPath) return "REVIEWER_RUNTIME_SPEC_MISMATCH";
  // A target the policy cannot honestly call committed and clean can never
  // become the final exact-HEAD review target -- see ReviewTarget.ts and
  // contracts/output-decision-contract.md, "Exact-HEAD Gate".
  if (target.workingTreeState !== "Clean") return "REVIEWER_RUNTIME_TARGET_UNCOMMITTED";
  return undefined;
}

function isValidTimeout(timeoutMs: number) {
  return Number.isFinite(timeoutMs) && timeoutMs > 0 && timeoutMs <= 30 * 60 * 1000;
}

function isApprovedCommandConfig(config: ReviewerRuntimeCommandConfig) {
  return (
    config.command === DEFAULT_REVIEWER_RUNTIME_COMMAND_CONFIG.command &&
    config.inputMode === DEFAULT_REVIEWER_RUNTIME_COMMAND_CONFIG.inputMode &&
    config.arguments.length === DEFAULT_REVIEWER_RUNTIME_COMMAND_CONFIG.arguments.length &&
    config.arguments.every((arg, index) => arg === DEFAULT_REVIEWER_RUNTIME_COMMAND_CONFIG.arguments[index])
  );
}

function createRuntime(
  input: ReviewerRuntimeInput,
  reviewerRuntimeId: string,
  promptId: string,
  providerResult: Awaited<ReturnType<ReviewerRuntimeProvider["invoke"]>>,
): ReviewerRuntime {
  const plan = input.executionPlan!;
  const runtimeStart = input.runtimeStart!;
  const implementerRuntime = input.implementerRuntime!;
  const reviewTarget = input.reviewTarget!;
  const { command } = input;
  const spawned = providerResult.status === "Completed" || providerResult.status === "TimedOut";
  const runtime = {
    reviewerRuntimeId,
    projectId: plan.projectId,
    runtimeStartId: runtimeStart.runtimeStartId,
    implementerRuntimeId: implementerRuntime.implementerRuntimeId,
    reviewTargetId: reviewTarget.reviewTargetId,
    reviewPromptId: promptId,
    worktreePath: plan.worktreePath,
    branch: plan.branchName,
    specificationPath: plan.specPath,
    implementer: plan.implementerAgent,
    reviewer: plan.reviewerAgent,
    approvedImplementerAgent: command.approvedImplementerAgent,
    approvedReviewerAgent: command.approvedReviewerAgent,
    status: providerResult.status,
    decision: providerResult.decision,
    findings: providerResult.findings,
    startedBy: command.startedBy,
    startedAt: command.requestedAt,
    executionStarted: true,
    agentStarted: spawned,
    implementerStarted: true,
    reviewerStarted: spawned,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    evidence: providerResult.evidence,
    rulesVersion: REVIEWER_RUNTIME_RULES_VERSION,
  } satisfies ReviewerRuntime;
  return copyReviewerRuntime(runtime);
}

function statusReasonCode(status: ReviewerRuntime["status"], decision: ReviewerRuntime["decision"]): ReviewerRuntimeReasonCode {
  switch (status) {
    case "Completed":
      return decision === "Unknown" ? "REVIEWER_RUNTIME_DECISION_UNKNOWN" : "REVIEWER_RUNTIME_STARTED";
    case "TimedOut":
      return "REVIEWER_RUNTIME_TIMED_OUT";
    case "Blocked":
      return "REVIEWER_RUNTIME_PROVIDER_UNAVAILABLE";
    case "Failed":
    default:
      return "REVIEWER_RUNTIME_SPAWN_FAILED";
  }
}

function createResult(input: {
  input: ReviewerRuntimeInput;
  reviewerRuntimeId: string;
  status: ReviewerRuntimeResult["status"];
  decision: ReviewerRuntimeResult["decision"];
  findings: ReadonlyArray<{ blocking: boolean }>;
  reasonCodes: ReviewerRuntimeReasonCode[];
  runtime?: ReviewerRuntime;
}): ReviewerRuntimeResult {
  const { command } = input.input;
  const blockingFindingCount = input.findings.filter((finding) => finding.blocking).length;
  const nonBlockingFindingCount = input.findings.length - blockingFindingCount;
  const result = {
    id: createReviewerRuntimeResultId(command.projectId || "unknown-project", input.input.reviewTarget?.reviewTargetId ?? "unknown-review-target"),
    projectId: command.projectId || "unknown-project",
    runtimeStartId: command.runtimeStartId,
    implementerRuntimeId: input.input.implementerRuntime?.implementerRuntimeId,
    reviewerRuntimeId: input.runtime ? input.reviewerRuntimeId : undefined,
    status: input.status,
    decision: input.decision,
    blockingFindingCount,
    nonBlockingFindingCount,
    reasonCodes: input.reasonCodes,
    started: Boolean(input.runtime?.agentStarted),
    duplicateActiveAttempt: false,
    agentStarted: Boolean(input.runtime?.agentStarted),
    implementerStarted: true,
    reviewerStarted: Boolean(input.runtime?.reviewerStarted),
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: command.requestedAt || new Date(0).toISOString(),
    rulesVersion: REVIEWER_RUNTIME_RULES_VERSION,
  } satisfies ReviewerRuntimeResult;
  return copyReviewerRuntimeResult(result);
}

function getActorBlockReason(actor: string | undefined): ReviewerRuntimeReasonCode | undefined {
  const normalized = actor?.trim().toLowerCase();
  if (!normalized || /(codex|claude|agent|bot|automation|workflow)/.test(normalized)) {
    return "REVIEWER_RUNTIME_INVALID_ACTOR";
  }
  return undefined;
}
