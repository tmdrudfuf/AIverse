import { describe, expect, it, vi } from "vitest";
import { ProjectAutonomousSuggestionCoordinator } from "./ProjectAutonomousSuggestionCoordinator";
import { ProjectAutonomousSuggestionPolicyService } from "./ProjectAutonomousSuggestionPolicyService";
import type { ProjectAutonomousSuggestionPolicies } from "./ProjectAutonomousSuggestionPolicyTypes";
import type { ProjectBacklogProjectContext } from "./ProjectBacklogService";
import type { ProjectBacklogCollections, ProjectBacklogTask } from "./ProjectBacklogTypes";
import { ProjectBacklogSuggestionService } from "./ProjectBacklogSuggestionService";
import type {
  ProjectBacklogSuggestionCandidate,
  ProjectBacklogSuggestionCollections,
  ProjectBacklogSuggestionProvider,
} from "./ProjectBacklogSuggestionTypes";
import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { ProjectRegistryEntry } from "../project-registry/ProjectRegistryTypes";

const NOW = "2026-09-02T12:00:00.000Z";
const LATER = "2026-09-02T12:20:00.000Z";

describe("ProjectAutonomousSuggestionPolicyService", () => {
  it("defaults policy disabled and does not inherit Spec 144, 145, or 146 consent", () => {
    const service = new ProjectAutonomousSuggestionPolicyService({ now: () => NOW });
    const policies: ProjectAutonomousSuggestionPolicies = {};

    expect(service.getPolicy(policies, "project-a")).toMatchObject({
      projectId: "project-a",
      enabled: false,
      maxSuggestionsPerEvaluation: 1,
      cooldownMs: 900000,
      requireNoActiveExecution: true,
      requireNoPendingReadyTask: true,
      requireNoExistingEligibleSuggestion: true,
      updatedByOperator: false,
    });

    const result = service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      event: event("project-a", "event-1"),
      planningState: emptyPlanningState(),
    });

    expect(result.reason).toBe("PolicyDisabled");
    expect(result.providerInvoked).toBe(false);
  });

  it("persists explicit project-scoped enablement without affecting another project", () => {
    const service = new ProjectAutonomousSuggestionPolicyService({ now: () => NOW });
    const policies: ProjectAutonomousSuggestionPolicies = {};

    expect(service.updatePolicy(policies, context("project-a"), { enabled: true })).toMatchObject({
      ok: true,
      policy: { projectId: "project-a", enabled: true, updatedByOperator: true },
    });

    expect(service.getPolicy(policies, "project-a").enabled).toBe(true);
    expect(service.getPolicy(policies, "project-b").enabled).toBe(false);
  });

  it("fails closed for malformed persisted policy state", () => {
    const service = new ProjectAutonomousSuggestionPolicyService({ now: () => NOW });
    const policies = {
      "project-a": {
        projectId: "project-a",
        enabled: true,
        maxSuggestionsPerEvaluation: Number.POSITIVE_INFINITY,
      },
    } as unknown as ProjectAutonomousSuggestionPolicies;

    const result = service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      event: event("project-a", "event-1"),
      planningState: emptyPlanningState(),
    });

    expect(result.reason).toBe("PolicyDisabled");
    expect(result.policy.enabled).toBe(false);
  });

  it("fails closed for disconnected, unavailable, and mismatched projects", () => {
    const service = new ProjectAutonomousSuggestionPolicyService({ now: () => NOW });
    const policies = enabledPolicies(service, "project-a");

    expect(service.evaluate({
      policies,
      project: project("project-a", { localRepositoryBinding: undefined }),
      context: context("project-a"),
      event: event("project-a", "event-1"),
      planningState: emptyPlanningState(),
    }).reason).toBe("ProjectDisconnected");

    expect(service.evaluate({
      policies,
      project: project("project-a", { enabled: false }),
      context: context("project-a"),
      event: event("project-a", "event-2"),
      planningState: emptyPlanningState(),
    }).reason).toBe("ProjectUnavailable");

    expect(service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      event: event("project-b", "event-3"),
      planningState: emptyPlanningState(),
    }).reason).toBe("ProjectMismatch");
  });

  it("blocks active execution, Ready work, pending suggestions, and full planning capacity when configured", () => {
    const service = new ProjectAutonomousSuggestionPolicyService({ now: () => NOW });
    const policies = enabledPolicies(service, "project-a");

    expect(service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      event: event("project-a", "active"),
      planningState: {
        ...emptyPlanningState(),
        activeRunStatus: { stage: "Started" },
      } as never,
    }).reason).toBe("ActiveExecutionExists");

    expect(service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      event: event("project-a", "ready"),
      planningState: { ...emptyPlanningState(), backlogTasks: [task("ready")] },
    }).reason).toBe("ReadyWorkPending");

    expect(service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      event: event("project-a", "pending"),
      planningState: { ...emptyPlanningState(), suggestions: [suggestion()] },
    }).reason).toBe("PendingSuggestionExists");

    service.updatePolicy(policies, context("project-a"), {
      requireNoPendingReadyTask: false,
      requireNoExistingEligibleSuggestion: false,
      maxUnresolvedPlanningItems: 1,
      minimumPlanningCapacity: 1,
    });
    expect(service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      event: event("project-a", "capacity"),
      planningState: { ...emptyPlanningState(), backlogTasks: [task("backlog")] },
    }).reason).toBe("PlanningCapacityReached");
  });

  it("prevents duplicate events and project-scoped cooldown repeats", () => {
    let currentNow = NOW;
    const service = new ProjectAutonomousSuggestionPolicyService({ now: () => currentNow });
    const policies = enabledPolicies(service, "project-a");
    enabledPolicies(service, "project-b", policies);

    const first = service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      event: event("project-a", "event-1"),
      planningState: emptyPlanningState(),
    });
    service.recordEvaluation(policies, service.createGeneratedResult(first, [suggestion("project-a", "s1")]));

    expect(service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      event: event("project-a", "event-1"),
      planningState: emptyPlanningState(),
    }).reason).toBe("DuplicateEvent");

    expect(service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      event: event("project-a", "event-2"),
      planningState: emptyPlanningState(),
    }).reason).toBe("CooldownActive");

    expect(service.evaluate({
      policies,
      project: project("project-b"),
      context: context("project-b"),
      event: event("project-b", "event-1"),
      planningState: emptyPlanningState(),
    }).reason).toBe("Generated");

    currentNow = LATER;
    expect(service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      event: event("project-a", "event-3"),
      planningState: emptyPlanningState(),
    }).reason).toBe("Generated");
  });

  it("normalizes unsafe bounded values on explicit operator update", () => {
    const service = new ProjectAutonomousSuggestionPolicyService({ now: () => NOW });
    const policies: ProjectAutonomousSuggestionPolicies = {};
    service.updatePolicy(policies, context("project-a"), {
      enabled: true,
      maxSuggestionsPerEvaluation: 100,
      cooldownMs: -1,
      maxUnresolvedPlanningItems: 100,
      minimumPlanningCapacity: 100,
    });

    expect(policies["project-a"]).toMatchObject({
      maxSuggestionsPerEvaluation: 5,
      cooldownMs: 900000,
      maxUnresolvedPlanningItems: 25,
      minimumPlanningCapacity: 25,
    });
  });
});

