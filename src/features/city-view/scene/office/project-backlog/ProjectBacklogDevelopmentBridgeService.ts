import type { ActiveProjectCompanyContext } from "../project-company-binding/ProjectCompanyBindingTypes";
import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import {
  canCreateExternalProjectDevelopmentRequestDraft,
  createExternalProjectDevelopmentRequestDraft,
} from "../external-development-requests/ExternalProjectDevelopmentRequestService";
import type { ExternalProjectDevelopmentRequestDraft } from "../external-development-requests/ExternalProjectDevelopmentRequestTypes";
import {
  canCreateExternalProjectAdosRunPreparation,
  createExternalProjectAdosRunPreparation,
} from "../external-ados-run-preparation/ExternalProjectAdosRunPreparationService";
import type { ExternalProjectAdosRunPreparation } from "../external-ados-run-preparation/ExternalProjectAdosRunPreparationTypes";
import type { ExternalProjectAdosExecution } from "../external-ados-execution/ExternalProjectAdosExecutionTypes";
import type { ExternalProjectAdosRunStatus } from "../external-ados-run-status/ExternalProjectAdosRunStatusTypes";
import type { ProjectBacklogTask } from "./ProjectBacklogTypes";

export type ProjectBacklogDevelopmentEligibilityReason =
  | "NoTaskSelected"
  | "ProjectUnavailable"
  | "ProjectMismatch"
  | "TaskNotReady"
  | "TaskContentMissing"
  | "TaskAlreadyAssociated"
  | "ConflictingActiveExecution"
  | "DevelopmentRequestUnavailable"
  | "PreparationUnavailable";

export type ProjectBacklogDevelopmentPreview = {
  projectId: string;
  projectName: string;
  companyName?: string;
  taskId?: string;
  taskTitle?: string;
  taskDescription?: string;
  priority?: ProjectBacklogTask["priority"];
  planningStatus?: ProjectBacklogTask["status"];
  eligible: boolean;
  reason?: ProjectBacklogDevelopmentEligibilityReason;
  hasActiveProjectRun: boolean;
  associatedDevelopmentRequestId?: string;
  associatedPreparationId?: string;
  associatedExecutionRunId?: string;
  executionStage?: string;
};

export type CreateProjectBacklogDevelopmentRequestInput = {
  project: ProjectPortalProject;
  task?: ProjectBacklogTask;
  activeProjectCompanyContext?: ActiveProjectCompanyContext;
  existingDraft?: ExternalProjectDevelopmentRequestDraft;
  existingPreparation?: ExternalProjectAdosRunPreparation;
  existingExecution?: ExternalProjectAdosExecution;
  existingRunStatus?: ExternalProjectAdosRunStatus;
  now?: string;
};

export type ProjectBacklogDevelopmentRequestOutcome =
  | {
    ok: true;
    draft: ExternalProjectDevelopmentRequestDraft;
    preparation: ExternalProjectAdosRunPreparation;
    taskPatch: Pick<ProjectBacklogTask, "developmentRequestId" | "executionPreparationId" | "sourceBacklogTaskId">;
  }
  | { ok: false; reason: ProjectBacklogDevelopmentEligibilityReason };

export class ProjectBacklogDevelopmentBridgeService {
  createPreview(input: CreateProjectBacklogDevelopmentRequestInput): ProjectBacklogDevelopmentPreview {
    const task = input.task;
    const reason = this.getEligibilityReason(input);
    return {
      projectId: input.project.id,
      projectName: input.project.name,
      companyName: input.activeProjectCompanyContext?.companyName ?? input.project.ownerCompany,
      taskId: task?.id,
      taskTitle: task?.title,
      taskDescription: task?.description,
      priority: task?.priority,
      planningStatus: task?.status,
      eligible: !reason,
      reason,
      hasActiveProjectRun: isActiveRunStatus(input.existingRunStatus) || Boolean(input.existingExecution),
      associatedDevelopmentRequestId: task?.developmentRequestId,
      associatedPreparationId: task?.executionPreparationId,
      associatedExecutionRunId: task?.executionRunId,
      executionStage: input.existingRunStatus?.stage ?? input.existingExecution?.status,
    };
  }

