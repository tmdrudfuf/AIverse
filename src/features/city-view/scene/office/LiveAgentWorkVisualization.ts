import { deriveExternalProjectAdosRunStatus } from "./external-ados-run-status/ExternalProjectAdosRunStatusService";
import type { ExternalProjectAdosRunStatus } from "./external-ados-run-status/ExternalProjectAdosRunStatusTypes";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import type { EmployeeNpcMovementPositionHint } from "./npc/EmployeeNpcMovementTypes";

export type LiveAgentWorkStage =
  | "preparing"
  | "implementation"
  | "validation"
  | "review"
  | "publication"
  | "blocked"
  | "complete"
  | "idle";

export type LiveAgentWorkLifecycle = "no-active-run" | "active" | "blocked" | "complete";

export type LiveAgentSemanticRole = "implementer" | "validator" | "reviewer" | "operations" | "idle";

export type LiveAgentVisualTone = "active" | "warning" | "complete" | "idle";

export type LiveAgentWorkAssignment = {
  role: LiveAgentSemanticRole;
  employeeId?: string;
  displayName: string;
  providerLabel?: string;
  statusLabel: string;
  department: "engineering" | "validation-qa" | "review" | "project-status-operations" | "shared";
  positionHint: EmployeeNpcMovementPositionHint;
  visualTone: LiveAgentVisualTone;
};

export type LiveAgentProjectStatusDisplay = {
  title: string;
  summary: string;
  tone: LiveAgentVisualTone;
  rows: string[];
  pipeline: Array<{
    id: LiveAgentWorkStage;
    label: string;
    state: "current" | "complete" | "blocked" | "idle";
  }>;
};

export type LiveAgentWorkState = {
  projectId?: string;
  projectName: string;
  lifecycle: LiveAgentWorkLifecycle;
  stage: LiveAgentWorkStage;
  stageLabel: string;
  rawStatus?: string;
  specPath?: string;
  featureBranch?: string;
  updatedAt?: string;
  reasonText?: string;
  assignments: LiveAgentWorkAssignment[];
  projectStatus: LiveAgentProjectStatusDisplay;
};

type ProjectLike = ProjectPortalState["projects"][number];
type EmployeeLike = ProjectPortalState["employees"][number];

export function deriveLiveAgentWorkState(state: Pick<
  ProjectPortalState,
  | "activeProjectCompanyContext"
  | "projects"
  | "selectedProjectIndex"
  | "selectedProjectId"
  | "selectedProjectDashboardProjectId"
  | "externalProjectAdosRunPreparations"
  | "externalProjectAdosExecutions"
  | "externalProjectAdosExecutionResults"
  | "externalProjectAdosRunStatuses"
  | "externalProjectDevelopmentRequestDrafts"
  | "employees"
  | "implementerRuntimeCollections"
  | "implementerRuntimeResultCollections"
  | "reviewerRuntimeCollections"
  | "reviewerRuntimeResultCollections"
  | "reviewPromotionCollections"
  | "reviewPromotionResultCollections"
  | "reviewFixRuntimeCollections"
  | "reviewFixRuntimeResultCollections"
  | "validationRuntimeCollections"
  | "validationRuntimeResultCollections"
  | "postValidationReviewTargetCollections"
  | "postValidationReviewTargetResultCollections"
>): LiveAgentWorkState {
  const project = getSelectedProject(state);
  const projectId = project?.id;
  const projectName = project?.ownerCompany ?? project?.name ?? "Selected Project";

  if (!projectId) return createIdleState({ projectName, employees: state.employees });

  const projectRunState = getProjectAdosRunState(state, projectId);
  const runStatus = deriveExternalProjectAdosRunStatus({
    projectId,
    preparation: projectRunState.preparation,
    execution: projectRunState.execution,
    result: projectRunState.result,
    persistedStatus: projectRunState.persistedStatus,
  });
  const latestFact = getLatestProjectFact(state, projectId);
  const rawStatus = createRawStatus(runStatus, latestFact?.label);
  const stage = resolveStage(rawStatus, runStatus, latestFact);
  const lifecycle = resolveLifecycle(stage, runStatus, latestFact);
  const stageLabel = getStageLabel(stage, lifecycle);
  const reasonText = createReasonText(runStatus, latestFact);
  const blockedStage = stage === "blocked" ? resolveBlockedSourceStage(rawStatus, latestFact) : undefined;
  const assignment = createAssignment({
    projectId,
    stage,
    blockedStage,
    lifecycle,
    employees: state.employees,
    providerLabel: latestFact?.providerLabel ?? getExternalProviderLabel(projectRunState),
    reasonText,
  });
  const assignments = assignment ? [assignment] : [];

  return {
    projectId,
    projectName,
    lifecycle,
    stage,
    stageLabel,
    rawStatus,
    specPath: getSpecPath(projectRunState),
    featureBranch: runStatus?.featureBranch ?? projectRunState.preparation?.featureBranch,
    updatedAt: latestTimestamp(runStatus?.updatedAt, latestFact?.updatedAt),
    reasonText,
    assignments,
    projectStatus: createProjectStatusDisplay({
      projectName,
      stage,
      lifecycle,
      stageLabel,
      rawStatus,
      runStatus,
      reasonText,
      specPath: getSpecPath(projectRunState),
      featureBranch: runStatus?.featureBranch ?? projectRunState.preparation?.featureBranch,
      updatedAt: latestTimestamp(runStatus?.updatedAt, latestFact?.updatedAt),
      requestTitle: projectRunState.requestDraft?.title,
      runId: projectRunState.requestDraft?.adosRunId ?? runStatus?.executionId,
    }),
  };
}

