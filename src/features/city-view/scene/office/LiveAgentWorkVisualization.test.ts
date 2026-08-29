import { describe, expect, it } from "vitest";

import { deriveLiveAgentWorkState } from "./LiveAgentWorkVisualization";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";

describe("deriveLiveAgentWorkState", () => {
  it.each([
    ["implementer", "implementation", "engineering", "Implementing", { zone: "workstation", slot: 0 }],
    ["validation", "validation", "validation-qa", "Validating", { zone: "workstation", slot: 4 }],
    ["reviewer", "review", "review", "Reviewing", { zone: "review", slot: 0 }],
    ["pr", "publication", "project-status-operations", "Publishing", { zone: "meetingArea", slot: 0 }],
    ["publication_gate", "publication", "project-status-operations", "Publishing", { zone: "meetingArea", slot: 0 }],
  ] as const)("maps %s state to semantic office work", (rawStage, stage, department, statusLabel, positionHint) => {
    const state = deriveLiveAgentWorkState(portalState({
      externalProjectAdosRunStatuses: {
        alpha: status({ stage: "Started", status: rawStage }),
      },
    }));

    expect(state).toMatchObject({
      projectId: "alpha",
      stage,
      lifecycle: "active",
      stageLabel: statusLabel,
    });
    expect(state.assignments[0]).toMatchObject({
      department,
      statusLabel,
      positionHint,
    });
  });

  it("renders blocked state as a warning with preserved safe reason text", () => {
    const state = deriveLiveAgentWorkState(portalState({
      externalProjectAdosRunStatuses: {
        alpha: status({
          stage: "Blocked",
          status: "validation_recovery_implementer blocked",
          reasonCodes: ["EXTERNAL_ADOS_EXECUTION_LOCAL_BINDING_MISSING"],
        }),
      },
    }));

    expect(state.lifecycle).toBe("blocked");
    expect(state.stage).toBe("blocked");
    expect(state.reasonText).toBe("EXTERNAL ADOS EXECUTION LOCAL BINDING MISSING");
    expect(state.assignments[0]).toMatchObject({
      visualTone: "warning",
      statusLabel: "Blocked: EXTERNAL ADOS EXECUTION LOCAL BINDING MISSING",
    });
    expect(state.projectStatus.pipeline.some((item) => item.state === "blocked")).toBe(true);
  });

  it.each([
    ["reviewer", "reviewer", "review", { zone: "review", slot: 0 }],
    ["validation", "validator", "validation-qa", { zone: "workstation", slot: 4 }],
  ] as const)("keeps blocked %s work associated with its semantic department", (rawStage, role, department, positionHint) => {
    const state = deriveLiveAgentWorkState(portalState({
      externalProjectAdosRunStatuses: {
        alpha: status({
          stage: "Blocked",
          status: `${rawStage} blocked`,
          reasonCodes: ["EXTERNAL_ADOS_EXECUTION_PROVIDER_UNAVAILABLE"],
        }),
      },
    }));

    expect(state).toMatchObject({
      lifecycle: "blocked",
      stage: "blocked",
    });
    expect(state.assignments[0]).toMatchObject({
      role,
      department,
      positionHint,
      visualTone: "warning",
    });
  });

  it("does not derive whole-run complete from a completed implementer runtime result", () => {
    const state = deriveLiveAgentWorkState(portalState({
      implementerRuntimeResultCollections: {
        alpha: {
          projectId: "alpha",
          results: [{
            id: "alpha:implementer-runtime-result:runtime-1:claude-implementer-v1",
            projectId: "alpha",
            runtimeStartId: "runtime-1",
            executionPlanId: "plan-1",
            implementerRuntimeId: "implementer-runtime-1",
            status: "Completed",
            reasonCodes: [],
            started: true,
            duplicateActiveAttempt: false,
            agentStarted: true,
            implementerStarted: true,
            reviewerStarted: false,
            validationStarted: false,
            repositoryMutationStarted: false,
            githubMutationStarted: false,
            resultAt: "2026-08-29T02:00:00.000Z",
            rulesVersion: "claude-implementer-v1",
          }],
          resultCount: 1,
          generatedAt: "2026-08-29T02:00:00.000Z",
          rulesVersion: "claude-implementer-v1",
        },
      } as ProjectPortalState["implementerRuntimeResultCollections"],
    }));

    expect(state).toMatchObject({
      projectId: "alpha",
      lifecycle: "active",
      stage: "implementation",
      stageLabel: "Implementing",
    });
    expect(state.assignments[0]).toMatchObject({
      role: "implementer",
      department: "engineering",
      statusLabel: "Implementing",
      visualTone: "active",
    });
    expect(state.projectStatus.summary).toContain("Implementing");
    expect(state.projectStatus.tone).toBe("active");
    expect(state.projectStatus.pipeline.find((item) => item.id === "implementation")).toMatchObject({
      state: "current",
    });
  });

  it.each(["validation_recovery_implementer", "review_fix"] as const)(
    "maps %s recovery stages to implementation before broad validation or review matching",
    (rawStage) => {
      const state = deriveLiveAgentWorkState(portalState({
        externalProjectAdosRunStatuses: {
          alpha: status({ stage: "Started", status: rawStage }),
        },
      }));

      expect(state).toMatchObject({
        stage: "implementation",
        lifecycle: "active",
        stageLabel: "Implementing",
      });
      expect(state.assignments[0]).toMatchObject({
        role: "implementer",
        department: "engineering",
        statusLabel: "Implementing",
        positionHint: { zone: "workstation", slot: 0 },
      });
    },
  );

  it("clears stale active work for complete states", () => {
    const state = deriveLiveAgentWorkState(portalState({
      externalProjectAdosRunStatuses: {
        alpha: status({ stage: "Completed", status: "Completed implementer" }),
      },
    }));

    expect(state).toMatchObject({
      lifecycle: "complete",
      stage: "complete",
      stageLabel: "Complete",
    });
    expect(state.assignments[0]).toMatchObject({
      statusLabel: "Complete",
      visualTone: "complete",
      positionHint: { zone: "idleSpot", slot: 0 },
    });
    expect(JSON.stringify(state.assignments)).not.toContain("Implementing");
    expect(JSON.stringify(state.assignments)).not.toContain("Reviewing");
    expect(JSON.stringify(state.assignments)).not.toContain("Validating");
  });

  it("returns an idle no-active-run state when the selected project has no run state", () => {
    const state = deriveLiveAgentWorkState(portalState());

    expect(state.lifecycle).toBe("no-active-run");
    expect(state.stage).toBe("idle");
    expect(state.assignments).toEqual([]);
    expect(state.projectStatus.rows).toContain("Run No active ADOS run");
  });

  it("uses only the selected project's run state when switching projects", () => {
    const state = deriveLiveAgentWorkState(portalState({
      selectedProjectId: "beta",
      selectedProjectIndex: 1,
      externalProjectAdosRunStatuses: {
        alpha: status({ projectId: "alpha", stage: "Started", status: "reviewer" }),
        beta: status({ projectId: "beta", stage: "Started", status: "validation" }),
      },
    }));

    expect(state.projectId).toBe("beta");
    expect(state.stage).toBe("validation");
    expect(JSON.stringify(state)).not.toContain("reviewer");
  });

  it("keeps semantic role separate from provider identity", () => {
    const state = deriveLiveAgentWorkState(portalState({
      externalProjectAdosExecutions: {
        alpha: {
          projectId: "alpha",
          status: "Completed",
          implementerStarted: true,
          evidence: {
            providerId: "anthropic",
            agentId: "Claude",
            completed: false,
            timedOut: false,
            cancelled: false,
          },
          startedAt: "2026-08-29T01:00:00.000Z",
          specPath: "specs/136-live-agent-work-visualization/spec.md",
          featureBranch: "claude/136-live-agent-work-visualization",
        },
      } as unknown as ProjectPortalState["externalProjectAdosExecutions"],
    }));

    expect(state.assignments[0]).toMatchObject({
      role: "implementer",
      providerLabel: "Claude",
      department: "engineering",
    });
  });
});

