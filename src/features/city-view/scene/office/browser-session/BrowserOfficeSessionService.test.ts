import { describe, expect, it } from "vitest";

import { createProjectPortalState } from "../OfficeProjectPortalRegistry";
import type { ProjectRegistryEntry } from "../project-registry/ProjectRegistryTypes";
import { BrowserOfficeSessionService } from "./BrowserOfficeSessionService";
import {
  BROWSER_OFFICE_SESSION_SCHEMA_VERSION,
  BROWSER_OFFICE_SESSION_STORAGE_KEY,
  type BrowserOfficeSessionStorage,
} from "./BrowserOfficeSessionTypes";

describe("BrowserOfficeSessionService", () => {
  it("saves and restores restorable office session state", () => {
    const storage = createMemoryStorage();
    const service = new BrowserOfficeSessionService({
      storage,
      now: () => "2026-08-17T00:00:00.000Z",
    });
    const source = createProjectPortalState({ browserOfficeSessionService: false });
    source.projectRegistryEntries.push(createExternalProjectEntry());
    source.projects.push({
      id: "external-crm",
      name: "External CRM",
      status: "Active",
      type: "CRM",
      enabled: true,
      description: "Customer workflow system.",
      linkedServices: [],
      nextAction: {
        label: "Review project workspace",
        enabled: true,
        placeholder: true,
      },
      ownerCompany: "External Co.",
      localRepositoryLabel: "Bound (local)",
      repositoryIdentity: {
        provider: "github",
        owner: "external",
        name: "crm",
        url: "https://github.com/external/crm",
        defaultBranch: "main",
        localPath: "C:/worktrees/external-crm",
        connectionState: "Configured",
      },
    });
    source.selectedProjectId = "external-crm";
    source.selectedProjectDashboardProjectId = "daily-proof";
    source.selectedProjectDashboardActiveWorkIndex = 1;
    source.selectedBacklogProjectId = "external-crm";
    source.selectedBacklogTaskId = "external-crm:backlog:1";
    source.selectedBacklogTaskIndex = 0;
    source.selectedWorkSessionId = "session-1";
    source.employees = [{
      id: "gpt-engineer",
      name: "GPT Engineer",
      role: "Engineer",
      status: "Working",
      avatarColor: "#2563eb",
      capabilities: ["Coding"],
      description: "Restored employee",
      assignedTaskId: "task-1",
      currentProjectId: "daily-proof",
    }];
    source.taskCollections["daily-proof"] = {
      projectId: "daily-proof",
      tasks: [{
        id: "task-1",
        title: "Restore active work",
        description: "Task",
        status: "In Progress",
        priority: "High",
        projectId: "daily-proof",
        assignee: "GPT Engineer",
        assigneeId: "gpt-engineer",
        createdAt: "2026-08-16T00:00:00.000Z",
        updatedAt: "2026-08-17T00:00:00.000Z",
      }],
    };
    source.workSessions["task-1"] = [{
      id: "session-1",
      taskId: "task-1",
      projectId: "daily-proof",
      employeeId: "gpt-engineer",
      employeeName: "GPT Engineer",
      provider: "placeholder",
      status: "running",
      startedAt: "2026-08-17T00:00:00.000Z",
    }];
    source.externalProjectDevelopmentRequestDrafts["external-crm"] = {
      id: "external-crm:external-development-request-draft",
      projectId: "external-crm",
      projectName: "External CRM",
      companyName: "External Co.",
      status: "Started",
      title: "Add CRM audit logging",
      summary: "Add CRM audit logging with durable request metadata.",
      requestText: "Add CRM audit logging with durable request metadata.",
      targetProjectIdentity: "external-crm (External CRM; github:external/crm)",
      localProjectPath: "C:/worktrees/external-crm",
      requirementsArtifactPath: ".aiverse/external-requests/external-crm/20260825T00000000-requirements.md",
      requirementsArtifactContent: "# Development Request\n\nAdd CRM audit logging with durable request metadata.",
      adosRunId: "external-crm:external-ados-execution:external-crm:external-ados-run-preparation:external-ados-execution-v1",
      repositoryProvider: "github",
      repositoryOwner: "external",
      repositoryName: "crm",
      branchName: "codex/202608250000-add-crm-audit-logging",
      specPath: "specs/202608250000-add-crm-audit-logging/spec.md",
      createdAt: "2026-08-25T00:00:00.000Z",
      updatedAt: "2026-08-25T00:00:00.000Z",
      sideEffectBoundary: "Local draft only.",
    };
    source.externalProjectAdosRunPreparations["external-crm"] = {
      id: "external-crm:external-ados-run-preparation",
      projectId: "external-crm",
      developmentRequestDraftId: "external-crm:external-development-request-draft",
      status: "Prepared",
      featureId: "202608250000-add-crm-audit-logging",
      featureBranch: "codex/130-external-project-ados-run-status",
      authoritativeBaseSha: "7570ef96767957102b992e68b4df87e7d70ce5cb",
      specPath: "specs/130-external-project-ados-run-status/spec.md",
      requirementsFilePath: ".aiverse/external-requests/external-crm/20260825T00000000-requirements.md",
      requirementsPreview: "Add CRM audit logging with durable request metadata.",
      validationCommands: ["npm test", "npx tsc --noEmit"],
      reviewerCommand: "claude -p",
      executionPolicyVersion: 1,
      createdAt: "2026-08-24T00:00:00.000Z",
      updatedAt: "2026-08-24T00:00:00.000Z",
      sideEffectBoundary: "Local preparation only.",
    };
    source.externalProjectAdosExecutions["external-crm"] = {
      id: "external-crm:external-ados-execution:external-crm:external-ados-run-preparation:external-ados-execution-v1",
      projectId: "external-crm",
      preparationId: "external-crm:external-ados-run-preparation",
      developmentRequestDraftId: "external-crm:external-development-request-draft",
      status: "Completed",
      featureId: "202608250000-add-crm-audit-logging",
      featureBranch: "codex/130-external-project-ados-run-status",
      authoritativeBaseSha: "7570ef96767957102b992e68b4df87e7d70ce5cb",
      specPath: "specs/130-external-project-ados-run-status/spec.md",
      requirementsFilePath: ".aiverse/external-requests/external-crm/20260825T00000000-requirements.md",
      repositoryPath: "C:/repo/external-crm",
      worktreePath: "C:/worktrees/external-crm",
      validationCommands: ["npm test", "npx tsc --noEmit"],
      reviewerCommand: "claude -p",
      executionPolicyVersion: 1,
      trustedLocalExecutionApproved: true,
      startedBy: "Local Human",
      startedAt: "2026-08-25T00:00:00.000Z",
      implementerStarted: true,
      validationStarted: false,
      reviewStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      publishStarted: false,
      mergeStarted: false,
      deployStarted: false,
      evidence: {
        providerId: "claude",
        agentId: "Claude",
        role: "Implementer",
        commandDisplay: "claude --dangerously-skip-permissions -p {{prompt}}",
        workingDirectory: "C:/worktrees/external-crm",
        started: true,
        completed: true,
        timedOut: false,
        cancelled: false,
        exitCode: 0,
        durationMs: 25,
        stdoutSummary: "done",
        stderrSummary: "",
        outputTruncated: false,
      },
      rulesVersion: "external-ados-execution-v1",
    };
    source.externalProjectAdosExecutionResults["external-crm"] = {
      id: "external-crm:external-ados-execution-result:external-crm:external-ados-run-preparation:external-ados-execution-v1",
      projectId: "external-crm",
      preparationId: "external-crm:external-ados-run-preparation",
      executionId: "external-crm:external-ados-execution:external-crm:external-ados-run-preparation:external-ados-execution-v1",
      status: "Completed",
      reasonCodes: ["EXTERNAL_ADOS_EXECUTION_STARTED"],
      started: true,
      duplicateExistingExecution: false,
      implementerStarted: true,
      validationStarted: false,
      reviewStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      publishStarted: false,
      mergeStarted: false,
      deployStarted: false,
      resultAt: "2026-08-25T00:00:00.000Z",
      rulesVersion: "external-ados-execution-v1",
    };
    source.externalProjectAdosRunStatuses["external-crm"] = {
      id: "external-crm:external-ados-run-status:external-ados-run-status-v1",
      projectId: "external-crm",
      stage: "Completed",
      status: "Completed",
      source: "result",
      preparationId: "external-crm:external-ados-run-preparation",
      executionId: "external-crm:external-ados-execution:external-crm:external-ados-run-preparation:external-ados-execution-v1",
      reasonCodes: ["EXTERNAL_ADOS_EXECUTION_STARTED"],
      featureBranch: "codex/130-external-project-ados-run-status",
      worktreePath: "C:/worktrees/external-crm",
      updatedAt: "2026-08-25T00:00:00.000Z",
      validationStarted: false,
      reviewStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      publishStarted: false,
      mergeStarted: false,
      deployStarted: false,
      rulesVersion: "external-ados-run-status-v1",
    };
    source.projectBacklogCollections["external-crm"] = {
      projectId: "external-crm",
      tasks: [{
        id: "external-crm:backlog:1",
        projectId: "external-crm",
        title: "Plan CRM backlog",
        description: "Preserve the operator-entered backlog request.",
        status: "ready",
        priority: "high",
        createdAt: "2026-08-25T00:00:00.000Z",
        updatedAt: "2026-08-25T00:05:00.000Z",
      }],
    };
    source.projectAutonomyPolicies["external-crm"] = {
      projectId: "external-crm",
      enabled: true,
      allowedPriorities: ["high"],
      maxConcurrentExecutions: 1,
      requireNoActiveRun: true,
      allowedTaskStatuses: ["ready"],
      updatedAt: "2026-08-25T00:06:00.000Z",
      updatedByOperator: true,
      lastEvaluationReason: "ActiveRunExists",
    };
    source.reviewerRuntimeCollections["external-crm"] = {
      projectId: "external-crm",
      runtimes: [{
        projectId: "external-crm",
        status: "Completed",
        startedAt: "2026-08-25T00:10:00.000Z",
      } as unknown as typeof source.reviewerRuntimeCollections[string]["runtimes"][number]],
      runtimeCount: 1,
      rulesVersion: "codex-reviewer-v1",
    };
    source.implementerRuntimeCollections["external-crm"] = {
      projectId: "external-crm",
      runtimes: [{
        projectId: "external-crm",
        status: "Completed",
        startedAt: "2026-08-25T00:05:00.000Z",
      } as unknown as typeof source.implementerRuntimeCollections[string]["runtimes"][number]],
      runtimeCount: 1,
      rulesVersion: "claude-implementer-v1",
    };
    source.reviewFixRuntimeCollections["external-crm"] = {
      projectId: "external-crm",
      runtimes: [{
        projectId: "external-crm",
        status: "Completed",
        startedAt: "2026-08-25T00:15:00.000Z",
      } as unknown as typeof source.reviewFixRuntimeCollections[string]["runtimes"][number]],
      runtimeCount: 1,
      rulesVersion: "review-fix-runtime-v1",
    };
    source.validationRuntimeCollections["external-crm"] = {
      projectId: "external-crm",
      runtimes: [{
        projectId: "external-crm",
        status: "Completed",
        startedAt: "2026-08-25T00:20:00.000Z",
      } as unknown as typeof source.validationRuntimeCollections[string]["runtimes"][number]],
      runtimeCount: 1,
      rulesVersion: "validation-runtime-v1",
    };

    expect(service.saveState(source)).toBe(true);

    const restored = service.restoreState(createProjectPortalState({ browserOfficeSessionService: false }));

    expect(restored.selectedProjectId).toBe("external-crm");
    expect(restored.selectedProjectIndex).toBe(3);
    expect(restored.selectedProjectDashboardProjectId).toBe("daily-proof");
    expect(restored.selectedProjectDashboardActiveWorkIndex).toBe(1);
    expect(restored.selectedBacklogProjectId).toBe("external-crm");
    expect(restored.selectedBacklogTaskId).toBe("external-crm:backlog:1");
    expect(restored.selectedBacklogTaskIndex).toBe(0);
    expect(restored.selectedWorkSessionId).toBe("session-1");
    expect(restored.projectRegistryEntries.some((entry) => entry.id === "external-crm")).toBe(true);
    expect(restored.projects.some((project) => project.id === "external-crm")).toBe(true);
    expect(restored.repositoryMappings).toContainEqual({
      projectId: "external-crm",
      sourceId: "github:external/crm",
      repository: {
        owner: "external",
        name: "crm",
        url: "https://github.com/external/crm",
        visibility: "public",
      },
      enabled: true,
      createdAt: "2026-08-24T00:00:00.000Z",
    });
    expect(restored.taskCollections["daily-proof"]?.tasks[0]?.status).toBe("In Progress");
    expect(restored.employees[0]).toMatchObject({ id: "gpt-engineer", status: "Working" });
    expect(restored.externalProjectDevelopmentRequestDrafts["external-crm"]).toMatchObject({
      projectId: "external-crm",
      status: "Started",
      requestText: "Add CRM audit logging with durable request metadata.",
      requirementsArtifactPath: ".aiverse/external-requests/external-crm/20260825T00000000-requirements.md",
      adosRunId: "external-crm:external-ados-execution:external-crm:external-ados-run-preparation:external-ados-execution-v1",
    });
    expect(restored.externalProjectAdosRunPreparations["external-crm"]).toMatchObject({
      projectId: "external-crm",
      status: "Prepared",
      featureId: "202608250000-add-crm-audit-logging",
      requirementsFilePath: ".aiverse/external-requests/external-crm/20260825T00000000-requirements.md",
      featureBranch: "codex/130-external-project-ados-run-status",
      reviewerCommand: "claude -p",
    });
    expect(restored.externalProjectAdosExecutions["external-crm"]).toMatchObject({
      projectId: "external-crm",
      status: "Completed",
      featureId: "202608250000-add-crm-audit-logging",
      requirementsFilePath: ".aiverse/external-requests/external-crm/20260825T00000000-requirements.md",
      worktreePath: "C:/worktrees/external-crm",
      reviewStarted: false,
      githubMutationStarted: false,
    });
    expect(restored.externalProjectAdosExecutionResults["external-crm"]).toMatchObject({
      status: "Completed",
      started: true,
      publishStarted: false,
      mergeStarted: false,
      deployStarted: false,
    });
    expect(restored.externalProjectAdosRunStatuses["external-crm"]).toMatchObject({
      stage: "Completed",
      source: "result",
      reasonCodes: ["EXTERNAL_ADOS_EXECUTION_STARTED"],
      validationStarted: false,
      reviewStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      publishStarted: false,
      mergeStarted: false,
      deployStarted: false,
    });
    expect(restored.projectBacklogCollections["external-crm"].tasks[0]).toMatchObject({
      projectId: "external-crm",
      title: "Plan CRM backlog",
      description: "Preserve the operator-entered backlog request.",
      status: "ready",
      priority: "high",
    });
    expect(restored.projectAutonomyPolicies["external-crm"]).toMatchObject({
      projectId: "external-crm",
      enabled: true,
      allowedPriorities: ["high"],
      maxConcurrentExecutions: 1,
      requireNoActiveRun: true,
      allowedTaskStatuses: ["ready"],
      updatedByOperator: true,
      lastEvaluationReason: "ActiveRunExists",
    });
    expect(restored.reviewerRuntimeCollections["external-crm"]?.runtimes[0]).toMatchObject({
      projectId: "external-crm",
      status: "Completed",
      startedAt: "2026-08-25T00:10:00.000Z",
    });
    expect(restored.implementerRuntimeCollections["external-crm"]?.runtimes[0]).toMatchObject({
      projectId: "external-crm",
      status: "Completed",
      startedAt: "2026-08-25T00:05:00.000Z",
    });
    expect(restored.reviewFixRuntimeCollections["external-crm"]?.runtimes[0]).toMatchObject({
      projectId: "external-crm",
      status: "Completed",
      startedAt: "2026-08-25T00:15:00.000Z",
    });
    expect(restored.validationRuntimeCollections["external-crm"]?.runtimes[0]).toMatchObject({
      projectId: "external-crm",
      status: "Completed",
      startedAt: "2026-08-25T00:20:00.000Z",
    });
    expect(restored.workSessions["task-1"]?.[0]?.id).toBe("session-1");
  });

  it("ignores missing, malformed, and wrong-version saved state", () => {
    const storage = createMemoryStorage();
    const service = new BrowserOfficeSessionService({ storage });

    expect(service.restoreState(createProjectPortalState({ browserOfficeSessionService: false })).workSessions).toEqual({});

    storage.setItem(BROWSER_OFFICE_SESSION_STORAGE_KEY, "{not json");
    expect(service.restoreState(createProjectPortalState({ browserOfficeSessionService: false })).workSessions).toEqual({});

    storage.setItem(BROWSER_OFFICE_SESSION_STORAGE_KEY, JSON.stringify({
      version: "old-version",
      savedAt: "2026-08-17T00:00:00.000Z",
      candidateTaskCollections: {},
      candidateAssignmentCollections: {},
      candidatePromotionReviewCollections: {},
      candidatePromotionDecisionRecords: {},
      candidateProjectTaskPromotionResultCollections: {},
      taskCollections: {},
      employees: [],
      confirmedEmployeeAssignmentRecords: {},
      confirmedEmployeeAssignmentResultCollections: {},
      preparedWorkSessionRecords: {},
      preparedWorkSessionResultCollections: {},
      activeWorkSessionStartResultCollections: {},
      workSessions: { "task-1": [] },
    }));
    expect(service.restoreState(createProjectPortalState({ browserOfficeSessionService: false })).workSessions).toEqual({});

    storage.setItem(BROWSER_OFFICE_SESSION_STORAGE_KEY, JSON.stringify({
      version: BROWSER_OFFICE_SESSION_SCHEMA_VERSION,
      savedAt: "2026-08-17T00:00:00.000Z",
      candidateTaskCollections: {},
      candidateAssignmentCollections: {},
      candidatePromotionReviewCollections: {},
      candidatePromotionDecisionRecords: {},
      candidateProjectTaskPromotionResultCollections: {},
      taskCollections: {},
      employees: [],
      confirmedEmployeeAssignmentRecords: {},
      confirmedEmployeeAssignmentResultCollections: {},
      preparedWorkSessionRecords: {},
      preparedWorkSessionResultCollections: {},
      activeWorkSessionStartResultCollections: {},
      workSessions: { "task-1": { id: "not-an-array" } },
    }));
    expect(service.restoreState(createProjectPortalState({ browserOfficeSessionService: false })).workSessions).toEqual({});

    storage.setItem(BROWSER_OFFICE_SESSION_STORAGE_KEY, JSON.stringify({
      version: BROWSER_OFFICE_SESSION_SCHEMA_VERSION,
      savedAt: "2026-08-17T00:00:00.000Z",
      candidateTaskCollections: {},
      candidateAssignmentCollections: {},
      candidatePromotionReviewCollections: {},
      candidatePromotionDecisionRecords: {},
      candidateProjectTaskPromotionResultCollections: {},
      taskCollections: { "daily-proof": { projectId: "daily-proof", tasks: "not-an-array" } },
      employees: [],
      confirmedEmployeeAssignmentRecords: {},
      confirmedEmployeeAssignmentResultCollections: {},
      preparedWorkSessionRecords: {},
      preparedWorkSessionResultCollections: {},
      activeWorkSessionStartResultCollections: {},
      workSessions: {},
    }));
    expect(service.restoreState(createProjectPortalState({ browserOfficeSessionService: false })).taskCollections).toEqual({});
  });

  it("fails open when browser storage throws", () => {
    const service = new BrowserOfficeSessionService({
      storage: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("blocked");
        },
      },
    });

    const state = createProjectPortalState({ browserOfficeSessionService: false });

    expect(() => service.restoreState(state)).not.toThrow();
    expect(service.saveState(state)).toBe(false);
  });

  it("ignores malformed persisted external ADOS run statuses", () => {
    const storage = createMemoryStorage();
    storage.setItem(BROWSER_OFFICE_SESSION_STORAGE_KEY, JSON.stringify({
      version: BROWSER_OFFICE_SESSION_SCHEMA_VERSION,
      savedAt: "2026-08-25T00:00:00.000Z",
      candidateTaskCollections: {},
      candidateAssignmentCollections: {},
      candidatePromotionReviewCollections: {},
      candidatePromotionDecisionRecords: {},
      candidateProjectTaskPromotionResultCollections: {},
      taskCollections: {},
      employees: [],
      confirmedEmployeeAssignmentRecords: {},
      confirmedEmployeeAssignmentResultCollections: {},
      preparedWorkSessionRecords: {},
      preparedWorkSessionResultCollections: {},
      activeWorkSessionStartResultCollections: {},
      externalProjectAdosRunStatuses: {
        "external-crm": {
          id: "external-crm:external-ados-run-status:external-ados-run-status-v1",
          projectId: "external-crm",
          stage: "Failed",
          status: "Failed",
          source: "result",
          reasonCodes: ["EXTERNAL_ADOS_EXECUTION_SPAWN_FAILED"],
          updatedAt: "2026-08-25T00:00:00.000Z",
          validationStarted: true,
          reviewStarted: false,
          repositoryMutationStarted: false,
          githubMutationStarted: false,
          publishStarted: false,
          mergeStarted: false,
          deployStarted: false,
          rulesVersion: "external-ados-run-status-v1",
        },
      },
      workSessions: {},
    }));

    const restored = new BrowserOfficeSessionService({ storage }).restoreState(createProjectPortalState({ browserOfficeSessionService: false }));

    expect(restored.externalProjectAdosRunStatuses).toEqual({});
  });

  it("ignores malformed persisted project registry entries while restoring defaults", () => {
    const storage = createMemoryStorage();
    storage.setItem(BROWSER_OFFICE_SESSION_STORAGE_KEY, JSON.stringify({
      version: BROWSER_OFFICE_SESSION_SCHEMA_VERSION,
      savedAt: "2026-08-24T00:00:00.000Z",
      selectedProjectId: "external-crm",
      selectedProjectDashboardActiveWorkIndex: 0,
      projectRegistryEntries: [
        { id: "missing-required-fields" },
        {
          ...createExternalProjectEntry(),
          id: "",
        },
      ],
      candidateTaskCollections: {},
      candidateAssignmentCollections: {},
      candidatePromotionReviewCollections: {},
      candidatePromotionDecisionRecords: {},
      candidateProjectTaskPromotionResultCollections: {},
      taskCollections: {},
      employees: [],
      confirmedEmployeeAssignmentRecords: {},
      confirmedEmployeeAssignmentResultCollections: {},
      preparedWorkSessionRecords: {},
      preparedWorkSessionResultCollections: {},
      activeWorkSessionStartResultCollections: {},
      workSessions: {},
    }));

    const restored = new BrowserOfficeSessionService({ storage }).restoreState(createProjectPortalState({ browserOfficeSessionService: false }));

    expect(restored.projectRegistryEntries.map((entry) => entry.id)).toEqual(["daily-proof", "portfolio", "ai-lab"]);
    expect(restored.projects.map((project) => project.id)).toEqual(["daily-proof", "portfolio", "ai-lab"]);
    expect(restored.selectedProjectIndex).toBe(0);
  });

  it("restores project registry entries as independent copies", () => {
    const storage = createMemoryStorage();
    const service = new BrowserOfficeSessionService({ storage, now: () => "2026-08-24T00:00:00.000Z" });
    const source = createProjectPortalState({ browserOfficeSessionService: false });
    source.projectRegistryEntries.push(createExternalProjectEntry());

    expect(service.saveState(source)).toBe(true);

    const firstRestore = service.restoreState(createProjectPortalState({ browserOfficeSessionService: false }));
    const restoredEntry = firstRestore.projectRegistryEntries.find((entry) => entry.id === "external-crm");
    const restoredProject = firstRestore.projects.find((project) => project.id === "external-crm");
    if (!restoredEntry || !restoredProject?.repositoryIdentity) throw new Error("expected restored external project");

    restoredEntry.displayName = "Mutated";
    restoredEntry.owner.companyName = "Mutated Co.";
    restoredProject.repositoryIdentity.owner = "mutated";

    const secondRestore = service.restoreState(createProjectPortalState({ browserOfficeSessionService: false }));
    const secondEntry = secondRestore.projectRegistryEntries.find((entry) => entry.id === "external-crm");
    const secondProject = secondRestore.projects.find((project) => project.id === "external-crm");

    expect(secondEntry?.displayName).toBe("External CRM");
    expect(secondEntry?.owner.companyName).toBe("External Co.");
    expect(secondProject?.repositoryIdentity?.owner).toBe("external");
  });

  it("fails open when default browser storage access throws", () => {
    const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: Object.defineProperty({}, "localStorage", {
        get: () => {
          throw new Error("blocked");
        },
      }),
    });

    try {
      const service = new BrowserOfficeSessionService();
      const state = createProjectPortalState({ browserOfficeSessionService: false });

      expect(() => service.restoreState(state)).not.toThrow();
      expect(service.saveState(state)).toBe(false);
    } finally {
      if (previousWindow) {
        Object.defineProperty(globalThis, "window", previousWindow);
      } else {
        Reflect.deleteProperty(globalThis, "window");
      }
    }
  });

  it("persists project-scoped backlog suggestion state without cross-project leakage", () => {
    const storage = createMemoryStorage();
    const service = new BrowserOfficeSessionService({
      storage,
      now: () => "2026-08-31T00:00:00.000Z",
    });
    const source = createProjectPortalState({ browserOfficeSessionService: false });
    source.projectBacklogSuggestionCollections = {
      "daily-proof": {
        projectId: "daily-proof",
        candidates: [{
          id: "daily-proof:suggestion:1",
          projectId: "daily-proof",
          title: "Add Daily Proof backlog filters",
          description: "Persist planning filters for Daily Proof.",
          sourceContextSummary: "Daily Proof; 1 backlog",
          generatedAt: "2026-08-31T00:00:00.000Z",
          updatedAt: "2026-08-31T00:00:00.000Z",
          status: "accepted",
          acceptedBacklogTaskId: "daily-proof:backlog:1",
        }],
      },
      "external-crm": {
        projectId: "external-crm",
        candidates: [{
          id: "external-crm:suggestion:1",
          projectId: "external-crm",
          title: "Add CRM sync notes",
          description: "Explain CRM sync failures.",
          sourceContextSummary: "External CRM; 0 backlog",
          generatedAt: "2026-08-31T00:00:00.000Z",
          updatedAt: "2026-08-31T00:00:00.000Z",
          status: "rejected",
        }],
      },
      "contaminated": {
        projectId: "contaminated",
        candidates: [{
          id: "leak",
          projectId: "daily-proof",
          title: "Wrong project",
          description: "Wrong project candidate.",
          sourceContextSummary: "bad",
          generatedAt: "2026-08-31T00:00:00.000Z",
          updatedAt: "2026-08-31T00:00:00.000Z",
          status: "proposed",
        }],
      },
    };
    source.selectedBacklogSuggestionId = "daily-proof:suggestion:1";

    expect(service.saveState(source)).toBe(true);

    const restored = service.restoreState(createProjectPortalState({ browserOfficeSessionService: false }));

    expect(restored.selectedBacklogSuggestionId).toBe("daily-proof:suggestion:1");
    expect(restored.projectBacklogSuggestionCollections["daily-proof"].candidates[0].status).toBe("accepted");
    expect(restored.projectBacklogSuggestionCollections["external-crm"].candidates[0].status).toBe("rejected");
    expect(restored.projectBacklogSuggestionCollections["contaminated"].candidates).toEqual([]);
  });

  it("persists valid project autonomy policies and drops malformed or cross-project policies", () => {
    const storage = createMemoryStorage();
    const service = new BrowserOfficeSessionService({
      storage,
      now: () => "2026-09-01T00:00:00.000Z",
    });
    const source = createProjectPortalState({ browserOfficeSessionService: false });
    source.projectAutonomyPolicies = {
      "daily-proof": {
        projectId: "daily-proof",
        enabled: true,
        allowedPriorities: ["urgent", "high"],
        maxConcurrentExecutions: 1,
        requireNoActiveRun: true,
        allowedTaskStatuses: ["ready"],
        updatedAt: "2026-09-01T00:00:00.000Z",
        updatedByOperator: true,
      },
      "wrong-key": {
        projectId: "other-project",
        enabled: true,
        allowedPriorities: ["urgent"],
        maxConcurrentExecutions: 1,
        requireNoActiveRun: true,
        allowedTaskStatuses: ["ready"],
        updatedAt: "2026-09-01T00:00:00.000Z",
        updatedByOperator: true,
      },
      "bad-concurrency": {
        projectId: "bad-concurrency",
        enabled: true,
        allowedPriorities: ["urgent"],
        maxConcurrentExecutions: 99,
        requireNoActiveRun: true,
        allowedTaskStatuses: ["ready"],
        updatedAt: "2026-09-01T00:00:00.000Z",
        updatedByOperator: true,
      },
    };

    expect(service.saveState(source)).toBe(true);

    const restored = service.restoreState(createProjectPortalState({ browserOfficeSessionService: false }));

    expect(restored.projectAutonomyPolicies["daily-proof"]).toMatchObject({
      projectId: "daily-proof",
      enabled: true,
      allowedPriorities: ["urgent", "high"],
    });
    expect(restored.projectAutonomyPolicies["wrong-key"]).toBeUndefined();
    expect(restored.projectAutonomyPolicies["bad-concurrency"]).toBeUndefined();
  });

  it("persists Auto Suggestions policies and drops malformed or cross-project records", () => {
    const storage = createMemoryStorage();
    const service = new BrowserOfficeSessionService({
      storage,
      now: () => "2026-09-02T00:00:00.000Z",
    });
    const source = createProjectPortalState({ browserOfficeSessionService: false });
    source.projectAutonomousSuggestionPolicies = {
      "daily-proof": {
        projectId: "daily-proof",
        enabled: true,
        maxSuggestionsPerEvaluation: 1,
        cooldownMs: 900000,
        requireNoActiveExecution: true,
        requireNoPendingReadyTask: true,
        requireNoExistingEligibleSuggestion: true,
        minimumPlanningCapacity: 1,
        maxUnresolvedPlanningItems: 10,
        updatedAt: "2026-09-02T00:00:00.000Z",
        updatedByOperator: true,
        lastEvaluation: {
          evaluatedAt: "2026-09-02T00:01:00.000Z",
          eventId: "event-1",
          eventType: "explicit-evaluation",
          latestResultText: "Generated 1 suggestion",
          reason: "Generated",
          generatedCount: 1,
          skippedCount: 0,
          providerInvoked: true,
          lastAutomaticGenerationAt: "2026-09-02T00:01:00.000Z",
          lastGeneratedSuggestionId: "daily-proof:suggestion:1",
          evaluatedEventIds: ["event-1"],
        },
      },
      "wrong-key": {
        projectId: "other-project",
        enabled: true,
        maxSuggestionsPerEvaluation: 1,
        cooldownMs: 900000,
        requireNoActiveExecution: true,
        requireNoPendingReadyTask: true,
        requireNoExistingEligibleSuggestion: true,
        minimumPlanningCapacity: 1,
        maxUnresolvedPlanningItems: 10,
        updatedAt: "2026-09-02T00:00:00.000Z",
        updatedByOperator: true,
      },
      "bad-unbounded": {
        projectId: "bad-unbounded",
        enabled: true,
        maxSuggestionsPerEvaluation: 999,
        cooldownMs: 1,
        requireNoActiveExecution: true,
        requireNoPendingReadyTask: true,
        requireNoExistingEligibleSuggestion: true,
        minimumPlanningCapacity: 1,
        maxUnresolvedPlanningItems: 10,
        updatedAt: "2026-09-02T00:00:00.000Z",
        updatedByOperator: true,
      },
    };

    expect(service.saveState(source)).toBe(true);

    const restored = service.restoreState(createProjectPortalState({ browserOfficeSessionService: false }));

    expect(restored.projectAutonomousSuggestionPolicies["daily-proof"]).toMatchObject({
      projectId: "daily-proof",
      enabled: true,
      maxSuggestionsPerEvaluation: 1,
      lastEvaluation: {
        latestResultText: "Generated 1 suggestion",
        lastGeneratedSuggestionId: "daily-proof:suggestion:1",
      },
    });
    expect(restored.projectAutonomousSuggestionPolicies["wrong-key"]).toBeUndefined();
    expect(restored.projectAutonomousSuggestionPolicies["bad-unbounded"]).toBeUndefined();
  });

  it("persists suggestion acceptance policies and provenance while dropping unsafe policy records", () => {
    const storage = createMemoryStorage();
    const service = new BrowserOfficeSessionService({
      storage,
      now: () => "2026-09-01T00:00:00.000Z",
    });
    const source = createProjectPortalState({ browserOfficeSessionService: false });
    source.projectBacklogSuggestionAcceptancePolicies = {
      "daily-proof": {
        projectId: "daily-proof",
        enabled: true,
        allowedPriorities: ["high"],
        maxAutoAcceptPerEvaluation: 1,
        requireNonDuplicate: true,
        requireValidStructuredSuggestion: true,
        createdTaskInitialStatus: "backlog",
        updatedAt: "2026-09-01T00:00:00.000Z",
        updatedByOperator: true,
        lastEvaluation: {
          evaluatedAt: "2026-09-01T00:00:00.000Z",
          acceptedCount: 1,
          skippedCount: 1,
          latestResultText: "Auto-accepted: high priority allowed",
          acceptedSuggestionIds: ["daily-proof:suggestion:1"],
          skipped: [{ suggestionId: "daily-proof:suggestion:2", title: "Low item", reason: "PriorityNotAllowed" }],
        },
      },
      "wrong-key": {
        projectId: "other-project",
        enabled: true,
        allowedPriorities: ["urgent"],
        maxAutoAcceptPerEvaluation: 1,
        requireNonDuplicate: true,
        requireValidStructuredSuggestion: true,
        createdTaskInitialStatus: "backlog",
        updatedAt: "2026-09-01T00:00:00.000Z",
        updatedByOperator: true,
      },
      "ready-policy": {
        projectId: "ready-policy",
        enabled: true,
        allowedPriorities: ["urgent"],
        maxAutoAcceptPerEvaluation: 1,
        requireNonDuplicate: true,
        requireValidStructuredSuggestion: true,
        createdTaskInitialStatus: "ready" as never,
        updatedAt: "2026-09-01T00:00:00.000Z",
        updatedByOperator: true,
      },
    };
    source.projectBacklogCollections["daily-proof"] = {
      projectId: "daily-proof",
      tasks: [{
        id: "daily-proof:task:1",
        projectId: "daily-proof",
        title: "Accepted task",
        description: "Accepted task description",
        status: "backlog",
        priority: "high",
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z",
        sourceSuggestionId: "daily-proof:suggestion:1",
        suggestionAcceptanceMode: "automatic",
        suggestionAcceptedAt: "2026-09-01T00:00:00.000Z",
      }],
    };

    expect(service.saveState(source)).toBe(true);

    const restored = service.restoreState(createProjectPortalState({ browserOfficeSessionService: false }));

    expect(restored.projectBacklogSuggestionAcceptancePolicies["daily-proof"]).toMatchObject({
      projectId: "daily-proof",
      enabled: true,
      allowedPriorities: ["high"],
      createdTaskInitialStatus: "backlog",
      lastEvaluation: {
        latestResultText: "Auto-accepted: high priority allowed",
        acceptedSuggestionIds: ["daily-proof:suggestion:1"],
      },
    });
    expect(restored.projectBacklogSuggestionAcceptancePolicies["wrong-key"]).toBeUndefined();
    expect(restored.projectBacklogSuggestionAcceptancePolicies["ready-policy"]).toBeUndefined();
    expect(restored.projectBacklogCollections["daily-proof"].tasks[0]).toMatchObject({
      status: "backlog",
      sourceSuggestionId: "daily-proof:suggestion:1",
      suggestionAcceptanceMode: "automatic",
      suggestionAcceptedAt: "2026-09-01T00:00:00.000Z",
    });
  });

  it("loads only current-version snapshots", () => {
    const storage = createMemoryStorage();
    storage.setItem(BROWSER_OFFICE_SESSION_STORAGE_KEY, JSON.stringify({
      version: BROWSER_OFFICE_SESSION_SCHEMA_VERSION,
      savedAt: "2026-08-17T00:00:00.000Z",
      candidateTaskCollections: {},
      candidateAssignmentCollections: {},
      candidatePromotionReviewCollections: {},
      candidatePromotionDecisionRecords: {},
      candidateProjectTaskPromotionResultCollections: {},
      taskCollections: {},
      employees: [],
      confirmedEmployeeAssignmentRecords: {},
      confirmedEmployeeAssignmentResultCollections: {},
      preparedWorkSessionRecords: {},
      preparedWorkSessionResultCollections: {},
      activeWorkSessionStartResultCollections: {},
      workSessions: {},
    }));

    expect(new BrowserOfficeSessionService({ storage }).loadSnapshot()?.version).toBe(BROWSER_OFFICE_SESSION_SCHEMA_VERSION);
  });
});

