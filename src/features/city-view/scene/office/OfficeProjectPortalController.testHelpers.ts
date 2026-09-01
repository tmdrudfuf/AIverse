import type { PhaserScene } from "../shared/phaserTypes";
import type { CandidateAssignmentRecommendationCollection } from "./candidate-assignments/CandidateAssignmentTypes";
import type { CandidateProjectTaskPromotionResultCollection } from "./candidate-project-task-promotions/CandidateProjectTaskPromotionTypes";
import type { CandidatePromotionDecision, CandidatePromotionReviewCollection } from "./candidate-promotions/CandidatePromotionTypes";
import type { CandidateTaskCollection } from "./candidate-tasks/CandidateTaskTypes";
import type { Employee } from "./employees/EmployeeTypes";
import type { ActiveWorkSessionStartResultCollection } from "./active-work-sessions/ActiveWorkSessionTypes";
import type { ActiveWorkSessionStartService } from "./active-work-sessions/ActiveWorkSessionStartService";
import type { ExecutionPlanCollection, ExecutionPlanResultCollection } from "./execution-plans/ExecutionPlanTypes";
import type {
  ExecutionReadinessCollection,
  ExecutionReadinessResultCollection,
} from "./execution-readiness/ExecutionReadinessTypes";
import type {
  HumanExecutionApprovalCollection,
  HumanExecutionApprovalResultCollection,
} from "./human-execution-approvals/HumanExecutionApprovalTypes";
import type {
  RuntimeStartCollection,
  RuntimeStartResultCollection,
} from "./runtime-start/RuntimeStartTypes";
import type { IssueSnapshotCollection } from "./issue-sync/IssueSyncTypes";
import type {
  ImplementerRuntimeCollection,
  ImplementerRuntimeResultCollection,
  ImplementerRuntimeInput,
  ImplementerRuntimeOutcome,
} from "./implementer-runtime/ImplementerRuntimeTypes";
import { OfficeProjectPortalController, type OfficeProjectPortalInput } from "./OfficeProjectPortalController";
import type {
  ReviewerRuntimeCollection,
  ReviewerRuntimeInput,
  ReviewerRuntimeOutcome,
  ReviewerRuntimeResultCollection,
} from "./reviewer-runtime/ReviewerRuntimeTypes";
import type { ReviewFixRuntimeInput, ReviewFixRuntimeOutcome } from "./review-fix-runtime/ReviewFixRuntimeTypes";
import type { ValidationRuntimeInput, ValidationRuntimeOutcome } from "./validation-runtime/ValidationRuntimeTypes";
import type {
  StartExternalProjectAdosExecutionInput,
  StartExternalProjectAdosExecutionOutcome,
} from "./external-ados-execution/ExternalProjectAdosExecutionService";
import type {
  PostValidationReviewTargetInput,
  PostValidationReviewTargetOutcome,
} from "./post-validation-review-target/PostValidationReviewTargetTypes";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import type {
  PreparedWorkSessionRecord,
  PreparedWorkSessionResultCollection,
} from "./prepared-work-sessions/PreparedWorkSessionTypes";
import type { TaskCollection } from "./tasks/ProjectTaskTypes";
import type { WorkSession } from "./work-sessions/WorkSessionTypes";

type ProjectPortalProjectLike = {
  id: string;
  name?: string;
  status?: string;
  type?: string;
  enabled?: boolean;
  description?: string;
  linkedServices?: unknown[];
  nextAction?: unknown;
  repositoryIdentity?: unknown;
};

