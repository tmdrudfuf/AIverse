import type { PhaserScene } from "../shared/phaserTypes";
import { AIProjectManagerService } from "./ai/AIProjectManagerService";
import { AIService } from "./ai/AIService";
import { createMockAIService } from "./ai/MockAIServiceFactory";
import { ActiveWorkSessionStartService } from "./active-work-sessions/ActiveWorkSessionStartService";
import {
  BrowserOfficeSessionService,
  createBrowserOfficeSessionService,
} from "./browser-session/BrowserOfficeSessionService";
import { EmployeeConversationService } from "./conversations/EmployeeConversationService";
import type {
  EmployeeConversation,
  EmployeeConversationViewModel,
  NearbyEmployeeConversationTarget,
} from "./conversations/EmployeeConversationTypes";
import {
  createCompanyDashboardProviderRegistry,
  getEnabledCompanyDashboardProvider,
} from "./dashboard/CompanyDashboardProviderRegistry";
import { CandidateAssignmentService } from "./candidate-assignments/CandidateAssignmentService";
import { CandidateProjectTaskPromotionService } from "./candidate-project-task-promotions/CandidateProjectTaskPromotionService";
import { CandidatePromotionService } from "./candidate-promotions/CandidatePromotionService";
import type { CandidatePromotionReview, CandidatePromotionStatus } from "./candidate-promotions/CandidatePromotionTypes";
import { CandidateTaskService } from "./candidate-tasks/CandidateTaskService";
import {
  ConfirmedEmployeeAssignmentService,
  parsePromotedProjectTaskProvenance,
} from "./confirmed-assignments/ConfirmedEmployeeAssignmentService";
import { PreparedWorkSessionService } from "./prepared-work-sessions/PreparedWorkSessionService";
import type { CompanyDashboardProvider } from "./dashboard/CompanyDashboardTypes";
import { EmployeeAIService } from "./employees/EmployeeAIService";
import type { EmployeeAISnapshot } from "./employees/EmployeeAITypes";
import { EmployeeRecruitmentService } from "./employees/EmployeeRecruitmentService";
import { EmployeeService } from "./employees/EmployeeService";
import { EmployeeSimulationService } from "./employees/EmployeeSimulationService";
import type { EmployeeSimulationSnapshot } from "./employees/EmployeeSimulationTypes";
import { MockEmployeeProvider } from "./employees/MockEmployeeProvider";
import {
  canCreateExternalProjectAdosRunPreparation,
  createExternalProjectAdosRunPreparation,
} from "./external-ados-run-preparation/ExternalProjectAdosRunPreparationService";
import { ExternalProjectAdosExecutionService } from "./external-ados-execution/ExternalProjectAdosExecutionService";
import type { ExternalProjectAdosExecution } from "./external-ados-execution/ExternalProjectAdosExecutionTypes";
import { deriveExternalProjectAdosRunStatus } from "./external-ados-run-status/ExternalProjectAdosRunStatusService";
import {
  canCreateExternalProjectDevelopmentRequestDraft,
  createExternalProjectDevelopmentRequestDraft,
  resolveDevelopmentRequestTargetProject,
} from "./external-development-requests/ExternalProjectDevelopmentRequestService";
import { ExecutionPlanService } from "./execution-plans/ExecutionPlanService";
import { createExecutionPlanCollection, resolveCurrentExecutionPlan, type ExecutionPlan } from "./execution-plans/ExecutionPlanTypes";
import { ExecutionReadinessService } from "./execution-readiness/ExecutionReadinessService";
import {
  createExecutionReadinessCollection,
  createExecutionReadinessResultCollection,
  type ExecutionReadinessRepositoryEvidence,
} from "./execution-readiness/ExecutionReadinessTypes";
import { HumanExecutionApprovalService } from "./human-execution-approvals/HumanExecutionApprovalService";
import { createHumanExecutionApprovalCollection } from "./human-execution-approvals/HumanExecutionApprovalTypes";
import { RuntimePreflightService } from "./runtime-preflight/RuntimePreflightService";
import { RepresentedRuntimeEnvironmentProvider } from "./runtime-preflight/RuntimePreflightProvider";
import {
  createRuntimePreflightCollection,
  createRuntimePreflightResultCollection,
  type RuntimeEnvironmentProvider,
  type RuntimePreflightEvidence,
} from "./runtime-preflight/RuntimePreflightTypes";
import { RuntimeStartService } from "./runtime-start/RuntimeStartService";
import {
  createRuntimeStartCollection,
  createRuntimeStartResultCollection,
} from "./runtime-start/RuntimeStartTypes";
import { ClaudeImplementerRuntimeProvider } from "./implementer-runtime/ClaudeImplementerRuntimeProvider";
import { ImplementerRuntimeService } from "./implementer-runtime/ImplementerRuntimeService";
import {
  IMPLEMENTER_RUNTIME_APPROVED_IMPLEMENTER_AGENT,
  IMPLEMENTER_RUNTIME_APPROVED_REVIEWER_AGENT,
  IMPLEMENTER_RUNTIME_RULES_VERSION,
  createImplementerRuntimeCollection,
  createImplementerRuntimeResultCollection,
} from "./implementer-runtime/ImplementerRuntimeTypes";
import { CodexReviewerRuntimeProvider } from "./reviewer-runtime/CodexReviewerRuntimeProvider";
import { ReviewerRuntimeService } from "./reviewer-runtime/ReviewerRuntimeService";
import {
  REVIEWER_RUNTIME_APPROVED_IMPLEMENTER_AGENT,
  REVIEWER_RUNTIME_APPROVED_REVIEWER_AGENT,
  REVIEWER_RUNTIME_RULES_VERSION,
  createReviewerRuntimeCollection,
  createReviewerRuntimeResultCollection,
} from "./reviewer-runtime/ReviewerRuntimeTypes";
import { resolveReviewTarget } from "./reviewer-runtime/ReviewTarget";
import { ReviewDecisionService, resolveReviewDecisionInput } from "./review-decision/ReviewDecisionService";
import {
  createReviewPromotionCollection,
  createReviewPromotionResultCollection,
  REVIEW_PROMOTION_RULES_VERSION,
} from "./review-decision/ReviewDecisionTypes";
import { ReviewFixRequestService, findCurrentReviewFixRequest } from "./review-fix-requests/ReviewFixRequestService";
import {
  REVIEW_FIX_REQUEST_RULES_VERSION,
  createReviewFixRequestCollection,
  createReviewFixRequestResultCollection,
} from "./review-fix-requests/ReviewFixRequestTypes";
import { ReviewFixPlanService, findCurrentReviewFixPlan } from "./review-fix-plans/ReviewFixPlanService";
import {
  REVIEW_FIX_PLAN_RULES_VERSION,
  createReviewFixPlanCollection,
  createReviewFixPlanResultCollection,
} from "./review-fix-plans/ReviewFixPlanTypes";
import { ImplementerReviewFixRuntimeProvider } from "./review-fix-runtime/ReviewFixRuntimeProvider";
import { ReviewFixRuntimeService, findCurrentReviewFixRuntime } from "./review-fix-runtime/ReviewFixRuntimeService";
import {
  REVIEW_FIX_RUNTIME_RULES_VERSION,
  createReviewFixRuntimeCollection,
  createReviewFixRuntimeResultCollection,
} from "./review-fix-runtime/ReviewFixRuntimeTypes";
import { LocalValidationRuntimeProvider } from "./validation-runtime/ValidationRuntimeProvider";
import { ValidationRuntimeService, findCurrentValidationRuntime } from "./validation-runtime/ValidationRuntimeService";
import {
  VALIDATION_RUNTIME_RULES_VERSION,
  createValidationRuntimeCollection,
  createValidationRuntimeResultCollection,
} from "./validation-runtime/ValidationRuntimeTypes";
import { PostValidationReviewTargetService, findCurrentPostValidationReviewTarget } from "./post-validation-review-target/PostValidationReviewTargetService";
import {
  POST_VALIDATION_REVIEW_TARGET_RULES_VERSION,
  createPostValidationReviewTargetCollection,
  createPostValidationReviewTargetResultCollection,
} from "./post-validation-review-target/PostValidationReviewTargetTypes";
import { CachedGitHubRepositoryProvider } from "./github/CachedGitHubRepositoryProvider";
import { GitHubPublicRepositoryProvider } from "./github/GitHubPublicRepositoryProvider";
import { createRepositoryReferenceResolver } from "./github/GitHubRepositoryReferenceResolver";
import { GitHubRepositoryService } from "./github/GitHubRepositoryService";
import type { GitHubRepositorySummary } from "./github/GitHubRepositoryTypes";
import type { EmployeeInsightSource, EmployeeInsightTarget } from "./insight/EmployeeInsightTypes";
import { CompanyInfluencePlanningService } from "./influence/CompanyInfluencePlanningService";
import type { CompanyFocusId, CompanyFocusSummary } from "./influence/CompanyInfluencePlanningTypes";
import type { EmployeeKnowledgeSource } from "./knowledge/EmployeeKnowledgeTypes";
import { deriveLiveAgentWorkState, type LiveAgentWorkState } from "./LiveAgentWorkVisualization";
import { OfficeLayoutService } from "./layout/OfficeLayoutService";
import type { OfficeLayoutPositionHint, OfficeLayoutSnapshot, OfficeLayoutZone } from "./layout/OfficeLayoutTypes";
import {
  EXTERNAL_PROJECT_DRAFT_ID,
  EXTERNAL_PROJECT_REPOSITORY_IDENTITY_CHOICES,
  addExternalProjectDraftToState,
  applyExternalProjectDraftRepositoryIdentityChoiceToState,
  createProjectPortalState,
} from "./OfficeProjectPortalRegistry";
import type { ProjectPortalState, TaskCompletionProgressionFeedback } from "./OfficeProjectPortalTypes";
import { ProjectBacklogService } from "./project-backlog/ProjectBacklogService";
import { ProjectAutonomousExecutionPolicyService } from "./project-backlog/ProjectAutonomousExecutionPolicyService";
import {
  ProjectBacklogDevelopmentBridgeService,
  createProjectBacklogDevelopmentAssociationKey,
} from "./project-backlog/ProjectBacklogDevelopmentBridgeService";
import {
  DeterministicProjectBacklogSuggestionProvider,
  ProjectBacklogSuggestionService,
} from "./project-backlog/ProjectBacklogSuggestionService";
import type { ProjectBacklogSuggestionProvider } from "./project-backlog/ProjectBacklogSuggestionTypes";
import type { ProjectAutonomyEvaluationResult } from "./project-backlog/ProjectAutonomousExecutionPolicyTypes";
import type { ProjectBacklogPlanningStatus, ProjectBacklogPriority, ProjectBacklogTask } from "./project-backlog/ProjectBacklogTypes";
import type { RepositorySyncSnapshot } from "./repository-sync/RepositorySyncTypes";
import { ReceptionDeskUpgradeBenefitsService } from "./ReceptionDeskUpgradeBenefitsService";
import { EmployeeNpcMovementService } from "./npc/EmployeeNpcMovementService";
import { resolveEmployeeNpcWorldPosition } from "./npc/EmployeeNpcPositionResolver";
import type { EmployeeNpcMovementPositionHint, EmployeeNpcMovementSnapshot } from "./npc/EmployeeNpcMovementTypes";
import type { EmployeeNpcPositionZone, EmployeeNpcViewModel } from "./npc/EmployeeNpcTypes";
import { OfficeProjectPortalView } from "./OfficeProjectPortalView";
import { InternalSimulationProjectDashboardProvider } from "./project-dashboard/InternalSimulationProjectDashboardProvider";
import { GitHubProjectDashboardProvider } from "./project-dashboard/GitHubProjectDashboardProvider";
import type {
  ProjectDashboardProvider,
  ProjectDashboardProviderContext,
  ProjectDashboardSnapshot,
  ProjectDashboardSourceMetadata,
} from "./project-dashboard/ProjectDashboardTypes";
import { CompanyProgressionService } from "./progression/CompanyProgressionService";
import { CompanyProgressionTriggerService } from "./progression/CompanyProgressionTriggerService";
import type { CompanyProgressionSnapshot, CompanyProgressionTrigger, OfficeZoneUnlockPreview } from "./progression/CompanyProgressionTypes";
import {
  CompanyGrowthGameplayLoopService,
  copyCompanyProgressionTrigger,
  type CompanyGrowthGameplayLoopResult,
} from "./progression/CompanyGrowthGameplayLoopService";
import { GitHubIssueSyncProvider } from "./issue-sync/GitHubIssueSyncProvider";
import { IssueSyncService } from "./issue-sync/IssueSyncService";
import { LocalIssueSyncProvider } from "./issue-sync/LocalIssueSyncProvider";
import { createSyncingIssueSnapshotCollection } from "./issue-sync/IssueSyncTypes";
import { GitHubRepositorySyncProvider } from "./repository-sync/GitHubRepositorySyncProvider";
import { LocalRepositorySyncProvider } from "./repository-sync/LocalRepositorySyncProvider";
import { RepositorySyncService } from "./repository-sync/RepositorySyncService";
import { createSyncingRepositorySyncSnapshot } from "./repository-sync/RepositorySyncTypes";
import { EmployeeDailyScheduleService } from "./schedules/EmployeeDailyScheduleService";
import type {
  EmployeeDailyScheduleSnapshot,
  EmployeeSchedulePositionIntent,
} from "./schedules/EmployeeDailyScheduleTypes";
import { MockProjectTaskProvider } from "./tasks/MockProjectTaskProvider";
import { ProjectTaskService } from "./tasks/ProjectTaskService";
import type { ProjectTask, TaskActivity, TaskStatus } from "./tasks/ProjectTaskTypes";
import { MockWorkSessionProvider } from "./work-sessions/MockWorkSessionProvider";
import { WorkSessionService } from "./work-sessions/WorkSessionService";
import { WorkstationOccupancyService } from "./workstations/WorkstationOccupancyService";
import type { WorkstationSnapshot } from "./workstations/WorkstationTypes";

const CONVERSATION_POSITION_ZONES = new Set<string>([
  "desk",
  "collaboration",
  "review",
  "idle",
  "entrance",
  "workstation",
  "meetingArea",
  "breakArea",
  "idleSpot",
]);
const EXECUTION_PLAN_FEATURE_ID = "103-daily-proof-configured-runtime-repository-context";
const EXECUTION_PLAN_SPEC_PATH = "specs/103-daily-proof-configured-runtime-repository-context/spec.md";
const EXECUTION_PLAN_VALIDATION_COMMANDS = [
  "npm test",
  "npx tsc --noEmit",
  "npm run build",
  "git diff --check",
  "git diff --cached --check",
];
const EXECUTION_PLAN_ALLOWED_MUTATION_SCOPE = [
  "local-worktree-only",
  "no-agent-runtime",
  "no-subprocess",
  "no-repository-mutation",
  "no-github-mutation",
];

function createExecutionPlanRepositoryContext(
  project: ProjectPortalState["projects"][number] | undefined,
  repositorySnapshot: RepositorySyncSnapshot | undefined,
) {
  const repositoryIdentity = project?.repositoryIdentity;
  const repositoryId = repositoryIdentity?.owner && repositoryIdentity.name
    ? `${repositoryIdentity.provider}:${repositoryIdentity.owner}/${repositoryIdentity.name}`
    : undefined;
  const binding = project?.localRepositoryBinding;
  const repositoryPath = binding?.repositoryPath ?? repositoryIdentity?.localPath;
  const worktreePath = binding?.worktreePath ?? repositoryIdentity?.localPath;
  const branchName = binding?.branchName ?? repositorySnapshot?.currentBranch;
  const specPath = binding?.specPath ?? EXECUTION_PLAN_SPEC_PATH;

  if (!repositoryId || !repositoryPath || !worktreePath || !branchName || !specPath) return undefined;
  return {
    repositoryId,
    repositoryPath,
    worktreePath,
    branchName,
    specPath,
  };
}

function createExecutionReadinessRepositoryEvidence(
  projectId: string,
  project: ProjectPortalState["projects"][number] | undefined,
  repositorySnapshot: RepositorySyncSnapshot | undefined,
  plan: ExecutionPlan,
): ExecutionReadinessRepositoryEvidence {
  const repositoryIdentity = project?.repositoryIdentity;
  const repositoryId = repositoryIdentity?.owner && repositoryIdentity.name
    ? `${repositoryIdentity.provider}:${repositoryIdentity.owner}/${repositoryIdentity.name}`
    : undefined;
  const context = createExecutionPlanRepositoryContext(project, repositorySnapshot);

  return {
    projectId,
    repositoryId,
    repositoryPathSignal: context?.repositoryPath,
    worktreePathSignal: context?.worktreePath,
    branchSignal: repositorySnapshot?.currentBranch ?? context?.branchName,
    specPathSignal: context?.specPath ?? plan.specPath,
    repositorySyncStatus: repositorySnapshot?.syncStatus,
    owner: repositoryIdentity?.owner,
    name: repositoryIdentity?.name,
  };
}

export type OfficeProjectPortalInput = {
  actionPressed: boolean;
  escapePressed: boolean;
  upPressed: boolean;
  downPressed: boolean;
  enterPressed: boolean;
  openCandidateDetailPressed: boolean;
  approveCandidateDetailPressed?: boolean;
  deferCandidateDetailPressed?: boolean;
  rejectCandidateDetailPressed?: boolean;
  // Distinct from enterPressed/actionPressed by design: those drive the
  // existing Plan -> Readiness -> Approval -> Preflight -> Runtime Start
  // cascade, while this field exists solely to request an Implementer
  // Runtime attempt -- Runtime Start's mere existence must never trigger
  // one on its own (see specs/075-claude-implementer-runtime-foundation).
  startImplementerPressed: boolean;
  // Distinct from startImplementerPressed by design: this requests a Codex
  // Reviewer Runtime attempt, gated separately so the same keypress can
  // never satisfy both starts (see specs/076-codex-reviewer-runtime-foundation).
  startReviewerPressed: boolean;
  // Distinct from startReviewerPressed by design: this requests the explicit
  // human Promote action on an already-Approved Reviewer Runtime -- it never
  // starts or re-runs any agent (see specs/077-review-decision-human-promotion-gate).
  promoteReviewPressed: boolean;
  // Distinct from Promote and runtime-start inputs: this records a human
  // request for fixes on a ChangesRequested Reviewer Runtime only. It never
  // invokes Codex, Claude, Validation Runtime, subprocesses, repository
  // mutation, or GitHub mutation (see specs/079-review-fix-request-foundation).
  requestReviewFixPressed: boolean;
  // Distinct from requestReviewFixPressed: this records a provider-neutral
  // Review Fix Plan for an already-current Review Fix Request. It never
  // starts fix execution or Validation Runtime (see specs/080-review-fix-plan-foundation).
  planReviewFixPressed: boolean;
  // Distinct from planReviewFixPressed: this explicitly starts one bounded
  // Review Fix Runtime for the current Review Fix Plan only. It does not
  // start validation, reviewer runtime, or any GitHub/remote operation.
  startReviewFixRuntimePressed: boolean;
  // Distinct from Review Fix Runtime: this explicitly starts Validation
  // Runtime for a completed Review Fix Runtime only. It never starts review,
  // promotion, or GitHub/remote mutation.
  startValidationRuntimePressed: boolean;
  preparePostValidationReviewTargetPressed: boolean;
  startPostValidationReviewPressed: boolean;
  startBacklogDevelopmentPressed?: boolean;
  generateBacklogSuggestionsPressed?: boolean;
  acceptBacklogSuggestionPressed?: boolean;
  rejectBacklogSuggestionPressed?: boolean;
  backlogSuggestionTitle?: string;
  backlogSuggestionDescription?: string;
  backlogSuggestionPriority?: ProjectBacklogPriority;
  developmentRequestText?: string;
  backlogTaskTitle?: string;
  backlogTaskDescription?: string;
  backlogTaskPriority?: ProjectBacklogPriority;
  backlogTaskStatus?: ProjectBacklogPlanningStatus;
  backlogTaskBlockedReason?: string;
  toggleAutonomousExecutionPressed?: boolean;
  reevaluateAutonomousExecutionPressed?: boolean;
  autonomousAllowedPriorities?: ProjectBacklogPriority[];
};

export type OfficeProjectPortalControllerOptions = {
  browserOfficeSessionService?: BrowserOfficeSessionService;
  activeProjectId?: string;
  activeProjectBindingId?: string;
  activeProjectBuildingId?: string;
  activeProjectCompanyName?: string;
  projectBacklogSuggestionProvider?: ProjectBacklogSuggestionProvider;
};

export class OfficeProjectPortalController {
  private readonly maxEmployeeConversationDistance = 48;
  private readonly state: ProjectPortalState;
  private readonly view: OfficeProjectPortalView;
  private pendingDevelopmentRequestText = "";
  private readonly browserOfficeSessionService?: BrowserOfficeSessionService;
  private readonly repositoryService: GitHubRepositoryService;
  private readonly repositorySyncService: RepositorySyncService;
  private readonly issueSyncService: IssueSyncService;
  private candidateTaskService: CandidateTaskService;
  private candidateAssignmentService: CandidateAssignmentService;
  private candidatePromotionService: CandidatePromotionService;
  private candidateProjectTaskPromotionService: CandidateProjectTaskPromotionService;
  private confirmedEmployeeAssignmentService: ConfirmedEmployeeAssignmentService;
  private preparedWorkSessionService: PreparedWorkSessionService;
  private activeWorkSessionStartService: ActiveWorkSessionStartService;
  private executionPlanService: ExecutionPlanService;
  private executionReadinessService: ExecutionReadinessService;
  private humanExecutionApprovalService: HumanExecutionApprovalService;
  private runtimePreflightService: RuntimePreflightService;
  private runtimeStartService: RuntimeStartService;
  private runtimeEnvironmentProvider: RuntimeEnvironmentProvider;
  private implementerRuntimeService: ImplementerRuntimeService;
  private readonly activeImplementerRuntimeKeys = new Set<string>();
  private reviewerRuntimeService: ReviewerRuntimeService;
  private readonly activeReviewerRuntimeKeys = new Set<string>();
  private readonly reviewDecisionService: ReviewDecisionService;
  private readonly reviewFixRequestService: ReviewFixRequestService;
  private readonly reviewFixPlanService: ReviewFixPlanService;
  private reviewFixRuntimeService: ReviewFixRuntimeService;
  private readonly activeReviewFixRuntimeKeys = new Set<string>();
  private validationRuntimeService: ValidationRuntimeService;
  private readonly projectBacklogService: ProjectBacklogService;
  private readonly projectAutonomousExecutionPolicyService: ProjectAutonomousExecutionPolicyService;
  private readonly projectBacklogDevelopmentBridgeService: ProjectBacklogDevelopmentBridgeService;
  private readonly projectBacklogSuggestionService: ProjectBacklogSuggestionService;
  private readonly projectBacklogSuggestionProvider: ProjectBacklogSuggestionProvider;
  private externalProjectAdosExecutionService: ExternalProjectAdosExecutionService;
  private activeExternalProjectAdosExecutionKeys?: Set<string> = new Set<string>();
  private readonly activeValidationRuntimeKeys = new Set<string>();
  private postValidationReviewTargetService: PostValidationReviewTargetService;
  private readonly activePostValidationReviewKeys = new Set<string>();
  private readonly taskService: ProjectTaskService;
  private readonly employeeService: EmployeeService;
  private readonly employeeRecruitmentService: EmployeeRecruitmentService;
  private readonly employeeSimulationService: EmployeeSimulationService;
  private readonly employeeNpcMovementService: EmployeeNpcMovementService;
  private readonly workstationOccupancyService: WorkstationOccupancyService;
  private readonly employeeDailyScheduleService: EmployeeDailyScheduleService;
  private readonly employeeConversationService: EmployeeConversationService;
  private readonly employeeAIService: EmployeeAIService;
  private readonly companyProgressionService: CompanyProgressionService;
  private readonly companyProgressionTriggerService: CompanyProgressionTriggerService;
  private readonly companyGrowthGameplayLoopService: CompanyGrowthGameplayLoopService;
  private readonly officeLayoutService: OfficeLayoutService;
  private readonly workSessionService: WorkSessionService;
  private readonly companyDashboardProvider: CompanyDashboardProvider;
  private readonly projectDashboardProvider: ProjectDashboardProvider;
  private readonly githubProjectDashboardProvider: GitHubProjectDashboardProvider;
  private readonly companyInfluencePlanningService: CompanyInfluencePlanningService;
  private readonly aiService: AIService;
  private readonly aiProjectManagerService: AIProjectManagerService;
  private repositoryRequestVersion = 0;
  private repositorySyncRequestVersion = 0;
  private issueSyncRequestVersion = 0;
  private taskRequestVersion = 0;
  private employeeRequestVersion = 0;
  private employeeNpcBootstrapRequestVersion = 0;
  private taskAnalysisRequestVersion = 0;
  private employeeRecommendationRequestVersion = 0;
  private projectManagerRequestVersion = 0;

  constructor(scene: PhaserScene, options: OfficeProjectPortalControllerOptions = {}) {
    this.browserOfficeSessionService = options.browserOfficeSessionService ?? createBrowserOfficeSessionService();
    this.state = createProjectPortalState({
      browserOfficeSessionService: this.browserOfficeSessionService,
      activeProjectId: options.activeProjectId,
      activeProjectBindingId: options.activeProjectBindingId,
      activeProjectBuildingId: options.activeProjectBuildingId,
      activeProjectCompanyName: options.activeProjectCompanyName,
    });
    this.applyActiveProjectContextSelection();
    this.view = new OfficeProjectPortalView(scene, this.state);
    this.repositoryService = new GitHubRepositoryService(
      new CachedGitHubRepositoryProvider(
        new GitHubPublicRepositoryProvider(createRepositoryReferenceResolver(() => this.state.repositoryMappings)),
      ),
    );
    this.repositorySyncService = new RepositorySyncService({
      github: new GitHubRepositorySyncProvider(this.repositoryService),
      local: new LocalRepositorySyncProvider(),
    });
    this.issueSyncService = new IssueSyncService({
      github: new GitHubIssueSyncProvider(),
      local: new LocalIssueSyncProvider(),
    });
    this.candidateTaskService = new CandidateTaskService();
    this.candidateAssignmentService = new CandidateAssignmentService();
    this.candidatePromotionService = new CandidatePromotionService();
    this.candidateProjectTaskPromotionService = new CandidateProjectTaskPromotionService();
    this.confirmedEmployeeAssignmentService = new ConfirmedEmployeeAssignmentService();
    this.preparedWorkSessionService = new PreparedWorkSessionService();
    this.activeWorkSessionStartService = new ActiveWorkSessionStartService();
    this.executionPlanService = new ExecutionPlanService();
    this.executionReadinessService = new ExecutionReadinessService();
    this.humanExecutionApprovalService = new HumanExecutionApprovalService();
    this.runtimePreflightService = new RuntimePreflightService();
    this.runtimeStartService = new RuntimeStartService();
    this.runtimeEnvironmentProvider = new RepresentedRuntimeEnvironmentProvider();
    this.implementerRuntimeService = new ImplementerRuntimeService(new ClaudeImplementerRuntimeProvider());
    this.reviewerRuntimeService = new ReviewerRuntimeService(new CodexReviewerRuntimeProvider());
    this.reviewDecisionService = new ReviewDecisionService();
    this.reviewFixRequestService = new ReviewFixRequestService();
    this.reviewFixPlanService = new ReviewFixPlanService();
    this.reviewFixRuntimeService = new ReviewFixRuntimeService(
      new ImplementerReviewFixRuntimeProvider(new ClaudeImplementerRuntimeProvider()),
    );
    this.validationRuntimeService = new ValidationRuntimeService(new LocalValidationRuntimeProvider());
    this.projectBacklogService = new ProjectBacklogService();
    this.projectAutonomousExecutionPolicyService = new ProjectAutonomousExecutionPolicyService();
    this.projectBacklogDevelopmentBridgeService = new ProjectBacklogDevelopmentBridgeService();
    this.projectBacklogSuggestionService = new ProjectBacklogSuggestionService({
      backlogService: this.projectBacklogService,
    });
    this.projectBacklogSuggestionProvider = options.projectBacklogSuggestionProvider
      ?? new DeterministicProjectBacklogSuggestionProvider();
    this.externalProjectAdosExecutionService = new ExternalProjectAdosExecutionService(new ClaudeImplementerRuntimeProvider());
    this.postValidationReviewTargetService = new PostValidationReviewTargetService();
    this.taskService = new ProjectTaskService(new MockProjectTaskProvider());
    this.employeeService = new EmployeeService(new MockEmployeeProvider());
    this.employeeRecruitmentService = new EmployeeRecruitmentService();
    this.employeeSimulationService = new EmployeeSimulationService();
    this.employeeNpcMovementService = new EmployeeNpcMovementService();
    this.workstationOccupancyService = new WorkstationOccupancyService();
    this.employeeDailyScheduleService = new EmployeeDailyScheduleService();
    this.employeeConversationService = new EmployeeConversationService();
    this.employeeAIService = new EmployeeAIService();
    this.companyProgressionService = new CompanyProgressionService();
    this.companyProgressionTriggerService = new CompanyProgressionTriggerService();
    this.companyGrowthGameplayLoopService = new CompanyGrowthGameplayLoopService();
    this.officeLayoutService = new OfficeLayoutService();
    this.workSessionService = new WorkSessionService(new MockWorkSessionProvider());
    const companyDashboardProvider = getEnabledCompanyDashboardProvider(createCompanyDashboardProviderRegistry());
    if (!companyDashboardProvider) throw new Error("Company dashboard provider is not configured.");
    this.companyDashboardProvider = companyDashboardProvider;
    this.projectDashboardProvider = new InternalSimulationProjectDashboardProvider();
    this.githubProjectDashboardProvider = new GitHubProjectDashboardProvider();
    this.companyInfluencePlanningService = new CompanyInfluencePlanningService();
    this.aiService = createMockAIService();
    this.aiProjectManagerService = new AIProjectManagerService(this.aiService);
  }

