import { describe, expect, it } from "vitest";
import type { CandidateTask, CandidateTaskCollection, CandidateTaskType } from "../candidate-tasks/CandidateTaskTypes";
import type { Employee } from "../employees/EmployeeTypes";
import { CandidateAssignmentMatcher } from "./CandidateAssignmentMatcher";

describe("CandidateAssignmentMatcher", () => {
  it.each([
    ["Bug", "bug-dev", "BugFixing"],
    ["Feature", "feature-dev", "FeatureDevelopment"],
    ["Documentation", "docs-writer", "Documentation"],
    ["Maintenance", "maintenance-dev", "Maintenance"],
    ["Research", "research-lead", "Research"],
  ] as const)("selects a suitable employee for %s tasks", (taskType, employeeId, capability) => {
    const result = matcher().recommendAssignments(collection([task({ estimatedTaskType: taskType })]), [
      employee({ id: employeeId, capabilities: [capability] }),
    ]);

    expect(result.recommendations[0]).toMatchObject({
      assignmentStatus: "Recommended",
      recommendedEmployeeId: employeeId,
    });
    expect(result.recommendations[0]!.matchTier).not.toBe("None");
  });

  it("uses documented fallback behavior for Unknown task type", () => {
    const result = matcher().recommendAssignments(collection([task({ estimatedTaskType: "Unknown" })]), [
      employee({ id: "planner", role: "CTO", capabilities: ["Planning"] }),
    ]);

    expect(result.recommendations[0]).toMatchObject({
      assignmentStatus: "Recommended",
      recommendedEmployeeId: "planner",
      matchTier: "Weak",
    });
  });

  it("does not select unavailable employees over equally capable available employees", () => {
    const result = matcher().recommendAssignments(collection([task({ estimatedTaskType: "Bug" })]), [
      employee({ id: "offline-dev", status: "Offline", capabilities: ["BugFixing"] }),
      employee({ id: "available-dev", status: "Idle", capabilities: ["BugFixing"] }),
    ]);

    expect(result.recommendations[0]!.recommendedEmployeeId).toBe("available-dev");
  });

  it("does not let a busy employee outrank an equally capable available employee", () => {
    const result = matcher().recommendAssignments(collection([task({ estimatedTaskType: "Feature" })]), [
      employee({ id: "busy-dev", status: "Working", assignedTaskId: "active-task", capabilities: ["FeatureDevelopment"] }),
      employee({ id: "available-dev", status: "Idle", capabilities: ["FeatureDevelopment"] }),
    ]);

    expect(result.recommendations[0]!.recommendedEmployeeId).toBe("available-dev");
  });

  it("uses stable employee id tie-breaking", () => {
    const result = matcher().recommendAssignments(collection([task({ estimatedTaskType: "Maintenance" })]), [
      employee({ id: "z-dev", capabilities: ["Maintenance"] }),
      employee({ id: "a-dev", capabilities: ["Maintenance"] }),
    ]);

    expect(result.recommendations[0]!.recommendedEmployeeId).toBe("a-dev");
  });

  it("returns explicit no-match states for no employees and no matching capabilities", () => {
    const noEmployees = matcher().recommendAssignments(collection([task({ estimatedTaskType: "Bug" })]), []);
    const noMatch = matcher().recommendAssignments(collection([task({ estimatedTaskType: "Documentation" })]), [
      employee({ id: "engineer", capabilities: ["Coding"] }),
    ]);

    expect(noEmployees.recommendations[0]).toMatchObject({
      assignmentStatus: "Unavailable",
      unavailableReason: "No employees are available for assignment recommendations.",
    });
    expect(noMatch.recommendations[0]).toMatchObject({
      assignmentStatus: "Unassigned",
      unavailableReason: "No employee has the required capabilities for this candidate task.",
    });
  });

  it("preserves closed candidate tasks without recommending employees", () => {
    const result = matcher().recommendAssignments(collection([task({ state: "Closed" })]), [
      employee({ id: "available-dev", capabilities: ["BugFixing"] }),
    ]);

    expect(result.recommendations[0]).toMatchObject({
      assignmentStatus: "Unassigned",
      unavailableReason: "Closed candidate tasks are preserved but not recommended for assignment.",
    });
    expect(result.recommendations[0]).not.toHaveProperty("recommendedEmployeeId");
  });

  it("deduplicates candidate tasks and keeps deterministic identifiers", () => {
    const candidate = task({ id: "candidate-1" });
    const result = matcher().recommendAssignments(collection([candidate, { ...candidate, title: "Duplicate" }]), [
      employee({ id: "available-dev", capabilities: ["BugFixing"] }),
    ]);
    const repeat = matcher().recommendAssignments(collection([candidate]), [
      employee({ id: "available-dev", capabilities: ["BugFixing"] }),
    ]);

    expect(result.recommendationCount).toBe(1);
    expect(result.recommendations[0]!.id).toBe(repeat.recommendations[0]!.id);
  });

  it("does not fabricate success for unavailable candidate task collections", () => {
    const result = matcher().recommendAssignments({
      ...collection([]),
      syncStatus: "Unavailable",
      errorSummary: "Candidate tasks unavailable.",
    }, [employee()]);

    expect(result.recommendationStatus).toBe("Unavailable");
    expect(result.recommendations).toEqual([]);
    expect(result.errorSummary).toBe("Candidate tasks unavailable.");
  });

  it("defensively copies returned recommendation arrays", () => {
    const result = matcher().recommendAssignments(collection([task()]), [employee({ capabilities: ["BugFixing"] })]);
    result.recommendations[0]!.matchedCapabilities.push("Research");
    const repeat = matcher().recommendAssignments(collection([task()]), [employee({ capabilities: ["BugFixing"] })]);

    expect(repeat.recommendations[0]!.matchedCapabilities).not.toContain("Research");
  });
});

function matcher() {
  return new CandidateAssignmentMatcher();
}

function collection(tasks: CandidateTask[]): CandidateTaskCollection {
  return {
    projectId: "daily-proof",
    sourceProvider: "github",
    syncStatus: "Succeeded",
    tasks,
    taskCount: tasks.length,
    mappedAt: "2026-07-27T00:00:00.000Z",
    sourceIssueCount: tasks.length,
    sourceIssueSyncStatus: "Succeeded",
    sourceIssueSyncedAt: "2026-07-27T00:00:00.000Z",
  };
}

function task(overrides: Partial<CandidateTask> = {}): CandidateTask {
  return {
    id: "candidate-1",
    originatingIssueId: "issue-1",
    issueNumber: 1,
    projectId: "daily-proof",
    title: "Fix a bug",
    summary: "Fix a bug",
    labels: ["bug"],
    assignees: [],
    state: "Open",
    estimatedPriority: "High",
    estimatedTaskType: "Bug" as CandidateTaskType,
    sourceProvider: "github",
    issueCreatedAt: "2026-07-01T00:00:00.000Z",
    issueUpdatedAt: "2026-07-02T00:00:00.000Z",
    mappedAt: "2026-07-27T00:00:00.000Z",
    syncedAt: "2026-07-27T00:00:00.000Z",
    ...overrides,
  };
}

function employee(overrides: Partial<Employee> = {}): Employee {
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