export type ControllerInternals = {
  state: {
    viewMode: string;
    selectedProjectDashboardProjectId: string | undefined;
    selectedProjectId: string;
    selectedProjectIndex: number;
    selectedTaskProjectId: string | undefined;
    selectedTaskId: string | undefined;
    selectedTaskIndex: number;
    selectedBacklogProjectId?: string;
    selectedBacklogTaskId?: string;
    selectedBacklogTaskIndex: number;
    selectedEmployeeIndex: number;
    projects: ProjectPortalProjectLike[];
    projectRegistryEntries: ProjectPortalState["projectRegistryEntries"];
    projectCompanyBindings?: ProjectPortalState["projectCompanyBindings"];
    repositorySummaries: Record<string, { connectionStatus: string }>;
    repositorySyncSnapshots: ProjectPortalState["repositorySyncSnapshots"];
    issueSyncCollections: Record<string, IssueSnapshotCollection>;
    candidateTaskCollections: Record<string, CandidateTaskCollection>;
    candidateAssignmentCollections: Record<string, CandidateAssignmentRecommendationCollection>;
    candidatePromotionReviewCollections: Record<string, CandidatePromotionReviewCollection>;
    selectedCandidatePromotionIndex: number;
    candidatePromotionDecisionRecords: Record<string, CandidatePromotionDecision>;
    candidateProjectTaskPromotionResultCollections: Record<string, CandidateProjectTaskPromotionResultCollection>;
    confirmedEmployeeAssignmentRecords: ProjectPortalState["confirmedEmployeeAssignmentRecords"];
    confirmedEmployeeAssignmentResultCollections: ProjectPortalState["confirmedEmployeeAssignmentResultCollections"];
    preparedWorkSessionRecords: Record<string, PreparedWorkSessionRecord>;
    preparedWorkSessionResultCollections: Record<string, PreparedWorkSessionResultCollection>;
    activeWorkSessionStartResultCollections: Record<string, ActiveWorkSessionStartResultCollection>;
    executionPlanCollections: Record<string, ExecutionPlanCollection>;
    executionPlanResultCollections: Record<string, ExecutionPlanResultCollection>;
    executionReadinessCollections: Record<string, ExecutionReadinessCollection>;
    executionReadinessResultCollections: Record<string, ExecutionReadinessResultCollection>;
    humanExecutionApprovalCollections: Record<string, HumanExecutionApprovalCollection>;
    humanExecutionApprovalResultCollections: Record<string, HumanExecutionApprovalResultCollection>;
    runtimePreflightCollections: ProjectPortalState["runtimePreflightCollections"];
    runtimePreflightResultCollections: ProjectPortalState["runtimePreflightResultCollections"];
    runtimeStartCollections: Record<string, RuntimeStartCollection>;
    runtimeStartResultCollections: Record<string, RuntimeStartResultCollection>;
    implementerRuntimeCollections: Record<string, ImplementerRuntimeCollection>;
    implementerRuntimeResultCollections: Record<string, ImplementerRuntimeResultCollection>;
    reviewerRuntimeCollections: Record<string, ReviewerRuntimeCollection>;
    reviewerRuntimeResultCollections: Record<string, ReviewerRuntimeResultCollection>;
    reviewTargets?: ProjectPortalState["reviewTargets"];
    reviewPromotionCollections?: ProjectPortalState["reviewPromotionCollections"];
    reviewPromotionResultCollections?: ProjectPortalState["reviewPromotionResultCollections"];
    reviewFixRequestCollections?: ProjectPortalState["reviewFixRequestCollections"];
    reviewFixRequestResultCollections?: ProjectPortalState["reviewFixRequestResultCollections"];
    reviewFixPlanCollections?: ProjectPortalState["reviewFixPlanCollections"];
    reviewFixPlanResultCollections?: ProjectPortalState["reviewFixPlanResultCollections"];
    reviewFixRuntimeCollections?: ProjectPortalState["reviewFixRuntimeCollections"];
    reviewFixRuntimeResultCollections?: ProjectPortalState["reviewFixRuntimeResultCollections"];
    validationRuntimeCollections?: ProjectPortalState["validationRuntimeCollections"];
    validationRuntimeResultCollections?: ProjectPortalState["validationRuntimeResultCollections"];
    postValidationReviewTargetCollections?: ProjectPortalState["postValidationReviewTargetCollections"];
    postValidationReviewTargetResultCollections?: ProjectPortalState["postValidationReviewTargetResultCollections"];
    externalProjectAdosRunPreparations: ProjectPortalState["externalProjectAdosRunPreparations"];
    externalProjectDevelopmentRequestDrafts: ProjectPortalState["externalProjectDevelopmentRequestDrafts"];
    externalProjectAdosExecutions: ProjectPortalState["externalProjectAdosExecutions"];
    externalProjectAdosExecutionResults: ProjectPortalState["externalProjectAdosExecutionResults"];
    externalProjectAdosRunStatuses: ProjectPortalState["externalProjectAdosRunStatuses"];
    projectBacklogCollections: ProjectPortalState["projectBacklogCollections"];
    taskCollections: Record<string, TaskCollection>;
    employees: Employee[];
    employeeSimulations: ProjectPortalState["employeeSimulations"];
    workSessions: Record<string, WorkSession[]>;
  };
  activeWorkSessionStartService: ActiveWorkSessionStartService;
  issueSyncService: {
    readIssueSnapshots: (identity: { owner?: string; name?: string; provider: string }) => Promise<IssueSnapshotCollection>;
  };
  implementerRuntimeService: {
    startImplementer: (input: ImplementerRuntimeInput) => Promise<ImplementerRuntimeOutcome>;
    upsertResult: (
      collection: ImplementerRuntimeResultCollection | undefined,
      result: ImplementerRuntimeResultCollection["results"][number],
    ) => ImplementerRuntimeResultCollection;
  };
  reviewerRuntimeService: {
    startReviewer: (input: ReviewerRuntimeInput) => Promise<ReviewerRuntimeOutcome>;
    upsertResult: (
      collection: ReviewerRuntimeResultCollection | undefined,
      result: ReviewerRuntimeResultCollection["results"][number],
    ) => ReviewerRuntimeResultCollection;
  };
  reviewFixRuntimeService: {
    startFixRuntime: (
      input: ReviewFixRuntimeInput,
      command: { projectId: string; reviewFixPlanId: string; actor: string; startedAt: string },
    ) => Promise<ReviewFixRuntimeOutcome>;
  };
  validationRuntimeService: {
    startValidation: (
      input: ValidationRuntimeInput,
      command: { projectId: string; reviewFixRuntimeId: string; actor: string; startedAt: string },
    ) => Promise<ValidationRuntimeOutcome>;
  };
  externalProjectAdosExecutionService: {
    start: (input: StartExternalProjectAdosExecutionInput) => Promise<StartExternalProjectAdosExecutionOutcome>;
  };
  postValidationReviewTargetService: {
    prepareTarget: (
      input: PostValidationReviewTargetInput,
      command: { projectId: string; validationRuntimeId: string; actor: string; requestedAt: string },
    ) => PostValidationReviewTargetOutcome;
  };
  syncIssueSnapshots: (projectId: string) => Promise<void>;
  recordCandidatePromotionDecision: (projectId: string, candidateTaskId: string, targetStatus: "Approved" | "Rejected" | "Deferred") => boolean;
  promoteSelectedCandidateTask: (projectId: string, candidateTaskId: string) => boolean;
  assignSelectedEmployeeToSelectedTask: () => void;
  startSelectedWorkSessionForPromotion: (projectId: string, candidateTaskId: string) => boolean;
  startPlaceholderWorkOnSelectedTask: () => Promise<void>;
  moveSelectedTaskToReview: () => void;
  markSelectedTaskDone: () => void;
  startImplementerRuntimeForPromotion: (projectId: string, candidateTaskId: string) => Promise<boolean>;
  startReviewerRuntimeForPromotion: (projectId: string, candidateTaskId: string) => Promise<boolean>;
  startReviewFixRuntimeForPromotion: (projectId: string, candidateTaskId: string) => Promise<boolean>;
  startValidationRuntimeForPromotion: (projectId: string, candidateTaskId: string) => Promise<boolean>;
  preparePostValidationReviewTargetForPromotion: (projectId: string, candidateTaskId: string) => boolean;
  startPostValidationReviewForPromotion: (projectId: string, candidateTaskId: string) => Promise<boolean>;
};