  open() {
    if (this.state.isOpen) return;

    this.state.isOpen = true;
    this.state.justOpened = true;
    this.state.viewMode = "list";
    this.applyActiveProjectContextSelection();
    this.state.selectedProjectIndex = clamp(this.state.selectedProjectIndex, -3, this.state.projects.length - 1);
    this.state.selectedProjectId = this.state.projects[this.state.selectedProjectIndex]?.id ?? "";
    this.refreshCompanyDashboardSnapshot();
    this.view.render(this.state);
    this.view.show();
  }

  updateInput(input: OfficeProjectPortalInput) {
    if (typeof input.developmentRequestText === "string") {
      this.pendingDevelopmentRequestText = input.developmentRequestText;
    }
    if (!this.state.isOpen) return;

    if (this.state.justOpened) {
      this.state.justOpened = false;
      return;
    }

    if (this.state.viewMode === "list") {
      this.updateListInput(input);
      return;
    }

    if (this.state.viewMode === "detail") {
      this.updateDetailInput(input);
      return;
    }

    if (this.state.viewMode === "workspace") {
      this.updateWorkspaceInput(input);
      return;
    }

    if (this.state.viewMode === "repository-identity-edit") {
      this.updateRepositoryIdentityEditInput(input);
      return;
    }

    if (this.state.viewMode === "repository-detail") {
      this.updateRepositoryDetailInput(input);
      return;
    }

    if (this.state.viewMode === "task-list") {
      this.updateTaskListInput(input);
      return;
    }

    if (this.state.viewMode === "task-detail") {
      this.updateTaskDetailInput(input);
      return;
    }

    if (this.state.viewMode === "project-backlog") {
      this.updateProjectBacklogInput(input);
      return;
    }

    if (this.state.viewMode === "project-dashboard") {
      this.updateProjectDashboardInput(input);
      return;
    }

    if (this.state.viewMode === "candidate-detail") {
      this.updateCandidateDetailInput(input);
      return;
    }

    if (this.state.viewMode === "influence-planning") {
      this.updateInfluencePlanningInput(input);
      return;
    }

    this.updateEmployeeSelectionInput(input);
  }

  isOpen() {
    return this.state.isOpen;
  }

  shouldShowDevelopmentRequestInput() {
    return this.state.isOpen &&
      this.state.viewMode === "project-dashboard" &&
      Boolean(this.getDevelopmentRequestTargetProject());
  }

  shouldShowProjectBacklogInput() {
    return this.state.isOpen && this.state.viewMode === "project-backlog";
  }

  getProjectBacklogProbeState() {
    const projectId = this.state.selectedBacklogProjectId;
    const collection = projectId
      ? this.projectBacklogService.getOrderedCollection(this.state.projectBacklogCollections, projectId)
      : undefined;
    const selectedTask = this.getSelectedBacklogTask();
    const preview = this.getSelectedBacklogDevelopmentPreview();
    const autonomy = this.getSelectedProjectAutonomyEvaluation();
    return {
      viewMode: this.state.isOpen ? this.state.viewMode : "",
      projectId: projectId ?? "",
      taskCount: collection?.tasks.length ?? 0,
      taskTitles: collection?.tasks.map((task) => task.title) ?? [],
      selectedTaskId: selectedTask?.id ?? "",
      selectedTaskTitle: selectedTask?.title ?? "",
      selectedTaskStatus: selectedTask?.status ?? "",
      selectedTaskPriority: selectedTask?.priority ?? "",
      selectedTaskBlockedReason: selectedTask?.blockedReason ?? "",
      developmentEligible: preview?.eligible ?? false,
      developmentEligibilityReason: preview?.reason ?? "",
      associatedDevelopmentRequestId: preview?.associatedDevelopmentRequestId ?? "",
      associatedPreparationId: preview?.associatedPreparationId ?? "",
      associatedExecutionRunId: preview?.associatedExecutionRunId ?? "",
      executionStage: preview?.executionStage ?? "",
      hasActiveProjectRun: preview?.hasActiveProjectRun ?? false,
      suggestionCount: projectId
        ? this.state.projectBacklogSuggestionCollections[projectId]?.candidates.length ?? 0
        : 0,
      proposedSuggestionTitles: projectId
        ? this.state.projectBacklogSuggestionCollections[projectId]?.candidates
          .filter((candidate) => candidate.status === "proposed")
          .map((candidate) => candidate.title) ?? []
        : [],
      acceptedSuggestionTitles: projectId
        ? this.state.projectBacklogSuggestionCollections[projectId]?.candidates
          .filter((candidate) => candidate.status === "accepted")
          .map((candidate) => candidate.title) ?? []
        : [],
      rejectedSuggestionTitles: projectId
        ? this.state.projectBacklogSuggestionCollections[projectId]?.candidates
          .filter((candidate) => candidate.status === "rejected")
          .map((candidate) => candidate.title) ?? []
        : [],
      autonomyEnabled: autonomy?.policy.enabled ?? false,
      autonomyAllowedPriorities: autonomy?.policy.allowedPriorities ?? [],
      autonomyState: autonomy?.state ?? "",
      autonomyReason: autonomy?.reason ?? "",
      autonomySelectedTaskId: autonomy?.selectedTask?.id ?? "",
      autonomyEligibleTaskCount: autonomy?.eligibleTaskCount ?? 0,
      autonomyActiveExecutionCount: autonomy?.activeExecutionCount ?? 0,
    };
  }

  getSelectedProjectBacklogTaskInput() {
    const task = this.getSelectedBacklogTask();
    return task ? { ...task } : undefined;
  }

  createBacklogTaskFromInput(input: {
    title: string;
    description: string;
    priority?: ProjectBacklogPriority;
  }) {
    const context = this.getBacklogMutationContext();
    if (!context) return false;
    const result = this.projectBacklogService.createTask(this.state.projectBacklogCollections, context, input);
    if (!result.ok) return false;
    this.state.selectedBacklogTaskIndex = 0;
    this.state.selectedBacklogTaskId = result.task.id;
    this.persistBrowserOfficeSession();
    this.refreshCompanyDashboardSnapshot();
    this.view.render(this.state);
    void this.reevaluateSelectedProjectAutonomy();
    return true;
  }

  updateSelectedBacklogTaskFromInput(input: {
    title?: string;
    description?: string;
    priority?: ProjectBacklogPriority;
    status?: ProjectBacklogPlanningStatus;
    blockedReason?: string;
  }) {
    const context = this.getBacklogMutationContext();
    const task = this.getSelectedBacklogTask();
    if (!context || !task) return false;
    const normalizedInput = {
      ...input,
      title: input.title?.trim() ? input.title : undefined,
      description: input.description?.trim() ? input.description : undefined,
    };
    const result = this.projectBacklogService.updateTask(
      this.state.projectBacklogCollections,
      context,
      task.id,
      normalizedInput,
    );
    if (!result.ok) return false;
    this.state.selectedBacklogTaskId = result.task.id;
    this.syncBacklogSelectionToTaskId(result.task.id);
    this.persistBrowserOfficeSession();
    this.refreshCompanyDashboardSnapshot();
    this.view.render(this.state);
    if (result.task.status === "ready") void this.reevaluateSelectedProjectAutonomy();
    return true;
  }

  updateSelectedProjectAutonomyPolicy(input: {
    enabled?: boolean;
    allowedPriorities?: ProjectBacklogPriority[];
  }) {
    const projectId = this.state.selectedBacklogProjectId;
    const context = this.getBacklogMutationContext();
    if (!projectId || !context) return false;
    const result = this.projectAutonomousExecutionPolicyService.updatePolicy(
      this.state.projectAutonomyPolicies,
      context,
      {
        enabled: input.enabled,
        allowedPriorities: input.allowedPriorities,
      },
    );
    if (!result.ok) return false;
    this.persistBrowserOfficeSession();
    this.refreshCompanyDashboardSnapshot();
    this.view.render(this.state);
    if (result.policy.enabled) void this.reevaluateSelectedProjectAutonomy();
    return true;
  }

  async reevaluateSelectedProjectAutonomy() {
    const result = this.getSelectedProjectAutonomyEvaluation();
    if (!result) return false;
    this.recordProjectAutonomyEvaluation(result);
    if (result.state !== "eligible" || !result.selectedTask) {
      this.persistBrowserOfficeSession();
      this.refreshCompanyDashboardSnapshot();
      this.view.render(this.state);
      return false;
    }

    this.state.selectedBacklogTaskId = result.selectedTask.id;
    this.syncBacklogSelectionToTaskId(result.selectedTask.id);
    const started = await this.startSelectedBacklogTaskDevelopment();
    if (!started) this.recordProjectAutonomyEvaluation({ ...result, state: "blocked", reason: "ExecutionUnavailable" });
    this.persistBrowserOfficeSession();
    this.refreshCompanyDashboardSnapshot();
    this.view.render(this.state);
    return started;
  }

  async startSelectedBacklogTaskDevelopment() {
    const project = this.getSelectedBacklogProject();
    const task = this.getSelectedBacklogTask();
    const context = this.getBacklogMutationContext();
    if (!project || !task || !context) return false;
    const associationKey = this.getBacklogDevelopmentAssociationKey(task);

    const bridgeOutcome = this.projectBacklogDevelopmentBridgeService.createRequestAndPreparation({
      project,
      task,
      activeProjectCompanyContext: this.state.activeProjectCompanyContext,
      existingDraft: this.getAssociatedDevelopmentRequestDraft(task),
      existingPreparation: this.getAssociatedAdosRunPreparation(task),
      existingExecution: this.getAssociatedAdosExecution(task),
      existingRunStatus: this.getAssociatedAdosRunStatus(task) ?? this.getActiveProjectAdosRunStatus(project.id),
    });
    if (!bridgeOutcome.ok) return false;

    this.state.externalProjectDevelopmentRequestDrafts = {
      ...this.state.externalProjectDevelopmentRequestDrafts,
      [associationKey]: bridgeOutcome.draft,
    };
    this.state.externalProjectAdosRunPreparations = {
      ...this.state.externalProjectAdosRunPreparations,
      [associationKey]: bridgeOutcome.preparation,
    };
    this.state.externalProjectAdosRunStatuses = {
      ...this.state.externalProjectAdosRunStatuses,
      [associationKey]: deriveExternalProjectAdosRunStatus({
        projectId: project.id,
        preparation: bridgeOutcome.preparation,
        persistedStatus: this.state.externalProjectAdosRunStatuses[associationKey],
      })!,
    };
    this.projectBacklogService.updateTask(this.state.projectBacklogCollections, context, task.id, bridgeOutcome.taskPatch);
    this.syncBacklogSelectionToTaskId(task.id);
    this.persistBrowserOfficeSession();
    this.refreshCompanyDashboardSnapshot();
    this.view.render(this.state);

    const associatedExecution = this.getAssociatedAdosExecution(this.getSelectedBacklogTask() ?? task);
    if (associatedExecution) return true;

    const activeExecutionKeys = this.getActiveExternalProjectAdosExecutionKeys();
    const executionKey = `${project.id}:${task.id}`;
    if (activeExecutionKeys.has(executionKey)) return true;
    activeExecutionKeys.add(executionKey);

    try {
      const outcome = await this.externalProjectAdosExecutionService.start({
        projectId: project.id,
        project,
        preparation: bridgeOutcome.preparation,
        existingExecution: this.getAssociatedAdosExecution(task),
      });
      if (outcome.execution) {
        this.state.externalProjectAdosExecutions = {
          ...this.state.externalProjectAdosExecutions,
          [associationKey]: outcome.execution,
        };
      }
      this.state.externalProjectAdosExecutionResults = {
        ...this.state.externalProjectAdosExecutionResults,
        [associationKey]: outcome.result,
      };
      this.state.externalProjectAdosRunStatuses = {
        ...this.state.externalProjectAdosRunStatuses,
        [associationKey]: deriveExternalProjectAdosRunStatus({
          projectId: project.id,
          preparation: bridgeOutcome.preparation,
          execution: outcome.execution ?? this.state.externalProjectAdosExecutions[associationKey],
          result: outcome.result,
          persistedStatus: this.state.externalProjectAdosRunStatuses[associationKey],
        })!,
      };
      this.updateBacklogTaskAfterExecutionOutcome(context, task, outcome.result.resultAt, outcome.execution?.id, outcome.result.started || outcome.result.duplicateExistingExecution);
      const draft = this.state.externalProjectDevelopmentRequestDrafts[associationKey];
      if (draft) {
        this.state.externalProjectDevelopmentRequestDrafts = {
          ...this.state.externalProjectDevelopmentRequestDrafts,
          [associationKey]: {
            ...draft,
            status: outcome.result.duplicateExistingExecution
              ? "AlreadyActive"
              : outcome.result.started
                ? "Started"
                : outcome.result.status === "Blocked"
                  ? "Blocked"
                  : outcome.result.status === "Failed"
                    ? "Failed"
                    : draft.status,
            adosRunId: outcome.execution?.id ?? draft.adosRunId,
            updatedAt: outcome.result.resultAt,
          },
        };
      }
      this.persistBrowserOfficeSession();
      this.refreshCompanyDashboardSnapshot();
      this.view.render(this.state);
      return outcome.result.started || outcome.result.duplicateExistingExecution;
    } finally {
      this.getActiveExternalProjectAdosExecutionKeys().delete(executionKey);
    }
  }

  async generateProjectBacklogSuggestions() {
    const context = this.getBacklogMutationContext();
    const projectId = this.state.selectedBacklogProjectId;
    const project = projectId ? this.state.projects.find((item) => item.id === projectId) : undefined;
    if (!context || !projectId || !project) return false;

    const result = await this.projectBacklogSuggestionService.generateSuggestions(
      this.state.projectBacklogSuggestionCollections,
      context,
      {
        backlogCollections: this.state.projectBacklogCollections,
        activeWork: this.getProjectActiveWorkSummaries(projectId),
        blockedWork: this.getProjectBlockedWorkSummaries(projectId),
        developmentRequests: this.getProjectDevelopmentRequestSummaries(projectId),
        repositorySummary: this.getProjectRepositorySummary(projectId),
      },
      this.projectBacklogSuggestionProvider,
      3,
    );
    if (!result.ok) return false;

    this.state.selectedBacklogSuggestionId = result.candidates[0]?.id;
    this.persistBrowserOfficeSession();
    this.refreshCompanyDashboardSnapshot();
    this.view.render(this.state);
    return true;
  }

  acceptSelectedBacklogSuggestion(input: {
    title?: string;
    description?: string;
    priority?: ProjectBacklogPriority;
  } = {}) {
    const context = this.getBacklogMutationContext();
    const suggestionId = this.state.selectedBacklogSuggestionId ?? this.getFirstProposedBacklogSuggestion()?.id;
    if (!context || !suggestionId) return false;

    const result = this.projectBacklogSuggestionService.acceptSuggestion(
      this.state.projectBacklogSuggestionCollections,
      this.state.projectBacklogCollections,
      context,
      suggestionId,
      input,
    );
    if (!result.ok) return false;

    if (result.task) {
      this.state.selectedBacklogTaskId = result.task.id;
      this.syncBacklogSelectionToTaskId(result.task.id);
    }
    this.state.selectedBacklogSuggestionId = this.getFirstProposedBacklogSuggestion()?.id;
    this.persistBrowserOfficeSession();
    this.refreshCompanyDashboardSnapshot();
    this.view.render(this.state);
    return true;
  }

  rejectSelectedBacklogSuggestion() {
    const context = this.getBacklogMutationContext();
    const suggestionId = this.state.selectedBacklogSuggestionId ?? this.getFirstProposedBacklogSuggestion()?.id;
    if (!context || !suggestionId) return false;

    const result = this.projectBacklogSuggestionService.rejectSuggestion(
      this.state.projectBacklogSuggestionCollections,
      context,
      suggestionId,
    );
    if (!result.ok) return false;

    this.state.selectedBacklogSuggestionId = this.getFirstProposedBacklogSuggestion()?.id;
    this.persistBrowserOfficeSession();
    this.refreshCompanyDashboardSnapshot();
    this.view.render(this.state);
    return true;
  }

  async initializeEmployeeSimulationSnapshots() {
    if (this.state.employees.length > 0) {
      this.refreshEmployeeSimulationSnapshots();
      return;
    }

    const requestVersion = this.employeeNpcBootstrapRequestVersion + 1;
    this.employeeNpcBootstrapRequestVersion = requestVersion;

    const employees = await this.employeeService.getEmployees();
    if (this.employeeNpcBootstrapRequestVersion !== requestVersion) return;

    this.state.employees = employees;
    this.refreshCandidateAssignmentsForSelectedProject();
    this.refreshEmployeeSimulationSnapshots();
    this.persistBrowserOfficeSession();
  }

  getEmployeeSimulationSnapshots(): ReadonlyArray<EmployeeSimulationSnapshot> {
    return this.employeeSimulationService.getSnapshots(this.state.employeeSimulations);
  }

  getVisibleOfficeEmployees(): ReadonlyArray<EmployeeSimulationSnapshot> {
    const activeProjectId = this.getActiveProjectId();
    if (!activeProjectId) return this.getEmployeeSimulationSnapshots();
    return this.getEmployeeSimulationSnapshots().filter((snapshot) => {
      const employee = this.state.employees.find((item) => item.id === snapshot.employeeId);
      return (
        snapshot.currentProjectId === activeProjectId ||
        employee?.currentProjectId === activeProjectId ||
        (!snapshot.currentProjectId && !employee?.currentProjectId)
      );
    });
  }

  getWorkstationSnapshots(): ReadonlyArray<WorkstationSnapshot> {
    const visibleEmployees = this.getVisibleOfficeEmployees();
    this.workstationOccupancyService.deriveSnapshots(visibleEmployees);
    return this.workstationOccupancyService.getSnapshots();
  }

  getEmployeeDailyScheduleSnapshots(): ReadonlyArray<EmployeeDailyScheduleSnapshot> {
    const visibleEmployees = this.getVisibleOfficeEmployees();
    this.employeeDailyScheduleService.deriveSnapshots(visibleEmployees);
    return this.employeeDailyScheduleService.getSnapshots();
  }

  getCompanyProgressionSnapshot(): CompanyProgressionSnapshot {
    return this.companyProgressionService.getProgressionSnapshot(this.getCompanyProgressionInput());
  }

  getNextOfficeZoneUnlock(): OfficeZoneUnlockPreview | undefined {
    return this.companyProgressionService.getNextOfficeZoneUnlock(this.getCompanyProgressionInput());
  }

  private getCompanyProgressionInput() {
    return {
      activeEmployees: this.state.employees.length,
      completedProjects: getAllLoadedTasks(this.state.taskCollections).filter((task) => task.status === "Done").length,
    };
  }

  getActiveOfficeLayout(): OfficeLayoutSnapshot {
    const progression = this.getCompanyProgressionSnapshot();
    return this.officeLayoutService.getActiveLayout(progression.layoutId);
  }

  getOfficeZoneSnapshots(): ReadonlyArray<OfficeLayoutZone> {
    return this.getActiveOfficeLayout().zones;
  }

  getOfficeLayoutPositionHints(): ReadonlyArray<OfficeLayoutPositionHint> {
    const progression = this.getCompanyProgressionSnapshot();
    return this.officeLayoutService.getPositionHints(progression.layoutId);
  }

  getEmployeeAIStateSnapshots(): ReadonlyArray<EmployeeAISnapshot> {
    const tasks = getAllLoadedTasks(this.state.taskCollections);
    const employeeAIPreviewTimestamp = getPreviewMovementTimestamp(
      this.employeeNpcMovementService.getSnapshots(),
      this.employeeSimulationService.getSnapshots(this.state.employeeSimulations),
    );

    if (this.state.employees.length > 0) {
      this.state.employeeSimulations = this.employeeSimulationService.deriveSnapshots(
        this.state.employees,
        tasks,
        this.state.workSessions,
        this.state.employeeSimulations,
        employeeAIPreviewTimestamp,
      );
    }

    const employeesById = new Map(this.state.employees.map((employee) => [employee.id, employee]));
    const employeeSnapshots = Array.from(this.getVisibleOfficeEmployees()).sort((left, right) =>
      left.employeeId.localeCompare(right.employeeId),
    );
    const workstationSnapshots = this.workstationOccupancyService.previewSnapshots(employeeSnapshots);
    const workstationTargetHints = createWorkstationTargetHints(workstationSnapshots);
    const scheduleSnapshots = this.employeeDailyScheduleService.previewSnapshots(employeeSnapshots);
    const scheduleTargetHints = createScheduleTargetHints(scheduleSnapshots, employeeSnapshots, workstationTargetHints);
    const targetPositionHints = {
      ...scheduleTargetHints,
      ...workstationTargetHints,
    };
    const movementSnapshots = this.employeeNpcMovementService.previewSnapshots(
      employeeSnapshots,
      employeeAIPreviewTimestamp,
      targetPositionHints,
    );
    const scheduleByEmployeeId = new Map(scheduleSnapshots.map((snapshot) => [snapshot.employeeId, snapshot]));
    const movementByEmployeeId = new Map(movementSnapshots.map((snapshot) => [snapshot.employeeId, snapshot]));
    const companyProgression = this.getCompanyProgressionSnapshot();
    const officeLayout = this.officeLayoutService.getActiveLayout(companyProgression.layoutId);

    return this.employeeAIService.updateMany(employeeSnapshots.map((snapshot) => ({
      employeeId: snapshot.employeeId,
      employee: employeesById.get(snapshot.employeeId),
      simulationSnapshot: snapshot,
      movementSnapshot: movementByEmployeeId.get(snapshot.employeeId),
      scheduleSnapshot: scheduleByEmployeeId.get(snapshot.employeeId),
      companyProgression,
      officeLayout,
      officeZones: officeLayout.zones,
      updatedAt: employeeAIPreviewTimestamp,
    }))).map((result) => result.snapshot);
  }

  getEmployeeInsightSources(): ReadonlyArray<EmployeeInsightSource> {
    const previewState = this.createPreviewEmployeeInsightState();
    const employeesById = new Map(this.state.employees.map((employee) => [employee.id, employee]));
    const tasksById = new Map(previewState.tasks.map((task) => [task.id, task]));
    const projectsById = new Map(this.state.projects.map((project) => [project.id, project]));
    const aiByEmployeeId = new Map(previewState.aiSnapshots.map((snapshot) => [snapshot.employeeId, snapshot]));
    const scheduleByEmployeeId = new Map(previewState.scheduleSnapshots.map((snapshot) => [snapshot.employeeId, snapshot]));
    const movementByEmployeeId = new Map(previewState.movementSnapshots.map((snapshot) => [snapshot.employeeId, snapshot]));

    return previewState.employeeSnapshots.map((snapshot) => {
      const employee = employeesById.get(snapshot.employeeId);
      const currentTask = snapshot.currentTaskId ? tasksById.get(snapshot.currentTaskId) : undefined;
      const projectId = currentTask?.projectId ?? snapshot.currentProjectId ?? employee?.currentProjectId;
      const currentProject = projectId ? projectsById.get(projectId) : undefined;
      const movementSnapshot = movementByEmployeeId.get(snapshot.employeeId);
      const workstationSnapshot = previewState.workstationSnapshots
        .find((item) => item.assignedEmployeeId === snapshot.employeeId || item.occupiedByEmployeeId === snapshot.employeeId);
      const scheduleSnapshot = scheduleByEmployeeId.get(snapshot.employeeId);
      const aiSnapshot = aiByEmployeeId.get(snapshot.employeeId);
      const movementPosition = movementSnapshot
        ? {
            ...resolveEmployeeNpcWorldPosition(movementSnapshot.positionHint),
            positionHint: movementSnapshot.positionHint,
          }
        : undefined;

      return {
        employeeId: snapshot.employeeId,
        name: employee?.name ?? snapshot.employeeId,
        role: employee?.role ?? "Engineer",
        aiState: aiSnapshot?.currentState ?? "idle",
        aiSnapshot,
        simulationState: snapshot.currentState,
        simulationSnapshot: snapshot,
        currentTask,
        currentProject,
        workProgress: createInsightProgress(currentTask),
        scheduleState: scheduleSnapshot?.scheduleState,
        scheduleSnapshot,
        movementPosition,
        movementSnapshot,
        workstationState: workstationSnapshot?.state,
        workstationSnapshot,
        companyProgression: previewState.companyProgression,
      }
    });
  }

  getEmployeeKnowledgeSource(insightTarget: EmployeeInsightTarget | undefined): EmployeeKnowledgeSource | undefined {
    if (!insightTarget) return undefined;

    const { context } = this.createPreviewEmployeeConversationContext(insightTarget.employeeId);

    return {
      insightTarget,
      insightSource: insightTarget.source,
      conversationContext: context,
      activitySources: createKnowledgeActivitySources(
        insightTarget.source,
        this.state.workSessions,
      ),
    };
  }

  getCompanyDashboardSnapshot() {
    const employeeInsightSources = this.getEmployeeInsightSources();
    const tasks = getAllLoadedTasks(this.state.taskCollections);
    const companyProgression = this.getCompanyProgressionSnapshot();
    this.refreshReceptionDeskUpgradeBenefits(companyProgression);
    this.state.companyProgressionTriggers = this.companyProgressionTriggerService.evaluateLevelTriggers({
      previousSnapshot: this.state.previousCompanyProgressionSnapshot,
      currentSnapshot: companyProgression,
      reachedSnapshots: this.companyProgressionService.getReachedProgressionMetadata(this.getCompanyProgressionInput()),
    });
    this.state.previousCompanyProgressionSnapshot = companyProgression;

    return {
      ...this.companyDashboardProvider.getSnapshot({
        employeeInsightSources,
        employees: this.state.employees,
        projects: this.state.projects,
        tasks,
        workSessions: Object.values(this.state.workSessions).flat(),
        workstations: this.getWorkstationSnapshots(),
        companyProgression,
        nextOfficeZoneUnlock: this.getNextOfficeZoneUnlock(),
        repositoryMappings: this.state.repositoryMappings,
        repositorySummaries: this.state.repositorySummaries,
      }),
      companyFocus: this.getCompanyFocusSummary(),
    };
  }

  getCompanyProgressionTriggers(): CompanyProgressionTrigger[] {
    return this.state.companyProgressionTriggers.map(copyCompanyProgressionTrigger);
  }

  getCompanyGrowthGameplayLoopResult(): CompanyGrowthGameplayLoopResult {
    return this.companyGrowthGameplayLoopService.createLoopResult({
      triggers: this.getCompanyProgressionTriggers(),
    });
  }

  getCompanyFocusOptions() {
    return this.getCompanyInfluencePlanningService().getFocusOptions();
  }

  getCompanyFocusSummary(): CompanyFocusSummary {
    const service = this.getCompanyInfluencePlanningService();
    this.state.companyFocusSummary = service.createFocusSummary(this.state.companyInfluencePlan);
    return this.state.companyFocusSummary;
  }

  getProjectDashboardListItems() {
    return this.projectDashboardProvider.listProjects(this.createProjectDashboardContext());
  }

  getProjectDashboardSnapshot(projectId: string) {
    const context = this.createProjectDashboardContext();
    const internalSnapshot = this.projectDashboardProvider.getProjectSnapshot(context, projectId);
    this.state.projectDashboardSnapshot = this.mergeGitHubProjectDashboardSource(internalSnapshot, context, projectId);
    this.clampProjectDashboardActiveWorkSelection();
    return this.state.projectDashboardSnapshot;
  }

  setCompanyFocus(focusId: CompanyFocusId | string, updatedAt?: string) {
    const service = this.getCompanyInfluencePlanningService();
    this.state.companyInfluencePlan = service.selectFocus(this.state.companyInfluencePlan, focusId, updatedAt);
    this.state.companyFocusSummary = service.createFocusSummary(this.state.companyInfluencePlan);
    this.syncCompanyFocusToDashboardSnapshot();
    return this.state.companyFocusSummary;
  }

  getEmployeeMovementSnapshots(
    targetPositionHints: Record<string, EmployeeNpcMovementPositionHint> = {},
  ): ReadonlyArray<EmployeeNpcMovementSnapshot> {
    const visibleEmployees = this.getVisibleOfficeEmployees();
    this.employeeNpcMovementService.deriveSnapshots(visibleEmployees, undefined, targetPositionHints);
    return this.employeeNpcMovementService.getSnapshots();
  }