  createRequestAndPreparation(
    input: CreateProjectBacklogDevelopmentRequestInput,
  ): ProjectBacklogDevelopmentRequestOutcome {
    const reason = this.getEligibilityReason(input);
    if (reason && reason !== "TaskAlreadyAssociated") return { ok: false, reason };
    if (!input.task) return { ok: false, reason: "NoTaskSelected" };

    if (reason === "TaskAlreadyAssociated") {
      if (!input.existingDraft || !input.existingPreparation) return { ok: false, reason: "PreparationUnavailable" };
      return {
        ok: true,
        draft: input.existingDraft,
        preparation: input.existingPreparation,
        taskPatch: {
          sourceBacklogTaskId: input.task.id,
          developmentRequestId: input.existingDraft.id,
          executionPreparationId: input.existingPreparation.id,
        },
      };
    }

    const requestText = createBacklogDevelopmentRequestText(input.task);
    const draft = createExternalProjectDevelopmentRequestDraft({
      project: input.project,
      activeProjectCompanyContext: input.activeProjectCompanyContext,
      requestText,
      sourceBacklogTaskId: input.task.id,
      now: input.now,
    });
    if (!canCreateExternalProjectAdosRunPreparation(draft)) {
      return { ok: false, reason: "PreparationUnavailable" };
    }
    const preparation = createExternalProjectAdosRunPreparation({
      projectId: input.project.id,
      developmentRequestDraft: draft,
      now: input.now,
    });
    if (!preparation) return { ok: false, reason: "PreparationUnavailable" };

    return {
      ok: true,
      draft: {
        ...draft,
        requirementsArtifactContent: appendPreparationIdentity(draft.requirementsArtifactContent, preparation.id),
      },
      preparation: {
        ...preparation,
        requirementsFileContent: appendPreparationIdentity(preparation.requirementsFileContent, preparation.id),
      },
      taskPatch: {
        sourceBacklogTaskId: input.task.id,
        developmentRequestId: draft.id,
        executionPreparationId: preparation.id,
      },
    };
  }

  private getEligibilityReason(
    input: CreateProjectBacklogDevelopmentRequestInput,
  ): ProjectBacklogDevelopmentEligibilityReason | undefined {
    const task = input.task;
    if (!task) return "NoTaskSelected";
    if (!input.project.enabled || !canCreateExternalProjectDevelopmentRequestDraft(input.project)) {
      return "ProjectUnavailable";
    }
    if (task.projectId !== input.project.id) return "ProjectMismatch";
    if (!task.title.trim() || !task.description.trim()) return "TaskContentMissing";
    if (task.developmentRequestId || task.executionPreparationId || task.executionRunId) return "TaskAlreadyAssociated";
    if (task.status !== "ready") return "TaskNotReady";
    if (isActiveRunStatus(input.existingRunStatus) || input.existingExecution) return "ConflictingActiveExecution";
    return undefined;
  }
}

export function createProjectBacklogDevelopmentAssociationKey(projectId: string, backlogTaskId: string) {
  return `${projectId}:backlog-task:${backlogTaskId}`;
}

export function createBacklogDevelopmentRequestText(task: ProjectBacklogTask) {
  return [
    `# ${task.title}`,
    "",
    `Source backlog task id: ${task.id}`,
    `Source backlog task project id: ${task.projectId}`,
    `Priority: ${task.priority}`,
    `Planning status at request: ${task.status}`,
    "",
    "## Task Description",
    "",
    task.description,
  ].join("\n");
}

function appendPreparationIdentity(content: string | undefined, preparationId: string) {
  const base = content ?? "";
  if (base.includes(`Prepared execution id: ${preparationId}`)) return base;
  return `${base}\nPrepared execution id: ${preparationId}`;
}

function isActiveRunStatus(status: ExternalProjectAdosRunStatus | undefined) {
  return Boolean(status && (
    status.stage === "Prepared" ||
    status.stage === "Started" ||
    status.stage === "Blocked" ||
    status.stage === "TimedOut"
  ));
}