function getSelectedProject(state: Pick<
  ProjectPortalState,
  | "activeProjectCompanyContext"
  | "projects"
  | "selectedProjectDashboardProjectId"
  | "selectedProjectId"
  | "selectedProjectIndex"
>): ProjectLike | undefined {
  const selectedId = state.activeProjectCompanyContext?.projectId ?? state.selectedProjectDashboardProjectId ?? state.selectedProjectId;
  if (selectedId) return state.projects.find((project) => project.id === selectedId);
  return state.projects[state.selectedProjectIndex];
}

type LatestFact = {
  kind: LiveAgentWorkStage | "prepared";
  status: string;
  label: string;
  updatedAt?: string;
  providerLabel?: string;
  reasonCodes?: string[];
};

type ProjectAdosRunStateInput = Parameters<typeof deriveLiveAgentWorkState>[0];

type ProjectAdosRunState = {
  key?: string;
  preparation?: ProjectAdosRunStateInput["externalProjectAdosRunPreparations"][string];
  execution?: ProjectAdosRunStateInput["externalProjectAdosExecutions"][string];
  result?: ProjectAdosRunStateInput["externalProjectAdosExecutionResults"][string];
  persistedStatus?: ProjectAdosRunStateInput["externalProjectAdosRunStatuses"][string];
  requestDraft?: ProjectAdosRunStateInput["externalProjectDevelopmentRequestDrafts"][string];
};

const IMPLEMENTATION_RECOVERY_STAGE_TOKENS = [
  "validation_recovery_implementer",
  "implementer_fix",
  "review_fix",
];