  getEmployeeNpcViewModels(): EmployeeNpcViewModel[] {
    return this.getEmployeeNpcViewModelsWithSchedule();
  }

  getLiveAgentWorkState(): LiveAgentWorkState {
    return deriveLiveAgentWorkState(this.state);
  }

  getEmployeeNpcViewModelsWithSchedule(): EmployeeNpcViewModel[] {
    return this.getEmployeeNpcViewModelsWithWorkstations();
  }

  getEmployeeNpcViewModelsWithWorkstations(): EmployeeNpcViewModel[] {
    return this.getEmployeeNpcViewModelsWithMovement();
  }

  getEmployeeNpcViewModelsWithMovement(): EmployeeNpcViewModel[] {
    if (this.state.employees.length > 0) {
      this.refreshEmployeeSimulationSnapshots();
    }

    const employeesById = new Map(this.state.employees.map((employee) => [employee.id, employee]));
    const tasksById = new Map(getAllLoadedTasks(this.state.taskCollections).map((task) => [task.id, task]));
    const visibleEmployees = Array.from(this.getVisibleOfficeEmployees()).sort((left, right) =>
      left.employeeId.localeCompare(right.employeeId),
    );
    const workstationSnapshots = this.getWorkstationSnapshots();
    const workstationTargetHints = createWorkstationTargetHints(workstationSnapshots);
    const scheduleSnapshots = this.getEmployeeDailyScheduleSnapshots();
    const scheduleTargetHints = createScheduleTargetHints(scheduleSnapshots, visibleEmployees, workstationTargetHints);
    const liveAgentWorkState = this.getLiveAgentWorkState();
    const liveAssignmentByEmployeeId = new Map(
      liveAgentWorkState.assignments
        .filter((assignment) => assignment.employeeId)
        .map((assignment) => [assignment.employeeId!, assignment]),
    );
    const liveTargetHints = Object.fromEntries(
      liveAgentWorkState.assignments
        .filter((assignment) => assignment.employeeId)
        .map((assignment) => [assignment.employeeId!, assignment.positionHint]),
    );
    const targetPositionHints = {
      ...scheduleTargetHints,
      ...workstationTargetHints,
      ...liveTargetHints,
    };
    const movementByEmployeeId = new Map(
      this.getEmployeeMovementSnapshots(targetPositionHints).map((snapshot) => [snapshot.employeeId, snapshot]),
    );

    return visibleEmployees
      .map((snapshot: EmployeeSimulationSnapshot, index: number) => {
        const employee = employeesById.get(snapshot.employeeId);
        const currentTask = snapshot.currentTaskId ? tasksById.get(snapshot.currentTaskId) : undefined;
        const movementSnapshot = movementByEmployeeId.get(snapshot.employeeId);
        const liveAssignment = liveAssignmentByEmployeeId.get(snapshot.employeeId);

        return {
          employeeId: snapshot.employeeId,
          displayName: employee?.name ?? snapshot.employeeId,
          displayLabel: liveAssignment?.statusLabel ?? snapshot.displayLabel,
          state: snapshot.currentState,
          currentTaskTitle: liveAssignment ? undefined : currentTask?.title,
          workAnimation: liveAssignment?.visualTone === "active"
            ? {
                kind: "workstationTask",
                active: true,
              }
            : createNpcWorkAnimation(snapshot, currentTask, movementSnapshot),
          positionHint: movementSnapshot?.positionHint ?? {
            zone: getNpcPositionZone(snapshot.currentState),
            slot: index,
          },
          movementState: movementSnapshot?.movementState,
          currentMovementPosition: movementSnapshot?.currentPosition,
          targetMovementPosition: movementSnapshot?.targetPosition,
          placeholderStyle: {
            fillColor: parseNpcColor(employee?.avatarColor) ?? 0x64748b,
            borderColor: 0xf8fafc,
            labelColor: "#f8fafc",
          },
          semanticRole: liveAssignment?.role,
          visualTone: liveAssignment?.visualTone,
        };
      });
  }

  getEmployeeConversation(employeeId: string): EmployeeConversation | undefined {
    const { context } = this.createPreviewEmployeeConversationContext(employeeId);
    return this.employeeConversationService.createConversation(context);
  }

  getEmployeeConversationViewModel(employeeId: string): EmployeeConversationViewModel | undefined {
    const { context, positionHint } = this.createPreviewEmployeeConversationContext(employeeId);
    const conversation = this.employeeConversationService.createConversation(context);
    if (!conversation) return undefined;

    return this.employeeConversationService.createConversationViewModel(conversation, positionHint);
  }

  getNearbyEmployeeConversationTarget(
    playerPosition: EmployeeConversationPlayerPosition,
  ): NearbyEmployeeConversationTarget | undefined {
    if (!isResolvedConversationPlayerPosition(playerPosition)) return undefined;

    const targets = this.deriveCurrentEmployeeConversationTargets(playerPosition)
      .sort((left, right) => left.distance - right.distance || left.employeeId.localeCompare(right.employeeId));
    const nearestTarget = targets[0];
    if (!nearestTarget || nearestTarget.distance > this.maxEmployeeConversationDistance) return undefined;

    return nearestTarget;
  }
  close() {
    if (!this.state.isOpen) return;

    this.state.isOpen = false;
    this.state.justOpened = false;
    this.state.viewMode = "list";
    this.state.selectedRepositoryProjectId = undefined;
    this.state.selectedTaskProjectId = undefined;
    this.state.selectedTaskId = undefined;
    this.state.selectedEmployeeIndex = 0;
    this.state.selectedProjectDashboardProjectId = undefined;
    this.state.selectedProjectDashboardActiveWorkIndex = 0;
    this.state.selectedCandidateTaskId = undefined;
    this.state.projectDashboardSnapshot = undefined;
    this.state.selectedWorkSessionId = undefined;
    this.repositoryRequestVersion += 1;
    this.taskRequestVersion += 1;
    this.employeeRequestVersion += 1;
    this.taskAnalysisRequestVersion += 1;
    this.employeeRecommendationRequestVersion += 1;
    this.projectManagerRequestVersion += 1;
    this.persistBrowserOfficeSession();
    this.view.hide();
  }

  destroy() {
    this.repositoryRequestVersion += 1;
    this.taskRequestVersion += 1;
    this.employeeRequestVersion += 1;
    this.employeeNpcBootstrapRequestVersion += 1;
    this.taskAnalysisRequestVersion += 1;
    this.employeeRecommendationRequestVersion += 1;
    this.projectManagerRequestVersion += 1;
    this.persistBrowserOfficeSession();
    this.view.destroy();
    this.state.isOpen = false;
    this.state.justOpened = false;
  }

  private persistBrowserOfficeSession() {
    this.browserOfficeSessionService?.saveState(this.state);
  }