export function getControllerInternals(controller: OfficeProjectPortalController): ControllerInternals {
  return controller as unknown as ControllerInternals;
}

export function employee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "gpt-engineer",
    name: "GPT Engineer",
    role: "Engineer",
    status: "Idle",
    avatarColor: "#2563eb",
    capabilities: [],
    description: "Employee",
    ...overrides,
  };
}

export function setDailyProofIdentity(internals: ControllerInternals) {
  const dailyProof = internals.state.projects.find((project) => project.id === "daily-proof");
  if (dailyProof) {
    dailyProof.repositoryIdentity = {
      provider: "github",
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      connectionState: "Configured",
    };
  }
}

export function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

export function createInput(overrides: Partial<OfficeProjectPortalInput>): OfficeProjectPortalInput {
  return {
    actionPressed: false,
    escapePressed: false,
    upPressed: false,
    downPressed: false,
    enterPressed: false,
    openCandidateDetailPressed: false,
    approveCandidateDetailPressed: false,
    deferCandidateDetailPressed: false,
    rejectCandidateDetailPressed: false,
    startImplementerPressed: false,
    startReviewerPressed: false,
    promoteReviewPressed: false,
    requestReviewFixPressed: false,
    planReviewFixPressed: false,
    startReviewFixRuntimePressed: false,
    startValidationRuntimePressed: false,
    preparePostValidationReviewTargetPressed: false,
    startPostValidationReviewPressed: false,
    startBacklogDevelopmentPressed: false,
    ...overrides,
  };
}

export async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

export function createSceneStub(): PhaserScene {
  const createChainable = () => ({
    setOrigin: () => createChainable(),
    setScrollFactor: () => createChainable(),
    setDepth: () => createChainable(),
    setVisible: () => createChainable(),
    destroy: () => undefined,
  });
  const createGraphics = () => {
    const graphics = {
      fillStyle: () => graphics,
      fillRoundedRect: () => graphics,
      lineStyle: () => graphics,
      strokeRoundedRect: () => graphics,
      lineBetween: () => graphics,
    };
    return graphics;
  };
  const createContainer = () => ({
    add: () => undefined,
    removeAll: () => undefined,
    setScrollFactor: () => createContainer(),
    setDepth: () => createContainer(),
    setVisible: () => createContainer(),
    destroy: () => undefined,
  });

  return {
    scale: {
      width: 1024,
      height: 768,
    },
    add: {
      rectangle: () => createChainable(),
      graphics: () => createGraphics(),
      container: () => createContainer(),
      text: () => createChainable(),
    },
  } as unknown as PhaserScene;
}