function getLatestProjectFact(state: Parameters<typeof deriveLiveAgentWorkState>[0], projectId: string): LatestFact | undefined {
  const facts: LatestFact[] = [];
  const implementerRuntime = latestByTimestamp(state.implementerRuntimeCollections[projectId]?.runtimes, "startedAt");
  const implementerResult = latestByTimestamp(state.implementerRuntimeResultCollections[projectId]?.results, "resultAt");
  const reviewerRuntime = latestByTimestamp(state.reviewerRuntimeCollections[projectId]?.runtimes, "startedAt");
  const reviewerResult = latestByTimestamp(state.reviewerRuntimeResultCollections[projectId]?.results, "resultAt");
  const promotion = latestByTimestamp(state.reviewPromotionCollections[projectId]?.promotions, "promotedAt");
  const promotionResult = latestByTimestamp(state.reviewPromotionResultCollections[projectId]?.results, "resultAt");
  const reviewFixRuntime = latestByTimestamp(state.reviewFixRuntimeCollections[projectId]?.runtimes, "startedAt");
  const reviewFixResult = latestByTimestamp(state.reviewFixRuntimeResultCollections[projectId]?.results, "resultAt");
  const validationRuntime = latestByTimestamp(state.validationRuntimeCollections[projectId]?.runtimes, "startedAt");
  const validationResult = latestByTimestamp(state.validationRuntimeResultCollections[projectId]?.results, "resultAt");
  const postValidationTarget = latestByTimestamp(state.postValidationReviewTargetCollections[projectId]?.targets, "resolvedAt");
  const postValidationTargetResult = latestByTimestamp(state.postValidationReviewTargetResultCollections[projectId]?.results, "resultAt");

  if (implementerRuntime) {
    facts.push({
      kind: "implementation",
      status: String(implementerRuntime.status),
      label: "implementer",
      updatedAt: implementerRuntime.startedAt,
      providerLabel: implementerRuntime.implementer || implementerRuntime.evidence?.agentId,
    });
  }
  if (implementerResult) facts.push(resultFact("implementation", implementerResult.status, implementerResult.resultAt, implementerResult.reasonCodes));
  if (reviewerRuntime) {
    facts.push({
      kind: "review",
      status: String(reviewerRuntime.status),
      label: "reviewer",
      updatedAt: reviewerRuntime.startedAt,
      providerLabel: reviewerRuntime.reviewer || reviewerRuntime.evidence?.agentId,
    });
  }
  if (reviewerResult) facts.push(resultFact("review", reviewerResult.status, reviewerResult.resultAt, reviewerResult.reasonCodes));
  if (promotion) facts.push({ kind: "publication", status: "Approved", label: "publication_gate", updatedAt: promotion.promotedAt, providerLabel: promotion.reviewer });
  if (promotionResult) facts.push(resultFact("publication", promotionResult.granted ? "publication_gate" : "Blocked", promotionResult.resultAt, promotionResult.reasonCodes));
  if (reviewFixRuntime) {
    facts.push({
      kind: "implementation",
      status: String(reviewFixRuntime.status),
      label: "implementer_fix",
      updatedAt: reviewFixRuntime.startedAt,
      providerLabel: reviewFixRuntime.implementer || reviewFixRuntime.evidence?.agentId,
    });
  }
  if (reviewFixResult) facts.push(resultFact("implementation", reviewFixResult.status, reviewFixResult.resultAt, reviewFixResult.reasonCodes));
  if (validationRuntime) {
    facts.push({
      kind: "validation",
      status: String(validationRuntime.status),
      label: "validation",
      updatedAt: validationRuntime.startedAt,
      providerLabel: validationRuntime.evidence?.providerId,
    });
  }
  if (validationResult) facts.push(resultFact("validation", validationResult.status, validationResult.resultAt, validationResult.reasonCodes));
  if (postValidationTarget) facts.push({ kind: "review", status: "Ready", label: "review", updatedAt: postValidationTarget.resolvedAt });
  if (postValidationTargetResult) facts.push(resultFact("review", postValidationTargetResult.status, postValidationTargetResult.resultAt, postValidationTargetResult.reasonCodes));

  return latestFact(facts);
}

function getProjectAdosRunState(state: ProjectAdosRunStateInput, projectId: string): ProjectAdosRunState {
  const candidateKeys = new Set<string>([projectId]);
  collectProjectKeys(candidateKeys, state.externalProjectAdosRunPreparations, projectId);
  collectProjectKeys(candidateKeys, state.externalProjectAdosExecutions, projectId);
  collectProjectKeys(candidateKeys, state.externalProjectAdosExecutionResults, projectId);
  collectProjectKeys(candidateKeys, state.externalProjectAdosRunStatuses, projectId);
  collectProjectKeys(candidateKeys, state.externalProjectDevelopmentRequestDrafts, projectId);

  const candidates = Array.from(candidateKeys).map((key) => createProjectAdosRunStateCandidate(state, key));
  return candidates.find((candidate) => isActiveProjectAdosRunState(candidate))
    ?? candidates.find((candidate) => candidate.key === projectId)
    ?? candidates.sort((left, right) => compareTimestamp(getProjectAdosRunStateUpdatedAt(right), getProjectAdosRunStateUpdatedAt(left)))[0]
    ?? {};
}