  private updateListInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.close();
      return;
    }

    if (input.upPressed) this.moveProjectSelection(-1);
    if (input.downPressed) this.moveProjectSelection(1);

    if (input.openCandidateDetailPressed) {
      const project = this.getSelectedProject();
      if (project) this.openProjectBacklog(project.id);
      return;
    }

    if (input.actionPressed || input.enterPressed) {
      if (this.state.selectedProjectIndex === -2) {
        void this.recruitFifthEmployee().then((handled) => {
          if (handled) this.view.render(this.state);
        });
        return;
      }

      if (this.state.selectedProjectIndex === -3) {
        this.addExternalProjectDraft();
        return;
      }

      if (this.state.selectedProjectIndex === -1) {
        this.openInfluencePlanning();
        return;
      }

      const project = this.getSelectedProject();
      if (!project) return;

      void this.openProjectDashboard(project.id);
    }
  }

  private updateProjectDashboardInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "list";
      this.state.selectedProjectDashboardProjectId = undefined;
      this.state.selectedProjectDashboardActiveWorkIndex = 0;
      this.state.selectedCandidatePromotionIndex = 0;
      this.state.selectedCandidateTaskId = undefined;
      this.state.projectDashboardSnapshot = undefined;
      this.state.selectedRepositoryIdentityChoiceIndex = 0;
      this.repositorySyncRequestVersion += 1;
      this.issueSyncRequestVersion += 1;
      this.refreshCompanyDashboardSnapshot();
      this.view.render(this.state);
      return;
    }

    const selectedPromotion = this.getSelectedCandidatePromotionReview();
    const projectId = this.state.selectedProjectDashboardProjectId;
    if (input.upPressed || input.downPressed) {
      if (selectedPromotion) {
        this.moveCandidatePromotionSelection(input.upPressed ? -1 : 1);
        this.view.render(this.state);
        return;
      }

      if (this.moveProjectDashboardActiveWorkSelection(input.upPressed ? -1 : 1)) {
        this.view.render(this.state);
        return;
      }
    }

    // Entirely separate from enterPressed/actionPressed below: this is the
    // one and only path that can attempt a Claude Implementer Runtime start,
    // and it never fires merely because Runtime Start exists, the dashboard
    // rendered, or any other input branch executed.
    if (input.startImplementerPressed && selectedPromotion?.promotionStatus === "Approved") {
      void this.startImplementerRuntimeForPromotion(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
      ).then((handled) => {
        if (handled) this.view.render(this.state);
      });
      return;
    }

    // Entirely separate from startImplementerPressed above: this is the one
    // and only path that can attempt a Codex Reviewer Runtime start, and it
    // never fires merely because an Implementer Runtime exists or any other
    // input branch executed.
    if (input.startReviewerPressed && selectedPromotion?.promotionStatus === "Approved") {
      void this.startReviewerRuntimeForPromotion(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
      ).then((handled) => {
        if (handled) this.view.render(this.state);
      });
      return;
    }

    // Entirely separate from startImplementerPressed/startReviewerPressed
    // above: this is the one and only path that can record a Review
    // Promotion, and it never starts or re-runs any agent.
    if (input.promoteReviewPressed && selectedPromotion?.promotionStatus === "Approved") {
      const handled = this.promoteReviewForPromotion(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
      );
      if (handled) this.view.render(this.state);
      return;
    }

    // Separate from Promote and from Enter: this records a fix request only
    // for a freshly revalidated ChangesRequested review decision. It is not
    // a Validation Runtime start and it cannot share an input event with one.
    if (input.requestReviewFixPressed && selectedPromotion?.promotionStatus === "Approved") {
      const handled = this.requestReviewFixForPromotion(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
      );
      if (handled) this.view.render(this.state);
      return;
    }

    // Separate from Request Review Fix: this records a fix plan only after a
    // current Review Fix Request revalidates. It is not a Validation Runtime
    // start and it cannot share an input event with the request action.
    if (input.planReviewFixPressed && selectedPromotion?.promotionStatus === "Approved") {
      const handled = this.planReviewFixForPromotion(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
      );
      if (handled) this.view.render(this.state);
      return;
    }

    if (input.startReviewFixRuntimePressed && selectedPromotion?.promotionStatus === "Approved") {
      void this.startReviewFixRuntimeForPromotion(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
      ).then((handled) => {
        if (handled) this.view.render(this.state);
      });
      return;
    }

    if (input.startValidationRuntimePressed && selectedPromotion?.promotionStatus === "Approved") {
      void this.startValidationRuntimeForPromotion(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
      ).then((handled) => {
        if (handled) this.view.render(this.state);
      });
      return;
    }

    if (input.preparePostValidationReviewTargetPressed && selectedPromotion?.promotionStatus === "Approved") {
      const handled = this.preparePostValidationReviewTargetForPromotion(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
      );
      if (handled) this.view.render(this.state);
      return;
    }

    if (input.startPostValidationReviewPressed && selectedPromotion?.promotionStatus === "Approved") {
      void this.startPostValidationReviewForPromotion(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
      ).then((handled) => {
        if (handled) this.view.render(this.state);
      });
      return;
    }

    if (input.enterPressed && selectedPromotion?.promotionStatus === "Approved") {
      const runtimeStarted = this.startRuntimeForPromotion(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
      );
      if (runtimeStarted) {
        this.view.render(this.state);
        return;
      }

      const preflighted = this.runRuntimePreflightForPromotion(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
      );
      if (preflighted) {
        this.view.render(this.state);
        return;
      }

      const executionApproved = this.approveHumanExecutionForPromotion(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
      );
      if (executionApproved) {
        this.view.render(this.state);
        return;
      }

      const readied = this.evaluateExecutionReadinessForPromotion(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
      );
      if (readied) {
        this.view.render(this.state);
        return;
      }

      const planned = this.createExecutionPlanForPromotion(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
      );
      if (planned) {
        this.view.render(this.state);
        return;
      }

      const started = this.startSelectedWorkSessionForPromotion(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
      );
      if (started) {
        this.view.render(this.state);
        return;
      }

      const prepared = this.prepareSelectedWorkSessionForPromotion(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
      );
      if (prepared) {
        this.view.render(this.state);
        return;
      }

      const assigned = this.confirmSelectedEmployeeAssignmentForPromotion(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
      );
      if (assigned) {
        this.view.render(this.state);
        return;
      }

      const promoted = this.promoteSelectedCandidateTask(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
      );
      if (promoted) {
        this.view.render(this.state);
        return;
      }
    }

    if (input.enterPressed && canRecordPromotionDecision(selectedPromotion, "Approved")) {
      const recorded = this.recordCandidatePromotionDecision(
        selectedPromotion.projectId,
        selectedPromotion.candidateTaskId,
        "Approved",
      );
      if (recorded) {
        this.view.render(this.state);
        return;
      }
    }

    if (input.openCandidateDetailPressed && selectedPromotion) {
      if (this.openSelectedCandidateDetail(selectedPromotion.candidateTaskId)) {
        this.view.render(this.state);
        return;
      }
    }

    if (input.actionPressed && selectedPromotion) {
      const targetStatus = getNextPromotionCycleStatus(selectedPromotion);
      if (targetStatus) {
        const recorded = this.recordCandidatePromotionDecision(
          selectedPromotion.projectId,
          selectedPromotion.candidateTaskId,
          targetStatus,
        );
        if (recorded) {
          this.view.render(this.state);
          return;
        }
      }
    }

    if (input.actionPressed || input.enterPressed) {
      if (this.openExternalProjectRepositoryIdentityEdit()) {
        this.view.render(this.state);
        return;
      }

      if (this.openSelectedProjectDashboardActiveWorkTask()) {
        this.view.render(this.state);
        return;
      }

      if (input.actionPressed && this.startExternalProjectAdosExecution()) {
        return;
      }

      if (input.actionPressed && this.createExternalProjectAdosRunPreparation()) {
        this.view.render(this.state);
        return;
      }

      if (input.actionPressed && this.createExternalProjectDevelopmentRequestDraft()) {
        this.view.render(this.state);
        return;
      }

      if (projectId) {
        void this.syncRepositorySnapshot(projectId);
        void this.syncIssueSnapshots(projectId);
      }
    }
  }

  private updateCandidateDetailInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "project-dashboard";
      this.state.selectedCandidateTaskId = undefined;
      this.view.render(this.state);
      return;
    }

    const targetStatus = input.approveCandidateDetailPressed
      ? "Approved"
      : input.deferCandidateDetailPressed
        ? "Deferred"
        : input.rejectCandidateDetailPressed
          ? "Rejected"
          : undefined;
    if (!targetStatus) return;

    const selectedPromotion = this.getSelectedCandidateDetailPromotionReview();
    if (!canRecordPromotionDecision(selectedPromotion, targetStatus)) return;

    const recorded = this.recordCandidatePromotionDecision(
      selectedPromotion.projectId,
      selectedPromotion.candidateTaskId,
      targetStatus,
    );
    if (recorded) {
      this.view.render(this.state);
    }
  }

  private updateDetailInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "list";
      this.view.render(this.state);
      return;
    }

    if (input.actionPressed || input.enterPressed) {
      const project = this.getSelectedProject();
      if (!project || !project.nextAction.enabled) return;

      const workspace = this.state.workspaces[project.id];
      if (!workspace) return;

      this.state.selectedWorkspaceSectionIndex = clamp(
        this.state.selectedWorkspaceSectionIndex,
        0,
        workspace.sections.length - 1,
      );
      this.state.viewMode = "workspace";
      void this.prepareProjectManagementSuggestion(project.id);
      this.view.render(this.state);
    }
  }

  private updateWorkspaceInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "detail";
      this.view.render(this.state);
      return;
    }

    if (input.upPressed) this.moveWorkspaceSelection(-1);
    if (input.downPressed) this.moveWorkspaceSelection(1);

    if (input.actionPressed || input.enterPressed) {
      const project = this.getSelectedProject();
      const workspace = project ? this.state.workspaces[project.id] : undefined;
      const section = workspace?.sections[this.state.selectedWorkspaceSectionIndex];
      if (!project || !section?.enabled) return;

      if (section.id === "repository") {
        void this.openRepositoryDetail(project.id);
        return;
      }

      if (section.id === "planning") {
        this.openProjectBacklog(project.id);
        return;
      }

      if (section.id === "tasks") {
        void this.openTaskList(project.id);
      }
    }
  }

  private updateProjectBacklogInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "workspace";
      this.state.selectedBacklogProjectId = undefined;
      this.state.selectedBacklogTaskId = undefined;
      this.state.selectedBacklogTaskIndex = 0;
      this.view.render(this.state);
      return;
    }

    if (input.upPressed) this.moveBacklogSelection(-1);
    if (input.downPressed) this.moveBacklogSelection(1);
    if (input.actionPressed || input.enterPressed) {
      const title = input.backlogTaskTitle?.trim() ?? "";
      const description = input.backlogTaskDescription?.trim() ?? "";
      if (title && description) {
        this.createBacklogTaskFromInput({
          title,
          description,
          priority: input.backlogTaskPriority,
        });
        return;
      }
    }

    if (input.startBacklogDevelopmentPressed) {
      void this.startSelectedBacklogTaskDevelopment();
      return;
    }

    if (input.toggleAutonomousExecutionPressed || input.autonomousAllowedPriorities) {
      const projectId = this.state.selectedBacklogProjectId;
      const existingPolicy = projectId
        ? this.projectAutonomousExecutionPolicyService.getPolicy(this.state.projectAutonomyPolicies, projectId)
        : undefined;
      this.updateSelectedProjectAutonomyPolicy({
        enabled: input.toggleAutonomousExecutionPressed ? !existingPolicy?.enabled : existingPolicy?.enabled,
        allowedPriorities: input.autonomousAllowedPriorities,
      });
      return;
    }

    if (input.reevaluateAutonomousExecutionPressed) {
      void this.reevaluateSelectedProjectAutonomy();
      return;
    }

    if (input.generateBacklogSuggestionsPressed) {
      void this.generateProjectBacklogSuggestions();
      return;
    }

    if (input.acceptBacklogSuggestionPressed) {
      this.acceptSelectedBacklogSuggestion({
        title: input.backlogSuggestionTitle,
        description: input.backlogSuggestionDescription,
        priority: input.backlogSuggestionPriority,
      });
      return;
    }

    if (input.rejectBacklogSuggestionPressed) {
      this.rejectSelectedBacklogSuggestion();
    }
  }

  private updateRepositoryIdentityEditInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "project-dashboard";
      this.view.render(this.state);
      return;
    }

    if (input.upPressed) this.moveRepositoryIdentityChoiceSelection(-1);
    if (input.downPressed) this.moveRepositoryIdentityChoiceSelection(1);

    if (input.actionPressed || input.enterPressed) {
      const choice = EXTERNAL_PROJECT_REPOSITORY_IDENTITY_CHOICES[this.state.selectedRepositoryIdentityChoiceIndex];
      if (!choice) return;
      const applied = applyExternalProjectDraftRepositoryIdentityChoiceToState(this.state, choice.id);
      if (!applied) return;
      this.state.selectedProjectDashboardProjectId = EXTERNAL_PROJECT_DRAFT_ID;
      this.state.projectDashboardSnapshot = this.getProjectDashboardSnapshot(EXTERNAL_PROJECT_DRAFT_ID);
      this.state.viewMode = "project-dashboard";
      this.persistBrowserOfficeSession();
      this.refreshCompanyDashboardSnapshot();
      this.view.render(this.state);
    }
  }

  private updateRepositoryDetailInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "workspace";
      this.state.selectedRepositoryProjectId = undefined;
      this.repositoryRequestVersion += 1;
      this.view.render(this.state);
      return;
    }

    if (input.actionPressed || input.enterPressed) {
      const projectId = this.state.selectedRepositoryProjectId;
      if (projectId && this.hasRepositoryMapping(projectId)) {
        void this.refreshRepositoryDetail(projectId);
      }
    }
  }

  private updateTaskListInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "workspace";
      this.state.selectedTaskId = undefined;
      this.taskRequestVersion += 1;
      this.view.render(this.state);
      return;
    }

    if (input.upPressed) this.moveTaskSelection(-1);
    if (input.downPressed) this.moveTaskSelection(1);

    if (input.actionPressed || input.enterPressed) {
      const task = this.getSelectedTask();
      if (!task) return;

      this.state.selectedTaskId = task.id;
      void this.prepareSelectedTaskAnalysis();
      void this.prepareSelectedEmployeeRecommendation();
      this.state.viewMode = "task-detail";
      this.view.render(this.state);
    }
  }

  private updateTaskDetailInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "task-list";
      this.view.render(this.state);
      return;
    }

    if (input.actionPressed || input.enterPressed) {
      const taskAction = this.getSelectedTaskAction();

      if (taskAction === "assign_employee") {
        void this.openEmployeeSelection();
        return;
      }

      if (taskAction === "start_work") {
        void this.startPlaceholderWorkOnSelectedTask();
        return;
      }

      if (taskAction === "move_to_review") {
        this.moveSelectedTaskToReview();
        return;
      }

      if (taskAction === "mark_done") {
        this.markSelectedTaskDone();
      }
    }
  }

  private updateEmployeeSelectionInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "task-detail";
      this.employeeRequestVersion += 1;
      this.view.render(this.state);
      return;
    }

    if (input.upPressed) this.moveEmployeeSelection(-1);
    if (input.downPressed) this.moveEmployeeSelection(1);

    if (input.actionPressed || input.enterPressed) {
      this.assignSelectedEmployeeToSelectedTask();
    }
  }

  private updateInfluencePlanningInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "list";
      this.syncCompanyFocusToDashboardSnapshot();
      this.view.render(this.state);
      return;
    }

    if (input.upPressed) this.moveInfluenceFocusSelection(-1);
    if (input.downPressed) this.moveInfluenceFocusSelection(1);

    if (input.actionPressed || input.enterPressed) {
      const focus = this.getCompanyFocusOptions()[this.state.selectedInfluenceFocusIndex];
      if (!focus) return;

      this.setCompanyFocus(focus.id);
      this.view.render(this.state);
    }
  }

  private openInfluencePlanning() {
    const options = this.getCompanyFocusOptions();
    const activeFocusId = this.state.companyInfluencePlan.selectedFocusId;
    const activeIndex = activeFocusId ? options.findIndex((option) => option.id === activeFocusId) : -1;
    this.state.selectedInfluenceFocusIndex = activeIndex >= 0
      ? activeIndex
      : clamp(this.state.selectedInfluenceFocusIndex, 0, Math.max(options.length - 1, 0));
    this.state.viewMode = "influence-planning";
    this.view.render(this.state);
  }

  private async openProjectDashboard(projectId: string) {
    this.applyActiveProjectContextSelection(projectId);
    this.state.selectedProjectDashboardProjectId = projectId;
    this.state.selectedProjectDashboardActiveWorkIndex = 0;
    this.state.selectedCandidatePromotionIndex = 0;
    this.state.selectedCandidateTaskId = undefined;
    if (this.hasRepositoryMapping(projectId) && !this.state.repositorySummaries[projectId]) {
      this.state.repositorySummaries[projectId] = createLoadingRepositorySummary();
    }
    this.state.projectDashboardSnapshot = this.getProjectDashboardSnapshot(projectId);
    this.state.viewMode = "project-dashboard";
    this.view.render(this.state);
    void this.refreshProjectDashboardRepositorySummary(projectId);
    void this.syncRepositorySnapshot(projectId);
    void this.syncIssueSnapshots(projectId);

    if (this.state.taskCollections[projectId]) return;

    const requestVersion = this.taskRequestVersion + 1;
    this.taskRequestVersion = requestVersion;

    const collection = await this.taskService.getTaskCollection(projectId);
    if (!this.shouldApplyProjectDashboardTaskCollection(projectId, requestVersion)) return;

    this.state.taskCollections[projectId] = collection;
    this.state.projectDashboardSnapshot = this.getProjectDashboardSnapshot(projectId);
    this.persistBrowserOfficeSession();
    this.view.render(this.state);
  }

  private async openRepositoryDetail(projectId: string) {
    const requestVersion = this.repositoryRequestVersion + 1;
    this.repositoryRequestVersion = requestVersion;
    this.state.selectedRepositoryProjectId = projectId;
    this.state.repositorySummaries[projectId] = createLoadingRepositorySummary();
    this.state.viewMode = "repository-detail";
    this.view.render(this.state);

    const summary = await this.repositoryService.getRepositorySummary(projectId);
    if (!this.shouldApplyRepositorySummary(projectId, requestVersion)) return;

    this.state.repositorySummaries[projectId] = summary;
    this.view.render(this.state);
  }

  private async refreshRepositoryDetail(projectId: string) {
    const requestVersion = this.repositoryRequestVersion + 1;
    this.repositoryRequestVersion = requestVersion;
    this.state.repositorySummaries[projectId] = createLoadingRepositorySummary();
    this.view.render(this.state);

    const summary = await this.repositoryService.refreshRepositorySummary(projectId);
    if (!this.shouldApplyRepositorySummary(projectId, requestVersion)) return;

    this.state.repositorySummaries[projectId] = summary;
    this.view.render(this.state);
  }

  private async refreshProjectDashboardRepositorySummary(projectId: string) {
    if (!this.hasRepositoryMapping(projectId)) return;

    const requestVersion = this.repositoryRequestVersion + 1;
    this.repositoryRequestVersion = requestVersion;

    const summary = await this.repositoryService.getRepositorySummary(projectId);
    if (!this.shouldApplyProjectDashboardRepositorySummary(projectId, requestVersion)) return;

    this.state.repositorySummaries[projectId] = summary;
    this.state.projectDashboardSnapshot = this.getProjectDashboardSnapshot(projectId);
    this.view.render(this.state);
  }

  private async syncRepositorySnapshot(projectId: string) {
    const project = this.state.projects.find((item) => item.id === projectId);
    const identity = project?.repositoryIdentity;
    if (!identity) return;

    const requestVersion = this.repositorySyncRequestVersion + 1;
    this.repositorySyncRequestVersion = requestVersion;

    const previous = this.state.repositorySyncSnapshots[projectId];
    this.state.repositorySyncSnapshots[projectId] = createSyncingRepositorySyncSnapshot(identity, previous);
    this.view.render(this.state);

    const snapshot = await this.repositorySyncService.readRepositorySnapshot(identity, { projectId }, previous);
    if (!this.shouldApplyRepositorySyncSnapshot(projectId, requestVersion)) return;

    this.state.repositorySyncSnapshots[projectId] = snapshot;
    this.view.render(this.state);
  }

  private async syncIssueSnapshots(projectId: string) {
    const project = this.state.projects.find((item) => item.id === projectId);
    const identity = project?.repositoryIdentity;
    if (!identity) return;

    const requestVersion = this.issueSyncRequestVersion + 1;
    this.issueSyncRequestVersion = requestVersion;

    const previous = this.state.issueSyncCollections[projectId];
    const syncingCollection = createSyncingIssueSnapshotCollection(identity, previous);
    this.state.issueSyncCollections[projectId] = syncingCollection;
    this.mapCandidateTasksFromIssueCollection(projectId, syncingCollection);
    this.view.render(this.state);

    const collection = await this.issueSyncService.readIssueSnapshots(identity, previous);
    if (!this.shouldApplyIssueSyncCollection(projectId, requestVersion)) return;

    this.state.issueSyncCollections[projectId] = collection;
    this.mapCandidateTasksFromIssueCollection(projectId, collection);
    this.view.render(this.state);
  }

  private mapCandidateTasksFromIssueCollection(
    projectId: string,
    collection: ProjectPortalState["issueSyncCollections"][string],
  ) {
    this.candidateTaskService ??= new CandidateTaskService();
    this.state.candidateTaskCollections ??= {};
    this.state.candidateTaskCollections[projectId] = this.candidateTaskService.mapIssueCollection(projectId, collection);
    this.refreshCandidateAssignmentsForProject(projectId);
  }

  private refreshCandidateAssignmentsForSelectedProject() {
    const projectId = this.state.selectedProjectDashboardProjectId;
    if (!projectId) return;
    this.refreshCandidateAssignmentsForProject(projectId);
  }

  private refreshCandidateAssignmentsForProject(projectId: string) {
    const collection = this.state.candidateTaskCollections[projectId];
    if (!collection) return;

    this.candidateAssignmentService ??= new CandidateAssignmentService();
    this.state.candidateAssignmentCollections ??= {};
    this.state.candidateAssignmentCollections[projectId] = this.candidateAssignmentService.recommendAssignments(
      collection,
      this.state.employees,
    );
    this.refreshCandidatePromotionsForProject(projectId);
  }

  private refreshCandidatePromotionsForProject(projectId: string) {
    const candidateTasks = this.state.candidateTaskCollections[projectId];
    if (!candidateTasks) return;

    this.candidatePromotionService ??= new CandidatePromotionService();
    this.state.candidatePromotionReviewCollections ??= {};
    this.state.candidatePromotionDecisionRecords ??= {};
    this.state.candidatePromotionReviewCollections[projectId] = this.candidatePromotionService.createReviewCollection(
      candidateTasks,
      this.state.candidateAssignmentCollections[projectId],
      this.state.candidatePromotionDecisionRecords,
      this.state.selectedCandidatePromotionIndex,
    );
    const collection = this.state.candidatePromotionReviewCollections[projectId];
    this.state.selectedCandidatePromotionIndex = collection.selectedIndex;
  }

  private recordCandidatePromotionDecision(
    projectId: string,
    candidateTaskId: string,
    targetStatus: CandidatePromotionStatus,
  ) {
    const collection = this.state.candidatePromotionReviewCollections[projectId];
    if (!collection) return false;

    const beforeTasks = this.state.taskCollections;
    const beforeEmployees = this.state.employees;
    const beforeWorkSessions = this.state.workSessions;
    this.candidatePromotionService ??= new CandidatePromotionService();
    const result = this.candidatePromotionService.applyDecision(
      collection,
      this.state.candidatePromotionDecisionRecords,
      {
        projectId,
        candidateTaskId,
        targetStatus,
        decidedAt: new Date().toISOString(),
      },
    );
    if (!result.accepted) return false;

    this.state.candidatePromotionDecisionRecords = result.decisions;
    this.refreshCandidatePromotionsForProject(projectId);
    this.state.taskCollections = beforeTasks;
    this.state.employees = beforeEmployees;
    this.state.workSessions = beforeWorkSessions;
    this.persistBrowserOfficeSession();
    return true;
  }

  private promoteSelectedCandidateTask(projectId: string, candidateTaskId: string) {
    this.candidateProjectTaskPromotionService ??= new CandidateProjectTaskPromotionService();
    this.state.candidateProjectTaskPromotionResultCollections ??= {};

    const beforeEmployees = this.state.employees;
    const beforeWorkSessions = this.state.workSessions;
    const outcome = this.candidateProjectTaskPromotionService.promote({
      request: {
        projectId,
        candidateTaskId,
        requestedAt: new Date().toISOString(),
      },
      candidateTasks: this.state.candidateTaskCollections[projectId],
      assignments: this.state.candidateAssignmentCollections[projectId],
      decisions: this.state.candidatePromotionDecisionRecords,
      taskCollection: this.state.taskCollections[projectId],
    });

    if (outcome.taskCollection && outcome.result.status === "Promoted") {
      this.state.taskCollections[projectId] = outcome.taskCollection;
      this.state.selectedTaskProjectId = projectId;
      this.state.selectedTaskIndex = Math.max(0, outcome.taskCollection.tasks.findIndex((task) => task.id === outcome.result.createdProjectTaskId));
      this.state.selectedTaskId = outcome.result.createdProjectTaskId;
    }

    const existingResults = this.state.candidateProjectTaskPromotionResultCollections[projectId];
    this.state.candidateProjectTaskPromotionResultCollections[projectId] =
      this.candidateProjectTaskPromotionService.upsertResult(existingResults, outcome.result);
    this.state.employees = beforeEmployees;
    this.state.workSessions = beforeWorkSessions;
    this.persistBrowserOfficeSession();
    return true;
  }

  private confirmSelectedEmployeeAssignmentForPromotion(projectId: string, candidateTaskId: string) {
    this.confirmedEmployeeAssignmentService ??= new ConfirmedEmployeeAssignmentService();
    this.state.confirmedEmployeeAssignmentRecords ??= {};
    this.state.confirmedEmployeeAssignmentResultCollections ??= {};

    const taskCollection = this.state.taskCollections[projectId];
    const promotedTask = taskCollection?.tasks.find((task) =>
      parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === candidateTaskId
    );
    if (!taskCollection || !promotedTask) return false;

    const assignment = this.state.candidateAssignmentCollections[projectId]?.recommendations
      .find((item) => item.candidateTaskId === candidateTaskId);
    const provenance = parsePromotedProjectTaskProvenance(promotedTask.description);
    const assignmentRecommendationId = provenance?.assignmentRecommendationId ?? assignment?.id;
    const employeeId = assignment?.recommendedEmployeeId;
    if (!assignmentRecommendationId || !employeeId) return false;

    const beforeEmployees = this.state.employees;
    const beforeWorkSessions = this.state.workSessions;
    const outcome = this.confirmedEmployeeAssignmentService.confirm({
      request: {
        projectId,
        projectTaskId: promotedTask.id,
        assignmentRecommendationId,
        employeeId,
        requestedAt: new Date().toISOString(),
      },
      taskCollection,
      assignments: this.state.candidateAssignmentCollections[projectId],
      employees: this.state.employees,
      workSessions: this.state.workSessions,
      existingAssignments: this.state.confirmedEmployeeAssignmentRecords,
    });

    if (outcome.taskCollection && outcome.result.status === "Assigned") {
      this.state.taskCollections[projectId] = outcome.taskCollection;
      this.state.selectedTaskProjectId = projectId;
      this.state.selectedTaskIndex = Math.max(0, outcome.taskCollection.tasks.findIndex((task) => task.id === outcome.result.projectTaskId));
      this.state.selectedTaskId = outcome.result.projectTaskId;
    }

    if (outcome.assignmentRecord) {
      this.state.confirmedEmployeeAssignmentRecords = this.confirmedEmployeeAssignmentService.upsertRecord(
        this.state.confirmedEmployeeAssignmentRecords,
        outcome.assignmentRecord,
      );
    }

    const existingResults = this.state.confirmedEmployeeAssignmentResultCollections[projectId];
    this.state.confirmedEmployeeAssignmentResultCollections[projectId] =
      this.confirmedEmployeeAssignmentService.upsertResult(existingResults, outcome.result);
    this.state.employees = beforeEmployees;
    this.state.workSessions = beforeWorkSessions;
    this.persistBrowserOfficeSession();
    return true;
  }

  private prepareSelectedWorkSessionForPromotion(projectId: string, candidateTaskId: string) {
    this.preparedWorkSessionService ??= new PreparedWorkSessionService();
    this.state.preparedWorkSessionRecords ??= {};
    this.state.preparedWorkSessionResultCollections ??= {};

    const taskCollection = this.state.taskCollections[projectId];
    const promotedTask = taskCollection?.tasks.find((task) =>
      parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === candidateTaskId
    );
    if (!taskCollection || !promotedTask?.assigneeId) return false;

    const assignment = Object.values(this.state.confirmedEmployeeAssignmentRecords)
      .find((record) =>
        record.projectId === projectId &&
        record.projectTaskId === promotedTask.id &&
        record.candidateTaskId === candidateTaskId &&
        record.employeeId === promotedTask.assigneeId
      );
    if (!assignment) return false;

    const beforeTaskCollections = this.state.taskCollections;
    const beforeEmployees = this.state.employees;
    const beforeWorkSessions = this.state.workSessions;
    const beforeAssignments = this.state.confirmedEmployeeAssignmentRecords;
    const outcome = this.preparedWorkSessionService.prepare({
      request: {
        projectId,
        projectTaskId: promotedTask.id,
        confirmedAssignmentId: assignment.id,
        requestedAt: new Date().toISOString(),
      },
      taskCollection,
      confirmedAssignments: this.state.confirmedEmployeeAssignmentRecords,
      employees: this.state.employees,
      workSessions: this.state.workSessions,
      existingPreparedSessions: this.state.preparedWorkSessionRecords,
    });

    if (outcome.preparedSession) {
      this.state.preparedWorkSessionRecords = this.preparedWorkSessionService.upsertRecord(
        this.state.preparedWorkSessionRecords,
        outcome.preparedSession,
      );
    }

    const existingResults = this.state.preparedWorkSessionResultCollections[projectId];
    this.state.preparedWorkSessionResultCollections[projectId] =
      this.preparedWorkSessionService.upsertResult(existingResults, outcome.result);
    this.state.taskCollections = beforeTaskCollections;
    this.state.employees = beforeEmployees;
    this.state.workSessions = beforeWorkSessions;
    this.state.confirmedEmployeeAssignmentRecords = beforeAssignments;
    this.persistBrowserOfficeSession();
    return true;
  }

  private startSelectedWorkSessionForPromotion(projectId: string, candidateTaskId: string) {
    this.activeWorkSessionStartService ??= new ActiveWorkSessionStartService();
    this.state.activeWorkSessionStartResultCollections ??= {};

    const taskCollection = this.state.taskCollections[projectId];
    const promotedTask = taskCollection?.tasks.find((task) =>
      parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === candidateTaskId
    );
    if (!taskCollection || !promotedTask?.assigneeId) return false;

    const preparedSession = Object.values(this.state.preparedWorkSessionRecords)
      .find((record) =>
        record.projectId === projectId &&
        record.projectTaskId === promotedTask.id &&
        record.candidateTaskId === candidateTaskId &&
        record.employeeId === promotedTask.assigneeId
      );
    if (!preparedSession) return false;

    const beforeAssignments = this.state.confirmedEmployeeAssignmentRecords;
    const beforePreparedSessions = this.state.preparedWorkSessionRecords;
    const outcome = this.activeWorkSessionStartService.start({
      request: {
        projectId,
        projectTaskId: promotedTask.id,
        preparedSessionId: preparedSession.id,
        requestedAt: new Date().toISOString(),
      },
      taskCollection,
      confirmedAssignments: this.state.confirmedEmployeeAssignmentRecords,
      preparedSessions: this.state.preparedWorkSessionRecords,
      employees: this.state.employees,
      activeSessions: this.state.workSessions,
    });

    if (
      outcome.taskCollection &&
      outcome.employees &&
      outcome.activeSessions &&
      outcome.result.status === "Started"
    ) {
      this.state.taskCollections[projectId] = outcome.taskCollection;
      this.state.employees = outcome.employees;
      this.state.workSessions = outcome.activeSessions;
      this.state.selectedTaskProjectId = projectId;
      this.state.selectedTaskIndex = Math.max(0, outcome.taskCollection.tasks.findIndex((task) => task.id === outcome.result.projectTaskId));
      this.state.selectedTaskId = outcome.result.projectTaskId;
      this.state.selectedWorkSessionId = outcome.result.activeSessionId;
      this.refreshEmployeeSimulationSnapshotsForWorkStarted();
    } else if (outcome.result.status === "AlreadyStarted") {
      this.state.selectedWorkSessionId = outcome.result.activeSessionId;
    }

    const existingResults = this.state.activeWorkSessionStartResultCollections[projectId];
    this.state.activeWorkSessionStartResultCollections[projectId] =
      this.activeWorkSessionStartService.upsertResult(existingResults, outcome.result);
    this.state.confirmedEmployeeAssignmentRecords = beforeAssignments;
    this.state.preparedWorkSessionRecords = beforePreparedSessions;
    this.persistBrowserOfficeSession();
    return true;
  }

  private evaluateExecutionReadinessForPromotion(projectId: string, candidateTaskId: string) {
    this.executionReadinessService ??= new ExecutionReadinessService();
    this.state.executionReadinessCollections ??= {};
    this.state.executionReadinessResultCollections ??= {};

    const taskCollection = this.state.taskCollections[projectId];
    const promotedTask = taskCollection?.tasks.find((task) =>
      parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === candidateTaskId
    );
    if (!taskCollection || !promotedTask) return false;

    const planCollection = this.state.executionPlanCollections[projectId];
    const plan = planCollection?.plans.find((item) =>
      item.projectId === projectId &&
      item.projectTaskId === promotedTask.id &&
      item.candidateTaskId === candidateTaskId
    );
    if (!plan) return false;

    const revalidatedPlan = this.revalidateExecutionPlanForPromotion(projectId, promotedTask.id, plan.activeSessionId);
    if (!revalidatedPlan) {
      this.clearRuntimePreflightForProject(projectId);
      return true;
    }

    const project = this.state.projects.find((item) => item.id === projectId);
    const repositorySnapshot = this.state.repositorySyncSnapshots[projectId];
    const existingReadiness = this.state.executionReadinessCollections[projectId]
      ?? createExecutionReadinessCollection({ projectId, readiness: [], rulesVersion: "readiness-v1" });
    const existingResults = this.state.executionReadinessResultCollections[projectId]
      ?? createExecutionReadinessResultCollection({ projectId, results: [], rulesVersion: "readiness-v1" });

    const outcome = this.executionReadinessService.evaluateReadiness({
      request: {
        projectId,
        executionPlanId: revalidatedPlan.planId,
        evaluatedAt: new Date().toISOString(),
      },
      executionPlans: this.state.executionPlanCollections[projectId],
      taskCollection,
      confirmedAssignments: this.state.confirmedEmployeeAssignmentRecords,
      preparedSessions: this.state.preparedWorkSessionRecords,
      activeSessions: this.state.workSessions,
      employees: this.state.employees,
      repositoryEvidence: createExecutionReadinessRepositoryEvidence(projectId, project, repositorySnapshot, revalidatedPlan),
      roleContext: {
        implementerAgent: "Implementer",
        reviewerAgent: "Reviewer",
        validationCommands: EXECUTION_PLAN_VALIDATION_COMMANDS,
        allowedMutationScope: EXECUTION_PLAN_ALLOWED_MUTATION_SCOPE,
      },
      existingReadiness,
      existingResults,
    });

    this.state.executionReadinessCollections[projectId] = outcome.readinessCollection ?? existingReadiness;
    this.state.executionReadinessResultCollections[projectId] = outcome.resultCollection ?? existingResults;
    this.state.humanExecutionApprovalCollections ??= {};
    this.state.humanExecutionApprovalCollections[projectId] ??= createHumanExecutionApprovalCollection({
      projectId,
      approvals: [],
      rulesVersion: "approval-v1",
    });
    this.persistBrowserOfficeSession();
    return true;
  }

  private approveHumanExecutionForPromotion(projectId: string, candidateTaskId: string) {
    this.humanExecutionApprovalService ??= new HumanExecutionApprovalService();
    this.executionReadinessService ??= new ExecutionReadinessService();
    this.state.humanExecutionApprovalCollections ??= {};
    this.state.humanExecutionApprovalResultCollections ??= {};
    this.state.executionReadinessCollections ??= {};
    this.state.executionReadinessResultCollections ??= {};

    const taskCollection = this.state.taskCollections[projectId];
    const promotedTask = taskCollection?.tasks.find((task) =>
      parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === candidateTaskId
    );
    if (!taskCollection || !promotedTask) return false;

    const planCollection = this.state.executionPlanCollections[projectId];
    const plan = planCollection?.plans.find((item) =>
      item.projectId === projectId &&
      item.projectTaskId === promotedTask.id &&
      item.candidateTaskId === candidateTaskId
    );
    if (!plan) return false;

    const currentReadiness = this.state.executionReadinessCollections[projectId]?.readiness
      .find((item) => item.executionPlanId === plan.planId);
    const currentReadinessResult = this.state.executionReadinessResultCollections[projectId]?.results
      .find((item) => item.executionPlanId === plan.planId && item.readinessId === currentReadiness?.readinessId);
    if (!currentReadiness || !currentReadinessResult) return false;

    const revalidatedPlan = this.revalidateExecutionPlanForPromotion(projectId, promotedTask.id, plan.activeSessionId);
    if (!revalidatedPlan) {
      this.clearRuntimePreflightForProject(projectId);
      return true;
    }

    const project = this.state.projects.find((item) => item.id === projectId);
    const repositorySnapshot = this.state.repositorySyncSnapshots[projectId];
    const existingReadiness = this.state.executionReadinessCollections[projectId]
      ?? createExecutionReadinessCollection({ projectId, readiness: [], rulesVersion: "readiness-v1" });
    const existingReadinessResults = this.state.executionReadinessResultCollections[projectId]
      ?? createExecutionReadinessResultCollection({ projectId, results: [], rulesVersion: "readiness-v1" });

    const readinessOutcome = this.executionReadinessService.evaluateReadiness({
      request: {
        projectId,
        executionPlanId: revalidatedPlan.planId,
        evaluatedAt: new Date().toISOString(),
      },
      executionPlans: this.state.executionPlanCollections[projectId],
      taskCollection,
      confirmedAssignments: this.state.confirmedEmployeeAssignmentRecords,
      preparedSessions: this.state.preparedWorkSessionRecords,
      activeSessions: this.state.workSessions,
      employees: this.state.employees,
      repositoryEvidence: createExecutionReadinessRepositoryEvidence(projectId, project, repositorySnapshot, revalidatedPlan),
      roleContext: {
        implementerAgent: "Implementer",
        reviewerAgent: "Reviewer",
        validationCommands: EXECUTION_PLAN_VALIDATION_COMMANDS,
        allowedMutationScope: EXECUTION_PLAN_ALLOWED_MUTATION_SCOPE,
      },
      existingReadiness,
      existingResults: existingReadinessResults,
    });
    this.state.executionReadinessCollections[projectId] = readinessOutcome.readinessCollection ?? existingReadiness;
    this.state.executionReadinessResultCollections[projectId] = readinessOutcome.resultCollection ?? existingReadinessResults;

    const existingApprovals = this.state.humanExecutionApprovalCollections[projectId]
      ?? createHumanExecutionApprovalCollection({ projectId, approvals: [], rulesVersion: "approval-v1" });
    const approvalOutcome = this.humanExecutionApprovalService.approve({
      command: {
        projectId,
        executionPlanId: revalidatedPlan.planId,
        readinessId: readinessOutcome.readiness.readinessId,
        approvedBy: "Local Human",
        requestedAt: new Date().toISOString(),
      },
      executionPlan: revalidatedPlan,
      readiness: readinessOutcome.readiness,
      readinessResult: readinessOutcome.result,
      existingApprovals,
    });

    if (approvalOutcome.approvalCollection) {
      this.state.humanExecutionApprovalCollections[projectId] = approvalOutcome.approvalCollection;
    } else {
      this.state.humanExecutionApprovalCollections[projectId] = existingApprovals;
    }
    const existingApprovalResults = this.state.humanExecutionApprovalResultCollections[projectId];
    this.state.humanExecutionApprovalResultCollections[projectId] =
      this.humanExecutionApprovalService.upsertResult(existingApprovalResults, approvalOutcome.result);
    this.persistBrowserOfficeSession();
    return true;
  }

  private runRuntimePreflightForPromotion(projectId: string, candidateTaskId: string) {
    this.runtimePreflightService ??= new RuntimePreflightService();
    this.runtimeEnvironmentProvider ??= new RepresentedRuntimeEnvironmentProvider();
    this.executionReadinessService ??= new ExecutionReadinessService();
    this.state.runtimePreflightCollections ??= {};
    this.state.runtimePreflightResultCollections ??= {};

    const taskCollection = this.state.taskCollections[projectId];
    const promotedTask = taskCollection?.tasks.find((task) =>
      parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === candidateTaskId
    );
    if (!taskCollection || !promotedTask) return false;

    const plan = this.state.executionPlanCollections[projectId]?.plans.find((item) =>
      item.projectId === projectId &&
      item.projectTaskId === promotedTask.id &&
      item.candidateTaskId === candidateTaskId
    );
    if (!plan) return false;

    const approval = this.state.humanExecutionApprovalCollections[projectId]?.approvals
      .find((item) => item.executionPlanId === plan.planId);
    if (!approval) return false;

    const revalidatedPlan = this.revalidateExecutionPlanForPromotion(projectId, promotedTask.id, plan.activeSessionId);
    if (!revalidatedPlan) {
      this.clearRuntimePreflightForProject(projectId);
      return true;
    }

    const project = this.state.projects.find((item) => item.id === projectId);
    const repositorySnapshot = this.state.repositorySyncSnapshots[projectId];
    const existingReadiness = this.state.executionReadinessCollections[projectId]
      ?? createExecutionReadinessCollection({ projectId, readiness: [], rulesVersion: "readiness-v1" });
    const existingReadinessResults = this.state.executionReadinessResultCollections[projectId]
      ?? createExecutionReadinessResultCollection({ projectId, results: [], rulesVersion: "readiness-v1" });
    const readinessOutcome = this.executionReadinessService.evaluateReadiness({
      request: {
        projectId,
        executionPlanId: revalidatedPlan.planId,
        evaluatedAt: new Date().toISOString(),
      },
      executionPlans: this.state.executionPlanCollections[projectId],
      taskCollection,
      confirmedAssignments: this.state.confirmedEmployeeAssignmentRecords,
      preparedSessions: this.state.preparedWorkSessionRecords,
      activeSessions: this.state.workSessions,
      employees: this.state.employees,
      repositoryEvidence: createExecutionReadinessRepositoryEvidence(projectId, project, repositorySnapshot, revalidatedPlan),
      roleContext: {
        implementerAgent: "Implementer",
        reviewerAgent: "Reviewer",
        validationCommands: EXECUTION_PLAN_VALIDATION_COMMANDS,
        allowedMutationScope: EXECUTION_PLAN_ALLOWED_MUTATION_SCOPE,
      },
      existingReadiness,
      existingResults: existingReadinessResults,
    });
    this.state.executionReadinessCollections[projectId] = readinessOutcome.readinessCollection ?? existingReadiness;
    this.state.executionReadinessResultCollections[projectId] = readinessOutcome.resultCollection ?? existingReadinessResults;

    const existingPreflights = this.state.runtimePreflightCollections[projectId]
      ?? createRuntimePreflightCollection({ projectId, preflights: [], rulesVersion: "preflight-v1" });
    const existingPreflightResults = this.state.runtimePreflightResultCollections[projectId]
      ?? createRuntimePreflightResultCollection({ projectId, results: [], rulesVersion: "preflight-v1" });

    if (readinessOutcome.result.status !== "Ready") {
      const blockedOutcome = this.runtimePreflightService.runPreflight({
        command: {
          projectId,
          executionPlanId: revalidatedPlan.planId,
          approvalId: approval.approvalId,
          evaluatedAt: new Date().toISOString(),
        },
        executionPlan: revalidatedPlan,
        readiness: readinessOutcome.readiness,
        readinessResult: readinessOutcome.result,
        approval,
        existingPreflights,
        existingResults: existingPreflightResults,
      });
      this.state.runtimePreflightCollections[projectId] = blockedOutcome.preflightCollection ?? existingPreflights;
      this.state.runtimePreflightResultCollections[projectId] = blockedOutcome.resultCollection ?? existingPreflightResults;
      this.persistBrowserOfficeSession();
      return true;
    }

    let evidence: RuntimePreflightEvidence;
    try {
      evidence = this.runtimeEnvironmentProvider.inspect({
        projectId,
        executionPlan: revalidatedPlan,
        approvedCommands: EXECUTION_PLAN_VALIDATION_COMMANDS,
        approvedMutationScope: EXECUTION_PLAN_ALLOWED_MUTATION_SCOPE,
      });
    } catch {
      evidence = createFailedRuntimePreflightEvidence(projectId, revalidatedPlan);
    }
    const outcome = this.runtimePreflightService.runPreflight({
      command: {
        projectId,
        executionPlanId: revalidatedPlan.planId,
        approvalId: approval.approvalId,
        evaluatedAt: new Date().toISOString(),
      },
      executionPlan: revalidatedPlan,
      readiness: readinessOutcome.readiness,
      readinessResult: readinessOutcome.result,
      approval,
      evidence,
      existingPreflights,
      existingResults: existingPreflightResults,
    });

    this.state.runtimePreflightCollections[projectId] = outcome.preflightCollection ?? existingPreflights;
    this.state.runtimePreflightResultCollections[projectId] = outcome.resultCollection ?? existingPreflightResults;
    this.persistBrowserOfficeSession();
    return true;
  }

  private startRuntimeForPromotion(projectId: string, candidateTaskId: string) {
    this.runtimeStartService ??= new RuntimeStartService();
    this.state.runtimeStartCollections ??= {};
    this.state.runtimeStartResultCollections ??= {};

    const taskCollection = this.state.taskCollections[projectId];
    const promotedTask = taskCollection?.tasks.find((task) =>
      parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === candidateTaskId
    );
    if (!taskCollection || !promotedTask) return false;

    const existingPlan = this.state.executionPlanCollections[projectId]?.plans.find((item) =>
      item.projectId === projectId &&
      item.projectTaskId === promotedTask.id &&
      item.candidateTaskId === candidateTaskId
    );
    if (!existingPlan) return false;

    // Requiring a prior preflight result here is what makes reaching Runtime
    // Start take two separate Enter presses in practice: the first press
    // (via runRuntimePreflightForPromotion below) only ever produces a fresh
    // preflight result; only a second press, once that result already
    // exists, proceeds far enough to create the Runtime Start record itself.
    const priorPreflightResult = this.state.runtimePreflightResultCollections[projectId]?.results
      .find((item) => item.executionPlanId === existingPlan.planId);
    if (!priorPreflightResult) return false;

    const preflighted = this.runRuntimePreflightForPromotion(projectId, candidateTaskId);
    if (!preflighted) return false;

    const plan = this.state.executionPlanCollections[projectId]?.plans.find((item) =>
      item.projectId === projectId &&
      item.projectTaskId === promotedTask.id &&
      item.candidateTaskId === candidateTaskId
    );
    const readiness = plan
      ? this.state.executionReadinessCollections[projectId]?.readiness.find((item) => item.executionPlanId === plan.planId)
      : undefined;
    const readinessResult = plan && readiness
      ? this.state.executionReadinessResultCollections[projectId]?.results.find((item) =>
        item.executionPlanId === plan.planId && item.readinessId === readiness.readinessId
      )
      : undefined;
    const approval = plan
      ? this.state.humanExecutionApprovalCollections[projectId]?.approvals.find((item) => item.executionPlanId === plan.planId)
      : undefined;
    const preflight = plan
      ? this.state.runtimePreflightCollections[projectId]?.preflights.find((item) => item.executionPlanId === plan.planId)
      : undefined;
    const preflightResult = plan && preflight
      ? this.state.runtimePreflightResultCollections[projectId]?.results.find((item) =>
        item.executionPlanId === plan.planId && item.preflightId === preflight.preflightId
      )
      : undefined;
    const existingStarts = this.state.runtimeStartCollections[projectId]
      ?? createRuntimeStartCollection({ projectId, starts: [], rulesVersion: "start-v1" });
    const existingResults = this.state.runtimeStartResultCollections[projectId]
      ?? createRuntimeStartResultCollection({ projectId, results: [], rulesVersion: "start-v1" });

    const outcome = this.runtimeStartService.start({
      command: {
        projectId,
        executionPlanId: plan?.planId ?? existingPlan.planId,
        runtimePreflightId: preflight?.preflightId ?? priorPreflightResult.preflightId,
        startedBy: "Local Human",
        requestedAt: new Date().toISOString(),
      },
      executionPlan: plan,
      readiness,
      readinessResult,
      approval,
      preflight,
      preflightResult,
      existingStarts,
      existingResults,
    });

    if (outcome.startCollection && outcome.result.status === "Started") {
      this.state.runtimeStartCollections[projectId] = outcome.startCollection;
    } else if (outcome.result.status === "AlreadyStarted") {
      this.state.runtimeStartCollections[projectId] = existingStarts;
    }
    this.state.runtimeStartResultCollections[projectId] = outcome.resultCollection ?? existingResults;
    this.persistBrowserOfficeSession();
    return true;
  }

  /**
   * Requires a Runtime Start to already exist for this exact plan before
   * doing anything -- this method never originates a first Runtime Start on
   * its own, so pressing the distinct Start-Implementer input can never be
   * the thing that first creates one. Once a Runtime Start already exists,
   * it forces the same full revalidation cascade `startRuntimeForPromotion`
   * itself uses (fresh plan/readiness/preflight/start recomputation) before
   * ever constructing an Implementer Runtime request.
   */
  private async startImplementerRuntimeForPromotion(projectId: string, candidateTaskId: string): Promise<boolean> {
    this.implementerRuntimeService ??= new ImplementerRuntimeService(new ClaudeImplementerRuntimeProvider());
    this.state.implementerRuntimeCollections ??= {};
    this.state.implementerRuntimeResultCollections ??= {};

    const taskCollection = this.state.taskCollections[projectId];
    const promotedTask = taskCollection?.tasks.find((task) =>
      parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === candidateTaskId
    );
    if (!taskCollection || !promotedTask) return false;

    const existingPlan = this.state.executionPlanCollections[projectId]?.plans.find((item) =>
      item.projectId === projectId &&
      item.projectTaskId === promotedTask.id &&
      item.candidateTaskId === candidateTaskId
    );
    if (!existingPlan) return false;

    const hadRuntimeStart = this.state.runtimeStartResultCollections[projectId]?.results.some(
      (item) => item.executionPlanId === existingPlan.planId && (item.status === "Started" || item.status === "AlreadyStarted"),
    );
    if (!hadRuntimeStart) return false;

    const revalidated = this.startRuntimeForPromotion(projectId, candidateTaskId);
    if (!revalidated) return false;

    const plan = this.state.executionPlanCollections[projectId]?.plans.find((item) =>
      item.projectId === projectId &&
      item.projectTaskId === promotedTask.id &&
      item.candidateTaskId === candidateTaskId
    );
    const readiness = plan
      ? this.state.executionReadinessCollections[projectId]?.readiness.find((item) => item.executionPlanId === plan.planId)
      : undefined;
    const readinessResult = plan && readiness
      ? this.state.executionReadinessResultCollections[projectId]?.results.find((item) =>
        item.executionPlanId === plan.planId && item.readinessId === readiness.readinessId
      )
      : undefined;
    const approval = plan
      ? this.state.humanExecutionApprovalCollections[projectId]?.approvals.find((item) => item.executionPlanId === plan.planId)
      : undefined;
    const preflight = plan
      ? this.state.runtimePreflightCollections[projectId]?.preflights.find((item) => item.executionPlanId === plan.planId)
      : undefined;
    const preflightResult = plan && preflight
      ? this.state.runtimePreflightResultCollections[projectId]?.results.find((item) =>
        item.executionPlanId === plan.planId && item.preflightId === preflight.preflightId
      )
      : undefined;
    const runtimeStart = plan
      ? this.state.runtimeStartCollections[projectId]?.starts.find((item) => item.executionPlanId === plan.planId)
      : undefined;
    const runtimeStartResult = plan && runtimeStart
      ? this.state.runtimeStartResultCollections[projectId]?.results.find((item) =>
        item.executionPlanId === plan.planId && item.runtimeStartId === runtimeStart.runtimeStartId
      )
      : undefined;

    const existingRuntimes = this.state.implementerRuntimeCollections[projectId]
      ?? createImplementerRuntimeCollection({ projectId, runtimes: [], rulesVersion: IMPLEMENTER_RUNTIME_RULES_VERSION });
    const existingResults = this.state.implementerRuntimeResultCollections[projectId]
      ?? createImplementerRuntimeResultCollection({ projectId, results: [], rulesVersion: IMPLEMENTER_RUNTIME_RULES_VERSION });

    // Revalidation above can invalidate a Runtime Start that existed when
    // this attempt began (a stale plan/approval/preflight/branch change),
    // leaving `runtimeStart`/`runtimeStartResult` undefined or no longer
    // Started/AlreadyStarted here. Report that plainly as a Blocked
    // stale-chain result rather than falling through to the service with an
    // empty runtimeStartId, which would misreport it as a malformed command.
    const runtimeStartStillValid = Boolean(
      runtimeStart && runtimeStartResult && (runtimeStartResult.status === "Started" || runtimeStartResult.status === "AlreadyStarted"),
    );
    if (!runtimeStartStillValid) {
      const staleResult = {
        id: `${projectId}:implementer-runtime-result:${existingPlan.planId}:start-stale`,
        projectId,
        runtimeStartId: runtimeStart?.runtimeStartId,
        executionPlanId: existingPlan.planId,
        status: "Blocked" as const,
        reasonCodes: ["IMPLEMENTER_RUNTIME_START_STALE" as const],
        started: false,
        duplicateActiveAttempt: false,
        agentStarted: false,
        implementerStarted: false,
        reviewerStarted: false as const,
        validationStarted: false as const,
        repositoryMutationStarted: false as const,
        githubMutationStarted: false as const,
        resultAt: new Date().toISOString(),
        rulesVersion: IMPLEMENTER_RUNTIME_RULES_VERSION,
      };
      this.state.implementerRuntimeResultCollections[projectId] =
        this.implementerRuntimeService.upsertResult(existingResults, staleResult);
      return true;
    }

    const activeKey = runtimeStart?.runtimeStartId ?? `${projectId}:${existingPlan.planId}`;
    if (this.activeImplementerRuntimeKeys.has(activeKey)) {
      const blockedResult = {
        id: `${projectId}:implementer-runtime-result:${activeKey}:active-block`,
        projectId,
        runtimeStartId: runtimeStart?.runtimeStartId,
        executionPlanId: existingPlan.planId,
        status: "Blocked" as const,
        reasonCodes: ["IMPLEMENTER_RUNTIME_ALREADY_ACTIVE" as const],
        started: false,
        duplicateActiveAttempt: true,
        agentStarted: false,
        implementerStarted: false,
        reviewerStarted: false as const,
        validationStarted: false as const,
        repositoryMutationStarted: false as const,
        githubMutationStarted: false as const,
        resultAt: new Date().toISOString(),
        rulesVersion: IMPLEMENTER_RUNTIME_RULES_VERSION,
      };
      this.state.implementerRuntimeResultCollections[projectId] =
        this.implementerRuntimeService.upsertResult(existingResults, blockedResult);
      return true;
    }

    this.activeImplementerRuntimeKeys.add(activeKey);
    try {
      const outcome = await this.implementerRuntimeService.startImplementer({
        command: {
          projectId,
          runtimeStartId: runtimeStart?.runtimeStartId ?? "",
          executionPlanId: plan?.planId ?? existingPlan.planId,
          approvedImplementerAgent: IMPLEMENTER_RUNTIME_APPROVED_IMPLEMENTER_AGENT,
          approvedReviewerAgent: IMPLEMENTER_RUNTIME_APPROVED_REVIEWER_AGENT,
          startedBy: "Local Human",
          requestedAt: new Date().toISOString(),
        },
        executionPlan: plan,
        readiness,
        readinessResult,
        approval,
        preflight,
        preflightResult,
        runtimeStart,
        runtimeStartResult,
        existingRuntimes,
        existingResults,
      });

      if (outcome.runtimeCollection) {
        this.state.implementerRuntimeCollections[projectId] = outcome.runtimeCollection;
      }
      this.state.implementerRuntimeResultCollections[projectId] = outcome.resultCollection ?? existingResults;
    } finally {
      this.activeImplementerRuntimeKeys.delete(activeKey);
    }
    return true;
  }

  /**
   * Requires an already-Completed Implementer Runtime *record* (not merely a
   * result) for this exact plan before doing anything -- this method never
   * originates one on its own. It then forces the same full revalidation
   * cascade `startImplementerRuntimeForPromotion` uses (which itself
   * revalidates Plan/Readiness/Approval/Preflight/Runtime Start), and
   * afterward re-asserts that the Completed runtime's implementerRuntimeId
   * is unchanged before proceeding. Requiring the record up front means the
   * revalidation cascade's own deterministic-id lookup will find it and take
   * the IMPLEMENTER_RUNTIME_ALREADY_COMPLETED short-circuit rather than
   * reaching the Claude provider; the post-check catches it if that ever
   * fails to hold.
   */
  private async startReviewerRuntimeForPromotion(projectId: string, candidateTaskId: string): Promise<boolean> {
    this.reviewerRuntimeService ??= new ReviewerRuntimeService(new CodexReviewerRuntimeProvider());
    this.state.reviewTargets ??= {};
    this.state.reviewerRuntimeCollections ??= {};
    this.state.reviewerRuntimeResultCollections ??= {};

    const taskCollection = this.state.taskCollections[projectId];
    const promotedTask = taskCollection?.tasks.find((task) =>
      parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === candidateTaskId
    );
    if (!taskCollection || !promotedTask) return false;

    const existingPlan = this.state.executionPlanCollections[projectId]?.plans.find((item) =>
      item.projectId === projectId &&
      item.projectTaskId === promotedTask.id &&
      item.candidateTaskId === candidateTaskId
    );
    if (!existingPlan) return false;

    const priorImplementerRuntime = this.state.implementerRuntimeCollections[projectId]?.runtimes.find(
      (item) => item.executionPlanId === existingPlan.planId && item.status === "Completed",
    );
    if (!priorImplementerRuntime) return false;

    const revalidated = await this.startImplementerRuntimeForPromotion(projectId, candidateTaskId);
    if (!revalidated) return false;

    const plan = this.state.executionPlanCollections[projectId]?.plans.find((item) =>
      item.projectId === projectId &&
      item.projectTaskId === promotedTask.id &&
      item.candidateTaskId === candidateTaskId
    );
    const readiness = plan
      ? this.state.executionReadinessCollections[projectId]?.readiness.find((item) => item.executionPlanId === plan.planId)
      : undefined;
    const readinessResult = plan && readiness
      ? this.state.executionReadinessResultCollections[projectId]?.results.find((item) =>
        item.executionPlanId === plan.planId && item.readinessId === readiness.readinessId
      )
      : undefined;
    const approval = plan
      ? this.state.humanExecutionApprovalCollections[projectId]?.approvals.find((item) => item.executionPlanId === plan.planId)
      : undefined;
    const preflight = plan
      ? this.state.runtimePreflightCollections[projectId]?.preflights.find((item) => item.executionPlanId === plan.planId)
      : undefined;
    const preflightResult = plan && preflight
      ? this.state.runtimePreflightResultCollections[projectId]?.results.find((item) =>
        item.executionPlanId === plan.planId && item.preflightId === preflight.preflightId
      )
      : undefined;
    const runtimeStart = plan
      ? this.state.runtimeStartCollections[projectId]?.starts.find((item) => item.executionPlanId === plan.planId)
      : undefined;
    const runtimeStartResult = plan && runtimeStart
      ? this.state.runtimeStartResultCollections[projectId]?.results.find((item) =>
        item.executionPlanId === plan.planId && item.runtimeStartId === runtimeStart.runtimeStartId
      )
      : undefined;
    const implementerRuntime = plan
      ? this.state.implementerRuntimeCollections[projectId]?.runtimes.find((item) => item.executionPlanId === plan.planId)
      : undefined;
    const implementerRuntimeResult = plan && implementerRuntime
      ? this.state.implementerRuntimeResultCollections[projectId]?.results.find((item) =>
        item.executionPlanId === plan.planId &&
        item.implementerRuntimeId === implementerRuntime.implementerRuntimeId &&
        item.status === "Completed"
      )
      : undefined;

    const existingRuntimes = this.state.reviewerRuntimeCollections[projectId]
      ?? createReviewerRuntimeCollection({ projectId, runtimes: [], rulesVersion: REVIEWER_RUNTIME_RULES_VERSION });
    const existingResults = this.state.reviewerRuntimeResultCollections[projectId]
      ?? createReviewerRuntimeResultCollection({ projectId, results: [], rulesVersion: REVIEWER_RUNTIME_RULES_VERSION });

    // Revalidation above can invalidate an Implementer Runtime that was
    // Completed when this attempt began (a stale plan/approval/preflight/
    // branch change). Report that plainly as a Blocked stale-chain result
    // rather than falling through to the service with a missing
    // implementerRuntime, which would misreport it as a malformed command.
    const implementerRuntimeStillValid = Boolean(
      implementerRuntime &&
      implementerRuntime.status === "Completed" &&
      implementerRuntime.implementerRuntimeId === priorImplementerRuntime.implementerRuntimeId,
    );
    if (!implementerRuntimeStillValid) {
      const staleResult = {
        id: `${projectId}:reviewer-runtime-result:${existingPlan.planId}:start-stale`,
        projectId,
        runtimeStartId: runtimeStart?.runtimeStartId,
        implementerRuntimeId: implementerRuntime?.implementerRuntimeId,
        status: "Blocked" as const,
        decision: "Unknown" as const,
        blockingFindingCount: 0,
        nonBlockingFindingCount: 0,
        reasonCodes: ["REVIEWER_RUNTIME_START_STALE" as const],
        started: false,
        duplicateActiveAttempt: false,
        agentStarted: false,
        implementerStarted: true as const,
        reviewerStarted: false,
        validationStarted: false as const,
        repositoryMutationStarted: false as const,
        githubMutationStarted: false as const,
        resultAt: new Date().toISOString(),
        rulesVersion: REVIEWER_RUNTIME_RULES_VERSION,
      };
      this.state.reviewerRuntimeResultCollections[projectId] =
        this.reviewerRuntimeService.upsertResult(existingResults, staleResult);
      return true;
    }

    const activeKey = implementerRuntime!.implementerRuntimeId;
    if (this.activeReviewerRuntimeKeys.has(activeKey)) {
      const blockedResult = {
        id: `${projectId}:reviewer-runtime-result:${activeKey}:active-block`,
        projectId,
        runtimeStartId: runtimeStart?.runtimeStartId,
        implementerRuntimeId: implementerRuntime?.implementerRuntimeId,
        status: "Blocked" as const,
        decision: "Unknown" as const,
        blockingFindingCount: 0,
        nonBlockingFindingCount: 0,
        reasonCodes: ["REVIEWER_RUNTIME_ALREADY_ACTIVE" as const],
        started: false,
        duplicateActiveAttempt: true,
        agentStarted: false,
        implementerStarted: true as const,
        reviewerStarted: false,
        validationStarted: false as const,
        repositoryMutationStarted: false as const,
        githubMutationStarted: false as const,
        resultAt: new Date().toISOString(),
        rulesVersion: REVIEWER_RUNTIME_RULES_VERSION,
      };
      this.state.reviewerRuntimeResultCollections[projectId] =
        this.reviewerRuntimeService.upsertResult(existingResults, blockedResult);
      return true;
    }

    const reviewTarget = plan && runtimeStart && implementerRuntime
      ? resolveReviewTarget(plan, runtimeStart, implementerRuntime)
      : undefined;
    if (reviewTarget) this.state.reviewTargets[projectId] = reviewTarget;

    this.activeReviewerRuntimeKeys.add(activeKey);
    try {
      const outcome = await this.reviewerRuntimeService.startReviewer({
        command: {
          projectId,
          runtimeStartId: runtimeStart?.runtimeStartId ?? "",
          executionPlanId: plan?.planId ?? existingPlan.planId,
          approvedImplementerAgent: REVIEWER_RUNTIME_APPROVED_IMPLEMENTER_AGENT,
          approvedReviewerAgent: REVIEWER_RUNTIME_APPROVED_REVIEWER_AGENT,
          startedBy: "Local Human",
          requestedAt: new Date().toISOString(),
        },
        executionPlan: plan,
        readiness,
        readinessResult,
        approval,
        preflight,
        preflightResult,
        runtimeStart,
        runtimeStartResult,
        implementerRuntime,
        implementerRuntimeResult,
        reviewTarget,
        existingRuntimes,
        existingResults,
      });

      if (outcome.runtimeCollection) {
        this.state.reviewerRuntimeCollections[projectId] = outcome.runtimeCollection;
      }
      this.state.reviewerRuntimeResultCollections[projectId] = outcome.resultCollection ?? existingResults;
    } finally {
      this.activeReviewerRuntimeKeys.delete(activeKey);
    }
    return true;
  }

  /**
   * Human-triggered only: reads the current chain and calls
   * ReviewDecisionService.promote, which itself revalidates the full chain
   * before writing a Review Promotion. Never invokes an Implementer/Reviewer
   * provider and never re-runs startReviewerRuntimeForPromotion -- Promote is
   * a decision recording action, not a re-review.
   */
  private promoteReviewForPromotion(projectId: string, candidateTaskId: string): boolean {
    this.state.reviewPromotionCollections ??= {};
    this.state.reviewPromotionResultCollections ??= {};

    const taskCollection = this.state.taskCollections[projectId];
    const promotedTask = taskCollection?.tasks.find((task) =>
      parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === candidateTaskId
    );
    if (!taskCollection || !promotedTask) return false;

    // Resolved via the same resolveCurrentExecutionPlan the dashboard uses
    // for reviewDecisionInput, so Promote can never act on a different plan
    // than the one the dashboard's classification was computed from (see
    // review.md, combined round 2 P2-001).
    const plan = resolveCurrentExecutionPlan(this.state.executionPlanCollections[projectId], {
      projectTaskId: promotedTask.id,
      candidateTaskId,
    });
    if (!plan) return false;

    const existingPromotions = this.state.reviewPromotionCollections[projectId]
      ?? createReviewPromotionCollection({ projectId, promotions: [], rulesVersion: REVIEW_PROMOTION_RULES_VERSION });
    const existingPromotionResults = this.state.reviewPromotionResultCollections[projectId]
      ?? createReviewPromotionResultCollection({ projectId, results: [], rulesVersion: REVIEW_PROMOTION_RULES_VERSION });

    const input = resolveReviewDecisionInput({
      projectId,
      plan,
      readinessCollection: this.state.executionReadinessCollections[projectId],
      readinessResultCollection: this.state.executionReadinessResultCollections[projectId],
      approvalCollection: this.state.humanExecutionApprovalCollections[projectId],
      preflightCollection: this.state.runtimePreflightCollections[projectId],
      preflightResultCollection: this.state.runtimePreflightResultCollections[projectId],
      runtimeStartCollection: this.state.runtimeStartCollections[projectId],
      runtimeStartResultCollection: this.state.runtimeStartResultCollections[projectId],
      implementerRuntimeCollection: this.state.implementerRuntimeCollections[projectId],
      implementerRuntimeResultCollection: this.state.implementerRuntimeResultCollections[projectId],
      reviewTarget: this.state.reviewTargets[projectId],
      reviewerRuntimeCollection: this.state.reviewerRuntimeCollections[projectId],
      reviewerRuntimeResultCollection: this.state.reviewerRuntimeResultCollections[projectId],
      existingPromotions,
      existingPromotionResults,
    });

    const outcome = this.reviewDecisionService.promote(input, {
      projectId,
      reviewerRuntimeId: input.reviewerRuntime?.reviewerRuntimeId ?? "",
      actor: "Local Human",
      requestedAt: new Date().toISOString(),
    });

    this.state.reviewPromotionCollections[projectId] = outcome.promotionCollection ?? existingPromotions;
    this.state.reviewPromotionResultCollections[projectId] = outcome.resultCollection ?? existingPromotionResults;
    return true;
  }


  /**
   * Human-triggered only: records a request to fix a concrete
   * ChangesRequested Reviewer Runtime. This mirrors Promote's resolver and
   * delegates all eligibility/idempotency checks to ReviewFixRequestService;
   * it never starts Validation Runtime, Codex, Claude, subprocesses,
   * repository mutation, or GitHub mutation.
   */
  private requestReviewFixForPromotion(projectId: string, candidateTaskId: string): boolean {
    this.state.reviewFixRequestCollections ??= {};
    this.state.reviewFixRequestResultCollections ??= {};

    const taskCollection = this.state.taskCollections[projectId];
    const promotedTask = taskCollection?.tasks.find((task) =>
      parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === candidateTaskId
    );
    if (!taskCollection || !promotedTask) return false;

    const plan = resolveCurrentExecutionPlan(this.state.executionPlanCollections[projectId], {
      projectTaskId: promotedTask.id,
      candidateTaskId,
    });
    if (!plan) return false;

    const existingFixRequests = this.state.reviewFixRequestCollections[projectId]
      ?? createReviewFixRequestCollection({ projectId, requests: [], rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION });
    const existingFixRequestResults = this.state.reviewFixRequestResultCollections[projectId]
      ?? createReviewFixRequestResultCollection({ projectId, results: [], rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION });

    const input = {
      ...resolveReviewDecisionInput({
        projectId,
        plan,
        readinessCollection: this.state.executionReadinessCollections[projectId],
        readinessResultCollection: this.state.executionReadinessResultCollections[projectId],
        approvalCollection: this.state.humanExecutionApprovalCollections[projectId],
        preflightCollection: this.state.runtimePreflightCollections[projectId],
        preflightResultCollection: this.state.runtimePreflightResultCollections[projectId],
        runtimeStartCollection: this.state.runtimeStartCollections[projectId],
        runtimeStartResultCollection: this.state.runtimeStartResultCollections[projectId],
        implementerRuntimeCollection: this.state.implementerRuntimeCollections[projectId],
        implementerRuntimeResultCollection: this.state.implementerRuntimeResultCollections[projectId],
        reviewTarget: this.state.reviewTargets[projectId],
        reviewerRuntimeCollection: this.state.reviewerRuntimeCollections[projectId],
        reviewerRuntimeResultCollection: this.state.reviewerRuntimeResultCollections[projectId],
      }),
      existingFixRequests,
      existingFixRequestResults,
    };

    const outcome = this.reviewFixRequestService.requestFix(input, {
      projectId,
      reviewerRuntimeId: input.reviewerRuntime?.reviewerRuntimeId ?? "",
      actor: "Local Human",
      requestedAt: new Date().toISOString(),
    });

    this.state.reviewFixRequestCollections[projectId] = outcome.requestCollection ?? existingFixRequests;
    this.state.reviewFixRequestResultCollections[projectId] = outcome.resultCollection ?? existingFixRequestResults;
    return true;
  }

  /**
   * Human-triggered only: records a provider-neutral plan for a current
   * Review Fix Request. It reuses the same Review Decision resolver as
   * requestReviewFixForPromotion and delegates command-time request
   * revalidation/idempotency to ReviewFixPlanService.
   */
  private planReviewFixForPromotion(projectId: string, candidateTaskId: string): boolean {
    this.state.reviewFixPlanCollections ??= {};
    this.state.reviewFixPlanResultCollections ??= {};

    const taskCollection = this.state.taskCollections[projectId];
    const promotedTask = taskCollection?.tasks.find((task) =>
      parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === candidateTaskId
    );
    if (!taskCollection || !promotedTask) return false;

    const plan = resolveCurrentExecutionPlan(this.state.executionPlanCollections[projectId], {
      projectTaskId: promotedTask.id,
      candidateTaskId,
    });
    if (!plan) return false;

    const existingFixRequests = this.state.reviewFixRequestCollections[projectId]
      ?? createReviewFixRequestCollection({ projectId, requests: [], rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION });
    const existingFixRequestResults = this.state.reviewFixRequestResultCollections[projectId]
      ?? createReviewFixRequestResultCollection({ projectId, results: [], rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION });
    const existingFixPlans = this.state.reviewFixPlanCollections[projectId]
      ?? createReviewFixPlanCollection({ projectId, plans: [], rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION });
    const existingFixPlanResults = this.state.reviewFixPlanResultCollections[projectId]
      ?? createReviewFixPlanResultCollection({ projectId, results: [], rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION });

    const reviewDecisionInput = resolveReviewDecisionInput({
      projectId,
      plan,
      readinessCollection: this.state.executionReadinessCollections[projectId],
      readinessResultCollection: this.state.executionReadinessResultCollections[projectId],
      approvalCollection: this.state.humanExecutionApprovalCollections[projectId],
      preflightCollection: this.state.runtimePreflightCollections[projectId],
      preflightResultCollection: this.state.runtimePreflightResultCollections[projectId],
      runtimeStartCollection: this.state.runtimeStartCollections[projectId],
      runtimeStartResultCollection: this.state.runtimeStartResultCollections[projectId],
      implementerRuntimeCollection: this.state.implementerRuntimeCollections[projectId],
      implementerRuntimeResultCollection: this.state.implementerRuntimeResultCollections[projectId],
      reviewTarget: this.state.reviewTargets[projectId],
      reviewerRuntimeCollection: this.state.reviewerRuntimeCollections[projectId],
      reviewerRuntimeResultCollection: this.state.reviewerRuntimeResultCollections[projectId],
    });
    const input = {
      ...reviewDecisionInput,
      existingFixRequests,
      existingFixRequestResults,
      existingFixPlans,
      existingFixPlanResults,
    };
    const classification = this.reviewDecisionService.classify(input);
    const currentRequest = findCurrentReviewFixRequest(input, classification);

    const outcome = this.reviewFixPlanService.planFix(input, {
      projectId,
      reviewFixRequestId: currentRequest?.reviewFixRequestId ?? "",
      actor: "Local Human",
      plannedAt: new Date().toISOString(),
    });

    this.state.reviewFixPlanCollections[projectId] = outcome.planCollection ?? existingFixPlans;
    this.state.reviewFixPlanResultCollections[projectId] = outcome.resultCollection ?? existingFixPlanResults;
    return true;
  }

  /**
   * Human-triggered only: starts one bounded Review Fix Runtime for the
   * current Review Fix Plan after the runtime service revalidates the whole
   * review-fix chain. This is deliberately downstream of Plan fixes (G) and
   * deliberately upstream of any future Validation Runtime or re-review.
   */
  private async startReviewFixRuntimeForPromotion(projectId: string, candidateTaskId: string): Promise<boolean> {
    this.state.reviewFixRuntimeCollections ??= {};
    this.state.reviewFixRuntimeResultCollections ??= {};

    const taskCollection = this.state.taskCollections[projectId];
    const promotedTask = taskCollection?.tasks.find((task) =>
      parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === candidateTaskId
    );
    if (!taskCollection || !promotedTask) return false;

    const plan = resolveCurrentExecutionPlan(this.state.executionPlanCollections[projectId], {
      projectTaskId: promotedTask.id,
      candidateTaskId,
    });
    if (!plan) return false;

    const existingFixRequests = this.state.reviewFixRequestCollections[projectId]
      ?? createReviewFixRequestCollection({ projectId, requests: [], rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION });
    const existingFixRequestResults = this.state.reviewFixRequestResultCollections[projectId]
      ?? createReviewFixRequestResultCollection({ projectId, results: [], rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION });
    const existingFixPlans = this.state.reviewFixPlanCollections[projectId]
      ?? createReviewFixPlanCollection({ projectId, plans: [], rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION });
    const existingFixPlanResults = this.state.reviewFixPlanResultCollections[projectId]
      ?? createReviewFixPlanResultCollection({ projectId, results: [], rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION });
    const existingFixRuntimes = this.state.reviewFixRuntimeCollections[projectId]
      ?? createReviewFixRuntimeCollection({ projectId, runtimes: [], rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION });
    const existingFixRuntimeResults = this.state.reviewFixRuntimeResultCollections[projectId]
      ?? createReviewFixRuntimeResultCollection({ projectId, results: [], rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION });

    const reviewDecisionInput = resolveReviewDecisionInput({
      projectId,
      plan,
      readinessCollection: this.state.executionReadinessCollections[projectId],
      readinessResultCollection: this.state.executionReadinessResultCollections[projectId],
      approvalCollection: this.state.humanExecutionApprovalCollections[projectId],
      preflightCollection: this.state.runtimePreflightCollections[projectId],
      preflightResultCollection: this.state.runtimePreflightResultCollections[projectId],
      runtimeStartCollection: this.state.runtimeStartCollections[projectId],
      runtimeStartResultCollection: this.state.runtimeStartResultCollections[projectId],
      implementerRuntimeCollection: this.state.implementerRuntimeCollections[projectId],
      implementerRuntimeResultCollection: this.state.implementerRuntimeResultCollections[projectId],
      reviewTarget: this.state.reviewTargets[projectId],
      reviewerRuntimeCollection: this.state.reviewerRuntimeCollections[projectId],
      reviewerRuntimeResultCollection: this.state.reviewerRuntimeResultCollections[projectId],
    });
    const input = {
      ...reviewDecisionInput,
      existingFixRequests,
      existingFixRequestResults,
      existingFixPlans,
      existingFixPlanResults,
      existingFixRuntimes,
      existingFixRuntimeResults,
    };
    const classification = this.reviewDecisionService.classify(input);
    const currentRequest = findCurrentReviewFixRequest(input, classification);
    const currentPlan = findCurrentReviewFixPlan(input, currentRequest);
    const activeKey = currentPlan?.reviewFixPlanId ?? `${projectId}:${candidateTaskId}`;
    if (this.activeReviewFixRuntimeKeys.has(activeKey)) return false;

    this.activeReviewFixRuntimeKeys.add(activeKey);
    try {
      const outcome = await this.reviewFixRuntimeService.startFixRuntime(input, {
        projectId,
        reviewFixPlanId: currentPlan?.reviewFixPlanId ?? "",
        actor: "Local Human",
        startedAt: new Date().toISOString(),
      });
      this.state.reviewFixRuntimeCollections[projectId] = outcome.runtimeCollection ?? existingFixRuntimes;
      this.state.reviewFixRuntimeResultCollections[projectId] = outcome.resultCollection ?? existingFixRuntimeResults;
      return true;
    } finally {
      this.activeReviewFixRuntimeKeys.delete(activeKey);
    }
  }

  /**
   * Human-triggered only: starts Validation Runtime for the exact completed
   * Review Fix Runtime after revalidating the whole review-fix chain. It
   * never creates a review target, starts a reviewer, promotes, or mutates
   * GitHub/repository publication state.
   */
  private async startValidationRuntimeForPromotion(projectId: string, candidateTaskId: string): Promise<boolean> {
    this.state.validationRuntimeCollections ??= {};
    this.state.validationRuntimeResultCollections ??= {};

    const taskCollection = this.state.taskCollections[projectId];
    const promotedTask = taskCollection?.tasks.find((task) =>
      parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === candidateTaskId
    );
    if (!taskCollection || !promotedTask) return false;

    const plan = resolveCurrentExecutionPlan(this.state.executionPlanCollections[projectId], {
      projectTaskId: promotedTask.id,
      candidateTaskId,
    });
    if (!plan) return false;

    const existingFixRequests = this.state.reviewFixRequestCollections[projectId]
      ?? createReviewFixRequestCollection({ projectId, requests: [], rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION });
    const existingFixRequestResults = this.state.reviewFixRequestResultCollections[projectId]
      ?? createReviewFixRequestResultCollection({ projectId, results: [], rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION });
    const existingFixPlans = this.state.reviewFixPlanCollections[projectId]
      ?? createReviewFixPlanCollection({ projectId, plans: [], rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION });
    const existingFixPlanResults = this.state.reviewFixPlanResultCollections[projectId]
      ?? createReviewFixPlanResultCollection({ projectId, results: [], rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION });
    const existingFixRuntimes = this.state.reviewFixRuntimeCollections[projectId]
      ?? createReviewFixRuntimeCollection({ projectId, runtimes: [], rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION });
    const existingFixRuntimeResults = this.state.reviewFixRuntimeResultCollections[projectId]
      ?? createReviewFixRuntimeResultCollection({ projectId, results: [], rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION });
    const existingValidationRuntimes = this.state.validationRuntimeCollections[projectId]
      ?? createValidationRuntimeCollection({ projectId, runtimes: [], rulesVersion: VALIDATION_RUNTIME_RULES_VERSION });
    const existingValidationRuntimeResults = this.state.validationRuntimeResultCollections[projectId]
      ?? createValidationRuntimeResultCollection({ projectId, results: [], rulesVersion: VALIDATION_RUNTIME_RULES_VERSION });

    const reviewDecisionInput = resolveReviewDecisionInput({
      projectId,
      plan,
      readinessCollection: this.state.executionReadinessCollections[projectId],
      readinessResultCollection: this.state.executionReadinessResultCollections[projectId],
      approvalCollection: this.state.humanExecutionApprovalCollections[projectId],
      preflightCollection: this.state.runtimePreflightCollections[projectId],
      preflightResultCollection: this.state.runtimePreflightResultCollections[projectId],
      runtimeStartCollection: this.state.runtimeStartCollections[projectId],
      runtimeStartResultCollection: this.state.runtimeStartResultCollections[projectId],
      implementerRuntimeCollection: this.state.implementerRuntimeCollections[projectId],
      implementerRuntimeResultCollection: this.state.implementerRuntimeResultCollections[projectId],
      reviewTarget: this.state.reviewTargets[projectId],
      reviewerRuntimeCollection: this.state.reviewerRuntimeCollections[projectId],
      reviewerRuntimeResultCollection: this.state.reviewerRuntimeResultCollections[projectId],
    });
    const input = {
      ...reviewDecisionInput,
      existingFixRequests,
      existingFixRequestResults,
      existingFixPlans,
      existingFixPlanResults,
      existingFixRuntimes,
      existingFixRuntimeResults,
      existingValidationRuntimes,
      existingValidationRuntimeResults,
    };
    const classification = this.reviewDecisionService.classify(input);
    const currentRequest = findCurrentReviewFixRequest(input, classification);
    const currentPlan = findCurrentReviewFixPlan(input, currentRequest);
    const currentRuntime = findCurrentReviewFixRuntime(input, currentPlan);
    const activeKey = currentRuntime?.reviewFixRuntimeId ?? `${projectId}:${candidateTaskId}`;
    if (this.activeValidationRuntimeKeys.has(activeKey)) return false;

    this.activeValidationRuntimeKeys.add(activeKey);
    try {
      const outcome = await this.validationRuntimeService.startValidation(input, {
        projectId,
        reviewFixRuntimeId: currentRuntime?.reviewFixRuntimeId ?? "",
        actor: "Local Human",
        startedAt: new Date().toISOString(),
      });
      this.state.validationRuntimeCollections[projectId] = outcome.runtimeCollection ?? existingValidationRuntimes;
      this.state.validationRuntimeResultCollections[projectId] = outcome.resultCollection ?? existingValidationRuntimeResults;
      return true;
    } finally {
      this.activeValidationRuntimeKeys.delete(activeKey);
    }
  }

  private preparePostValidationReviewTargetForPromotion(projectId: string, candidateTaskId: string): boolean {
    const context = this.resolvePostValidationContext(projectId, candidateTaskId);
    if (!context) return false;
    const { input, existingPostValidationReviewTargets, existingPostValidationReviewTargetResults, currentValidationRuntime } = context;
    const outcome = this.postValidationReviewTargetService.prepareTarget(input, {
      projectId,
      validationRuntimeId: currentValidationRuntime?.validationRuntimeId ?? "",
      actor: "Local Human",
      requestedAt: new Date().toISOString(),
    });
    this.state.postValidationReviewTargetCollections[projectId] =
      outcome.targetCollection ?? existingPostValidationReviewTargets;
    this.state.postValidationReviewTargetResultCollections[projectId] =
      outcome.resultCollection ?? existingPostValidationReviewTargetResults;
    return true;
  }

  private async startPostValidationReviewForPromotion(projectId: string, candidateTaskId: string): Promise<boolean> {
    const context = this.resolvePostValidationContext(projectId, candidateTaskId);
    if (!context) return false;
    const currentTarget = findCurrentPostValidationReviewTarget(
      context.input.existingPostValidationReviewTargets,
      context.currentValidationRuntime,
    );
    if (!currentTarget) return false;
    const activeKey = currentTarget.reviewTargetId;
    if (this.activePostValidationReviewKeys.has(activeKey)) return false;

    const existingReviewerRuntimes = this.state.reviewerRuntimeCollections[projectId]
      ?? createReviewerRuntimeCollection({ projectId, runtimes: [], rulesVersion: REVIEWER_RUNTIME_RULES_VERSION });
    const existingReviewerResults = this.state.reviewerRuntimeResultCollections[projectId]
      ?? createReviewerRuntimeResultCollection({ projectId, results: [], rulesVersion: REVIEWER_RUNTIME_RULES_VERSION });

    this.activePostValidationReviewKeys.add(activeKey);
    try {
      const outcome = await this.reviewerRuntimeService.startReviewer({
        command: {
          projectId,
          runtimeStartId: context.plan.runtimeStartId,
          executionPlanId: context.plan.planId,
          approvedImplementerAgent: REVIEWER_RUNTIME_APPROVED_IMPLEMENTER_AGENT,
          approvedReviewerAgent: REVIEWER_RUNTIME_APPROVED_REVIEWER_AGENT,
          startedBy: "Local Human",
          requestedAt: new Date().toISOString(),
        },
        executionPlan: context.executionPlan,
        readiness: context.reviewDecisionInput.readiness,
        readinessResult: context.reviewDecisionInput.readinessResult,
        approval: context.reviewDecisionInput.approval,
        preflight: context.reviewDecisionInput.preflight,
        preflightResult: context.reviewDecisionInput.preflightResult,
        runtimeStart: context.reviewDecisionInput.runtimeStart,
        runtimeStartResult: context.reviewDecisionInput.runtimeStartResult,
        implementerRuntime: context.reviewDecisionInput.implementerRuntime,
        implementerRuntimeResult: context.reviewDecisionInput.implementerRuntimeResult,
        reviewTarget: currentTarget,
        existingRuntimes: existingReviewerRuntimes,
        existingResults: existingReviewerResults,
      });
      this.state.reviewTargets[projectId] = currentTarget;
      this.state.reviewerRuntimeCollections[projectId] = outcome.runtimeCollection ?? existingReviewerRuntimes;
      this.state.reviewerRuntimeResultCollections[projectId] = outcome.resultCollection ?? existingReviewerResults;
      return true;
    } finally {
      this.activePostValidationReviewKeys.delete(activeKey);
    }
  }

  private resolvePostValidationContext(projectId: string, candidateTaskId: string) {
    this.state.reviewTargets ??= {};
    this.state.postValidationReviewTargetCollections ??= {};
    this.state.postValidationReviewTargetResultCollections ??= {};

    const taskCollection = this.state.taskCollections[projectId];
    const promotedTask = taskCollection?.tasks.find((task) =>
      parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === candidateTaskId
    );
    if (!taskCollection || !promotedTask) return undefined;

    const executionPlan = resolveCurrentExecutionPlan(this.state.executionPlanCollections[projectId], {
      projectTaskId: promotedTask.id,
      candidateTaskId,
    });
    if (!executionPlan) return undefined;

    const existingFixRequests = this.state.reviewFixRequestCollections[projectId]
      ?? createReviewFixRequestCollection({ projectId, requests: [], rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION });
    const existingFixRequestResults = this.state.reviewFixRequestResultCollections[projectId]
      ?? createReviewFixRequestResultCollection({ projectId, results: [], rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION });
    const existingFixPlans = this.state.reviewFixPlanCollections[projectId]
      ?? createReviewFixPlanCollection({ projectId, plans: [], rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION });
    const existingFixPlanResults = this.state.reviewFixPlanResultCollections[projectId]
      ?? createReviewFixPlanResultCollection({ projectId, results: [], rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION });
    const existingFixRuntimes = this.state.reviewFixRuntimeCollections[projectId]
      ?? createReviewFixRuntimeCollection({ projectId, runtimes: [], rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION });
    const existingFixRuntimeResults = this.state.reviewFixRuntimeResultCollections[projectId]
      ?? createReviewFixRuntimeResultCollection({ projectId, results: [], rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION });
    const existingValidationRuntimes = this.state.validationRuntimeCollections[projectId]
      ?? createValidationRuntimeCollection({ projectId, runtimes: [], rulesVersion: VALIDATION_RUNTIME_RULES_VERSION });
    const existingValidationRuntimeResults = this.state.validationRuntimeResultCollections[projectId]
      ?? createValidationRuntimeResultCollection({ projectId, results: [], rulesVersion: VALIDATION_RUNTIME_RULES_VERSION });
    const existingPostValidationReviewTargets = this.state.postValidationReviewTargetCollections[projectId]
      ?? createPostValidationReviewTargetCollection({ projectId, targets: [], rulesVersion: POST_VALIDATION_REVIEW_TARGET_RULES_VERSION });
    const existingPostValidationReviewTargetResults = this.state.postValidationReviewTargetResultCollections[projectId]
      ?? createPostValidationReviewTargetResultCollection({ projectId, results: [], rulesVersion: POST_VALIDATION_REVIEW_TARGET_RULES_VERSION });

    const reviewDecisionInput = resolveReviewDecisionInput({
      projectId,
      plan: executionPlan,
      readinessCollection: this.state.executionReadinessCollections[projectId],
      readinessResultCollection: this.state.executionReadinessResultCollections[projectId],
      approvalCollection: this.state.humanExecutionApprovalCollections[projectId],
      preflightCollection: this.state.runtimePreflightCollections[projectId],
      preflightResultCollection: this.state.runtimePreflightResultCollections[projectId],
      runtimeStartCollection: this.state.runtimeStartCollections[projectId],
      runtimeStartResultCollection: this.state.runtimeStartResultCollections[projectId],
      implementerRuntimeCollection: this.state.implementerRuntimeCollections[projectId],
      implementerRuntimeResultCollection: this.state.implementerRuntimeResultCollections[projectId],
      reviewTarget: this.state.reviewTargets[projectId],
      reviewerRuntimeCollection: this.state.reviewerRuntimeCollections[projectId],
      reviewerRuntimeResultCollection: this.state.reviewerRuntimeResultCollections[projectId],
    });
    const input = {
      ...reviewDecisionInput,
      existingFixRequests,
      existingFixRequestResults,
      existingFixPlans,
      existingFixPlanResults,
      existingFixRuntimes,
      existingFixRuntimeResults,
      existingValidationRuntimes,
      existingValidationRuntimeResults,
      existingPostValidationReviewTargets,
      existingPostValidationReviewTargetResults,
    };
    const classification = this.reviewDecisionService.classify(input);
    const currentRequest = findCurrentReviewFixRequest(input, classification)
      ?? existingFixRequests.requests.find((request) =>
        request.projectId === projectId && request.candidateTaskId === candidateTaskId
      );
    const currentPlan = findCurrentReviewFixPlan(input, currentRequest);
    const currentRuntime = findCurrentReviewFixRuntime(input, currentPlan);
    const currentValidationRuntime = findCurrentValidationRuntime(input, currentRuntime);
    if (!currentPlan || !currentRuntime || !currentValidationRuntime) return undefined;

    return {
      executionPlan,
      plan: currentPlan,
      input,
      reviewDecisionInput,
      currentValidationRuntime,
      existingPostValidationReviewTargets,
      existingPostValidationReviewTargetResults,
    };
  }

  private clearRuntimePreflightForProject(projectId: string) {
    if (this.state.runtimePreflightCollections) delete this.state.runtimePreflightCollections[projectId];
    if (this.state.runtimePreflightResultCollections) delete this.state.runtimePreflightResultCollections[projectId];
    if (this.state.runtimeStartCollections) delete this.state.runtimeStartCollections[projectId];
    if (this.state.runtimeStartResultCollections) delete this.state.runtimeStartResultCollections[projectId];
    if (this.state.implementerRuntimeCollections) delete this.state.implementerRuntimeCollections[projectId];
    if (this.state.implementerRuntimeResultCollections) delete this.state.implementerRuntimeResultCollections[projectId];
    if (this.state.reviewTargets) delete this.state.reviewTargets[projectId];
    if (this.state.reviewerRuntimeCollections) delete this.state.reviewerRuntimeCollections[projectId];
    if (this.state.reviewerRuntimeResultCollections) delete this.state.reviewerRuntimeResultCollections[projectId];
    // Per spec.md FR-011: revalidation invalidates the derived chain above,
    // but a recorded Review Promotion is an immutable historical decision
    // record and must never be deleted by upstream invalidation. Staleness
    // is expressed instead via ReviewDecisionService.classify -> "Stale".
  }

  private revalidateExecutionPlanForPromotion(projectId: string, projectTaskId: string, activeSessionId: string) {
    this.executionPlanService ??= new ExecutionPlanService();

    const taskCollection = this.state.taskCollections[projectId];
    const project = this.state.projects.find((item) => item.id === projectId);
    const repositoryIdentity = project?.repositoryIdentity;
    const repositorySnapshot = this.state.repositorySyncSnapshots[projectId];
    const repositoryContext = createExecutionPlanRepositoryContext(project, repositorySnapshot);
    const existingPlans = this.state.executionPlanCollections[projectId]
      ?? createExecutionPlanCollection({ projectId, plans: [], rulesVersion: "plan-v1" });
    const outcome = this.executionPlanService.createPlan({
      request: {
        projectId,
        projectTaskId,
        activeSessionId,
        requestedAt: new Date().toISOString(),
      },
      featureId: EXECUTION_PLAN_FEATURE_ID,
      taskCollection,
      confirmedAssignments: this.state.confirmedEmployeeAssignmentRecords,
      preparedSessions: this.state.preparedWorkSessionRecords,
      activeSessions: this.state.workSessions,
      employees: this.state.employees,
      repositoryIdentity,
      repositorySnapshot,
      repositoryContext,
      roleContext: {
        implementerAgent: "Implementer",
        reviewerAgent: "Reviewer",
        validationCommands: EXECUTION_PLAN_VALIDATION_COMMANDS,
        allowedMutationScope: EXECUTION_PLAN_ALLOWED_MUTATION_SCOPE,
      },
      pathChecks: {
        worktreeExists: Boolean(repositoryContext?.worktreePath),
        specExists: Boolean(repositoryContext?.specPath),
      },
      existingPlans,
    });

    if (outcome.planCollection && outcome.result.status === "Created") {
      this.state.executionPlanCollections[projectId] = outcome.planCollection;
    }
    const existingResults = this.state.executionPlanResultCollections[projectId];
    this.state.executionPlanResultCollections[projectId] =
      this.executionPlanService.upsertResult(existingResults, outcome.result);
    return outcome.result.status === "AlreadyExists" ? outcome.plan : undefined;
  }

  private createExecutionPlanForPromotion(projectId: string, candidateTaskId: string) {
    this.executionPlanService ??= new ExecutionPlanService();
    this.state.executionPlanCollections ??= {};
    this.state.executionPlanResultCollections ??= {};

    const taskCollection = this.state.taskCollections[projectId];
    const promotedTask = taskCollection?.tasks.find((task) =>
      parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === candidateTaskId
    );
    if (!taskCollection || !promotedTask) return false;

    const activeSession = (this.state.workSessions[promotedTask.id] ?? [])
      .find((session) => session.projectId === projectId && session.taskId === promotedTask.id);
    if (!activeSession) return false;

    const project = this.state.projects.find((item) => item.id === projectId);
    const repositoryIdentity = project?.repositoryIdentity;
    const repositorySnapshot = this.state.repositorySyncSnapshots[projectId];
    const repositoryContext = createExecutionPlanRepositoryContext(project, repositorySnapshot);
    if (!repositoryIdentity || !repositorySnapshot || !repositoryContext) {
      return false;
    }

    const existingPlans = this.state.executionPlanCollections[projectId]
      ?? createExecutionPlanCollection({ projectId, plans: [], rulesVersion: "plan-v1" });
    const outcome = this.executionPlanService.createPlan({
      request: {
        projectId,
        projectTaskId: promotedTask.id,
        activeSessionId: activeSession.id,
        requestedAt: new Date().toISOString(),
      },
      featureId: EXECUTION_PLAN_FEATURE_ID,
      taskCollection,
      confirmedAssignments: this.state.confirmedEmployeeAssignmentRecords,
      preparedSessions: this.state.preparedWorkSessionRecords,
      activeSessions: this.state.workSessions,
      employees: this.state.employees,
      repositoryIdentity,
      repositorySnapshot,
      repositoryContext,
      roleContext: {
        implementerAgent: "Implementer",
        reviewerAgent: "Reviewer",
        validationCommands: EXECUTION_PLAN_VALIDATION_COMMANDS,
        allowedMutationScope: EXECUTION_PLAN_ALLOWED_MUTATION_SCOPE,
      },
      pathChecks: {
        worktreeExists: Boolean(repositoryContext.worktreePath),
        specExists: Boolean(repositoryContext.specPath),
      },
      existingPlans,
    });

    if (outcome.planCollection && outcome.result.status === "Created") {
      this.state.executionPlanCollections[projectId] = outcome.planCollection;
    }

    const existingResults = this.state.executionPlanResultCollections[projectId];
    this.state.executionPlanResultCollections[projectId] =
      this.executionPlanService.upsertResult(existingResults, outcome.result);
    return true;
  }

  private moveCandidatePromotionSelection(direction: number) {
    const projectId = this.state.selectedProjectDashboardProjectId;
    const collection = projectId ? this.state.candidatePromotionReviewCollections[projectId] : undefined;
    if (!collection || collection.reviews.length === 0) return;

    this.state.selectedCandidatePromotionIndex = clamp(
      this.state.selectedCandidatePromotionIndex + direction,
      0,
      collection.reviews.length - 1,
    );
    this.refreshCandidatePromotionsForProject(collection.projectId);
  }

  private getSelectedCandidatePromotionReview() {
    const projectId = this.state.selectedProjectDashboardProjectId;
    const collection = projectId ? this.state.candidatePromotionReviewCollections[projectId] : undefined;
    return collection?.reviews[this.state.selectedCandidatePromotionIndex];
  }

  private getSelectedCandidateDetailPromotionReview() {
    const projectId = this.state.selectedProjectDashboardProjectId;
    const candidateTaskId = this.state.selectedCandidateTaskId;
    const candidateTaskCollection = projectId ? this.state.candidateTaskCollections[projectId] : undefined;
    const collection = projectId ? this.state.candidatePromotionReviewCollections[projectId] : undefined;
    if (!candidateTaskId) return undefined;
    if (!candidateTaskCollection?.tasks.some((task) => task.id === candidateTaskId)) return undefined;
    return collection?.reviews.find((review) => review.candidateTaskId === candidateTaskId);
  }

  private openSelectedCandidateDetail(candidateTaskId: string) {
    const projectId = this.state.selectedProjectDashboardProjectId;
    const collection = projectId ? this.state.candidateTaskCollections[projectId] : undefined;
    if (!projectId || !candidateTaskId || !collection) return false;

    const candidateTask = collection.tasks.find((task) => task.id === candidateTaskId);
    if (!candidateTask) return false;

    this.state.selectedCandidateTaskId = candidateTask.id;
    this.state.viewMode = "candidate-detail";
    return true;
  }

  private moveProjectDashboardActiveWorkSelection(direction: number) {
    const workItemCount = this.getVisibleProjectDashboardActiveWorkIds().length;
    if (workItemCount === 0) {
      this.state.selectedProjectDashboardActiveWorkIndex = 0;
      return false;
    }

    const nextIndex = clamp(
      this.state.selectedProjectDashboardActiveWorkIndex + direction,
      0,
      workItemCount - 1,
    );
    const changed = nextIndex !== this.state.selectedProjectDashboardActiveWorkIndex;
    this.state.selectedProjectDashboardActiveWorkIndex = nextIndex;
    return changed;
  }

  private openSelectedProjectDashboardActiveWorkTask() {
    const projectId = this.state.selectedProjectDashboardProjectId;
    const activeWorkIds = this.getVisibleProjectDashboardActiveWorkIds();
    const activeWorkId = activeWorkIds[this.state.selectedProjectDashboardActiveWorkIndex];
    const collection = projectId ? this.state.taskCollections[projectId] : undefined;
    if (!projectId || !activeWorkId || !collection) return false;

    const taskIndex = collection.tasks.findIndex((task) => task.id === activeWorkId);
    if (taskIndex < 0) return false;

    this.state.selectedTaskProjectId = projectId;
    this.state.selectedTaskIndex = taskIndex;
    this.state.selectedTaskId = activeWorkId;
    this.state.viewMode = "task-detail";
    return true;
  }

  private getVisibleProjectDashboardActiveWorkIds() {
    return this.state.projectDashboardSnapshot?.activeWork.slice(0, 3).map((workItem) => workItem.id) ?? [];
  }

  private clampProjectDashboardActiveWorkSelection() {
    const workItemCount = this.getVisibleProjectDashboardActiveWorkIds().length;
    this.state.selectedProjectDashboardActiveWorkIndex = workItemCount === 0
      ? 0
      : clamp(this.state.selectedProjectDashboardActiveWorkIndex, 0, workItemCount - 1);
  }

  private async openTaskList(projectId: string) {
    this.state.selectedTaskProjectId = projectId;
    this.state.selectedTaskId = undefined;
    this.state.selectedTaskIndex = 0;
    this.state.viewMode = "task-list";

    const existingCollection = this.state.taskCollections[projectId];
    if (existingCollection) {
      this.state.selectedTaskIndex = clamp(this.state.selectedTaskIndex, 0, Math.max(existingCollection.tasks.length - 1, 0));
      this.state.selectedTaskId = existingCollection.tasks[this.state.selectedTaskIndex]?.id;
      void this.prepareTaskAnalyses(existingCollection.tasks, projectId);
      void this.prepareSelectedEmployeeRecommendation();
      void this.prepareProjectManagementSuggestion(projectId);
      this.view.render(this.state);
      return;
    }

    this.view.render(this.state);

    const requestVersion = this.taskRequestVersion + 1;
    this.taskRequestVersion = requestVersion;

    const collection = await this.taskService.getTaskCollection(projectId);
    if (!this.shouldApplyTaskCollection(projectId, requestVersion)) return;

    this.state.taskCollections[projectId] = collection;
    this.state.selectedTaskIndex = clamp(this.state.selectedTaskIndex, 0, Math.max(collection.tasks.length - 1, 0));
    this.state.selectedTaskId = collection.tasks[this.state.selectedTaskIndex]?.id;
    this.persistBrowserOfficeSession();
    void this.prepareTaskAnalyses(collection.tasks, projectId);
    void this.prepareSelectedEmployeeRecommendation();
    void this.prepareProjectManagementSuggestion(projectId);
    this.view.render(this.state);
  }

  private openProjectBacklog(projectId: string) {
    this.state.selectedBacklogProjectId = projectId;
    this.state.selectedBacklogTaskIndex = 0;
    const collection = this.projectBacklogService.getOrderedCollection(this.state.projectBacklogCollections, projectId);
    this.state.projectBacklogCollections[projectId] = collection;
    this.state.selectedBacklogTaskId = collection.tasks[0]?.id;
    this.state.selectedBacklogSuggestionId = this.state.projectBacklogSuggestionCollections[projectId]?.candidates
      .find((candidate) => candidate.status === "proposed")?.id;
    this.state.selectedBacklogPriorityIndex = 1;
    this.state.selectedBacklogStatusIndex = 0;
    this.state.viewMode = "project-backlog";
    this.view.render(this.state);
    void this.reevaluateSelectedProjectAutonomy();
  }

  private async openEmployeeSelection() {
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    const task = this.getSelectedTask();
    if (!projectId || !task) return;

    this.state.selectedTaskId = task.id;
    this.state.selectedEmployeeIndex = clamp(this.state.selectedEmployeeIndex, 0, Math.max(this.state.employees.length - 1, 0));
    this.state.viewMode = "employee-selection";
    this.view.render(this.state);

    if (this.state.employees.length > 0) return;

    const requestVersion = this.employeeRequestVersion + 1;
    this.employeeRequestVersion = requestVersion;

    const employees = await this.employeeService.getEmployees();
    if (!this.shouldApplyEmployees(projectId, task.id, requestVersion)) return;

    this.state.employees = employees;
    this.refreshEmployeeSimulationSnapshots();
    this.state.selectedEmployeeIndex = clamp(this.state.selectedEmployeeIndex, 0, Math.max(employees.length - 1, 0));
    this.persistBrowserOfficeSession();
    void this.prepareSelectedEmployeeRecommendation();
    void this.prepareProjectManagementSuggestion(projectId);
    this.view.render(this.state);
  }

  private shouldApplyRepositorySummary(projectId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      this.state.viewMode === "repository-detail" &&
      this.state.selectedRepositoryProjectId === projectId &&
      this.repositoryRequestVersion === requestVersion
    );
  }

  private shouldApplyTaskCollection(projectId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      (this.state.viewMode === "task-list" || this.state.viewMode === "task-detail") &&
      this.state.selectedTaskProjectId === projectId &&
      this.taskRequestVersion === requestVersion
    );
  }

  private shouldApplyProjectDashboardTaskCollection(projectId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      this.state.viewMode === "project-dashboard" &&
      this.state.selectedProjectDashboardProjectId === projectId &&
      this.taskRequestVersion === requestVersion
    );
  }

  private shouldApplyProjectDashboardRepositorySummary(projectId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      this.state.viewMode === "project-dashboard" &&
      this.state.selectedProjectDashboardProjectId === projectId &&
      this.repositoryRequestVersion === requestVersion
    );
  }

  private shouldApplyRepositorySyncSnapshot(projectId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      this.state.viewMode === "project-dashboard" &&
      this.state.selectedProjectDashboardProjectId === projectId &&
      this.repositorySyncRequestVersion === requestVersion
    );
  }

  private shouldApplyIssueSyncCollection(projectId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      this.state.viewMode === "project-dashboard" &&
      this.state.selectedProjectDashboardProjectId === projectId &&
      this.issueSyncRequestVersion === requestVersion
    );
  }

  private shouldApplyEmployees(projectId: string, taskId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      this.state.viewMode === "employee-selection" &&
      this.state.selectedTaskProjectId === projectId &&
      this.state.selectedTaskId === taskId &&
      this.employeeRequestVersion === requestVersion
    );
  }

  private async recruitFifthEmployee() {
    if (this.state.employees.length === 0) {
      const requestVersion = this.employeeRequestVersion + 1;
      this.employeeRequestVersion = requestVersion;

      const loadedEmployees = await this.employeeService.getEmployees();
      if (!this.shouldApplyFifthEmployeeRecruitment(requestVersion)) return false;

      this.state.employees = loadedEmployees;
    }

    const outcome = this.employeeRecruitmentService.recruitFifthEmployee(this.state.employees);
    this.state.fifthEmployeeRecruitmentResult = outcome.result;

    if (outcome.result.status !== "recruited") {
      return true;
    }

    this.state.employees = outcome.employees;
    this.refreshCandidateAssignmentsForSelectedProject();
    this.refreshEmployeeSimulationSnapshots();
    this.refreshCompanyDashboardSnapshot();
    this.persistBrowserOfficeSession();
    return true;
  }

  private shouldApplyFifthEmployeeRecruitment(requestVersion: number) {
    return (
      this.state.isOpen &&
      this.state.viewMode === "list" &&
      this.state.selectedProjectIndex === -2 &&
      this.employeeRequestVersion === requestVersion
    );
  }

  private assignSelectedEmployeeToSelectedTask() {
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    const collection = projectId ? this.state.taskCollections[projectId] : undefined;
    const task = collection?.tasks[this.state.selectedTaskIndex];
    const employee = this.state.employees[this.state.selectedEmployeeIndex];
    if (!projectId || !collection || !task || !employee) return;

    const previousAssigneeId = task.assigneeId;
    const assignedAt = new Date().toISOString();
    const activity = {
      id: `${task.id}-employee-assigned-${Date.now()}`,
      taskId: task.id,
      type: "employee_assigned" as const,
      message: `${employee.name} assigned to task`,
      createdAt: assignedAt,
      actorId: employee.id,
      actorName: employee.name,
    };
    const updatedTask = {
      ...task,
      assignee: employee.name,
      assigneeId: employee.id,
      updatedAt: assignedAt,
      activityLog: [activity, ...(task.activityLog ?? [])],
    };

    this.state.taskCollections[projectId] = {
      ...collection,
      tasks: collection.tasks.map((item) => (item.id === task.id ? updatedTask : item)),
    };
    const previousAssignment = previousAssigneeId && previousAssigneeId !== employee.id
      ? this.findLoadedAssignmentForEmployee(previousAssigneeId)
      : undefined;
    this.state.employees = this.state.employees.map((item) => {
      if (item.id === employee.id) {
        return {
          ...item,
          status: "Working" as const,
          assignedTaskId: task.id,
          currentProjectId: projectId,
        };
      }

      if (item.id === previousAssigneeId && !previousAssignment) {
        return {
          ...item,
          status: "Idle" as const,
          assignedTaskId: undefined,
          currentProjectId: undefined,
        };
      }

      if (item.id === previousAssigneeId && previousAssignment) {
        return {
          ...item,
          status: "Working" as const,
          assignedTaskId: previousAssignment.taskId,
          currentProjectId: previousAssignment.projectId,
        };
      }

      return item;
    });
    this.state.employeeAssignments = {
      ...this.state.employeeAssignments,
      [task.id]: employee.id,
    };
    this.refreshEmployeeSimulationSnapshotsForTaskAssigned();
    this.state.selectedTaskId = task.id;
    this.state.viewMode = "task-detail";
    this.persistBrowserOfficeSession();
    void this.prepareProjectManagementSuggestion(projectId);
    this.view.render(this.state);
  }

  private async startPlaceholderWorkOnSelectedTask() {
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    const task = this.getSelectedTask();
    if (!projectId || !task?.assignee || task.status === "Done") return;

    const employee = task.assigneeId
      ? this.state.employees.find((item) => item.id === task.assigneeId)
      : this.state.employees.find((item) => item.name === task.assignee);
    const employeeId = employee?.id ?? task.assigneeId ?? task.assignee;
    const employeeName = employee?.name ?? task.assignee;
    const startedAt = new Date().toISOString();
    const workSession = await this.workSessionService.createWorkSession({
      taskId: task.id,
      projectId,
      employeeId,
      employeeName,
      startedAt,
    });
    const activityMessage = await this.aiService.generateActivityMessage({
      type: "work_started",
      taskTitle: task.title,
      employeeName,
      workSessionId: workSession.id,
      status: workSession.status,
      provider: workSession.provider,
    });

    if (!this.shouldApplyStartedWorkSession(projectId, task.id)) return;

    const activityId = `${task.id}-work-started-${Date.now()}`;
    const workSessionWithActivity = {
      ...workSession,
      activityIds: [activityId, ...(workSession.activityIds ?? [])],
    };
    const updatedTask = this.appendTaskActivity(task, {
      id: activityId,
      taskId: task.id,
      type: "work_started" as const,
      message: activityMessage.message,
      createdAt: startedAt,
      actorId: employeeId,
      actorName: employeeName,
    }, startedAt);

    this.state.workSessions[task.id] = [workSessionWithActivity, ...(this.state.workSessions[task.id] ?? [])];
    this.state.selectedWorkSessionId = workSessionWithActivity.id;
    this.refreshEmployeeSimulationSnapshotsForWorkStarted();
    this.updateSelectedTask({
      ...updatedTask,
      status: task.status === "Todo" ? "In Progress" : task.status,
    });
    this.persistBrowserOfficeSession();
    void this.prepareProjectManagementSuggestion(projectId);
    this.view.render(this.state);
  }

  private shouldApplyStartedWorkSession(projectId: string, taskId: string) {
    return (
      this.state.isOpen &&
      this.state.viewMode === "task-detail" &&
      this.state.selectedTaskProjectId === projectId &&
      this.state.selectedTaskId === taskId
    );
  }

  private moveSelectedTaskToReview() {
    const task = this.getSelectedTask();
    if (!task || task.status !== "In Progress") return;

    this.moveSelectedTaskStatus("Review", "Task moved to review", "moved-to-review");
  }

  private markSelectedTaskDone() {
    const task = this.getSelectedTask();
    if (!task || task.status !== "Review") return;

    const previousProgression = this.getCompanyProgressionSnapshot();
    const updatedTask = this.moveSelectedTaskStatus("Done", "Task marked done", "marked-done");
    if (!updatedTask) return;

    this.refreshTaskCompletionProgressionFeedback(updatedTask, previousProgression);
    const assigneeEmployeeId = this.getTaskAssigneeEmployeeId(task);
    if (assigneeEmployeeId) {
      this.releaseEmployeeIfUnassigned(assigneeEmployeeId, task.id);
      this.refreshEmployeeSimulationSnapshotsForWorkCompleted();
      this.persistBrowserOfficeSession();
      this.view.render(this.state);
    }
  }

  private moveSelectedTaskStatus(nextStatus: TaskStatus, message: string, activityIdLabel: string) {
    const task = this.getSelectedTask();
    if (!task) return undefined;

    const changedAt = new Date().toISOString();
    const updatedTask = this.appendTaskActivity(task, {
      id: `${task.id}-${activityIdLabel}-${Date.now()}`,
      taskId: task.id,
      type: "status_changed" as const,
      message,
      createdAt: changedAt,
    }, changedAt);

    this.updateSelectedTask({
      ...updatedTask,
      status: nextStatus,
    });
    this.persistBrowserOfficeSession();
    void this.prepareProjectManagementSuggestion(task.projectId);
    this.view.render(this.state);
    return { ...updatedTask, status: nextStatus };
  }

  private refreshTaskCompletionProgressionFeedback(
    task: ProjectTask,
    previousProgression: CompanyProgressionSnapshot,
  ) {
    const currentProgression = this.getCompanyProgressionSnapshot();
    const reachedSnapshots = this.companyProgressionService.getReachedProgressionMetadata(this.getCompanyProgressionInput());
    const triggers = this.companyProgressionTriggerService.evaluateLevelTriggers({
      previousSnapshot: previousProgression,
      currentSnapshot: currentProgression,
      reachedSnapshots,
    });

    this.state.companyProgressionTriggers = triggers.map(copyCompanyProgressionTrigger);
    this.state.previousCompanyProgressionSnapshot = currentProgression;
    this.refreshReceptionDeskUpgradeBenefits(currentProgression);
    this.state.taskCompletionProgressionFeedback = createTaskCompletionProgressionFeedback({
      task,
      completedAt: task.updatedAt,
      previousProgression,
      currentProgression,
      nextProgression: this.companyProgressionService.getFutureProgressionMetadata(this.getCompanyProgressionInput())[0],
    });
  }

  private updateSelectedTask(updatedTask: ProjectTask) {
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    const collection = projectId ? this.state.taskCollections[projectId] : undefined;
    if (!projectId || !collection) return;

    this.state.taskCollections[projectId] = {
      ...collection,
      tasks: collection.tasks.map((item) => (item.id === updatedTask.id ? updatedTask : item)),
    };
    this.state.selectedTaskId = updatedTask.id;
  }

  private appendTaskActivity(task: ProjectTask, activity: NonNullable<ProjectTask["activityLog"]>[number], updatedAt: string) {
    return {
      ...task,
      updatedAt,
      activityLog: [activity, ...(task.activityLog ?? [])],
    };
  }

  private releaseEmployeeIfUnassigned(employeeId: string, completedTaskId: string) {
    const remainingAssignment = this.findLoadedAssignmentForEmployee(employeeId, completedTaskId);
    this.state.employees = this.state.employees.map((employee) => {
      if (employee.id !== employeeId) return employee;

      if (remainingAssignment) {
        return {
          ...employee,
          status: "Working" as const,
          assignedTaskId: remainingAssignment.taskId,
          currentProjectId: remainingAssignment.projectId,
        };
      }

      return {
        ...employee,
        status: "Idle" as const,
        assignedTaskId: undefined,
        currentProjectId: undefined,
      };
    });
  }

  private moveProjectSelection(delta: number) {
    const nextIndex = clamp(this.state.selectedProjectIndex + delta, -3, this.state.projects.length - 1);
    if (nextIndex === this.state.selectedProjectIndex) return;

    this.state.selectedProjectIndex = nextIndex;
    this.state.selectedProjectId = this.state.projects[nextIndex]?.id ?? "";
    this.state.selectedWorkspaceSectionIndex = 0;
    this.state.selectedRepositoryProjectId = undefined;
    this.state.selectedTaskProjectId = undefined;
    this.state.selectedTaskId = undefined;
    this.state.selectedTaskIndex = 0;
    this.state.selectedEmployeeIndex = 0;
    this.state.selectedWorkSessionId = undefined;
    this.taskRequestVersion += 1;
    this.employeeRequestVersion += 1;
    this.taskAnalysisRequestVersion += 1;
    this.employeeRecommendationRequestVersion += 1;
    this.projectManagerRequestVersion += 1;
    this.view.render(this.state);
  }

  private moveRepositoryIdentityChoiceSelection(delta: number) {
    const nextIndex = clamp(
      this.state.selectedRepositoryIdentityChoiceIndex + delta,
      0,
      EXTERNAL_PROJECT_REPOSITORY_IDENTITY_CHOICES.length - 1,
    );
    if (nextIndex === this.state.selectedRepositoryIdentityChoiceIndex) return;

    this.state.selectedRepositoryIdentityChoiceIndex = nextIndex;
    this.view.render(this.state);
  }

  private addExternalProjectDraft() {
    addExternalProjectDraftToState(this.state);
    this.taskRequestVersion += 1;
    this.employeeRequestVersion += 1;
    this.taskAnalysisRequestVersion += 1;
    this.employeeRecommendationRequestVersion += 1;
    this.projectManagerRequestVersion += 1;
    this.persistBrowserOfficeSession();
    this.refreshCompanyDashboardSnapshot();
    this.view.render(this.state);
  }

  private openExternalProjectRepositoryIdentityEdit() {
    if (this.state.selectedProjectDashboardProjectId !== EXTERNAL_PROJECT_DRAFT_ID) return false;
    if (!this.state.projectRegistryEntries.some((entry) => entry.id === EXTERNAL_PROJECT_DRAFT_ID)) return false;
    const project = this.state.projects.find((item) => item.id === EXTERNAL_PROJECT_DRAFT_ID);
    if (canCreateExternalProjectDevelopmentRequestDraft(project)) return false;

    this.state.selectedRepositoryIdentityChoiceIndex = getCurrentRepositoryIdentityChoiceIndex(
      project?.repositoryIdentity,
    );
    this.state.viewMode = "repository-identity-edit";
    return true;
  }

  private createExternalProjectDevelopmentRequestDraft() {
    const project = this.getDevelopmentRequestTargetProject();
    if (!project || !canCreateExternalProjectDevelopmentRequestDraft(project)) return false;

    this.state.externalProjectDevelopmentRequestDrafts = {
      ...this.state.externalProjectDevelopmentRequestDrafts,
      [project.id]: createExternalProjectDevelopmentRequestDraft({
        project,
        activeProjectCompanyContext: this.state.activeProjectCompanyContext,
        requestText: this.pendingDevelopmentRequestText,
        existingDraft: this.state.externalProjectDevelopmentRequestDrafts[project.id],
      }),
    };
    this.persistBrowserOfficeSession();
    return true;
  }

  private createExternalProjectAdosRunPreparation() {
    const project = this.getDevelopmentRequestTargetProject();
    if (!project) return false;

    const developmentRequestDraft = this.state.externalProjectDevelopmentRequestDrafts[project.id];
    if (!canCreateExternalProjectAdosRunPreparation(developmentRequestDraft)) return false;

    const preparation = createExternalProjectAdosRunPreparation({
      projectId: project.id,
      developmentRequestDraft,
      existingPreparation: this.state.externalProjectAdosRunPreparations[project.id],
    });
    if (!preparation) return false;

    this.state.externalProjectAdosRunPreparations = {
      ...this.state.externalProjectAdosRunPreparations,
      [project.id]: preparation,
    };
    this.state.externalProjectDevelopmentRequestDrafts = {
      ...this.state.externalProjectDevelopmentRequestDrafts,
      [project.id]: {
        ...developmentRequestDraft!,
        status: "Prepared",
        updatedAt: preparation.updatedAt,
      },
    };
    this.state.externalProjectAdosRunStatuses = {
      ...this.state.externalProjectAdosRunStatuses,
      [project.id]: deriveExternalProjectAdosRunStatus({
        projectId: project.id,
        preparation,
        persistedStatus: this.state.externalProjectAdosRunStatuses[project.id],
      })!,
    };
    this.persistBrowserOfficeSession();
    return true;
  }

  private startExternalProjectAdosExecution() {
    const project = this.getDevelopmentRequestTargetProject();
    if (!project) return false;

    const preparation = this.state.externalProjectAdosRunPreparations[project.id];
    if (!preparation) return false;
    const activeExecutionKeys = this.getActiveExternalProjectAdosExecutionKeys();
    if (activeExecutionKeys.has(project.id) || this.hasActiveExternalProjectAdosExecutionForProject(project.id)) {
      this.markExternalProjectDevelopmentRequestAlreadyActive(project.id);
      return true;
    }

    activeExecutionKeys.add(project.id);
    const existingDraft = this.state.externalProjectDevelopmentRequestDrafts[project.id];
    if (existingDraft) {
      this.state.externalProjectDevelopmentRequestDrafts = {
        ...this.state.externalProjectDevelopmentRequestDrafts,
        [project.id]: {
          ...existingDraft,
          status: this.state.externalProjectAdosExecutions[project.id] ? "AlreadyActive" : "Submitting",
          updatedAt: new Date().toISOString(),
        },
      };
      this.persistBrowserOfficeSession();
      this.view.render(this.state);
    }
    void this.externalProjectAdosExecutionService.start({
      projectId: project.id,
      project,
      preparation,
      existingExecution: this.state.externalProjectAdosExecutions[project.id],
    }).then((outcome) => {
      if (outcome.execution) {
        this.state.externalProjectAdosExecutions = {
          ...this.state.externalProjectAdosExecutions,
          [project.id]: outcome.execution,
        };
      }
      this.state.externalProjectAdosExecutionResults = {
        ...this.state.externalProjectAdosExecutionResults,
        [project.id]: outcome.result,
      };
      const draft = this.state.externalProjectDevelopmentRequestDrafts[project.id];
      if (draft) {
        this.state.externalProjectDevelopmentRequestDrafts = {
          ...this.state.externalProjectDevelopmentRequestDrafts,
          [project.id]: {
            ...draft,
            status: outcome.result.duplicateExistingExecution
              ? "AlreadyActive"
              : outcome.result.started
                ? "Started"
                : outcome.result.status === "Failed"
                  ? "Failed"
                  : outcome.result.status === "Blocked"
                    ? "Blocked"
                    : outcome.result.status === "Completed"
                      ? "Completed"
                      : draft.status,
            adosRunId: outcome.execution?.id ?? draft.adosRunId,
            updatedAt: outcome.result.resultAt,
          },
        };
      };
      this.state.externalProjectAdosRunStatuses = {
        ...this.state.externalProjectAdosRunStatuses,
        [project.id]: deriveExternalProjectAdosRunStatus({
          projectId: project.id,
          preparation,
          execution: outcome.execution ?? this.state.externalProjectAdosExecutions[project.id],
          result: outcome.result,
          persistedStatus: this.state.externalProjectAdosRunStatuses[project.id],
        })!,
      };
      this.persistBrowserOfficeSession();
      this.view.render(this.state);
    }).finally(() => {
      this.getActiveExternalProjectAdosExecutionKeys().delete(project.id);
    });

    return true;
  }

  private getActiveExternalProjectAdosExecutionKeys() {
    this.activeExternalProjectAdosExecutionKeys ??= new Set<string>();
    return this.activeExternalProjectAdosExecutionKeys;
  }

  private hasActiveExternalProjectAdosExecutionForProject(projectId: string) {
    const activeExecutionKeys = this.getActiveExternalProjectAdosExecutionKeys();
    if (activeExecutionKeys.has(projectId)) return true;
    if (Array.from(activeExecutionKeys).some((key) => key.startsWith(`${projectId}:`))) return true;
    return Object.values(this.state.externalProjectAdosRunStatuses).some((status) => (
      status.projectId === projectId && (
        status.stage === "Started" ||
        status.stage === "Blocked" ||
        status.stage === "TimedOut"
      )
    )) || Object.values(this.state.externalProjectAdosExecutions).some((execution) => (
      execution.projectId === projectId && this.isActiveExternalProjectAdosExecution(execution)
    ));
  }

  private isActiveExternalProjectAdosExecution(execution: ExternalProjectAdosExecution) {
    if (
      execution.status === "Completed" &&
      execution.implementerStarted &&
      !execution.evidence.completed &&
      !execution.evidence.timedOut &&
      !execution.evidence.cancelled
    ) {
      return true;
    }
    return execution.status !== "Completed" &&
      execution.status !== "Failed" &&
      execution.status !== "Cancelled";
  }

  private markExternalProjectDevelopmentRequestAlreadyActive(projectId: string) {
    const existingDraft = this.state.externalProjectDevelopmentRequestDrafts[projectId];
    if (!existingDraft) return;
    this.state.externalProjectDevelopmentRequestDrafts = {
      ...this.state.externalProjectDevelopmentRequestDrafts,
      [projectId]: {
        ...existingDraft,
        status: "AlreadyActive",
        updatedAt: new Date().toISOString(),
      },
    };
    this.persistBrowserOfficeSession();
    this.view.render(this.state);
  }

  private getDevelopmentRequestTargetProject() {
    return resolveDevelopmentRequestTargetProject({
      activeProjectCompanyContext: this.state.activeProjectCompanyContext,
      selectedProjectId: this.state.selectedProjectDashboardProjectId ?? this.state.selectedProjectId,
      projects: this.state.projects,
    });
  }

  private getSelectedBacklogDevelopmentPreview() {
    const project = this.getSelectedBacklogProject();
    if (!project) return undefined;
    const task = this.getSelectedBacklogTask();
    return this.projectBacklogDevelopmentBridgeService.createPreview({
      project,
      task,
      activeProjectCompanyContext: this.state.activeProjectCompanyContext,
      existingDraft: task ? this.getAssociatedDevelopmentRequestDraft(task) : undefined,
      existingPreparation: task ? this.getAssociatedAdosRunPreparation(task) : undefined,
      existingExecution: task ? this.getAssociatedAdosExecution(task) : undefined,
      existingRunStatus: task
        ? this.getAssociatedAdosRunStatus(task) ?? this.getActiveProjectAdosRunStatus(project.id)
        : this.getActiveProjectAdosRunStatus(project.id),
    });
  }

  private getSelectedProjectAutonomyEvaluation() {
    const project = this.getSelectedBacklogProject();
    if (!project) return undefined;
    const projectId = project.id;
    const collection = this.projectBacklogService.getOrderedCollection(this.state.projectBacklogCollections, projectId);
    return this.projectAutonomousExecutionPolicyService.evaluate({
      policies: this.state.projectAutonomyPolicies,
      project,
      context: this.getBacklogMutationContext(),
      tasks: collection.tasks,
      activeRunStatus: this.getActiveProjectAdosRunStatus(projectId),
      activeExecutions: Object.values(this.state.externalProjectAdosExecutions)
        .filter((execution) => execution.projectId === projectId),
      executionAvailable: typeof this.externalProjectAdosExecutionService.start === "function",
    });
  }

  private recordProjectAutonomyEvaluation(result: ProjectAutonomyEvaluationResult) {
    const currentPolicy = this.projectAutonomousExecutionPolicyService.getPolicy(
      this.state.projectAutonomyPolicies,
      result.projectId,
    );
    if (!currentPolicy.updatedByOperator && !currentPolicy.enabled) return;
    this.state.projectAutonomyPolicies = {
      ...this.state.projectAutonomyPolicies,
      [result.projectId]: {
        ...currentPolicy,
        lastEvaluationReason: result.reason,
      },
    };
  }

  private getSelectedBacklogProject() {
    const projectId = this.state.selectedBacklogProjectId;
    return projectId ? this.state.projects.find((project) => project.id === projectId) : undefined;
  }

  private getAssociatedDevelopmentRequestDraft(task: ProjectBacklogTask) {
    const draft = this.state.externalProjectDevelopmentRequestDrafts[this.getBacklogDevelopmentAssociationKey(task)];
    return draft &&
      draft.id === task.developmentRequestId &&
      draft.projectId === task.projectId &&
      draft.sourceBacklogTaskId === task.id
      ? draft
      : undefined;
  }

  private getAssociatedAdosRunPreparation(task: ProjectBacklogTask) {
    const preparation = this.state.externalProjectAdosRunPreparations[this.getBacklogDevelopmentAssociationKey(task)];
    return preparation &&
      preparation.id === task.executionPreparationId &&
      preparation.projectId === task.projectId &&
      preparation.developmentRequestDraftId === task.developmentRequestId
      ? preparation
      : undefined;
  }

  private getAssociatedAdosExecution(task: ProjectBacklogTask) {
    const execution = this.state.externalProjectAdosExecutions[this.getBacklogDevelopmentAssociationKey(task)];
    return execution &&
      execution.id === task.executionRunId &&
      execution.projectId === task.projectId &&
      execution.preparationId === task.executionPreparationId &&
      execution.developmentRequestDraftId === task.developmentRequestId
      ? execution
      : undefined;
  }

  private getAssociatedAdosRunStatus(task: ProjectBacklogTask) {
    const status = this.state.externalProjectAdosRunStatuses[this.getBacklogDevelopmentAssociationKey(task)];
    return status &&
      status.projectId === task.projectId &&
      status.preparationId === task.executionPreparationId &&
      (!task.executionRunId || status.executionId === task.executionRunId)
      ? status
      : undefined;
  }

  private getActiveProjectAdosRunStatus(projectId: string) {
    return Object.values(this.state.externalProjectAdosRunStatuses).find((status) => (
      status.projectId === projectId && (
        status.stage === "Prepared" ||
        status.stage === "Started" ||
        status.stage === "Blocked" ||
        status.stage === "TimedOut"
      )
    ));
  }

  private getBacklogDevelopmentAssociationKey(task: ProjectBacklogTask) {
    return createProjectBacklogDevelopmentAssociationKey(task.projectId, task.id);
  }

  private updateBacklogTaskAfterExecutionOutcome(
    context: NonNullable<ReturnType<OfficeProjectPortalController["getBacklogMutationContext"]>>,
    task: ProjectBacklogTask,
    resultAt: string,
    executionRunId: string | undefined,
    accepted: boolean,
  ) {
    if (!accepted) return;
    this.projectBacklogService.updateTask(this.state.projectBacklogCollections, context, task.id, {
      status: "in_progress",
      executionRunId: executionRunId ?? task.executionRunId,
      executionAcceptedAt: resultAt,
    });
    this.syncBacklogSelectionToTaskId(task.id);
  }

  private moveWorkspaceSelection(delta: number) {
    const project = this.getSelectedProject();
    const workspace = project ? this.state.workspaces[project.id] : undefined;
    if (!workspace) return;

    const nextIndex = clamp(this.state.selectedWorkspaceSectionIndex + delta, 0, workspace.sections.length - 1);
    if (nextIndex === this.state.selectedWorkspaceSectionIndex) return;

    this.state.selectedWorkspaceSectionIndex = nextIndex;
    this.view.render(this.state);
  }

  private moveTaskSelection(delta: number) {
    const collection = this.getSelectedTaskCollection();
    if (!collection || collection.tasks.length === 0) return;

    const nextIndex = clamp(this.state.selectedTaskIndex + delta, 0, collection.tasks.length - 1);
    if (nextIndex === this.state.selectedTaskIndex) return;

    this.state.selectedTaskIndex = nextIndex;
    this.state.selectedTaskId = collection.tasks[nextIndex]?.id;
    void this.prepareSelectedTaskAnalysis();
    void this.prepareSelectedEmployeeRecommendation();
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    if (projectId) void this.prepareProjectManagementSuggestion(projectId);
    this.view.render(this.state);
  }

  private moveBacklogSelection(delta: number) {
    const projectId = this.state.selectedBacklogProjectId;
    if (!projectId) return;
    const collection = this.projectBacklogService.getOrderedCollection(this.state.projectBacklogCollections, projectId);
    if (collection.tasks.length === 0) {
      this.state.selectedBacklogTaskIndex = 0;
      this.state.selectedBacklogTaskId = undefined;
      this.view.render(this.state);
      return;
    }

    const nextIndex = clamp(this.state.selectedBacklogTaskIndex + delta, 0, collection.tasks.length - 1);
    if (nextIndex === this.state.selectedBacklogTaskIndex) return;
    this.state.selectedBacklogTaskIndex = nextIndex;
    this.state.selectedBacklogTaskId = collection.tasks[nextIndex]?.id;
    this.view.render(this.state);
  }

  private syncBacklogSelectionToTaskId(taskId: string) {
    const projectId = this.state.selectedBacklogProjectId;
    if (!projectId) return;
    const collection = this.projectBacklogService.getOrderedCollection(this.state.projectBacklogCollections, projectId);
    this.state.projectBacklogCollections[projectId] = collection;
    const taskIndex = collection.tasks.findIndex((task) => task.id === taskId);
    this.state.selectedBacklogTaskIndex = taskIndex >= 0 ? taskIndex : 0;
  }

  private getSelectedBacklogTask() {
    const projectId = this.state.selectedBacklogProjectId;
    if (!projectId) return undefined;
    const collection = this.projectBacklogService.getOrderedCollection(this.state.projectBacklogCollections, projectId);
    const selectedTaskId = this.state.selectedBacklogTaskId;
    return selectedTaskId
      ? collection.tasks.find((task) => task.id === selectedTaskId)
      : collection.tasks[this.state.selectedBacklogTaskIndex];
  }

  private getBacklogMutationContext() {
    const projectId = this.state.selectedBacklogProjectId;
    if (!projectId) return undefined;
    const project = this.state.projectRegistryEntries.find((entry) => entry.id === projectId);
    const binding = this.state.projectCompanyBindings?.find((item) => item.projectId === projectId);
    return {
      projectId,
      bindingId: binding?.bindingId ?? this.state.activeProjectCompanyContext?.binding.bindingId ?? projectId,
      buildingId: binding?.buildingId ?? this.state.activeProjectCompanyContext?.binding.buildingId ?? projectId,
      fallbackCompanyName: project?.owner.companyName ?? project?.displayName ?? projectId,
      projects: this.state.projectRegistryEntries,
    };
  }

  private getFirstProposedBacklogSuggestion() {
    const projectId = this.state.selectedBacklogProjectId;
    if (!projectId) return undefined;
    return this.state.projectBacklogSuggestionCollections[projectId]?.candidates
      .find((candidate) => candidate.projectId === projectId && candidate.status === "proposed");
  }

  private getProjectActiveWorkSummaries(projectId: string) {
    const backlogActive = this.projectBacklogService
      .getOrderedCollection(this.state.projectBacklogCollections, projectId)
      .tasks
      .filter((task) => task.status === "in_progress")
      .map((task) => `${task.title} (${task.status})`);
    const runStatus = this.state.externalProjectAdosRunStatuses[projectId];
    return [
      ...backlogActive,
      ...(runStatus && runStatus.stage !== "Completed" ? [`ADOS ${runStatus.stage}: ${runStatus.status}`] : []),
    ];
  }

  private getProjectBlockedWorkSummaries(projectId: string) {
    const backlogBlocked = this.projectBacklogService
      .getOrderedCollection(this.state.projectBacklogCollections, projectId)
      .tasks
      .filter((task) => task.status === "blocked")
      .map((task) => task.blockedReason ? `${task.title}: ${task.blockedReason}` : task.title);
    const runStatus = this.state.externalProjectAdosRunStatuses[projectId];
    const runBlocked = runStatus && (runStatus.stage === "Blocked" || runStatus.status.toLowerCase().includes("blocked"))
      ? [`ADOS ${runStatus.stage}: ${runStatus.reasonCodes[0] ?? runStatus.status}`]
      : [];
    return [...backlogBlocked, ...runBlocked];
  }

  private getProjectDevelopmentRequestSummaries(projectId: string) {
    return Object.values(this.state.externalProjectDevelopmentRequestDrafts)
      .filter((draft) => draft.projectId === projectId)
      .map((draft) => `${draft.status}: ${draft.title}`);
  }

  private getProjectRepositorySummary(projectId: string) {
    const project = this.state.projects.find((item) => item.id === projectId);
    const repositorySummary = this.state.repositorySummaries[projectId];
    if (repositorySummary?.connectionStatus === "connected") {
      return `${repositorySummary.owner}/${repositorySummary.name}; ${repositorySummary.openIssueCount} open issues; ${repositorySummary.openPullRequestCount} open pull requests`;
    }
    const identity = project?.repositoryIdentity;
    if (!identity) return undefined;
    return [identity.provider, identity.owner, identity.name, identity.connectionState].filter(Boolean).join(" ");
  }

  private moveEmployeeSelection(delta: number) {
    if (this.state.employees.length === 0) return;

    const nextIndex = clamp(this.state.selectedEmployeeIndex + delta, 0, this.state.employees.length - 1);
    if (nextIndex === this.state.selectedEmployeeIndex) return;

    this.state.selectedEmployeeIndex = nextIndex;
    this.view.render(this.state);
  }

  private moveInfluenceFocusSelection(delta: number) {
    const options = this.getCompanyFocusOptions();
    if (options.length === 0) return;

    const nextIndex = clamp(this.state.selectedInfluenceFocusIndex + delta, 0, options.length - 1);
    if (nextIndex === this.state.selectedInfluenceFocusIndex) return;

    this.state.selectedInfluenceFocusIndex = nextIndex;
    this.view.render(this.state);
  }

  private getCompanyInfluencePlanningService() {
    if (!this.companyInfluencePlanningService) {
      (this as unknown as { companyInfluencePlanningService: CompanyInfluencePlanningService }).companyInfluencePlanningService =
        new CompanyInfluencePlanningService();
    }

    return this.companyInfluencePlanningService;
  }

  private refreshEmployeeSimulationSnapshots() {
    const tasks = getAllLoadedTasks(this.state.taskCollections);
    this.state.employeeSimulations = this.employeeSimulationService.deriveSnapshots(
      this.state.employees,
      tasks,
      this.state.workSessions,
      this.state.employeeSimulations,
    );
  }

  private refreshEmployeeSimulationSnapshotsForTaskAssigned() {
    const tasks = getAllLoadedTasks(this.state.taskCollections);
    this.state.employeeSimulations = this.employeeSimulationService.updateForTaskAssigned(
      this.state.employees,
      tasks,
      this.state.workSessions,
      this.state.employeeSimulations,
    );
  }

  private refreshEmployeeSimulationSnapshotsForWorkStarted() {
    const tasks = getAllLoadedTasks(this.state.taskCollections);
    this.state.employeeSimulations = this.employeeSimulationService.updateForWorkStarted(
      this.state.employees,
      tasks,
      this.state.workSessions,
      this.state.employeeSimulations,
    );
  }

  private refreshEmployeeSimulationSnapshotsForWorkCompleted() {
    const tasks = getAllLoadedTasks(this.state.taskCollections);
    this.state.employeeSimulations = this.employeeSimulationService.updateForWorkCompleted(
      this.state.employees,
      tasks,
      this.state.workSessions,
      this.state.employeeSimulations,
    );
  }

  private refreshCompanyDashboardSnapshot() {
    const companyProgression = this.getCompanyProgressionSnapshot();
    this.refreshReceptionDeskUpgradeBenefits(companyProgression);
    this.state.companyDashboardSnapshot = this.getCompanyDashboardSnapshot();
  }

  private refreshReceptionDeskUpgradeBenefits(companyProgression: CompanyProgressionSnapshot | undefined) {
    this.state.receptionDeskUpgradeBenefits = new ReceptionDeskUpgradeBenefitsService().createBenefits(companyProgression);
  }

  private createProjectDashboardContext() {
    const employeeInsightSources = this.getEmployeeInsightSources();

    return {
      employeeInsightSources,
      employees: this.state.employees,
      projects: this.state.projects,
      tasks: getAllLoadedTasks(this.state.taskCollections),
      workSessions: Object.values(this.state.workSessions).flat(),
      workstations: this.getWorkstationSnapshots(),
      companyProgression: this.getCompanyProgressionSnapshot(),
      companyFocus: this.getCompanyFocusSummary(),
      repositoryMappings: this.state.repositoryMappings,
      repositorySummaries: this.state.repositorySummaries,
      projectManagementSuggestions: this.state.projectManagementSuggestions,
    };
  }

  private getActiveProjectId() {
    return this.state.activeProjectCompanyContext?.projectId ?? this.state.selectedProjectId;
  }

  private applyActiveProjectContextSelection(projectId = this.state.activeProjectCompanyContext?.projectId) {
    if (!projectId) return;

    this.state.selectedProjectId = projectId;
    const selectedProjectIndex = this.state.projects.findIndex((project) => project.id === projectId);
    if (selectedProjectIndex >= 0) {
      this.state.selectedProjectIndex = selectedProjectIndex;
    }
  }

  private mergeGitHubProjectDashboardSource(
    snapshot: ProjectDashboardSnapshot,
    context: ProjectDashboardProviderContext,
    projectId: string,
  ): ProjectDashboardSnapshot {
    if (!this.hasRepositoryMapping(projectId)) return snapshot;

    const githubSnapshot = this.githubProjectDashboardProvider.getProjectSnapshot(context, projectId);
    const githubSource: ProjectDashboardSourceMetadata = {
      ...githubSnapshot.source,
      signals: githubSnapshot.source.signals?.map((signal) => ({ ...signal })),
    };

    return {
      ...snapshot,
      externalSources: [
        ...(snapshot.externalSources ?? []).filter((source) => source.sourceType !== "github"),
        githubSource,
      ],
      sections: snapshot.sections.map((section) =>
        section.id === "source_metadata"
          ? { ...section, status: "available" }
          : section,
      ),
    };
  }

  private hasRepositoryMapping(projectId: string) {
    return this.state.repositoryMappings.some((mapping) => mapping.projectId === projectId && mapping.enabled);
  }

  private syncCompanyFocusToDashboardSnapshot() {
    if (!this.state.companyDashboardSnapshot) return;

    this.state.companyDashboardSnapshot = {
      ...this.state.companyDashboardSnapshot,
      companyFocus: this.state.companyFocusSummary,
    };
  }

  private async prepareProjectManagementSuggestion(projectId: string) {
    const project = this.state.projects.find((item) => item.id === projectId);
    if (!project) return;

    const tasks = this.state.taskCollections[projectId]?.tasks ?? [];
    const activityLogs = getTaskActivityLogs(tasks);
    const requestVersion = this.projectManagerRequestVersion;
    const suggestion = await this.aiProjectManagerService.createProjectManagementSuggestion(
      project,
      tasks,
      this.state.employees,
      activityLogs,
    );
    if (!this.shouldApplyProjectManagementSuggestion(projectId, requestVersion)) return;

    this.state.projectManagementSuggestions[projectId] = suggestion;
  }

  private shouldApplyProjectManagementSuggestion(projectId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      this.state.selectedProjectId === projectId &&
      this.projectManagerRequestVersion === requestVersion
    );
  }

  private async prepareTaskAnalyses(tasks: ProjectTask[], projectId: string) {
    const missingTasks = tasks.filter((task) => !this.state.taskAnalyses[task.id]);
    if (missingTasks.length === 0) return;

    const requestVersion = this.taskAnalysisRequestVersion;

    const analyses = await Promise.all(missingTasks.map((task) => this.aiService.analyzeTask(task)));
    if (!this.shouldApplyTaskAnalyses(projectId, requestVersion)) return;

    analyses.forEach((analysis) => {
      this.state.taskAnalyses[analysis.taskId] = analysis;
    });
  }

  private async prepareSelectedTaskAnalysis() {
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    const task = this.getSelectedTask();
    if (!projectId || !task || this.state.taskAnalyses[task.id]) return;

    const requestVersion = this.taskAnalysisRequestVersion;
    const analysis = await this.aiService.analyzeTask(task);
    if (!this.shouldApplySelectedTaskAnalysis(projectId, task.id, requestVersion)) return;

    this.state.taskAnalyses[analysis.taskId] = analysis;
    void this.prepareSelectedEmployeeRecommendation();
  }

  private async prepareSelectedEmployeeRecommendation() {
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    const task = this.getSelectedTask();
    if (!projectId || !task || this.state.employees.length === 0 || this.state.employeeRecommendations[task.id]) return;

    const requestVersion = this.employeeRecommendationRequestVersion;
    const recommendation = await this.aiService.recommendEmployeeForTask(task, this.state.employees);
    if (!this.shouldApplySelectedEmployeeRecommendation(projectId, task.id, requestVersion)) return;

    this.state.employeeRecommendations[recommendation.taskId] = recommendation;
  }

  private shouldApplyTaskAnalyses(projectId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      (this.state.viewMode === "task-list" || this.state.viewMode === "task-detail") &&
      this.state.selectedTaskProjectId === projectId &&
      this.taskAnalysisRequestVersion === requestVersion
    );
  }

  private shouldApplySelectedTaskAnalysis(projectId: string, taskId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      (this.state.viewMode === "task-list" || this.state.viewMode === "task-detail" || this.state.viewMode === "employee-selection") &&
      this.state.selectedTaskProjectId === projectId &&
      this.state.selectedTaskId === taskId &&
      this.taskAnalysisRequestVersion === requestVersion
    );
  }

  private shouldApplySelectedEmployeeRecommendation(projectId: string, taskId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      (this.state.viewMode === "task-list" || this.state.viewMode === "task-detail" || this.state.viewMode === "employee-selection") &&
      this.state.selectedTaskProjectId === projectId &&
      this.state.selectedTaskId === taskId &&
      this.employeeRecommendationRequestVersion === requestVersion
    );
  }

  private getSelectedProject() {
    return this.state.projects[this.state.selectedProjectIndex];
  }

  private getSelectedTaskCollection() {
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    return projectId ? this.state.taskCollections[projectId] : undefined;
  }

  private getSelectedTask() {
    const collection = this.getSelectedTaskCollection();
    return collection?.tasks[this.state.selectedTaskIndex];
  }

  private getSelectedTaskAction(): SelectedTaskAction | undefined {
    const task = this.getSelectedTask();
    if (!task) return undefined;
    if (task.status === "Done") return "completed";
    if (task.status === "Review") return "mark_done";
    if (task.status === "In Progress") return "move_to_review";
    return task.assignee ? "start_work" : "assign_employee";
  }

  private findLoadedAssignmentForEmployee(employeeId: string, excludedTaskId?: string) {
    const employeeName = this.state.employees.find((employee) => employee.id === employeeId)?.name;

    for (const collection of Object.values(this.state.taskCollections)) {
      const task = collection.tasks.find((item) => {
        if (item.id === excludedTaskId || item.status === "Done") return false;
        return item.assigneeId === employeeId || (employeeName ? item.assignee === employeeName : false);
      });
      if (task) {
        return {
          projectId: collection.projectId,
          taskId: task.id,
        };
      }
    }

    return undefined;
  }

  private getTaskAssigneeEmployeeId(task: ProjectTask) {
    if (task.assigneeId) return task.assigneeId;
    if (!task.assignee) return undefined;

    return this.state.employees.find((employee) => employee.name === task.assignee)?.id;
  }

  private deriveCurrentEmployeeConversationTargets(
    playerPosition: ResolvedEmployeeConversationPlayerPosition,
  ): NearbyEmployeeConversationTarget[] {
    return this.createPreviewEmployeeConversationState().movementSnapshots.map((snapshot) => ({
      employeeId: snapshot.employeeId,
      distance: getConversationDistance(playerPosition, snapshot.positionHint),
    }));
  }

  private createPreviewEmployeeConversationContext(employeeId: string) {
    const previewState = this.createPreviewEmployeeConversationState();
    const employee = this.state.employees.find((item) => item.id === employeeId);
    const simulationSnapshot = previewState.employeeSnapshots.find((snapshot) => snapshot.employeeId === employeeId);
    const currentTask = simulationSnapshot?.currentTaskId
      ? previewState.tasks.find((task) => task.id === simulationSnapshot.currentTaskId)
      : undefined;
    const workstationSnapshot = previewState.workstationSnapshots
      .find((snapshot) => snapshot.assignedEmployeeId === employeeId || snapshot.occupiedByEmployeeId === employeeId);
    const scheduleSnapshot = previewState.scheduleSnapshots.find((snapshot) => snapshot.employeeId === employeeId);
    const movementSnapshot = previewState.movementSnapshots.find((snapshot) => snapshot.employeeId === employeeId);
    const projectName = currentTask
      ? this.state.projects.find((project) => project.id === currentTask.projectId)?.name
      : undefined;

    return {
      context: {
        employee,
        simulationSnapshot,
        currentTask,
        workstationSnapshot,
        scheduleSnapshot,
        projectName,
      },
      positionHint: movementSnapshot?.positionHint,
    };
  }

  private createPreviewEmployeeConversationState() {
    const tasks = getAllLoadedTasks(this.state.taskCollections);
    const conversationPreviewTimestamp = getPreviewMovementTimestamp(
      this.employeeNpcMovementService.getSnapshots(),
      this.employeeSimulationService.getSnapshots(this.state.employeeSimulations),
    );
    const employeeSnapshots = Object.values(this.employeeSimulationService.deriveSnapshots(
      this.state.employees,
      tasks,
      this.state.workSessions,
      this.state.employeeSimulations,
      conversationPreviewTimestamp,
    )).sort((left, right) => left.employeeId.localeCompare(right.employeeId));
    const workstationSnapshots = this.workstationOccupancyService.previewSnapshots(employeeSnapshots);
    const workstationTargetHints = createWorkstationTargetHints(workstationSnapshots);
    const scheduleSnapshots = this.employeeDailyScheduleService.previewSnapshots(employeeSnapshots);
    const scheduleTargetHints = createScheduleTargetHints(scheduleSnapshots, employeeSnapshots, workstationTargetHints);
    const targetPositionHints = {
      ...scheduleTargetHints,
      ...workstationTargetHints,
    };
    const movementSnapshots = this.employeeNpcMovementService.previewSnapshots(
      employeeSnapshots,
      conversationPreviewTimestamp,
      targetPositionHints,
    );

    return {
      tasks,
      employeeSnapshots,
      workstationSnapshots,
      scheduleSnapshots,
      movementSnapshots,
    };
  }

  private createPreviewEmployeeInsightState() {
    const tasks = getAllLoadedTasks(this.state.taskCollections);
    const insightPreviewTimestamp = getPreviewMovementTimestamp(
      this.employeeNpcMovementService.getSnapshots(),
      this.employeeSimulationService.getSnapshots(this.state.employeeSimulations),
    );
    const employeeSnapshots = Object.values(this.employeeSimulationService.deriveSnapshots(
      this.state.employees,
      tasks,
      this.state.workSessions,
      this.state.employeeSimulations,
      insightPreviewTimestamp,
    )).sort((left, right) => left.employeeId.localeCompare(right.employeeId));
    const workstationSnapshots = this.workstationOccupancyService.previewSnapshots(employeeSnapshots);
    const workstationTargetHints = createWorkstationTargetHints(workstationSnapshots);
    const scheduleSnapshots = this.employeeDailyScheduleService.previewSnapshots(employeeSnapshots);
    const scheduleTargetHints = createScheduleTargetHints(scheduleSnapshots, employeeSnapshots, workstationTargetHints);
    const targetPositionHints = {
      ...scheduleTargetHints,
      ...workstationTargetHints,
    };
    const movementSnapshots = this.employeeNpcMovementService.previewSnapshots(
      employeeSnapshots,
      insightPreviewTimestamp,
      targetPositionHints,
    );
    const scheduleByEmployeeId = new Map(scheduleSnapshots.map((snapshot) => [snapshot.employeeId, snapshot]));
    const movementByEmployeeId = new Map(movementSnapshots.map((snapshot) => [snapshot.employeeId, snapshot]));
    const companyProgression = this.getCompanyProgressionSnapshot();
    const officeLayout = this.officeLayoutService.getActiveLayout(companyProgression.layoutId);
    const employeesById = new Map(this.state.employees.map((employee) => [employee.id, employee]));
    const aiSnapshots = this.employeeAIService.updateMany(employeeSnapshots.map((snapshot) => ({
      employeeId: snapshot.employeeId,
      employee: employeesById.get(snapshot.employeeId),
      simulationSnapshot: snapshot,
      movementSnapshot: movementByEmployeeId.get(snapshot.employeeId),
      scheduleSnapshot: scheduleByEmployeeId.get(snapshot.employeeId),
      companyProgression,
      officeLayout,
      officeZones: officeLayout.zones,
      updatedAt: insightPreviewTimestamp,
    }))).map((result) => result.snapshot);

    return {
      tasks,
      employeeSnapshots,
      workstationSnapshots,
      scheduleSnapshots,
      movementSnapshots,
      companyProgression,
      aiSnapshots,
    };
  }
}

