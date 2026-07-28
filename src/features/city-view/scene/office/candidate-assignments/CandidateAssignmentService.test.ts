import { describe, expect, it } from "vitest";
import type { CandidateTask, CandidateTaskCollection } from "../candidate-tasks/CandidateTaskTypes";
import type { Employee } from "../employees/EmployeeTypes";
import { CandidateAssignmentService } from "./CandidateAssignmentService";

describe("CandidateAssignmentService", () => {
  it("returns one recommendation per candidate task", () => {
    const result = new CandidateAssignmentService().recommendAssignments(collection([task("Bug"), task("Feature", "candidate-2")]), [
      employee({ id: "dev", capabilities: ["Coding"] }),
    ]);

    expect(result.recommendationStatus).toBe("Succeeded");
    expect(result.recommendationCount).toBe(2);
  });

  it("returns a successful empty recommendation collection for empty candidate tasks", () => {
    const result = new CandidateAssignmentService().recommendAssignments(collection([]), [employee()]);

    expect(result.recommendationStatus).toBe("Succeeded");
    expect(result.recommendations).toEqual([]);
    expect(result.recommendationCount).toBe(0);
  });

  it("keeps unavailable candidate task state unavailable", () => {
    const result = new CandidateAssignmentService().recommendAssignments({
      ...collection([]),
      syncStatus: "Failed",
      errorSummary: "Candidate mapping failed.",
    }, [employee()]);

    expect(result.recommendationStatus).toBe("Failed");
    expect(result.recommendations).toEqual([]);
    expect(result.errorSummary).toBe("Candidate mapping failed.");
  });
});

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

function task(taskType: CandidateTask["estimatedTaskType"], id = `candidate-${taskType}`): CandidateTask {
  return {
    id,
    originatingIssueId: `issue-${id}`,
    issueNumber: 1,
    projectId: "daily-proof",
    title: `${taskType} task`,
    summary: `${taskType} task`,
    labels: [],
    assignees: [],
    state: "Open",
    estimatedPriority: "Normal",
    estimatedTaskType: taskType,
    sourceProvider: "github",
    issueCreatedAt: "2026-07-01T00:00:00.000Z",
    issueUpdatedAt: "2026-07-02T00:00:00.000Z",
    mappedAt: "2026-07-27T00:00:00.000Z",
    syncedAt: "2026-07-27T00:00:00.000Z",
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