function collectProjectKeys(
  keys: Set<string>,
  records: Record<string, { projectId?: string } | undefined>,
  projectId: string,
) {
  Object.entries(records).forEach(([key, value]) => {
    if (value?.projectId === projectId) keys.add(key);
  });
}

function createProjectAdosRunStateCandidate(state: ProjectAdosRunStateInput, key: string): ProjectAdosRunState {
  return {
    key,
    preparation: state.externalProjectAdosRunPreparations[key],
    execution: state.externalProjectAdosExecutions[key],
    result: state.externalProjectAdosExecutionResults[key],
    persistedStatus: state.externalProjectAdosRunStatuses[key],
    requestDraft: state.externalProjectDevelopmentRequestDrafts[key],
  };
}

function isActiveProjectAdosRunState(candidate: ProjectAdosRunState) {
  if (candidate.execution && isActiveAdosExecution(candidate.execution)) return true;
  if (candidate.result && !isTerminalAdosExecutionStatus(candidate.result.status)) return true;
  if (candidate.persistedStatus) return isActiveAdosRunStage(candidate.persistedStatus.stage);
  return candidate.preparation?.status === "Prepared"
    || Boolean(candidate.execution && isActiveAdosExecution(candidate.execution))
    || Boolean(candidate.requestDraft && !isTerminalDevelopmentRequestStatus(candidate.requestDraft.status));
}

function getProjectAdosRunStateUpdatedAt(candidate: ProjectAdosRunState) {
  return latestTimestamp(
    candidate.persistedStatus?.updatedAt,
    candidate.result?.resultAt,
    candidate.execution?.startedAt,
    candidate.preparation?.updatedAt,
    candidate.requestDraft?.updatedAt,
  );
}

function resultFact(kind: LatestFact["kind"], status: string, updatedAt: string | undefined, reasonCodes: ReadonlyArray<string> = []): LatestFact {
  return {
    kind,
    status: String(status),
    label: `${kind}:${status}`,
    updatedAt,
    reasonCodes: [...reasonCodes],
  };
}

function resolveStage(
  rawStatus: string | undefined,
  runStatus: ExternalProjectAdosRunStatus | undefined,
  latestFact: LatestFact | undefined,
): LiveAgentWorkStage {
  const raw = normalize(rawStatus);
  const terminal = normalize(latestFact?.status);

  if (isHardBlockedStatus(raw) || isHardBlockedStatus(terminal)) return "blocked";
  if (runStatus?.stage === "Completed") return "complete";
  if (hasToken(raw, IMPLEMENTATION_RECOVERY_STAGE_TOKENS)) return "implementation";
  if (isRecoveryStatus(raw) || isRecoveryStatus(terminal)) return "blocked";
  if (runStatus?.stage === "Prepared" || runStatus?.stage === "NotPrepared" || hasToken(raw, ["prepared", "preparing"])) return "preparing";
  if (hasToken(raw, ["validation", "validating", "qa", "testing"])) return "validation";
  if (hasToken(raw, ["reviewer", "reviewing", "review"])) return "review";
  if (hasToken(raw, ["exact_head", "push", "pr", "pr_refresh", "publication_gate", "publication", "publish", "merge", "cleanup", "pull_request"])) return "publication";
  if (runStatus?.stage === "Started") return "implementation";
  if (hasToken(raw, ["implementer", "implementation", "started"])) return "implementation";
  if (latestFact && latestFact.kind !== "prepared") return latestFact.kind;
  return "idle";
}

function resolveBlockedSourceStage(rawStatus: string | undefined, latestFact: LatestFact | undefined): LiveAgentWorkStage | undefined {
  if (latestFact?.kind && latestFact.kind !== "blocked" && latestFact.kind !== "complete" && latestFact.kind !== "idle" && latestFact.kind !== "prepared") {
    return latestFact.kind;
  }

  const raw = normalize(rawStatus);
  if (hasToken(raw, IMPLEMENTATION_RECOVERY_STAGE_TOKENS) || hasToken(raw, ["implementer", "implementation"])) return "implementation";
  if (hasToken(raw, ["validation", "validating", "qa", "testing"])) return "validation";
  if (hasToken(raw, ["reviewer", "reviewing", "review"])) return "review";
  if (hasToken(raw, ["exact_head", "push", "pr", "pr_refresh", "publication_gate", "publication", "publish", "merge", "cleanup", "pull_request"])) return "publication";
  return undefined;
}