type SelectedTaskAction = "assign_employee" | "start_work" | "move_to_review" | "mark_done" | "completed";

type EmployeeConversationPlayerPosition = {
  zone?: string;
  slot?: number;
};

type ResolvedEmployeeConversationPlayerPosition = {
  zone: EmployeeNpcPositionZone;
  slot: number;
};

function getAllLoadedTasks(taskCollections: ProjectPortalState["taskCollections"]): ProjectTask[] {
  return Object.values(taskCollections).flatMap((collection) => collection.tasks);
}

function getTaskActivityLogs(tasks: ProjectTask[]): TaskActivity[] {
  return tasks.flatMap((task) => task.activityLog ?? []);
}

function createInsightProgress(task: ProjectTask | undefined) {
  if (!task) return undefined;

  return {
    label: task.status,
    status: task.status,
    percent: getTaskStatusProgressPercent(task.status),
  };
}

function createKnowledgeActivitySources(
  insightSource: EmployeeInsightSource,
  workSessions: ProjectPortalState["workSessions"],
) {
  const employeeWorkSessions = Object.values(workSessions)
    .flat()
    .filter((session) => session.employeeId === insightSource.employeeId);

  return [
    ...(insightSource.currentTask?.activityLog ?? []).map((activity) => ({
      kind: "task_activity" as const,
      activity,
    })),
    ...employeeWorkSessions.map((workSession) => ({
      kind: "work_session" as const,
      workSession,
    })),
    ...(insightSource.aiSnapshot?.lastTransition
      ? [{
          kind: "ai_transition" as const,
          employeeId: insightSource.employeeId,
          fromState: insightSource.aiSnapshot.lastTransition.fromState,
          toState: insightSource.aiSnapshot.lastTransition.toState,
          reason: insightSource.aiSnapshot.lastTransition.reason,
          occurredAt: insightSource.aiSnapshot.lastTransition.occurredAt,
        }]
      : []),
    ...(insightSource.scheduleSnapshot?.currentBlock
      ? [{
          kind: "schedule" as const,
          employeeId: insightSource.employeeId,
          scheduleState: insightSource.scheduleSnapshot.scheduleState,
          label: insightSource.scheduleSnapshot.currentBlock.label,
          occurredAt: insightSource.scheduleSnapshot.lastUpdatedAt,
        }]
      : []),
  ];
}

