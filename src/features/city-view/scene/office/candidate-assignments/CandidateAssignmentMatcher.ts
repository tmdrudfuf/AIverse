import type { CandidateTask, CandidateTaskCollection, CandidateTaskType } from "../candidate-tasks/CandidateTaskTypes";
import {
  CANDIDATE_ASSIGNMENT_RULESET_VERSION,
  createCandidateAssignmentCollection,
  createRecommendationId,
  type CandidateAssignmentAlternative,
  type CandidateAssignmentMatchTier,
  type CandidateAssignmentReasonCode,
  type CandidateAssignmentRecommendation,
  type CandidateAssignmentRecommendationCollection,
  type EmployeeCapability,
} from "./CandidateAssignmentTypes";
import { createEmployeeCapabilityProfiles, type EmployeeCapabilityProfile } from "./EmployeeCapabilityProfile";
import type { Employee } from "../employees/EmployeeTypes";

const TASK_REQUIREMENTS: Record<CandidateTaskType, EmployeeCapability[]> = {
  Bug: ["BugFixing", "SoftwareDevelopment"],
  Feature: ["FeatureDevelopment", "SoftwareDevelopment"],
  Documentation: ["Documentation"],
  Maintenance: ["Maintenance", "SoftwareDevelopment"],
  Research: ["Research", "ProjectPlanning"],
  Unknown: ["SoftwareDevelopment", "ProjectPlanning"],
};

export class CandidateAssignmentMatcher {
  recommendAssignments(
    candidateTasks: CandidateTaskCollection,
    employees: ReadonlyArray<Employee>,
  ): CandidateAssignmentRecommendationCollection {
    if (candidateTasks.syncStatus !== "Succeeded") {
      return createCandidateAssignmentCollection({
        projectId: candidateTasks.projectId,
        sourceCandidateTaskStatus: candidateTasks.syncStatus,
        recommendationStatus: candidateTasks.syncStatus,
        recommendations: [],
        rulesetVersion: CANDIDATE_ASSIGNMENT_RULESET_VERSION,
        sourceCandidateTaskCount: candidateTasks.taskCount,
        errorSummary: candidateTasks.errorSummary ?? "Candidate tasks are unavailable for assignment recommendations.",
      });
    }

    const profiles = createEmployeeCapabilityProfiles(employees);
    const uniqueTasks = uniqueCandidateTasks(candidateTasks.tasks);
    const generatedAt = candidateTasks.mappedAt ?? new Date(0).toISOString();
    const recommendations = uniqueTasks.map((task) => this.recommendTask(task, profiles, generatedAt));

    return createCandidateAssignmentCollection({
      projectId: candidateTasks.projectId,
      sourceCandidateTaskStatus: candidateTasks.syncStatus,
      recommendationStatus: "Succeeded",
      recommendations,
      generatedAt,
      rulesetVersion: CANDIDATE_ASSIGNMENT_RULESET_VERSION,
      sourceCandidateTaskCount: uniqueTasks.length,
    });
  }

  private recommendTask(
    task: CandidateTask,
    profiles: ReadonlyArray<EmployeeCapabilityProfile>,
    generatedAt: string,
  ): CandidateAssignmentRecommendation {
    if (task.state === "Closed") {
      return this.createNoEmployeeRecommendation(
        task,
        generatedAt,
        "Unassigned",
        "Closed candidate tasks are preserved but not recommended for assignment.",
        ["CLOSED_CANDIDATE_TASK"],
      );
    }

    if (profiles.length === 0) {
      return this.createNoEmployeeRecommendation(
        task,
        generatedAt,
        "Unavailable",
        "No employees are available for assignment recommendations.",
        ["NO_EMPLOYEES"],
      );
    }

    const ranked = profiles
      .map((profile) => scoreProfileForTask(profile, task))
      .sort(compareScoredProfiles);
    const best = ranked[0];

    if (!best || best.tier === "None") {
      return this.createNoEmployeeRecommendation(
        task,
        generatedAt,
        task.estimatedTaskType === "Unknown" ? "NeedsReview" : "Unassigned",
        task.estimatedTaskType === "Unknown"
          ? "Unknown candidate task type needs human review."
          : "No employee has the required capabilities for this candidate task.",
        [task.estimatedTaskType === "Unknown" ? "UNKNOWN_TASK_TYPE" : "NO_MATCHING_CAPABILITY"],
        TASK_REQUIREMENTS[task.estimatedTaskType],
      );
    }

    const profile = best.profile;
    return {
      id: createRecommendationId(task, profile.employeeId, "recommended"),
      candidateTaskId: task.id,
      candidateTaskTitle: task.title,
      projectId: task.projectId,
      recommendedEmployeeId: profile.employeeId,
      recommendedEmployeeName: profile.employeeName,
      employeeRole: profile.role,
      assignmentStatus: profile.availabilityRank <= 1 ? "Recommended" : "NeedsReview",
      matchTier: best.tier,
      matchedCapabilities: best.matchedCapabilities,
      unmatchedRequirements: getUnmatchedRequirements(task, best.matchedCapabilities),
      warnings: createWarnings(profile),
      taskType: task.estimatedTaskType,
      proposedPriority: task.estimatedPriority,
      reasonCodes: createReasonCodes(profile, best.tier),
      generatedAt,
      rulesetVersion: CANDIDATE_ASSIGNMENT_RULESET_VERSION,
      provenance: {
        candidateTaskId: task.id,
        originatingIssueId: task.originatingIssueId,
        issueNumber: task.issueNumber,
      },
      alternatives: ranked
        .slice(1)
        .filter((entry) => entry.tier !== "None")
        .slice(0, 2)
        .map(toAlternative),
    };
  }