function resolveLifecycle(
  stage: LiveAgentWorkStage,
  runStatus: ExternalProjectAdosRunStatus | undefined,
  latestFact: LatestFact | undefined,
): LiveAgentWorkLifecycle {
  if (stage === "blocked") return "blocked";
  if (stage === "complete") return "complete";
  if (stage === "idle" && !runStatus && !latestFact) return "no-active-run";
  if (stage === "idle") return "no-active-run";
  return "active";
}

function createAssignment(input: {
  projectId?: string;
  stage: LiveAgentWorkStage;
  blockedStage?: LiveAgentWorkStage;
  lifecycle: LiveAgentWorkLifecycle;
  employees: ReadonlyArray<EmployeeLike>;
  providerLabel?: string;
  reasonText?: string;
}): LiveAgentWorkAssignment | undefined {
  const effectiveStage = input.stage === "blocked" ? input.blockedStage ?? input.stage : input.stage;
  const role = getRoleForStage(effectiveStage);
  if (role === "idle" && input.lifecycle !== "complete") return undefined;

  const employee = selectEmployeeForRole(input.employees, role, input.projectId);
  const visualTone = getVisualTone(input.lifecycle);
  const statusLabel = input.stage === "blocked" && input.reasonText
    ? `Blocked: ${input.reasonText}`
    : getStageLabel(input.stage, input.lifecycle);

  return {
    role,
    employeeId: employee?.id,
    displayName: employee?.name ?? input.providerLabel ?? getFallbackRoleName(role),
    providerLabel: input.providerLabel,
    statusLabel,
    department: getDepartmentForRole(role, effectiveStage),
    positionHint: getPositionHintForRole(role, effectiveStage),
    visualTone,
  };
}

function selectEmployeeForRole(
  employees: ReadonlyArray<EmployeeLike>,
  role: LiveAgentSemanticRole,
  projectId: string | undefined,
): EmployeeLike | undefined {
  const scopedEmployees = projectId
    ? employees.filter((employee) => employee.currentProjectId === projectId)
    : [];
  const sharedEmployees = employees.filter((employee) => employee.currentProjectId === undefined);
  const eligibleEmployees = scopedEmployees.length > 0
    ? scopedEmployees
    : projectId
      ? sharedEmployees
      : employees;
  const roleCandidates = eligibleEmployees.filter((employee) => matchesRole(employee, role));
  return roleCandidates[0] ?? eligibleEmployees[0];
}

function matchesRole(employee: EmployeeLike, role: LiveAgentSemanticRole) {
  const haystack = normalize([
    employee.role,
    employee.name,
    employee.provider,
    ...(employee.capabilities ?? []),
  ].join(" "));
  if (role === "implementer") return hasToken(haystack, ["engineer", "coding", "architecture", "refactoring", "implementer"]);
  if (role === "validator") return hasToken(haystack, ["qa", "test", "testing", "validation"]);
  if (role === "reviewer") return hasToken(haystack, ["review", "reviewer", "cto", "architecture"]);
  if (role === "operations") return hasToken(haystack, ["cto", "planning", "operations", "architecture"]);
  return false;
}

function getRoleForStage(stage: LiveAgentWorkStage): LiveAgentSemanticRole {
  if (stage === "preparing") return "operations";
  if (stage === "implementation") return "implementer";
  if (stage === "validation") return "validator";
  if (stage === "review") return "reviewer";
  if (stage === "publication") return "operations";
  if (stage === "blocked") return "implementer";
  return "idle";
}

function getPositionHintForRole(role: LiveAgentSemanticRole, stage: LiveAgentWorkStage): EmployeeNpcMovementPositionHint {
  if (role === "implementer") return { zone: "workstation", slot: 0 };
  if (role === "validator") return { zone: "workstation", slot: 4 };
  if (role === "reviewer") return { zone: "review", slot: 0 };
  if (role === "operations" || stage === "publication") return { zone: "meetingArea", slot: 0 };
  return { zone: "idleSpot", slot: 0 };
}