function portalState(overrides: Partial<ProjectPortalState> = {}): ProjectPortalState {
  return {
    projects: [
      project("alpha", "Alpha Tools"),
      project("beta", "Beta Systems"),
    ],
    selectedProjectIndex: 0,
    selectedProjectId: "alpha",
    selectedProjectDashboardProjectId: undefined,
    externalProjectAdosRunPreparations: {},
    externalProjectAdosExecutions: {},
    externalProjectAdosExecutionResults: {},
    externalProjectAdosRunStatuses: {},
    employees: [
      employee("engineer", "Riley Engineer", "Engineer", ["Coding"]),
      employee("qa", "Quinn QA", "QA", ["Testing"]),
      employee("reviewer", "Casey Reviewer", "Reviewer", ["Review"]),
      employee("ops", "Morgan Ops", "CTO", ["Planning"]),
    ],
    implementerRuntimeCollections: {},
    implementerRuntimeResultCollections: {},
    reviewerRuntimeCollections: {},
    reviewerRuntimeResultCollections: {},
    reviewPromotionCollections: {},
    reviewPromotionResultCollections: {},
    reviewFixRuntimeCollections: {},
    reviewFixRuntimeResultCollections: {},
    validationRuntimeCollections: {},
    validationRuntimeResultCollections: {},
    postValidationReviewTargetCollections: {},
    postValidationReviewTargetResultCollections: {},
    ...overrides,
  } as ProjectPortalState;
}

function project(id: string, name: string) {
  return {
    id,
    name,
    status: "Active",
    type: "Company",
    enabled: true,
    description: "",
    linkedServices: [],
    nextAction: { label: "", enabled: true, placeholder: true },
  };
}

function employee(id: string, name: string, role: string, capabilities: string[]) {
  return {
    id,
    name,
    role,
    status: "Idle",
    avatarColor: "#2563eb",
    capabilities,
    description: "",
  };
}

function status(overrides: Partial<ProjectPortalState["externalProjectAdosRunStatuses"][string]> = {}) {
  return {
    id: "alpha:external-ados-run-status:external-ados-run-status-v1",
    projectId: "alpha",
    stage: "Started",
    status: "Started",
    source: "execution",
    reasonCodes: [],
    updatedAt: "2026-08-29T00:00:00.000Z",
    validationStarted: false,
    reviewStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    publishStarted: false,
    mergeStarted: false,
    deployStarted: false,
    rulesVersion: "external-ados-run-status-v1",
    ...overrides,
  } as ProjectPortalState["externalProjectAdosRunStatuses"][string];
}