  private createNoEmployeeRecommendation(
    task: CandidateTask,
    generatedAt: string,
    assignmentStatus: CandidateAssignmentRecommendation["assignmentStatus"],
    unavailableReason: string,
    reasonCodes: CandidateAssignmentReasonCode[],
    unmatchedRequirements: EmployeeCapability[] = TASK_REQUIREMENTS[task.estimatedTaskType],
  ): CandidateAssignmentRecommendation {
    return {
      id: createRecommendationId(task, undefined, reasonCodes[0] ?? "unavailable"),
      candidateTaskId: task.id,
      candidateTaskTitle: task.title,
      projectId: task.projectId,
      assignmentStatus,
      matchTier: "None",
      matchedCapabilities: [],
      unmatchedRequirements: [...unmatchedRequirements],
      warnings: [unavailableReason],
      taskType: task.estimatedTaskType,
      proposedPriority: task.estimatedPriority,
      reasonCodes,
      generatedAt,
      rulesetVersion: CANDIDATE_ASSIGNMENT_RULESET_VERSION,
      provenance: {
        candidateTaskId: task.id,
        originatingIssueId: task.originatingIssueId,
        issueNumber: task.issueNumber,
      },
      alternatives: [],
      unavailableReason,
    };
  }
}

type ScoredProfile = {
  profile: EmployeeCapabilityProfile;
  tier: CandidateAssignmentMatchTier;
  matchedCapabilities: EmployeeCapability[];
};

function scoreProfileForTask(profile: EmployeeCapabilityProfile, task: CandidateTask): ScoredProfile {
  const requirements = TASK_REQUIREMENTS[task.estimatedTaskType];
  const matchedCapabilities = requirements.filter((capability) => profile.capabilities.includes(capability));
  return {
    profile,
    tier: getMatchTier(task.estimatedTaskType, matchedCapabilities),
    matchedCapabilities,
  };
}

function getMatchTier(taskType: CandidateTaskType, matchedCapabilities: ReadonlyArray<EmployeeCapability>): CandidateAssignmentMatchTier {
  if (matchedCapabilities.length === 0) return "None";
  if (taskType === "Unknown") return "Weak";
  if (matchedCapabilities.length >= 2) return "Strong";
  return "Moderate";
}

function compareScoredProfiles(left: ScoredProfile, right: ScoredProfile) {
  return getTierRank(right.tier) - getTierRank(left.tier)
    || left.profile.availabilityRank - right.profile.availabilityRank
    || left.profile.activeWorkload - right.profile.activeWorkload
    || left.profile.employeeId.localeCompare(right.profile.employeeId);
}

function getTierRank(tier: CandidateAssignmentMatchTier) {
  if (tier === "Strong") return 3;
  if (tier === "Moderate") return 2;
  if (tier === "Weak") return 1;
  return 0;
}

function getUnmatchedRequirements(task: CandidateTask, matchedCapabilities: ReadonlyArray<EmployeeCapability>) {
  return TASK_REQUIREMENTS[task.estimatedTaskType].filter((capability) => !matchedCapabilities.includes(capability));
}

function createWarnings(profile: EmployeeCapabilityProfile): string[] {
  if (profile.availabilityRank === 1) return ["Employee is already working; recommendation remains a proposal only."];
  if (profile.availabilityRank >= 2) return ["Employee is unavailable; human review is required."];
  return [];
}

function createReasonCodes(profile: EmployeeCapabilityProfile, tier: CandidateAssignmentMatchTier): CandidateAssignmentReasonCode[] {
  return [
    tier === "Strong" ? "CAPABILITY_MATCH" : "ROLE_MATCH",
    profile.availabilityRank === 0 ? "AVAILABLE_EMPLOYEE" : profile.availabilityRank === 1 ? "BUSY_EMPLOYEE" : "OFFLINE_EMPLOYEE",
  ];
}

function toAlternative(entry: ScoredProfile): CandidateAssignmentAlternative {
  return {
    employeeId: entry.profile.employeeId,
    employeeName: entry.profile.employeeName,
    employeeRole: entry.profile.role,
    matchTier: entry.tier,
    matchedCapabilities: [...entry.matchedCapabilities],
    reasonCodes: createReasonCodes(entry.profile, entry.tier),
  };
}

function uniqueCandidateTasks(tasks: ReadonlyArray<CandidateTask>): CandidateTask[] {
  const seen = new Set<string>();
  const unique: CandidateTask[] = [];
  for (const task of tasks) {
    if (seen.has(task.id)) continue;
    seen.add(task.id);
    unique.push({
      ...task,
      labels: [...task.labels],
      assignees: [...task.assignees],
    });
  }
  return unique;
}