function getFallbackRoleName(role: LiveAgentSemanticRole) {
  if (role === "implementer") return "Implementer";
  if (role === "validator") return "Validator";
  if (role === "reviewer") return "Reviewer";
  if (role === "operations") return "Operations";
  return "Employee";
}

function getDepartmentForRole(role: LiveAgentSemanticRole, stage: LiveAgentWorkStage): LiveAgentWorkAssignment["department"] {
  if (role === "implementer") return "engineering";
  if (role === "validator") return "validation-qa";
  if (role === "reviewer") return "review";
  if (role === "operations" || stage === "publication") return "project-status-operations";
  return "shared";
}

function getStageLabel(stage: LiveAgentWorkStage, lifecycle: LiveAgentWorkLifecycle) {
  if (lifecycle === "blocked") return "Blocked";
  if (lifecycle === "complete") return "Complete";
  if (stage === "preparing") return "Preparing";
  if (stage === "implementation") return "Implementing";
  if (stage === "validation") return "Validating";
  if (stage === "review") return "Reviewing";
  if (stage === "publication") return "Publishing";
  return "Idle";
}

function getVisualTone(lifecycle: LiveAgentWorkLifecycle): LiveAgentVisualTone {
  if (lifecycle === "blocked") return "warning";
  if (lifecycle === "complete") return "complete";
  if (lifecycle === "active") return "active";
  return "idle";
}

function createProjectStatusDisplay(input: {
  projectName: string;
  stage: LiveAgentWorkStage;
  lifecycle: LiveAgentWorkLifecycle;
  stageLabel: string;
  rawStatus?: string;
  runStatus?: ExternalProjectAdosRunStatus;
  reasonText?: string;
  specPath?: string;
  featureBranch?: string;
  updatedAt?: string;
  requestTitle?: string;
  runId?: string;
}): LiveAgentProjectStatusDisplay {
  const rows = [
    input.requestTitle ? `Request ${compact(input.requestTitle, 38)}` : undefined,
    input.specPath ? `Spec ${compactSpecPath(input.specPath)}` : undefined,
    input.featureBranch ? `Branch ${compact(input.featureBranch, 34)}` : undefined,
    input.runId ? `Run id ${compact(input.runId, 36)}` : undefined,
    input.rawStatus ? `Run ${compact(input.rawStatus, 42)}` : "Run No active ADOS run",
    input.reasonText ? `Reason ${compact(input.reasonText, 40)}` : undefined,
    input.updatedAt ? `Updated ${input.updatedAt}` : undefined,
  ].filter((row): row is string => Boolean(row));

  return {
    title: input.projectName,
    summary: `${input.stageLabel}${input.rawStatus ? ` - ${compact(input.rawStatus, 34)}` : ""}`,
    tone: getVisualTone(input.lifecycle),
    rows,
    pipeline: createPipeline(input.stage, input.lifecycle),
  };
}

function createPipeline(stage: LiveAgentWorkStage, lifecycle: LiveAgentWorkLifecycle): LiveAgentProjectStatusDisplay["pipeline"] {
  const stages: Array<{ id: LiveAgentWorkStage; label: string }> = [
    { id: "implementation", label: "Implementation" },
    { id: "validation", label: "Validation" },
    { id: "review", label: "Review" },
    { id: "publication", label: "Publication" },
  ];
  const currentIndex = stages.findIndex((item) => item.id === stage);

  return stages.map((item, index) => ({
    ...item,
    state: lifecycle === "blocked" && index === Math.max(currentIndex, 0)
      ? "blocked"
      : lifecycle === "complete" || (lifecycle === "active" && currentIndex >= 0 && index < currentIndex)
        ? "complete"
        : lifecycle === "active" && item.id === stage
          ? "current"
          : "idle",
  }));
}