function getTaskStatusProgressPercent(status: TaskStatus) {
  if (status === "Done") return 100;
  if (status === "Review") return 80;
  if (status === "In Progress") return 50;
  return 0;
}

function createTaskCompletionProgressionFeedback(input: {
  task: ProjectTask;
  completedAt: string;
  previousProgression: CompanyProgressionSnapshot;
  currentProgression: CompanyProgressionSnapshot;
  nextProgression?: CompanyProgressionSnapshot;
}): TaskCompletionProgressionFeedback {
  const levelUp = input.currentProgression.companyLevel > input.previousProgression.companyLevel;
  return {
    projectId: input.task.projectId,
    taskId: input.task.id,
    taskTitle: input.task.title,
    completedAt: input.completedAt,
    previousCompanyLevel: input.previousProgression.companyLevel,
    currentCompanyLevel: input.currentProgression.companyLevel,
    levelUp,
    message: levelUp
      ? `Task complete: company advanced to level ${input.currentProgression.companyLevel}.`
      : `Task complete: progression updated at level ${input.currentProgression.companyLevel}.`,
    milestoneSummary: levelUp
      ? createReachedMilestoneSummary(input.currentProgression)
      : createNextMilestoneSummary(input.nextProgression),
  };
}

function createReachedMilestoneSummary(snapshot: CompanyProgressionSnapshot) {
  if (snapshot.requiredMilestones.length === 0) return `Reached ${snapshot.companyStage}.`;
  return `Reached ${snapshot.companyStage}: ${snapshot.requiredMilestones.map((milestone) => milestone.label).join(", ")}.`;
}