function createMemoryStorage(): BrowserOfficeSessionStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

function createExternalProjectEntry(): ProjectRegistryEntry {
  return {
    id: "external-crm",
    displayName: "External CRM",
    shortDescription: "Customer workflow system.",
    lifecycleStatus: "Active",
    projectType: "CRM",
    localRepository: {
      connected: true,
      label: "Bound (local)",
    },
    localRepositoryBinding: {
      projectId: "external-crm",
      repositoryPath: "C:/repos/external-crm",
      worktreePath: "C:/worktrees/external-crm",
      branchName: "codex/external-crm",
      specPath: "specs/999-external-crm/spec.md",
      source: "browser-registration",
      boundAt: "2026-08-24T00:00:00.000Z",
    },
    remoteRepository: {
      owner: "external",
      name: "crm",
      url: "https://github.com/external/crm",
      visibility: "public",
    },
    repositoryIdentity: {
      provider: "github",
      owner: "external",
      name: "crm",
      url: "https://github.com/external/crm",
      defaultBranch: "main",
      localPath: "C:/worktrees/external-crm",
      connectionState: "Configured",
    },
    owner: {
      companyName: "External Co.",
    },
    createdAt: "2026-08-24T00:00:00.000Z",
    lastActivityAt: "2026-08-24T00:00:00.000Z",
  };
}