function createRawStatus(runStatus: ExternalProjectAdosRunStatus | undefined, latestFactLabel: string | undefined) {
  const parts = [runStatus?.stage, runStatus?.status, latestFactLabel].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

function createReasonText(runStatus: ExternalProjectAdosRunStatus | undefined, latestFact: LatestFact | undefined) {
  const reasonCodes = latestFact?.reasonCodes?.length ? latestFact.reasonCodes : runStatus?.reasonCodes;
  if (!reasonCodes?.length) return undefined;
  return reasonCodes.map((reason) => reason.replace(/_/g, " ")).join(", ");
}

function getSpecPath(projectRunState: ProjectAdosRunState) {
  return projectRunState.execution?.specPath
    ?? projectRunState.preparation?.specPath;
}

function getExternalProviderLabel(projectRunState: ProjectAdosRunState) {
  return projectRunState.execution?.evidence?.agentId
    ?? projectRunState.execution?.evidence?.providerId;
}

function createIdleState(input: { projectName: string; employees: ReadonlyArray<EmployeeLike> }): LiveAgentWorkState {
  return {
    projectName: input.projectName,
    lifecycle: "no-active-run",
    stage: "idle",
    stageLabel: "Idle",
    assignments: [],
    projectStatus: createProjectStatusDisplay({
      projectName: input.projectName,
      stage: "idle",
      lifecycle: "no-active-run",
      stageLabel: "Idle",
    }),
  };
}

function latestByTimestamp<T extends Record<string, unknown>>(items: ReadonlyArray<T> | undefined, timestampKey: keyof T): T | undefined {
  return [...(items ?? [])].sort((left, right) => compareTimestamp(String(right[timestampKey] ?? ""), String(left[timestampKey] ?? "")))[0];
}

function latestFact(facts: ReadonlyArray<LatestFact>) {
  return [...facts].sort((left, right) => compareTimestamp(right.updatedAt, left.updatedAt))[0];
}

function latestTimestamp(...timestamps: Array<string | undefined>) {
  return timestamps.filter(Boolean).sort((left, right) => compareTimestamp(right, left))[0];
}

function compareTimestamp(left: string | undefined, right: string | undefined) {
  const diff = Date.parse(left ?? "") - Date.parse(right ?? "");
  if (Number.isFinite(diff) && diff !== 0) return diff;
  return String(left ?? "").localeCompare(String(right ?? ""));
}

function isBlockedStatus(value: string) {
  return isHardBlockedStatus(value) || isRecoveryStatus(value);
}

function isHardBlockedStatus(value: string) {
  return hasToken(value, ["blocked", "failed", "timedout", "timed_out", "cancelled", "intervention", "spawn_failed", "provider_unavailable"]);
}

function isRecoveryStatus(value: string) {
  return hasToken(value, ["recovery"]);
}

function isCompletedStatus(value: string) {
  return hasToken(value, ["complete", "completed"]);
}

function isActiveAdosRunStage(value: string | undefined) {
  return value === "Prepared" || value === "Started" || value === "Blocked" || value === "TimedOut";
}

function isTerminalAdosExecutionStatus(value: string | undefined) {
  return isCompletedStatus(normalize(value))
    || isHardBlockedStatus(normalize(value))
    || hasToken(normalize(value), ["failed", "cancelled"]);
}

function isActiveAdosExecution(execution: NonNullable<ProjectAdosRunState["execution"]>) {
  if (
    execution.status === "Completed" &&
    execution.implementerStarted &&
    !execution.evidence.completed &&
    !execution.evidence.timedOut &&
    !execution.evidence.cancelled
  ) {
    return true;
  }
  return !isTerminalAdosExecutionStatus(execution.status);
}

function isTerminalDevelopmentRequestStatus(value: string | undefined) {
  return value === "Completed" || value === "Failed";
}

function hasToken(value: string, tokens: ReadonlyArray<string>) {
  const parts = value.split("_").filter(Boolean);
  return tokens.some((token) => token.length <= 2 ? parts.includes(token) : value.includes(token));
}

function normalize(value: string | undefined) {
  return String(value ?? "").toLowerCase().replace(/[\s-]+/g, "_");
}

function compactSpecPath(value: string) {
  const match = value.match(/specs\/([^/\\]+)\/spec\.md$/);
  return match?.[1] ?? compact(value, 32);
}

function compact(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(maxLength - 3, 0))}...`;
}