function createNextMilestoneSummary(snapshot: CompanyProgressionSnapshot | undefined) {
  if (!snapshot) return "All visible company progression milestones are complete.";

  const milestoneText = snapshot.requiredMilestones
    .map((milestone) => {
      const currentValue = milestone.currentValue ?? 0;
      const targetValue = milestone.targetValue ?? 0;
      return `${milestone.label} ${currentValue}/${targetValue}`;
    })
    .join(", ");

  return `Next level ${snapshot.companyLevel}: ${milestoneText}.`;
}

function canRecordPromotionDecision(
  review: CandidatePromotionReview | undefined,
  targetStatus: CandidatePromotionStatus,
): review is CandidatePromotionReview {
  return Boolean(
    review
    && review.promotionStatus !== targetStatus
    && review.availableActions.includes(targetStatus),
  );
}

function getNextPromotionCycleStatus(
  review: CandidatePromotionReview | undefined,
): CandidatePromotionStatus | undefined {
  if (!review) return undefined;
  const targetStatus = review.promotionStatus === "Deferred"
    ? "Rejected"
    : review.promotionStatus === "Rejected"
      ? "PendingReview"
      : review.promotionStatus === "Approved"
        ? "Deferred"
        : "Deferred";
  return canRecordPromotionDecision(review, targetStatus) ? targetStatus : undefined;
}