describe("ProjectAutonomousSuggestionCoordinator", () => {
  it("reuses Spec 143 generation once, bounds output, and keeps suggestions untrusted", async () => {
    const service = new ProjectAutonomousSuggestionPolicyService({ now: () => NOW });
    const coordinator = new ProjectAutonomousSuggestionCoordinator({ policyService: service });
    const policies = enabledPolicies(service, "project-a");
    service.updatePolicy(policies, context("project-a"), { maxSuggestionsPerEvaluation: 1 });
    const suggestionCollections: ProjectBacklogSuggestionCollections = {};
    const backlogCollections: ProjectBacklogCollections = {};
    const provider: ProjectBacklogSuggestionProvider = {
      generateSuggestions: vi.fn(() => [
        { title: "First plan", description: "Create the first planning suggestion.", priority: "normal" },
        { title: "Second plan", description: "Create the second planning suggestion.", priority: "normal" },
      ]),
    };

    const result = await coordinator.evaluateAndGenerate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      event: event("project-a", "event-1"),
      planningState: emptyPlanningState(),
      suggestionCollections,
      backlogCollections,
      suggestionService: new ProjectBacklogSuggestionService({ now: () => NOW }),
      provider,
    });

    expect(provider.generateSuggestions).toHaveBeenCalledTimes(1);
    expect(provider.generateSuggestions).toHaveBeenCalledWith(expect.any(Object), 1);
    expect(result.generated).toHaveLength(1);
    expect(result.generated[0]).toMatchObject({ projectId: "project-a", status: "proposed" });
    expect(suggestionCollections["project-a"].candidates).toHaveLength(1);
    expect(backlogCollections["project-a"]).toBeUndefined();
  });

  it("does not invoke the provider for duplicate reload/event evaluation or safety skips", async () => {
    const service = new ProjectAutonomousSuggestionPolicyService({ now: () => NOW });
    const coordinator = new ProjectAutonomousSuggestionCoordinator({ policyService: service });
    const policies = enabledPolicies(service, "project-a");
    const provider: ProjectBacklogSuggestionProvider = {
      generateSuggestions: vi.fn(() => [
        { title: "First plan", description: "Create the first planning suggestion.", priority: "normal" },
      ]),
    };
    const common = {
      policies,
      project: project("project-a"),
      context: context("project-a"),
      suggestionCollections: {} as ProjectBacklogSuggestionCollections,
      backlogCollections: {} as ProjectBacklogCollections,
      suggestionService: new ProjectBacklogSuggestionService({ now: () => NOW }),
      provider,
    };

    await coordinator.evaluateAndGenerate({
      ...common,
      event: event("project-a", "event-1"),
      planningState: emptyPlanningState(),
    });
    const duplicate = await coordinator.evaluateAndGenerate({
      ...common,
      event: event("project-a", "event-1"),
      planningState: emptyPlanningState(),
    });
    const pending = await coordinator.evaluateAndGenerate({
      ...common,
      event: event("project-a", "event-2"),
      planningState: { ...emptyPlanningState(), suggestions: [suggestion()] },
    });

    expect(provider.generateSuggestions).toHaveBeenCalledTimes(1);
    expect(duplicate.reason).toBe("DuplicateEvent");
    expect(pending.reason).toBe("CooldownActive");
  });

  it("records provider failure without recursive retry or downstream side effects", async () => {
    const service = new ProjectAutonomousSuggestionPolicyService({ now: () => LATER });
    const coordinator = new ProjectAutonomousSuggestionCoordinator({ policyService: service });
    const policies = enabledPolicies(service, "project-a");
    const provider: ProjectBacklogSuggestionProvider = {
      generateSuggestions: vi.fn(() => {
        throw new Error("provider unavailable");
      }),
    };

    const result = await coordinator.evaluateAndGenerate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      event: event("project-a", "failure"),
      planningState: emptyPlanningState(),
      suggestionCollections: {},
      backlogCollections: {},
      suggestionService: new ProjectBacklogSuggestionService({ now: () => LATER }),
      provider,
    });

    expect(result.reason).toBe("GenerationUnavailable");
    expect(result.providerInvoked).toBe(true);
    expect(provider.generateSuggestions).toHaveBeenCalledTimes(1);
    expect(policies["project-a"].lastEvaluation?.latestResultText).toBe("Failed: suggestion generation unavailable");
  });
});

