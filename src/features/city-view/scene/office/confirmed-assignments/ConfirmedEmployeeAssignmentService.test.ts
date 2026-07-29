import { describe, expect, it } from "vitest";

import type { CandidateAssignmentRecommendationCollection } from "../candidate-assignments/CandidateAssignmentTypes";
import type { Employee } from "../employees/EmployeeTypes";
import type { ProjectTask, TaskCollection } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";
import { createConfirmedEmployeeAssignmentRecordId } from "./ConfirmedEmployeeAssignmentTypes";
import { ConfirmedEmployeeAssignmentService, parsePromotedProjectTaskProvenance } from "./ConfirmedEmployeeAssignmentService";

describe("ConfirmedEmployeeAssignmentService", () => {
  it("assigns an available recommended employee to an unassigned Todo promoted ProjectTask", () => {
    const service = new ConfirmedEmployeeAssignmentService();
    const input = createInput();

    const outcome = service.confirm(input);

    expect(outcome.result).toMatchObject({
      status: "Assigned",
      reasonCodes: ["ASSIGNED"],
      assignedTask: true,
      humanConfirmed: true,
      workStarted: false,
      workSessionCreated: false,
      executionStarted: false,
      duplicateExistingAssignment: false,
    });
    expect(outcome.assignmentRecord).toMatchObject({
      id: createConfirmedEmployeeAssignmentRecordId("daily-proof", "task-12", "gpt-engineer"),
      projectTaskId: "task-12",
      employeeId: "gpt-engineer",
      employeeDisplayName: "GPT Engineer",
      humanConfirmed: true,
      workStarted: false,
      workSessionCreated: false,
      executionStarted: false,
    });
    expect(outcome.result.employeeDisplayName).toBe("GPT Engineer");
    expect(outcome.taskCollection?.tasks[0]).toMatchObject({
      id: "task-12",
      status: "Todo",
      assigneeId: "gpt-engineer",
      assignee: "GPT Engineer",
    });
    expect(outcome.taskCollection?.tasks[0]?.description).toBe(input.taskCollection.tasks[0]?.description);
    expect(outcome.taskCollection?.tasks[0]?.activityLog?.[0]).toMatchObject({
      type: "employee_assigned",
      message: "Assignment confirmed for GPT Engineer. Not started. No work session.",
    });
  });

  it("returns AlreadyAssigned without duplicating records or activity for a repeated confirmation", () => {
    const service = new ConfirmedEmployeeAssignmentService();
    const first = service.confirm(createInput());
    const second = service.confirm(createInput({
      taskCollection: first.taskCollection,
      existingAssignments: {
        [first.assignmentRecord!.id]: first.assignmentRecord!,
      },
    }));

    expect(second.result).toMatchObject({
      status: "AlreadyAssigned",
      reasonCodes: ["ALREADY_ASSIGNED"],
      duplicateExistingAssignment: true,
      workStarted: false,
    });
    expect(second.assignmentRecord?.id).toBe(first.assignmentRecord?.id);
    expect(second.taskCollection?.tasks[0]?.activityLog?.filter((activity) => activity.type === "employee_assigned")).toHaveLength(1);
  });

  it("blocks started, completed, already assigned, and malformed-provenance tasks", () => {
    expect(confirmWithTask({ status: "In Progress" }).result.reasonCodes).toEqual(["TASK_ALREADY_STARTED"]);
    expect(confirmWithTask({ status: "Review" }).result.reasonCodes).toEqual(["TASK_ALREADY_STARTED"]);
    expect(confirmWithTask({ status: "Done" }).result.reasonCodes).toEqual(["TASK_COMPLETED"]);
    expect(confirmWithTask({ assigneeId: "other", assignee: "Other" }).result.reasonCodes).toEqual(["TASK_ALREADY_ASSIGNED"]);
    expect(confirmWithTask({ description: "No promotion marker" }).result.reasonCodes).toEqual(["MALFORMED_PROVENANCE"]);
  });

  it("blocks missing and stale recommendations or non-recommended statuses", () => {
    expect(new ConfirmedEmployeeAssignmentService().confirm(createInput({ assignments: undefined })).result.reasonCodes).toEqual([
      "RECOMMENDATION_MISSING",
    ]);
    expect(new ConfirmedEmployeeAssignmentService().confirm(createInput({
      assignments: createAssignments({ assignmentStatus: "NeedsReview" }),
    })).result.reasonCodes).toEqual(["RECOMMENDATION_NOT_RECOMMENDED"]);
    expect(new ConfirmedEmployeeAssignmentService().confirm(createInput({
      assignments: createAssignments({ candidateTaskId: "other-candidate" }),
    })).result.reasonCodes).toEqual(["RECOMMENDATION_STALE"]);
  });

  it("blocks missing, offline, working, and conflicting employees", () => {
    expect(new ConfirmedEmployeeAssignmentService().confirm(createInput({ employees: [] })).result.reasonCodes).toEqual(["EMPLOYEE_MISSING"]);
    expect(new ConfirmedEmployeeAssignmentService().confirm(createInput({
      employees: [createEmployee({ status: "Offline" })],
    })).result.reasonCodes).toEqual(["EMPLOYEE_UNAVAILABLE"]);
    expect(new ConfirmedEmployeeAssignmentService().confirm(createInput({
      employees: [createEmployee({ status: "Working" })],
    })).result.reasonCodes).toEqual(["EMPLOYEE_CONFLICT"]);
    expect(new ConfirmedEmployeeAssignmentService().confirm(createInput({
      employees: [createEmployee({ assignedTaskId: "other-task" })],
    })).result.reasonCodes).toEqual(["EMPLOYEE_CONFLICT"]);
  });

  it("blocks employees with active assigned tasks or running work sessions", () => {
    const conflictingTask: ProjectTask = {
      ...createTask(),
      id: "other-task",
      assigneeId: "gpt-engineer",
      assignee: "GPT Engineer",
    };
    expect(new ConfirmedEmployeeAssignmentService().confirm(createInput({
      taskCollection: {
        projectId: "daily-proof",
        tasks: [createTask(), conflictingTask],
      },
    })).result.reasonCodes).toEqual(["EMPLOYEE_CONFLICT"]);

    const runningSession: WorkSession = {
      id: "session-1",
      taskId: "other-task",
      projectId: "daily-proof",
      employeeId: "gpt-engineer",
      employeeName: "GPT Engineer",
      provider: "placeholder",
      status: "running",
      startedAt: "2026-01-01T00:00:00.000Z",
    };
    expect(new ConfirmedEmployeeAssignmentService().confirm(createInput({
      workSessions: { "other-task": [runningSession] },
    })).result.reasonCodes).toEqual(["EMPLOYEE_CONFLICT"]);
  });

  it("does not treat another employee with the same display name as a conflict", () => {
    const sameNameTask: ProjectTask = {
      ...createTask(),
      id: "other-task",
      assigneeId: "other-engineer",
      assignee: "GPT Engineer",
    };
    const outcome = new ConfirmedEmployeeAssignmentService().confirm(createInput({
      taskCollection: {
        projectId: "daily-proof",
        tasks: [createTask(), sameNameTask],
      },
    }));

    expect(outcome.result.status).toBe("Assigned");
    expect(outcome.taskCollection?.tasks[0]?.assigneeId).toBe("gpt-engineer");
  });

  it("blocks stale project task collections and assignment collections", () => {
    expect(new ConfirmedEmployeeAssignmentService().confirm(createInput({
      taskCollection: {
        projectId: "other-project",
        tasks: [createTask({ projectId: "other-project" })],
      },
    })).result.reasonCodes).toEqual(["PROJECT_MISMATCH"]);

    expect(new ConfirmedEmployeeAssignmentService().confirm(createInput({
      assignments: {
        ...createAssignments(),
        projectId: "other-project",
      },
    })).result.reasonCodes).toEqual(["PROJECT_MISMATCH"]);
  });

  it("keeps input tasks, employees, and work sessions immutable", () => {
    const input = createInput();
    const beforeTask = structuredClone(input.taskCollection);
    const beforeEmployee = structuredClone(input.employees);
    const beforeSessions = structuredClone(input.workSessions);

    const outcome = new ConfirmedEmployeeAssignmentService().confirm(input);

    expect(input.taskCollection).toEqual(beforeTask);
    expect(input.employees).toEqual(beforeEmployee);
    expect(input.workSessions).toEqual(beforeSessions);
    outcome.assignmentRecord!.reasonCodes.push("PROJECT_MISMATCH");
    outcome.taskCollection!.tasks[0]!.activityLog!.push({
      id: "external",
      taskId: "task-12",
      type: "note_added",
      message: "external",
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    const reread = new ConfirmedEmployeeAssignmentService().confirm(input);
    expect(reread.assignmentRecord!.reasonCodes).toEqual(["ASSIGNED"]);
    expect(reread.taskCollection!.tasks[0]!.activityLog).toHaveLength(2);
  });

  it("parses deterministic promoted ProjectTask provenance", () => {
    expect(parsePromotedProjectTaskProvenance(createTask().description)).toEqual({
      projectId: "daily-proof",
      candidateTaskId: "candidate-12",
      promotionDecisionId: "promotion-12",
      assignmentRecommendationId: "assignment-12",
    });
  });
});

function confirmWithTask(overrides: Partial<ProjectTask>) {
  return new ConfirmedEmployeeAssignmentService().confirm(createInput({
    taskCollection: {
      projectId: "daily-proof",
      tasks: [{ ...createTask(), ...overrides }],
    },
  }));
}

function createInput(overrides: Partial<Parameters<ConfirmedEmployeeAssignmentService["confirm"]>[0]> = {}) {
  return {
    request: {
      projectId: "daily-proof",
      projectTaskId: "task-12",
      assignmentRecommendationId: "assignment-12",
      employeeId: "gpt-engineer",
      requestedAt: "2026-01-02T00:00:00.000Z",
    },
    taskCollection: createTaskCollection(),
    assignments: createAssignments(),
    employees: [createEmployee()],
    workSessions: {},
    existingAssignments: {},
    ...overrides,
  };
}

function createTaskCollection(): TaskCollection {
  return {
    projectId: "daily-proof",
    tasks: [createTask()],
  };
}

function createTask(overrides: Partial<ProjectTask> = {}): ProjectTask {
  return {
    id: "task-12",
    title: "Fix crash on launch",
    description: [
      "Fix crash on launch",
      "Candidate Task: candidate-12",
      "Promotion Decision: promotion-12",
      "Assignment Recommendation: assignment-12",
      "[AIverse Promotion: project=daily-proof; candidateTask=candidate-12; ruleset=candidate-promotion-v1]",
    ].join("\n"),
    status: "Todo",
    priority: "High",
    projectId: "daily-proof",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    activityLog: [{
      id: "task-12:promotion-note",
      taskId: "task-12",
      type: "note_added",
      message: "Promoted from Candidate Task candidate-12. Not started. Unassigned.",
      createdAt: "2026-01-01T00:00:00.000Z",
    }],
    ...overrides,
  };
}

function createAssignments(overrides: {
  assignmentStatus?: "Recommended" | "NeedsReview" | "Unassigned" | "Unavailable";
  candidateTaskId?: string;
} = {}): CandidateAssignmentRecommendationCollection {
  const candidateTaskId = overrides.candidateTaskId ?? "candidate-12";
  return {
    projectId: "daily-proof",
    sourceCandidateTaskStatus: "Succeeded",
    recommendationStatus: "Succeeded",
    recommendations: [{
      id: "assignment-12",
      candidateTaskId,
      candidateTaskTitle: "Fix crash on launch",
      projectId: "daily-proof",
      recommendedEmployeeId: "gpt-engineer",
      recommendedEmployeeName: "GPT Engineer",
      employeeRole: "Engineer",
      assignmentStatus: overrides.assignmentStatus ?? "Recommended",
      matchTier: "Strong",
      matchedCapabilities: ["BugFixing"],
      unmatchedRequirements: [],
      warnings: [],
      taskType: "Bug",
      proposedPriority: "High",
      reasonCodes: ["CAPABILITY_MATCH"],
      generatedAt: "2026-01-01T00:00:00.000Z",
      rulesetVersion: "candidate-assignment-v1",
      provenance: {
        candidateTaskId,
        originatingIssueId: "ai-verse/daily-proof#12",
        issueNumber: 12,
      },
      alternatives: [],
    }],
    recommendationCount: 1,
    generatedAt: "2026-01-01T00:00:00.000Z",
    rulesetVersion: "candidate-assignment-v1",
    sourceCandidateTaskCount: 1,
  };
}

function createEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "gpt-engineer",
    name: "GPT Engineer",
    role: "Engineer",
    status: "Idle",
    avatarColor: "#64748b",
    capabilities: ["coding"],
    description: "Test engineer",
    ...overrides,
  };
}