function succeededIssueCollectionWithBug(): IssueSnapshotCollection {
  return {
    provider: "github",
    owner: "ai-verse",
    name: "daily-proof",
    syncStatus: "Succeeded",
    issues: [createIssue("ai-verse/daily-proof#1", 1, "Fix crash", ["bug"])],
    openCount: 1,
    closedCount: 0,
    isTruncated: false,
    lastSuccessfulSyncAt: "2026-01-01T00:00:00.000Z",
  };
}

function createIssue(id: string, number: number, title: string, labels: string[] = [], state: "Open" | "Closed" = "Open") {
  return {
    id,
    number,
    title,
    state,
    assignees: [],
    labels,
    provider: "github",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    syncedAt: "2026-01-01T00:00:00.000Z",
  };
}

/**
 * Drives a promoted Daily Proof candidate task through the full existing
 * chain (approve -> promote -> confirm assignment -> prepare -> start ->
 * create execution plan -> evaluate readiness -> approve execution -> run
 * runtime preflight -> explicit runtime start), reusing the exact sequence
 * established in OfficeProjectPortalController.issue-sync.test.ts's "creates
 * an execution plan only after a separate input following work-session
 * start" test. Returns the resulting promoted ProjectTask's id.
 */
export async function driveDailyProofToRuntimeStart(
  controller: OfficeProjectPortalController,
  internals: ControllerInternals,
): Promise<{ promotedTaskId: string }> {
  setDailyProofIdentity(internals);
  internals.state.projects.find((project) => project.id === "daily-proof")!.repositoryIdentity = {
    provider: "github",
    owner: "ai-verse",
    name: "daily-proof",
    defaultBranch: "main",
    localPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-daily-proof-configured-runtime-repository-context",
    connectionState: "Available",
  };
  internals.state.repositorySyncSnapshots["daily-proof"] = {
    provider: "github",
    availability: "available",
    owner: "ai-verse",
    name: "daily-proof",
    defaultBranch: "main",
    currentBranch: "codex/103-daily-proof-configured-runtime-repository-context",
    syncStatus: "Succeeded",
    workingTreeState: "clean",
  };
  internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
  internals.state.taskCollections["daily-proof"] = { projectId: "daily-proof", tasks: [] };
  internals.issueSyncService = {
    readIssueSnapshots: async () => succeededIssueCollectionWithBug(),
  };

  controller.open();
  controller.updateInput(createInput({}));
  internals.state.viewMode = "project-dashboard";
  internals.state.selectedProjectDashboardProjectId = "daily-proof";
  await internals.syncIssueSnapshots("daily-proof");

  controller.updateInput(createInput({ enterPressed: true })); // approve
  controller.updateInput(createInput({ enterPressed: true })); // promote
  controller.updateInput(createInput({ enterPressed: true })); // confirm assignment
  controller.updateInput(createInput({ enterPressed: true })); // prepare
  controller.updateInput(createInput({ enterPressed: true })); // start
  controller.updateInput(createInput({ enterPressed: true })); // create execution plan
  controller.updateInput(createInput({ enterPressed: true })); // evaluate execution readiness
  controller.updateInput(createInput({ enterPressed: true })); // approve execution
  controller.updateInput(createInput({ enterPressed: true })); // run runtime preflight
  controller.updateInput(createInput({ enterPressed: true })); // explicit runtime start

  const starts = internals.state.runtimeStartCollections["daily-proof"]?.starts ?? [];
  if (starts.length !== 1) {
    throw new Error(
      `Test setup failed to reach a single Runtime Start record (found ${starts.length}) -- fixture drifted from the real controller flow.`,
    );
  }

  const plan = internals.state.executionPlanCollections["daily-proof"]?.plans[0];
  if (!plan) throw new Error("Test setup failed to reach an Execution Plan.");

  return { promotedTaskId: plan.candidateTaskId ?? plan.projectTaskId };
}

export function realUpsertResult(internals: ControllerInternals) {
  // Mirrors the real ImplementerRuntimeService.upsertResult behavior closely
  // enough for the controller's own duplicate-active-attempt block path,
  // which calls upsertResult directly against whatever service is wired in.
  return (collection: ImplementerRuntimeResultCollection | undefined, result: ImplementerRuntimeResultCollection["results"][number]) => {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return {
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      resultCount: nextResults.length,
      generatedAt: result.resultAt,
      rulesVersion: result.rulesVersion,
    };
  };
}