function isResolvedConversationPlayerPosition(
  playerPosition: EmployeeConversationPlayerPosition,
): playerPosition is ResolvedEmployeeConversationPlayerPosition {
  return (
    typeof playerPosition.zone === "string" &&
    CONVERSATION_POSITION_ZONES.has(playerPosition.zone) &&
    typeof playerPosition.slot === "number" &&
    Number.isFinite(playerPosition.slot)
  );
}

function getConversationDistance(
  playerPosition: ResolvedEmployeeConversationPlayerPosition,
  npcPosition: EmployeeNpcViewModel["positionHint"],
) {
  const zoneDistance = playerPosition.zone === npcPosition.zone ? 0 : 100;
  return zoneDistance + Math.abs(playerPosition.slot - npcPosition.slot);
}

function createNpcWorkAnimation(
  snapshot: EmployeeSimulationSnapshot,
  currentTask: ProjectTask | undefined,
  movementSnapshot: EmployeeNpcMovementSnapshot | undefined,
): EmployeeNpcViewModel["workAnimation"] {
  if (
    snapshot.currentState !== "working" ||
    movementSnapshot?.movementState !== "arrived" ||
    movementSnapshot.targetPosition.zone !== "workstation"
  ) {
    return undefined;
  }

  return {
    kind: "workstationTask",
    active: true,
    taskId: currentTask?.id ?? snapshot.currentTaskId,
    taskTitle: currentTask?.title ? truncateNpcWorkAnimationTaskTitle(currentTask.title) : undefined,
  };
}

function truncateNpcWorkAnimationTaskTitle(title: string) {
  const maxLength = 48;
  if (title.length <= maxLength) return title;
  return `${title.slice(0, maxLength - 3)}...`;
}

function createWorkstationTargetHints(workstationSnapshots: ReadonlyArray<WorkstationSnapshot>) {
  return workstationSnapshots.reduce<Record<string, EmployeeNpcMovementPositionHint>>((targetHints, snapshot) => {
    if (snapshot.state !== "reserved" && snapshot.state !== "occupied") return targetHints;

    const employeeId = snapshot.occupiedByEmployeeId ?? snapshot.assignedEmployeeId;
    if (!employeeId) return targetHints;

    targetHints[employeeId] = snapshot.positionHint;
    return targetHints;
  }, {});
}
function createScheduleTargetHints(
  scheduleSnapshots: ReadonlyArray<EmployeeDailyScheduleSnapshot>,
  employeeSnapshots: ReadonlyArray<EmployeeSimulationSnapshot>,
  workstationTargetHints: Record<string, EmployeeNpcMovementPositionHint>,
) {
  const employeeStateById = new Map(employeeSnapshots.map((snapshot) => [snapshot.employeeId, snapshot.currentState]));

  return scheduleSnapshots.reduce<Record<string, EmployeeNpcMovementPositionHint>>((targetHints, snapshot, index) => {
    const employeeState = employeeStateById.get(snapshot.employeeId);
    if (employeeState !== "idle") return targetHints;

    targetHints[snapshot.employeeId] = createSchedulePositionHint(
      snapshot.positionIntent,
      workstationTargetHints[snapshot.employeeId],
      index,
    );
    return targetHints;
  }, {});
}

function createSchedulePositionHint(
  positionIntent: EmployeeSchedulePositionIntent,
  workstationTargetHint: EmployeeNpcMovementPositionHint | undefined,
  fallbackSlot: number,
): EmployeeNpcMovementPositionHint {
  if (positionIntent.zone === "workstation") {
    return workstationTargetHint ?? {
      zone: "idleSpot",
      slot: positionIntent.slot ?? fallbackSlot,
    };
  }

  return {
    zone: positionIntent.zone,
    slot: positionIntent.slot ?? fallbackSlot,
  };
}

function getPreviewMovementTimestamp(
  movementSnapshots: ReadonlyArray<EmployeeNpcMovementSnapshot>,
  simulationSnapshots: ReadonlyArray<EmployeeSimulationSnapshot>,
) {
  return getLatestTimestamp([
    ...movementSnapshots.map((snapshot) => snapshot.lastUpdatedAt),
    ...simulationSnapshots.map((snapshot) => snapshot.lastStateChangeAt),
  ], new Date().toISOString());
}

function getLatestTimestamp(timestamps: ReadonlyArray<string | undefined>, fallbackTimestamp: string) {
  const latestTimestamp = timestamps.reduce<string | undefined>((currentLatestTimestamp, timestamp) => {
    const latestTime = Date.parse(currentLatestTimestamp ?? "");
    const timestampTime = Date.parse(timestamp ?? "");
    if (!Number.isFinite(timestampTime)) return currentLatestTimestamp;
    if (!Number.isFinite(latestTime)) return timestamp ?? currentLatestTimestamp;
    return timestampTime > latestTime ? timestamp ?? currentLatestTimestamp : currentLatestTimestamp;
  }, undefined);

  return latestTimestamp ?? fallbackTimestamp;
}

function getCurrentRepositoryIdentityChoiceIndex(
  identity: ProjectPortalState["projects"][number]["repositoryIdentity"],
) {
  const index = EXTERNAL_PROJECT_REPOSITORY_IDENTITY_CHOICES.findIndex((choice) => (
    choice.repositoryIdentity.provider === identity?.provider &&
    choice.repositoryIdentity.owner === identity?.owner &&
    choice.repositoryIdentity.name === identity?.name &&
    choice.repositoryIdentity.connectionState === identity?.connectionState
  ));
  return index >= 0 ? index : 0;
}

function getNpcPositionZone(state: EmployeeSimulationSnapshot["currentState"]): EmployeeNpcPositionZone {
  if (state === "working") return "collaboration";
  if (state === "assigned") return "desk";
  if (state === "unavailable") return "review";
  return "idle";
}

function parseNpcColor(value?: string) {
  if (!value) return undefined;

  const normalized = value.startsWith("#") ? value.slice(1) : value;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return undefined;

  return Number.parseInt(normalized, 16);
}

function createLoadingRepositorySummary(): GitHubRepositorySummary {
  return {
    owner: "",
    name: "",
    defaultBranch: "",
    openIssueCount: 0,
    openPullRequestCount: 0,
    connectionStatus: "loading",
  };
}

function createFailedRuntimePreflightEvidence(projectId: string, plan: ExecutionPlan): RuntimePreflightEvidence {
  return {
    repository: {
      projectId,
      repositoryId: plan.repositoryId,
      pathExists: false,
      isDirectory: false,
      isGitRepository: false,
      normalizedPath: plan.repositoryPath,
    },
    worktree: {
      pathExists: false,
      isDirectory: false,
      isGitWorktree: false,
      normalizedPath: plan.worktreePath,
      isPrimaryWorktree: false,
    },
    branch: {
      currentBranch: undefined,
      detached: false,
    },
    workingTree: {
      clean: false,
      stagedChanges: false,
      unstagedChanges: false,
      untrackedFiles: false,
      mergeState: false,
      rebaseState: false,
      conflicts: false,
    },
    specification: {
      pathExists: false,
      normalizedPath: plan.specPath,
      insideWorktree: false,
      featureMatches: false,
      requiredArtifactsPresent: false,
    },
    implementer: {
      role: "Implementer",
      agentLabel: plan.implementerAgent,
      available: false,
      commandSafe: false,
    },
    reviewer: {
      role: "Reviewer",
      agentLabel: plan.reviewerAgent,
      available: false,
      commandSafe: false,
    },
    validationCommands: {
      commands: [...plan.validationCommands],
      commandsSafe: false,
    },
    mutationScope: {
      scope: [...plan.allowedMutationScope],
      scopeSafe: false,
    },
    runtimeEnvironment: {
      supported: false,
      spawnAvailable: false,
      safeWorkingDirectory: false,
      providerFailed: true,
    },
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