function enabledPolicies(
  service: ProjectAutonomousSuggestionPolicyService,
  projectId: string,
  policies: ProjectAutonomousSuggestionPolicies = {},
) {
  service.updatePolicy(policies, context(projectId), { enabled: true });
  return policies;
}

function emptyPlanningState() {
  return {
    backlogTasks: [],
    suggestions: [],
    developmentDrafts: {},
    activeExecutions: [],
  };
}

function event(projectId: string, eventId: string) {
  return {
    projectId,
    eventId,
    eventType: "explicit-evaluation" as const,
    occurredAt: NOW,
  };
}

function task(status: ProjectBacklogTask["status"], projectId = "project-a", overrides: Partial<ProjectBacklogTask> = {}): ProjectBacklogTask {
  return {
    id: `${projectId}:task:${status}`,
    projectId,
    title: `${status} work`,
    description: "Plan a bounded piece of work.",
    status,
    priority: "normal",
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function suggestion(projectId = "project-a", id = `${projectId}:suggestion:1`): ProjectBacklogSuggestionCandidate {
  return {
    id,
    projectId,
    title: "Suggested work",
    description: "Review an untrusted planning suggestion.",
    suggestedPriority: "normal",
    sourceContextSummary: "Project context",
    generatedAt: NOW,
    updatedAt: NOW,
    status: "proposed",
  };
}

function project(projectId: string, overrides: Partial<ProjectPortalProject> = {}): ProjectPortalProject {
  return {
    id: projectId,
    name: projectId,
    status: "Active",
    type: "Company",
    enabled: true,
    description: "Registered project",
    linkedServices: [],
    nextAction: { label: "Open", enabled: true, placeholder: true },
    localRepositoryBinding: {
      projectId,
      repositoryPath: "C:/repo",
      worktreePath: "C:/worktree",
    },
    repositoryIdentity: {
      provider: "local",
      connectionState: "Configured",
    },
    ...overrides,
  };
}

function context(projectId: string): ProjectBacklogProjectContext {
  return {
    projectId,
    bindingId: projectId,
    buildingId: projectId,
    fallbackCompanyName: projectId,
    projects: [registryEntry("project-a"), registryEntry("project-b")],
  };
}

function registryEntry(projectId: string): ProjectRegistryEntry {
  return {
    id: projectId,
    displayName: projectId,
    shortDescription: "Registered project",
    lifecycleStatus: "Active",
    projectType: "Company",
    localRepository: { connected: true, label: "Connected" },
    localRepositoryBinding: {
      projectId,
      repositoryPath: "C:/repo",
      worktreePath: "C:/worktree",
    },
    repositoryIdentity: {
      provider: "local",
      connectionState: "Configured",
    },
    owner: { companyName: projectId },
    createdAt: NOW,
    lastActivityAt: NOW,
  };
}
