import type { ProjectBacklogProjectContext } from "./ProjectBacklogService";
import type { ProjectBacklogCollections } from "./ProjectBacklogTypes";
import type { ProjectBacklogSuggestionProjectContext, ProjectBacklogSuggestionService } from "./ProjectBacklogSuggestionService";
import type {
  ProjectBacklogSuggestionCollections,
  ProjectBacklogSuggestionProvider,
} from "./ProjectBacklogSuggestionTypes";
import { ProjectAutonomousSuggestionPolicyService } from "./ProjectAutonomousSuggestionPolicyService";
import type {
  ProjectAutonomousSuggestionEvaluationEvent,
  ProjectAutonomousSuggestionEvaluationResult,
  ProjectAutonomousSuggestionPlanningState,
  ProjectAutonomousSuggestionPolicies,
} from "./ProjectAutonomousSuggestionPolicyTypes";
import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";

export type ProjectAutonomousSuggestionCoordinatorInput = {
  policies: ProjectAutonomousSuggestionPolicies;
  project: ProjectPortalProject | undefined;
  context: ProjectBacklogProjectContext | undefined;
  event: ProjectAutonomousSuggestionEvaluationEvent;
  planningState: ProjectAutonomousSuggestionPlanningState;
  suggestionCollections: ProjectBacklogSuggestionCollections;
  backlogCollections: ProjectBacklogCollections;
  suggestionService: ProjectBacklogSuggestionService;
  provider: ProjectBacklogSuggestionProvider;
  activeWork?: string[];
  blockedWork?: string[];
  developmentRequests?: string[];
  repositorySummary?: string;
};

export class ProjectAutonomousSuggestionCoordinator {
  private readonly policyService: ProjectAutonomousSuggestionPolicyService;

  constructor(options: { policyService?: ProjectAutonomousSuggestionPolicyService } = {}) {
    this.policyService = options.policyService ?? new ProjectAutonomousSuggestionPolicyService();
  }

  async evaluateAndGenerate(
    input: ProjectAutonomousSuggestionCoordinatorInput,
  ): Promise<ProjectAutonomousSuggestionEvaluationResult> {
    const evaluation = this.policyService.evaluate({
      policies: input.policies,
      project: input.project,
      context: input.context,
      event: input.event,
      planningState: input.planningState,
    });
    if (!evaluation.allowed || !input.context) {
      this.policyService.recordEvaluation(input.policies, evaluation);
      return evaluation;
    }

    try {
      const result = await input.suggestionService.generateSuggestions(
        input.suggestionCollections,
        input.context as ProjectBacklogSuggestionProjectContext,
        {
          backlogCollections: input.backlogCollections,
          activeWork: input.activeWork,
          blockedWork: input.blockedWork,
          developmentRequests: input.developmentRequests,
          repositorySummary: input.repositorySummary,
        },
        input.provider,
        evaluation.policy.maxSuggestionsPerEvaluation,
      );
      const recordedResult = result.ok
        ? this.policyService.createGeneratedResult(evaluation, result.candidates)
        : this.policyService.createFailureResult(evaluation, "GenerationUnavailable");
      this.policyService.recordEvaluation(input.policies, recordedResult);
      return recordedResult;
    } catch {
      const recordedResult = this.policyService.createFailureResult(evaluation, "GenerationUnavailable");
      this.policyService.recordEvaluation(input.policies, recordedResult);
      return recordedResult;
    }
  }
}
